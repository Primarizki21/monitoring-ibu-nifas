"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { House, MessageCircle } from "lucide-react";
import { AdeganSubuh } from "./adegan-subuh";

// Adegan subuh + dua gelembung cerita: tugas masuk saat bidan berangkat, kabar tiba saat sampai di rumah ibu.
export function HeroAdegan() {
  const tenang = useReducedMotion();
  const [tiba, setTiba] = useState(Boolean(tenang));

  return (
    <div className="relative">
      <div className="kaca overflow-hidden rounded-[2.25rem] p-1.5">
        {/* Di layar sempit adegan dibuat lebih tinggi dan dipotong ke kanan: rumah ibu & bidan tetap terlihat. */}
        <AdeganSubuh className="block h-[26rem] w-full rounded-[1.9rem] sm:h-auto" potong="xMaxYMax slice" onTiba={() => setTiba(true)} />
      </div>

      <AnimatePresence mode="wait">
        {!tiba ? (
          <motion.div
            key="berangkat"
            initial={tenang ? false : { opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ delay: tenang ? 0 : 0.9, type: "spring", stiffness: 220, damping: 20 }}
            className="kaca absolute left-4 top-4 flex max-w-[14rem] items-start gap-2.5 rounded-2xl p-2.5 sm:left-6 sm:top-6 sm:max-w-[16rem] sm:p-3"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#25d366] text-white">
              <MessageCircle className="size-4" aria-hidden="true" />
            </span>
            <p className="text-xs leading-snug sm:text-sm">
              <span className="block font-semibold">Tugas kunjungan baru</span>
              <span className="text-tinta-redup">Ibu Dewi pulang dari RSUD Dr. Soetomo pukul 05.10</span>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="tiba"
            initial={tenang ? false : { opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            className="kaca absolute right-4 top-4 flex max-w-[14rem] items-start gap-2.5 rounded-2xl p-2.5 sm:right-6 sm:top-6 sm:max-w-[16rem] sm:p-3"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sirih text-white">
              <House className="size-4" aria-hidden="true" />
            </span>
            <p className="text-xs leading-snug sm:text-sm">
              <span className="block font-semibold">Bidan tiba di rumah ibu</span>
              <span className="text-tinta-redup">Masih 17 jam sebelum batas kunjungan</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
