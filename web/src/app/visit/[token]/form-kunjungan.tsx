"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ClipboardCheck, Droplet, Siren, Thermometer, TriangleAlert } from "lucide-react";
import { IlustrasiSelesai } from "@/components/aset/ilustrasi";
import { Bagian, Field } from "@/components/form";
import { kunjunganSchema } from "@/lib/validasi";

type Input = z.input<typeof kunjunganSchema>;
type Output = z.output<typeof kunjunganSchema>;

const GEJALA = [
  ["perdarahan_abnormal", "Perdarahan banyak dari jalan lahir"],
  ["nyeri_perut_hebat", "Nyeri hebat di perut"],
  ["luka_berbau_infeksi", "Luka jahitan berbau / bernanah"],
  ["pusing_muntah_lemas", "Pusing berat, muntah, atau lemas ekstrem"],
] as const;

export function FormKunjungan({ token, jadwalKontrol }: { token: string; jadwalKontrol: string }) {
  const router = useRouter();
  const [errorServer, setErrorServer] = useState("");
  const [hasil, setHasil] = useState<{ darurat: boolean } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Input, unknown, Output>({
    resolver: zodResolver(kunjunganSchema),
    defaultValues: {
      token_kunjungan: token,
      perdarahan_abnormal: false,
      nyeri_perut_hebat: false,
      luka_berbau_infeksi: false,
      pusing_muntah_lemas: false,
      konfirmasi_jadwal_kontrol: jadwalKontrol,
    },
  });

  const suhu = watch("suhu_tubuh");
  const adaGejala = GEJALA.some(([k]) => watch(k));
  const demam = typeof suhu === "number" && suhu > 38;

  async function kirim(data: Output) {
    setErrorServer("");
    const res = await fetch("/api/v1/visit/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErrorServer(body.message ?? "Gagal mengirim laporan. Coba lagi.");
      return;
    }
    setHasil({ darurat: Boolean(body.data?.is_emergency_triggered) });
  }

  if (hasil) {
    const lihat = (
      <button className="btn-secondary mt-3 w-full" onClick={() => router.refresh()}>
        Lihat ringkasan laporan
      </button>
    );
    return hasil.darurat ? (
      <section role="alert" className="rounded-[2rem] bg-red-700/90 p-6 text-white shadow-[0_24px_48px_-20px_rgb(200_30_58/0.7)] ring-1 ring-white/20 backdrop-blur-xl">
        <Siren className="size-10" aria-hidden="true" />
        <h2 className="mt-3 font-display text-2xl font-semibold">Tanda bahaya tercatat</h2>
        <p className="mt-1 text-white/90">Kepala Puskesmas sudah menerima peringatan darurat. Tangani ibu di tempat atau dampingi rujukan ke IGD terdekat.</p>
        {lihat}
      </section>
    ) : (
      <section className="kaca rounded-[2rem] p-6 text-center">
        <IlustrasiSelesai className="mx-auto size-24" />
        <h2 className="mt-2 font-display text-2xl font-semibold">Laporan terkirim</h2>
        <p className="text-tinta-redup">Terima kasih. Data kunjungan sudah masuk ke dashboard Puskesmas.</p>
        {lihat}
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit(kirim)} className="space-y-4" noValidate>
      <Bagian judul="Tanda vital" ikon={Thermometer}>
        <Field label="Suhu tubuh (°C)" error={errors.suhu_tubuh?.message}>
          <input
            {...register("suhu_tubuh", { valueAsNumber: true })}
            type="number"
            step="0.1"
            inputMode="decimal"
            placeholder="36.8"
            className="input font-display text-2xl tabular-nums"
            aria-invalid={!!errors.suhu_tubuh}
          />
        </Field>
        {demam && <p className="flex items-center gap-2 text-sm font-semibold text-red-700"><TriangleAlert className="size-4" aria-hidden="true" />Suhu di atas 38 °C termasuk tanda bahaya.</p>}
      </Bagian>

      <Bagian judul="Tanda bahaya" ikon={Droplet}>
        <p className="-mt-1 text-sm text-tinta-redup">Centang yang ditemukan saat pemeriksaan.</p>
        {GEJALA.map(([k, label]) => (
          <label key={k} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl bg-white/55 px-4 py-3 font-medium ring-1 ring-white/80 transition-colors has-checked:bg-red-50/90 has-checked:text-red-800 has-checked:ring-red-300 has-focus-visible:ring-2 has-focus-visible:ring-selat/40">
            <input type="checkbox" {...register(k)} className="size-5 accent-red-600" />
            <span>{label}</span>
          </label>
        ))}
      </Bagian>

      <Bagian judul="Hasil kunjungan" ikon={ClipboardCheck}>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["BAIK", "Baik"],
              ["ADA_MASALAH", "Ada masalah"],
            ] as const
          ).map(([v, label]) => (
            <label key={v} className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white/55 p-3 font-semibold ring-1 ring-white/80 transition-colors has-checked:bg-selat has-checked:text-white has-checked:ring-selat has-focus-visible:ring-2 has-focus-visible:ring-kunyit">
              <input type="radio" value={v} {...register("status_hasil")} className="sr-only" />
              {label}
            </label>
          ))}
        </div>
        {errors.status_hasil && <p className="text-sm font-medium text-red-700">{errors.status_hasil.message}</p>}
        <Field label="Jadwal kontrol ulang" error={errors.konfirmasi_jadwal_kontrol?.message}>
          <input {...register("konfirmasi_jadwal_kontrol")} type="date" className="input" />
        </Field>
        <Field label="Catatan asuhan kebidanan">
          <textarea {...register("catatan_kebidanan")} rows={3} className="input" />
        </Field>
      </Bagian>

      {(demam || adaGejala) && (
        <p className="flex items-start gap-2 rounded-2xl bg-red-50/90 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          <Siren className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>Laporan ini akan memicu peringatan darurat (Red Alert) ke Kepala Puskesmas dan dashboard Dinkes.</span>
        </p>
      )}
      {errorServer && <p role="alert" className="rounded-2xl bg-red-50/90 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">{errorServer}</p>}

      <button type="submit" disabled={isSubmitting} className="btn-primary sticky bottom-3 w-full py-4 text-base">
        {isSubmitting ? "Menyimpan…" : "Simpan laporan kunjungan"}
      </button>
    </form>
  );
}
