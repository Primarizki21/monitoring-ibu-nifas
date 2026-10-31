import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft, CalendarCheck, ClipboardList, House, MessageCircle, Siren, Stethoscope, UserRoundCheck } from "lucide-react";
import { IlustrasiRumah } from "@/components/aset/ilustrasi";
import { Badge, labelStatus } from "@/components/badge";
import { Header } from "@/components/header";
import { SlaRing } from "@/components/sla-ring";
import { wajibLogin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatTanggal, formatWaktu } from "@/lib/wa/template";

// Status lanjutan yang dicatat nakes setelah kunjungan (PRD 3, Tahap 6).
const STATUS_LANJUTAN = ["SEHAT", "KOMPLIKASI", "TANDA_BAHAYA", "DIRAWAT_KEMBALI", "MENINGGAL"] as const;
const PERAN_NAKES = ["SUPERADMIN_DINKES", "KEPALA_PUSKESMAS", "BIDAN_KELURAHAN"];

async function ubahStatus(formData: FormData) {
  "use server";
  const status = String(formData.get("status_kesehatan"));
  if (!STATUS_LANJUTAN.includes(status as (typeof STATUS_LANJUTAN)[number])) return;
  const id = String(formData.get("id"));
  const db = await createClient();
  // RLS (discharge_update) memastikan hanya nakes di wilayahnya yang bisa mengubah.
  await db
    .from("tr_discharge")
    .update({ status_kesehatan: status, is_emergency: status === "TANDA_BAHAYA" || status === "KOMPLIKASI" })
    .eq("id", id);
  revalidatePath(`/dashboard/pasien/${id}`);
}

async function selesaikanAlert(formData: FormData) {
  "use server";
  const db = await createClient();
  const { data: user } = await db.auth.getUser();
  await db
    .from("tr_emergency_alert")
    .update({
      is_resolved: true,
      catatan_tindakan: String(formData.get("catatan_tindakan") || "").trim() || null,
      resolved_at: new Date().toISOString(),
      resolved_by: user.user?.id,
    })
    .eq("id", String(formData.get("alert_id")));
  revalidatePath(`/dashboard/pasien/${formData.get("id")}`);
}

type Alert = { id: string; jenis_masalah: string; waktu_laporan: string; is_resolved: boolean; catatan_tindakan: string | null; resolved_at: string | null };

export default async function DetailPasien({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();

  const [profil, { data: d }] = await Promise.all([
    wajibLogin(),
    db
    .from("tr_discharge")
    .select(
      `*, kelurahan:m_kelurahan(nama_kelurahan, kecamatan), puskesmas:m_puskesmas(nama_puskesmas), rs:m_rumah_sakit(nama_rs),
       bidan:users!tr_discharge_bidan_kelurahan_id_fkey(nama_lengkap, no_whatsapp),
       laporan:tr_home_visit(*),
       alerts:tr_emergency_alert(id, jenis_masalah, waktu_laporan, is_resolved, catatan_tindakan, resolved_at)`,
    )
    .eq("id", id)
    .maybeSingle(),
  ]);
  if (!d) notFound();

  const laporan = d.laporan as Record<string, string | number | boolean | null> | null;
  const alerts = ((d.alerts ?? []) as Alert[]).sort((a, b) => Number(a.is_resolved) - Number(b.is_resolved));
  const nakes = PERAN_NAKES.includes(profil.role);
  const belumDikunjungi = d.status_kunjungan === "PENDING" || d.status_kunjungan === "NOT_VISITED";

  return (
    <>
      <Header profil={profil} aktif="dashboard" />
      <main className="mx-auto max-w-5xl space-y-4 px-3 pb-12 pt-6 sm:px-4">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 px-1 text-sm font-medium text-selat hover:text-selat-tua">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali ke dashboard
        </Link>

        <section className="kaca rounded-[2rem] p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <SlaRing waktuKrs={d.waktu_krs} deadline={d.deadline_sla} statusKunjungan={d.status_kunjungan} durasiJam={laporan?.durasi_jam_sejak_krs as number | undefined} />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-selat-tua">{d.nama_ibu}</h1>
              <p className="text-sm tabular-nums text-tinta-redup">NIK {d.nik}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge status={d.status_kesehatan} />
                <Badge status={d.status_kunjungan} />
                {d.is_readmission && <span className="rounded-full bg-sky-50/80 px-2.5 py-1 text-xs font-semibold text-sky-800 ring-1 ring-sky-600/25">Perawatan berulang</span>}
              </div>
            </div>
            <a href={`https://wa.me/${d.no_whatsapp_ibu.replace("+", "")}`} className="btn-secondary self-start sm:self-center">
              <MessageCircle className="size-4" aria-hidden="true" />
              {d.no_whatsapp_ibu}
            </a>
          </div>
        </section>

        {alerts.length > 0 && (
          <section className="space-y-2">
            {alerts.map((a) =>
              a.is_resolved ? (
                <div key={a.id} className="kaca-tipis flex items-start gap-3 rounded-2xl p-4 text-sm">
                  <UserRoundCheck className="mt-0.5 size-5 shrink-0 text-sirih" aria-hidden="true" />
                  <p>
                    <span className="font-semibold">{a.jenis_masalah}</span> sudah ditangani {a.resolved_at && formatWaktu(a.resolved_at)}
                    {a.catatan_tindakan && <span className="block text-tinta-redup">{a.catatan_tindakan}</span>}
                  </p>
                </div>
              ) : (
                <div key={a.id} className="rounded-[var(--radius-kaca)] bg-gradient-to-br from-red-600/90 to-rose-700/90 p-5 text-white ring-1 ring-white/25 backdrop-blur-xl">
                  <div className="flex items-start gap-3">
                    <Siren className="mt-0.5 size-6 shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-display text-lg font-semibold">{a.jenis_masalah}</p>
                      <p className="text-sm text-white/80">Dilaporkan {formatWaktu(a.waktu_laporan)}</p>
                    </div>
                  </div>
                  {nakes && (
                    <form action={selesaikanAlert} className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <input type="hidden" name="id" value={d.id} />
                      <input type="hidden" name="alert_id" value={a.id} />
                      <label className="sr-only" htmlFor={`tindakan-${a.id}`}>
                        Tindakan yang dilakukan
                      </label>
                      <input id={`tindakan-${a.id}`} name="catatan_tindakan" placeholder="Tindakan yang dilakukan, mis. dirujuk ke IGD RSUD Dr. Soetomo" className="input flex-1 text-sm" />
                      <button className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50">Tandai sudah ditangani</button>
                    </form>
                  )}
                </div>
              ),
            )}
          </section>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel ikon={<House className="size-4.5" />} judul="Alamat & pendamping">
            <Item label="Alamat">
              {d.alamat_lengkap}, Kel. {d.kelurahan?.nama_kelurahan}, Kec. {d.kelurahan?.kecamatan}
            </Item>
            <Item label="Puskesmas pembina">{d.puskesmas?.nama_puskesmas}</Item>
            <Item label="Bidan kelurahan">{d.bidan ? `${d.bidan.nama_lengkap}, ${d.bidan.no_whatsapp}` : "Belum ada bidan untuk kelurahan ini"}</Item>
          </Panel>

          <Panel ikon={<Stethoscope className="size-4.5" />} judul={`Dari ${d.rs?.nama_rs ?? "rumah sakit"}`}>
            <Item label="Pulang">{formatWaktu(d.waktu_krs)}</Item>
            <Item label="Diagnosis sebelum pulang">{d.diagnosis_sebelum_pulang}</Item>
            <Item label="Diagnosis perawatan">{d.diagnosis_perawatan}</Item>
            <Item label="Anjuran perawatan di rumah">{d.rekomendasi_perawatan_rumah}</Item>
          </Panel>

          <Panel ikon={<ClipboardList className="size-4.5" />} judul="Laporan kunjungan rumah">
            {laporan ? (
              <>
                <Item label="Waktu kunjungan">
                  {formatWaktu(String(laporan.waktu_kunjungan))}, {Number(laporan.durasi_jam_sejak_krs).toFixed(1).replace(".", ",")} jam setelah pulang
                </Item>
                <Item label="Suhu tubuh">{String(laporan.suhu_tubuh).replace(".", ",")} °C</Item>
                <Item label="Tanda bahaya">
                  {[
                    laporan.perdarahan_abnormal && "Perdarahan banyak",
                    laporan.nyeri_perut_hebat && "Nyeri perut hebat",
                    laporan.luka_berbau_infeksi && "Luka berbau/infeksi",
                    laporan.pusing_muntah_lemas && "Pusing/muntah/lemas",
                  ]
                    .filter(Boolean)
                    .join(", ") || "Tidak ditemukan"}
                </Item>
                <Item label="Hasil">{laporan.status_hasil === "BAIK" ? "Baik" : "Ada masalah"}</Item>
                {laporan.catatan_kebidanan && <Item label="Catatan kebidanan">{String(laporan.catatan_kebidanan)}</Item>}
              </>
            ) : (
              <div className="py-2 text-center">
                <IlustrasiRumah className="mx-auto w-40" />
                <p className="mt-1 text-sm text-tinta-redup">{belumDikunjungi ? "Bidan belum mengirim laporan kunjungan." : "Belum ada laporan."}</p>
                {profil.role === "BIDAN_KELURAHAN" && belumDikunjungi && (
                  <Link href={`/visit/${d.token_kunjungan}`} className="btn-primary mt-3">
                    Isi laporan kunjungan
                  </Link>
                )}
              </div>
            )}
          </Panel>

          <Panel ikon={<CalendarCheck className="size-4.5" />} judul="Kontrol ulang & status">
            <Item label="Jadwal kontrol">
              {formatTanggal(d.jadwal_kunjungan_ulang)} di {d.faskes_kunjungan_ulang === "RS" ? d.rs?.nama_rs ?? "rumah sakit" : d.puskesmas?.nama_puskesmas ?? "Puskesmas"}
            </Item>
            {nakes ? (
              <form action={ubahStatus} className="space-y-2 pt-1">
                <input type="hidden" name="id" value={d.id} />
                <label htmlFor="status_kesehatan" className="block text-xs text-tinta-redup">
                  Perbarui kondisi ibu bila dirawat inap ulang atau untuk audit maternal (AMP)
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select id="status_kesehatan" name="status_kesehatan" defaultValue={d.status_kesehatan} className="input">
                    {STATUS_LANJUTAN.map((s) => (
                      <option key={s} value={s}>
                        {labelStatus(s)}
                      </option>
                    ))}
                  </select>
                  <button className="btn-primary shrink-0">Simpan kondisi</button>
                </div>
              </form>
            ) : (
              <Item label="Kondisi saat ini">{labelStatus(d.status_kesehatan)}</Item>
            )}
          </Panel>
        </div>
      </main>
    </>
  );
}

function Panel({ ikon, judul, children }: { ikon: React.ReactNode; judul: string; children: React.ReactNode }) {
  return (
    <section className="kaca rounded-[var(--radius-kaca)] p-5 sm:p-6">
      <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold text-selat">
        <span className="grid size-8 place-items-center rounded-lg bg-selat/10" aria-hidden="true">
          {ikon}
        </span>
        {judul}
      </h2>
      <dl className="mt-4 space-y-3 text-sm">{children}</dl>
    </section>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-tinta-redup">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
