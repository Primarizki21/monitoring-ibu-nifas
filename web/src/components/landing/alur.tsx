"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { BellRing, ClipboardPlus, HeartPulse, House, Siren } from "lucide-react";

// Alur 48 jam (PRD bab 3). Ini memang urutan waktu, jadi penanda jam di garis waktu bermakna.
const LANGKAH = [
  { jam: "Jam 0", judul: "Bidan RS memulangkan ibu", isi: "Data KRS disimpan. Puskesmas pembina dan bidan kelurahan terkunci otomatis dari alamat ibu.", ikon: ClipboardPlus },
  { jam: "< 1 menit", judul: "WhatsApp terkirim", isi: "Bidan kelurahan menerima tugas dan tautan laporan. Ibu menerima jadwal kontrol dan 5 tanda bahaya.", ikon: BellRing },
  { jam: "Jam 24", judul: "Pengingat otomatis", isi: "Bila belum ada laporan, bidan diingatkan sisa waktu 24 jam.", ikon: HeartPulse },
  { jam: "≤ Jam 48", judul: "Kunjungan rumah", isi: "Bidan memeriksa suhu dan tanda bahaya, lalu mengirim laporan dari ponsel tanpa perlu masuk akun.", ikon: House },
  { jam: "Seketika", judul: "Red Alert bila ada bahaya", isi: "Kepala Puskesmas dan Dinkes menerima peringatan darurat. Lewat 48 jam tanpa laporan, kasus dieskalasi.", ikon: Siren },
];

export function AlurKunjungan() {
  const ref = useRef<HTMLOListElement>(null);
  const tenang = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const halus = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const tinggi = useTransform(halus, [0, 1], ["0%", "100%"]);

  return (
    <ol ref={ref} className="relative mx-auto max-w-3xl space-y-5 pl-14 sm:pl-20">
      <div className="absolute bottom-6 left-[1.35rem] top-6 w-1 rounded-full bg-selat/10 sm:left-[1.85rem]" aria-hidden="true">
        <motion.div className="w-full rounded-full bg-gradient-to-b from-kunyit to-sirih" style={{ height: tenang ? "100%" : tinggi }} />
      </div>
      {LANGKAH.map((l, i) => (
        <motion.li
          key={l.judul}
          className="relative"
          initial={tenang ? false : { opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span
            className={`absolute -left-14 top-3 grid size-11 place-items-center rounded-2xl text-white shadow-lg ring-4 ring-white/70 sm:-left-20 sm:size-[3.75rem] ${i === LANGKAH.length - 1 ? "bg-red-600" : "bg-selat"}`}
            aria-hidden="true"
          >
            <l.ikon className="size-5 sm:size-6" />
          </span>
          <div className="kaca rounded-[var(--radius-kaca)] p-5">
            <p className={`text-sm font-bold tabular-nums ${i === LANGKAH.length - 1 ? "text-red-700" : "text-kunyit-tua"}`}>{l.jam}</p>
            <h3 className="font-display text-xl font-semibold text-tinta">{l.judul}</h3>
            <p className="mt-1 text-tinta-redup">{l.isi}</p>
          </div>
        </motion.li>
      ))}
    </ol>
  );
}
