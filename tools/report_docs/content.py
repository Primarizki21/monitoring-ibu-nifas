"""Content definitions for Project Charter and Technical Specification."""

METADATA = {
    "title": "SISTEM MONITORING KESEHATAN IBU NIFAS",
    "subtitle": "Project Charter & Technical Specification Brief (Skala Pilot 3 Bulan)",
    "meta_lines": [
        "Program: Pengabdian Masyarakat (Pengmas) Kolaborasi Pelayanan Kesehatan Maternal",
        "Lokasi Penerapan: Kota Surabaya, Jawa Timur",
        "Mitra Faskes: 3 Rumah Sakit Rujukan & 10 Puskesmas Mitra Surabaya",
        "Target Populasi: ~500 ibu bersalin/bulan (Total target ~1.500 ibu nifas selama 3 bulan live deployment)",
        "Tenaga Terlibat: ~80 Bidan & Petugas Kesehatan Wilayah",
        "Tautan Dokumen Anggaran: Google Spreadsheet RAB Revisi & Matriks Pesan KF1-KF4"
    ]
}

CHAPTER_1_TEXTS = [
    [
        ("Masa nifas (", False, False),
        ("puerperium", False, True),
        (") merupakan periode paling kritis dalam kelangsungan hidup maternal. "
         "Berdasarkan data kesehatan nasional, lebih dari 60% kematian ibu terjadi pada masa pascapersalinan, "
         "terutama akibat komplikasi sekunder seperti perdarahan lanjut, infeksi nifas (", False, False),
        ("sepsis puerperalis", False, True),
        ("), preeklampsia ", False, False),
        ("postpartum", False, True),
        (", serta depresi pascamelahirkan.", False, False)
    ],
    [
        ("Meskipun standar Kementerian Kesehatan RI mewajibkan empat kali kunjungan nifas (KF1 hingga KF4), "
         "angka ketidakhadiran kontrol mandiri masih tinggi setelah pasien keluar dari fasilitas kesehatan. "
         "Kendala kelelahan merawat bayi baru lahir, rasa nyeri fisik pascasalin, dan keterbatasan transportasi "
         "menjadi penyebab utama terputusnya pemantauan rutin.", False, False)
    ],
    [
        ("Sistem ini dirancang untuk menjembatani kesenjangan tersebut melalui pendekatan ", False, False),
        ("proactive digital outreach", False, True),
        (". Tanpa menunggu ibu datang ke faskes, sistem secara otomatis menyapa ibu nifas melalui aplikasi WhatsApp resmi, "
         "melakukan skrining berkala berbasis Buku KIA, dan langsung memberikan peringatan dini kepada bidan wilayah jika ditemukan tanda bahaya.", False, False)
    ]
]

CHAPTER_2_ITEMS = [
    (
        "A. Deterministic Rule-Based Engine (Strictly No LLM)",
        [
            ("Sistem ini secara sengaja ", False, False),
            ("TIDAK MENGGUNAKAN Large Language Model", True, False),
            (" (AI generatif). Keputusan ini didasari tiga pertimbangan utama:\n", False, False),
            ("1. ", True, False),
            ("Zero Medical Hallucination", True, True),
            (": Triase kondisi darurat tidak boleh memiliki margin kesalahan atau jawaban spekulatif dari model bahasa.\n", False, False),
            ("2. Kepatuhan Standar Klinis: Logika penilaian sepenuhnya mengacu pada algoritma Buku KIA Kemenkes RI yang deterministik dan ", False, False),
            ("auditable", False, True),
            (" secara hukum medis.\n", False, False),
            ("3. Efisiensi Anggaran & Kecepatan: Meniadakan biaya token AI, memastikan waktu tanggap server di bawah 1 detik, dan beban komputasi sangat ringan.", False, False)
        ]
    ),
    (
        "B. Model Komunikasi WhatsApp Hybrid",
        [
            ("Untuk menghindari kerumitan dan biaya tinggi antarmuka ", False, False),
            ("live chat multi-agent", False, True),
            (" di web, sistem menerapkan konsep kolaborasi dua sisi:\n", False, False),
            ("1. Bot Pusat Resmi: Mengirimkan pesan pengingat jadwal dan menampung respons skrining tertutup berbasis tombol/angka.\n", False, False),
            ("2. Intervensi Klinis Langsung (", False, False),
            ("wa.me", False, True),
            ("): Ketika terdeteksi keluhan (status Kuning/Merah), bot mengirim kontak bidan ke pasien, "
             "dan di dashboard web bidan tersedia tombol 1-klik yang langsung membuka WhatsApp dinas bidan untuk melakukan anamnesis personal.", False, False)
        ]
    ),
    (
        "C. Strategi Kontak Pasien (Nomor Utama vs Kontak Darurat)",
        [
            ("1. Nomor Utama (WhatsApp Ibu): Seluruh pesan pengingat dan formulir skrining dikirimkan langsung ke nomor WhatsApp ibu nifas, "
             "karena ibu adalah pihak yang merasakan langsung sensasi fisik tubuhnya.\n", False, False),
            ("2. Kontak Darurat (Suami / Pendamping): Nomor telepon suami dicatat saat pendaftaran sebagai jalur cadangan (", False, False),
            ("fail-safe", False, True),
            (") jika ibu tidak merespons dalam 24 jam atau jika status merah kritis terdeteksi.", False, False)
        ]
    ),
    (
        "D. Siklus Pemantauan Penuh 42 Hari",
        [
            ("Penanganan suatu insiden keluhan pada KF1 atau KF2 tidak menghentikan jadwal pemantauan sistem. "
             "Sistem akan terus aktif mendampingi ibu secara otomatis hingga genap hari ke-42 (KF4 selesai) dan ditandai lulus pemantauan oleh bidan penanggung jawab.", False, False)
        ]
    )
]

FLOWCHART_SECTIONS = [
    {
        "title": "3.1. Alur Onboarding Pasien & Penjadwalan Otomatis (Tahap 1 & 2)",
        "image_file": "flowchart_1_onboarding.png",
        "caption": "Gambar 3.1: Alur Onboarding Pasien saat Discharge Planning dan Penjadwalan Otomatis KF1-KF4",
        "explanation": (
            "Diagram 3.1 menggambarkan proses inisiasi data pasien saat persiapan pemulangan (discharge planning). "
            "Untuk mencegah beban administrasi pada ibu yang sedang memulihkan kondisi fisik, pendaftaran dilakukan oleh bidan "
            "bersama suami atau keluarga pendamping. Sistem secara otomatis menghitung linimasa kunjungan nifas (KF1 hingga KF4) "
            "berdasarkan tanggal dan jam persalinan. Setiap hari pukul 08.00 WIB, mesin scheduler mandiri memindai database "
            "untuk menyiapkan antrean pesan pengingat bagi pasien yang memasuki jadwal pemantauan, atau beralih ke status siaga (standby) "
            "jika tidak ada jadwal jatuh tempo."
        )
    },
    {
        "title": "3.2. Alur Interaksi WhatsApp & Triase Klinis Deterministik (Tahap 3 & 4)",
        "image_file": "flowchart_2_triage.png",
        "caption": "Gambar 3.2: Alur Interaksi WhatsApp Dua Arah dan Evaluasi Triase Klinis Deterministik Tiga Cabang",
        "explanation": (
            "Diagram 3.2 mengilustrasikan interaksi dua arah antara pasien dan nomor resmi bot WhatsApp. "
            "Pesan skrining dikirimkan langsung ke nomor ibu nifas sebagai pihak yang merasakan langsung tanda klinis tubuhnya. "
            "Ibu cukup memilih opsi angka atau tombol terstruktur tanpa perlu mengetik teks panjang. "
            "Evaluasi kondisi dilakukan secara deterministik tanpa LLM melalui klasifikasi triase tiga cabang (trident layout) "
            "berdasarkan Buku KIA: jalur Hijau (Normal) langsung menerima edukasi, jalur Kuning (Waspada) meneruskan alert dan kontak bidan, "
            "serta jalur Merah (Bahaya Akut) memicu alert prioritas darurat medis."
        )
    },
    {
        "title": "3.3. Alur Intervensi Tenaga Kesehatan & Siklus Hidup 42 Hari (Tahap 5)",
        "image_file": "flowchart_3_intervention.png",
        "caption": "Gambar 3.3: Alur Tindakan Intervensi Tenaga Kesehatan (wa.me) dan Pengawalan Siklus Hidup 42 Hari",
        "explanation": (
            "Diagram 3.3 menunjukkan prosedur tanggap klinis oleh tenaga kesehatan dan tata kelola siklus hidup pemantauan. "
            "Dashboard triase menerapkan pemilahan data berbasis wilayah faskes, sehingga bidan hanya menerima notifikasi pasien binaannya. "
            "Alur tindakan klinis terbagi seimbang antara jalur utama komunikasi bidan ke ibu via wa.me dan jalur pengaman darurat (fail-safe) "
            "ke suami jika pasien tidak merespons. Penanganan suatu insiden tidak memutus pemantauan; sistem tetap berstatus aktif mengawal "
            "jadwal berikutnya hingga evaluasi ambang 42 hari selesai secara paripurna."
        )
    }
]

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
        "1. Bahasa Pemrograman Python 3.12 & Toolchain Astral uv",
        "Menggunakan runtime Python versi modern dengan manajer paket Astral uv untuk eksekusi virtual environment yang deterministik dan cepat.",
        "Ibarat pondasi dan kotak perkakas tukang profesional yang bekerja sangat presisi, memastikan semua suku cadang program terpasang rapi tanpa ada konflik software."
    ),
    (
        "2. Framework API FastAPI",
        "Framework asynchronous berkinerja tinggi untuk menerima webhook pesan WhatsApp masuk dan menyediakan API bagi dashboard PWA bidan.",
        "Ibarat mesin pengatur lalu lintas pesan berkecepatan tinggi yang mampu memproses ratusan pesan masuk dari WhatsApp dan web secara simultan dalam hitungan milidetik."
    ),
    (
        "3. Basis Data PostgreSQL 16",
        "Sistem database relasional berstandar industri dengan integritas referensial kuat untuk data pasien, log skrining, dan riwayat tindakan.",
        "Ibarat lemari arsip rekam medis digital berstandar rumah sakit yang terkunci sangat rapat, mencatat riwayat pemulihan ibu secara akurat dan tidak akan tertukar."
    ),
    (
        "4. Direct Meta WhatsApp Cloud API (Graph API)",
        "Integrasi langsung ke infrastruktur resmi Meta tanpa perantara agen pihak ketiga, memanfaatkan kuota gratis 1.000 percakapan per bulan.",
        "Ibarat memasang pipa air langsung dari sumber resmi PDAM tanpa perantara pihak ketiga, sehingga biaya bulanan jauh lebih hemat dan nomor bot bebas risiko blokir."
    ),
    (
        "5. Server VPS Biznet GIO NEO Lite (8 vCPU / 8 GB RAM)",
        "Server all-in-one di pusat data lokal Indonesia yang menjalankan API, database, dan web server dalam satu wadah komputasi terpadu.",
        "Ibarat menyewa gedung kantor komputer berdaya besar di dalam negeri, memastikan seluruh data pasien tetap berada di Indonesia sesuai aturan UU Perlindungan Data Pribadi (UU PDP No. 27/2022)."
    ),
    (
        "6. Backup Offsite Harian (Object Storage S3-Compatible)",
        "Penyimpanan cadangan terenkripsi harian di lokasi fisik berbeda dari server utama.",
        "Ibarat brankas salinan rekam medis di gedung terpisah, menjamin data kesehatan ibu nifas tidak akan hilang sekalipun server utama mengalami kerusakan fisik."
    ),
    (
        "7. Sifat Murni Standalone",
        "Sistem beroperasi mandiri tanpa dependensi langsung ke SIMPUS atau SatuSehat pada fase pilot pengmas.",
        "Sistem langsung siap digunakan di faskes tanpa harus menunggu proses perizinan birokrasi integrasi yang panjang. Data rekapitulasi tetap dapat diekspor ke format Excel sewaktu-waktu."
    )
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
