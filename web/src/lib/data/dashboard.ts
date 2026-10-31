import type { SupabaseClient } from "@supabase/supabase-js";

// Data dashboard (PRD 8 & 9.4). Selalu memakai klien pengguna, sehingga RLS membatasi
// cakupan otomatis: Dinkes = kota, Kepala Puskesmas = puskesmas, Bidan = kelurahan, Bidan RS = RS-nya.

export type Filter = { mulai: string; selesai: string; puskesmas_id?: string; kelurahan_id?: string };

export type Metrics = {
  total_dipulangkan: number;
  kunjungan_tepat_waktu: number;
  persentase_tepat_waktu: number;
  menunggu_kunjungan: number;
  tidak_dikunjungi: number;
  kunjungan_terlambat: number;
  komplikasi: number;
  tanda_bahaya: number;
  meninggal: number;
  sehat: number;
  dirawat_kembali: number;
};

export type TitikGrafik = { tanggal: string; dipulangkan: number; tepat_waktu: number; tidak_kunjungan: number; terlambat: number };

export type BarisPasien = {
  id: string;
  nama_ibu: string;
  alamat_lengkap: string;
  no_whatsapp_ibu: string;
  waktu_krs: string;
  deadline_sla: string;
  status_kunjungan: string;
  status_kesehatan: string;
  token_kunjungan: string;
  kelurahan: { nama_kelurahan: string } | null;
};

export type AlertAktif = {
  id: string;
  jenis_masalah: string;
  waktu_laporan: string;
  discharge: { id: string; nama_ibu: string; alamat_lengkap: string; no_whatsapp_ibu: string } | null;
};

const WIB = "+07:00";

export function tanggalWIB(d: Date | string) {
  return new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

export function filterBawaan(): Filter {
  const selesai = new Date();
  const mulai = new Date(selesai.getTime() - 29 * 86_400_000);
  return { mulai: tanggalWIB(mulai), selesai: tanggalWIB(selesai) };
}

function batasAkhir(selesai: string) {
  return new Date(new Date(`${selesai}T00:00:00${WIB}`).getTime() + 86_400_000).toISOString();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function terapkanFilter<Q extends { gte: any; lt: any; eq: any }>(q: Q, f: Filter): Q {
  q = q.gte("waktu_krs", `${f.mulai}T00:00:00${WIB}`).lt("waktu_krs", batasAkhir(f.selesai));
  if (f.puskesmas_id) q = q.eq("puskesmas_id", f.puskesmas_id);
  if (f.kelurahan_id) q = q.eq("kelurahan_id", f.kelurahan_id);
  return q;
}

export async function ambilAnalitik(db: SupabaseClient, f: Filter): Promise<{ metrics: Metrics; chart_series: TitikGrafik[] }> {
  // 1. Prioritaskan agregasi native di PostgreSQL via Supabase RPC (jauh lebih hemat memori & cepat).
  try {
    const { data: rpcData, error: rpcError } = await db.rpc("hitung_analitik_dashboard", {
      p_mulai: `${f.mulai}T00:00:00${WIB}`,
      p_selesai: batasAkhir(f.selesai),
      p_puskesmas: f.puskesmas_id ?? null,
      p_kelurahan: f.kelurahan_id ?? null,
    });
    if (!rpcError && rpcData?.metrics) {
      return rpcData as { metrics: Metrics; chart_series: TitikGrafik[] };
    }
  } catch {
    // Fallback otomatis bila migrasi RPC belum di-push pada instance Supabase lokal/uji
  }

  // 2. Fallback in-memory untuk kompatibilitas lingkungan yang belum menjalankan migrasi
  const { data, error } = await terapkanFilter(
    db.from("tr_discharge").select("waktu_krs, status_kunjungan, status_kesehatan"),
    f,
  ).limit(10_000);
  if (error) throw error;
  const rows = data ?? [];

  const hitung = (k: "status_kunjungan" | "status_kesehatan", v: string) => rows.filter((r) => r[k] === v).length;
  const total = rows.length;
  const tepat = hitung("status_kunjungan", "VISITED_ON_TIME");

  const metrics: Metrics = {
    total_dipulangkan: total,
    kunjungan_tepat_waktu: tepat,
    persentase_tepat_waktu: total ? Math.round((tepat / total) * 1000) / 10 : 0,
    menunggu_kunjungan: hitung("status_kunjungan", "PENDING"),
    tidak_dikunjungi: hitung("status_kunjungan", "NOT_VISITED"),
    kunjungan_terlambat: hitung("status_kunjungan", "VISITED_LATE"),
    komplikasi: hitung("status_kesehatan", "KOMPLIKASI"),
    tanda_bahaya: hitung("status_kesehatan", "TANDA_BAHAYA"),
    meninggal: hitung("status_kesehatan", "MENINGGAL"),
    sehat: hitung("status_kesehatan", "SEHAT"),
    dirawat_kembali: hitung("status_kesehatan", "DIRAWAT_KEMBALI"),
  };

  // Satu titik per hari pada rentang filter, termasuk hari tanpa data.
  const perHari = new Map<string, TitikGrafik>();
  for (let t = new Date(`${f.mulai}T00:00:00${WIB}`); tanggalWIB(t) <= f.selesai; t = new Date(t.getTime() + 86_400_000)) {
    const tanggal = tanggalWIB(t);
    perHari.set(tanggal, { tanggal, dipulangkan: 0, tepat_waktu: 0, tidak_kunjungan: 0, terlambat: 0 });
  }
  for (const r of rows) {
    const titik = perHari.get(tanggalWIB(r.waktu_krs));
    if (!titik) continue;
    titik.dipulangkan++;
    if (r.status_kunjungan === "VISITED_ON_TIME") titik.tepat_waktu++;
    if (r.status_kunjungan === "NOT_VISITED") titik.tidak_kunjungan++;
    if (r.status_kunjungan === "VISITED_LATE") titik.terlambat++;
  }

  return { metrics, chart_series: [...perHari.values()] };
}

// Kategori tab detail = indikator PRD 8.1; nilainya kolom & status yang difilter.
export const KATEGORI = {
  tepat_waktu: ["status_kunjungan", "VISITED_ON_TIME"],
  tidak_dikunjungi: ["status_kunjungan", "NOT_VISITED"],
  terlambat: ["status_kunjungan", "VISITED_LATE"],
  menunggu: ["status_kunjungan", "PENDING"],
  komplikasi: ["status_kesehatan", "KOMPLIKASI"],
  tanda_bahaya: ["status_kesehatan", "TANDA_BAHAYA"],
  meninggal: ["status_kesehatan", "MENINGGAL"],
  sehat: ["status_kesehatan", "SEHAT"],
  dirawat_kembali: ["status_kesehatan", "DIRAWAT_KEMBALI"],
} as const;
export type Kategori = keyof typeof KATEGORI;

export async function ambilDaftarPasien(db: SupabaseClient, f: Filter, batas = 100, kategori?: Kategori) {
  let q = terapkanFilter(
    db
      .from("tr_discharge")
      .select("id, nama_ibu, alamat_lengkap, no_whatsapp_ibu, waktu_krs, deadline_sla, status_kunjungan, status_kesehatan, token_kunjungan, kelurahan:m_kelurahan(nama_kelurahan)"),
    f,
  );
  if (kategori) q = q.eq(KATEGORI[kategori][0], KATEGORI[kategori][1]);
  const { data, error } = await q.order("waktu_krs", { ascending: false }).limit(batas).returns<BarisPasien[]>();
  if (error) throw error;
  return data ?? [];
}

export async function ambilAlertAktif(db: SupabaseClient) {
  const { data, error } = await db
    .from("tr_emergency_alert")
    .select("id, jenis_masalah, waktu_laporan, discharge:tr_discharge(id, nama_ibu, alamat_lengkap, no_whatsapp_ibu)")
    .eq("is_resolved", false)
    .order("waktu_laporan", { ascending: false })
    .returns<AlertAktif[]>();
  if (error) throw error;
  return data ?? [];
}
