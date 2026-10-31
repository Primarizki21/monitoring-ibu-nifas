import { defineConfig, devices } from "@playwright/test";

// Kata sandi akun uji dibaca dari .env.local, tidak pernah ditulis di kode uji.
process.loadEnvFile(".env.local");

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "ponsel", use: { ...devices["Pixel 7"] }, grep: /@ponsel/ },
  ],
  webServer: { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true, timeout: 180_000 },
});
