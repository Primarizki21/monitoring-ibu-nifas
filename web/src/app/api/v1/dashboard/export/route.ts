import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { galat } from "@/lib/http";
import { ambilSemuaPasien, filterBawaan, KATEGORI, tanggalWIB, type Kategori } from "@/lib/data/dashboard";
import { filterTanggalSchema, TANGGAL, UUID } from "@/lib/validasi";

function parameter(q: URLSearchParams, kunci: string, pola: RegExp) {
  const nilai = q.get(kunci);
  if (!nilai) return undefined;
  return pola.test(nilai) ? nilai : null;
}

function selCsv(nilai: unknown) {
  const teks = nilai == null ? "" : String(nilai);
  return /[",\r\n]/.test(teks) ? `"${teks.replaceAll('"', '""')}"` : teks;
}

// PRD 8.1 #10: ekspor seluruh data yang cocok dengan filter, bukan hanya satu halaman.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : undefined;
  if (auth && !bearer) return galat(401, "unauthorized", "Header Authorization tidak valid.");

  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = env();
  const db = bearer
    ? createSupabaseClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${bearer}` } },
        auth: { persistSession: false },
      })
    : await createClient();

  const { data: user } = await db.auth.getUser(bearer);
  if (!user.user) return galat(401, "unauthorized", "Sesi tidak valid. Silakan masuk kembali.");

  const q = req.nextUrl.searchParams;
  const bawaan = filterBawaan();
  const puskesmas_id = parameter(q, "puskesmas_id", UUID);
  const kelurahan_id = parameter(q, "kelurahan_id", UUID);
  if (puskesmas_id === null || kelurahan_id === null) {
    return galat(422, "validation_error", "Filter faskes tidak valid.");
  }

  const filter = {
    mulai: parameter(q, "start_date", TANGGAL) ?? bawaan.mulai,
    selesai: parameter(q, "end_date", TANGGAL) ?? bawaan.selesai,
    puskesmas_id: puskesmas_id ?? undefined,
    kelurahan_id: kelurahan_id ?? undefined,
  };
  const cek = filterTanggalSchema.safeParse(filter);
  if (!cek.success) {
    return galat(422, "validation_error", "Filter tanggal tidak valid.", {
      errors: z.flattenError(cek.error).fieldErrors,
    });
  }

  const kategori = q.get("kategori") || undefined;
  if (kategori && !Object.prototype.hasOwnProperty.call(KATEGORI, kategori)) {
    return galat(422, "validation_error", "Kategori data tidak valid.");
  }

  let rows;
  try {
    rows = await ambilSemuaPasien(db, filter, kategori as Kategori | undefined);
  } catch (error) {
    console.error("ekspor data", error);
    return galat(500, "internal_error", "Gagal menyiapkan ekspor data.");
  }

  const header = ["No", "Nama Ibu", "Alamat", "No. WhatsApp", "Tanggal Pulang RS", "Status Kesehatan", "Status Kunjungan"];
  const isi = rows.map((p, i) =>
    [i + 1, p.nama_ibu, p.alamat_lengkap, p.no_whatsapp_ibu, tanggalWIB(p.waktu_krs), p.status_kesehatan, p.status_kunjungan]
      .map(selCsv)
      .join(","),
  );
  const csv = `\uFEFF${[header.map(selCsv).join(","), ...isi].join("\r\n")}\r\n`;

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="sim-nifas-${filter.mulai}-${filter.selesai}.csv"`,
      "cache-control": "private, no-store",
    },
  });
}
