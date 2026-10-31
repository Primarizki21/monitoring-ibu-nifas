import Link from "next/link";
import {
  Activity,
  Ban,
  BedDouble,
  ClipboardPlus,
  Clock4,
  FileText,
  HeartCrack,
  HeartPulse,
  Hospital,
  House,
  Info,
  PieChart,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import { IlustrasiRumah } from "@/components/aset/ilustrasi";
import { Badge } from "@/components/badge";
import { SlaRing } from "@/components/sla-ring";
import type { Role } from "@/lib/auth";
import type { AlertAktif, BarisPasien, Kategori, Metrics, TitikGrafik } from "@/lib/data/dashboard";
import { formatWaktu } from "@/lib/wa/template";
import { FilterDashboard } from "./filter";
import { GrafikStatus, GrafikTren } from "./grafik-wrapper";
import { RedAlert } from "./red-alert";

type Opsi = { id: string; nama: string };

export type DataTampilan = {
  nama: string;
  role: Role;
  cakupan: string;
  tab: "ringkasan" | "data";
  kategori?: Kategori;
  params: Record<string, string>;
  filter: { mulai: string; selesai: string };
  metrics: Metrics;
  chart_series: TitikGrafik[];
  pasien: BarisPasien[];
  alerts: AlertAktif[];
  puskesmas: Opsi[] | null;
  kelurahan: (Opsi & { puskesmas_id: string })[] | null;
};

const TARGET_CAKUPAN = 95; // KPI PRD 1.4

const WARNA = {
  biru: { kartu: "bg-sky-50/70 ring-sky-200/80", ikon: "bg-sky-600", teks: "text-sky-800" },
  hijau: { kartu: "bg-emerald-50/70 ring-emerald-200/80", ikon: "bg-emerald-600", teks: "text-emerald-800" },
  merah: { kartu: "bg-red-50/75 ring-red-200/80", ikon: "bg-red-600", teks: "text-red-800" },
  ungu: { kartu: "bg-violet-50/70 ring-violet-200/80", ikon: "bg-violet-600", teks: "text-violet-800" },
  kuning: { kartu: "bg-amber-50/75 ring-amber-200/80", ikon: "bg-amber-500", teks: "text-amber-900" },
  abu: { kartu: "bg-slate-100/70 ring-slate-300/70", ikon: "bg-slate-600", teks: "text-slate-800" },
  selat: { kartu: "bg-white/60 ring-white/80", ikon: "bg-selat", teks: "text-selat" },
} as const;

// 10 indikator PRD 8.1, urutan dan nomor mengikuti PRD.
function daftarIndikator(m: Metrics) {
  return [
    { judul: "Dipulangkan RS", nilai: m.total_dipulangkan, ikon: Hospital, warna: "biru" },
    { judul: "Kunjungan ≤ 2x24 jam", nilai: m.kunjungan_tepat_waktu, ikon: House, warna: "hijau", kategori: "tepat_waktu" },
    { judul: "Tidak dikunjungi", nilai: m.tidak_dikunjungi, ikon: Ban, warna: "merah", kategori: "tidak_dikunjungi" },
    { judul: "Kunjungan > 2x24 jam", nilai: m.kunjungan_terlambat, ikon: Clock4, warna: "ungu", kategori: "terlambat" },
    { judul: "Komplikasi", nilai: m.komplikasi, ikon: Activity, warna: "kuning", kategori: "komplikasi" },
    { judul: "Tanda bahaya nifas", nilai: m.tanda_bahaya, ikon: TriangleAlert, warna: "merah", kategori: "tanda_bahaya" },
    { judul: "Meninggal", nilai: m.meninggal, ikon: HeartCrack, warna: "abu", kategori: "meninggal" },
    { judul: "Sehat", nilai: m.sehat, ikon: HeartPulse, warna: "hijau", kategori: "sehat" },
    { judul: "Dirawat kembali", nilai: m.dirawat_kembali, ikon: BedDouble, warna: "biru", kategori: "dirawat_kembali" },
  ] as { judul: string; nilai: number; ikon: LucideIcon; warna: keyof typeof WARNA; kategori?: Kategori }[];
}

// Tautan yang mempertahankan filter tanggal/wilayah saat pindah tab atau kategori.
function tautan(params: Record<string, string>, ubah: Record<string, string | undefined>) {
  const p = new URLSearchParams(params);
  for (const [k, v] of Object.entries(ubah)) {
    if (v) p.set(k, v);
    else p.delete(k);
  }
  const s = p.toString();
  return s ? `/dashboard?${s}` : "/dashboard";
}

function persen(n: number, total: number) {
  return total ? `${((n / total) * 100).toFixed(1).replace(".", ",")}%` : "–";
}

export function TampilanDashboard(d: DataTampilan) {
  const sekarang = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <main className={`mx-auto max-w-7xl space-y-4 px-3 pt-6 sm:px-4 ${d.alerts.length ? "pb-24" : "pb-12"}`}>
      <section className="kaca rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-selat-muda">{d.cakupan}</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-selat-tua sm:text-3xl">Monitoring ibu nifas pasca keluar RS</h1>
            <p className="mt-1 text-sm text-tinta-redup">Data diperbarui {sekarang} WIB, otomatis setiap ada laporan baru.</p>
          </div>
          <FilterDashboard mulai={d.filter.mulai} selesai={d.filter.selesai} puskesmas={d.puskesmas} kelurahan={d.kelurahan} />
        </div>
        <nav className="mt-5 flex gap-1 rounded-2xl bg-white/45 p-1 ring-1 ring-white/70 sm:w-fit" aria-label="Tampilan dashboard">
          <TabLink href={tautan(d.params, { tab: undefined, kategori: undefined })} aktif={d.tab === "ringkasan"} ikon={PieChart}>
            Ringkasan
          </TabLink>
          <TabLink href={tautan(d.params, { tab: "data" })} aktif={d.tab === "data"} ikon={Users}>
            Data ibu nifas
          </TabLink>
        </nav>
      </section>

      {d.role === "BIDAN_RS" && d.tab === "ringkasan" && (
        <Link
          href="/krs"
          className="kaca flex items-center gap-4 rounded-[var(--radius-kaca)] p-4 transition-colors hover:bg-white/75 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-selat/20 sm:p-5"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-selat text-white" aria-hidden="true">
            <ClipboardPlus className="size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-lg font-semibold text-tinta">Pulangkan pasien</span>
            <span className="block text-sm text-tinta-redup">Isi data saat ibu keluar rumah sakit. Bidan kelurahan langsung mendapat tugas kunjungan.</span>
          </span>
          <span className="btn-primary hidden shrink-0 sm:inline-flex">Isi formulir</span>
        </Link>
      )}

      <RedAlert alerts={d.alerts} />

      {d.tab === "ringkasan" ? <Ringkasan {...d} /> : <TabData {...d} />}
    </main>
  );
}

function TabLink({ href, aktif, ikon: Ikon, children }: { href: string; aktif: boolean; ikon: LucideIcon; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={aktif ? "page" : undefined}
      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-tinta-redup transition-colors hover:text-selat aria-[current=page]:bg-white aria-[current=page]:text-selat aria-[current=page]:shadow-sm sm:flex-none"
    >
      <Ikon className="size-4" aria-hidden="true" />
      {children}
    </Link>
  );
}

function Ringkasan(d: DataTampilan) {
  const m = d.metrics;
  const t = m.total_dipulangkan;
  return (
    <>
      <section aria-label="Indikator utama" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {daftarIndikator(m).map((k, i) => {
          const w = WARNA[k.warna];
          return (
            <Link
              key={k.judul}
              href={tautan(d.params, { tab: "data", kategori: k.kategori })}
              className={`group rounded-2xl p-4 ring-1 backdrop-blur-xl transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-18px_rgb(15_76_92/0.5)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-selat/25 ${w.kartu}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`grid size-9 place-items-center rounded-xl text-white ${w.ikon}`} aria-hidden="true">
                  <k.ikon className="size-5" />
                </span>
                <span className="text-xs font-semibold tabular-nums text-tinta-redup">{i + 1}</span>
              </div>
              <p className="mt-3 min-h-[2.5rem] text-sm font-semibold leading-tight text-tinta">{k.judul}</p>
              <p className={`mt-1 font-display text-3xl font-semibold tabular-nums ${w.teks}`}>
                {k.nilai}
                <span className="ml-1 text-sm font-medium text-tinta-redup">orang</span>
              </p>
              <p className="text-xs tabular-nums text-tinta-redup">{i === 0 ? "pada periode ini" : `${persen(k.nilai, t)} dari yang dipulangkan`}</p>
            </Link>
          );
        })}
        <Link
          href={tautan(d.params, { tab: "data", kategori: undefined })}
          className="flex flex-col justify-between rounded-2xl bg-selat p-4 text-white shadow-[0_16px_32px_-18px_rgb(15_76_92/0.8)] transition-colors hover:bg-selat-tua focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-kunyit/50"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-white/15" aria-hidden="true">
              <FileText className="size-5" />
            </span>
            <span className="text-xs font-semibold text-white/70">10</span>
          </div>
          <p className="mt-3 text-sm font-semibold leading-tight">Data lengkap ibu nifas</p>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
            {t}
            <span className="ml-1 text-sm font-medium text-white/70">orang</span>
          </p>
          <p className="text-xs font-semibold text-kunyit">Lihat semua data</p>
        </Link>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="kaca flex flex-col rounded-[var(--radius-kaca)] p-5 sm:p-6">
          <JudulPanel ikon={<Activity className="size-4.5" />} judul="Tren harian" sub="Menurut tanggal pasien pulang dari rumah sakit" />
          {/* Grafik mengisi tinggi kolom kanan (donut + informasi penting). */}
          <div className="mt-4 h-72 lg:h-auto lg:min-h-72 lg:flex-1">
            <GrafikTren data={d.chart_series} />
          </div>
        </section>
        <div className="grid gap-4">
          <section className="kaca rounded-[var(--radius-kaca)] p-5 sm:p-6">
            <JudulPanel ikon={<HeartPulse className="size-4.5" />} judul="Status kesehatan ibu nifas" />
            <div className="mt-5">
              <GrafikStatus metrics={m} />
            </div>
          </section>
          <InformasiPenting m={m} />
        </div>
      </div>

      <TabelPasien
          pasien={d.pasien.slice(0, 6)}
          role={d.role}
          judul="Data ibu nifas terbaru"
          sub={`6 kepulangan terakhir dari ${t} pada periode ini`}
          aksi={
            <Link href={tautan(d.params, { tab: "data" })} className="btn-secondary px-3 py-2 text-sm">
              Lihat semua
            </Link>
          }
        />
    </>
  );
}

function InformasiPenting({ m }: { m: Metrics }) {
  const t = m.total_dipulangkan;
  const cakupan = t ? (m.kunjungan_tepat_waktu / t) * 100 : 0;
  return (
    <section className="rounded-[var(--radius-kaca)] bg-gradient-to-br from-blush/80 to-[#fbe3cf]/80 p-5 ring-1 ring-white/80 backdrop-blur-xl sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-selat-tua">
        <Info className="size-5 text-red-600" aria-hidden="true" />
        Informasi penting
      </h2>
      <p className="mt-3 rounded-xl bg-white/60 px-3 py-2 text-sm">
        Cakupan kunjungan ≤ 48 jam: <strong className="tabular-nums">{t ? `${cakupan.toFixed(1).replace(".", ",")}%` : "–"}</strong> dari target {TARGET_CAKUPAN}%.
        {t > 0 && cakupan < TARGET_CAKUPAN && ` Kurang ${Math.ceil((TARGET_CAKUPAN / 100) * t - m.kunjungan_tepat_waktu)} kunjungan tepat waktu.`}
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-tinta">
        <li>Kunjungan rumah ibu nifas dilakukan paling lambat 2x24 jam setelah pulang dari RS.</li>
        <li>Bila ada tanda bahaya, segera rujuk dan koordinasikan dengan Puskesmas atau RS terdekat.</li>
        <li>Perbarui status ibu yang dirawat kembali atau meninggal untuk keperluan audit maternal perinatal.</li>
      </ul>
    </section>
  );
}

const CHIP: { kategori?: Kategori; label: string; kunci: keyof Metrics }[] = [
  { label: "Semua", kunci: "total_dipulangkan" },
  { kategori: "menunggu", label: "Menunggu kunjungan", kunci: "menunggu_kunjungan" },
  { kategori: "tepat_waktu", label: "≤ 2x24 jam", kunci: "kunjungan_tepat_waktu" },
  { kategori: "terlambat", label: "> 2x24 jam", kunci: "kunjungan_terlambat" },
  { kategori: "tidak_dikunjungi", label: "Tidak dikunjungi", kunci: "tidak_dikunjungi" },
  { kategori: "tanda_bahaya", label: "Tanda bahaya", kunci: "tanda_bahaya" },
  { kategori: "komplikasi", label: "Komplikasi", kunci: "komplikasi" },
  { kategori: "dirawat_kembali", label: "Dirawat kembali", kunci: "dirawat_kembali" },
  { kategori: "meninggal", label: "Meninggal", kunci: "meninggal" },
  { kategori: "sehat", label: "Sehat", kunci: "sehat" },
];

// Tab detail: seluruh data ibu nifas, bisa dipersempit per indikator.
function TabData(d: DataTampilan) {
  const aktif = CHIP.find((c) => c.kategori === d.kategori) ?? CHIP[0];
  return (
    <>
      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Kategori data">
        {CHIP.map((c) => (
          <Link
            key={c.label}
            href={tautan(d.params, { tab: "data", kategori: c.kategori })}
            scroll={false}
            aria-current={c === aktif ? "true" : undefined}
            className="kaca-tipis inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-tinta transition-colors hover:bg-white/70 aria-[current=true]:bg-selat aria-[current=true]:text-white"
          >
            {c.label}
            <span className="rounded-full bg-black/5 px-1.5 text-xs font-semibold tabular-nums">{d.metrics[c.kunci]}</span>
          </Link>
        ))}
      </nav>
      <TabelPasien
        pasien={d.pasien}
        role={d.role}
        judul={aktif.kategori ? `Ibu nifas: ${aktif.label.toLowerCase()}` : "Semua data ibu nifas"}
        sub={`${d.pasien.length} pasien, kepulangan terbaru di atas`}
      />
    </>
  );
}

function JudulPanel({ ikon, judul, sub }: { ikon: React.ReactNode; judul: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-selat/10 text-selat" aria-hidden="true">
        {ikon}
      </span>
      <div>
        <h2 className="font-display text-lg font-semibold leading-tight text-tinta">{judul}</h2>
        {sub && <p className="text-sm text-tinta-redup">{sub}</p>}
      </div>
    </div>
  );
}

function TabelPasien({
  pasien,
  role,
  judul,
  sub,
  aksi,
}: {
  pasien: BarisPasien[];
  role: Role;
  judul: string;
  sub: string;
  aksi?: React.ReactNode;
}) {
  return (
    <section id="data-pasien" className="kaca overflow-hidden rounded-[var(--radius-kaca)]">
      <div className="flex flex-wrap items-center justify-between gap-2 p-5 sm:p-6">
        <JudulPanel ikon={<Users className="size-4.5" />} judul={judul} sub={sub} />
        {aksi}
      </div>
      {pasien.length === 0 ? (
        <div className="px-6 pb-10 text-center">
          <IlustrasiRumah className="mx-auto w-48" />
          <p className="mt-2 font-display text-lg font-semibold">Tidak ada ibu nifas pada pilihan ini</p>
          <p className="text-sm text-tinta-redup">Ubah rentang tanggal atau kategori di atas.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-y border-white/70 bg-white/35 text-xs text-tinta-redup">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Nama ibu</th>
                <th className="px-4 py-2.5 font-semibold">Alamat</th>
                <th className="px-4 py-2.5 font-semibold">WhatsApp</th>
                <th className="px-4 py-2.5 font-semibold">Pulang dari RS</th>
                <th className="px-4 py-2.5 font-semibold">Kunjungan</th>
                <th className="px-4 py-2.5 font-semibold">Kondisi</th>
                <th className="px-5 py-2.5 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/60">
              {pasien.map((p) => {
                const belum = p.status_kunjungan === "PENDING" || p.status_kunjungan === "NOT_VISITED";
                return (
                  <tr key={p.id} className="transition-colors hover:bg-white/45 [content-visibility:auto] [contain-intrinsic-size:auto_56px]">
                    <td className="px-5 py-3 font-semibold">{p.nama_ibu}</td>
                    <td className="max-w-56 px-4 py-3">
                      <span className="line-clamp-2">
                        {p.alamat_lengkap}
                        {p.kelurahan && <span className="text-tinta-redup">, {p.kelurahan.nama_kelurahan}</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{p.no_whatsapp_ibu}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-tinta-redup">{formatWaktu(p.waktu_krs)}</td>
                    <td className="px-4 py-3">
                      {belum ? (
                        <SlaRing waktuKrs={p.waktu_krs} deadline={p.deadline_sla} statusKunjungan={p.status_kunjungan} ukuran="kecil" />
                      ) : (
                        <Badge status={p.status_kunjungan} />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={p.status_kesehatan} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {role === "BIDAN_KELURAHAN" && belum && (
                          <Link href={`/visit/${p.token_kunjungan}`} className="rounded-lg bg-selat px-3 py-1.5 text-xs font-semibold text-white hover:bg-selat-tua">
                            Isi laporan
                          </Link>
                        )}
                        <Link href={`/dashboard/pasien/${p.id}`} className="rounded-lg bg-white/70 px-3 py-1.5 text-xs font-semibold text-selat ring-1 ring-white hover:bg-white">
                          Detail
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
