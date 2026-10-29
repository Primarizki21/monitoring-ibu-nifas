import { createAdminClient } from "@/lib/supabase/server";

// Data ringkas pasien untuk form kunjungan bertoken (PRD 9.2). Dibaca dengan service role
// karena bidan membuka tautan tanpa login; token 64 hex menjadi kuncinya.

export type LaporanKunjungan = {
  waktu_kunjungan: string;
  durasi_jam_sejak_krs: number;
  suhu_tubuh: number;
  perdarahan_abnormal: boolean;
  nyeri_perut_hebat: boolean;
  luka_berbau_infeksi: boolean;
  pusing_muntah_lemas: boolean;
  status_hasil: "BAIK" | "ADA_MASALAH";
  catatan_kebidanan: string | null;
  konfirmasi_jadwal_kontrol: string;
};

export type DataKunjungan = {
  discharge_id: string;
  nama_ibu: string;
  alamat: string;
  no_whatsapp_ibu: string;
  nama_rs: string;
  diagnosis_rs: string;
  diagnosis_perawatan: string;
  rekomendasi_rs: string;
  waktu_krs: string;
  deadline_sla: string;
  jadwal_kunjungan_ulang: string;
  status_kunjungan: string;
  status_kesehatan: string;
  is_expired: boolean;
  laporan: LaporanKunjungan | null;
};

const TOKEN_VALID = /^[0-9a-f]{64}$/;

export async function ambilKunjungan(token: string): Promise<DataKunjungan | null> {
  if (!TOKEN_VALID.test(token)) return null;

  const { data: d } = await createAdminClient()
    .from("tr_discharge")
    .select(
      `id, nama_ibu, alamat_lengkap, no_whatsapp_ibu, diagnosis_sebelum_pulang, diagnosis_perawatan,
       rekomendasi_perawatan_rumah, waktu_krs, deadline_sla, token_expires_at, jadwal_kunjungan_ulang,
       status_kunjungan, status_kesehatan,
       kelurahan:m_kelurahan(nama_kelurahan), rs:m_rumah_sakit(nama_rs),
       laporan:tr_home_visit(waktu_kunjungan, durasi_jam_sejak_krs, suhu_tubuh, perdarahan_abnormal,
         nyeri_perut_hebat, luka_berbau_infeksi, pusing_muntah_lemas, status_hasil, catatan_kebidanan,
         konfirmasi_jadwal_kontrol)`,
    )
    .eq("token_kunjungan", token)
    .maybeSingle();
  if (!d) return null;

  const kelurahan = d.kelurahan as unknown as { nama_kelurahan: string } | null;
  const rs = d.rs as unknown as { nama_rs: string } | null;
  // Relasi 1-1 (discharge_id unik) dikembalikan sebagai objek, bukan array.
  const laporan = d.laporan as unknown as LaporanKunjungan | null;

  return {
    discharge_id: d.id,
    nama_ibu: d.nama_ibu,
    alamat: kelurahan ? `${d.alamat_lengkap}, Kel. ${kelurahan.nama_kelurahan}` : d.alamat_lengkap,
    no_whatsapp_ibu: d.no_whatsapp_ibu,
    nama_rs: rs?.nama_rs ?? "-",
    diagnosis_rs: d.diagnosis_sebelum_pulang,
    diagnosis_perawatan: d.diagnosis_perawatan,
    rekomendasi_rs: d.rekomendasi_perawatan_rumah,
    waktu_krs: d.waktu_krs,
    deadline_sla: d.deadline_sla,
    jadwal_kunjungan_ulang: d.jadwal_kunjungan_ulang,
    status_kunjungan: d.status_kunjungan,
    status_kesehatan: d.status_kesehatan,
    is_expired: !laporan && new Date(d.token_expires_at) < new Date(),
    laporan,
  };
}
