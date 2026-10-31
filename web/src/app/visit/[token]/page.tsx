import { notFound } from "next/navigation";
import { MapPin, MessageCircle, Stethoscope } from "lucide-react";
import { IlustrasiJamPasir, IlustrasiSelesai } from "@/components/aset/ilustrasi";
import { LogoMark } from "@/components/aset/logo";
import { Badge } from "@/components/badge";
import { SlaRing } from "@/components/sla-ring";
import { ambilKunjungan, type LaporanKunjungan } from "@/lib/data/kunjungan";
import { formatTanggal, formatWaktu } from "@/lib/wa/template";
import { FormKunjungan } from "./form-kunjungan";

export const metadata = { title: "Laporan Kunjungan Rumah — SIM-NIFAS" };

export default async function VisitPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await ambilKunjungan(token);
  if (!data) notFound();

  return (
    <main className="mx-auto max-w-xl space-y-4 px-3 pb-10 pt-4 sm:px-4">
      <header className="flex items-center gap-3 px-1">
        <LogoMark className="size-8" />
        <div className="leading-tight">
          <p className="font-display text-lg font-semibold text-selat-tua">Laporan kunjungan rumah</p>
          <p className="text-xs text-tinta-redup">SIM-Nifas Kota Surabaya</p>
        </div>
      </header>

      <section className="kaca rounded-[2rem] p-5">
        <div className="flex items-center gap-4">
          <SlaRing
            waktuKrs={data.waktu_krs}
            deadline={data.deadline_sla}
            statusKunjungan={data.status_kunjungan}
            durasiJam={data.laporan?.durasi_jam_sejak_krs}
          />
          <div className="min-w-0 space-y-1.5">
            <h1 className="font-display text-2xl font-semibold leading-tight text-tinta">{data.nama_ibu}</h1>
            <Badge status={data.status_kunjungan} />
            {!data.laporan && <p className="text-sm text-tinta-redup">Kunjungi sebelum {formatWaktu(data.deadline_sla)}</p>}
          </div>
        </div>

        <dl className="mt-5 space-y-3 border-t border-white/70 pt-4 text-sm">
          <Baris ikon={<MapPin className="size-4" />} label="Alamat">
            {data.alamat}
          </Baris>
          <Baris ikon={<MessageCircle className="size-4" />} label="WhatsApp ibu">
            <a className="tautan" href={`https://wa.me/${data.no_whatsapp_ibu.replace("+", "")}`}>
              {data.no_whatsapp_ibu}
            </a>
          </Baris>
          <Baris ikon={<Stethoscope className="size-4" />} label={`Dari ${data.nama_rs}`}>
            <span className="block">{data.diagnosis_rs}</span>
            <span className="block text-tinta-redup">{data.diagnosis_perawatan}</span>
          </Baris>
        </dl>
        <div className="mt-4 rounded-2xl bg-kunyit/15 p-3 text-sm ring-1 ring-kunyit/30">
          <p className="font-semibold text-kunyit-tua">Anjuran perawatan dari RS</p>
          <p className="mt-0.5 text-tinta">{data.rekomendasi_rs}</p>
        </div>
      </section>

      {data.laporan ? (
        <RingkasanLaporan laporan={data.laporan} statusKesehatan={data.status_kesehatan} />
      ) : data.is_expired ? (
        <section className="kaca space-y-2 rounded-[2rem] p-6 text-center">
          <IlustrasiJamPasir className="mx-auto size-24" />
          <h2 className="font-display text-xl font-semibold">Tautan ini sudah tidak berlaku</h2>
          <p className="text-tinta-redup">Tautan laporan berlaku 7 hari sejak pasien pulang. Hubungi Puskesmas untuk mencatat kunjungan secara manual.</p>
        </section>
      ) : (
        <FormKunjungan token={token} jadwalKontrol={data.jadwal_kunjungan_ulang} />
      )}
    </main>
  );
}

function Baris({ ikon, label, children }: { ikon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-white/70 text-selat" aria-hidden="true">
        {ikon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-tinta-redup">{label}</dt>
        <dd className="font-medium">{children}</dd>
      </div>
    </div>
  );
}

const GEJALA: [keyof LaporanKunjungan, string][] = [
  ["perdarahan_abnormal", "Perdarahan banyak"],
  ["nyeri_perut_hebat", "Nyeri perut hebat"],
  ["luka_berbau_infeksi", "Luka berbau/infeksi"],
  ["pusing_muntah_lemas", "Pusing/muntah/lemas"],
];

// Mode baca-saja setelah laporan terkirim (PRD 7.3).
function RingkasanLaporan({ laporan, statusKesehatan }: { laporan: LaporanKunjungan; statusKesehatan: string }) {
  const gejala = GEJALA.filter(([k]) => laporan[k]).map(([, l]) => l);
  return (
    <section className="kaca rounded-[2rem] p-5">
      <div className="flex items-center gap-3">
        <IlustrasiSelesai className="size-14 shrink-0" />
        <div>
          <h2 className="font-display text-xl font-semibold">Laporan sudah terkirim</h2>
          <p className="text-sm text-tinta-redup">{formatWaktu(laporan.waktu_kunjungan)}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Kotak label="Kondisi ibu">
          <Badge status={statusKesehatan} />
        </Kotak>
        <Kotak label="Suhu tubuh">
          <span className="font-display text-xl font-semibold tabular-nums">{laporan.suhu_tubuh}</span> °C
        </Kotak>
        <Kotak label="Tanda bahaya" lebar>
          {gejala.length ? gejala.join(", ") : "Tidak ditemukan"}
        </Kotak>
        <Kotak label="Hasil kunjungan">{laporan.status_hasil === "BAIK" ? "Baik" : "Ada masalah"}</Kotak>
        <Kotak label="Kontrol ulang">{formatTanggal(laporan.konfirmasi_jadwal_kontrol)}</Kotak>
        {laporan.catatan_kebidanan && (
          <Kotak label="Catatan kebidanan" lebar>
            {laporan.catatan_kebidanan}
          </Kotak>
        )}
      </dl>
    </section>
  );
}

function Kotak({ label, lebar, children }: { label: string; lebar?: boolean; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl bg-white/55 p-3 ring-1 ring-white/80 ${lebar ? "col-span-2" : ""}`}>
      <dt className="text-xs text-tinta-redup">{label}</dt>
      <dd className="mt-1 font-medium">{children}</dd>
    </div>
  );
}
