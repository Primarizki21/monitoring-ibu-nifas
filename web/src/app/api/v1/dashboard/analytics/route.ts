import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ambilAnalitik, filterBawaan } from "@/lib/data/dashboard";

const TANGGAL = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f-]{36}$/;

// PRD 9.4 — ringkasan 10 kartu metrik & data grafik, dibatasi RLS sesuai peran pengguna.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const db = auth?.startsWith("Bearer ")
    ? createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: auth } },
        auth: { persistSession: false },
      })
    : await createClient();

  const { data: user } = await db.auth.getUser(auth?.slice(7));
  if (!user.user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams;
  const bawaan = filterBawaan();
  const pakai = (k: string, pola: RegExp) => (pola.test(q.get(k) ?? "") ? q.get(k)! : undefined);

  const data = await ambilAnalitik(db, {
    mulai: pakai("start_date", TANGGAL) ?? bawaan.mulai,
    selesai: pakai("end_date", TANGGAL) ?? bawaan.selesai,
    puskesmas_id: pakai("puskesmas_id", UUID),
    kelurahan_id: pakai("kelurahan_id", UUID),
  });
  return NextResponse.json({ success: true, data });
}
