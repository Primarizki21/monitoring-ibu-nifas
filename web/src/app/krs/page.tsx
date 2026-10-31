import { redirect } from "next/navigation";
import { halamanAwal, wajibLogin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { FormKrs, type Kelurahan } from "./form-krs";

export default async function KrsPage() {
  const supabase = await createClient();
  const [profil, { data: kelurahan }, { data: semuaRs }] = await Promise.all([
    wajibLogin(),
    supabase.from("m_kelurahan").select("id, nama_kelurahan, kecamatan").order("nama_kelurahan"),
    supabase.from("m_rumah_sakit").select("id, nama_rs"),
  ]);
  if (profil.role !== "BIDAN_RS") redirect(halamanAwal(profil.role));
  const rs = semuaRs?.find((r) => r.id === profil.rumah_sakit_id);

  return (
    <>
    <Header profil={profil} aktif="krs" />
    <main className="mx-auto max-w-2xl px-3 pb-10 pt-6 sm:px-4">
      <header className="mb-5 px-1">
        <p className="text-sm font-medium text-selat-muda">{rs?.nama_rs}</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-selat-tua">Pulangkan pasien</h1>
        <p className="mt-1 max-w-[56ch] text-tinta-redup">
          Isi data saat ibu keluar rumah sakit. Sistem menugaskan bidan kelurahan dan mulai menghitung batas kunjungan 48 jam.
        </p>
      </header>
      <FormKrs kelurahan={(kelurahan ?? []) as Kelurahan[]} />
    </main>
    </>
  );
}
