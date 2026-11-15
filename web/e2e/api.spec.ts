import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Kontrak API PRD §9. Tes ini tidak membuat data pasien.
async function tokenDinkes() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await db.auth.signInWithPassword({
    email: "dinkes@uji.test",
    password: process.env.AKUN_UJI_PASSWORD!,
  });
  if (error) throw error;
  return data.session.access_token;
}

test("health mengembalikan status database", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ok");
  expect(body.checks.database.status).toBe("ok");
});

test("analytics menolak permintaan tanpa sesi", async ({ request }) => {
  const res = await request.get("/api/v1/dashboard/analytics");
  expect(res.status()).toBe(401);
  expect((await res.json()).error.code).toBe("unauthorized");
});

test("analytics mengembalikan metrics dan chart_series", async ({ request }) => {
  const token = await tokenDinkes();
  const res = await request.get("/api/v1/dashboard/analytics?start_date=2026-10-01&end_date=2026-11-30", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.data.metrics.total_dipulangkan).toBeGreaterThanOrEqual(0);
  expect(Array.isArray(body.data.chart_series)).toBe(true);
});

test("ekspor CSV mengikuti filter dan menolak kategori asing", async ({ request }) => {
  const token = await tokenDinkes();
  const url = "/api/v1/dashboard/export?start_date=2026-10-01&end_date=2026-11-30";
  const res = await request.get(url, { headers: { Authorization: `Bearer ${token}` } });
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/csv");
  expect(await res.text()).toContain("No,Nama Ibu,Alamat");

  const invalid = await request.get(`${url}&kategori=tidak_ada`, { headers: { Authorization: `Bearer ${token}` } });
  expect(invalid.status()).toBe(422);
});

test("visit dengan token tidak valid mengembalikan 404", async ({ request }) => {
  const res = await request.get(`/api/v1/visit/${"a".repeat(64)}`);
  expect(res.status()).toBe(404);
});
