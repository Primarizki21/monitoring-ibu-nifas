import { z } from "zod";

export const TANGGAL = /^\d{4}-\d{2}-\d{2}$/;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Rentang filter dashboard: tanggal WIB, maksimal 366 hari agar RPC tetap ringan.
export const filterTanggalSchema = z
  .object({ mulai: z.string().regex(TANGGAL), selesai: z.string().regex(TANGGAL) })
  .refine((f) => f.mulai <= f.selesai, { message: "Tanggal mulai harus sebelum tanggal selesai", path: ["selesai"] })
  .refine(
    (f) => Date.parse(f.selesai) - Date.parse(f.mulai) <= 366 * 86_400_000,
    { message: "Rentang maksimal 366 hari", path: ["selesai"] },
  );

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
