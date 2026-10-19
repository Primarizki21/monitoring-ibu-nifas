# Alur Kerja Sistem Monitoring Kesehatan Ibu Nifas

Dokumen ini memuat diagram alir (*flowchart*) resmi sistem monitoring kesehatan ibu nifas skala pilot (Surabaya). Diagram menggunakan standar notasi ANSI/ISO:
- **Terminal (Mulai / Selesai)**: Oval / Stadium `([ ... ])`
- **Proses / Eksekusi**: Persegi panjang `[ ... ]`
- **Input / Output Data**: Jajar genjang `[/ ... /]`
- **Keputusan / Percabangan**: Belah ketupat `{" ... "}`
- **Garis Alur**: Orthogonal (koneksi 90 derajat rigid)

> **Catatan Aset Publikasi & Cetak**:  
> Diagram Mermaid di bawah ini digunakan untuk visualisasi Markdown interaktif di GitHub/web viewer. Seluruh aset diagram resmi beresolusi tinggi (300 DPI) untuk dokumen cetak dan Project Charter digenerate langsung menggunakan mesin Python Matplotlib murni via `uv run python tools/report_docs/render_charts.py` dan tersimpan di `docs/assets/`.

---

## 1. Flowchart End-to-End Sistem

```mermaid
%%{init: {"flowchart": {"curve": "ortho", "htmlLabels": true}} }%%
flowchart TD

    %% Definisi Subgraph Lingkup Aktor & Sistem
    subgraph FASKES ["FASKES & REGISTRASI (DISCHARGE PLANNING)"]
        A([Mulai: Pasien Melahirkan di RS / Puskesmas])
        B[Persiapan Pulang / Discharge Planning]
        C[/Bidan & Pendamping Input Data: No WA Ibu & No Darurat Suami/]
        D[Simpan Profil Pasien & Hitung Jadwal KF1-KF4]
    end

    subgraph ENGINE ["SISTEM BACKEND & SCHEDULER (FASTAPI)"]
        E[Scheduler Harian Berjalan Jam 08.00 WIB]
        F{"Apakah Ada Jadwal KF Hari Ini?"}
        G[Ambil Data Pasien Jatuh Tempo]
        H[Siapkan Template Skrining Sesuai Tahap KF]
        I[Tunggu Jadwal Hari Berikutnya]
    end

    subgraph WA ["LAYANAN WHATSAPP (BOT & IBU NIFAS)"]
        J[/Kirim Pesan Reminder & Pilihan Skrining Langsung ke WA Ibu/]
        K[/Ibu Nifas Membaca & Memilih Tombol / Angka/]
        L[/Terima Respon Jawaban Skrining Ibu/]
    end

    subgraph TRIASE ["EVALUASI TRIASE & LOGIKA MEDIS"]
        M[Ekstraksi Jawaban Skrining Ibu]
        N{"Apakah Ditemukan Tanda Bahaya / Keluhan?"}
        O[Tetapkan Status HIJAU: Normal / Aman]
        P[Kirim Pesan Edukasi Perawatan Nifas & Bayi ke Ibu]
        Q{"Tingkat Keparahan Keluhan?"}
        R[Tetapkan Status KUNING: Perlu Evaluasi]
        S[Tetapkan Status MERAH: Bahaya Akut]
        T[/Kirim Pesan Darurat & Kontak Bidan PJ ke WA Ibu/]
        U[/Kirim Alert Prioritas ke Dashboard Bidan Faskes/]
    end

    subgraph RESPON ["INTERVENSI NAKES & SIKLUS HIDUP"]
        V[Bidan Menerima Alert di Dashboard PWA]
        W[Bidan Klik Tombol wa.me Hubungi Ibu]
        W2[Opsi Fail-Safe: Hubungi Kontak Darurat Suami jika Ibu Tidak Respon]
        X[Bidan Melakukan Anamnesis & Tindakan Medis]
        Y[Bidan Update Catatan Tindakan di PWA]
        Z{"Apakah Hari Pascasalin >= 42 Hari / KF4 Selesai?"}
        AA[Tandai Pasien: LULUS / SELESAI PEMANTAUAN NIFAS]
        AB([Selesai: Pemantauan Nifas Lengkap])
    end

    %% Relasi Garis Alur (Garis 90 Derajat)
    A --> B
    B --> C
    C --> D
    D --> E

    E --> F
    F -- "Tidak" --> I
    I --> E
    F -- "Ya" --> G
    G --> H
    H --> J

    J --> K
    K --> L
    L --> M
    M --> N

    N -- "Tidak Ada Keluhan" --> O
    O --> P
    P --> Z

    N -- "Ada Keluhan" --> Q
    Q -- "Gejala Ringan/Sedang" --> R
    Q -- "Gejala Berat / Red Flag" --> S
    R --> T
    S --> T
    T --> U

    U --> V
    V --> W
    V -. "Ibu Tidak Respon" .-> W2
    W --> X
    W2 --> X
    X --> Y
    Y --> Z

    Z -- "Belum (Masih Masa Nifas)" --> E
    Z -- "Ya (Selesai 42 Hari)" --> AA
    AA --> AB
```

---

## 2. Penjelasan Logika & Titik Keputusan

1. **Registrasi Pasien**:
   - Pendaftaran dibantu oleh Bidan bersama Pendamping saat kepulangan agar ibu tidak terbebani administrasi.
   - Mengisi: Nama Ibu, **Nomor WhatsApp Utama Ibu**, **Nomor WhatsApp Darurat (Suami/Keluarga)**, Tanggal/Jam Bersalin, Jenis Persalinan (Normal/SC), Faskes Penanggung Jawab Wilayah.
2. **Kanal Utama vs Kontak Darurat**:
   - **Kanal Utama**: Reminder dan skrining dikirimkan langsung ke nomor WhatsApp Ibu, karena ibu adalah subjek yang merasakan langsung tanda klinis tubuhnya.
   - **Kontak Darurat (Suami)**: Berfungsi sebagai *fail-safe* jika status pasien darurat (Merah) atau ibu tidak memberikan respons skrining dalam kurun 24 jam.
3. **Triase Deterministik**:
   - 🟢 **Hijau**: Respons normal $\rightarrow$ kirim edukasi $\rightarrow$ lanjut siklus hari berikutnya.
   - 🟡 **Kuning**: Respons keluhan ringan/sedang $\rightarrow$ alert ke bidan faskes terkait.
   - 🔴 **Merah**: Respons red flag (perdarahan deras, demam tinggi, nyeri kepala hebat, kejang) $\rightarrow$ instruksi darurat ke ibu + kontak bidan PJ + alert prioritas merah ke bidan.
4. **Siklus Hidup (Lifecycle Loop)**:
   - Intervensi nakes pada satu insiden tidak menghentikan jadwal berikutnya. Sistem terus memantau hingga ambang 42 hari pascasalin (KF4 terpenuhi).
