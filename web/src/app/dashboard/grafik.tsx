"use client";

import { CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Metrics, TitikGrafik } from "@/lib/data/dashboard";

// Warna seri sesuai PRD 8.2 (biru, hijau, oranye, ungu); urutan tetap, divalidasi untuk buta warna
// dengan legenda + garis putus-putus sebagai penanda kedua.
const SERI = [
  { key: "dipulangkan", nama: "Dipulangkan RS", warna: "#2563eb" },
  { key: "tepat_waktu", nama: "Dikunjungi ≤ 48 jam", warna: "#16a34a" },
  { key: "terlambat", nama: "Dikunjungi > 48 jam", warna: "#7c3aed" },
  { key: "tidak_kunjungan", nama: "Tidak dikunjungi", warna: "#ea580c", putus: true },
] as const;

const GAYA_TOOLTIP = {
  borderRadius: 14,
  fontSize: 13,
  border: "1px solid rgba(255,255,255,.8)",
  background: "rgba(255,255,255,.85)",
  backdropFilter: "blur(12px)",
  boxShadow: "0 16px 32px -16px rgba(15,76,92,.45)",
};

function labelTanggal(t: string) {
  return new Date(`${t}T00:00:00+07:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" });
}

export function GrafikTren({ data }: { data: TitikGrafik[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="#0f4c5c" strokeOpacity={0.08} vertical={false} />
        <XAxis dataKey="tanggal" tickFormatter={labelTanggal} tick={{ fontSize: 12, fill: "#4b5d6a" }} tickLine={false} axisLine={{ stroke: "#0f4c5c", strokeOpacity: 0.2 }} minTickGap={24} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#4b5d6a" }} tickLine={false} axisLine={false} />
        <Tooltip labelFormatter={(t) => labelTanggal(String(t))} contentStyle={GAYA_TOOLTIP} />
        <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, color: "#1d2b36", paddingTop: 8 }} />
        {SERI.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.nama}
            stroke={s.warna}
            strokeWidth={2}
            strokeDasharray={"putus" in s ? "5 4" : undefined}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

const STATUS = [
  { key: "sehat", nama: "Sehat", warna: "#16a34a" },
  { key: "komplikasi", nama: "Komplikasi", warna: "#d97706" },
  { key: "tanda_bahaya", nama: "Tanda bahaya", warna: "#dc2626" },
  { key: "dirawat_kembali", nama: "Dirawat kembali", warna: "#0284c7" },
  { key: "meninggal", nama: "Meninggal", warna: "#334155" },
] as const;

export function GrafikStatus({ metrics }: { metrics: Metrics }) {
  const total = STATUS.reduce((n, s) => n + metrics[s.key], 0);
  const data = STATUS.map((s) => ({ ...s, nilai: metrics[s.key] }));

  if (!total) return <p className="py-16 text-center text-sm text-tinta-redup">Belum ada ibu yang dipulangkan pada periode ini.</p>;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative size-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="nilai" nameKey="nama" innerRadius="64%" outerRadius="100%" cornerRadius={4} paddingAngle={1.5} stroke="none" isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.key} fill={d.warna} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [`${v} orang`]} contentStyle={GAYA_TOOLTIP} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-semibold tabular-nums text-selat-tua">{total}</span>
          <span className="text-xs text-tinta-redup">ibu nifas</span>
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.warna }} />
            <span className="flex-1 text-tinta">{d.nama}</span>
            <span className="font-display text-lg font-semibold tabular-nums">{d.nilai}</span>
            <span className="w-14 text-right tabular-nums text-tinta-redup">{((d.nilai / total) * 100).toFixed(1).replace(".", ",")}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
