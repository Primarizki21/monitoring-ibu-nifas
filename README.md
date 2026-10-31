# SIM-NIFAS Surabaya: Sistem Monitoring Discharge Planning & Kesehatan Ibu Nifas

Sistem informasi dan pemantauan kesehatan ibu nifas terautomasi berbasis **Progressive Web App (PWA)** dan **WhatsApp Gateway** untuk kegiatan Pengabdian Masyarakat (Pengmas) di Kota Surabaya.

Sistem menghubungkan **Rumah Sakit Rujukan** dan **Puskesmas Mitra / Bidan Kelurahan** di Surabaya untuk mengawal kepulangan pasien (*discharge planning*), menegakkan standar kunjungan rumah maksimal $2 \times 24\text{ jam}$ ($48\text{ jam}$), mendeteksi dini tanda bahaya maternal, serta mendampingi masa nifas hingga genap **42 hari (KF1 s/d KF4)**.

---

## 1. Dokumen Resmi Proyek

- **Google Docs (Project Charter & Spesifikasi Teknis)**:  
  [Buka Google Docs](https://docs.google.com/document/d/1MGuyIH8bSQ3jBsk8kKsxSAsildZA11Rwhq3HyZ4dfA4/edit?usp=drivesdk)  
  *Latar belakang klinis, alur 5 tahap operasional, protokol Buku KIA Kemenkes, dan roadmap implementasi.*

- **Google Spreadsheet (RAB & Matriks Klinis)**:  
  [Buka Google Spreadsheet](https://docs.google.com/spreadsheets/d/1J38nXV5J0ri4aM3_s0h6bYo-dELT1FO5RBnxITIlUtc/edit?usp=sharing)  
  *Rincian anggaran biaya pilot lapangan dan kamus lengkap pesan interaktif KF1–KF4 (Tab resmi: `RAB Revisi (3 Bulan)`).*

- **Product Requirement Document (PRD Web Platform)**:  
  Lihat [`docs/PRD_SIM_NIFAS_SURABAYA.md`](docs/PRD_SIM_NIFAS_SURABAYA.md) untuk spesifikasi modul pemulangan KRS, kunjungan rumah 48 jam bertoken, 10 KPI kesehatan kota, dan kontrak API web.

- **Dokumen Project Charter Formal (DOCX Lokal)**:  
  `docs/PROJECT_CHARTER_MONITORING_NIFAS.docx`  
  *Dokumen Word resmi terstandarisasi dengan caption tabel formal dan flowchart beresolusi tinggi (dibuat via `make docs`).*

- **Diagram Alir ISO/ANSI & Visualisasi Sistem**:  
  Lihat [`FLOWCHART.md`](FLOWCHART.md) untuk bagan alir Mermaid orthogonal. Seluruh diagram formal resolusi tinggi (300 DPI) digenerate secara native via Python Matplotlib (`make charts`), dengan berkas sumber arsip di `docs/*.drawio`.

---

## 2. Prinsip Rekayasa Sistem (Core Principles)

1. **Discharge Planning Continuity (Zero Delay Reporting)**:  
   Menghubungkan rumah sakit pemulih dengan fasilitas pelayanan primer secara instan. Begitu pasien keluar rumah sakit (KRS), penugasan otomatis terdistribusi ke Bidan Kelurahan dalam $< 1\text{ menit}$.
2. **Penegakan SLA Kunjungan Rumah 48 Jam ($2 \times 24\text{ Jam}$)**:  
   Menjamin setiap ibu nifas yang dipulangkan mendapatkan kunjungan rumah oleh Bidan Kelurahan $\le 48\text{ jam}$. Sistem mengotomatisasi hitung mundur SLA, pengingat 24 jam, dan eskalasi keterlambatan ke Kepala Puskesmas.
3. **Deteksi Tanda Bahaya & Realtime Red Alert**:  
   Triase otomatis langsung mengevaluasi hasil pemeriksaan fisik. Jika terdeteksi kondisi darurat maternal, sistem membunyikan alarm visual di dashboard pimpinan dan memicu pesan WhatsApp darurat ke nakes dalam waktu $< 15\text{ menit}$.
4. **Strictly NO LLM (Zero Medical Hallucination)**:  
   Seluruh penilaian triase dan pengelompokan risiko klinis dieksekusi secara **deterministik berbasis Buku KIA Kemenkes RI**. Tidak ada model bahasa generatif (AI) di alur triase klinis untuk menjamin kepatuhan medis dan keabsahan diagnosis.
5. **Pelaporan Ringan Bertoken Kriptografis (Tokenized Direct Link)**:  
   Bidan Kelurahan melaporkan hasil kunjungan fisik di lapangan melalui tautan token acak 64-karakter yang aman tanpa hambatan autentikasi login yang rumit di lapangan.
6. **Isolasi Data Multi-Tenant (Supabase Row Level Security)**:  
   Isolasi hak akses data ditegakkan di level basis data. Bidan RS hanya mengakses pasien faskesnya; Bidan Kelurahan hanya mengakses wilayah kelurahannya; Kepala Puskesmas mengawasi wilayah puskesmasnya; Dinas Kesehatan memantau agregat seluruh kota.
7. **Siklus Pemantauan Lengkap 42 Hari**:  
   Kunjungan rumah 48 jam berpadu dengan pemantauan berkala KF1–KF4 hingga hari ke-42 pascasalin untuk memastikan pemulihan organ reproduksi dan pencegahan komplikasi lanjutan.

---

## 3. Arsitektur Aliran Data (System Architecture)

```mermaid
sequenceDiagram
    autonumber
    actor BidanRS as Bidan RS
    participant Web as Web App (Next.js 15)
    participant DB as Supabase (PostgreSQL 16)
    participant WA as WhatsApp Gateway (Fonnte / Meta)
    actor BidanKel as Bidan Kelurahan
    actor Ibu as Ibu Nifas
    actor Kapus as Kepala Puskesmas / Dinkes

    Note over BidanRS,Web: Tahap 1: Pemulangan Pasien (KRS)
    BidanRS->>Web: Input Form KRS (/krs) & Submit
    Web->>DB: Insert tr_discharge (Hitung SLA = KRS + 48 Jam & Buat Token 64-Hex)
    DB-->>Web: Trigger antrean pesan ke log_notifikasi_wa

    par Distribusi Penugasan & Edukasi
        Web->>WA: Kirim Notifikasi Penugasan (Bidan Kelurahan & Kapus)
        WA->>BidanKel: Pesan Penugasan + Tautan Kunjungan Bertoken (/visit/[token])
        WA->>Kapus: Tembusan Pemantauan Wilayah
    and
        Web->>WA: Kirim Pesan Edukasi & Jadwal Kontrol
        WA->>Ibu: Pesan Sapaan, Jadwal Kontrol, & 5 Tanda Bahaya Nifas
    end

    Note over BidanKel,DB: Tahap 2: Kunjungan Rumah 48 Jam & Triase
    BidanKel->>Web: Buka Tautan Bertoken (/visit/[token]) & Isi Laporan Fisik
    Web->>DB: Submit tr_home_visit (Hitung Durasi Sejak KRS & Evaluasi Triase)
    
    alt Terdeteksi Tanda Bahaya Maternal
        DB->>DB: Kunci Status = TANDA_BAHAYA & Terbitkan tr_emergency_alert
        DB-->>Web: Broadcast Supabase Realtime Event
        Web-->>Kapus: Muncul Banner Red Alert Menyala di Dashboard
        Web->>WA: Kirim Pesan Darurat Prioritas Tinggi
        WA->>BidanKel: Pesan Siaga Bahaya Nifas: Segera Tindak Lanjut / Rujuk
    else Kondisi Sehat / Normal
        DB->>DB: Kunci Status = SEHAT & VISITED_ON_TIME
    end

    Note over DB,Kapus: Tahap 3: Pemantauan SLA & Analitik Dashboard
    loop Background Cron Job (Tiap Menit)
        Web->>DB: Pindai Pasien Lewat 24 Jam (Reminder) & 48 Jam (Eskalasi Terlambat)
    end
    Kapus->>Web: Buka /dashboard (10 Indikator Kinerja & Analitik Kota)
```

---

## 4. Struktur Direktori Proyek

Struktur proyek diatur secara modular dan terpisah berdasarkan tanggung jawab platform:

```
pengmas-rs-surabaya/
├── web/                 # Aplikasi Web Utama SIM-NIFAS (Next.js 15, Supabase, Tailwind, App Router)
│   ├── src/app/         # Halaman aplikasi (KRS, Kunjungan Bertoken, Dashboard Nakes) & API Routes
│   ├── src/components/  # Komponen UI: Red Alert banner, formulir, cincin timer SLA, visualisasi data
│   ├── src/lib/         # Client Supabase RLS, antrean worker WA, dan query analitik
│   ├── supabase/        # Skema basis data PostgreSQL, migrasi bertahap, fungsi RLS, dan seed data
│   ├── scripts/         # Skrip pembuatan akun nakes uji per faskes
│   └── e2e/             # Pengujian end-to-end terautomasi dengan Playwright
├── app/                 # Modul Engine Riset & Bot WA KIA (FastAPI, SQLModel, Triage Engine, APScheduler)
├── docs/                # Dokumen Spesifikasi, PRD SIM-NIFAS, Project Charter, dan Flowchart
├── tools/report_docs/   # Toolchain generator dokumen formal DOCX & render diagram alir 300 DPI
├── tests/               # Rangkaian uji otomatis backend Python (smoke test)
├── Makefile             # Otomasi alur kerja: setup, dev, build, seed-users, test-e2e, docs
└── docker-compose.yml   # Kontainer basis data lokal pendukung
```

---

## 5. Skema Basis Data & Fitur Supabase

Platform operasional web SIM-NIFAS menggunakan **Supabase (PostgreSQL 16)** dengan isolasi keamanan data dan automasi logika di level basis data:

### Entitas Relasional Utama
| Tabel | Keterangan Entitas | Karakteristik Kunci |
|---|---|---|
| `m_puskesmas` | Master Puskesmas se-Surabaya | Wilayah kecamatan dan kontak operasional |
| `m_kelurahan` | Master Kelurahan binaan | Terikat secara hierarkis ke `m_puskesmas` |
| `m_rumah_sakit` | Master Rumah Sakit rujukan pemulangan | Tipe RS dan alamat fasilitas |
| `users` | Akun pengguna dan profil tenaga kesehatan | Terikat dengan Supabase Auth, peran, faskes, dan kelurahan |
| `tr_discharge` | Rekam pemulangan pasien (KRS) | Token 64-hex acak, batas SLA 48 jam, status kunjungan, diagnosis |
| `tr_home_visit` | Laporan hasil kunjungan rumah Bidan Kelurahan | Suhu tubuh, checklist 5 tanda bahaya, catatan klinis, konfirmasi kontrol |
| `tr_emergency_alert` | Rekam eskalasi kedaruratan (Red Alert) | Jenis bahaya, penanda status resolusi, waktu penanganan nakes |
| `log_notifikasi_wa` | Antrean dan jejak audit pengiriman WhatsApp | Template ID, nomor tujuan, status pengiriman (`QUEUED`, `SENT`, `FAILED`) |

### Keunggulan Engine Basis Data Supabase
1. **Row Level Security (RLS)**: Pembatasan data transaksional otomatis sesuai peran nakes dan wilayah kerja tanpa risiko kebocoran data antar-faskes.
2. **Database Triggers**: Kalkulasi batas waktu SLA ($T_{\text{deadline}} = T_0 + 48\text{ jam}$), penerbitan token, dan kalkulasi triase tanda bahaya dieksekusi secara instan di level database.
3. **RPC Function (`get_dashboard_analytics`)**: Seluruh 10 indikator kinerja nifas dihitung langsung oleh mesin PostgreSQL, mengeliminasi masalah performa query N+1 pada dashboard pimpinan.
4. **Supabase Realtime**: Menyebarkan sinyal peringatan bahaya (*Red Alert*) seketika ke antarmuka web tanpa perlu memuat ulang halaman (*polling*).

*(Catatan: Modul Python/SQLModel di folder `app/` dipertahankan sebagai modul riset pelengkap untuk evaluasi bot KIA interaktif).*

---

## 6. Protokol Klinis & Logika Triase Deterministik

### A. Alur Protokol Pemulangan Pasien (KRS)
1. **Verifikasi Wilayah Binaan**: Pemetaan domisili pasien secara presisi (Kecamatan -> Kelurahan) sehingga Puskesmas dan Bidan Kelurahan pengampu terkunci secara otomatis.
2. **Skrining Klinis Pulang**: Dokumentasi diagnosis rawat, kondisi luka jahitan (SC / perineum), terapi obat oral, dan penetapan tanggal kontrol ulang.
3. **Edukasi Pemulangan Mandiri**: Informasi personal kepada ibu dan keluarga mengenai 5 tanda bahaya yang memerlukan penanganan darurat.

### B. Protokol Kunjungan Rumah 48 Jam & 5 Tanda Bahaya Nifas Kemenkes RI
Bidan Kelurahan melakukan pemeriksaan fisik langsung di rumah ibu nifas dalam rentang waktu $\le 48\text{ jam}$ pascasalin dengan memeriksa parameter klinis:
1. **Demam Tinggi**: Suhu tubuh $> 38{,}0^\circ\text{C}$ (risiko infeksi nifas / sepsis puerperalis).
2. **Perdarahan Abnormal**: Darah mengalir deras atau bergumpal dari jalan lahir.
3. **Nyeri Perut Hebat**: Nyeri tekan akut pada abdomen bawah atau involusi rahim terganggu.
4. **Infeksi Luka Jahitan**: Bekas luka SC atau perineum terbuka, bengkak merah, berbau busuk, atau mengeluarkan nanah.
5. **Gejala Sistemik Berat**: Pusing berputar hebat, pandangan kabur, muntah terus-menerus, atau lemas ekstrem.

### C. Klasifikasi Triase Deterministik
- 🟢 **SEHAT**: Suhu tubuh $\le 38{,}0^\circ\text{C}$, seluruh checklist bahaya negatif, dan ibu dalam kondisi pemulihan wajar.
- 🟡 **KOMPLIKASI**: Keluhan ringan/lokal non-fatal (puting lecet, payudara bengkak/bendungan ASI, nyeri luka jahitan ringan). Bidan memberikan asuhan mandiri dan pemantauan berkala.
- 🔴 **TANDA BAHAYA (Red Alert)**: Memenuhi salah satu atau lebih tanda bahaya maternal. Sistem menerbitkan tiket darurat dan membunyikan alarm dashboard untuk respon cepat $< 15\text{ menit}$.

---

## 7. Model Keamanan & Kepatuhan Privasi Data

1. **Autentikasi & Autorisasi Bertingkat (RBAC & RLS)**:
   - **Bidan RS**: Memiliki hak tulis (*insert*) data pemulangan pasien (KRS) pada rumah sakit tempatnya bertugas.
   - **Bidan Kelurahan**: Memiliki hak akses terhadap data pemulangan dan laporan kunjungan khusus pada wilayah kelurahan binaannya.
   - **Kepala Puskesmas**: Memiliki hak supervisi manajerial dan eskalasi Red Alert untuk seluruh kelurahan di wilayah kerja puskesmasnya.
   - **Dinas Kesehatan (Superadmin)**: Akses analitik agregat terhadap seluruh data fasilitas kesehatan di Kota Surabaya.
2. **Akses Kunjungan Bertoken Kriptografis**:
   - Tautan kunjungan rumah menggunakan string acak 64-karakter heksadesimal dengan validitas maksimal 7 hari dan hanya dapat digunakan untuk submit final satu kali (*single-use token*).
3. **Proteksi Background Task & Endpoint Cron**:
   - Endpoint `/api/cron` dilindungi menggunakan verifikasi header `Authorization: Bearer <CRON_SECRET>`.
4. **Kepatuhan Privasi Data Medis (UU PDP No. 27/2022)**:
   - Seluruh transmisi jaringan menggunakan enkripsi TLS 1.3 (HTTPS).
   - Data tersimpan terlindungi dengan enkripsi database at-rest.
   - Setiap aktivitas pengiriman pesan WhatsApp tercatat dalam tabel audit `log_notifikasi_wa`.

---

## 8. Panduan Menjalankan Aplikasi Web SIM-NIFAS (Next.js & Supabase)

Seluruh alur kerja telah diotomatisasi melalui **`Makefile`** di root repositori.

### Langkah 1: Setup Awal & Dependensi
```bash
make setup
```
> Perintah ini menyalin template `web/.env.example` menjadi `web/.env.local` dan mengunduh dependensi npm.

### Langkah 2: Konfigurasi Kredensial Supabase
Buka file `web/.env.local` dan isi kredensial proyek Supabase Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...

# Opsional: Token WhatsApp Gateway (Fonnte)
FONNTE_TOKEN=

NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=sim_nifas_cron_secret_2026
AKUN_UJI_PASSWORD=Uji-VPB-hlJC
```

### Langkah 3: Setup Skema Basis Data di Supabase
Terapkan berkas migrasi database pada folder `web/supabase/migrations/` dan data awal `web/supabase/seed.sql` ke database Supabase Anda:
- **Cara 1 (Supabase CLI - Direkomendasikan)**:
  ```bash
  npx --prefix web supabase db push --include-seed
  ```
- **Cara 2 (SQL Editor Manual)**: Jalankan berkas SQL di dalam `web/supabase/migrations/` secara berurutan sesuai urutan nama file, lalu akhiri dengan `web/supabase/seed.sql`.

### Langkah 4: Membuat Akun Tenaga Kesehatan Uji
```bash
make seed-users
```
> Skrip ini otomatis mendaftarkan 4 akun nakes percontohan ke Supabase Auth.

### Langkah 5: Menjalankan Aplikasi
- **Mode Pengembangan (Development)**:
  ```bash
  make dev
  ```
  Buka browser di **`http://localhost:3000`**.
- **Mode Produksi (Production / Demo)**:
  ```bash
  make build
  make start
  ```

---

### Informasi Akun Login Uji (`/login`)
Semua akun menggunakan kata sandi bawaan yang dikonfigurasikan pada `AKUN_UJI_PASSWORD`:

| Peran Pengguna | Email Login | Hak Akses Utama |
|---|---|---|
| **Bidan RS** | `bidan.rs@uji.test` | Form pemulangan pasien (`/krs`) & riwayat KRS RS terkait |
| **Bidan Kelurahan** | `bidan.gundih@uji.test` | Penugasan kunjungan 48 jam, form laporan bertoken (`/visit/[token]`) |
| **Kepala Puskesmas** | `kapus.gundih@uji.test` | Supervisi wilayah puskesmas, batas SLA, eskalasi Red Alert |
| **Admin Dinkes** | `dinkes@uji.test` | Dashboard agregat 10 KPI Kota Surabaya, filter kecamatan & puskesmas |

---

### Daftar Perintah Otomasi `Makefile`

| Perintah | Deskripsi |
|---|---|
| `make help` | Menampilkan panduan seluruh perintah Makefile |
| `make setup` | Menyiapkan `web/.env.local` dan mengunduh dependensi npm |
| `make dev` | Menjalankan server development Next.js |
| `make build` | Mengompilasi aplikasi untuk mode produksi |
| `make start` | Menjalankan server aplikasi mode produksi |
| `make seed-users` | Mendaftarkan 4 akun nakes uji ke Supabase Auth |
| `make lint` | Memeriksa kualitas kode web dengan ESLint |
| `make test-e2e` | Menjalankan automated test Playwright end-to-end |
| `make charts` | Merender ulang gambar flowchart 300 DPI (`tools/report_docs/render_charts.py`) |
| `make docs` | Mengompilasi dokumen Project Charter DOCX formal (`tools/report_docs/main.py`) |
| `make clean` | Membersihkan cache build `.next` |

---

## 9. Rangkaian Pengujian Terautomasi (Dual-Layer Testing)

Repositori dilengkapi pengujian menyeluruh pada dua layer sistem:

### A. Uji End-to-End Web Platform (Playwright)
Menguji skenario operasional nyata pada database Supabase: alur login nakes, pengisian KRS oleh Bidan RS, laporan kunjungan bertanda bahaya oleh Bidan Kelurahan, kemunculan Red Alert di dashboard Kepala Puskesmas, dan pergantian tab tanpa muat ulang oleh Dinkes:
```bash
make test-e2e
```

### B. Uji Engine Backend Python (Smoke Test)
Menguji 9 skenario inti modul backend Python dan evaluasi triase deterministik:
```bash
uv run python tests/smoke_test.py
```

### C. Pemeriksaan Linter Frontend
```bash
make lint
```

---

## 10. Contoh Pengujian Endpoint API (cURL)

### 1. Pendaftaran Pasien Pulang (Bidan RS)
```bash
curl -X POST "http://localhost:3000/api/v1/discharge" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_BIDAN_RS>" \
  -d '{
    "nik": "3578012345670001",
    "nama_ibu": "Ny. Siti Aminah",
    "alamat_lengkap": "Jl. Jepara No. 10, Kel. Gundih",
    "kelurahan_id": "<UUID_KELURAHAN_GUNDIH>",
    "no_whatsapp_ibu": "+6281234567890",
    "diagnosis_sebelum_pulang": "Post partum normal hari ke-2",
    "diagnosis_perawatan": "Luka perineum derajat 2 terawat baik",
    "rekomendasi_perawatan_rumah": "Mobilisasi bertahap, rawat luka bersih, ASI eksklusif",
    "jadwal_kunjungan_ulang": "2026-11-05",
    "faskes_kunjungan_ulang": "PUSKESMAS"
  }'
```

### 2. Pelaporan Kunjungan Rumah Bertoken (Bidan Kelurahan)
```bash
curl -X POST "http://localhost:3000/api/v1/visit/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "token_kunjungan": "<TOKEN_64_HEX>",
    "suhu_tubuh": 38.5,
    "perdarahan_abnormal": true,
    "nyeri_perut_hebat": true,
    "luka_berbau_infeksi": false,
    "pusing_muntah_lemas": true,
    "status_hasil": "ADA_MASALAH",
    "catatan_kebidanan": "Ibu demam tinggi, darah nifas banyak dan nyeri perut",
    "konfirmasi_jadwal_kontrol": "2026-11-03"
  }'
```

### 3. Eksekusi Background Cron SLA (Tiap Menit)
```bash
curl -X GET "http://localhost:3000/api/cron" \
  -H "Authorization: Bearer sim_nifas_cron_secret_2026"
```

---

## 11. Generator Diagram Alir & Laporan Formal

Repositori menyediakan toolchain lokal murni Python untuk merender diagram beresolusi tinggi (300 DPI) dan mengompilasi dokumen resmi Project Charter:

```bash
# 1. Render ulang seluruh gambar diagram alir (300 DPI) ke docs/assets/
make charts

# 2. Kompilasi dokumen resmi Project Charter DOCX
make docs
```

---

## 12. Keamanan Lingkungan & Sanitasi Repositori

1. **Bebas Kredensial Produksi**: Repositori ini bebas dari kunci rahasia, nomor telepon pribadi, dan token produksi. Seluruh konfigurasi kredensial dikelola melalui file lingkungan lokal (`web/.env.local`) yang diabaikan oleh git (`.gitignore`).
2. **Data Sintetis Pengujian**: Seluruh data nama pasien, NIK, dan nomor telepon yang tercantum dalam pengujian atau contoh adalah data sintetis (*dummy*) untuk simulasi teknis.
3. **Kepatuhan Privasi**: Sistem tidak mengirimkan data identitas pasien ke layanan publik atau model kecerdasan buatan eksternal tanpa enkripsi dan persetujuan resmi.
