"""Content definitions for Project Charter and Technical Specification."""

METADATA = {
    "title": "SISTEM MONITORING KESEHATAN IBU NIFAS",
    "subtitle": "Project Charter & Technical Specification Brief (Skala Pilot 3 Bulan)",
    "project_info": (
        "Program: Pengabdian Masyarakat (Pengmas) Kolaborasi Pelayanan Kesehatan Maternal\n"
        "Lokasi Penerapan: Kota Surabaya, Jawa Timur\n"
        "Mitra Faskes: 3 Rumah Sakit Rujukan & 10 Puskesmas Mitra Surabaya\n"
        "Target Populasi: ~500 ibu bersalin/bulan (Total target ~1.500 ibu nifas selama 3 bulan live deployment)\n"
        "Tenaga Terlibat: ~80 Bidan & Petugas Kesehatan Wilayah\n"
        "Tautan Dokumen Anggaran: Google Spreadsheet RAB Revisi & Matriks Pesan KF1-KF4"
    ),
}

CHAPTER_1_TEXTS = [
    (
        "Masa nifas (puerperium) merupakan periode paling kritis dalam kelangsungan hidup maternal. "
        "Berdasarkan data kesehatan nasional, lebih dari 60% kematian ibu terjadi pada masa pascapersalinan, "
        "terutama akibat komplikasi sekunder seperti perdarahan lanjut, infeksi nifas (sepsis), "
        "preeklampsia postpartum, serta depresi pascamelahirkan."
    ),
    (
        "Meskipun standar Kementerian Kesehatan RI mewajibkan empat kali kunjungan nifas (KF1 sampai KF4), "
        "angka ketidakhadiran kontrol mandiri masih tinggi setelah pasien keluar dari fasilitas kesehatan. "
        "Kendala kelelahan merawat bayi baru lahir, rasa nyeri fisik pascasalin, dan keterbatasan transportasi "
        "menjadi penyebab utama terputusnya pemantauan rutin."
    ),
    (
        "Sistem ini dirancang untuk menjembatani kesenjangan tersebut melalui pendekatan proactive digital outreach. "
        "Tanpa menunggu ibu datang ke faskes, sistem secara otomatis menyapa ibu nifas melalui aplikasi WhatsApp resmi, "
        "melakukan skrining berkala berbasis Buku KIA, dan langsung memberikan peringatan dini kepada bidan wilayah jika ditemukan tanda bahaya."
    ),
]

CHAPTER_2_ITEMS = [
    (
        "A. Deterministic Rule-Based Engine (Strictly No LLM)",
        (
            "Sistem ini secara sengaja TIDAK MENGGUNAKAN Large Language Model (AI generatif). Keputusan ini didasari tiga pertimbangan utama:\n"
            "1. Zero Medical Hallucination: Triase kondisi darurat tidak boleh memiliki margin kesalahan atau jawaban tidak terduga dari model bahasa.\n"
            "2. Kepatuhan Standar Klinis: Logika penilaian sepenuhnya mengacu pada algoritma Buku KIA Kemenkes RI yang deterministik dan auditable secara hukum medis.\n"
            "3. Efisiensi Anggaran & Kecepatan: Meniadakan biaya token AI per kata, waktu tanggap di bawah 1 detik, dan server sangat ringan."
        ),
    ),
    (
        "B. Model Komunikasi WhatsApp Hybrid",
        (
            "Untuk menghindari kerumitan dan biaya tinggi antarmuka live chat multi-agen di web, sistem menerapkan konsep kolaborasi dua sisi:\n"
            "1. Bot Pusat Resmi (Dinkes/Pengmas): Mengirimkan pesan pengingat jadwal dan menampung respons skrining pilihan ganda tertutup.\n"
            "2. Intervensi Klinis Langsung (wa.me): Ketika terdeteksi keluhan (status Kuning/Merah), bot mengirim kontak bidan ke pasien, "
            "dan di dashboard web bidan tersedia tombol 1-klik yang langsung membuka WhatsApp dinas bidan untuk anamnesis personal."
        ),
    ),
    (
        "C. Strategi Kontak Pasien (Nomor Utama vs Kontak Darurat)",
        (
            "1. Nomor Utama (WhatsApp Ibu): Seluruh pesan pengingat dan formulir skrining dikirimkan langsung ke nomor WhatsApp ibu nifas, "
            "karena ibu adalah pihak yang merasakan langsung sensasi fisik tubuhnya.\n"
            "2. Kontak Darurat (Suami / Pendamping): Nomor telepon suami dicatat saat pendaftaran sebagai jalur cadangan jika ibu tidak merespons dalam 24 jam atau jika status merah kritis terdeteksi."
        ),
    ),
    (
        "D. Siklus Pemantauan Penuh 42 Hari",
        (
            "Penanganan suatu insiden keluhan pada KF1 atau KF2 tidak menghentikan jadwal pemantauan sistem. "
            "Sistem akan terus aktif mendampingi ibu secara otomatis hingga genap hari ke-42 (KF4 selesai) dan ditandai lulus pemantauan oleh bidan."
        ),
    ),
]

FLOW_STAGES_SUMMARY = (
    "1. Registrasi (Discharge Planning): Bidan bersama suami menginput profil singkat pasien saat persiapan pulang dari RS/Puskesmas.\n"
    "2. Pengingat Terjadwal: Mesin scheduler memeriksa jatuh tempo KF tiap pukul 08.00 WIB dan mengirim pesan otomatis ke WA ibu.\n"
    "3. Skrining Interaktif: Ibu memilih opsi angka/tombol di WhatsApp (Kondisi Aman vs Ada Keluhan).\n"
    "4. Evaluasi Triase Klinis: Sistem menghitung status (Hijau = Normal, Kuning = Waspada, Merah = Bahaya Akut).\n"
    "5. Intervensi Bidan (wa.me): Notifikasi prioritas muncul di PWA bidan; bidan mengklik tombol wa.me untuk penanganan langsung."
)

FLOW_TABLE_DATA = [
    ["Tahap", "Aktor Utama", "Data Masukan (Input)", "Proses Sistem", "Hasil Keluaran (Output)"],
    ["1. Pendaftaran", "Bidan & Suami", "No WA, Tgl Bersalin, Faskes", "Simpan profil & hitung jadwal KF", "Pasien aktif dalam kohort"],
    ["2. Pengingat", "Mesin Scheduler", "Database jadwal harian", "Pencocokan tanggal bersalin", "Pesan WA terkirim ke ibu"],
    ["3. Skrining", "Ibu Nifas", "Pilihan angka / gejala", "Klasifikasi triase Buku KIA", "Penetapan Hijau/Kuning/Merah"],
    ["4. Intervensi", "Bidan Faskes", "Alert di dashboard triase", "Klik tombol wa.me & anamnesis", "Ibu tertangani klinis"],
    ["5. Kelulusan", "Bidan & Sistem", "Skrining akhir KF4 (H42)", "Verifikasi akhir masa nifas", "Status resmi Lulus Nifas"],
]

RBAC_TABLE_DATA = [
    ["Peran Pengguna", "Pemegang Akun", "Cakupan Data", "Kewenangan Utama"],
    ["Super Admin", "Dinas Kesehatan Kota Surabaya", "Seluruh Surabaya (13 Faskes)", "Membuat akun faskes, dashboard agregat kota, export laporan epidemiologi dan evaluasi pengmas."],
    ["Admin Faskes", "Bidan Koordinator di RS / Puskesmas", "Terisolasi Faskes Sendiri", "Mendaftarkan pasien pulang, antrean triase harian, menghubungi ibu berisiko, mencatat tindakan."],
]

TECH_ITEMS = [
    (
        "1. Bahasa Python 3.12 & Toolchain Astral uv",
        "Menggunakan runtime Python versi modern dengan manajer paket Astral uv untuk eksekusi virtual environment yang deterministik dan cepat.",
        "Ibarat pondasi dan kotak perkakas tukang profesional yang bekerja sangat presisi, memastikan semua suku cadang program terpasang rapi tanpa ada konflik software.",
    ),
    (
        "2. Framework API FastAPI",
        "Framework asynchronous berkinerja tinggi untuk menerima webhook pesan WhatsApp masuk dan menyediakan API bagi dashboard PWA bidan.",
        "Ibarat mesin pengatur lalu lintas pesan berkecepatan tinggi yang mampu memproses ratusan pesan masuk dari WhatsApp dan web secara simultan dalam hitungan milidetik.",
    ),
    (
        "3. Basis Data PostgreSQL 16",
        "Sistem database relasional berstandar industri dengan integritas referensial kuat untuk data pasien, log skrining, dan riwayat tindakan.",
        "Ibarat lemari arsip rekam medis digital berstandar rumah sakit yang terkunci sangat rapat, mencatat riwayat pemulihan ibu secara akurat dan tidak akan tertukar.",
    ),
    (
        "4. Direct Meta WhatsApp Cloud API (Graph API)",
        "Integrasi langsung ke infrastruktur resmi Meta tanpa perantara agen pihak ketiga, memanfaatkan kuota gratis 1.000 percakapan per bulan.",
        "Ibarat memasang pipa air langsung dari sumber resmi PDAM tanpa perantara pihak ketiga, sehingga biaya bulanan jauh lebih hemat dan nomor bot bebas risiko blokir.",
    ),
    (
        "5. Server VPS Biznet GIO NEO Lite (8 vCPU / 8 GB RAM)",
        "Server all-in-one di pusat data lokal Indonesia yang menjalankan API, database, dan web server dalam satu wadah komputasi terpadu.",
        "Ibarat menyewa gedung kantor komputer berdaya besar di dalam negeri, memastikan seluruh data pasien tetap berada di Indonesia sesuai aturan UU Perlindungan Data Pribadi (UU PDP No. 27/2022).",
    ),
    (
        "6. Backup Offsite Harian (Object Storage S3-Compatible)",
        "Penyimpanan cadangan terenkripsi harian di lokasi fisik berbeda dari server utama.",
        "Ibarat brankas salinan rekam medis di gedung terpisah, menjamin data kesehatan ibu nifas tidak akan hilang sekalipun server utama mengalami kerusakan fisik.",
    ),
    (
        "7. Sifat Murni Standalone",
        "Sistem beroperasi mandiri tanpa dependensi langsung ke SIMPUS atau SatuSehat pada fase pilot pengmas.",
        "Sistem langsung siap digunakan di faskes tanpa harus menunggu proses perizinan birokrasi integrasi yang panjang. Data rekapitulasi tetap dapat diekspor ke format Excel sewaktu-waktu.",
    ),
]

MEDICAL_TABLE_DATA = [
    ["Tahap", "Jadwal", "Fokus Pemantauan Klinis", "Indikator Bahaya (Red Flag)"],
    ["KF1", "Hari ke-1 s/d ke-2", "Perdarahan dini, involusi rahim, tanda vital, nyeri hebat.", "Darah membasahi >2 pembalut/jam, pandangan kabur, pusing hebat."],
    ["KF2", "Hari ke-3 s/d ke-7", "Cairan nifas (lochea), infeksi, bendungan ASI, payudara.", "Demam menggigil (>38°C), lochea berbau busuk, payudara merah meradang."],
    ["KF3", "Hari ke-8 s/d ke-28", "Penyembuhan jahitan perineum/SC, infeksi lanjutan.", "Luka jahitan terbuka/bernanah, bengkak tungkai kaki asimetris."],
    ["KF4", "Hari ke-29 s/d ke-42", "Pemulihan organ reproduksi, rencana KB, kondisi psikologis.", "Gejala depresi pascasalin (sedih terus-menerus, cemas berlebih, putus asa)."],
]

BUDGET_TABLE_DATA = [
    ["Komponen Pengeluaran", "Spesifikasi / Alokasi", "Waktu Bayar", "Total (Rp)"],
    ["Biaya Setup & Pengerjaan Awal", "Domain .id, saldo prabayar Meta WA, kontingensi 10%", "Sekali di Awal", "Rp550.000"],
    ["Operasional Deployment Bulan 1", "VPS 8GB, storage backup, pesan WA (3.500 pesan), kontingensi", "Bulan ke-1", "Rp1.919.766"],
    ["Operasional Deployment Bulan 2", "VPS 8GB, storage backup, pesan WA (3.500 pesan), kontingensi", "Bulan ke-2", "Rp1.919.766"],
    ["Operasional Deployment Bulan 3", "VPS 8GB, storage backup, pesan WA (3.500 pesan), kontingensi", "Bulan ke-3", "Rp1.919.766"],
    ["TOTAL ANGGARAN PILOT (3 BULAN)", "Total kebutuhan dana operasional penuh 3 bulan", "3 Bulan Penuh", "Rp6.309.298"],
]

EFFICIENCY_NOTES = (
    "1. Penghematan Vendor: Mengeliminasi biaya langganan platform pihak ketiga (Rp500.000/bln) menghemat Rp1.500.000 selama 3 bulan.\n"
    "2. Bebas Lisensi Komersial: Seluruh software inti berbasis open-source (FastAPI, PostgreSQL, Linux) tanpa biaya lisensi berkala.\n"
    "3. Kontribusi In-Kind: Tenaga tim pengembang teknis merupakan kontribusi pengabdian sivitas akademika universitas.\n"
    "4. Tautan Lembar Kerja: Google Spreadsheet Tab 'RAB Revisi (3 Bulan)'."
)

ROADMAP_TABLE_DATA = [
    ["Periode Live Deployment", "Fokus Kegiatan Lapangan", "Target & Indikator Capaian"],
    ["Pra-Deployment (Minggu 0)", "Konfigurasi server VPS, verifikasi nomor bot WhatsApp Cloud API, setup akun faskes di 13 RS & Puskesmas.", "Sistem 100% online, nomor bot terverifikasi."],
    ["Bulan 1 Live (Minggu 1 - 4)", "Peluncuran resmi di 13 faskes mitra, sosialisasi singkat bidan penanggung jawab, onboarding Kohort 1 (~500 ibu), triase KF1 & KF2 harian.", "500 ibu terdaftar, respon triase harian terpantau, respon cepat kasus merah/kuning."],
    ["Bulan 2 Live (Minggu 5 - 8)", "Onboarding Kohort 2 (~500 ibu baru), pemantauan lanjutan Kohort 1 (KF3 & KF4), evaluasi respon bidan faskes terhadap notifikasi triase.", "1.000 ibu nifas terpantau kumulatif, optimasi alur pesan dari umpan balik nakes."],
    ["Bulan 3 Live (Minggu 9 - 12)", "Onboarding Kohort 3 (~500 ibu baru), verifikasi kelulusan nifas 42 hari Kohort 1 dan 2, penarikan data epidemiologi maternal Surabaya, penyerahan laporan pengmas ke Dinkes.", "1.500 ibu nifas terlayani penuh, laporan capaian pengmas terbit untuk Dinas Kesehatan."],
]
