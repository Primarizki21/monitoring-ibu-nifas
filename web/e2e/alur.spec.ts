import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Alur lengkap SIM-Nifas di database sungguhan: KRS -> laporan kunjungan bertanda bahaya
// -> Red Alert & tab detail -> tindak lanjut. Data uji diberi akhiran "(UJI E2E)".

const NAMA = `Uji E2E ${Date.now().toString().slice(-6)} (UJI E2E)`;
const NIK = `3578${Date.now().toString().slice(-12)}`;

async function masuk(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi").fill(process.env.AKUN_UJI_PASSWORD!);
  const mulai = Date.now();
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  return Date.now() - mulai;
}

// Template WA yang sudah masuk antrean untuk pasien uji (diisi di latar belakang lewat after()).
async function templateWa() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data } = await db.from("log_notifikasi_wa").select("template_id, tr_discharge!inner(nama_ibu)").eq("tr_discharge.nama_ibu", NAMA);
  return (data ?? []).map((r) => r.template_id).sort();
}

// Waktu navigasi sampai konten utama tampil, untuk memantau kecepatan.
async function ukur(page: Page, aksi: () => Promise<unknown>, siap: () => Promise<unknown>) {
  const mulai = Date.now();
  await aksi();
  await siap();
  return Date.now() - mulai;
}

test.describe.configure({ mode: "serial" });

test("beranda tampil, adegan beranimasi, tanpa scroll horizontal @ponsel", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("48 jam");
  await expect(page.getByRole("img", { name: /bidan bermotor/ })).toBeVisible();
  await expect(page.getByText("Tugas kunjungan baru")).toBeVisible();
  await expect(page.getByText("Bidan tiba di rumah ibu")).toBeVisible({ timeout: 15_000 });
  const lebih = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(lebih).toBeLessThanOrEqual(0);
});

test("login dengan kata sandi salah menampilkan pesan", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("img", { name: /bidan bermotor/ })).toBeVisible();
  await page.getByLabel("Email").fill("dinkes@uji.test");
  await page.getByLabel("Kata sandi").fill("salah-sengaja");
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page.getByText("Email atau kata sandi tidak cocok")).toBeVisible();
});

test("Bidan RS memulangkan pasien", async ({ page }) => {
  const msLogin = await masuk(page, "bidan.rs@uji.test");
  await expect(page).toHaveURL(/\/krs$/);
  console.log(`  login Bidan RS -> /krs: ${msLogin} ms`);

  await page.getByLabel("NIK").fill(NIK);
  await page.getByLabel("Nama lengkap ibu").fill(NAMA);
  await page.getByLabel("Nomor WhatsApp aktif").fill("0812-0000-1111");
  await page.getByLabel("Kecamatan").selectOption("Bubutan");
  await page.getByLabel("Kelurahan").selectOption({ label: "Gundih" });
  await page.getByLabel("Alamat lengkap").fill("Jl. Uji Coba No. 1");
  await page.getByLabel("Diagnosis sebelum dipulangkan").fill("Post partum normal hari ke-2");
  await page.getByLabel("Diagnosis perawatan").fill("Perawatan luka perineum");
  await page.getByLabel("Anjuran perawatan di rumah").fill("Jaga kebersihan luka");
  const minggu = new Date(Date.now() + 7 * 86400e3).toISOString().slice(0, 10);
  await page.getByLabel("Tanggal kontrol ulang").fill(minggu);

  const ms = await ukur(
    page,
    () => page.getByRole("button", { name: "Simpan & pulangkan pasien" }).click(),
    () => expect(page.getByText("Pasien sudah dipulangkan")).toBeVisible(),
  );
  console.log(`  simpan KRS: ${ms} ms`);
  await expect(page.getByText("Batas kunjungan rumah")).toBeVisible();
  await expect.poll(templateWa).toEqual(["WA-ASSIGN-01", "WA-ASSIGN-01", "WA-EDU-PASIEN"]);
});

test("Bidan kelurahan mengisi laporan bertanda bahaya dari tab data", async ({ page }) => {
  await masuk(page, "bidan.gundih@uji.test");
  await expect(page).toHaveURL(/\/dashboard/);

  const ms = await ukur(
    page,
    () => page.getByRole("link", { name: "Data ibu nifas", exact: true }).click(),
    () => expect(page.getByRole("heading", { name: "Semua data ibu nifas" })).toBeVisible(),
  );
  console.log(`  pindah ke tab data: ${ms} ms`);

  await page.getByRole("link", { name: /Menunggu kunjungan/ }).click();
  const baris = page.getByRole("row", { name: new RegExp(NAMA.replace(/[()]/g, "\\$&")) });
  await expect(baris).toBeVisible();
  await baris.getByRole("link", { name: "Isi laporan" }).click();

  await expect(page.getByRole("heading", { name: NAMA })).toBeVisible();
  await page.getByLabel("Suhu tubuh (°C)").fill("38.7");
  await page.getByText("Perdarahan banyak dari jalan lahir").click();
  await page.getByText("Ada masalah", { exact: true }).click();
  await page.getByRole("button", { name: "Simpan laporan kunjungan" }).click();
  await expect(page.getByText("Tanda bahaya tercatat")).toBeVisible();
  await expect.poll(async () => (await templateWa()).filter((t) => t === "WA-EMERGENCY").length).toBe(2);
});

test("Kepala Puskesmas melihat Red Alert, kartu indikator, dan menindaklanjuti", async ({ page }) => {
  await masuk(page, "kapus.gundih@uji.test");
  await expect(page).toHaveURL(/\/dashboard/);

  const alert = page.locator("#red-alert");
  await expect(alert).toContainText(NAMA);

  // 10 kartu indikator PRD 8.1
  const kartu = page.getByRole("region", { name: "Indikator utama" }).getByRole("link");
  await expect(kartu).toHaveCount(10);

  await kartu.filter({ hasText: "Tanda bahaya nifas" }).click();
  await expect(page).toHaveURL(/kategori=tanda_bahaya/);
  await expect(page.getByRole("heading", { name: "Ibu nifas: tanda bahaya" })).toBeVisible();
  const baris = page.getByRole("row", { name: new RegExp(NAMA.replace(/[()]/g, "\\$&")) });
  await expect(baris).toBeVisible();

  const ms = await ukur(
    page,
    () => baris.getByRole("link", { name: "Detail" }).click(),
    () => expect(page.getByRole("heading", { level: 1, name: NAMA })).toBeVisible(),
  );
  console.log(`  buka detail pasien: ${ms} ms`);

  await page.getByLabel("Tindakan yang dilakukan").fill("Dirujuk ke IGD RSUD Dr. Soetomo (uji E2E)");
  await page.getByRole("button", { name: "Tandai sudah ditangani" }).click();
  await expect(page.getByText("sudah ditangani")).toBeVisible();
});

test("Dinkes: filter dan tab bekerja tanpa muat ulang halaman", async ({ page }) => {
  await masuk(page, "dinkes@uji.test");
  await expect(page.getByRole("heading", { name: "Monitoring ibu nifas pasca keluar RS" })).toBeVisible();
  await page.evaluate(() => ((window as unknown as { penanda: number }).penanda = 1));

  await page.getByLabel("Puskesmas").selectOption({ label: "Puskesmas Gundih" });
  await expect(page).toHaveURL(/puskesmas_id=/);
  await page.getByRole("link", { name: "Data ibu nifas", exact: true }).click();
  await expect(page).toHaveURL(/tab=data.*|.*puskesmas_id=.*tab=data/);
  await expect(page.getByRole("heading", { name: "Semua data ibu nifas" })).toBeVisible();

  // Penanda di window tetap ada = navigasi sisi klien, bukan muat ulang penuh.
  expect(await page.evaluate(() => (window as unknown as { penanda?: number }).penanda)).toBe(1);
});
