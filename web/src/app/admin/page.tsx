import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { Building2, Hospital, MapPin, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { Header } from "@/components/header";
import { Bagian, Field } from "@/components/form";
import { wajibLogin, type Role } from "@/lib/auth";
import { ambilMasterFaskes } from "@/lib/data/master";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { adminAkunSchema, adminKelurahanSchema, adminPuskesmasSchema, adminRsSchema, UUID } from "@/lib/validasi";

export const metadata = { title: "Master faskes & akun — SIM-NIFAS" };

const LABEL_ROLE: Record<Role, string> = {
  SUPERADMIN_DINKES: "Dinkes",
  KEPALA_PUSKESMAS: "Kepala Puskesmas",
  BIDAN_KELURAHAN: "Bidan Kelurahan",
  BIDAN_RS: "Bidan RS",
};

type Pengguna = {
  id: string;
  nama_lengkap: string;
  email: string;
  no_whatsapp: string;
  role: Role;
  puskesmas_id: string | null;
  rumah_sakit_id: string | null;
  kelurahan_id: string | null;
  is_active: boolean;
};

function teks(formData: FormData, kunci: string) {
  const nilai = String(formData.get(kunci) ?? "").trim();
  return nilai || undefined;
}

function gagal(pesan: string): never {
  redirect(`/admin?error=${encodeURIComponent(pesan)}`);
}

function berhasil(pesan: string): never {
  redirect(`/admin?ok=${encodeURIComponent(pesan)}`);
}

async function pastikanDinkes() {
  const profil = await wajibLogin();
  if (profil.role !== "SUPERADMIN_DINKES") redirect("/dashboard");
  return profil;
}

async function tambahPuskesmas(formData: FormData) {
  "use server";
  await pastikanDinkes();
  const hasil = adminPuskesmasSchema.safeParse({
    nama_puskesmas: teks(formData, "nama_puskesmas"),
    kecamatan: teks(formData, "kecamatan"),
    no_telp_operasional: teks(formData, "no_telp_operasional"),
  });
  if (!hasil.success) gagal(hasil.error.issues[0]?.message ?? "Data Puskesmas tidak valid.");

  const db = await createClient();
  const { error } = await db.from("m_puskesmas").insert(hasil.data);
  if (error) gagal(error.message);
  revalidateTag("master_data");
  revalidatePath("/admin");
  berhasil("Puskesmas ditambahkan.");
}

async function tambahRs(formData: FormData) {
  "use server";
  await pastikanDinkes();
  const hasil = adminRsSchema.safeParse({
    nama_rs: teks(formData, "nama_rs"),
    tipe_rs: teks(formData, "tipe_rs"),
    kecamatan: teks(formData, "kecamatan"),
    alamat_rs: teks(formData, "alamat_rs"),
  });
  if (!hasil.success) gagal(hasil.error.issues[0]?.message ?? "Data RS tidak valid.");

  const db = await createClient();
  const { error } = await db.from("m_rumah_sakit").insert(hasil.data);
  if (error) gagal(error.message);
  revalidateTag("master_data");
  revalidatePath("/admin");
  berhasil("Rumah sakit ditambahkan.");
}

async function tambahKelurahan(formData: FormData) {
  "use server";
  await pastikanDinkes();
  const hasil = adminKelurahanSchema.safeParse({
    puskesmas_id: teks(formData, "puskesmas_id"),
    nama_kelurahan: teks(formData, "nama_kelurahan"),
    kecamatan: teks(formData, "kecamatan"),
  });
  if (!hasil.success) gagal(hasil.error.issues[0]?.message ?? "Data kelurahan tidak valid.");

  const db = await createClient();
  const { error } = await db.from("m_kelurahan").insert(hasil.data);
  if (error) gagal(error.message);
  revalidateTag("master_data");
  revalidatePath("/admin");
  berhasil("Kelurahan ditambahkan.");
}

async function tambahAkun(formData: FormData) {
  "use server";
  await pastikanDinkes();
  const hasil = adminAkunSchema.safeParse({
    nama_lengkap: teks(formData, "nama_lengkap"),
    email: teks(formData, "email"),
    no_whatsapp: teks(formData, "no_whatsapp"),
    role: teks(formData, "role"),
    password: String(formData.get("password") ?? ""),
    puskesmas_id: teks(formData, "puskesmas_id"),
    rumah_sakit_id: teks(formData, "rumah_sakit_id"),
    kelurahan_id: teks(formData, "kelurahan_id"),
  });
  if (!hasil.success) gagal(hasil.error.issues[0]?.message ?? "Data akun tidak valid.");

  const a = hasil.data;
  const admin = createAdminClient();
  const { data: auth, error: eAuth } = await admin.auth.admin.createUser({
    email: a.email,
    password: a.password,
    email_confirm: true,
  });
  if (eAuth || !auth.user) gagal(eAuth?.message ?? "Gagal membuat akun Auth.");

  const { error: eUser } = await admin.from("users").insert({
    id: auth.user.id,
    nama_lengkap: a.nama_lengkap,
    email: a.email,
    no_whatsapp: a.no_whatsapp,
    role: a.role,
    puskesmas_id: a.role === "KEPALA_PUSKESMAS" ? a.puskesmas_id : null,
    rumah_sakit_id: a.role === "BIDAN_RS" ? a.rumah_sakit_id : null,
    kelurahan_id: a.role === "BIDAN_KELURAHAN" ? a.kelurahan_id : null,
    is_active: true,
  });
  if (eUser) {
    // Jangan tinggalkan akun Auth tanpa profil publik.
    await admin.auth.admin.deleteUser(auth.user.id);
    gagal(eUser.message);
  }
  revalidatePath("/admin");
  berhasil("Akun tenaga kesehatan dibuat.");
}

async function ubahAktif(formData: FormData) {
  "use server";
  const profil = await pastikanDinkes();
  const id = String(formData.get("id") ?? "");
  const aktif = String(formData.get("aktif") ?? "") === "true";
  if (!UUID.test(id)) gagal("ID akun tidak valid.");
  if (id === profil.id) gagal("Akun sendiri tidak bisa dinonaktifkan.");

  const db = await createClient();
  const { error } = await db.from("users").update({ is_active: aktif }).eq("id", id);
  if (error) gagal(error.message);
  revalidatePath("/admin");
  berhasil(aktif ? "Akun diaktifkan." : "Akun dinonaktifkan.");
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const profil = await wajibLogin();
  if (profil.role !== "SUPERADMIN_DINKES") redirect("/dashboard");

  const q = await searchParams;
  const db = await createClient();
  const [master, { data }] = await Promise.all([
    ambilMasterFaskes(),
    db
      .from("users")
      .select("id, nama_lengkap, email, no_whatsapp, role, puskesmas_id, rumah_sakit_id, kelurahan_id, is_active")
      .order("created_at", { ascending: true })
      .returns<Pengguna[]>(),
  ]);
  const pengguna = data ?? [];

  const namaFaskes = (u: Pengguna) => {
    if (u.role === "KEPALA_PUSKESMAS") return master.puskesmas.find((p) => p.id === u.puskesmas_id)?.nama_puskesmas ?? "-";
    if (u.role === "BIDAN_RS") return master.rs.find((r) => r.id === u.rumah_sakit_id)?.nama_rs ?? "-";
    if (u.role === "BIDAN_KELURAHAN") return master.kelurahan.find((k) => k.id === u.kelurahan_id)?.nama_kelurahan ?? "-";
    return "Kota Surabaya";
  };

  return (
    <>
      <Header profil={profil} aktif="admin" />
      <main className="mx-auto max-w-6xl space-y-4 px-3 pb-12 pt-6 sm:px-4">
        <header className="px-1">
          <p className="text-sm font-medium text-selat-muda">Dinas Kesehatan Kota Surabaya</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-selat-tua sm:text-3xl">Master faskes & akun</h1>
          <p className="mt-1 max-w-[70ch] text-sm text-tinta-redup">
            {master.puskesmas.length} Puskesmas, {master.kelurahan.length} kelurahan, {master.rs.length} RS, {pengguna.length} akun tenaga kesehatan.
          </p>
        </header>

        {q.ok && <p role="status" className="rounded-2xl bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200">{q.ok}</p>}
        {q.error && <p role="alert" className="rounded-2xl bg-red-50/90 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">{q.error}</p>}

        <div className="grid gap-4 lg:grid-cols-2">
          <Bagian judul="Tambah Puskesmas" ikon={Building2}>
            <form action={tambahPuskesmas} className="space-y-3">
              <Field label="Nama Puskesmas">
                <input name="nama_puskesmas" required className="input" />
              </Field>
              <Field label="Kecamatan">
                <input name="kecamatan" required className="input" />
              </Field>
              <Field label="Nomor telepon" hint="Opsional">
                <input name="no_telp_operasional" className="input" />
              </Field>
              <button className="btn-primary w-full">Simpan Puskesmas</button>
            </form>
          </Bagian>

          <Bagian judul="Tambah Rumah Sakit" ikon={Hospital}>
            <form action={tambahRs} className="space-y-3">
              <Field label="Nama RS">
                <input name="nama_rs" required className="input" />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Tipe RS" hint="Opsional">
                  <input name="tipe_rs" className="input" />
                </Field>
                <Field label="Kecamatan" hint="Opsional">
                  <input name="kecamatan" className="input" />
                </Field>
              </div>
              <Field label="Alamat" hint="Opsional">
                <textarea name="alamat_rs" rows={2} className="input" />
              </Field>
              <button className="btn-primary w-full">Simpan RS</button>
            </form>
          </Bagian>

          <Bagian judul="Tambah Kelurahan" ikon={MapPin}>
            <form action={tambahKelurahan} className="space-y-3">
              <Field label="Puskesmas pembina">
                <select name="puskesmas_id" required className="input" defaultValue="">
                  <option value="" disabled>Pilih Puskesmas</option>
                  {master.puskesmas.map((p) => <option key={p.id} value={p.id}>{p.nama_puskesmas}</option>)}
                </select>
              </Field>
              <Field label="Nama kelurahan">
                <input name="nama_kelurahan" required className="input" />
              </Field>
              <Field label="Kecamatan">
                <input name="kecamatan" required className="input" />
              </Field>
              <button className="btn-primary w-full">Simpan kelurahan</button>
            </form>
          </Bagian>

          <Bagian judul="Buat akun tenaga kesehatan" ikon={UserPlus}>
            <form action={tambahAkun} className="space-y-3">
              <Field label="Nama lengkap">
                <input name="nama_lengkap" required className="input" />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Email">
                  <input name="email" type="email" required autoComplete="off" className="input" />
                </Field>
                <Field label="WhatsApp" hint="Contoh: 081234567890">
                  <input name="no_whatsapp" type="tel" required className="input" />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Role">
                  <select name="role" required className="input" defaultValue="BIDAN_KELURAHAN">
                    {Object.entries(LABEL_ROLE).map(([role, label]) => <option key={role} value={role}>{label}</option>)}
                  </select>
                </Field>
                <Field label="Kata sandi awal" hint="Minimal 8 karakter">
                  <input name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Puskesmas" hint="Untuk Kepala Puskesmas">
                  <select name="puskesmas_id" className="input" defaultValue="">
                    <option value="">-</option>
                    {master.puskesmas.map((p) => <option key={p.id} value={p.id}>{p.nama_puskesmas}</option>)}
                  </select>
                </Field>
                <Field label="RS" hint="Untuk Bidan RS">
                  <select name="rumah_sakit_id" className="input" defaultValue="">
                    <option value="">-</option>
                    {master.rs.map((r) => <option key={r.id} value={r.id}>{r.nama_rs}</option>)}
                  </select>
                </Field>
                <Field label="Kelurahan" hint="Untuk Bidan Kelurahan">
                  <select name="kelurahan_id" className="input" defaultValue="">
                    <option value="">-</option>
                    {master.kelurahan.map((k) => <option key={k.id} value={k.id}>{k.nama_kelurahan}</option>)}
                  </select>
                </Field>
              </div>
              <button className="btn-primary w-full">Buat akun</button>
            </form>
          </Bagian>
        </div>

        <section className="kaca overflow-hidden rounded-[var(--radius-kaca)]">
          <div className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold text-selat">
              <span className="grid size-8 place-items-center rounded-lg bg-selat/10" aria-hidden="true"><UsersRound className="size-4.5" /></span>
              Akun tenaga kesehatan
            </h2>
            <p className="mt-1 text-sm text-tinta-redup">Akun nonaktif tidak bisa login. Akun sendiri tidak bisa dinonaktifkan dari halaman ini.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-y border-white/70 bg-white/35 text-xs text-tinta-redup">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">Nama</th>
                  <th className="px-4 py-2.5 font-semibold">Email</th>
                  <th className="px-4 py-2.5 font-semibold">WhatsApp</th>
                  <th className="px-4 py-2.5 font-semibold">Role</th>
                  <th className="px-4 py-2.5 font-semibold">Faskes</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/60">
                {pengguna.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-white/45">
                    <td className="px-5 py-3 font-semibold">{u.nama_lengkap}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3 tabular-nums">{u.no_whatsapp}</td>
                    <td className="px-4 py-3">{LABEL_ROLE[u.role]}</td>
                    <td className="px-4 py-3">{namaFaskes(u)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${u.is_active ? "bg-emerald-50/80 text-emerald-800 ring-emerald-600/25" : "bg-slate-100/80 text-slate-700 ring-slate-400/30"}`}>
                        <span className={`size-1.5 rounded-full ${u.is_active ? "bg-emerald-600" : "bg-slate-500"}`} aria-hidden="true" />
                        {u.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <form action={ubahAktif}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="aktif" value={String(!u.is_active)} />
                        <button
                          disabled={u.id === profil.id}
                          title={u.id === profil.id ? "Akun sendiri tidak bisa dinonaktifkan" : undefined}
                          className="rounded-lg bg-white/70 px-3 py-1.5 text-xs font-semibold text-selat ring-1 ring-white hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {u.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="flex items-start gap-2 px-1 text-xs text-tinta-redup">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Halaman ini hanya untuk Superadmin Dinkes. Perubahan master langsung dipakai form KRS dan filter dashboard.
        </p>
      </main>
    </>
  );
}
