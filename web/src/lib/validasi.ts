import { z } from "zod";

// Normalisasi 08xx / 628xx / +628xx -> +628xx
export const nomorWhatsapp = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^0/, "+62").replace(/^62/, "+62"))
  .pipe(z.string().regex(/^\+62[0-9]{8,13}$/, "Nomor WhatsApp harus berformat +62"));

export const dischargeSchema = z.object({
  nik: z.string().regex(/^[0-9]{16}$/, "NIK harus 16 digit angka"),
  nama_ibu: z.string().trim().min(2, "Wajib diisi"),
  alamat_lengkap: z.string().trim().min(5, "Isi alamat lengkap"),
  kelurahan_id: z.uuid(),
  no_whatsapp_ibu: nomorWhatsapp,
  diagnosis_sebelum_pulang: z.string().trim().min(2, "Wajib diisi"),
  diagnosis_perawatan: z.string().trim().min(2, "Wajib diisi"),
  rekomendasi_perawatan_rumah: z.string().trim().min(2, "Wajib diisi"),
  jadwal_kunjungan_ulang: z.iso.date(),
  faskes_kunjungan_ulang: z.enum(["RS", "PUSKESMAS"]),
  is_readmission: z.boolean().default(false),
});

export const kunjunganSchema = z.object({
  token_kunjungan: z.string().length(64),
  suhu_tubuh: z.number({ error: "Isi suhu tubuh" }).min(30, "Suhu tidak wajar").max(45, "Suhu tidak wajar"),
  perdarahan_abnormal: z.boolean(),
  nyeri_perut_hebat: z.boolean(),
  luka_berbau_infeksi: z.boolean(),
  pusing_muntah_lemas: z.boolean(),
  status_hasil: z.enum(["BAIK", "ADA_MASALAH"], { error: "Pilih hasil kunjungan" }),
  catatan_kebidanan: z.string().trim().optional(),
  konfirmasi_jadwal_kontrol: z.iso.date({ error: "Pilih tanggal" }),
});
