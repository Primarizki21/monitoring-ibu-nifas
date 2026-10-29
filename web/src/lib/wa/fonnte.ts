// Klien Fonnte (https://docs.fonnte.com/api-send-message/).
// Diganti adapter Meta Cloud API nanti cukup dengan mengganti fungsi ini.

export type HasilKirim = { ok: true; respons: string } | { ok: false; respons: string; bisaDiulang: boolean };

// Alasan gagal yang tidak akan berubah walau dicoba ulang.
const GAGAL_PERMANEN = ["target invalid", "input invalid"];

export async function kirimWa(nomor: string, pesan: string): Promise<HasilKirim> {
  const token = process.env.FONNTE_TOKEN;
  if (!token) return { ok: false, respons: "FONNTE_TOKEN belum diisi", bisaDiulang: true };

  const body = new FormData();
  body.set("target", nomor.replace(/^\+/, ""));
  body.set("message", pesan);

  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: token },
      body,
      signal: AbortSignal.timeout(15_000),
    });
    const teks = await res.text();
    const json = JSON.parse(teks) as { status?: boolean; Status?: boolean; reason?: string };
    if (json.status ?? json.Status) return { ok: true, respons: teks };

    const alasan = (json.reason ?? "").toLowerCase();
    return { ok: false, respons: teks, bisaDiulang: !GAGAL_PERMANEN.includes(alasan) };
  } catch (e) {
    // Jaringan putus, timeout, atau gateway sibuk — layak dicoba ulang.
    return { ok: false, respons: String(e), bisaDiulang: true };
  }
}
