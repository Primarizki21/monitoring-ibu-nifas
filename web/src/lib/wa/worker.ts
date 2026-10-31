import { createAdminClient } from "@/lib/supabase/server";
import { kirimWa } from "./fonnte";
import { waNomorPasienGagal } from "./template";

// 1 kiriman awal + 3 percobaan ulang (PRD 10).
const MAKS_PERCOBAAN = 4;
const BACKOFF_DASAR_DETIK = 30; // 30 dtk, 1 mnt, 2 mnt

type Db = ReturnType<typeof createAdminClient>;

type BarisAntrean = {
  id: string;
  discharge_id: string | null;
  nomor_tujuan: string;
  peran_penerima: string;
  template_id: string;
  pesan_terkirim: string;
  jumlah_percobaan: number;
};

export type RingkasanWorker = { diproses: number; terkirim: number; diulang: number; gagal: number };

// Kirim pesan yang sudah jatuh tempo di log_notifikasi_wa.
export async function prosesAntreanWa(batas = 20, db: Db = createAdminClient()): Promise<RingkasanWorker> {
  const ringkasan: RingkasanWorker = { diproses: 0, terkirim: 0, diulang: 0, gagal: 0 };
  // Gateway belum dikonfigurasi: biarkan pesan tetap QUEUED agar tidak habis jatah retry-nya.
  if (!process.env.FONNTE_TOKEN) return ringkasan;

  const { data, error } = await db.rpc("ambil_antrean_wa", { p_batas: batas });
  if (error) throw error;

  // Berurutan, bukan paralel: kiriman beruntun dari satu nomor rawan diblokir WhatsApp.
  for (const baris of (data ?? []) as BarisAntrean[]) {
    ringkasan.diproses++;
    const hasil = await kirimWa(baris.nomor_tujuan, baris.pesan_terkirim);

    if (hasil.ok) {
      ringkasan.terkirim++;
      await db
        .from("log_notifikasi_wa")
        .update({ status_pengiriman: "SENT", next_retry_at: null, response_gateway: hasil.respons })
        .eq("id", baris.id);
      continue;
    }

    if (hasil.bisaDiulang && baris.jumlah_percobaan < MAKS_PERCOBAAN) {
      ringkasan.diulang++;
      const jeda = BACKOFF_DASAR_DETIK * 2 ** (baris.jumlah_percobaan - 1);
      await db
        .from("log_notifikasi_wa")
        .update({ next_retry_at: new Date(Date.now() + jeda * 1000).toISOString(), response_gateway: hasil.respons })
        .eq("id", baris.id);
      continue;
    }

    ringkasan.gagal++;
    await db
      .from("log_notifikasi_wa")
      .update({ status_pengiriman: "FAILED", next_retry_at: null, response_gateway: hasil.respons })
      .eq("id", baris.id);
    if (baris.peran_penerima === "IBU_NIFAS" && baris.discharge_id) {
      await kabariBidanNomorGagal(db, baris.discharge_id);
    }
  }

  return ringkasan;
}

// PRD 7.3: WA ke pasien gagal -> beri tahu Bidan Kelurahan (atau Kepala Puskesmas bila belum ada bidan).
async function kabariBidanNomorGagal(db: Db, dischargeId: string) {
  const { data: d } = await db
    .from("tr_discharge")
    .select("nama_ibu, puskesmas_id, bidan:users!tr_discharge_bidan_kelurahan_id_fkey(no_whatsapp)")
    .eq("id", dischargeId)
    .single<{ nama_ibu: string; puskesmas_id: string; bidan: { no_whatsapp: string } | null }>();
  if (!d) return;

  let penerima = d.bidan ? [{ nomor: d.bidan.no_whatsapp, peran: "BIDAN_KELURAHAN" }] : [];
  if (!penerima.length) {
    const { data: kapus } = await db
      .from("users")
      .select("no_whatsapp")
      .eq("role", "KEPALA_PUSKESMAS")
      .eq("puskesmas_id", d.puskesmas_id)
      .eq("is_active", true);
    penerima = (kapus ?? []).map((k) => ({ nomor: k.no_whatsapp, peran: "KEPALA_PUSKESMAS" }));
  }

  await db.from("log_notifikasi_wa").insert(
    penerima.map((p) => ({
      discharge_id: dischargeId,
      nomor_tujuan: p.nomor,
      peran_penerima: p.peran,
      template_id: "WA-PASIEN-GAGAL",
      prioritas: "HIGH",
      pesan_terkirim: waNomorPasienGagal(d.nama_ibu),
      next_retry_at: new Date().toISOString(),
    })),
  );
}
