# SIM-Nifas Web: prototipe demo

Aplikasi web untuk **monitoring discharge planning ibu nifas Kota Surabaya**: Bidan RS memulangkan pasien, Bidan Kelurahan menerima tugas kunjungan rumah 2x24 jam lewat WhatsApp, dan Puskesmas/Dinkes memantau dari dashboard dengan Red Alert tanda bahaya.

Spesifikasi lengkap: [`../docs/PRD_SIM_NIFAS_SURABAYA.md`](../docs/PRD_SIM_NIFAS_SURABAYA.md).

Prototipe ini berdiri sendiri (Next.js + Supabase) dan tidak memakai backend FastAPI di root repositori.

**Stack:** Next.js 15 (App Router, TypeScript, Tailwind v4, Turbopack) · Supabase (Postgres, Auth, Realtime, RLS) · Fonnte (WhatsApp) · Recharts · Motion · Zod + React Hook Form · Playwright.

## Halaman

| Rute | Pengguna | Isi |
|---|---|---|
| `/` | publik | Landing page dengan adegan beranimasi, alur 48 jam, peran, 5 tanda bahaya |
| `/login` | semua nakes | Masuk, lalu diarahkan sesuai peran |
| `/krs` | Bidan RS | Formulir pemulangan pasien (KRS) + dialog readmission NIK < 40 hari |
| `/visit/[token]` | Bidan Kelurahan (tanpa login) | Laporan kunjungan rumah, triase otomatis |
| `/dashboard` | semua nakes | Tab **Ringkasan** (10 indikator PRD, tren, donut, Red Alert realtime) dan tab **Data ibu nifas** (detail per indikator) |
| `/dashboard/pasien/[id]` | semua nakes | Detail pasien, tindak lanjut Red Alert, ubah status (dirawat kembali / meninggal) |

API: `POST /api/v1/discharge`, `GET /api/v1/visit/:token`, `POST /api/v1/visit/submit`, `GET /api/v1/dashboard/analytics`, `GET /api/cron`.

## Struktur

```
web/
  src/app/                halaman & route API (App Router)
  src/components/         header, form, badge, cincin SLA, kerangka loading
  src/components/aset/    logo & ilustrasi SVG
  src/components/landing/ adegan subuh beranimasi, ponsel bidan, alur 48 jam
  src/lib/data/           query dashboard & kunjungan (selalu lewat RLS)
  src/lib/wa/             template pesan PRD 6.2, klien Fonnte, worker antrean, cron SLA
  supabase/migrations/    skema, trigger SLA & triase, RLS, antrean WA, perbaikan advisor
  supabase/seed.sql       15 Puskesmas, 34 kelurahan, 15 RS (6 kecamatan percontohan)
  scripts/                pembuat akun uji per peran
  e2e/                    uji end-to-end Playwright
```

## Logika di database

| Kejadian | Otomatis |
|---|---|
| Insert `tr_discharge` | `deadline_sla = waktu_krs + 48 jam`, token 64 hex berlaku 7 hari, Puskesmas & Bidan Kelurahan dikunci dari kelurahan |
| Insert `tr_home_visit` | durasi sejak KRS, `VISITED_ON_TIME`/`VISITED_LATE`, triase `TANDA_BAHAYA`/`KOMPLIKASI`/`SEHAT`, buat `tr_emergency_alert` |
| `tandai_tidak_dikunjungi()` | `PENDING` lewat deadline menjadi `NOT_VISITED` (dipanggil cron) |
| `cek_krs_terakhir(nik)` | cek KRS < 40 hari untuk dialog readmission (hanya service role) |

## Menjalankan

```bash
cd web
cp .env.example .env.local   # isi URL & kunci Supabase, token Fonnte, CRON_SECRET, AKUN_UJI_PASSWORD
npm install
npm run dev                  # pengembangan (Turbopack)
```

Untuk demo, pakai build produksi; halaman tidak perlu dikompilasi saat pertama dibuka:

```bash
npm run build && npm start
```

Database:

```bash
npx supabase link --project-ref <ref>
npx supabase db push --include-seed
node --env-file=.env.local scripts/buat-akun-uji.mjs   # 4 akun uji; dijalankan ulang = ganti kata sandi
```

Akun uji: `bidan.rs@uji.test`, `bidan.gundih@uji.test`, `kapus.gundih@uji.test`, `dinkes@uji.test` (kata sandi = `AKUN_UJI_PASSWORD`).

## WhatsApp (Fonnte)

Semua pesan masuk ke `log_notifikasi_wa` (status `QUEUED`), lalu dikirim worker `src/lib/wa/worker.ts` di latar belakang setelah KRS atau laporan disimpan.

- Gagal sementara dicoba ulang 3x (30 dtk, 1 mnt, 2 mnt), lalu `FAILED`. `target invalid` langsung `FAILED`.
- WA ke pasien `FAILED` memicu pesan ke Bidan Kelurahan untuk cek langsung.
- Tanpa `FONNTE_TOKEN`, pesan tetap `QUEUED` dan tidak menghabiskan jatah retry.
- `SENT` berarti diterima antrean Fonnte, belum tentu sampai ke HP penerima.

`GET /api/cron` (header `Authorization: Bearer <CRON_SECRET>`) menjalankan pengingat 24 jam, eskalasi 48 jam, penandaan `NOT_VISITED`, lalu mengirim antrean. Panggil tiap menit dari Supabase:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;
select vault.create_secret('<CRON_SECRET>', 'cron_secret');
select cron.schedule('sim-nifas-tiap-menit', '* * * * *', $$
  select net.http_get(
    url := 'https://<domain-aplikasi>/api/cron',
    headers := jsonb_build_object('Authorization', 'Bearer ' ||
      (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'))
  );
$$);
```

## Uji end-to-end

```bash
npx playwright install chromium   # sekali saja
npx playwright test
```

Menguji alur lengkap di Supabase sungguhan: beranda, login gagal, KRS oleh Bidan RS, laporan bertanda bahaya oleh Bidan Kelurahan, Red Alert & tab detail oleh Kepala Puskesmas, filter & tab tanpa muat ulang oleh Dinkes. Setiap run menambah pasien berlabel `(UJI E2E)`.

Waktu respons di build produksi (Supabase Singapura): login ±0,7 dtk, simpan KRS ±0,6 dtk, pindah tab ±1 dtk, buka detail ±0,7 dtk.

## Catatan

- Pemetaan kelurahan ke Puskesmas di `seed.sql` masih perkiraan; verifikasi ke Dinkes.
- Enkripsi AES-256 mengandalkan enkripsi at-rest Supabase; enkripsi per kolom (NIK, diagnosis) belum diterapkan.
- Belum ada halaman admin untuk mengelola akun & master faskes; akun dibuat lewat skrip.
