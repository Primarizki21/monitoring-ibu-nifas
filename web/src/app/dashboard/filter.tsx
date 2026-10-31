"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";

type Opsi = { id: string; nama: string };

// Filter satu baris di atas dashboard. Mengubah URL -> server merender ulang data tanpa muat ulang halaman.
export function FilterDashboard({
  mulai,
  selesai,
  puskesmas,
  kelurahan,
}: {
  mulai: string;
  selesai: string;
  puskesmas: Opsi[] | null;
  kelurahan: (Opsi & { puskesmas_id: string })[] | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [memuat, startTransition] = useTransition();

  const pkmAktif = params.get("puskesmas_id") ?? "";
  const kelAktif = params.get("kelurahan_id") ?? "";

  function ubah(nilai: Record<string, string>) {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(nilai)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    startTransition(() => router.replace(`${pathname}?${p}`, { scroll: false }));
  }

  const kelurahanTampil = kelurahan?.filter((k) => !pkmAktif || k.puskesmas_id === pkmAktif) ?? [];

  return (
    <div className="kaca flex flex-wrap items-end gap-2.5 rounded-2xl p-2.5" aria-busy={memuat}>
      <label className="text-xs font-semibold text-tinta-redup">
        Dari
        <input type="date" value={mulai} max={selesai} onChange={(e) => ubah({ start_date: e.target.value })} className="input mt-1 py-2 text-sm" />
      </label>
      <label className="text-xs font-semibold text-tinta-redup">
        Sampai
        <input type="date" value={selesai} min={mulai} onChange={(e) => ubah({ end_date: e.target.value })} className="input mt-1 py-2 text-sm" />
      </label>
      {puskesmas && (
        <label className="text-xs font-semibold text-tinta-redup">
          Puskesmas
          <select value={pkmAktif} onChange={(e) => ubah({ puskesmas_id: e.target.value, kelurahan_id: "" })} className="input mt-1 py-2 text-sm">
            <option value="">Semua</option>
            {puskesmas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
        </label>
      )}
      {kelurahan && (
        <label className="text-xs font-semibold text-tinta-redup">
          Kelurahan
          <select value={kelAktif} onChange={(e) => ubah({ kelurahan_id: e.target.value })} className="input mt-1 py-2 text-sm">
            <option value="">Semua</option>
            {kelurahanTampil.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </label>
      )}
      {memuat && <LoaderCircle className="mb-2.5 size-5 animate-spin text-selat" aria-label="Memuat data" />}
    </div>
  );
}
