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

## 7. Rencana Deliverables Proyek & Nomenklatur Dokumen

### A. Daftar Berkas & Nomenklatur Terkini
1. **Dokumen Project Charter & Spesifikasi Teknis (DOCX & Google Docs)**:
   - **Berkas Lokal**: `docs/PROJECT_CHARTER_MONITORING_NIFAS.docx` (dibuat otomatis via `uv run python tools/report_docs/main.py`).
   - **Usulan Nama v2**: `docs/[v2]_PROJECT_CHARTER_MONITORING_NIFAS.docx` / `Project Charter & Technical Specification — Sistem Monitoring Nifas Surabaya (v2.0)`.
   - **Google Docs Resmi**: [Project Charter & Technical Brief](https://docs.google.com/document/d/1MGuyIH8bSQ3jBsk8kKsxSAsildZA11Rwhq3HyZ4dfA4/edit?usp=drivesdk)
   - **Aturan Workflow**: *Local-First* (.docx lokal di-generate offline terlebih dahulu tanpa latensi API, diverifikasi integritasnya, baru diunggah/disinkronkan ke Google Docs).
2. **Lembar Kerja Anggaran & Matriks Pesan (Google Spreadsheet)**:
   - **Judul Saat Ini**: `Copy of RAB Sistem Monitoring Ibu Nifas` (ID: `1J38nXV5J0ri4aM3_s0h6bYo-dELT1FO5RBnxITIlUtc`).
   - **Usulan Nama v2**: `[v2] RAB & Matriks Klinis — Sistem Monitoring Nifas Surabaya` (menghapus kata *"Copy of"* yang tidak formal).
   - **Tautan Lembar Kerja**: [Buka Google Spreadsheet RAB & Matriks](https://docs.google.com/spreadsheets/d/1J38nXV5J0ri4aM3_s0h6bYo-dELT1FO5RBnxITIlUtc/edit?usp=sharing)

---

## 8. Rincian Lengkap Rencana Anggaran Biaya (RAB Pilot 3 Bulan)

### A. Parameter & Asumsi Dasar
| Parameter | Nilai Asumsi | Keterangan Klinis & Operasional |
|---|---|---|
| **Durasi Pilot** | 3 Bulan | Mengawal 2 kohort siklus nifas penuh (42 hari/pasien). |
| **Faskes Terlibat** | 13 Faskes | 3 RS Rujukan (RSUD Dr. Soetomo, RSUD BDH, RSUD Soewandhie) + 10 Puskesmas mitra di Surabaya. |
| **Target Pasien** | 500 ibu/bulan | Total 1.500 ibu nifas terpantau selama fase pilot 3 bulan. |
| **Volume Pesan** | 7 pesan / ibu | Onboarding (1) + Skrining KF1–KF4 (4) + Follow-up keluhan (2). |
| **Total Pesan Bulanan** | 3.500 pesan/bulan | 500 ibu $\times$ 7 pesan interaktif terjadwal. |
| **Tarif Pesan Meta** | Rp356,65 / pesan | Tarif resmi Meta Graph API per percakapan/pesan kategori *Utility* (Indonesia, efektif 2026). |
| **Pajak (PPN)** | 11% | Tarif efektif PPN barang/jasa digital (PMK 131/2024). |
| **Kontingensi Risiko** | 10% | Cadangan fluktuasi kurs USD/IDR dan pesan follow-up tambahan. |

### B. Rincian Biaya Setup & Pengerjaan Awal (Sekali di Awal)
| Komponen | Spesifikasi / Vendor | Volume | Tarif Satuan | Total (Rp) |
|---|---|---|---|---|
| Domain `.id` | Registrar Lokal Resmi (Rumahweb/HostingEkspres) | 1 Tahun | Rp200.000 | Rp200.000 |
| Sertifikat SSL | Let's Encrypt (Auto-renew certbot) | 1 Paket | Rp0 (Open Source) | Rp0 |
| WABA & Meta Verified | Direct Meta Developer / Business Manager | 1 Akun | Rp0 (Gratis) | Rp0 |
| Deposit Saldo Awal Meta | Top-up Saldo Prabayar WhatsApp Meta API | 1 Kali | Rp300.000 | Rp300.000 |
| **Subtotal Pengerjaan** | | | | **Rp500.000** |
| **Kontingensi (10%)** | | | | **Rp50.000** |
| **TOTAL SETUP AWAL** | | | | **Rp550.000** |

### C. Rincian Biaya Operasional Bulanan (Per Bulan)
| Komponen | Spesifikasi / Vendor | Volume | Tarif Satuan | Total/Bulan (Rp) |
|---|---|---|---|---|
| VPS Backend & Database | Biznet GIO NEO Lite MM 8.8 (8 vCPU / 8 GB RAM) | 1 Bulan | Rp289.000 | Rp289.000 |
| Backup Offsite Harian | Biznet GIO NEO Object Storage (S3-compatible, ~20GB) | 1 Bulan | Rp20.000 | Rp20.000 |
| PPN Server & Storage (11%) | Pajak Pertambahan Nilai Infrastruktur Cloud Lokal | 1 Bulan | Rp33.990 | Rp33.990 |
| Pesan WhatsApp Cloud API | 3.500 pesan utility $\times$ Rp356,65 | 1 Bulan | Rp1.248.275 | Rp1.248.275 |
| PPN Pesan WhatsApp (11%) | Pajak Layanan Digital Luar Negeri | 1 Bulan | Rp137.310 | Rp137.310 |
| Amortisasi Tahunan Domain | Alokasi bulanan domain .id (Rp200.000 / 12) | 1 Bulan | Rp16.667 | Rp16.667 |
| Biaya Platform BSP Vendor | **DIHAPUS** (Menggunakan Direct Meta Cloud API) | 1 Bulan | Rp0 | Rp0 |
| **Subtotal Bulanan** | | | | **Rp1.745.242** |
| **Kontingensi Bulanan (10%)**| Buffer fluktuasi pesan & beban server | 1 Bulan | Rp174.524 | Rp174.524 |
| **TOTAL BULANAN** | | | | **Rp1.919.766** |

### D. Rekapitulasi Anggaran Penuh Pilot 3 Bulan
| Komponen Anggaran | Formula / Periode | Durasi | Subtotal (Rp) | Proporsi |
|---|---|---|---|---|
| Biaya Setup & Pengerjaan Awal | Sekali di Awal (Domain + Saldo Deposit + Kontingensi) | 1 Kali | Rp550.000 | 8,72% |
| Operasional Bulan ke-1 | Infrastruktur Server + Pesan WA + Kontingensi | Bulan 1 | Rp1.919.766 | 30,43% |
| Operasional Bulan ke-2 | Infrastruktur Server + Pesan WA + Kontingensi | Bulan 2 | Rp1.919.766 | 30,43% |
| Operasional Bulan ke-3 | Infrastruktur Server + Pesan WA + Kontingensi | Bulan 3 | Rp1.919.766 | 30,43% |
| **TOTAL ANGGARAN PILOT** | **Setup Awal + (3 $\times$ Biaya Operasional Bulanan)** | **3 Bulan** | **Rp6.309.298** | **100,00%** |

### E. Analisis Komparatif: Skenario A (WhatsApp) vs Skenario B (SMS Gateway)
Berdasarkan kajian komparasi pada lembar kerja spreadsheet:
1. **Skenario A (WhatsApp Direct Cloud API)**:
   - Total pengerjaan: Rp550.000. Biaya bulanan: Rp1.919.766/bln (tanpa BSP) atau Rp2.310.446/bln (jika via BSP vendor seperti Maxchat).
   - **Keunggulan Mutlak**: Mendukung komunikasi dua arah (ibu bisa membalas dengan tombol/angka), format interaktif, pesan panjang tanpa batasan 160 karakter, biaya per pesan lebih hemat (Rp356,65).
2. **Skenario B (SMS Gateway / SMS Masking)**:
   - Total pengerjaan: Rp2.420.000 (wajib deposit awal Rp2.000.000 ke vendor Zenziva).
   - Biaya bulanan: Rp6.409.509/bln (karena pesan dipecah per 153 karakter = 2 SMS/pesan, tarif blended operator Rp708/SMS).
   - **Alasan Eliminasi**: SMS Masking bersifat **Satu Arah (One-Way)** sehingga pasien **tidak bisa membalas skrining**. Ini menggugurkan fungsi inti pemantauan nifas.

---

## 9. Matriks Lengkap Pesan WhatsApp & Triase Klinis (KF1 – KF4)

Sistem menerapkan template pesan deterministik terstruktur sesuai algoritma Buku KIA Kemenkes RI:

| No. | Tahap Skrining | Waktu Eksekusi | Draf Template Pesan WhatsApp | Pilihan Input Ibu | Parameter Triase Klinis | Tindakan Sistem & Nakes |
|---|---|---|---|---|---|---|
| **0** | **Onboarding Pasien** | Hari ke-0 (Saat Pemulangan / Discharge) | *"Halo Ibu {{nama_ibu}}. Selamat atas kelahiran buah hati. Ini adalah layanan resmi pemantauan nifas Puskesmas {{nama_puskesmas}} dan Dinkes Surabaya. Kami akan menyapa Ibu secara berkala hingga hari ke-42 untuk memastikan pemulihan aman. Balas YA untuk konfirmasi."* | Ketik: **YA** | Validasi nomor aktif & persetujuan (*informed consent*) | Sistem mengubah status menjadi `AKTIF`. Scheduler mendaftarkan timeline otomatis KF1 s/d KF4. |
| **1** | **Skrining KF1** | Hari ke-1 s/d ke-2 (08.00 WIB) | *"Selamat pagi Ibu {{nama_ibu}}. Bagaimana kondisi pemulihan hari ini? Mohon pilih salah satu kondisi yang paling menggambarkan keadaan Ibu saat ini:\n1. Kondisi baik, perdarahan wajar, tidak ada keluhan.\n2. Ada keluhan pusing, nyeri perut hebat, atau darah keluar deras."* | Ketik angka: **1** atau **2** | • Opsi 1 $\rightarrow$ **HIJAU**\n• Opsi 2 $\rightarrow$ **MERAH** (Risiko perdarahan primer, atonia uteri, preeklampsia postpartum) | • Jika Hijau: Bot kirim edukasi istirahat & ASI eksklusif.\n• Jika Merah: Bot kirim instruksi bahaya & kontak bidan. Dashboard PWA memicu alert merah. |
| **2** | **Skrining KF2** | Hari ke-3 s/d ke-7 (08.00 WIB) | *"Selamat pagi Ibu {{nama_ibu}}. Memasuki hari ke-{{hari_nifas}}, bagaimana kondisi cairan nifas dan payudara Ibu?\n1. Aman: cairan berwarna merah kecokelatan tidak bau, ASI lancar.\n2. Keluhan Ringan: payudara bengkak/nyeri, puting lecet.\n3. Bahaya: demam menggigil, darah nifas berbau busuk."* | Ketik angka: **1**, **2**, atau **3** | • Opsi 1 $\rightarrow$ **HIJAU**\n• Opsi 2 $\rightarrow$ **KUNING** (Bendungan ASI / mastitis dini)\n• Opsi 3 $\rightarrow$ **MERAH** (Infeksi nifas / sepsis puerperalis) | • Jika Hijau: Edukasi perawatan payudara & nutrisi ibu.\n• Jika Kuning: Alert kuning di PWA, panduan kompres hangat.\n• Jika Merah: Alert merah prioritas + opsi hubungi kontak darurat suami. |
| **3** | **Skrining KF3** | Hari ke-8 s/d ke-28 (08.00 WIB) | *"Selamat pagi Ibu {{nama_ibu}}. Memasuki minggu pemulihan lanjutan, bagaimana kondisi bekas jahitan dan tubuh Ibu?\n1. Baik: luka membaik, cairan nifas makin sedikit/kuning.\n2. Keluhan: bekas jahitan nyeri/terbuka/bernanah, kaki bengkak berat, atau tensi naik."* | Ketik angka: **1** atau **2** | • Opsi 1 $\rightarrow$ **HIJAU**\n• Opsi 2 $\rightarrow$ **MERAH** (Infeksi luka jahitan SC/perineum, DVT, hipertensi lanjutan) | • Jika Hijau: Edukasi perawatan luka bersih & mobilisasi aktif.\n• Jika Merah: Alert merah ke Bidan PJ. Bidan klik tombol `wa.me` untuk memandu rujukan/kontrol fisik. |
| **4** | **Skrining KF4** | Hari ke-29 s/d ke-42 (08.00 WIB) | *"Selamat pagi Ibu {{nama_ibu}}. Masa nifas hampir selesai. Bagaimana perasaan dan rencana kesehatan Ibu?\n1. Sehat fisik dan mental, sudah ada rencana KB pascasalin.\n2. Cemas berat, sedih berkepanjangan, susah tidur (baby blues/depresi).\n3. Belum paham pilihan KB pascasalin."* | Ketik angka: **1**, **2**, atau **3** | • Opsi 1 $\rightarrow$ **HIJAU**\n• Opsi 2 $\rightarrow$ **KUNING** (Skrining awal depresi postpartum / EPDS)\n• Opsi 3 $\rightarrow$ **KUNING** (Kebutuhan konseling kontrasepsi) | • Jika Hijau: Bot kirim ucapan selamat & pengantar kelulusan.\n• Jika Opsi 2/3: Alert kuning di PWA bidan. Bidan menjadwalkan konseling psikologis ringan / edukasi KB. |
| **5** | **Pesan Tanggap Merah** | Otomatis saat status MERAH terdeteksi | *"PERINGATAN KESEHATAN: Ibu {{nama_ibu}}, gejala yang dilaporkan membutuhkan pemeriksaan segera oleh bidan atau dokter. Bidan {{nama_bidan}} (Puskesmas {{nama_puskesmas}}) telah kami beritahu. Kontak Bidan: wa.me/{{no_bidan}}. Jika kondisi lemas, segera ke IGD RS/Puskesmas terdekat bersama keluarga."* | Respon darurat | Eskalasi darurat medis tingkat 1 | Dikirim seketika (<5 detik) ke WhatsApp ibu. Baris antrean pasien di PWA berkedip merah dan memutar alert bunyi. |
| **6** | **Pesan Tanggap Kuning** | Otomatis saat status KUNING terdeteksi | *"Terima kasih atas laporannya Ibu {{nama_ibu}}. Keluhan Ibu telah diteruskan ke Bidan {{nama_bidan}} di Puskesmas {{nama_puskesmas}}. Bidan akan menghubungi Ibu dalam waktu dekat untuk memberikan panduan penanganan."* | Respon waspada | Eskalasi pantauan berkala (tindakan <24 jam) | Konfirmasi terkirim ke ibu. Pasien masuk daftar triase kuning untuk dihubungi bidan. |
| **7** | **Pesan Selesai / Kelulusan** | Hari ke-42 pascasalin (Evaluasi Final) | *"Selamat Ibu {{nama_ibu}}, Ibu telah berhasil menyelesaikan masa nifas 42 hari dengan sehat. Pantauan rutin nifas resmi selesai. Tetap jaga kesehatan Ibu dan tumbuh kembang si kecil. Datang ke Posyandu/Puskesmas secara teratur untuk imunisasi bayi."* | - | Status Akhir: `LULUS / SELESAI NIFAS` | Siklus pemantauan ditutup resmi. Jadwal otomatis dinonaktifkan. Pasien diarsipkan. |

---

## 10. Spesifikasi Teknis & Infrastruktur Komputasi

1. **Bahasa Pemrograman Python 3.12 & Astral uv**:
   - Eksekusi deterministik dengan kecepatan dependency resolution tinggi melalui `uv`.
2. **Framework Web & API**: **FastAPI (Asynchronous ASGI)**:
   - Menangani webhook masuk dari Meta WhatsApp Cloud API dengan latensi sub-detik (<1 detik).
3. **Basis Data**: **PostgreSQL 16**:
   - Standar relasional ACID untuk pencatatan rekam medis terenkripsi dan log triase multi-tenant.
4. **Konektivitas WhatsApp**: **Direct Meta WhatsApp Cloud API (Graph API v20+)**:
   - Tanpa perantara pihak ketiga; memanfaatkan kuota gratis dan tarif utility resmi Meta.
5. **Server Komputasi**: **VPS Biznet GIO NEO Lite MM 8.8 (8 vCPU / 8 GB RAM)**:
   - Data center lokal Surabaya/Jakarta untuk kepatuhan UU PDP No. 27/2022.
6. **Penyimpanan Cadangan**: **Biznet GIO NEO Object Storage (S3-Compatible, ~20GB)**:
   - Backup harian otomatis terpisah dari node server utama.
7. **Prinsip Operasional**: **Murni Standalone**:
   - Tidak terikat API SIMPUS/SatuSehat selama fase pilot demi keandalan 100%. Fitur export data Excel/CSV tersedia untuk rekonsiliasi manual.

---

## 11. Roadmap Implementasi Lapangan (Pilot 3 Bulan)

| Periode | Fase Lapangan | Target & Indikator Capaian Utama |
|---|---|---|
| **Minggu 0** | **Pra-Deployment** | Konfigurasi VPS, verifikasi nomor bot WABA resmi, setup akun 13 faskes mitra, simulasi end-to-end triase. |
| **Minggu 1 – 4** | **Bulan 1 Live** | Peluncuran resmi di 13 faskes, sosialisasi bidan PJ, onboarding Kohort 1 (~500 ibu), pemantauan KF1 & KF2 harian. |
| **Minggu 5 – 8** | **Bulan 2 Live** | Onboarding Kohort 2 (~500 ibu baru), pemantauan lanjutan Kohort 1 (KF3 & KF4), evaluasi respon bidan faskes terhadap alert triase. Total 1.000 ibu kumulatif. |
| **Minggu 9 – 12** | **Bulan 3 Live** | Onboarding Kohort 3 (~500 ibu baru), kelulusan nifas 42 hari Kohort 1 & 2, penarikan data analitik epidemiologi Surabaya, serah terima laporan ke Dinkes. Total 1.500 ibu kumulatif. |

---

## 12. Workflow: Verifikasi Berulang & Atomic Commits

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

### C. Workflow Eksekusi Rencana & To-Do List (Karpathy & J-Space Aligned)
1. **Dekomposisi Low-Level Tanpa Abstraksi**:
   - Pecah setiap arahan kerja ke dalam to-do list granular dengan kriteria keberhasilan yang dapat diverifikasi secara objektif.
   - Hindari langkah abstrak (misal: "perbaiki dokumen"); gunakan deskripsi spesifik (misal: "pecah kolom Tahap jadi No. & Tahapan, tambah caption Tabel 3.1").
2. **Eksekusi Loop & Update Status Berkelanjutan**:
   - Eksekusi tugas langkah demi langkah sesuai urutan dependensi logika.
   - Tandai to-do selesai secara langsung setelah verifikasi nyata berhasil sebelum beralih ke tugas berikutnya.
3. **Smoke Run & Inspeksi Bukti Nyata**:
   - Jalankan smoke test nyata (bukan hanya asumsi atau uji statis).
   - Periksa langsung keluaran akhir (struktur paragraf, XML, data tabel, atau respon API) sebelum menyatakan fase selesai.
4. **Siklus Atomic Commits Terisolasi**:
   - Setelah satu unit logis selesai dan terverifikasi, commit perubahan secara terpisah sesuai format konvensi repo (`feat:`, `docs:`, `fix:`, `chore:`).

---

## 13. Pedoman Standarisasi Dokumen DOCX & Tipografi

### A. Integritas Tipografi & Alignment (Anti-Stretching Rule)
1. **Dilarang Karakter `\n` pada Paragraf Justified**:
   - Jangan gunakan `\n` di dalam `p.add_run()` pada teks yang beralignment `JUSTIFY`.
   - Karakter `\n` diterjemahkan sebagai soft-break (`<w:br/>` / Shift+Enter), yang memaksa Word meregangkan spasi antar-kata secara tidak wajar pada baris sebelum break.
   - Setiap baris baru, butir catatan, atau sub-poin wajib dibuat sebagai paragraf mandiri (`<w:p>` / `doc.add_paragraph()` / `cell.add_paragraph()`).
2. **Struktur Callout Box & Metadata**:
   - Judul callout dan setiap butir teks/catatan wajib dipisah menjadi elemen paragraf (`<w:p>`) tersendiri di dalam sel tabel callout.
   - Judul diformat rata kiri (`LEFT`), sedangkan butir penjelasan diformat rata kanan-kiri (`JUSTIFY`) atau rata tengah (`CENTER` untuk box metadata cover).

### B. Standardisasi Tabel & Caption
1. **Pemisahan Kolom Nomor dan Nama/Tahapan**:
   - Kolom nomor urut (`No.`) dan nama tahap (`Tahapan`) wajib dipisah menjadi kolom tersendiri (jangan digabung menjadi satu kolom seperti `1. Pendaftaran`).
2. **Caption Tabel Formal**:
   - Setiap tabel wajib dilengkapi caption di atas tabel dengan format konsisten: `Tabel X.Y: <Judul Tabel>` (font 10pt bold, warna abu gelap, centered).
3. **Paragraf Pengantar Kontekstual**:
   - Setiap tabel wajib didahului minimal 1 paragraf narasi pengantar yang menjelaskan relevansi data bagi pembaca/reviewer non-teknis.
4. **Dual-Width Constraint & Distribusi Lebar Kolom**:
   - Lebar kolom wajib ditentukan secara eksplisit pada tingkat sel (`cell.width`) dan tabel dengan satuan pasti (`Inches` / DXA), dengan total penjumlahan sama dengan lebar konten halaman (6.27 inci pada A4 margin 1 inci).

### C. Standardisasi Penomoran Otomatis & Bolding
1. **Penomoran Otomatis OpenXML (`w:numPr`)**:
   - Gunakan fitur penomoran Word (`List Paragraph` dengan `w:numPr`) untuk daftar bernomor, bukan penomoran manual hardcoded dalam teks string.
   - Buat ID penomoran terpisah (`w:numId`) untuk setiap kelompok sub-bab agar nomor selalu mulai dari 1 secara deterministik.
2. **Bolding Istilah Kunci**:
   - Setiap poin istilah klinis/teknis utama wajib ditebalkan di awal kalimat run (contoh: `**Zero Medical Hallucination**: penjelasan...`).
