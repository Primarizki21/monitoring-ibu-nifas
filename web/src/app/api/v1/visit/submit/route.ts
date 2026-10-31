import { after, NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { kunjunganSchema } from "@/lib/validasi";
import { waEmergency } from "@/lib/wa/template";
import { prosesAntreanWa } from "@/lib/wa/worker";

function gagal(status: number, message: string, extra: object = {}) {
  return NextResponse.json({ success: false, message, ...extra }, { status });
}

// PRD 9.3 — simpan laporan kunjungan rumah. Status SLA & triase dihitung trigger database.
export async function POST(req: NextRequest) {
  const parsed = kunjunganSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return gagal(422, "Data tidak valid.", { errors: z.flattenError(parsed.error).fieldErrors });
  }
  const { token_kunjungan, ...laporan } = parsed.data;
  const db = createAdminClient();

  const { data: d } = await db
    .from("tr_discharge")
    .select("id, nama_ibu, alamat_lengkap, no_whatsapp_ibu, puskesmas_id, bidan_kelurahan_id, token_expires_at")
    .eq("token_kunjungan", token_kunjungan)
    .maybeSingle();
  if (!d) return gagal(404, "Tautan kunjungan tidak ditemukan.");
  if (new Date(d.token_expires_at) < new Date()) return gagal(410, "Tautan kunjungan sudah kadaluarsa (lebih dari 7 hari).");

  // Token hanya bisa dipakai submit sekali: discharge_id unik di tr_home_visit (PRD 7.3).
  const { error } = await db.from("tr_home_visit").insert({ discharge_id: d.id, ...laporan });
  if (error?.code === "23505") return gagal(409, "Laporan kunjungan untuk pasien ini sudah pernah dikirim.");
  if (error) {
    console.error("insert tr_home_visit", error);
    return gagal(500, "Gagal menyimpan laporan kunjungan.");
  }

  const { data: hasil } = await db
    .from("tr_discharge")
    .select("status_kunjungan, status_kesehatan, is_emergency")
    .eq("id", d.id)
    .single();

  // WA darurat diantrekan setelah respons dikirim; status emergency sudah final dari trigger database.
  if (hasil?.is_emergency) after(() => antrekanDarurat(db, d).catch((e) => console.error("WA darurat", e)));

  return NextResponse.json({
    success: true,
    message: hasil?.is_emergency
      ? "Laporan kunjungan berhasil terekam. Sistem mendeteksi tanda bahaya nifas. Notifikasi darurat telah dipicu."
      : "Laporan kunjungan berhasil terekam.",
    data: {
      status_sla: hasil?.status_kunjungan,
      status_kesehatan: hasil?.status_kesehatan,
      is_emergency_triggered: Boolean(hasil?.is_emergency),
    },
  });
}

type Db = ReturnType<typeof createAdminClient>;
type DischargeDarurat = { id: string; nama_ibu: string; alamat_lengkap: string; no_whatsapp_ibu: string; puskesmas_id: string; bidan_kelurahan_id: string | null };

async function antrekanDarurat(db: Db, d: DischargeDarurat) {
  const { data: alert } = await db
    .from("tr_emergency_alert")
    .select("jenis_masalah, waktu_laporan")
    .eq("discharge_id", d.id)
    .order("waktu_laporan", { ascending: false })
    .limit(1)
    .single();
  const { data: nakes } = await db
    .from("users")
    .select("no_whatsapp, role")
    .eq("is_active", true)
    .or(`id.eq.${d.bidan_kelurahan_id ?? "00000000-0000-0000-0000-000000000000"},and(role.eq.KEPALA_PUSKESMAS,puskesmas_id.eq.${d.puskesmas_id})`);

  const pesan = waEmergency({
    nama_ibu: d.nama_ibu,
    alamat_lengkap: d.alamat_lengkap,
    no_whatsapp: d.no_whatsapp_ibu,
    deskripsi_gejala_bahaya: alert?.jenis_masalah ?? "-",
    timestamp_laporan: alert?.waktu_laporan ?? new Date().toISOString(),
  });
  const sekarang = new Date().toISOString();
  await db.from("log_notifikasi_wa").insert(
    (nakes ?? []).map((n) => ({
      discharge_id: d.id,
      nomor_tujuan: n.no_whatsapp,
      peran_penerima: n.role,
      template_id: "WA-EMERGENCY",
      prioritas: "URGENT",
      pesan_terkirim: pesan,
      next_retry_at: sekarang,
    })),
  );
  await prosesAntreanWa();
}

