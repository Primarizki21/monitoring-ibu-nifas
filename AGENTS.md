# AGENTS.md — Sistem Monitoring Kesehatan Ibu Nifas (Pengmas RS & Puskesmas Surabaya)

## 1. Project Overview & Scope
Sistem pemantauan kesehatan ibu nifas terautomasi berbasis **WhatsApp** dan **PWA (Progressive Web App)** untuk kegiatan Pengabdian Masyarakat (Pengmas) di Surabaya.
- **Mitra Faskes**: 3 Rumah Sakit rujukan + 10 Puskesmas mitra di wilayah Surabaya.
- **Durasi Pilot**: **3 Bulan Operasional Lapangan**.
- **Skala Target**: ~500 ibu bersalin/bulan (~1.500 ibu nifas selama pilot), ~80 bidan/petugas kesehatan.
- **Sifat Sistem**: **Murni Standalone** (tanpa beban integrasi SIMPUS / SatuSehat pada fase pilot untuk memastikan kecepatan deploy dan stabilitas).
- **Prinsip Utama**: **Strictly NO LLM** (Deterministic Rule-Based Medical Flow). Semua interaksi pasien menggunakan template chat terstruktur sesuai standar Buku KIA Kemenkes RI demi kepatuhan klinis, zero-hallucination, dan efisiensi biaya.

---

## 2. Onboarding Pasien & Strategi Kontak (Primary vs Emergency Contact)

### A. Alur Pendaftaran saat Discharge Planning
- Pendaftaran dilakukan saat persiapan pemulangan pasien dari RS/Puskesmas oleh **Bidan bersama Pendamping (Suami/Keluarga)** agar ibu yang lelah pascasalin tidak terbebani administrasi.

### B. Distribusi Nomor Kontak
1. **Nomor WhatsApp Utama (Ibu Nifas)**:
   - **Tujuan**: Menerima seluruh reminder jadwal nifas (KF1–KF4) dan mengisi skrining gejala langsung.
   - **Rasional Klinis**: Ibu nifas adalah subjek yang merasakan langsung sensasi fisik tubuhnya (perdarahan, nyeri, demam, bendungan ASI). Menghubungi ibu secara langsung memangkas *delay* komunikasi ("efek telepon berantai") dibanding jika harus lewat suami yang mungkin sedang bekerja di luar.
2. **Nomor WhatsApp Cadangan / Kontak Darurat (Pendamping / Suami)**:
   - Dicatat saat pendaftaran sebagai **Emergency Fail-Safe**.
   - Digunakan oleh sistem / bidan faskes jika:
     a. Ibu tidak merespons skrining berkala setelah reminder berulang (>24 jam).
     b. Terdeteksi tanda bahaya kritis (🔴 **Status Merah**) dan ibu memerlukan pendampingan segera untuk evakuasi ke faskes.

---

## 3. Siklus Hidup Pemantauan Pasien (42 Hari Nifas)

1. **Sesi Skrining (Per-Milestone)**:
   - Berlangsung saat jadwal KF tiba (KF1, KF2, KF3, atau KF4).
   - Bot mengirim reminder $\rightarrow$ ibu memilih opsi tombol/angka $\rightarrow$ triase deterministik (Hijau/Kuning/Merah).
   - Jika terdeteksi keluhan (Kuning/Merah), bot menutup *sesi percakapan saat itu* dengan meneruskan data ke bidan PJ dan memberikan kontak Bidan PJ (`wa.me`) kepada ibu.
2. **Siklus Hidup Pasien (Total Masa Nifas 42 Hari)**:
   - Meskipun ibu nifas sempat berstatus Kuning/Merah pada KF1 atau KF2 dan telah dihubungi oleh bidan, **STATUS PEMANTAUAN SISTEM TETAP AKTIF**.
   - Sistem akan terus mengirimkan reminder untuk jadwal berikutnya (KF2, KF3, hingga KF4) sesuai linimasa hari persalinan.
   - Pemantauan otomatis **HANYA BERHENTI** jika:
     a. Telah melewati periode KF4 (hari ke-42) dan ditandai `LULUS / SELESAI NIFAS` oleh sistem/bidan.
     b. Pasien dirujuk rawat inap intensif / meninggal / meminta berhenti (status diubah manual oleh Admin Faskes menjadi `NONAKTIF/DIRUJUK`).

---

## 4. Struktur Role & Akses Pengguna (Multi-Tenant RBAC)

### A. Super Admin (Dinas Kesehatan Kota Surabaya)
- **Cakupan Data**: Global seluruh Surabaya (semua RS dan Puskesmas).
- **Fitur Utama**:
  - Manajemen akun faskes (membuat dan mengelola akun Admin RS / Puskesmas).
  - Dashboard analitik & agregat kesehatan (total ibu nifas terpantau, angka kelengkapan skrining KF1–KF4, sebaran kasus merah/kuning).
  - Ekspor laporan epidemiologi & capaian kegiatan Pengmas untuk pengambil kebijakan.

### B. Admin Faskes (Admin Rumah Sakit & Puskesmas)
- **Cakupan Data**: Terisolasi pada faskes masing-masing (*Tenant Data Scoping*).
- **Fitur Utama**:
  - Registrasi ibu nifas baru saat kepulangan (*discharge planning*).
  - Antrean triase harian pasien nifas binaan (Filter: Merah, Kuning, Hijau).
  - **Aksi Cepat Follow-up**: Tombol 1-klik `[Hubungi Ibu via WhatsApp]` yang memicu direct link `wa.me` ke nomor pasien.
  - Opsi darurat: Tombol `[Hubungi Kontak Darurat (Suami)]` jika pasien tidak merespons.
  - Dokumentasi tindakan (sudah ditelepon, dikunjungi, atau dirujuk).
  - Manajemen status siklus nifas pasien (Aktif, Dirujuk, Selesai).

---

## 5. Arsitektur Komunikasi WhatsApp: Model Hybrid Dua Sisi

```
                              [NOMOR BOT UTAMA PUSAT]
                               (WhatsApp Cloud API)
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
          1. Reminder Jadwal KF                       2. Skrining Tertutup
          ("Ibu Siti, hari ini jadwal KF2...")         (Pilihan: [Aman] / [Ada Keluhan])
                                                               │
                                                               ▼
                                                      Jika Status 🟡 / 🔴
                                                               │
                                                               ▼
                                   ┌───────────────────────────┴───────────────────────────┐
                                   ▼                                                       ▼
                          [PESAN PENUTUP BOT KE IBU]                              [ALERT KE PWA BIDAN]
               "Keluhan diteruskan ke Bidan Siti (Puskesmas X).                Bidan klik [Hubungi Ibu]
                Kontak Bidan: wa.me/6281xxx"                                               │
                                                                                           ▼
                                                                                 [Bidan Chat Langsung]
```

1. **Bot Pusat**: Mengirim reminder otomatis KF1–KF4 langsung ke WhatsApp ibu, memproses jawaban angka/tombol, mengalkulasi skor triase. Jika ada keluhan, bot memberikan kontak Bidan PJ kepada ibu.
2. **Bidan Faskes**: Menerima alert di dashboard PWA dan menghubungi ibu via WhatsApp dinas untuk anamnesis lanjutan.
3. **Siklus Tetap Berjalan**: Setelah intervensi selesai, status insiden dicatat di web PWA, dan sistem tetap bersiap mengirim jadwal KF berikutnya.

---

## 6. Protokol Medis & Jadwal Skrining Kemenkes (KF1 – KF4)

| Periode | Waktu Pascasalin | Fokus Pemantauan & Tanda Bahaya |
|---|---|---|
| **KF1** | 6 jam – 2 hari | Perdarahan primer (>2 pembalut basah/jam), atonia uteri, nyeri kepala hebat, pandangan kabur. |
| **KF2** | 3 – 7 hari | Lochea berbau, demam nifas (>38°C), nyeri perut hebat, bendungan ASI / mastitis. |
| **KF3** | 8 – 28 hari | Infeksi luka perineum/jahitan SC (bernanah/bengkak/terbuka), lochea purulenta, bengkak kaki. |
| **KF4** | 29 – 42 hari | Pemulihan organ reproduksi, rencana KB pascasalin, skrining depresi (skala EPDS sederhana). |

---

## 7. Rencana Deliverables Proyek

1. **Google Spreadsheet (Terpadu di File Saat Ini `1J38nXV5J0ri4aM3_s0h6bYo-dELT1FO5RBnxITIlUtc`)**:
   - Menambahkan tab baru:
     - `RAB Revisi — WA Direct (3 Bulan)`: Anggaran riil tanpa biaya perantara platform, dihitung untuk total periode 3 bulan pilot.
     - `Matriks Template & Triase KF1-KF4`: Kamus pesan terstruktur dan parameter scoring merah/kuning/hijau.
2. **Google Docs (Dokumen Abstraksi Proyek / Technical Whitepaper)**:
   - Dokumen formal untuk pimpinan riset & Dinas Kesehatan Surabaya:
     - Latar Belakang & Urgensi Pemantauan Nifas di Surabaya.
     - Konsep & Arsitektur Solusi (Tanpa LLM, Direct Mother WA + Emergency Contact Suami, Multi-Tenant).
     - Alur Kerja End-to-End (Mermaid Diagram).
     - Standar Klinis KF1–KF4 & SOP Triase Faskes.
     - Ringkasan Anggaran & Efisiensi Biaya (Tautan ke Google Spreadsheet).

---

## 8. Workflow: Verifikasi Berulang & Atomic Commits

Setiap pengembangan fitur, perbaikan bug, atau penambahan dokumen dalam proyek ini **wajib mematuhi alur kerja berikut**:

### A. Kriteria Verifikasi Terlebih Dahulu (Goal-Driven Verification)
1. **Tidak Ada Asumsi**: Jangan menganggap kode atau dokumen bekerja hanya karena sintaks tidak error.
2. **Smoke Test Wajib**: Setiap modul backend harus diverifikasi melalui eksekusi nyata menggunakan `uv run` (misalnya: test import, run schema validation, panggil endpoint health).
3. **Pemeriksaan Bukti Hasil**: Verifikasi keluaran riil dari tool/API sebelum berpindah fase pekerjaan (misal membaca kembali sheet/doc yang baru di-generate).

### B. Protokol Atomic Commits
1. **Satu Unit Perubahan Logis**: Setiap commit git hanya boleh mencakup satu fokus pekerjaan yang terisolasi dan mandiri (misal: penambahan konfigurasi, pembuatan model data, penambahan dokumentasi alur).
2. **Jangan Menggabungkan Perubahan Berbeda (No Mega-Commits)**: Dilarang menggabungkan perubahan dependensi, perbaikan fitur, dan dokumentasi dalam satu commit tunggal.
3. **Format Pesan Standar**:
   - `docs: <deskripsi>`: Untuk perubahan dokumen, flowchart, dan knowledge base.
   - `feat: <deskripsi>`: Untuk penambahan fitur atau modul baru.
   - `fix: <deskripsi>`: Untuk perbaikan bug atau koreksi alur.
   - `chore: <deskripsi>`: Untuk pengaturan dependensi, konfigurasi env, atau toolchain.
4. **Kondisi Bersih**: Repositori harus selalu dalam kondisi buildable/runnable di setiap commit yang dibuat.
