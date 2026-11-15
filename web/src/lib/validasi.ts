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

// Form admin Dinkes. Semua field faskes opsional di level skema; aturan role
// ditegakkan di superRefine agar payload tidak bergantung pada UI.
export const rolePenggunaSchema = z.enum(["SUPERADMIN_DINKES", "KEPALA_PUSKESMAS", "BIDAN_KELURAHAN", "BIDAN_RS"]);

export const adminPuskesmasSchema = z.object({
  nama_puskesmas: z.string().trim().min(2, "Nama Puskesmas wajib diisi"),
  kecamatan: z.string().trim().min(2, "Kecamatan wajib diisi"),
  no_telp_operasional: z.string().trim().max(20, "Nomor telepon maksimal 20 karakter").optional(),
});

export const adminRsSchema = z.object({
  nama_rs: z.string().trim().min(2, "Nama RS wajib diisi"),
  tipe_rs: z.string().trim().max(10, "Tipe RS maksimal 10 karakter").optional(),
  kecamatan: z.string().trim().max(50, "Kecamatan maksimal 50 karakter").optional(),
  alamat_rs: z.string().trim().max(500, "Alamat maksimal 500 karakter").optional(),
});

export const adminKelurahanSchema = z.object({
  puskesmas_id: z.uuid("Pilih Puskesmas"),
  nama_kelurahan: z.string().trim().min(2, "Nama kelurahan wajib diisi"),
  kecamatan: z.string().trim().min(2, "Kecamatan wajib diisi"),
});

export const adminAkunSchema = z
  .object({
    nama_lengkap: z.string().trim().min(2, "Nama wajib diisi"),
    email: z.string().trim().email("Email tidak valid"),
    no_whatsapp: nomorWhatsapp,
    role: rolePenggunaSchema,
    password: z.string().min(8, "Kata sandi minimal 8 karakter"),
    puskesmas_id: z.uuid().optional(),
    rumah_sakit_id: z.uuid().optional(),
    kelurahan_id: z.uuid().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.role === "KEPALA_PUSKESMAS" && !v.puskesmas_id) {
      ctx.addIssue({ code: "custom", path: ["puskesmas_id"], message: "Pilih Puskesmas untuk Kepala Puskesmas" });
    }
    if (v.role === "BIDAN_RS" && !v.rumah_sakit_id) {
      ctx.addIssue({ code: "custom", path: ["rumah_sakit_id"], message: "Pilih RS untuk Bidan RS" });
    }
    if (v.role === "BIDAN_KELURAHAN" && !v.kelurahan_id) {
      ctx.addIssue({ code: "custom", path: ["kelurahan_id"], message: "Pilih kelurahan untuk Bidan Kelurahan" });
    }
  });
