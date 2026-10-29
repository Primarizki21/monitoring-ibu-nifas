// Cincin SLA 2x24 jam: busur menyusut seiring waktu menuju batas kunjungan.
// Hanya dipakai di Server Component (waktu "sekarang" dihitung saat render).

const SLA_JAM = 48;

type Keadaan = { sisaJam: number; warna: string; teks: string; sub: string; porsi: number };

function hitung(waktuKrs: string, deadline: string, statusKunjungan: string, durasiJam?: number | null): Keadaan {
  if (statusKunjungan === "VISITED_ON_TIME" || statusKunjungan === "VISITED_LATE") {
    const jam = Number(durasiJam ?? 0);
    const tepat = statusKunjungan === "VISITED_ON_TIME";
    return {
      sisaJam: 0,
      warna: tepat ? "#5e8c61" : "#b7791f",
      teks: `${Math.round(jam)} j`,
      sub: "dikunjungi",
      porsi: Math.min(jam / SLA_JAM, 1),
    };
  }
  const sisa = (new Date(deadline).getTime() - Date.now()) / 3_600_000;
  if (sisa <= 0) {
    const lewat = (Date.now() - new Date(deadline).getTime()) / 3_600_000;
    return { sisaJam: 0, warna: "#c81e3a", teks: `+${Math.round(lewat)} j`, sub: "terlewat", porsi: 1 };
  }
  const total = (new Date(deadline).getTime() - new Date(waktuKrs).getTime()) / 3_600_000 || SLA_JAM;
  return {
    sisaJam: sisa,
    warna: sisa <= 6 ? "#c81e3a" : sisa <= 24 ? "#e9a23b" : "#0f4c5c",
    teks: sisa < 1 ? `${Math.max(1, Math.round(sisa * 60))} m` : `${Math.floor(sisa)} j`,
    sub: "tersisa",
    porsi: sisa / total,
  };
}

export function SlaRing({
  waktuKrs,
  deadline,
  statusKunjungan,
  durasiJam,
  ukuran = "besar",
}: {
  waktuKrs: string;
  deadline: string;
  statusKunjungan: string;
  durasiJam?: number | null;
  ukuran?: "besar" | "kecil";
}) {
  const k = hitung(waktuKrs, deadline, statusKunjungan, durasiJam);
  const r = 42;
  const keliling = 2 * Math.PI * r;
  const label =
    k.sub === "tersisa" ? `Sisa waktu kunjungan ${k.teks}` : k.sub === "terlewat" ? `Batas kunjungan terlewat ${k.teks}` : `Dikunjungi ${k.teks} setelah pulang`;

  const cincin = (
    <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#0f4c5c" strokeOpacity=".12" strokeWidth={ukuran === "besar" ? 9 : 12} />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={k.warna}
        strokeWidth={ukuran === "besar" ? 9 : 12}
        strokeLinecap="round"
        strokeDasharray={keliling}
        strokeDashoffset={keliling * (1 - Math.max(k.porsi, 0.02))}
        className="motion-safe:animate-[isi-cincin_900ms_ease-out]"
        style={{ ["--keliling" as string]: keliling }}
      />
    </svg>
  );

  if (ukuran === "kecil") {
    return (
      <span className="inline-flex items-center gap-2" title={label}>
        <span className="size-6 shrink-0">{cincin}</span>
        <span className="text-xs font-semibold tabular-nums" style={{ color: k.warna }}>
          {k.teks}
          <span className="sr-only"> {k.sub}</span>
        </span>
      </span>
    );
  }

  return (
    <div className="relative size-28 shrink-0" role="img" aria-label={label}>
      {cincin}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-semibold leading-none tabular-nums" style={{ color: k.warna }}>
          {k.teks}
        </span>
        <span className="mt-1 text-[11px] font-medium text-tinta-redup">{k.sub}</span>
      </div>
    </div>
  );
}
