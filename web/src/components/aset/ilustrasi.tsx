// Ilustrasi SIM-NIFAS. Palet terbatas pada token tema: selat, kunyit, sirih, blush, kabut.

const SELAT = "#0f4c5c";
const KUNYIT = "#e9a23b";
const SIRIH = "#5e8c61";
const BLUSH = "#f4c7c3";
const KABUT = "#d8ecea";

type Props = { className?: string };

// Keadaan kosong: rumah dengan jalan setapak dan penanda lokasi kunjungan.
export function IlustrasiRumah({ className }: Props) {
  return (
    <svg viewBox="0 0 200 140" className={className} aria-hidden="true">
      <ellipse cx="100" cy="122" rx="86" ry="12" fill={KABUT} />
      <path d="M18 122 C 40 112 52 120 70 112" stroke={SELAT} strokeOpacity=".35" strokeWidth="2.5" strokeDasharray="2 7" strokeLinecap="round" fill="none" />
      <rect x="78" y="66" width="64" height="52" rx="4" fill="#fff" stroke={SELAT} strokeWidth="2.5" />
      <path d="M70 70 L110 38 L150 70" fill="none" stroke={SELAT} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="102" y="86" width="18" height="32" rx="3" fill={KUNYIT} />
      <rect x="86" y="78" width="12" height="12" rx="2" fill={KABUT} stroke={SELAT} strokeWidth="2" />
      <path d="M48 66 C 48 52 58 44 68 44 C 78 44 88 52 88 66 C 88 80 68 98 68 98 C 68 98 48 80 48 66 Z" transform="translate(-30 -6)" fill={BLUSH} stroke={SELAT} strokeWidth="2" />
      <circle cx="38" cy="59" r="6" fill="#fff" stroke={SELAT} strokeWidth="2" />
      <path d="M156 118 C 166 96 182 98 184 112 C 178 120 166 122 156 118 Z" fill={SIRIH} />
    </svg>
  );
}

// Laporan terkirim: lingkaran sirih dengan tanda centang.
export function IlustrasiSelesai({ className }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="50" fill={SIRIH} opacity=".15" />
      <circle cx="60" cy="60" r="36" fill={SIRIH} />
      <path d="M44 61 L55 72 L77 49" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="104" cy="26" r="5" fill={KUNYIT} />
      <circle cx="18" cy="88" r="4" fill={BLUSH} />
    </svg>
  );
}

// Tautan tidak berlaku: jam pasir dengan pasir kunyit yang sudah habis.
export function IlustrasiJamPasir({ className }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="50" fill={BLUSH} opacity=".35" />
      <path d="M38 22 H82 M38 98 H82" stroke={SELAT} strokeWidth="6" strokeLinecap="round" />
      <path d="M42 24 C 42 46 56 52 60 60 C 64 52 78 46 78 24 Z" fill="#fff" stroke={SELAT} strokeWidth="3" strokeLinejoin="round" />
      <path d="M42 96 C 42 74 56 68 60 60 C 64 68 78 74 78 96 Z" fill="#fff" stroke={SELAT} strokeWidth="3" strokeLinejoin="round" />
      <path d="M46 94 C 50 82 70 82 74 94 Z" fill={KUNYIT} />
      <circle cx="60" cy="72" r="1.8" fill={KUNYIT} />
    </svg>
  );
}
