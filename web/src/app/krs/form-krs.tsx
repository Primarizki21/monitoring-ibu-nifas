"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { dischargeSchema } from "@/lib/validasi";
import { formatTanggal, formatWaktu } from "@/lib/wa/template";
import { CalendarCheck, House, ShieldAlert, Stethoscope, UserRound } from "lucide-react";
import { IlustrasiSelesai } from "@/components/aset/ilustrasi";
import { Bagian, Field } from "@/components/form";

export type Kelurahan = { id: string; nama_kelurahan: string; kecamatan: string };
type Input = z.input<typeof dischargeSchema>;
type Output = z.output<typeof dischargeSchema>;

type Hasil = { message: string; data: { deadline_sla: string } };

function hariIni() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

export function FormKrs({ kelurahan }: { kelurahan: Kelurahan[] }) {
  const [kecamatan, setKecamatan] = useState("");
  const [readmission, setReadmission] = useState<{ data: Output; waktu: string } | null>(null);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [errorServer, setErrorServer] = useState("");

  const daftarKecamatan = useMemo(() => [...new Set(kelurahan.map((k) => k.kecamatan))].sort(), [kelurahan]);
  const kelurahanTerpilih = kelurahan.filter((k) => k.kecamatan === kecamatan);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Input, unknown, Output>({
    resolver: zodResolver(dischargeSchema),
    defaultValues: { faskes_kunjungan_ulang: "PUSKESMAS", is_readmission: false },
  });

  async function kirim(data: Output) {
    setErrorServer("");
    const res = await fetch("/api/v1/discharge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => ({}));

    if (res.status === 409 && body.code === "KEMUNGKINAN_READMISSION") {
      setReadmission({ data, waktu: body.data.waktu_krs_sebelumnya });
      return;
    }
    if (!res.ok) {
      setErrorServer(body.message ?? "Terjadi kesalahan. Coba lagi.");
      return;
    }
    setReadmission(null);
    setHasil(body);
  }

  if (hasil) {
    return (
      <div className="kaca space-y-4 rounded-[2rem] p-6 text-center sm:p-8">
        <IlustrasiSelesai className="mx-auto size-24" />
        <h2 className="font-display text-2xl font-semibold">Pasien sudah dipulangkan</h2>
        <p className="mx-auto max-w-[48ch] text-tinta-redup">{hasil.message}</p>
        <p className="mx-auto max-w-sm rounded-2xl bg-kunyit/15 px-4 py-3 text-sm ring-1 ring-kunyit/30">
          Batas kunjungan rumah
          <strong className="mt-0.5 block font-display text-lg text-kunyit-tua">{formatWaktu(hasil.data.deadline_sla)}</strong>
        </p>
        <button
          className="btn-primary"
          onClick={() => {
            reset();
            setKecamatan("");
            setHasil(null);
          }}
        >
          Input pasien berikutnya
        </button>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit(kirim)} className="space-y-4" noValidate>
        <Bagian judul="Identitas ibu" ikon={UserRound}>
          <Field label="NIK" error={errors.nik?.message}>
            <input {...register("nik")} inputMode="numeric" maxLength={16} className="input tabular-nums tracking-wider" aria-invalid={!!errors.nik} />
          </Field>
          <Field label="Nama lengkap ibu" error={errors.nama_ibu?.message}>
            <input {...register("nama_ibu")} className="input" aria-invalid={!!errors.nama_ibu} />
          </Field>
          <Field label="Nomor WhatsApp aktif" error={errors.no_whatsapp_ibu?.message} hint="Contoh: 081234567890">
            <input {...register("no_whatsapp_ibu")} type="tel" inputMode="tel" className="input" aria-invalid={!!errors.no_whatsapp_ibu} />
          </Field>
        </Bagian>

        <Bagian judul="Alamat tinggal" ikon={House}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kecamatan">
              <select
                className="input"
                value={kecamatan}
                onChange={(e) => {
                  setKecamatan(e.target.value);
                  setValue("kelurahan_id", "");
                }}
              >
                <option value="">Pilih kecamatan</option>
                {daftarKecamatan.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </Field>
            <Field label="Kelurahan" error={errors.kelurahan_id && "Pilih kelurahan"}>
              <select {...register("kelurahan_id")} className="input" disabled={!kecamatan} aria-invalid={!!errors.kelurahan_id}>
                <option value="">Pilih kelurahan</option>
                {kelurahanTerpilih.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama_kelurahan}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Alamat lengkap" error={errors.alamat_lengkap?.message}>
            <textarea {...register("alamat_lengkap")} rows={2} className="input" aria-invalid={!!errors.alamat_lengkap} />
          </Field>
        </Bagian>

        <Bagian judul="Data klinis" ikon={Stethoscope}>
          <Field label="Diagnosis sebelum dipulangkan" error={errors.diagnosis_sebelum_pulang?.message}>
            <input {...register("diagnosis_sebelum_pulang")} className="input" aria-invalid={!!errors.diagnosis_sebelum_pulang} />
          </Field>
          <Field label="Diagnosis perawatan" error={errors.diagnosis_perawatan?.message}>
            <input {...register("diagnosis_perawatan")} className="input" aria-invalid={!!errors.diagnosis_perawatan} />
          </Field>
          <Field label="Anjuran perawatan di rumah" hint="Perawatan luka, obat, nutrisi" error={errors.rekomendasi_perawatan_rumah?.message}>
            <textarea {...register("rekomendasi_perawatan_rumah")} rows={3} className="input" aria-invalid={!!errors.rekomendasi_perawatan_rumah} />
          </Field>
        </Bagian>

        <Bagian judul="Kontrol ulang" ikon={CalendarCheck}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tanggal kontrol ulang" error={errors.jadwal_kunjungan_ulang && "Pilih tanggal"}>
              <input {...register("jadwal_kunjungan_ulang")} type="date" min={hariIni()} className="input" aria-invalid={!!errors.jadwal_kunjungan_ulang} />
            </Field>
            <Field label="Tempat kontrol ulang">
              <select {...register("faskes_kunjungan_ulang")} className="input">
                <option value="PUSKESMAS">Puskesmas</option>
                <option value="RS">Rumah sakit</option>
              </select>
            </Field>
          </div>
        </Bagian>

        {errorServer && <p role="alert" className="rounded-2xl bg-red-50/90 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">{errorServer}</p>}

        <div className="kaca sticky bottom-3 flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center sm:justify-between sm:pl-5">
          <p className="hidden text-sm text-tinta-redup sm:block">Bidan kelurahan dan Kepala Puskesmas langsung menerima tugas lewat WhatsApp.</p>
          <button type="submit" disabled={isSubmitting} className="btn-primary shrink-0">
            {isSubmitting ? "Menyimpan…" : "Simpan & pulangkan pasien"}
          </button>
        </div>
      </form>

      {readmission && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-selat-tua/30 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="judul-readmisi">
          <div className="kaca w-full max-w-md space-y-4 rounded-[2rem] bg-white/85 p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-kunyit/20 text-kunyit-tua">
              <ShieldAlert className="size-6" aria-hidden="true" />
            </span>
            <h2 id="judul-readmisi" className="font-display text-xl font-semibold">Pasien ini baru saja dipulangkan</h2>
            <p>
              Pasien dengan NIK ini tercatat baru saja dipulangkan pada <strong>{formatTanggal(readmission.waktu)}</strong>.
              Apakah ini kasus perawatan berulang (readmission)?
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button className="btn-secondary" onClick={() => setReadmission(null)}>
                Periksa NIK lagi
              </button>
              <button
                className="btn-primary"
                disabled={isSubmitting}
                onClick={() => kirim({ ...readmission.data, is_readmission: true })}
              >
                Ya, ini perawatan berulang
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
