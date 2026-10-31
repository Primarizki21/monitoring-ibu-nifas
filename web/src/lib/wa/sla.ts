import { createAdminClient } from "@/lib/supabase/server";
import { waAlert48h, waRemind24h } from "./template";

// FR-02: T0+24 jam -> pengingat ke Bidan Kelurahan; T0+48 jam -> eskalasi ke Kepala Puskesmas
// lalu status menjadi NOT_VISITED. Aman dipanggil berulang: tiap discharge ditandai sekali saja.

const KOLOM = `id, nama_ibu, alamat_lengkap, deadline_sla, token_kunjungan, puskesmas_id,
  rs:m_rumah_sakit(nama_rs),
  bidan:users!tr_discharge_bidan_kelurahan_id_fkey(nama_lengkap, no_whatsapp)`;

type Baris = {
  id: string;
  nama_ibu: string;
  alamat_lengkap: string;
  deadline_sla: string;
  token_kunjungan: string;
  puskesmas_id: string;
  rs: { nama_rs: string } | null;
  bidan: { nama_lengkap: string; no_whatsapp: string } | null;
};

function dataSla(d: Baris) {
  return {
    nama_ibu: d.nama_ibu,
    alamat_lengkap: d.alamat_lengkap,
    nama_rs: d.rs?.nama_rs ?? "-",
    deadline_sla: d.deadline_sla,
    url_kunjungan_token: `${process.env.NEXT_PUBLIC_APP_URL}/visit/${d.token_kunjungan}`,
  };
}

export async function prosesSla() {
  const db = createAdminClient();
  const sekarang = new Date();
  const iso = sekarang.toISOString();
  const antrean: object[] = [];

  // Pengingat 24 jam. UPDATE ... RETURNING sekaligus mengklaim baris agar tidak dobel.
  const { data: perluPengingat, error: e1 } = await db
    .from("tr_discharge")
    .update({ reminder_24h_sent_at: iso })
    .eq("status_kunjungan", "PENDING")
    .is("reminder_24h_sent_at", null)
    .lte("waktu_krs", new Date(sekarang.getTime() - 24 * 3600_000).toISOString())
    .gt("deadline_sla", iso)
    .select(KOLOM)
    .returns<Baris[]>();
  if (e1) throw e1;

  for (const d of perluPengingat ?? []) {
    if (!d.bidan) continue; // Belum ada bidan; Kepala Puskesmas sudah menerima tembusan penugasan.
    antrean.push({
      discharge_id: d.id,
      nomor_tujuan: d.bidan.no_whatsapp,
      peran_penerima: "BIDAN_KELURAHAN",
      template_id: "WA-REMIND-24H",
      prioritas: "NORMAL",
      pesan_terkirim: waRemind24h(dataSla(d)),
      next_retry_at: iso,
    });
  }

  // Eskalasi 48 jam ke Kepala Puskesmas.
  const { data: terlambat, error: e2 } = await db
    .from("tr_discharge")
    .update({ alert_48h_sent_at: iso })
    .in("status_kunjungan", ["PENDING", "NOT_VISITED"])
    .is("alert_48h_sent_at", null)
    .lte("deadline_sla", iso)
    .select(KOLOM)
    .returns<Baris[]>();
  if (e2) throw e2;

  if (terlambat?.length) {
    const { data: kapus } = await db
      .from("users")
      .select("no_whatsapp, puskesmas_id")
      .eq("role", "KEPALA_PUSKESMAS")
      .eq("is_active", true)
      .in("puskesmas_id", [...new Set(terlambat.map((d) => d.puskesmas_id))]);

    for (const d of terlambat) {
      const pesan = waAlert48h({ ...dataSla(d), nama_bidan: d.bidan?.nama_lengkap ?? "(belum ditugaskan)" });
      for (const k of (kapus ?? []).filter((k) => k.puskesmas_id === d.puskesmas_id)) {
        antrean.push({
          discharge_id: d.id,
          nomor_tujuan: k.no_whatsapp,
          peran_penerima: "KEPALA_PUSKESMAS",
          template_id: "WA-ALERT-48H",
          prioritas: "HIGH",
          pesan_terkirim: pesan,
          next_retry_at: iso,
        });
      }
    }
  }

  if (antrean.length) {
    const { error } = await db.from("log_notifikasi_wa").insert(antrean);
    if (error) throw error;
  }

  const { data: ditandai, error: e3 } = await db.rpc("tandai_tidak_dikunjungi");
  if (e3) throw e3;

  return {
    pengingat_24h: perluPengingat?.length ?? 0,
    eskalasi_48h: terlambat?.length ?? 0,
    pesan_diantrekan: antrean.length,
    ditandai_not_visited: ditandai as number,
  };
}
