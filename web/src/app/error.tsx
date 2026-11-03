"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";

// Batas galat per segmen: pengguna mendapat jalan keluar, bukan layar kosong Next.js.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("galat halaman", error.digest ?? "-", error.message);
  }, [error]);

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4">
      <div className="kaca w-full rounded-[2rem] p-6 text-center sm:p-8">
        <CircleAlert className="mx-auto size-10 text-red-700" aria-hidden="true" />
        <h1 className="mt-4 font-display text-2xl font-semibold text-tinta">Halaman gagal dimuat</h1>
        <p className="mt-2 text-sm text-tinta-redup">
          Data tidak berubah. Coba muat ulang; jika tetap gagal, hubungi admin Dinas Kesehatan.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-xl bg-selat px-5 py-2.5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-selat/40"
        >
          Coba lagi
        </button>
        {error.digest && <p className="mt-3 font-mono text-xs text-tinta-redup">Kode: {error.digest}</p>}
      </div>
    </main>
  );
}
