import { z } from "zod";

// Project URL Supabase tidak boleh memuat path: dashboard menampilkan "REST URL"
// (.../rest/v1) dan "Data API URL" (...); hanya yang kedua yang benar.
const urlSupabase = z
  .url("Harus URL Supabase yang valid")
  .refine((u) => new URL(u).pathname === "/", "Gunakan Project URL Supabase tanpa path (hapus /rest/v1)")
  .transform((u) => u.replace(/\/+$/, ""));

// Variabel opsional sering ditulis sebagai string kosong di .env; perlakukan sebagai tidak diisi.
const kosongJadiUndefined = <T extends z.ZodTypeAny>(skema: T) =>
  z.preprocess((nilai) => (nilai === "" ? undefined : nilai), skema);

// Konfigurasi server divalidasi sekali saat proses start (src/instrumentation.ts).
// Salah konfigurasi = proses gagal start, bukan error 500 saat ibu nifas memakai layanan.
const skema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: urlSupabase,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, "Kunci anon Supabase terlalu pendek"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, "Kunci service role Supabase terlalu pendek"),
  NEXT_PUBLIC_APP_URL: kosongJadiUndefined(z.url("Harus URL publik aplikasi yang valid").default("http://localhost:3000")),
  // Opsional: tanpa token, pesan tetap QUEUED dan tidak menghabiskan jatah retry.
  FONNTE_TOKEN: kosongJadiUndefined(z.string().min(1).optional()),
  // Opsional: tanpa secret, /api/cron menolak semua permintaan (401).
  CRON_SECRET: kosongJadiUndefined(z.string().min(16, "CRON_SECRET minimal 16 karakter").optional()),
});

export type Env = z.infer<typeof skema>;

let tersimpan: Env | null = null;

export function env(): Env {
  if (tersimpan) return tersimpan;
  const hasil = skema.safeParse(process.env);
  if (!hasil.success) {
    const rincian = hasil.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
    throw new Error(`Konfigurasi environment tidak valid — ${rincian}`);
  }
  tersimpan = hasil.data;
  return tersimpan;
}

// Kredensial Supabase yang aman dipakai di edge runtime (middleware): tanpa service role.
export function envSupabase() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasil = urlSupabase.safeParse(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!hasil.success || !anonKey) {
    throw new Error(
      `Konfigurasi Supabase tidak valid — ${hasil.success ? "NEXT_PUBLIC_SUPABASE_ANON_KEY wajib diisi" : hasil.error.issues[0].message}`,
    );
  }
  return { url: hasil.data, anonKey };
}
