import { Header } from "@/components/header";
import { wajibLogin, type Profil } from "@/lib/auth";
import { ambilAlertAktif, ambilAnalitik, ambilDaftarPasien, filterBawaan, KATEGORI, type Filter, type Kategori } from "@/lib/data/dashboard";
import { ambilMasterFaskes, type MasterFaskes } from "@/lib/data/master";
import { createClient } from "@/lib/supabase/server";
import { TANGGAL, UUID } from "@/lib/validasi";
import { TampilanDashboard } from "./tampilan";

type Master = MasterFaskes;
const PER_HALAMAN = 25;

function nomorHalaman(nilai: string | undefined) {
  const n = Number.parseInt(nilai ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

// Nama wilayah yang dicakup data pengguna, diambil dari tabel master yang sudah dimuat.
function namaCakupan(p: Profil, m: Master) {
  if (p.role === "SUPERADMIN_DINKES") return "Dinas Kesehatan Kota Surabaya";
  if (p.role === "KEPALA_PUSKESMAS") return m.puskesmas.find((x) => x.id === p.puskesmas_id)?.nama_puskesmas ?? "Puskesmas";
  if (p.role === "BIDAN_KELURAHAN") return `Kelurahan ${m.kelurahan.find((x) => x.id === p.kelurahan_id)?.nama_kelurahan ?? ""}`;
  return m.rs.find((x) => x.id === p.rumah_sakit_id)?.nama_rs ?? "Rumah sakit";
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const bawaan = filterBawaan();
  const filter: Filter = {
    mulai: TANGGAL.test(q.start_date ?? "") ? q.start_date! : bawaan.mulai,
    selesai: TANGGAL.test(q.end_date ?? "") ? q.end_date! : bawaan.selesai,
    puskesmas_id: UUID.test(q.puskesmas_id ?? "") ? q.puskesmas_id : undefined,
    kelurahan_id: UUID.test(q.kelurahan_id ?? "") ? q.kelurahan_id : undefined,
  };
  const tab = q.tab === "data" ? "data" : "ringkasan";
  const kategori = tab === "data" && q.kategori && q.kategori in KATEGORI ? (q.kategori as Kategori) : undefined;
  const halaman = tab === "data" ? nomorHalaman(q.page) : 1;

  const profil = await wajibLogin();
  const db = await createClient();
  // Analitik dan daftar pasien dibatasi RLS. Token hanya diambil untuk Bidan Kelurahan
  // yang memang membutuhkan tautan pengisian laporan; role lain tidak menerima token di props.
  const [{ metrics, chart_series }, daftar, alerts, master] = await Promise.all([
    ambilAnalitik(db, filter),
    ambilDaftarPasien(db, filter, {
      halaman,
      perHalaman: PER_HALAMAN,
      kategori,
      sertakanToken: profil.role === "BIDAN_KELURAHAN",
    }),
    ambilAlertAktif(db),
    ambilMasterFaskes(),
  ]);
  const totalHalaman = Math.max(1, Math.ceil(daftar.total / PER_HALAMAN));
  const bisaPilihPuskesmas = profil.role === "SUPERADMIN_DINKES" || profil.role === "BIDAN_RS";
  const kelurahan =
    profil.role === "BIDAN_KELURAHAN" ? null : master.kelurahan.filter((k) => profil.role !== "KEPALA_PUSKESMAS" || k.puskesmas_id === profil.puskesmas_id);
  const cakupan = namaCakupan(profil, master);

  return (
    <>
      <Header profil={profil} aktif="dashboard" />
      <TampilanDashboard
        nama={profil.nama_lengkap}
        role={profil.role}
        cakupan={cakupan}
        tab={tab}
        kategori={kategori}
        params={Object.fromEntries(Object.entries(q).filter((e): e is [string, string] => typeof e[1] === "string"))}
        filter={{ mulai: filter.mulai, selesai: filter.selesai }}
        metrics={metrics}
        chart_series={chart_series}
        pasien={daftar.rows}
        totalPasien={daftar.total}
        halaman={halaman}
        totalHalaman={totalHalaman}
        perHalaman={PER_HALAMAN}
        alerts={alerts}
        puskesmas={bisaPilihPuskesmas ? master.puskesmas.map((p) => ({ id: p.id, nama: p.nama_puskesmas })) : null}
        kelurahan={kelurahan?.map((k) => ({ id: k.id, nama: k.nama_kelurahan, puskesmas_id: k.puskesmas_id })) ?? null}
      />
    </>
  );
}
