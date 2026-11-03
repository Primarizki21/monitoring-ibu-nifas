import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { galat } from "@/lib/http";
import { prosesSla } from "@/lib/wa/sla";
import { prosesAntreanWa } from "@/lib/wa/worker";

// Perbandingan constant-time: panjang secret tidak bocor lewat waktu respons.
function tokenCocok(diterima: string | null, rahasia: string) {
  const a = createHash("sha256").update(diterima ?? "").digest();
  const b = createHash("sha256").update(rahasia).digest();
  return timingSafeEqual(a, b);
}

// Dipanggil tiap menit oleh penjadwal (pg_cron/Vercel Cron) dengan header
// Authorization: Bearer <CRON_SECRET>. Urutan: antrekan pesan SLA, lalu kirim antrean.
async function jalankan(req: NextRequest) {
  const secret = env().CRON_SECRET;
  if (!secret || !tokenCocok(req.headers.get("authorization"), `Bearer ${secret}`)) {
    return galat(401, "unauthorized", "Unauthorized");
  }

  try {
    const sla = await prosesSla();
    const wa = await prosesAntreanWa();
    return NextResponse.json({ success: true, data: { sla, wa } }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("cron gagal", error);
    return galat(500, "internal_error", "Cron gagal dijalankan.");
  }
}

export const GET = jalankan;
export const POST = jalankan;
export const maxDuration = 60;
