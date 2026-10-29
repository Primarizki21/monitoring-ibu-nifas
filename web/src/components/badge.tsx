// Skema warna badge PRD 8.3. Label teks selalu ada, jadi status tidak bergantung pada warna saja.
const WARNA = {
  hijau: "bg-emerald-50/80 text-emerald-800 ring-emerald-600/25 [--titik:#059669]",
  kuning: "bg-amber-50/80 text-amber-900 ring-amber-600/30 [--titik:#d97706]",
  merah: "bg-red-50/85 text-red-800 ring-red-600/30 [--titik:#dc2626]",
  biru: "bg-sky-50/80 text-sky-800 ring-sky-600/25 [--titik:#0284c7]",
  abu: "bg-white/60 text-tinta-redup ring-tinta/15 [--titik:#64748b]",
} as const;

const STATUS: Record<string, { label: string; warna: keyof typeof WARNA }> = {
  SEHAT: { label: "Sehat", warna: "hijau" },
  KOMPLIKASI: { label: "Komplikasi", warna: "kuning" },
  TANDA_BAHAYA: { label: "Tanda bahaya", warna: "merah" },
  DIRAWAT_KEMBALI: { label: "Dirawat kembali", warna: "biru" },
  MENINGGAL: { label: "Meninggal", warna: "merah" },
  PENDING: { label: "Menunggu kunjungan", warna: "abu" },
  VISITED_ON_TIME: { label: "Dikunjungi ≤ 48 jam", warna: "hijau" },
  VISITED_LATE: { label: "Dikunjungi > 48 jam", warna: "kuning" },
  NOT_VISITED: { label: "Tidak dikunjungi", warna: "merah" },
};

export function labelStatus(status: string) {
  return STATUS[status]?.label ?? status;
}

export function Badge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, warna: "abu" as const };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset backdrop-blur ${WARNA[s.warna]}`}>
      <span className="size-1.5 rounded-full bg-[var(--titik)]" aria-hidden="true" />
      {s.label}
    </span>
  );
}
