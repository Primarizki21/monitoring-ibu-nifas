"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

// Adegan hero: subuh di Surabaya. Matahari terbit di atas Selat Madura dan Jembatan Suramadu,
// bidan kelurahan bermotor menyusuri jalan kampung menuju rumah ibu nifas.

const SELAT = "#0f4c5c";
const SELAT_TUA = "#0a3440";
const KUNYIT = "#e9a23b";
const SIRIH = "#5e8c61";
const BLUSH = "#f4c7c3";
const KULIT = "#e9b9a1";
const GENTENG = "#b8705c";
const GENTENG_GELAP = "#93533f";

// Rumah kampung: dinding, atap genteng berlapis, jendela yang menyala hangat saat subuh.
function Rumah({ x, y, w, h, dinding, atap = GENTENG, pintu = SELAT, nyala = true }: { x: number; y: number; w: number; h: number; dinding: string; atap?: string; pintu?: string; nyala?: boolean }) {
  const puncak = y - h * 0.55;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={dinding} />
      <rect x={x} y={y} width={w} height={h * 0.12} fill="#000" opacity=".07" />
      <path d={`M${x - 10} ${y + 2} L${x + w / 2} ${puncak} L${x + w + 10} ${y + 2} Z`} fill={atap} />
      <path d={`M${x + w / 2} ${puncak} L${x + w + 10} ${y + 2} L${x + w / 2 + 6} ${y + 2} Z`} fill={GENTENG_GELAP} opacity=".55" />
      {[0.25, 0.5, 0.72].map((f) => {
        // Garis susunan genteng, dipotong tepat di dalam segitiga atap.
        const gy = y + 2 - f * (y + 2 - puncak);
        const lebar = (w / 2 + 10) * (1 - f);
        return <path key={f} d={`M${x + w / 2 - lebar} ${gy} H${x + w / 2 + lebar}`} stroke={GENTENG_GELAP} strokeOpacity=".4" strokeWidth="1.5" />;
      })}
      <rect x={x + w * 0.14} y={y + h * 0.28} width={w * 0.24} height={h * 0.26} rx="2" fill={nyala ? "#ffd98a" : "#cfe5df"} stroke={SELAT_TUA} strokeOpacity=".3" strokeWidth="2" />
      <path d={`M${x + w * 0.26} ${y + h * 0.28} V${y + h * 0.54}`} stroke={SELAT_TUA} strokeOpacity=".3" strokeWidth="2" />
      <rect x={x + w * 0.58} y={y + h * 0.36} width={w * 0.24} height={h * 0.64} rx="2" fill={pintu} />
      <circle cx={x + w * 0.62} cy={y + h * 0.7} r="1.8" fill={KUNYIT} />
    </g>
  );
}

function Pohon({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-4" y="-10" width="8" height="40" rx="3" fill="#6b4a3a" />
      <circle cx="0" cy="-30" r="30" fill={SIRIH} />
      <circle cx="-18" cy="-14" r="20" fill="#4f7a53" />
      <circle cx="16" cy="-12" r="22" fill="#6f9d70" />
      <circle cx="8" cy="-42" r="14" fill="#7fae7c" opacity=".8" />
    </g>
  );
}

function Kelapa({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0 C 4 -40 2 -80 10 -118" stroke="#7a5a45" strokeWidth="7" fill="none" strokeLinecap="round" />
      {[-60, -25, 10, 45, 80, 120].map((a) => (
        <path key={a} d="M10 -118 C 30 -126 50 -120 66 -104" stroke={SIRIH} strokeWidth="6" fill="none" strokeLinecap="round" transform={`rotate(${a} 10 -118)`} />
      ))}
    </g>
  );
}

function Perahu({ x, y, warna }: { x: number; y: number; warna: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-28 0 L28 0 L20 9 L-20 9 Z" fill={warna} />
      <path d="M0 0 V-30 L18 -4 Z" fill="#fff" opacity=".85" />
      <path d="M0 0 V-24 L-12 -4 Z" fill={BLUSH} opacity=".9" />
    </g>
  );
}

// Bidan berkerudung di atas skuter matik dengan tas kebidanan.
function BidanMotor({ putarRoda }: { putarRoda: boolean }) {
  const roda = (cx: number) => (
    <g>
      <circle cx={cx} cy="0" r="17" fill="#1f2a30" />
      <circle cx={cx} cy="0" r="9" fill="#9fb4ba" />
      <motion.g animate={putarRoda ? { rotate: 360 } : { rotate: 0 }} transition={putarRoda ? { repeat: Infinity, duration: 0.6, ease: "linear" } : { duration: 0.3 }}>
        <path d={`M${cx - 8} 0 H${cx + 8} M${cx} -8 V8`} stroke={SELAT_TUA} strokeWidth="2.5" />
      </motion.g>
    </g>
  );
  return (
    <g>
      <ellipse cx="0" cy="18" rx="58" ry="6" fill="#000" opacity=".18" />
      {roda(-38)}
      {roda(40)}
      {/* bodi skuter */}
      <path d="M-56 -6 C -56 -26 -34 -32 -10 -30 L 20 -30 C 30 -30 34 -24 36 -14 L 44 -6 C 50 -4 58 -2 58 6 L -50 6 C -56 6 -58 2 -56 -6 Z" fill={KUNYIT} />
      <path d="M-50 -10 C -40 -24 -20 -26 0 -24" stroke="#fff" strokeOpacity=".55" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M36 -14 L 46 -58" stroke="#3b4a50" strokeWidth="5" strokeLinecap="round" />
      <path d="M38 -58 H 56" stroke="#3b4a50" strokeWidth="5" strokeLinecap="round" />
      <circle cx="58" cy="-48" r="5" fill="#fff6d6" />
      {/* tas kebidanan */}
      <rect x="-60" y="-50" width="26" height="22" rx="4" fill="#fff" stroke={SELAT} strokeWidth="2" />
      <path d="M-47 -44 V-34 M-52 -39 H-42" stroke="#c81e3a" strokeWidth="3" strokeLinecap="round" />
      {/* bidan */}
      <path d="M-18 -30 C -22 -60 -14 -82 4 -86 C 20 -82 26 -62 22 -30 Z" fill="#f7fbfb" />
      <path d="M-6 -78 C 8 -70 20 -64 34 -58" stroke="#f7fbfb" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M-14 -30 C -10 -12 0 -4 14 -4" stroke={SELAT} strokeWidth="11" strokeLinecap="round" fill="none" />
      <circle cx="4" cy="-100" r="14" fill={KULIT} />
      <path d="M-12 -98 C -14 -118 6 -126 18 -114 C 22 -106 20 -94 14 -86 C 6 -82 -6 -84 -12 -98 Z" fill={SELAT} />
      <path d="M-12 -98 C -16 -86 -14 -76 -6 -70 L 10 -76 C 2 -80 -4 -88 -4 -96 Z" fill={SELAT} />
      <path d="M-14 -108 C -12 -124 10 -128 20 -114 L 20 -108 C 10 -116 -4 -116 -14 -108 Z" fill="#fff" opacity=".95" />
      <path d="M8 -86 q2 3 6 1" stroke={SELAT_TUA} strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
  );
}

export function AdeganSubuh({ className, onTiba, potong }: { className?: string; onTiba?: () => void; potong?: string }) {
  const tenang = useReducedMotion();
  const gerak = !tenang;
  const [tiba, setTiba] = useState(false);

  return (
    <svg viewBox="0 90 1200 610" preserveAspectRatio={potong} className={className} role="img" aria-label="Ilustrasi subuh di Surabaya: matahari terbit di atas Jembatan Suramadu, bidan bermotor menuju rumah ibu nifas di kampung">
      <defs>
        <linearGradient id="as-langit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3c9bf" />
          <stop offset=".45" stopColor="#fbe3cf" />
          <stop offset=".72" stopColor="#f6efe2" />
          <stop offset="1" stopColor="#d9ece9" />
        </linearGradient>
        <radialGradient id="as-matahari" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffe3a8" />
          <stop offset=".6" stopColor={KUNYIT} />
          <stop offset="1" stopColor="#d9862a" />
        </radialGradient>
        <radialGradient id="as-pendar" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffd88f" stopOpacity=".7" />
          <stop offset="1" stopColor="#ffd88f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="as-laut" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9d2cc" />
          <stop offset="1" stopColor="#4f8f98" />
        </linearGradient>
        <linearGradient id="as-pantulan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd88f" stopOpacity=".75" />
          <stop offset="1" stopColor="#ffd88f" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="as-jalan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5d6f75" />
          <stop offset="1" stopColor="#3f5157" />
        </linearGradient>
        <clipPath id="as-bingkai">
          <rect width="1200" height="700" rx="0" />
        </clipPath>
      </defs>

      <g clipPath="url(#as-bingkai)">
        <rect width="1200" height="700" fill="url(#as-langit)" />

        {/* Matahari terbit */}
        <motion.g
          initial={gerak ? { y: 90 } : false}
          animate={{ y: 0 }}
          transition={{ duration: 3.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.circle
            cx="830"
            cy="380"
            r="230"
            fill="url(#as-pendar)"
            animate={gerak ? { scale: [1, 1.06, 1] } : undefined}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          />
          <circle cx="830" cy="380" r="88" fill="url(#as-matahari)" />
        </motion.g>

        {/* Awan */}
        {[
          { x: 150, y: 190, s: 1, d: 70 },
          { x: 560, y: 150, s: 0.75, d: 90 },
          { x: 1000, y: 214, s: 0.9, d: 80 },
        ].map((a, i) => (
          <motion.g
            key={i}
            animate={gerak ? { x: [0, 60, 0] } : undefined}
            transition={{ repeat: Infinity, duration: a.d, ease: "easeInOut" }}
          >
            <g transform={`translate(${a.x} ${a.y}) scale(${a.s})`} opacity=".85">
              <ellipse cx="0" cy="0" rx="70" ry="20" fill="#fff" />
              <ellipse cx="-24" cy="-14" rx="36" ry="22" fill="#fff" />
              <ellipse cx="22" cy="-18" rx="30" ry="24" fill="#fff" />
              <ellipse cx="0" cy="6" rx="70" ry="10" fill="#f3c9bf" opacity=".5" />
            </g>
          </motion.g>
        ))}

        {/* Burung */}
        <motion.g
          initial={{ x: -120 }}
          animate={gerak ? { x: 1400 } : { x: 300 }}
          transition={{ repeat: Infinity, duration: 26, ease: "linear", delay: 1.5 }}
        >
          {[
            [0, 250],
            [26, 236],
            [48, 256],
          ].map(([bx, by], i) => (
            <motion.path
              key={i}
              d={`M${bx - 8} ${by} q8 -7 8 0 q0 -7 8 0`}
              stroke={SELAT_TUA}
              strokeOpacity=".6"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              animate={gerak ? { y: [0, -4, 0] } : undefined}
              transition={{ repeat: Infinity, duration: 0.9 + i * 0.15, ease: "easeInOut" }}
            />
          ))}
        </motion.g>

        {/* Jembatan Suramadu di kejauhan */}
        <g opacity=".42" stroke="#3f7783" fill="none" strokeLinecap="round">
          <path d="M470 452 C 640 440 1000 440 1220 452" strokeWidth="5" />
          {[760, 1000].map((px) => (
            <g key={px}>
              <path d={`M${px - 12} 452 L${px - 6} 330 L${px + 6} 330 L${px + 12} 452`} strokeWidth="5" />
              <path d={`M${px - 9} 380 H${px + 9}`} strokeWidth="3" />
              {[-150, -110, -70, -35, 35, 70, 110, 150].map((dx) => (
                <path key={dx} d={`M${px} 336 L${px + dx} ${447 - Math.abs(dx) * 0.02}`} strokeWidth="1.3" />
              ))}
            </g>
          ))}
          {Array.from({ length: 16 }, (_, i) => 500 + i * 46).map((kx) => (
            <path key={kx} d={`M${kx} 450 V468`} strokeWidth="3" />
          ))}
        </g>

        {/* Kota di kejauhan dan masjid kampung: adzan subuh */}
        <g fill="#b9cfcb" opacity=".75">
          <rect x="20" y="404" width="34" height="52" />
          <rect x="58" y="384" width="26" height="72" />
          <rect x="88" y="412" width="42" height="44" />
          <rect x="134" y="372" width="22" height="84" />
          <rect x="160" y="420" width="50" height="36" />
          <rect x="214" y="396" width="28" height="60" />
        </g>
        <g fill="#a7c2bd">
          <path d="M268 456 V420 C 268 398 284 386 300 384 C 316 386 332 398 332 420 V456 Z" />
          <rect x="262" y="418" width="76" height="38" />
          <rect x="350" y="356" width="10" height="100" />
          <path d="M346 360 L355 340 L364 360 Z" />
          <circle cx="300" cy="380" r="3" />
        </g>

        {/* Laut Selat Madura */}
        <rect y="456" width="1200" height="140" fill="url(#as-laut)" />
        <path d="M760 458 L 900 458 L 960 596 L 700 596 Z" fill="url(#as-pantulan)" />
        {[476, 500, 528, 558].map((wy, i) => (
          <motion.path
            key={wy}
            d={`M-1200 ${wy} ${Array(24).fill(`q 25 ${i % 2 ? -5 : -4} 50 0 t 50 0`).join(" ")}`}
            stroke="#fff"
            strokeOpacity={0.5 - i * 0.08}
            strokeWidth="1.8"
            fill="none"
            animate={gerak ? { x: [0, 200] } : undefined}
            transition={{ repeat: Infinity, duration: 9 + i * 3, ease: "linear" }}
          />
        ))}
        {[
          { x: 300, y: 494, w: SELAT, d: 0 },
          { x: 610, y: 516, w: "#b8705c", d: 1.2 },
          { x: 1080, y: 500, w: SELAT_TUA, d: 0.6 },
        ].map((p, i) => (
          <motion.g
            key={i}
            animate={gerak ? { y: [0, -3, 0], rotate: [-2, 2, -2] } : undefined}
            transition={{ repeat: Infinity, duration: 3.4, ease: "easeInOut", delay: p.d }}
          >
            <Perahu x={p.x} y={p.y} warna={p.w} />
          </motion.g>
        ))}

        {/* Tanggul & kampung */}
        <path d="M0 596 C 200 586 400 590 600 584 S 1000 580 1200 588 V700 H0 Z" fill="#cfe1d9" />
        <Kelapa x={70} y={600} />
        <Rumah x={130} y={520} w={110} h={82} dinding="#f3e6d8" />
        <Pohon x={286} y={580} s={0.85} />
        <Rumah x={320} y={532} w={92} h={70} dinding="#cfe5df" atap={GENTENG_GELAP} pintu="#6b4a3a" />
        <Rumah x={440} y={514} w={128} h={88} dinding="#f1cfc6" nyala={false} />
        <Pohon x={612} y={584} s={0.7} />
        <Rumah x={650} y={528} w={100} h={74} dinding="#f6efe2" pintu={SIRIH} />

        {/* Tiang & kabel listrik kampung */}
        <g stroke="#4b5d6a" strokeLinecap="round">
          {[250, 600, 880].map((tx) => (
            <g key={tx}>
              <path d={`M${tx} 618 V430`} strokeWidth="5" />
              <path d={`M${tx - 18} 442 H${tx + 18}`} strokeWidth="3" />
            </g>
          ))}
          <path d="M-20 450 Q 115 474 250 442 Q 425 470 600 442 Q 740 466 880 442 Q 1040 470 1220 446" strokeWidth="1.4" fill="none" opacity=".7" />
          <path d="M-20 458 Q 115 484 250 450 Q 425 480 600 450 Q 740 476 880 450 Q 1040 480 1220 454" strokeWidth="1.2" fill="none" opacity=".5" />
        </g>
        <motion.g
          animate={gerak ? { y: [0, -2, 0] } : undefined}
          transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
        >
          {[
            [400, 461],
            [412, 463],
          ].map(([bx, by]) => (
            <g key={bx}>
              <ellipse cx={bx} cy={by} rx="5" ry="3.5" fill={SELAT_TUA} />
              <circle cx={bx + 4} cy={by - 2} r="2.2" fill={SELAT_TUA} />
            </g>
          ))}
        </motion.g>

        {/* Pagar kampung */}
        <g stroke="#e8ddd0" strokeWidth="3">
          <path d="M120 604 H770" strokeWidth="2.5" />
          {Array.from({ length: 33 }, (_, i) => 122 + i * 20).map((fx) => (
            <path key={fx} d={`M${fx} 590 V606`} />
          ))}
        </g>

        {/* Rumah ibu nifas: tujuan kunjungan */}
        <Rumah x={930} y={500} w={140} h={102} dinding="#fff6ee" pintu={SIRIH} />
        <rect x="900" y="590" width="200" height="12" rx="3" fill="#a8c7bd" />
        <Kelapa x={1130} y={602} />
        <motion.g
          animate={gerak ? { y: [0, -10, 0] } : undefined}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        >
          <path d="M1000 410 C 1000 392 1012 382 1024 382 C 1036 382 1048 392 1048 410 C 1048 428 1024 452 1024 452 C 1024 452 1000 428 1000 410 Z" fill={BLUSH} stroke={SELAT} strokeWidth="3" />
          <path d="M1024 420 C 1016 412 1012 404 1018 399 C 1021 397 1024 399 1024 402 C 1024 399 1027 397 1030 399 C 1036 404 1032 412 1024 420 Z" fill="#c81e3a" />
        </motion.g>
        <motion.circle
          cx="1024"
          cy="470"
          r="16"
          fill="none"
          stroke={BLUSH}
          strokeWidth="3"
          animate={gerak ? { r: [16, 46], opacity: [0.9, 0] } : { opacity: 0 }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut" }}
        />

        {/* Jalan kampung */}
        <path d="M0 626 C 300 616 900 616 1200 626 V700 H0 Z" fill="url(#as-jalan)" />
        <path d="M-80 664 H1300" stroke="#f6efe2" strokeWidth="4" strokeDasharray="34 30" opacity=".7" />

        {/* Bidan bermotor: datang dari kiri, berhenti di depan rumah ibu */}
        <motion.g
          initial={gerak ? { x: -140 } : { x: 860 }}
          animate={{ x: 860 }}
          transition={{ duration: 7, ease: [0.33, 0, 0.2, 1], delay: 0.6 }}
          onAnimationComplete={() => {
            setTiba(true);
            onTiba?.();
          }}
        >
          <motion.g
            animate={gerak && !tiba ? { y: [0, -2, 0] } : { y: 0 }}
            transition={gerak && !tiba ? { repeat: Infinity, duration: 0.35, ease: "easeInOut" } : { duration: 0.2 }}
          >
            <g transform="translate(0 646) scale(1.35)">
              <BidanMotor putarRoda={gerak && !tiba} />
            </g>
          </motion.g>
        </motion.g>
      </g>
    </svg>
  );
}
