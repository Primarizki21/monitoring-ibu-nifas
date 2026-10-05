# Sistem Monitoring Kesehatan Ibu Nifas (Pengmas RS-Puskesmas Surabaya)

Sistem pemantauan kesehatan ibu nifas otomatis berbasis **WhatsApp** dan **PWA (Progressive Web App)** untuk kegiatan Pengabdian Masyarakat (Pengmas) di wilayah Kota Surabaya.

---

## 1. Dokumen Resmi Proyek (Deliverables)

- **Google Docs (Project Charter & Technical Brief)**:  
  [Buka Google Docs](https://docs.google.com/document/d/1MGuyIH8bSQ3jBsk8kKsxSAsildZA11Rwhq3HyZ4dfA4/edit?usp=drivesdk)  
  *Memuat latar belakang, analogi komponen sistem untuk pembaca non-teknis, diagram box-and-arrow, struktur peran Dinkes vs Faskes, dan roadmap 3 bulan live deployment.*

- **Google Spreadsheet (RAB & Matriks Pesan)**:  
  [Buka Google Spreadsheet](https://docs.google.com/spreadsheets/d/1J38nXV5J0ri4aM3_s0h6bYo-dELT1FO5RBnxITIlUtc/edit?usp=sharing)  
  - Tab `RAB Revisi (3 Bulan)`: Simulasi biaya riil pilot 3 bulan via Direct Meta WhatsApp Cloud API (Rp6.309.298 total).
  - Tab `Matriks Pesan & Triase KF1-KF4`: Kamus pesan WhatsApp terstruktur dan parameter triase standar Buku KIA Kemenkes.

- **Diagram Alir Sistem (Mermaid ANSI/ISO)**:  
  Lihat [`FLOWCHART.md`](FLOWCHART.md) untuk detail alur kerja 5 tahap dengan notasi rigid 90 derajat.

- **Knowledge Base Pengembang & AI**:  
  Lihat [`AGENTS.md`](AGENTS.md) untuk panduan aturan teknis, standar medis, dan alur verifikasi berkala.

---

## 2. Spesifikasi Teknologi

- **Runtime & Toolchain**: Python 3.12+ dengan Astral `uv`.
- **Framework API**: FastAPI (Asynchronous webhook engine).
- **Basis Data**: PostgreSQL 16 dengan backup harian ke S3 Object Storage.
- **Layanan Pesan**: Direct Meta WhatsApp Cloud API (Graph API).
- **Infrastruktur**: VPS Biznet GIO NEO Lite (8 vCPU / 8 GB RAM) di datacenter lokal Indonesia (kepatuhan UU PDP No. 27/2022).

---

## 3. Cara Menjalankan (Quickstart)

Proyek ini dikelola sepenuhnya menggunakan **Astral `uv`**:

```bash
# 1. Sinkronisasi lingkungan virtual dan dependensi
uv sync

# 2. Menjalankan server backend secara lokal
uv run uvicorn app.main:app --reload --port 8000

# 3. Pengujian endpoint health check
curl http://localhost:8000/health
```
