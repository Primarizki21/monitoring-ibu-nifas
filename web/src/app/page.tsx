import Link from "next/link";
import { LogIn, MapPinned, Smartphone, Stethoscope, Zap } from "lucide-react";
import { Logo } from "@/components/aset/logo";
import { AlurKunjungan } from "@/components/landing/alur";
import { HeroAdegan } from "@/components/landing/hero";
import { AvatarPeran, IkonTandaBahaya } from "@/components/landing/ilustrasi-landing";
import { PonselBidan } from "@/components/landing/ponsel";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "SIM-Nifas Surabaya: kunjungan rumah ibu nifas dalam 48 jam",
  description: "Rumah sakit, Puskesmas, dan bidan kelurahan di Surabaya memantau ibu nifas dari hari kepulangan sampai kontrol ulang.",
};

const PERAN = [
  { avatar: "bidan-rs", nama: "Bidan rumah sakit", tugas: "Mengisi data kepulangan, diagnosis, dan anjuran perawatan saat ibu keluar RS." },
  { avatar: "bidan-kelurahan", nama: "Bidan kelurahan", tugas: "Menerima tugas lewat WhatsApp, berkunjung ke rumah, dan mengirim laporan dari ponsel." },
  { avatar: "kepala-puskesmas", nama: "Kepala Puskesmas", tugas: "Mengawasi kunjungan di wilayahnya dan menerima eskalasi bila ada keterlambatan atau bahaya." },
  { avatar: "dinkes", nama: "Dinas Kesehatan", tugas: "Melihat capaian seluruh kota dan data untuk audit maternal perinatal." },
  { avatar: "ibu", nama: "Ibu nifas", tugas: "Menerima jadwal kontrol, nomor bidan pendamping, dan edukasi tanda bahaya lewat WhatsApp." },
] as const;

const TANDA = [
  { tanda: "demam", label: "Demam lebih dari 38 °C" },
  { tanda: "perdarahan", label: "Perdarahan banyak dari jalan lahir" },
  { tanda: "nyeri-perut", label: "Nyeri hebat di perut" },
  { tanda: "luka", label: "Luka jahitan berbau atau bernanah" },
  { tanda: "pusing", label: "Pusing berat, muntah, atau lemas" },
] as const;

const WILAYAH = [
  { kecamatan: "Bubutan", puskesmas: 3, rs: 2 },
  { kecamatan: "Gubeng", puskesmas: 2, rs: 5 },
  { kecamatan: "Kenjeran", puskesmas: 3, rs: 3 },
  { kecamatan: "Mulyorejo", puskesmas: 1, rs: 1 },
  { kecamatan: "Simokerto", puskesmas: 3, rs: 2 },
  { kecamatan: "Tambaksari", puskesmas: 3, rs: 2 },
];

export default async function Beranda() {
  // Cukup cek sesi secara lokal; beranda publik tidak perlu menunggu query profil.
  const { data } = await (await createClient()).auth.getClaims();
  const masuk = data?.claims ? { href: "/dashboard", label: "Buka SIM-Nifas" } : { href: "/login", label: "Masuk" };

  return (
    <>
      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-4">
        <nav className="kaca mx-auto flex max-w-7xl items-center gap-6 rounded-2xl px-4 py-2.5" aria-label="Utama">
          <Logo />
          <div className="hidden gap-1 text-sm font-medium text-tinta-redup md:flex">
            <a href="#alur" className="rounded-lg px-3 py-2 hover:bg-white/60 hover:text-selat">Alur 48 jam</a>
            <a href="#peran" className="rounded-lg px-3 py-2 hover:bg-white/60 hover:text-selat">Siapa saja terlibat</a>
            <a href="#tanda-bahaya" className="rounded-lg px-3 py-2 hover:bg-white/60 hover:text-selat">Tanda bahaya</a>
          </div>
          <Link href={masuk.href} className="btn-primary ml-auto px-4 py-2.5 text-sm">
            <LogIn className="size-4" aria-hidden="true" />
            {masuk.label}
          </Link>
        </nav>
      </header>

      <main className="overflow-x-clip">
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-3 pb-16 pt-10 sm:px-4 lg:pt-16">
          <div className="grid gap-6 px-1 lg:grid-cols-[1.25fr_1fr] lg:items-end lg:gap-12">
            <h1 className="max-w-[16ch] text-balance font-display text-4xl font-semibold leading-[1.04] tracking-tight text-selat-tua sm:text-5xl lg:text-6xl">
              Dari ruang bersalin ke ruang tamu ibu, dalam 48 jam.
            </h1>
            <div className="space-y-5 pb-1">
              <p className="max-w-[46ch] text-lg text-tinta-redup">
                Saat ibu pulang dari rumah sakit, bidan kelurahannya langsung tahu. SIM-Nifas mengantar data kepulangan ke Puskesmas, mengingatkan kunjungan rumah, dan membunyikan tanda bahaya.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={masuk.href} className="btn-primary">
                  {masuk.label}
                </Link>
                <a href="#alur" className="btn-secondary">
                  Lihat cara kerjanya
                </a>
              </div>
            </div>
          </div>
          <div className="mt-10">
            <HeroAdegan />
          </div>
        </section>

        {/* Mengapa */}
        <section className="mx-auto max-w-7xl px-3 pb-20 sm:px-4">
          <div className="kaca grid gap-6 rounded-[2rem] p-6 sm:p-8 md:grid-cols-3">
            <Fakta angka="90,9%" isi="kematian ibu di Surabaya tahun 2024 terjadi pada masa nifas." />
            <Fakta angka="100%" isi="ibu nifas di RS tipe B yang diteliti belum mendapat perencanaan pulang yang terhubung ke Puskesmas." />
            <Fakta angka="10,81%" isi="ibu nifas tidak datang kontrol ulang setelah pulang." />
            <p className="text-xs text-tinta-redup md:col-span-3">Sumber: data kesehatan Kota Surabaya 2024 dan studi pendahuluan 2025 di rumah sakit tipe B Kota Surabaya.</p>
          </div>
        </section>

        {/* Alur */}
        <section id="alur" className="scroll-mt-24 mx-auto grid max-w-7xl gap-10 px-3 pb-24 sm:px-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="px-1 lg:sticky lg:top-28 lg:self-start">
            <h2 className="max-w-[18ch] font-display text-3xl font-semibold tracking-tight text-selat-tua sm:text-4xl">Apa yang terjadi setelah ibu pulang</h2>
            <p className="mt-3 max-w-[44ch] text-tinta-redup">
              Setiap kepulangan memulai hitungan 48 jam. Sistem yang menjaga hitungan itu, supaya tidak ada ibu yang terlewat di antara rumah sakit dan Puskesmas.
            </p>
          </div>
          <AlurKunjungan />
        </section>

        {/* Ponsel bidan */}
        <section className="mx-auto max-w-7xl px-3 pb-24 sm:px-4">
          <div className="kaca grid items-center gap-10 overflow-hidden rounded-[2.25rem] p-6 sm:p-10 lg:grid-cols-[auto_1fr] lg:gap-16 lg:p-14">
            <PonselBidan className="mx-auto" />
            <div>
              <h2 className="max-w-[20ch] font-display text-3xl font-semibold tracking-tight text-selat-tua sm:text-4xl">Laporan kunjungan cukup dari tautan WhatsApp</h2>
              <ul className="mt-6 space-y-5">
                <Fitur ikon={<Smartphone className="size-5" />} judul="Tanpa perlu masuk akun">
                  Tautan di pesan WhatsApp langsung membuka formulir pasien yang benar. Berlaku 7 hari dan hanya bisa dikirim sekali.
                </Fitur>
                <Fitur ikon={<Stethoscope className="size-5" />} judul="Pemeriksaan singkat, tombol besar">
                  Suhu tubuh, empat tanda bahaya, dan hasil kunjungan. Nyaman diisi dengan satu tangan di teras rumah ibu.
                </Fitur>
                <Fitur ikon={<Zap className="size-5" />} judul="Triase langsung saat disimpan">
                  Suhu di atas 38 °C atau satu tanda bahaya saja sudah cukup untuk mengirim peringatan darurat ke Kepala Puskesmas.
                </Fitur>
              </ul>
            </div>
          </div>
        </section>

        {/* Peran */}
        <section id="peran" className="scroll-mt-24 mx-auto max-w-7xl px-3 pb-24 sm:px-4">
          <h2 className="px-1 font-display text-3xl font-semibold tracking-tight text-selat-tua sm:text-4xl">Siapa saja terlibat</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PERAN.map((p) => (
              <article key={p.nama} className="kaca rounded-[var(--radius-kaca)] p-5">
                <AvatarPeran peran={p.avatar} className="size-20" />
                <h3 className="mt-4 font-display text-lg font-semibold">{p.nama}</h3>
                <p className="mt-1 text-sm text-tinta-redup">{p.tugas}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Tanda bahaya */}
        <section id="tanda-bahaya" className="scroll-mt-24 mx-auto max-w-7xl px-3 pb-24 sm:px-4">
          <div className="overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-selat to-selat-tua p-6 text-white shadow-[0_40px_80px_-40px_rgb(10_52_64/0.9)] sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:items-center">
              <div>
                <h2 className="max-w-[16ch] font-display text-3xl font-semibold tracking-tight sm:text-4xl">Lima tanda bahaya nifas</h2>
                <p className="mt-3 max-w-[44ch] text-white/80">
                  Pesan ini dikirim ke setiap ibu saat pulang. Bila salah satu muncul, segera hubungi bidan atau datang ke fasilitas kesehatan terdekat.
                </p>
              </div>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {TANDA.map((t) => (
                  <li key={t.tanda} className="kaca-gelap flex flex-col items-center gap-3 rounded-2xl p-4 text-center">
                    <IkonTandaBahaya tanda={t.tanda} className="size-16" />
                    <span className="text-sm font-medium leading-snug">{t.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Wilayah */}
        <section className="mx-auto max-w-7xl px-3 pb-24 sm:px-4">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:items-center">
            <div className="px-1">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-selat-tua sm:text-4xl">Enam kecamatan percontohan</h2>
              <p className="mt-3 max-w-[44ch] text-tinta-redup">Uji coba dimulai di wilayah utara dan timur Surabaya, menghubungkan 15 Puskesmas dengan 15 rumah sakit rujukan.</p>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {WILAYAH.map((w) => (
                <li key={w.kecamatan} className="kaca flex items-start gap-3 rounded-2xl p-4">
                  <MapPinned className="mt-0.5 size-5 shrink-0 text-kunyit-tua" aria-hidden="true" />
                  <div>
                    <p className="font-display text-lg font-semibold leading-tight">{w.kecamatan}</p>
                    <p className="text-sm text-tinta-redup">
                      {w.puskesmas} Puskesmas, {w.rs} RS
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-3 pb-12 sm:px-4">
          <div className="kaca flex flex-col items-start gap-5 rounded-[2rem] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h2 className="font-display text-2xl font-semibold text-tinta">Petugas kesehatan di wilayah percontohan?</h2>
              <p className="text-tinta-redup">Masuk dengan akun dari Dinas Kesehatan. Bidan kelurahan cukup membuka tautan dari WhatsApp.</p>
            </div>
            <Link href={masuk.href} className="btn-primary shrink-0">
              <LogIn className="size-4" aria-hidden="true" />
              {masuk.label}
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-10 pt-4 text-sm text-tinta-redup">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-selat/10 pt-6">
          <Logo />
          <p>Prototipe program pengabdian masyarakat untuk pemantauan ibu nifas Kota Surabaya.</p>
        </div>
      </footer>
    </>
  );
}

function Fakta({ angka, isi }: { angka: string; isi: string }) {
  return (
    <div>
      <p className="font-display text-4xl font-semibold tabular-nums text-selat-tua">{angka}</p>
      <p className="mt-1 max-w-[34ch] text-tinta-redup">{isi}</p>
    </div>
  );
}

function Fitur({ ikon, judul, children }: { ikon: React.ReactNode; judul: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-kunyit/20 text-kunyit-tua" aria-hidden="true">
        {ikon}
      </span>
      <div>
        <h3 className="font-semibold text-tinta">{judul}</h3>
        <p className="text-tinta-redup">{children}</p>
      </div>
    </li>
  );
}
