import { NextResponse } from "next/server";
import { ambilKunjungan } from "@/lib/data/kunjungan";
import { galat } from "@/lib/http";

// PRD 9.2 — data ringkas pasien untuk formulir kunjungan rumah.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const data = await ambilKunjungan((await params).token);
  if (!data) return galat(404, "not_found", "Tautan kunjungan tidak ditemukan.");
  if (data.is_expired) return galat(410, "gone", "Tautan kunjungan sudah kadaluarsa (lebih dari 7 hari).");
  return NextResponse.json({ success: true, data }, { headers: { "cache-control": "no-store" } });
}
