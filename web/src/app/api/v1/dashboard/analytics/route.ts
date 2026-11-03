import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { galat } from "@/lib/http";
import { ambilAnalitik, filterBawaan } from "@/lib/data/dashboard";
import { filterTanggalSchema, TANGGAL, UUID } from "@/lib/validasi";

// Nilai kosong -> undefined; nilai ada tapi tidak sesuai pola -> null (ditolak 422).
function parameter(q: URLSearchParams, kunci: string, pola: RegExp) {
  const nilai = q.get(kunci);
  if (!nilai) return undefined;
  return pola.test(nilai) ? nilai : null;
}

// PRD 9.4 — ringkasan 10 kartu metrik & data grafik, dibatasi RLS sesuai peran pengguna.
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
  const filter = {
    mulai: parameter(q, "start_date", TANGGAL) ?? bawaan.mulai,
    selesai: parameter(q, "end_date", TANGGAL) ?? bawaan.selesai,
    puskesmas_id: puskesmas_id ?? undefined,
    kelurahan_id: kelurahan_id ?? undefined,
  };
  if (puskesmas_id === null || kelurahan_id === null) {
    return galat(422, "validation_error", "Filter faskes tidak valid.");
  }

  const cek = filterTanggalSchema.safeParse(filter);
  if (!cek.success) {
    return galat(422, "validation_error", "Filter tanggal tidak valid.", {
      errors: z.flattenError(cek.error).fieldErrors,
    });
  }

  const data = await ambilAnalitik(db, filter);
  return NextResponse.json({ success: true, data }, { headers: { "cache-control": "private, no-store" } });
}
