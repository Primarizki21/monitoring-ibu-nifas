import Link from "next/link";
import { IlustrasiJamPasir } from "@/components/aset/ilustrasi";
import { Logo } from "@/components/aset/logo";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="kaca w-full max-w-md space-y-4 rounded-[2rem] p-8 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <IlustrasiJamPasir className="mx-auto size-28" />
        <h1 className="font-display text-2xl font-semibold text-tinta">Halaman tidak ditemukan</h1>
        <p className="text-tinta-redup">
          Bila Anda membuka tautan laporan kunjungan dari WhatsApp, pastikan tautannya tersalin utuh. Tautan yang terpotong tidak bisa dibuka.
        </p>
        <Link href="/" className="btn-secondary">
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
