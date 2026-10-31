import { Header } from "@/components/header";
import { wajibLogin, type Profil } from "@/lib/auth";
import { ambilAlertAktif, ambilAnalitik, ambilDaftarPasien, filterBawaan, KATEGORI, type Filter, type Kategori } from "@/lib/data/dashboard";
import { createClient } from "@/lib/supabase/server";
import { TampilanDashboard } from "./tampilan";

const TANGGAL = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f-]{36}$/;

type Master = {
  puskesmas: { id: string; nama_puskesmas: string }[];
  kelurahan: { id: string; nama_kelurahan: string; puskesmas_id: string }[];
  rs: { id: string; nama_rs: string }[];
};

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

  const db = await createClient();
  // Satu round-trip paralel ke Supabase (Singapura ~0,4 dtk): RLS sudah membatasi data, peran hanya untuk tampilan.
  const [profil, { metrics, chart_series }, pasien, alerts, pkm, kel, rs] = await Promise.all([
    wajibLogin(),
    ambilAnalitik(db, filter),
    ambilDaftarPasien(db, filter, tab === "data" ? 500 : 6, kategori),
    ambilAlertAktif(db),
    db.from("m_puskesmas").select("id, nama_puskesmas").order("nama_puskesmas"),
    db.from("m_kelurahan").select("id, nama_kelurahan, puskesmas_id").order("nama_kelurahan"),
    db.from("m_rumah_sakit").select("id, nama_rs"),
  ]);
  const master: Master = { puskesmas: pkm.data ?? [], kelurahan: kel.data ?? [], rs: rs.data ?? [] };
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
        pasien={pasien}
        alerts={alerts}
        puskesmas={bisaPilihPuskesmas ? master.puskesmas.map((p) => ({ id: p.id, nama: p.nama_puskesmas })) : null}
        kelurahan={kelurahan?.map((k) => ({ id: k.id, nama: k.nama_kelurahan, puskesmas_id: k.puskesmas_id })) ?? null}
      />
    </>
  );
}
