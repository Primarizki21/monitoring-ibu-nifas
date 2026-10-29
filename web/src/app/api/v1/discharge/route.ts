import { after, NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { dischargeSchema } from "@/lib/validasi";
import type { Profil } from "@/lib/auth";
import { waAssign01, waEduPasien } from "@/lib/wa/template";
import { prosesAntreanWa } from "@/lib/wa/worker";

// Bearer token (klien API, PRD 9.1) atau cookie sesi (form web).
async function klienPengguna(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: auth } },
      auth: { persistSession: false },
    });
  }
  return createClient();
}

function gagal(status: number, message: string, extra: object = {}) {
  return NextResponse.json({ success: false, message, ...extra }, { status });
}

export async function POST(req: NextRequest) {
  const parsed = dischargeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return gagal(422, "Data tidak valid.", { errors: z.flattenError(parsed.error).fieldErrors });
  }
  const input = parsed.data;

  const supabase = await klienPengguna(req);
  // Profil & cek NIK berjalan paralel (hemat satu round-trip); hasil cek NIK baru dipakai setelah peran lolos.
  // Soft constraint NIK < 40 hari (PRD 7.3) dicek dengan service role: fungsi ini tertutup bagi pengguna.
  const [{ data: profil }, { data: sebelumnya }] = await Promise.all([
    supabase.rpc("profil_saya").maybeSingle<Profil>(),
    input.is_readmission
      ? Promise.resolve({ data: null })
      : createAdminClient().rpc("cek_krs_terakhir", { p_nik: input.nik }).maybeSingle<{ discharge_id: string; waktu_krs: string }>(),
  ]);
  if (!profil?.id) return gagal(401, "Sesi tidak valid. Silakan masuk kembali.");
  if (profil.role !== "BIDAN_RS") return gagal(403, "Hanya Bidan RS yang dapat menginput data pemulangan.");

  if (sebelumnya) {
    return gagal(409, "Pasien dengan NIK ini baru saja dipulangkan.", {
      code: "KEMUNGKINAN_READMISSION",
      data: { waktu_krs_sebelumnya: sebelumnya.waktu_krs },
    });
  }

  const { data: discharge, error } = await supabase
    .from("tr_discharge")
    .insert({ ...input, rs_asal_id: profil.rumah_sakit_id, bidan_rs_id: profil.id })
    .select("id, token_kunjungan, deadline_sla, puskesmas_id, bidan_kelurahan_id")
    .single();
  if (error || !discharge) {
    console.error("insert tr_discharge", error);
    return gagal(500, "Gagal menyimpan data pemulangan.");
  }

  // Antre & kirim WA setelah respons dikembalikan (target < 1 menit, PRD 1.4); cron menjadi cadangan.
  after(() =>
    antrekanNotifikasi(discharge, input, profil.rumah_sakit_id!)
      .then(() => prosesAntreanWa())
      .catch((e) => console.error("antrean/worker WA", e)),
  );

  return NextResponse.json(
    {
      success: true,
      message: discharge.bidan_kelurahan_id
        ? "Data pemulangan ibu nifas berhasil disimpan. Tugas kunjungan telah diteruskan ke Bidan Kelurahan."
        : "Data pemulangan tersimpan, tetapi belum ada Bidan Kelurahan aktif di kelurahan ini. Kepala Puskesmas telah diberi tahu.",
      data: {
        discharge_id: discharge.id,
        deadline_sla: discharge.deadline_sla,
        token_kunjungan: discharge.token_kunjungan,
      },
    },
    { status: 201 },
  );
}

type DischargeBaru = {
  id: string;
  token_kunjungan: string;
  deadline_sla: string;
  puskesmas_id: string;
  bidan_kelurahan_id: string | null;
};

// Masukkan WA-ASSIGN-01 & WA-EDU-PASIEN ke antrean log_notifikasi_wa; pengiriman oleh worker WA.
async function antrekanNotifikasi(d: DischargeBaru, input: z.output<typeof dischargeSchema>, rsId: string) {
  const admin = createAdminClient();
  const [{ data: puskesmas }, { data: rs }, { data: nakes }] = await Promise.all([
    admin.from("m_puskesmas").select("nama_puskesmas").eq("id", d.puskesmas_id).single(),
    admin.from("m_rumah_sakit").select("nama_rs").eq("id", rsId).single(),
    admin
      .from("users")
      .select("id, nama_lengkap, no_whatsapp, role")
      .eq("is_active", true)
      .or(`id.eq.${d.bidan_kelurahan_id ?? "00000000-0000-0000-0000-000000000000"},and(role.eq.KEPALA_PUSKESMAS,puskesmas_id.eq.${d.puskesmas_id})`),
  ]);

  const bidan = nakes?.find((u) => u.id === d.bidan_kelurahan_id);
  const kapus = nakes?.filter((u) => u.role === "KEPALA_PUSKESMAS") ?? [];
  const faskesTujuan = input.faskes_kunjungan_ulang === "RS" ? rs?.nama_rs : puskesmas?.nama_puskesmas;

  const pesanTugas = waAssign01({
    nama_puskesmas: puskesmas?.nama_puskesmas ?? "-",
    nama_rs: rs?.nama_rs ?? "-",
    nama_ibu: input.nama_ibu,
    nik: input.nik,
    alamat_lengkap: input.alamat_lengkap,
    no_whatsapp: input.no_whatsapp_ibu,
    diagnosis_sebelum_pulang: input.diagnosis_sebelum_pulang,
    diagnosis_perawatan: input.diagnosis_perawatan,
    rekomendasi_perawatan: input.rekomendasi_perawatan_rumah,
    deadline_sla: d.deadline_sla,
    jadwal_kunjungan_ulang: input.jadwal_kunjungan_ulang,
    faskes_tujuan: faskesTujuan ?? "-",
    url_kunjungan_token: `${process.env.NEXT_PUBLIC_APP_URL}/visit/${d.token_kunjungan}`,
  });

  const penerimaTugas = [
    ...(bidan ? [{ nomor: bidan.no_whatsapp, peran: "BIDAN_KELURAHAN" }] : []),
    ...kapus.map((k) => ({ nomor: k.no_whatsapp, peran: "KEPALA_PUSKESMAS" })),
  ];

  const sekarang = new Date().toISOString();
  const antrean = [
    ...penerimaTugas.map((p) => ({
      discharge_id: d.id,
      nomor_tujuan: p.nomor,
      peran_penerima: p.peran,
      template_id: "WA-ASSIGN-01",
      prioritas: "HIGH",
      pesan_terkirim: pesanTugas,
      next_retry_at: sekarang,
    })),
    {
      discharge_id: d.id,
      nomor_tujuan: input.no_whatsapp_ibu,
      peran_penerima: "IBU_NIFAS",
      template_id: "WA-EDU-PASIEN",
      prioritas: "NORMAL",
      pesan_terkirim: waEduPasien({
        nama_ibu: input.nama_ibu,
        faskes_tujuan: faskesTujuan ?? "-",
        jadwal_kunjungan_ulang: input.jadwal_kunjungan_ulang,
        nama_bidan: bidan?.nama_lengkap ?? `di ${puskesmas?.nama_puskesmas ?? "Puskesmas"}`,
        no_whatsapp_bidan: bidan?.no_whatsapp ?? kapus[0]?.no_whatsapp ?? "-",
      }),
      next_retry_at: sekarang,
    },
  ];

  const { error } = await admin.from("log_notifikasi_wa").insert(antrean);
  if (error) throw error;
}
