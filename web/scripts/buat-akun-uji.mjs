// Membuat 4 akun uji (satu per peran) di project Supabase. Bila akun sudah ada,
// kata sandinya disamakan dengan AKUN_UJI_PASSWORD (aman dijalankan ulang).
// Jalankan: node --env-file=.env.local scripts/buat-akun-uji.mjs
import { createClient } from "@supabase/supabase-js";

const password = process.env.AKUN_UJI_PASSWORD;
if (!password) throw new Error("Isi AKUN_UJI_PASSWORD di .env.local");

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const ambilId = async (tabel, kolom, nilai) => {
  const { data, error } = await db.from(tabel).select("id").eq(kolom, nilai).single();
  if (error) throw new Error(`${tabel} '${nilai}' tidak ditemukan — sudah jalankan seed?`);
  return data.id;
};

const akun = [
  { email: "bidan.rs@uji.test", nama_lengkap: "Bidan RS Uji", role: "BIDAN_RS", no_whatsapp: "+6281100000001",
    rumah_sakit_id: await ambilId("m_rumah_sakit", "nama_rs", "RSUD Dr. Soetomo") },
  { email: "bidan.gundih@uji.test", nama_lengkap: "Bidan Kelurahan Gundih", role: "BIDAN_KELURAHAN", no_whatsapp: "+6281100000002",
    kelurahan_id: await ambilId("m_kelurahan", "nama_kelurahan", "Gundih") },
  { email: "kapus.gundih@uji.test", nama_lengkap: "Kepala Puskesmas Gundih", role: "KEPALA_PUSKESMAS", no_whatsapp: "+6281100000003",
    puskesmas_id: await ambilId("m_puskesmas", "nama_puskesmas", "Puskesmas Gundih") },
  { email: "dinkes@uji.test", nama_lengkap: "Admin Dinkes", role: "SUPERADMIN_DINKES", no_whatsapp: "+6281100000004" },
];

const { data: daftar } = await db.auth.admin.listUsers({ perPage: 1000 });

for (const a of akun) {
  const ada = daftar?.users.find((u) => u.email === a.email);
  if (ada) {
    const { error } = await db.auth.admin.updateUserById(ada.id, { password });
    console.log(error ? `- ${a.email}: ${error.message}` : `~ ${a.email}: kata sandi diperbarui`);
    continue;
  }
  const { data, error } = await db.auth.admin.createUser({ email: a.email, password, email_confirm: true });
  if (error) {
    console.log(`- ${a.email}: ${error.message}`);
    continue;
  }
  const { error: e2 } = await db.from("users").insert({ id: data.user.id, ...a });
  console.log(e2 ? `- ${a.email}: ${e2.message}` : `+ ${a.email} (${a.role})`);
}
console.log("Ganti no_whatsapp di tabel users dengan nomor asli bila ingin menerima WA uji.");
