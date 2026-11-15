import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { ArrowLeft, Settings2, ShieldCheck } from "lucide-react";
import { Header } from "@/components/header";
import { wajibLogin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { adminKelurahanSchema, adminPuskesmasSchema, adminRsSchema, UUID } from "@/lib/validasi";

export const metadata = { title: "Kelola master faskes — SIM-NIFAS" };

type Puskesmas = { id: string; nama_puskesmas: string; kecamatan: string; no_telp_operasional: string | null };
type Rs = { id: string; nama_rs: string; tipe_rs: string | null; kecamatan: string | null; alamat_rs: string | null };
type Kelurahan = { id: string; nama_kelurahan: string; kecamatan: string; puskesmas_id: string };

function teks(formData: FormData, kunci: string) {
  const nilai = String(formData.get(kunci) ?? "").trim();
  return nilai || undefined;
}

function gagal(pesan: string): never {
  redirect(`/admin/master?error=${encodeURIComponent(pesan)}`);
}

function berhasil(pesan: string): never {
  redirect(`/admin/master?ok=${encodeURIComponent(pesan)}`);
}

async function pastikanDinkes() {
  const profil = await wajibLogin();
  if (profil.role !== "SUPERADMIN_DINKES") redirect("/dashboard");
  return profil;
}

function idSah(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) gagal("ID data tidak valid.");
  return id;
}

async function ubahPuskesmas(formData: FormData) {
  "use server";
  await pastikanDinkes();
  const id = idSah(formData);
  const hasil = adminPuskesmasSchema.safeParse({
    nama_puskesmas: teks(formData, "nama_puskesmas"),
    kecamatan: teks(formData, "kecamatan"),
    no_telp_operasional: teks(formData, "no_telp_operasional"),
  });
  if (!hasil.success) gagal(hasil.error.issues[0]?.message ?? "Data Puskesmas tidak valid.");

  const db = await createClient();
  const { error } = await db
    .from("m_puskesmas")
    .update({ ...hasil.data, no_telp_operasional: hasil.data.no_telp_operasional ?? null })
    .eq("id", id);
  if (error) gagal(error.message);
  revalidateTag("master_data");
  revalidatePath("/admin");
  revalidatePath("/admin/master");
  berhasil("Puskesmas diperbarui.");
}

async function ubahRs(formData: FormData) {
  "use server";
  await pastikanDinkes();
  const id = idSah(formData);
  const hasil = adminRsSchema.safeParse({
    nama_rs: teks(formData, "nama_rs"),
    tipe_rs: teks(formData, "tipe_rs"),
    kecamatan: teks(formData, "kecamatan"),
    alamat_rs: teks(formData, "alamat_rs"),
  });
  if (!hasil.success) gagal(hasil.error.issues[0]?.message ?? "Data RS tidak valid.");

  const db = await createClient();
  const { error } = await db
    .from("m_rumah_sakit")
    .update({
      ...hasil.data,
      tipe_rs: hasil.data.tipe_rs ?? null,
      kecamatan: hasil.data.kecamatan ?? null,
      alamat_rs: hasil.data.alamat_rs ?? null,
    })
    .eq("id", id);
  if (error) gagal(error.message);
  revalidateTag("master_data");
  revalidatePath("/admin");
  revalidatePath("/admin/master");
  berhasil("Rumah sakit diperbarui.");
}

async function ubahKelurahan(formData: FormData) {
  "use server";
  await pastikanDinkes();
  const id = idSah(formData);
  const hasil = adminKelurahanSchema.safeParse({
    puskesmas_id: teks(formData, "puskesmas_id"),
    nama_kelurahan: teks(formData, "nama_kelurahan"),
    kecamatan: teks(formData, "kecamatan"),
  });
  if (!hasil.success) gagal(hasil.error.issues[0]?.message ?? "Data kelurahan tidak valid.");

  const db = await createClient();
  const { error } = await db.from("m_kelurahan").update(hasil.data).eq("id", id);
  if (error) gagal(error.message);
  revalidateTag("master_data");
  revalidatePath("/admin");
  revalidatePath("/admin/master");
  berhasil("Kelurahan diperbarui.");
}

export default async function MasterPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const profil = await wajibLogin();
  if (profil.role !== "SUPERADMIN_DINKES") redirect("/dashboard");

  const q = await searchParams;
  const db = await createClient();
  const [pkm, rs, kel] = await Promise.all([
    db.from("m_puskesmas").select("id, nama_puskesmas, kecamatan, no_telp_operasional").order("nama_puskesmas").returns<Puskesmas[]>(),
    db.from("m_rumah_sakit").select("id, nama_rs, tipe_rs, kecamatan, alamat_rs").order("nama_rs").returns<Rs[]>(),
    db.from("m_kelurahan").select("id, nama_kelurahan, kecamatan, puskesmas_id").order("nama_kelurahan").returns<Kelurahan[]>(),
  ]);
  const puskesmas = pkm.data ?? [];
  const rumahSakit = rs.data ?? [];
  const kelurahan = kel.data ?? [];
  const namaPuskesmas = new Map(puskesmas.map((p) => [p.id, p.nama_puskesmas]));

  return (
    <>
      <Header profil={profil} aktif="admin" />
      <main className="mx-auto max-w-7xl space-y-4 px-3 pb-12 pt-6 sm:px-4">
        <Link href="/admin" className="inline-flex items-center gap-1.5 px-1 text-sm font-medium text-selat hover:text-selat-tua">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali ke master & akun
        </Link>

        <header className="px-1">
          <p className="text-sm font-medium text-selat-muda">Dinas Kesehatan Kota Surabaya</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-selat-tua sm:text-3xl">Kelola master faskes</h1>
          <p className="mt-1 max-w-[70ch] text-sm text-tinta-redup">Ubah nama, wilayah, dan kontak faskes. Perubahan langsung dipakai form KRS dan filter dashboard.</p>
        </header>

        {q.ok && <p role="status" className="rounded-2xl bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200">{q.ok}</p>}
        {q.error && <p role="alert" className="rounded-2xl bg-red-50/90 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">{q.error}</p>}

        <section className="kaca overflow-hidden rounded-[var(--radius-kaca)]">
          <div className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold text-selat">
              <span className="grid size-8 place-items-center rounded-lg bg-selat/10" aria-hidden="true"><Settings2 className="size-4.5" /></span>
              Puskesmas
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-y border-white/70 bg-white/35 text-xs text-tinta-redup">
                <tr><th className="px-5 py-2.5 font-semibold">Nama</th><th className="px-4 py-2.5 font-semibold">Kecamatan</th><th className="px-4 py-2.5 font-semibold">Telepon</th><th className="px-5 py-2.5 text-right font-semibold">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-white/60">
                {puskesmas.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 font-semibold">{p.nama_puskesmas}</td>
                    <td className="px-4 py-3">{p.kecamatan}</td>
                    <td className="px-4 py-3 tabular-nums">{p.no_telp_operasional ?? "-"}</td>
                    <td className="px-5 py-3 text-right">
                      <details className="text-left">
                        <summary className="ml-auto w-fit cursor-pointer text-xs font-semibold text-selat underline">Ubah</summary>
                        <form action={ubahPuskesmas} className="mt-2 grid min-w-64 gap-2">
                          <input type="hidden" name="id" value={p.id} />
                          <label className="text-xs font-semibold">Nama<input name="nama_puskesmas" defaultValue={p.nama_puskesmas} required className="input mt-1 px-2 py-1 text-xs" /></label>
                          <label className="text-xs font-semibold">Kecamatan<input name="kecamatan" defaultValue={p.kecamatan} required className="input mt-1 px-2 py-1 text-xs" /></label>
                          <label className="text-xs font-semibold">Telepon<input name="no_telp_operasional" defaultValue={p.no_telp_operasional ?? ""} className="input mt-1 px-2 py-1 text-xs" /></label>
                          <button className="btn-primary min-h-11 text-xs">Simpan</button>
                        </form>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="kaca overflow-hidden rounded-[var(--radius-kaca)]">
          <div className="p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold text-selat">Rumah sakit</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-y border-white/70 bg-white/35 text-xs text-tinta-redup">
                <tr><th className="px-5 py-2.5 font-semibold">Nama</th><th className="px-4 py-2.5 font-semibold">Tipe</th><th className="px-4 py-2.5 font-semibold">Kecamatan</th><th className="px-4 py-2.5 font-semibold">Alamat</th><th className="px-5 py-2.5 text-right font-semibold">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-white/60">
                {rumahSakit.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3 font-semibold">{r.nama_rs}</td>
                    <td className="px-4 py-3">{r.tipe_rs ?? "-"}</td>
                    <td className="px-4 py-3">{r.kecamatan ?? "-"}</td>
                    <td className="max-w-56 px-4 py-3">{r.alamat_rs ?? "-"}</td>
                    <td className="px-5 py-3 text-right">
                      <details className="text-left">
                        <summary className="ml-auto w-fit cursor-pointer text-xs font-semibold text-selat underline">Ubah</summary>
                        <form action={ubahRs} className="mt-2 grid min-w-64 gap-2">
                          <input type="hidden" name="id" value={r.id} />
                          <label className="text-xs font-semibold">Nama<input name="nama_rs" defaultValue={r.nama_rs} required className="input mt-1 px-2 py-1 text-xs" /></label>
                          <div className="grid grid-cols-2 gap-2">
                            <label className="text-xs font-semibold">Tipe<input name="tipe_rs" defaultValue={r.tipe_rs ?? ""} className="input mt-1 px-2 py-1 text-xs" /></label>
                            <label className="text-xs font-semibold">Kecamatan<input name="kecamatan" defaultValue={r.kecamatan ?? ""} className="input mt-1 px-2 py-1 text-xs" /></label>
                          </div>
                          <label className="text-xs font-semibold">Alamat<textarea name="alamat_rs" defaultValue={r.alamat_rs ?? ""} rows={2} className="input mt-1 px-2 py-1 text-xs" /></label>
                          <button className="btn-primary min-h-11 text-xs">Simpan</button>
                        </form>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="kaca overflow-hidden rounded-[var(--radius-kaca)]">
          <div className="p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold text-selat">Kelurahan</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-y border-white/70 bg-white/35 text-xs text-tinta-redup">
                <tr><th className="px-5 py-2.5 font-semibold">Kelurahan</th><th className="px-4 py-2.5 font-semibold">Kecamatan</th><th className="px-4 py-2.5 font-semibold">Puskesmas</th><th className="px-5 py-2.5 text-right font-semibold">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-white/60">
                {kelurahan.map((k) => (
                  <tr key={k.id}>
                    <td className="px-5 py-3 font-semibold">{k.nama_kelurahan}</td>
                    <td className="px-4 py-3">{k.kecamatan}</td>
                    <td className="px-4 py-3">{namaPuskesmas.get(k.puskesmas_id) ?? "-"}</td>
                    <td className="px-5 py-3 text-right">
                      <details className="text-left">
                        <summary className="ml-auto w-fit cursor-pointer text-xs font-semibold text-selat underline">Ubah</summary>
                        <form action={ubahKelurahan} className="mt-2 grid min-w-64 gap-2">
                          <input type="hidden" name="id" value={k.id} />
                          <label className="text-xs font-semibold">Nama<input name="nama_kelurahan" defaultValue={k.nama_kelurahan} required className="input mt-1 px-2 py-1 text-xs" /></label>
                          <label className="text-xs font-semibold">Kecamatan<input name="kecamatan" defaultValue={k.kecamatan} required className="input mt-1 px-2 py-1 text-xs" /></label>
                          <label className="text-xs font-semibold">Puskesmas
                            <select name="puskesmas_id" defaultValue={k.puskesmas_id} required className="input mt-1 px-2 py-1 text-xs">
                              {puskesmas.map((p) => <option key={p.id} value={p.id}>{p.nama_puskesmas}</option>)}
                            </select>
                          </label>
                          <button className="btn-primary min-h-11 text-xs">Simpan</button>
                        </form>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="flex items-start gap-2 px-1 text-xs text-tinta-redup">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Hanya Superadmin Dinkes yang dapat mengubah master faskes. Data yang sudah dipakai pasien tidak dihapus dari halaman ini.
        </p>
      </main>
    </>
  );
}
