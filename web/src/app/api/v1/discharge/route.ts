import { after, NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { asalSah, galat } from "@/lib/http";
import { dischargeSchema } from "@/lib/validasi";
import type { Profil } from "@/lib/auth";
import { waAssign01, waEduPasien } from "@/lib/wa/template";
import { prosesAntreanWa } from "@/lib/wa/worker";

// Bearer token (klien API, PRD 9.1) atau cookie sesi (form web).
async function klienPengguna(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = env();
    return createSupabaseClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
      auth: { persistSession: false },
    });
  }
  return createClient();
}

export async function POST(req: NextRequest) {
  // Mutasi ber-cookie harus dari origin sendiri; klien Bearer dikecualikan.
  if (!asalSah(req)) return galat(403, "forbidden", "Permintaan lintas situs ditolak.");

  const parsed = dischargeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return galat(422, "validation_error", "Data tidak valid.", { errors: z.flattenError(parsed.error).fieldErrors });
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
  if (!profil?.id) return galat(401, "unauthorized", "Sesi tidak valid. Silakan masuk kembali.");
  if (profil.role !== "BIDAN_RS") return galat(403, "forbidden", "Hanya Bidan RS yang dapat menginput data pemulangan.");

  if (sebelumnya) {
    return galat(409, "conflict", "Pasien dengan NIK ini baru saja dipulangkan.", {
      // Kode domain dipertahankan di level atas untuk dialog readmission di formulir KRS.
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
    return galat(500, "internal_error", "Gagal menyimpan data pemulangan.");
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
  // Dua query terpisah, bukan filter string `.or()` yang menggabungkan nilai dari database.
  const [{ data: puskesmas }, { data: rs }, { data: bidan }, { data: kapus }] = await Promise.all([
    admin.from("m_puskesmas").select("nama_puskesmas").eq("id", d.puskesmas_id).single(),
    admin.from("m_rumah_sakit").select("nama_rs").eq("id", rsId).single(),
    d.bidan_kelurahan_id
      ? admin
          .from("users")
          .select("nama_lengkap, no_whatsapp")
          .eq("id", d.bidan_kelurahan_id)
          .eq("is_active", true)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("users")
      .select("no_whatsapp")
      .eq("role", "KEPALA_PUSKESMAS")
      .eq("puskesmas_id", d.puskesmas_id)
      .eq("is_active", true),
  ]);
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
    url_kunjungan_token: `${env().NEXT_PUBLIC_APP_URL}/visit/${d.token_kunjungan}`,
  });

  const penerimaTugas = [
    ...(bidan ? [{ nomor: bidan.no_whatsapp, peran: "BIDAN_KELURAHAN" }] : []),
    ...(kapus ?? []).map((k) => ({ nomor: k.no_whatsapp, peran: "KEPALA_PUSKESMAS" })),
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
        no_whatsapp_bidan: bidan?.no_whatsapp ?? kapus?.[0]?.no_whatsapp ?? "-",
      }),
      next_retry_at: sekarang,
    },
  ];

  const { error } = await admin.from("log_notifikasi_wa").insert(antrean);
  if (error) throw error;
}
