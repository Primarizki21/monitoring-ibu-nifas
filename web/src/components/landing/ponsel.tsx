"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, MessageCircle } from "lucide-react";

// Mockup ponsel bidan: notifikasi WA masuk, cincin SLA menghitung mundur, laporan terkirim.
const ADEGAN_MS = [2600, 3600, 2800, 3000];

export function PonselBidan({ className = "" }: { className?: string }) {
  const tenang = useReducedMotion();
  const [langkah, setLangkah] = useState(tenang ? 2 : 0);

  useEffect(() => {
    if (tenang) return;
    const t = setTimeout(() => setLangkah((l) => (l + 1) % ADEGAN_MS.length), ADEGAN_MS[langkah]);
    return () => clearTimeout(t);
  }, [langkah, tenang]);

  const sisaJam = langkah === 0 ? 48 : langkah === 1 ? 17 : 17;
  const r = 34;
  const keliling = 2 * Math.PI * r;

  return (
    <div className={`relative w-[15.5rem] rounded-[2.4rem] bg-selat-tua/85 p-2.5 shadow-[0_40px_80px_-30px_rgb(10_52_64/0.8)] ring-1 ring-white/20 ${className}`} aria-hidden="true">
      <div className="relative h-[29rem] overflow-hidden rounded-[1.9rem] bg-gradient-to-b from-[#fbe6db] via-[#f4efe6] to-kabut">
        <div className="mx-auto mt-2 h-5 w-20 rounded-full bg-selat-tua/85" />
        <div className="flex items-center justify-between px-5 pt-2 text-[10px] font-semibold text-tinta-redup">
          <span>05.42</span>
          <span>4G</span>
        </div>

        <AnimatePresence>
          {langkah === 0 && (
            <motion.div
              key="wa"
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="kaca absolute inset-x-3 top-12 rounded-2xl p-3"
            >
              <div className="flex items-center gap-2 text-[10px] font-semibold text-tinta-redup">
                <span className="grid size-5 place-items-center rounded-md bg-[#25d366] text-white">
                  <MessageCircle className="size-3" />
                </span>
                WhatsApp, baru saja
              </div>
              <p className="mt-1.5 text-[12px] font-bold leading-snug text-tinta">Tugas kunjungan nifas baru</p>
              <p className="text-[11px] leading-snug text-tinta-redup">Ibu Dewi Lestari, Kel. Gundih. Kunjungi sebelum 31 Okt, 17.24.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="absolute inset-x-3 top-36 space-y-2.5"
          animate={{ y: langkah === 0 ? 40 : 0, opacity: langkah === 0 ? 0.35 : 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="kaca flex items-center gap-3 rounded-2xl p-3">
            <div className="relative size-16 shrink-0">
              <svg viewBox="0 0 80 80" className="size-full -rotate-90">
                <circle cx="40" cy="40" r={r} fill="none" stroke="#0f4c5c" strokeOpacity=".12" strokeWidth="8" />
                <motion.circle
                  cx="40"
                  cy="40"
                  r={r}
                  fill="none"
                  stroke={langkah >= 3 ? "#5e8c61" : "#e9a23b"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={keliling}
                  animate={{ strokeDashoffset: keliling * (1 - sisaJam / 48) }}
                  transition={{ duration: 2.4, ease: "easeInOut" }}
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                {langkah >= 3 ? (
                  <Check className="size-6 text-sirih" strokeWidth={3} />
                ) : (
                  <Hitung ke={sisaJam} />
                )}
              </div>
            </div>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold leading-tight">Dewi Lestari</p>
              <p className="text-[11px] text-tinta-redup">Post SC hari ke-3</p>
              <p className="mt-0.5 text-[10px] font-semibold text-kunyit-tua">{langkah >= 3 ? "Dikunjungi 31 jam setelah pulang" : "sisa waktu kunjungan"}</p>
            </div>
          </div>

          <div className="kaca space-y-1.5 rounded-2xl p-3">
            <p className="text-[11px] font-semibold text-tinta">Suhu tubuh</p>
            <div className="rounded-lg bg-white/85 px-2.5 py-1.5 font-display text-base font-semibold tabular-nums ring-1 ring-selat/15">
              {langkah >= 2 ? "36,8 °C" : <span className="text-tinta-redup/50">–</span>}
            </div>
            {["Perdarahan banyak", "Nyeri perut hebat", "Luka berbau"].map((g, i) => (
              <motion.div
                key={g}
                className="flex items-center gap-2 rounded-lg bg-white/60 px-2 py-1.5 text-[11px]"
                animate={{ opacity: langkah >= 2 ? 1 : 0.6 }}
                transition={{ delay: i * 0.15 }}
              >
                <span className="size-3.5 rounded border border-selat/30 bg-white" />
                {g}
              </motion.div>
            ))}
          </div>

          <motion.div
            className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold text-white"
            animate={{ backgroundColor: langkah >= 3 ? "#5e8c61" : "#0f4c5c", scale: langkah === 3 ? [1, 0.96, 1] : 1 }}
            transition={{ duration: 0.4 }}
          >
            {langkah >= 3 ? (
              <>
                <Check className="size-3.5" strokeWidth={3} /> Laporan terkirim
              </>
            ) : (
              "Simpan laporan kunjungan"
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// Angka jam yang turun bertahap mengikuti cincin.
function Hitung({ ke }: { ke: number }) {
  const [n, setN] = useState(48);
  useEffect(() => {
    if (n === ke) return;
    const t = setTimeout(() => setN((v) => (v > ke ? v - 1 : v + 1)), n > ke ? 70 : 20);
    return () => clearTimeout(t);
  }, [n, ke]);
  return (
    <span className="text-center leading-none">
      <span className="block font-display text-lg font-semibold tabular-nums text-selat-tua">{n}</span>
      <span className="block text-[9px] font-semibold text-tinta-redup">jam</span>
    </span>
  );
}
