import { expect, test, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Celah NFR yang belum teruji: otorisasi /api/cron, pengantrean WA SLA, dan RBAC /admin.
// Data uji memakai tag sendiri agar tidak tertukar dengan "(UJI E2E)" di alur.spec.ts.
const TAG = "(UJI E2E NFR)";

function dbUji() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

async function masuk(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi").fill(process.env.AKUN_UJI_PASSWORD!);
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

test("cron menolak permintaan tanpa Authorization dan bearer yang salah", async ({ request }) => {
  const tanpaHeader = await request.get("/api/cron");
  expect(tanpaHeader.status()).toBe(401);
  expect((await tanpaHeader.json()).error.code).toBe("unauthorized");

  const tokenSalah = await request.get("/api/cron", {
    headers: { Authorization: `Bearer ${"x".repeat(64)}` },
  });
  expect(tokenSalah.status()).toBe(401);
  expect((await tokenSalah.json()).error.code).toBe("unauthorized");
});

test.describe("pengantrean WA SLA lewat cron", () => {
  let db: SupabaseClient | null = null;
  const idDischarge: string[] = [];
  let siap = false;
  let alasan = "";

  async function templateUntuk(id: string) {
    const { data, error } = await db!.from("log_notifikasi_wa").select("template_id").eq("discharge_id", id);
    if (error) throw error;
    return (data ?? []).map((baris) => baris.template_id as string);
  }

  test.beforeAll(async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      alasan = "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diset.";
      return;
    }
    if (!process.env.CRON_SECRET) {
      alasan = "CRON_SECRET belum diset di .env.local.";
      return;
    }

    db = dbUji();
    // Pakai akun uji yang sudah ada (scripts/buat-akun-uji.mjs); trigger KRS yang memilih
    // bidan kelurahan dan puskesmas berdasarkan kelurahan.
    const { data: bidan } = await db
      .from("users")
      .select("id, kelurahan_id")
      .eq("email", "bidan.gundih@uji.test")
      .eq("role", "BIDAN_KELURAHAN")
      .eq("is_active", true)
      .maybeSingle();
    if (!bidan?.kelurahan_id) {
      alasan = "Akun uji bidan.gundih@uji.test belum tersedia; jalankan scripts/buat-akun-uji.mjs.";
      return;
    }

    const { data: kelurahan } = await db
      .from("m_kelurahan")
      .select("puskesmas_id")
      .eq("id", bidan.kelurahan_id)
      .maybeSingle();
    const { data: kapus } = await db
      .from("users")
      .select("id, puskesmas_id")
      .eq("role", "KEPALA_PUSKESMAS")
      .eq("is_active", true);
    if (!kelurahan?.puskesmas_id || !(kapus ?? []).some((k) => k.puskesmas_id === kelurahan.puskesmas_id)) {
      alasan = "Tidak ada Kepala Puskesmas aktif untuk wilayah bidan uji (butuh WA-ALERT-48H).";
      return;
    }

    const [{ data: rs }, { data: bidanRs }] = await Promise.all([
      db.from("m_rumah_sakit").select("id").eq("nama_rs", "RSUD Dr. Soetomo").maybeSingle(),
      db.from("users").select("id").eq("email", "bidan.rs@uji.test").maybeSingle(),
    ]);
    if (!rs?.id || !bidanRs?.id) {
      alasan = "Data RSUD Dr. Soetomo atau akun bidan.rs@uji.test belum tersedia.";
      return;
    }

    const cap = Date.now();
    const umum = {
      alamat_lengkap: `Jl. Uji NFR No. ${cap} ${TAG}`,
      kelurahan_id: bidan.kelurahan_id,
      no_whatsapp_ibu: "+6281199999999",
      diagnosis_sebelum_pulang: "Pemeriksaan uji NFR",
      diagnosis_perawatan: "Perawatan uji NFR",
      rekomendasi_perawatan_rumah: "Pantau uji NFR",
      jadwal_kunjungan_ulang: new Date(cap).toISOString().slice(0, 10),
      faskes_kunjungan_ulang: "PUSKESMAS",
      rs_asal_id: rs.id,
      bidan_rs_id: bidanRs.id,
      status_kunjungan: "PENDING",
    };
    const { data: dibuat, error } = await db
      .from("tr_discharge")
      .insert([
        {
          ...umum,
          nama_ibu: `Uji NFR 24 jam ${cap} ${TAG}`,
          nik: `3578${String(cap).slice(-9)}001`,
          waktu_krs: new Date(cap - 30 * 3600_000).toISOString(),
        },
        {
          ...umum,
          nama_ibu: `Uji NFR 48 jam ${cap} ${TAG}`,
          nik: `3578${String(cap).slice(-9)}002`,
          waktu_krs: new Date(cap - 72 * 3600_000).toISOString(),
        },
      ])
      .select("id")
      .returns<{ id: string }[]>();
    if (error) throw error;

    idDischarge.push(...(dibuat ?? []).map((baris) => baris.id));
    siap = idDischarge.length === 2;
    if (!siap) alasan = "Gagal membuat dua discharge uji untuk SLA.";
  });

  test.afterAll(async () => {
    if (!db || idDischarge.length === 0) return;
    // log_notifikasi_wa punya FK on delete set null: hapus dulu agar tidak meninggalkan antrean yatim.
    const hapusLog = await db.from("log_notifikasi_wa").delete().in("discharge_id", idDischarge);
    expect(hapusLog.error, "gagal menghapus log WA uji").toBeNull();
    const hapusKunjungan = await db.from("tr_home_visit").delete().in("discharge_id", idDischarge);
    expect(hapusKunjungan.error, "gagal menghapus kunjungan uji").toBeNull();
    const hapusAlert = await db.from("tr_emergency_alert").delete().in("discharge_id", idDischarge);
    expect(hapusAlert.error, "gagal menghapus alert uji").toBeNull();
    const hapusDischarge = await db.from("tr_discharge").delete().in("id", idDischarge);
    expect(hapusDischarge.error, "gagal menghapus discharge uji").toBeNull();
  });

  test("cron mengantrekan WA-REMIND-24H dan WA-ALERT-48H untuk discharge uji", async ({ request }) => {
    test.skip(!process.env.CRON_SECRET, "CRON_SECRET belum diset di .env.local; cron selalu 401.");
    test.skip(!siap, alasan || "Data uji SLA tidak siap.");

    const jawaban = await request.get("/api/cron", {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    expect(jawaban.status()).toBe(200);

    const [id24, id48] = idDischarge;
    await expect.poll(() => templateUntuk(id24)).toContain("WA-REMIND-24H");
    await expect.poll(() => templateUntuk(id48)).toContain("WA-ALERT-48H");
  });
});

test("bidan kelurahan tidak mendapat akses ke /admin", async ({ page }) => {
  test.skip(!process.env.AKUN_UJI_PASSWORD, "AKUN_UJI_PASSWORD belum diset di .env.local.");

  await masuk(page, "bidan.gundih@uji.test");
  await expect(page).toHaveURL(/\/dashboard/);

  const jawaban = await page.goto("/admin");
  const dialihkan = /\/dashboard(?:[/?]|$)/.test(page.url());
  const ditolak = jawaban?.status() === 403;
  expect(dialihkan || ditolak, "Bidan harus dialihkan dari /admin atau menerima 403").toBe(true);
  await expect(page.getByRole("heading", { name: "Master faskes & akun" })).toHaveCount(0);
  await expect(page.getByText("Kelola master faskes")).toHaveCount(0);
});
