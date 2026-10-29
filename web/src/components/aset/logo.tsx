// Logo SIM-NIFAS: lengan ibu menggendong bayi, dikelilingi busur jam 2x24 jam.

export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="20" fill="none" stroke="#0f4c5c" strokeOpacity=".16" strokeWidth="4" />
      <path d="M24 4 A20 20 0 1 1 6.68 14" fill="none" stroke="#e9a23b" strokeWidth="4" strokeLinecap="round" />
      <circle cx="20" cy="17" r="4.6" fill="#0f4c5c" />
      <path d="M11.5 33.5 C 14 25.5 22.5 22.8 31 26.2 C 34.6 27.7 36.2 31 34.6 33.6 C 28 29.8 19.5 30 11.5 33.5 Z" fill="#0f4c5c" />
      <circle cx="28.4" cy="24.6" r="3.4" fill="#f4c7c3" stroke="#0f4c5c" strokeWidth="1.4" />
    </svg>
  );
}

export function Logo({ terang = false }: { terang?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="leading-none">
        <span className={`block font-display text-lg font-semibold tracking-tight ${terang ? "text-white" : "text-selat"}`}>SIM-Nifas</span>
        <span className={`block text-[11px] font-medium ${terang ? "text-white/70" : "text-tinta-redup"}`}>Kota Surabaya</span>
      </span>
    </span>
  );
}
