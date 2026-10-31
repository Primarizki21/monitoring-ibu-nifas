import { NextResponse } from "next/server";
import { ambilKunjungan } from "@/lib/data/kunjungan";

// PRD 9.2 — data ringkas pasien untuk formulir kunjungan rumah.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const data = await ambilKunjungan((await params).token);
  if (!data) {
    return NextResponse.json({ success: false, message: "Tautan kunjungan tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json({ success: true, data });
}
