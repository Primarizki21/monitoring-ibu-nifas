// Avatar peran dan ikon 5 tanda bahaya nifas untuk landing page.

const SELAT = "#0f4c5c";
const SELAT_TUA = "#0a3440";
const KUNYIT = "#e9a23b";
const SIRIH = "#5e8c61";
const BLUSH = "#f4c7c3";
const KULIT = "#e9b9a1";
const MERAH = "#c81e3a";

type Avatar = "bidan-rs" | "bidan-kelurahan" | "kepala-puskesmas" | "dinkes" | "ibu";

// Potret setengah badan dalam lingkaran kaca. Kerudung & seragam mengikuti peran.
export function AvatarPeran({ peran, className = "size-20" }: { peran: Avatar; className?: string }) {
  const latar = { "bidan-rs": "#d8ecea", "bidan-kelurahan": "#fbe3cf", "kepala-puskesmas": "#e3ecd9", dinkes: "#e6e1f0", ibu: "#f7d9d4" }[peran];
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill={latar} />
      <clipPath id={`av-${peran}`}>
        <circle cx="50" cy="50" r="48" />
      </clipPath>
      <g clipPath={`url(#av-${peran})`}>
        {peran === "bidan-rs" && (
          <>
            <path d="M16 104 C 18 76 32 66 50 66 C 68 66 82 76 84 104 Z" fill="#7fbfb7" />
            <path d="M40 66 L50 80 L60 66" fill="#fff" />
            <path d="M34 72 C 30 86 38 92 44 88" stroke={SELAT_TUA} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <circle cx="44" cy="88" r="3" fill={SELAT_TUA} />
            <Wajah kerudung="#ffffff" pinggir={SELAT} />
          </>
        )}
        {peran === "bidan-kelurahan" && (
          <>
            <path d="M16 104 C 18 76 32 66 50 66 C 68 66 82 76 84 104 Z" fill="#fff" />
            <path d="M26 82 L 62 104" stroke={KUNYIT} strokeWidth="6" />
            <rect x="60" y="80" width="20" height="16" rx="3" fill="#fff" stroke={SELAT} strokeWidth="2" />
            <path d="M70 84 V92 M66 88 H74" stroke={MERAH} strokeWidth="2.5" strokeLinecap="round" />
            <Wajah kerudung={SELAT} pinggir={SELAT_TUA} />
          </>
        )}
        {peran === "kepala-puskesmas" && (
          <>
            <path d="M16 104 C 18 76 32 66 50 66 C 68 66 82 76 84 104 Z" fill={SIRIH} />
            <path d="M42 66 L50 86 L58 66" fill="#f6efe2" />
            <rect x="60" y="78" width="12" height="4" rx="1" fill="#fff" opacity=".8" />
            <Wajah kerudung="#8a5a7a" pinggir="#6d4560" kacamata />
          </>
        )}
        {peran === "dinkes" && (
          <>
            <path d="M16 104 C 18 76 32 66 50 66 C 68 66 82 76 84 104 Z" fill="#5b4a8a" />
            {/* motif batik parang sederhana pada kemeja */}
            {[0, 1, 2, 3, 4].map((i) => (
              <path key={i} d={`M${20 + i * 14} 104 L${34 + i * 14} 72`} stroke={KUNYIT} strokeOpacity=".6" strokeWidth="3" />
            ))}
            <path d="M44 66 L50 76 L56 66" fill="#f6efe2" />
            <circle cx="50" cy="44" r="16" fill={KULIT} />
            <path d="M34 40 C 34 26 44 22 52 22 C 62 22 68 30 66 40 C 60 34 46 32 34 40 Z" fill="#2b2b2b" />
            <path d="M40 44 h6 M54 44 h6" stroke={SELAT_TUA} strokeWidth="2" strokeLinecap="round" />
            <rect x="38" y="40" width="10" height="8" rx="3" fill="none" stroke={SELAT_TUA} strokeWidth="1.5" />
            <rect x="52" y="40" width="10" height="8" rx="3" fill="none" stroke={SELAT_TUA} strokeWidth="1.5" />
            <path d="M45 53 q5 3 10 0" stroke={SELAT_TUA} strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        )}
        {peran === "ibu" && (
          <>
            <path d="M16 104 C 18 76 32 66 50 66 C 68 66 82 76 84 104 Z" fill={BLUSH} />
            <ellipse cx="54" cy="84" rx="20" ry="11" transform="rotate(-12 54 84)" fill="#fff" />
            <circle cx="70" cy="78" r="8" fill="#f2cdbd" stroke={SELAT} strokeWidth="1.5" />
            <Wajah kerudung="#c98b8b" pinggir="#a96d6d" />
          </>
        )}
      </g>
      <circle cx="50" cy="50" r="47" fill="none" stroke="#fff" strokeWidth="2.5" />
    </svg>
  );
}

function Wajah({ kerudung, pinggir, kacamata }: { kerudung: string; pinggir: string; kacamata?: boolean }) {
  return (
    <g>
      <path d="M28 52 C 26 30 38 18 50 18 C 62 18 74 30 72 52 C 72 64 64 72 50 74 C 36 72 28 64 28 52 Z" fill={kerudung} />
      <path d="M28 52 C 28 66 36 74 50 76 C 64 74 72 66 72 52 C 70 70 60 78 50 80 C 40 78 30 70 28 52 Z" fill={pinggir} opacity=".5" />
      <ellipse cx="50" cy="46" rx="14" ry="16" fill={KULIT} />
      <path d="M36 40 C 38 28 62 28 64 40 C 58 34 42 34 36 40 Z" fill={kerudung} />
      {kacamata ? (
        <g fill="none" stroke={SELAT_TUA} strokeWidth="1.5">
          <circle cx="44" cy="46" r="4.5" />
          <circle cx="56" cy="46" r="4.5" />
          <path d="M48.5 46 h3" />
        </g>
      ) : (
        <path d="M41 46 q3 2 6 0 M53 46 q3 2 6 0" stroke={SELAT_TUA} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      )}
      <path d="M45 54 q5 3.5 10 0" stroke="#b5574f" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="51" r="2.5" fill={BLUSH} opacity=".8" />
      <circle cx="60" cy="51" r="2.5" fill={BLUSH} opacity=".8" />
    </g>
  );
}

type Tanda = "demam" | "perdarahan" | "nyeri-perut" | "luka" | "pusing";

// Ikon tanda bahaya: garis selat dengan satu aksen merah pada bagian yang perlu diwaspadai.
export function IkonTandaBahaya({ tanda, className = "size-14" }: { tanda: Tanda; className?: string }) {
  const garis = { fill: "none", stroke: SELAT, strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#fff" opacity=".7" />
      {tanda === "demam" && (
        <>
          <path d="M28 14 a4 4 0 0 1 8 0 v22 a8 8 0 1 1 -8 0 Z" {...garis} />
          <path d="M32 22 V40" stroke={MERAH} strokeWidth="4" strokeLinecap="round" />
          <circle cx="32" cy="43" r="5" fill={MERAH} />
          <path d="M42 18 h6 M42 24 h4 M42 30 h6" {...garis} strokeWidth="2" />
        </>
      )}
      {tanda === "perdarahan" && (
        <>
          <path d="M32 12 C 32 12 18 28 18 38 a14 14 0 0 0 28 0 C 46 28 32 12 32 12 Z" fill={MERAH} />
          <path d="M26 38 a6 6 0 0 0 6 6" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".8" />
          <circle cx="47" cy="18" r="4" fill={MERAH} opacity=".6" />
        </>
      )}
      {tanda === "nyeri-perut" && (
        <>
          <path d="M20 20 C 16 32 18 46 32 50 C 46 46 48 32 44 20" {...garis} />
          <circle cx="32" cy="36" r="6" fill={MERAH} opacity=".85" />
          <path d="M32 26 v-6 M41 30 l5 -4 M23 30 l-5 -4 M42 40 l6 2 M22 40 l-6 2" stroke={MERAH} strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {tanda === "luka" && (
        <>
          <rect x="14" y="26" width="36" height="14" rx="7" transform="rotate(-20 32 33)" fill={BLUSH} stroke={SELAT} strokeWidth="3" />
          <path d="M26 34 l3 -3 m3 6 l3 -3 m3 6 l3 -3" stroke={MERAH} strokeWidth="2.5" strokeLinecap="round" transform="rotate(-20 32 33)" />
          <path d="M22 18 c 2 -4 6 -4 8 0 s 6 4 8 0" stroke={SIRIH} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M30 50 c 2 -4 6 -4 8 0 s 6 4 8 0" stroke={SIRIH} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {tanda === "pusing" && (
        <>
          <circle cx="32" cy="36" r="13" {...garis} />
          <path d="M27 34 l3 3 m0 -3 l-3 3 M35 34 l3 3 m0 -3 l-3 3" stroke={SELAT} strokeWidth="2" strokeLinecap="round" />
          <path d="M28 43 q4 -3 8 0" {...garis} strokeWidth="2" />
          <path d="M20 16 a5 5 0 1 1 6 6 a3 3 0 1 1 -3 -3" stroke={MERAH} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M40 14 a5 5 0 1 1 6 6 a3 3 0 1 1 -3 -3" stroke={MERAH} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
