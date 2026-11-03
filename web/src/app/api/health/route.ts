import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Dipakai Docker HEALTHCHECK, uptime monitor, dan probe platform.
export async function GET() {
  const mulai = Date.now();
  let database = "ok";
  try {
    const { error } = await createAdminClient().from("m_puskesmas").select("id", { head: true, count: "exact" }).limit(1);
    if (error) throw error;
  } catch (error) {
    console.error("health: database tidak terjangkau", error);
    database = "error";
  }

  const sehat = database === "ok";
  return NextResponse.json(
    {
      status: sehat ? "ok" : "degraded",
      uptime_detik: Math.round(process.uptime()),
      checks: { database: { status: database, latency_ms: Date.now() - mulai } },
    },
    { status: sehat ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
