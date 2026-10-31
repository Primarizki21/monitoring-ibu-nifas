# PRODUCT REQUIREMENT DOCUMENT (PRD)
## SISTEM INFORMASI MONITORING DISCHARGE PLANNING IBU NIFAS KOTA SURABAYA

---

## 1. DOKUMEN KONTROL & RINGKASAN EKSEKUTIF

### 1.1 Informasi Dokumen
* **Nama Proyek:** Sistem Informasi Monitoring Discharge Planning Ibu Nifas Kota Surabaya (SIM-NIFAS Surabaya)
* **Kategori Produk:** Web Application (Responsive Mobile & Desktop) & Automated WhatsApp Gateway
* **Target Rilis:** Q3 - Q4 2026
* **Stakeholder Utama:** Dinas Kesehatan Kota Surabaya, Rumah Sakit Rujukan se-Surabaya, Puskesmas, Bidan Kelurahan, dan Pasien Ibu Nifas

### 1.2 Latar Belakang & Masalah
Berdasarkan data kesehatan Kota Surabaya tahun 2024, angka kematian ibu didominasi pada masa nifas, yaitu mencapai $90{,}9\%$. Studi pendahuluan tahun 2025 di Rumah Sakit Tipe B Kota Surabaya menunjukkan:
1. $100\%$ ibu nifas belum memenuhi prosedur *discharge planning* (perencanaan pemulangan) yang terstandar dan terintegrasi ke faskes primer.
2. Sebanyak $10{,}81\%$ ibu nifas tidak melakukan kunjungan ulang (kontrol nifas).
3. Terputusnya alur koordinasi pasca-pasien keluar dari rumah sakit (KRS) menyebabkan komplikasi nifas terlambat terdeteksi oleh bidan di tingkat komunitas.

### 1.3 Objektif Produk
* **Menjamin Kontinuitas Layanan:** Menghubungkan rumah sakit pemulih dengan fasilitas kesehatan tingkat pertama (FKTP) secara *real-time*.
* **Penegakan SLA Pemantauan:** Memastikan setiap ibu nifas yang dipulangkan dari RS mendapatkan kunjungan rumah (*home visit*) oleh Bidan Kelurahan maksimal dalam waktu $2 \times 24\text{ jam}$ ($48\text{ jam}$).
* **Deteksi Dini & Triase Bahaya Nifas:** Mengidentifikasi tanda bahaya maternal secara otomatis dan memfasilitasi rujukan darurat cepat.
* **Transparansi Indikator Kesehatan Kota:** Menyediakan *Single Source of Truth* berupa dashboard interaktif untuk evaluasi kinerja operasional Puskesmas dan Dinas Kesehatan Kota Surabaya.

### 1.4 Key Performance Indicators (KPI)
* **Coverage Kunjungan:** $\ge 95\%$ ibu nifas yang dipulangkan RS terkunjungi dalam rentang $\le 2 \times 24\text{ jam}$.
* **Response Time Kedaruratan:** $< 15\text{ menit}$ untuk tindak lanjut nakes saat sistem membunyikan alarm tanda bahaya nifas (*Red Alert*).
* **Kepatuhan Kontrol Ulang:** Penurunan angka *loss to follow-up* kunjungan ulang menjadi $< 2\%$.
* **Zero Delay Reporting:** $100\%$ data kepulangan pasien terdistribusi otomatis ke Bidan Kelurahan dalam $< 1\text{ menit}$ setelah disubmit oleh RS.

---

## 2. PENGGUNA SISTEM & ROLE-BASED ACCESS CONTROL (RBAC)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Dinas Kesehatan Kota Surabaya                        │
│               (Superadmin: Monitoring Agregat Kota)                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌──────────────────┐                                ┌────────────────────┐
│     Bidan RS     │                                │  Kepala Puskesmas  │
│(Input Form Pulang│                                │(Supervisi Wilayah &│
│  & Rekam Klinis) │                                │  Eskalasi Kasus)   │
└────────┬─────────┘                                └─────────┬──────────┘
         │                                                    │
         │ Emit: PATIENT_DISCHARGED                           │
         ▼                                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Aplikasi Core & WhatsApp Gateway                     │
└──────────────────────────┬───────────────────────────────────┬─────────┘
                           │                                   │
                           ▼                                   ▼
                ┌─────────────────────┐             ┌─────────────────────┐
                │   Bidan Kelurahan   │             │      Ibu Nifas      │
                │(Pelaksana Kunjungan │             │  (Penerima Edukasi, │
                │ & Pengisian Laporan)│             │  Pengingat Kontrol) │
                └─────────────────────┘             └─────────────────────┘
```

### 2.1 Matriks Peran & Hak Akses

| Fitur / Modul | Bidan RS | Bidan Kelurahan | Kepala Puskesmas | Dinkes (Superadmin) | Ibu Nifas |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Input Data Pemulangan (KRS)** | RW | - | - | R | - |
| **Terima Notifikasi Penugasan WA** | - | R | R | - | - |
| **Form Laporan Kunjungan Rumah** | - | RW | R | R | - |
| **Akses Dashboard Wilayah Terkait** | R (Unit RS) | R (Kelurahan) | R (Puskesmas) | RW (Kota) | - |
| **Peringatan Darurat (Red Alert)** | R | RW | RW | RW | - |
| **Terima WA Edukasi & Pengingat** | - | - | - | - | R |
| **Manajemen Master Faskes & User** | - | - | - | RW | - |

*Keterangan: RW (Read/Write), R (Read Only), - (Tidak Memiliki Akses).*

### 2.2 Cakupan Wilayah & Faskes Percontohan (Kota Surabaya)
* **Kecamatan Bubutan:** Puskesmas Gundih, Puskesmas Tembok Dukuh, Puskesmas Dupak; RS Ibu dan Anak IBI Surabaya, RS Griya Husada.
* **Kecamatan Gubeng:** Puskesmas Mojo, Puskesmas Pucang Sewu; RSUD Dr. Soetomo, RS DKT Gubeng, RSU Siloam, RS Husada Utama, RSU Haji.
* **Kecamatan Kenjeran:** Puskesmas Tanah Kali Kedinding, Puskesmas Tambak Wedi, Puskesmas Bulak Banteng; RS Mitra Keluarga Kenjeran, RSUD Soewandhie, RSIA Kendangsari.
* **Kecamatan Mulyorejo:** Puskesmas Mulyorejo; RS Universitas Airlangga (RSUA).
* **Kecamatan Simokerto:** Puskesmas Simolawang, Puskesmas Tambak Rejo, Puskesmas Sidotopo Wetan; RS Adi Husada Kapasari, RSUP Kemenkes Surabaya.
* **Kecamatan Tambaksari:** Puskesmas Pacar Keling, Puskesmas Rangkah, Puskesmas Gading; RSIA Adi Guna, RS Adi Husada Undaan.

---

## 3. ALUR KERJA SISTEM END-TO-END (6 TAHAPAN SIKLUS)

```
[1. Bidan RS] 
      │ (Input Data KRS + Validasi Wilayah)
      ▼
[2. Core Backend & Database Engine]
      │
      ├───────────────────────┬────────────────────────┐
      │ (Pemicu Event)        │ (Simpan Record)        │ (Pesan Sambutan)
      ▼                       ▼                        ▼
[3. WA Bidan Kelurahan &   [Dashboard Real-Time]    [5. WA Ibu Nifas]
    Kepala Puskesmas]         │                        - Tanggal Kontrol
      │                       │                        - 5 Tanda Bahaya
      │ Kunjungan Rumah Fisik │                        - Kontak Bidan
      │ (Batas Max 2x24 Jam)  │
      ▼                       │
[4. Input Hasil Kunjungan] ───┤
      │                       │
      ├───────────────────────┘
      ▼ (Jika Terdeteksi Bahaya)
[6. Trigger Red Alert] ───────► (Banner Merah Dashboard + Pesan Darurat WA ke Nakes)
```

### Tahap 1: Input Data Pemulangan Pasien (Bidan RS)
1. Bidan RS mengakses antarmuka formulir pemulangan pasien (KRS).
2. Memasukkan data identitas: NIK (16 digit), nama lengkap ibu, nomor WhatsApp aktif, alamat lengkap domisili.
3. Memilih wilayah secara berjenjang (*cascading dropdown*): **Kecamatan $\rightarrow$ Kelurahan**. Sistem otomatis mengaitkan data dengan Puskesmas pembina dan akun Bidan Kelurahan yang bertugas.
4. Memasukkan data klinis: Diagnosis sebelum dipulangkan, diagnosis perawatan, anjuran/rekomendasi perawatan di rumah (perawatan luka, obat, nutrisi), tanggal jadwal kontrol ulang, dan fasilitas kesehatan rujukan kontrol (RS / Puskesmas).
5. Bidan menekan tombol **"Simpan & Pulangkan Pasien"**.
6. Sistem menetapkan waktu resmi keluar rumah sakit ($T_0 = \text{Waktu KRS}$), menghitung batas waktu SLA ($T_{\text{deadline}} = T_0 + 48\text{ jam}$), dan menerbitkan *unique secure access token*.

### Tahap 2: Notifikasi Penugasan via WhatsApp Gateway
1. Sistem mengirimkan pesan WhatsApp otomatis terstruktur secara paralel kepada:
   * **Bidan Kelurahan:** Sebagai penugasan langsung pemeriksaan lapangan.
   * **Kepala Puskesmas:** Sebagai tembusan pengawasan manajerial wilayah.
2. Pesan berisi ringkasan identitas pasien, diagnosis KRS, anjuran perawatan rumah, batas waktu kunjungan maksimal $2 \times 24\text{ jam}$, dan tautan aman langsung (*Direct Action Link* tanpa autentikasi rumit).

### Tahap 3: Notifikasi Edukasi & Pengingat Kontrol ke Ibu Nifas
1. WhatsApp Gateway mengirim pesan personalisasi kepada nomor WhatsApp Ibu Nifas.
2. Konten pesan berfokus pada:
   * Pengingat tanggal dan tempat kontrol ulang.
   * Edukasi 5 tanda bahaya nifas yang wajib diwaspadai: demam $> 38^\circ\text{C}$, perdarahan banyak dari jalan lahir, nyeri hebat di area abdomen, cairan berbau/infeksi pada luka jahitan, serta pusing berputar, lemas ekstrem, atau muntah.
   * Nomor kontak darurat Bidan Kelurahan pendamping.

### Tahap 4: Pelaksanaan Kunjungan Rumah & Pelaporan (Bidan Kelurahan)
1. Bidan Kelurahan mendatangi kediaman ibu nifas dalam rentang waktu $\le 2 \times 24\text{ jam}$.
2. Bidan membuka formulir pelaporan melalui tautan token pada pesan WhatsApp:
   * Mengisi tanda vital: Suhu tubuh ($^\circ\text{C}$).
   * Mengisi checklist skrining tanda bahaya nifas (Perdarahan / Nyeri Perut / Infeksi Luka / Pusing & Lemas).
   * Memilih status hasil kunjungan umum: **"Baik"** atau **"Ada Masalah"**.
   * Memperbarui/mengonfirmasi tanggal dan lokasi kontrol ulang berikutnya.
   * Memberikan catatan naratif asuhan kebidanan nifas.
3. Bidan menekan tombol **"Simpan Laporan Kunjungan"**.
4. Sistem menghitung durasi:
   $$\Delta t = \text{Waktu Kunjungan} - T_0$$
   * Jika $\Delta t \le 48\text{ jam}$, status kunjungan tercatat `VISITED_ON_TIME`.
   * Jika $\Delta t > 48\text{ jam}$, status kunjungan tercatat `VISITED_LATE`.

### Tahap 5: Triase Otomatis & Eskalasi Kedaruratan (Red Alert)
1. Logika triase sistem mengevaluasi input:
   $$\text{Kondisi Bahaya} = (\text{Suhu} > 38^\circ\text{C}) \lor (\text{Checklist Bahaya} = \text{TRUE}) \lor (\text{Status} = \text{"Ada Masalah"})$$
2. Jika terdeteksi kondisi bahaya:
   * Status kesehatan pasien seketika beralih menjadi `TANDA_BAHAYA` atau `KOMPLIKASI`.
   * Di dashboard Dinkes dan Puskesmas, muncul kartu peringatan merah menyala (*Floating Red Alert Banner*).
   * WhatsApp Gateway mengirimkan pesan darurat dengan prioritas utama (*High Priority*) kepada Bidan Kelurahan dan Kepala Puskesmas dengan instruksi: *"Peringatan Bahaya Nifas - Segera Tindak Lanjut"*.
3. Nakes segera melakukan penanganan langsung di lokasi atau mengawal rujukan ke IGD RS terdekat.

### Tahap 6: Monitoring Dashboard & Tindak Lanjut Berkelanjutan
1. Tim Puskesmas dan Dinkes memantau tren perkembangan data melalui dashboard analitik terpadu.
2. Jika pasien pada perkembangannya harus dirawat inap ulang, nakes memperbarui statusnya menjadi `DIRAWAT_KEMBALI`.
3. Jika terjadi komplikasi fatal yang berujung pada kematian maternal, nakes mencatat status `MENINGGAL` untuk keperluan audit maternal perinatal (AMP) Dinkes.

---

## 4. KEBUTUHAN FUNGSIONAL & USER STORIES

### FR-01: Modul Pemulangan Pasien (Bidan RS)
* **User Story:** *Sebagai Bidan RS, saya ingin mencatat data pemulangan ibu nifas secara terstruktur beserta alamat presisi kelurahan, sehingga Bidan Kelurahan yang tepat dapat menerima notifikasi tanpa salah sasaran.*
* **Acceptance Criteria (Gherkin):**
  * `Given` Bidan RS telah masuk ke sistem dan membuka formulir KRS.
  * `When` Bidan RS menginput NIK, nama pasien, nomor WhatsApp, memilih Kecamatan dan Kelurahan, mengisi data klinis, serta memilih jadwal kontrol.
  * `Then` Sistem memvalidasi bahwa NIK terdiri dari 16 digit angka, nomor telepon berformat valid WhatsApp (+62), menyimpan data ke database, mengunci Puskesmas pembina, dan memicu webhook WhatsApp penugasan dalam $< 5\text{ detik}$.

### FR-02: Modul Pemantauan SLA & Timer Otomatis
* **User Story:** *Sebagai Kepala Puskesmas, saya ingin sistem mengirimkan pengingat otomatis jika kunjungan belum dilakukan dalam waktu $24\text{ jam}$ dan memberikan teguran pada $48\text{ jam}$, sehingga tidak ada pasien nifas yang terabaikan.*
* **Acceptance Criteria (Gherkin):**
  * `Given` Sebuah data KRS tersimpan dengan status kunjungan `PENDING`.
  * `When` Waktu mencapai $T_0 + 24\text{ jam}$ dan belum ada data laporan kunjungan.
  * `Then` Sistem secara otomatis mengirim pesan pengingat ke Bidan Kelurahan bahwa sisa waktu SLA adalah $24\text{ jam}$.
  * `When` Waktu mencapai $T_0 + 48\text{ jam}$ dan laporan kunjungan belum masuk.
  * `Then` Sistem mengubah status kunjungan menjadi `VISITED_LATE` (atau `NOT_VISITED`) dan mengirimkan pesan peringatan eskalasi keterlambatan ke WhatsApp Kepala Puskesmas.

### FR-03: Modul Pelaporan Kunjungan Rumah (Bidan Kelurahan)
* **User Story:** *Sebagai Bidan Kelurahan, saya ingin membuka formulir kunjungan melalui tautan token tanpa harus login yang rumit di lapangan, sehingga proses input hasil periksa berlangsung cepat dan akurat.*
* **Acceptance Criteria (Gherkin):**
  * `Given` Bidan Kelurahan mengeklik tautan `https://app-nifas.surabaya.go.id/visit/[TOKEN]`.
  * `When` Token valid dan belum pernah digunakan untuk submit final.
  * `Then` Sistem menampilkan data identitas pasien, riwayat diagnosis RS, dan formulir isian tanda vital, checklist tanda bahaya, serta konfirmasi jadwal kontrol.

### FR-04: Modul Triase Otomatis & Eskalasi Kedaruratan
* **User Story:** *Sebagai Tim Nakes, saya ingin sistem segera memicu peringatan darurat saat ada parameter klinis abnormal, sehingga tindakan medis dapat diambil secepat mungkin.*
* **Acceptance Criteria (Gherkin):**
  * `Given` Bidan Kelurahan mengisi suhu tubuh $38{,}5^\circ\text{C}$ atau mencentang opsi "Perdarahan Banyak".
  * `When` Tombol "Simpan Laporan Kunjungan" ditekan.
  * `Then` Sistem menandai record sebagai kondisi kedaruratan, memunculkan kartu merah di dashboard, dan mengirim pesan darurat prioritas tinggi ke Bidan Kelurahan dan Kepala Puskesmas.

### FR-05: Modul Dashboard Eksekutif & Visualisasi Data
* **User Story:** *Sebagai Pimpinan Puskesmas dan Dinkes, saya ingin memantau 10 metrik utama performa pemantauan nifas dan memfilter berdasarkan wilayah/tanggal, sehingga intervensi kebijakan kesehatan berbasis data dapat dilakukan secara cepat.*
* **Acceptance Criteria (Gherkin):**
  * `Given` Pengguna berada di halaman dashboard utama.
  * `When` Pengguna memilih filter rentang tanggal, Puskesmas tertentu, atau Kelurahan tertentu.
  * `Then` Seluruh 10 kartu indikator, grafik tren garis harian, dan tabel data pasien diperbarui secara reaktif tanpa perlu memuat ulang seluruh halaman web (*client-side reactive update*).

---

## 5. SKEMA DATABASE RELASIONAL (POSTGRESQL SPECIFICATION)

```sql
-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE role_pengguna AS ENUM (
    'SUPERADMIN_DINKES',
    'KEPALA_PUSKESMAS',
    'BIDAN_KELURAHAN',
    'BIDAN_RS'
);

CREATE TYPE status_sla_kunjungan AS ENUM (
    'PENDING',
    'VISITED_ON_TIME',
    'VISITED_LATE',
    'NOT_VISITED'
);

CREATE TYPE status_kesehatan_ibu AS ENUM (
    'SEHAT',
    'KOMPLIKASI',
    'TANDA_BAHAYA',
    'DIRAWAT_KEMBALI',
    'MENINGGAL'
);

CREATE TYPE tipe_faskes_rujukan AS ENUM (
    'RS',
    'PUSKESMAS'
);

-- 2. MASTER WILAYAH & FASKES
CREATE TABLE m_puskesmas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama_puskesmas VARCHAR(100) NOT NULL,
    kecamatan VARCHAR(50) NOT NULL,
    no_telp_operasional VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE m_kelurahan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    puskesmas_id UUID NOT NULL REFERENCES m_puskesmas(id) ON DELETE CASCADE,
    nama_kelurahan VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE m_rumah_sakit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama_rs VARCHAR(100) NOT NULL,
    tipe_rs VARCHAR(10),
    alamat_rs TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABEL PENGGUNA
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama_lengkap VARCHAR(150) NOT NULL,
    nip VARCHAR(30),
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    no_whatsapp VARCHAR(20) NOT NULL,
    role role_pengguna NOT NULL,
    faskes_id UUID,
    kelurahan_id UUID REFERENCES m_kelurahan(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TRANSAKSI DISCHARGE (PEMULANGAN PASIEN DARI RS)
CREATE TABLE tr_discharge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_kunjungan VARCHAR(64) UNIQUE NOT NULL,
    nik VARCHAR(16) NOT NULL,
    nama_ibu VARCHAR(150) NOT NULL,
    alamat_lengkap TEXT NOT NULL,
    kelurahan_id UUID NOT NULL REFERENCES m_kelurahan(id),
    no_whatsapp_ibu VARCHAR(20) NOT NULL,
    diagnosis_sebelum_pulang TEXT NOT NULL,
    diagnosis_perawatan TEXT NOT NULL,
    rekomendasi_perawatan_rumah TEXT NOT NULL,
    jadwal_kunjungan_ulang DATE NOT NULL,
    faskes_kunjungan_ulang tipe_faskes_rujukan NOT NULL,
    rs_asal_id UUID NOT NULL REFERENCES m_rumah_sakit(id),
    bidan_rs_id UUID NOT NULL REFERENCES users(id),
    waktu_krs TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deadline_sla TIMESTAMP WITH TIME ZONE NOT NULL,
    status_kunjungan status_sla_kunjungan DEFAULT 'PENDING',
    status_kesehatan status_kesehatan_ibu DEFAULT 'SEHAT',
    is_emergency BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TRANSAKSI PELAPORAN KUNJUNGAN RUMAH
CREATE TABLE tr_home_visit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discharge_id UUID UNIQUE NOT NULL REFERENCES tr_discharge(id) ON DELETE CASCADE,
    bidan_pelaksana_id UUID NOT NULL REFERENCES users(id),
    waktu_kunjungan TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    durasi_jam_sejak_krs NUMERIC(5,2) NOT NULL,
    suhu_tubuh NUMERIC(4,1) NOT NULL,
    perdarahan_abnormal BOOLEAN DEFAULT FALSE,
    nyeri_perut_hebat BOOLEAN DEFAULT FALSE,
    luka_berbau_infeksi BOOLEAN DEFAULT FALSE,
    pusing_muntah_lemas BOOLEAN DEFAULT FALSE,
    status_hasil VARCHAR(20) NOT NULL, -- 'BAIK' / 'ADA_MASALAH'
    catatan_kebidanan TEXT,
    konfirmasi_jadwal_kontrol DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ESKALASI KEDARURATAN (RED ALERT)
CREATE TABLE tr_emergency_alert (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discharge_id UUID NOT NULL REFERENCES tr_discharge(id) ON DELETE CASCADE,
    jenis_masalah TEXT NOT NULL,
    waktu_laporan TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_resolved BOOLEAN DEFAULT FALSE,
    catatan_tindakan TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id)
);

-- 7. AUDIT LOG NOTIFIKASI WHATSAPP
CREATE TABLE log_notifikasi_wa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discharge_id UUID REFERENCES tr_discharge(id) ON DELETE SET NULL,
    nomor_tujuan VARCHAR(20) NOT NULL,
    peran_penerima VARCHAR(50) NOT NULL,
    template_id VARCHAR(50) NOT NULL,
    pesan_terkirim TEXT NOT NULL,
    status_pengiriman VARCHAR(20) DEFAULT 'SENT',
    response_gateway TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXING UNTUK OPTIMASI QUERY
CREATE INDEX idx_discharge_nik ON tr_discharge(nik);
CREATE INDEX idx_discharge_status_kunjungan ON tr_discharge(status_kunjungan);
CREATE INDEX idx_discharge_kelurahan ON tr_discharge(kelurahan_id);
CREATE INDEX idx_discharge_waktu_krs ON tr_discharge(waktu_krs);
CREATE INDEX idx_token_kunjungan ON tr_discharge(token_kunjungan);
```

---

## 6. MATRIKS & SPESIFIKASI PESAN WHATSAPP GATEWAY

### 6.1 Matriks Pemicu Webhook

| Kode Template | Event Trigger | Penerima | Prioritas | Aksi Lanjutan |
| :--- | :--- | :--- | :--- | :--- |
| `WA-ASSIGN-01` | Data KRS Berhasil Disimpan | Bidan Kelurahan & Kepala Puskesmas | High | Mengirim detail pasien + tokenized URL kunjungan |
| `WA-REMIND-24H` | $T_0 + 24\text{ Jam}$ & Belum Dikunjungi | Bidan Kelurahan | Normal | Notifikasi pengingat sisa waktu SLA $24\text{ jam}$ |
| `WA-ALERT-48H` | $T_0 + 48\text{ Jam}$ & Belum Dikunjungi | Kepala Puskesmas | High | Eskalasi keterlambatan SLA kunjungan |
| `WA-EDU-PASIEN` | Data KRS Berhasil Disimpan | Ibu Nifas | Normal | Notifikasi jadwal kontrol & 5 tanda bahaya |
| `WA-EMERGENCY` | Tanda Bahaya Terdeteksi | Bidan Kelurahan & Kepala Puskesmas | Urgent | Peringatan darurat merah untuk tindakan/rujukan |

### 6.2 Kontrak Teks Pesan Otomatis

#### Template 1: `WA-ASSIGN-01` (Penugasan Kunjungan Bidan & Kapus)
```text
[NOTIFIKASI MONITORING IBU NIFAS - KOTA SURABAYA]

Yth. Bidan Kelurahan & Kepala Puskesmas {{nama_puskesmas}},

Terdapat pasien ibu nifas baru yang dipulangkan dari {{nama_rs}} dan memerlukan kunjungan rumah:

- Nama Ibu: {{nama_ibu}}
- NIK: {{nik}}
- Alamat Lengkap: {{alamat_lengkap}}
- No. WhatsApp: {{no_whatsapp}}
- Diagnosis Sebelum Pulang: {{diagnosis_sebelum_pulang}}
- Diagnosis Perawatan: {{diagnosis_perawatan}}
- Rekomendasi di Rumah: {{rekomendasi_perawatan}}

BATAS WAKTU KUNJUNGAN: Maksimal 2x24 Jam (Sebelum {{deadline_sla_datetime}})
Jadwal Kunjungan Ulang: {{jadwal_kunjungan_ulang}} di {{faskes_tujuan}}

Segera lakukan kunjungan rumah dan laporkan hasilnya melalui tautan resmi berikut:
{{url_kunjungan_token}}
```

#### Template 2: `WA-EDU-PASIEN` (Pesan Edukasi & Pengingat Pasien)
```text
Halo Ibu {{nama_ibu}},

Salam hangat dari Tim Layanan Kesehatan Ibu dan Anak Kota Surabaya. Kami siap mendampingi masa pemulihan Ibu pasca-melahirkan.

Jangan lupa untuk melakukan Kunjungan Ulang (Kontrol Nifas) ke {{faskes_tujuan}} pada:
Tanggal: {{jadwal_kunjungan_ulang}}

Segera hubungi bidan atau faskes terdekat jika Ibu merasakan salah satu TANDA BAHAYA NIFAS berikut:
1. Demam > 38°C
2. Perdarahan banyak dari jalan lahir
3. Nyeri hebat pada bagian perut
4. Bau tidak sedap atau cairan nanah pada luka jahitan
5. Pusing berat, muntah terus-menerus, atau lemas ekstrem

Kontak Bidan Kelurahan Pendamping Anda:
Bidan {{nama_bidan}}: {{no_whatsapp_bidan}}

Bersama Kita Pastikan Ibu dan Bayi Sehat, Aman, dan Sejahtera.
```

#### Template 3: `WA-EMERGENCY` (Peringatan Bahaya Nifas / Red Alert)
```text
[PERINGATAN BAHAYA NIFAS - SEGERA TINDAK LANJUT]

Ditemukan indikasi tanda bahaya pada pasien nifas binaan Anda:
- Nama Ibu: {{nama_ibu}}
- Alamat Lengkap: {{alamat_lengkap}}
- No. WhatsApp: {{no_whatsapp}}
- Jenis Masalah: {{deskripsi_gejala_bahaya}}
- Waktu Laporan: {{timestamp_laporan}}

Instruksi: Bidan Kelurahan bersama Tim Puskesmas dimohon segera melakukan pemeriksaan fisik langsung atau memfasilitasi rujukan cepat ke IGD Faskes/RS terdekat!
```

---

## 7. LOGIKA BISNIS & PENANGANAN EDGE CASES

### 7.1 Kalkulasi Service Level Agreement (SLA $2 \times 24\text{ Jam}$)
1. Saat form pemulangan disubmit pada waktu $T_0$, sistem menetapkan batas waktu absolut:
   $$T_{\text{deadline}} = T_0 + 48\text{ jam}$$
2. Status SLA diklasifikasikan secara matematis berdasarkan waktu submit laporan kunjungan ($T_{\text{visit}}$):
   $$\text{Status Kunjungan} = \begin{cases} 
   \text{VISITED\_ON\_TIME}, & \text{jika } T_{\text{visit}} \le T_{\text{deadline}} \\
   \text{VISITED\_LATE}, & \text{jika } T_{\text{visit}} > T_{\text{deadline}} \\
   \text{NOT\_VISITED}, & \text{jika } \text{NOW}() > T_{\text{deadline}} \land T_{\text{visit}} \text{ is NULL}
   \end{cases}$$

### 7.2 Mesin Triase Otomatis Hasil Kunjungan
1. Parameter Klinis Abnormal:
   * $\text{Suhu Tubuh} > 38{,}0^\circ\text{C}$
   * $\text{Perdarahan Abnormal} = \text{TRUE}$
   * $\text{Nyeri Perut Hebat} = \text{TRUE}$
   * $\text{Luka Berbau / Infeksi} = \text{TRUE}$
   * $\text{Pusing / Lemas / Muntah} = \text{TRUE}$
   * $\text{Status Input Bidan} = \text{"Ada Masalah"}$
2. Jika salah satu atau lebih parameter abnormal terpenuhi, sistem mengunci status kesehatan menjadi `TANDA_BAHAYA` atau `KOMPLIKASI`, menandai `is_emergency = TRUE`, serta memicu pengiriman pesan template `WA-EMERGENCY`.

### 7.3 Penanganan Edge Cases & Kegagalan Sistem
* **Nomor WhatsApp Pasien Tidak Aktif / Gagal Terkirim:**
  * Sistem mencatat status `FAILED` pada `log_notifikasi_wa`.
  * Sistem otomatis menembakkan notifikasi peringatan ke Bidan Kelurahan: *"Nomor WA Pasien [Nama] tidak valid. Mohon lakukan pengecekan langsung saat kunjungan rumah."*
* **Duplikasi Data Pasien (NIK Sama):**
  * Sistem memberlakukan *soft constraint*. Jika NIK yang sama diinput dalam rentang $< 40\text{ hari}$ sejak KRS sebelumnya, sistem memunculkan konfirmasi dialog: *"Pasien dengan NIK ini tercatat baru saja dipulangkan pada [Tanggal]. Apakah ini kasus perawatan berulang (readmission)?"*
* **Akses Tautan Token Kadaluarsa / Dobel Submit:**
  * Token kunjungan hanya dapat digunakan untuk submit final sebanyak 1 kali.
  * Jika tautan dibuka kembali pasca-submit, antarmuka beralih ke mode *Read-Only* yang menampilkan ringkasan hasil kunjungan yang telah terekam.

---

## 8. SPESIFIKASI DASHBOARD & VISUALISASI DATA

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Filter Data: [ Periode: 10/10/2026 - 16/10/2026 ] [ Puskesmas: Semua ] [ Kelurahan: Semua ] │
├──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬─────────────┤
│ 1. Dipulangkan│ 2. Kunjungan │ 3. Tidak     │ 4. Kunjungan │ 5. Komplikasi│ 6. Tanda    │
│    RS        │ <= 2x24 Jam  │    Kunjungan │    > 2x24 Jam│    Kunjungan │    Bahaya   │
│   120 orang  │   98 orang   │    8 orang   │    6 orang   │    4 orang   │    3 orang  │
│              │   (81,7%)    │    (6,7%)    │    (5,0%)    │    (3,3%)    │    (2,5%)   │
├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┴─────────────┤
│ 7. Meninggal │ 8. Sehat     │ 9. Dirawat   │ 10. Data     │ [ Floating Banner:         │
│              │              │    Kembali   │     Lengkap  │   3 KASUS TANDA BAHAYA     │
│    1 orang   │  107 orang   │    5 orang   │   [Lihat Data│   BUTUH TINDAK LANJUT! ]   │
│    (0,8%)    │   (89,2%)    │    (4,2%)    │     Master]  │                            │
├──────────────┴──────────────┴──────────────┴──────────────┴────────────────────────────┤
│ [ Grafik Tren Kunjungan Harian (Line) ]   │ [ Diagram Status Kesehatan Ibu Nifas (Donut) ]│
├───────────────────────────────────────────┴────────────────────────────────────────────┤
│ Tabel Data Terkini: No | Nama Ibu | Alamat | No. Telp | Tgl KRS | Status | Aksi Detail │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 8.1 Komponen 10 Kartu Indikator Utama (KPI Metrics)
1. **Jumlah Ibu Nifas yang Dipulangkan RS:** Total volume pasien KRS pada periode aktif.
2. **Kunjungan Rumah $\le 2 \times 24\text{ Jam}$:** Jumlah dan persentase pasien yang berhasil dikunjungi tepat waktu (Indikator Kepatuhan Hijau).
3. **Tidak Dilakukan Kunjungan Rumah:** Pasien yang belum dikunjungi dan telah melewati batas SLA (Indikator Merah).
4. **Kunjungan Rumah $> 2 \times 24\text{ Jam}$:** Pasien yang dikunjungi namun terlambat melebihi 48 jam (Indikator Kuning/Ungu).
5. **Komplikasi Saat Kunjungan Rumah:** Pasien yang teridentifikasi mengalami masalah pemulihan luka/nifas non-fatal.
6. **Tanda Gejala Bahaya Nifas:** Pasien dengan kondisi darurat maternal yang membutuhkan rujukan cepat.
7. **Jumlah Ibu Nifas Meninggal:** Kasus kematian ibu nifas (Audit AKI Kota Surabaya).
8. **Jumlah Ibu Nifas yang Sehat:** Pasien nifas normal tanpa keluhan klinis berisiko.
9. **Dirawat Kembali Setelah KRS:** Pasien yang masuk rawat inap ulang pasca pemulangan.
10. **Akses Data Lengkap Ibu Nifas:** Tombol pintas navigasi untuk mengekspor atau melihat keseluruhan master tabel pasien.

### 8.2 Visualisasi Grafik
* **Grafik Tren Garis Harian (Multi-Line Chart):**
  * Sumbu X: Tanggal harian pemantauan.
  * Sumbu Y: Jumlah pasien (skala $0 - 150$).
  * Garis Seri: (1) Pasien Dipulangkan RS (Biru), (2) Kunjungan $\le 2 \times 24\text{ jam}$ (Hijau), (3) Tidak Berkunjung (Oranye), (4) Kunjungan $> 2 \times 24\text{ jam}$ (Ungu).
* **Grafik Proporsi Status Kesehatan (Donut Chart):**
  * Komposisi persentase: Sehat ($89{,}2\%$), Komplikasi ($3{,}3\%$), Tanda Bahaya ($2{,}5\%$), Dirawat Kembali ($4{,}2\%$), Meninggal ($0{,}8\%$).

### 8.3 Tabel Operasional & Status Badges
* Kolom: No | Nama Ibu | Alamat | No. WhatsApp | Tanggal Pulang RS | Status Kesehatan | Status Kunjungan | Aksi.
* Skema Warna Badge:
  * Hijau: `Sehat` / `Kunjungan <= 2x24 Jam`
  * Kuning: `Komplikasi` / `Kunjungan > 2x24 Jam`
  * Merah: `Tanda Bahaya` / `Tidak Kunjungan` / `Meninggal`
  * Biru: `Dirawat Kembali`

---

## 9. SPESIFIKASI KONTRAK RESTful API

### 9.1 `POST /api/v1/discharge`
* **Deskripsi:** Mendaftarkan data pemulangan pasien baru dari RS dan memicu otomatisasi WhatsApp.
* **Headers:** `Authorization: Bearer <TOKEN_BIDAN_RS>`
* **Request Body:**
```json
{
  "nik": "3578012345670001",
  "nama_ibu": "Siti Aisyah",
  "alamat_lengkap": "Jl. Melati No. 12, Kel. Gundih, Kec. Bubutan",
  "kelurahan_id": "c7a8b9d0-1234-5678-9abc-def012345678",
  "no_whatsapp_ibu": "+6281234567890",
  "diagnosis_sebelum_pulang": "Post partum normal hari ke-2",
  "diagnosis_perawatan": "Perawatan luka perineum derajat 2",
  "rekomendasi_perawatan_rumah": "Jaga kebersihan luka jahit, minum tablet tambah darah dan antibiotik rutin",
  "jadwal_kunjungan_ulang": "2026-10-22",
  "faskes_kunjungan_ulang": "PUSKESMAS"
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Data pemulangan ibu nifas berhasil disimpan. Tugas kunjungan telah diteruskan ke Bidan Kelurahan.",
  "data": {
    "discharge_id": "8f3e1a2b-9c8d-4e5f-0a1b-2c3d4e5f6a7b",
    "deadline_sla": "2026-10-18T10:15:00Z",
    "token_kunjungan": "a1b2c3d4e5f67890abcdef1234567890"
  }
}
```

### 9.2 `GET /api/v1/visit/:token`
* **Deskripsi:** Mengambil data ringkas pasien untuk formulir kunjungan rumah.
* **Authentication:** Validasi token URL.
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "discharge_id": "8f3e1a2b-9c8d-4e5f-0a1b-2c3d4e5f6a7b",
    "nama_ibu": "Siti Aisyah",
    "alamat": "Jl. Melati No. 12, Kel. Gundih",
    "diagnosis_rs": "Post partum normal hari ke-2",
    "rekomendasi_rs": "Jaga kebersihan luka jahit, minum tablet tambah darah",
    "deadline_sla": "2026-10-18T10:15:00Z",
    "is_expired": false
  }
}
```

### 9.3 `POST /api/v1/visit/submit`
* **Deskripsi:** Menyimpan laporan hasil kunjungan rumah Bidan Kelurahan dan melakukan kalkulasi triase.
* **Request Body:**
```json
{
  "token_kunjungan": "a1b2c3d4e5f67890abcdef1234567890",
  "suhu_tubuh": 38.6,
  "perdarahan_abnormal": true,
  "nyeri_perut_hebat": true,
  "luka_berbau_infeksi": false,
  "pusing_muntah_lemas": true,
  "status_hasil": "ADA_MASALAH",
  "catatan_kebidanan": "Pasien mengeluh menggigil sejak pagi hari, lokia berdarah merah segar dan banyak.",
  "konfirmasi_jadwal_kontrol": "2026-10-19"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Laporan kunjungan berhasil terekam. Sistem mendeteksi tanda bahaya nifas. Notifikasi darurat telah dipicu.",
  "data": {
    "status_sla": "VISITED_ON_TIME",
    "status_kesehatan": "TANDA_BAHAYA",
    "is_emergency_triggered": true
  }
}
```

### 9.4 `GET /api/v1/dashboard/analytics`
* **Deskripsi:** Mengambil ringkasan 10 kartu metrik dan data visualisasi grafik.
* **Headers:** `Authorization: Bearer <TOKEN_USER>`
* **Query Params:** `start_date`, `end_date`, `puskesmas_id`, `kelurahan_id`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "total_dipulangkan": 120,
      "kunjungan_tepat_waktu": 98,
      "persentase_tepat_waktu": 81.7,
      "tidak_dikunjungi": 8,
      "kunjungan_terlambat": 6,
      "komplikasi": 4,
      "tanda_bahaya": 3,
      "meninggal": 1,
      "sehat": 107,
      "dirawat_kembali": 5
    },
    "chart_series": [
      { "tanggal": "2026-10-10", "dipulangkan": 105, "tepat_waktu": 96, "tidak_kunjungan": 16, "terlambat": 8 },
      { "tanggal": "2026-10-16", "dipulangkan": 120, "tepat_waktu": 98, "tidak_kunjungan": 21, "terlambat": 12 }
    ]
  }
}
```

---

## 10. KEBUTUHAN NON-FUNGSIONAL (NFR)

* **Keamanan & Kerahasiaan Rekam Medis:**
  * Enkripsi data sensitif (NIK, riwayat diagnosis, nomor telepon) menggunakan standar AES-256 pada level database.
  * Tautan akses kunjungan menggunakan token hash *cryptographically secure* dengan waktu kadaluarsa maksimal 7 hari.
  * Penerapan HTTPS / TLS 1.3 pada seluruh endpoint jaringan.
* **Ketersediaan & Kehandalan (*Availability & Reliability*):**
  * Target *uptime* aplikasi minimal $99{,}9\%$ per bulan.
  * Penerapan mekanisme antrean *retry* otomatis pada pengiriman pesan WhatsApp (maksimal 3 kali percobaan ulang dengan *exponential backoff* jika gateway sedang sibuk).
* **Performa Sistem:**
  * Waktu pemuatan halaman dashboard $< 2\text{ detik}$ pada kondisi jaringan 4G standar.
  * Kapasitas pemrosesan simultan minimal 500 transaksi pemulangan pasien per jam tanpa degradasi performa.
* **Kompatibilitas Antarmuka:**
  * *Mobile-First Design* untuk modul pelaporan kunjungan rumah agar nyaman digunakan oleh bidan melalui *smartphone* berbasis Android dan iOS.