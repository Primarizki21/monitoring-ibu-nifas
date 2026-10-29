import { NextResponse, type NextRequest } from "next/server";
import { prosesSla } from "@/lib/wa/sla";
import { prosesAntreanWa } from "@/lib/wa/worker";

// Dipanggil tiap menit oleh penjadwal (pg_cron/Vercel Cron) dengan header
// Authorization: Bearer <CRON_SECRET>. Urutan: antrekan pesan SLA, lalu kirim antrean.
async function jalankan(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const sla = await prosesSla();
  const wa = await prosesAntreanWa();
  return NextResponse.json({ success: true, data: { sla, wa } });
}

export const GET = jalankan;
export const POST = jalankan;
export const maxDuration = 60;
