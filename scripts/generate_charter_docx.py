import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_callout(doc, title, text, bg_color="F0FDF4", border_color="16A34A"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    # Left border only
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="none"/>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    r_title = p.add_run(title + "\n")
    r_title.bold = True
    r_title.font.name = "Arial"
    r_title.font.size = Pt(10)
    r_title.font.color.rgb = RGBColor(22, 101, 52)
    
    r_text = p.add_run(text)
    r_text.font.name = "Arial"
    r_text.font.size = Pt(9.5)
    r_text.font.color.rgb = RGBColor(30, 41, 59)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def format_table_headers(table, col_widths, hex_bg="0F4C81"):
    hdr_cells = table.rows[0].cells
    for i, cell in enumerate(hdr_cells):
        cell.width = col_widths[i]
        set_cell_background(cell, hex_bg)
        set_cell_margins(cell, top=140, bottom=140, left=160, right=160)
        for p in cell.paragraphs:
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            for r in p.runs:
                r.bold = True
                r.font.name = "Arial"
                r.font.size = Pt(9.5)
                r.font.color.rgb = RGBColor(255, 255, 255)

def build_charter_docx(output_path):
    doc = Document()
    
    # Page Setup: A4, 1-inch margins
    sections = doc.sections
    for section in sections:
        section.page_width = Inches(8.27)   # A4 width
        section.page_height = Inches(11.69) # A4 height
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        
    # Styles
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Arial'
    style_normal.font.size = Pt(10.5)
    style_normal.font.color.rgb = RGBColor(30, 41, 59)
    style_normal.paragraph_format.line_spacing = 1.25
    style_normal.paragraph_format.space_after = Pt(6)

    # Document Header
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(2)
    r_title = p_title.add_run("SISTEM MONITORING KESEHATAN IBU NIFAS")
    r_title.bold = True
    r_title.font.size = Pt(20)
    r_title.font.color.rgb = RGBColor(15, 76, 129)

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(14)
    r_sub = p_sub.add_run("Project Charter & Technical Specification Brief (Skala Pilot 3 Bulan)")
    r_sub.font.size = Pt(12)
    r_sub.font.color.rgb = RGBColor(71, 85, 105)

    # Metadata Box
    add_callout(
        doc,
        "INFORMASI PROYEK PENGABDIAN MASYARAKAT",
        "Program: Pengabdian Masyarakat (Pengmas) Kolaborasi Pelayanan Kesehatan Maternal\n"
        "Lokasi: Kota Surabaya, Jawa Timur\n"
        "Mitra Faskes: 3 Rumah Sakit Rujukan & 10 Puskesmas Mitra Surabaya\n"
        "Target Populasi: ~500 ibu bersalin/bulan (Total ~1.500 ibu nifas selama 3 bulan live deployment)\n"
        "Tenaga Terlibat: ~80 Bidan & Petugas Kesehatan Wilayah\n"
        "Tautan Anggaran Terkait: Google Spreadsheet RAB Revisi & Matriks Pesan KF1-KF4",
        bg_color="F8FAFC",
        border_color="0F4C81"
    )

    # Helper for Headings
    def add_h2(text, page_break=True):
        if page_break:
            doc.add_page_break()
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(14)
        h.paragraph_format.space_after = Pt(6)
        r = h.add_run(text)
        r.bold = True
        r.font.size = Pt(14)
        r.font.color.rgb = RGBColor(30, 58, 138)
        return h

    def add_h3(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(10)
        h.paragraph_format.space_after = Pt(4)
        r = h.add_run(text)
        r.bold = True
        r.font.size = Pt(11.5)
        r.font.color.rgb = RGBColor(15, 23, 42)
        return h

    # Bab 1
    add_h2("Bab 1. Ringkasan Eksekutif (Executive Summary)")
    doc.add_paragraph(
        "Masa nifas (puerperium) merupakan periode paling kritis dalam kelangsungan hidup maternal. "
        "Berdasarkan data kesehatan nasional, lebih dari 60% kematian ibu terjadi pada masa pascapersalinan, "
        "terutama akibat komplikasi yang terlambat dideteksi seperti perdarahan sekunder, infeksi nifas (sepsis), "
        "preeklampsia postpartum, serta depresi pascamelahirkan."
    )
    doc.add_paragraph(
        "Meskipun standar Kementerian Kesehatan RI mewajibkan empat kali kunjungan nifas (KF1 hingga KF4), "
        "angka ketidakhadiran kontrol mandiri masih tinggi setelah pasien keluar dari fasilitas kesehatan. "
        "Kendala kelelahan merawat bayi baru lahir, rasa nyeri fisik pascasalin, dan keterbatasan transportasi "
        "menjadi penyebab utama terputusnya pemantauan."
    )
    doc.add_paragraph(
        "Sistem ini dirancang untuk menjembatani kesenjangan tersebut melalui pendekatan proactive digital outreach. "
        "Tanpa menunggu ibu datang ke faskes, sistem secara otomatis menyapa ibu nifas melalui aplikasi WhatsApp resmi, "
        "melakukan skrining berkala berbasis Buku KIA, dan langsung memberikan peringatan dini kepada bidan wilayah jika ditemukan tanda bahaya."
    )

    # Bab 2
    add_h2("Bab 2. Prinsip Desain & Keputusan Kritis Sistem")
    add_h3("A. Deterministic Rule-Based Engine (Strictly No LLM)")
    doc.add_paragraph(
        "Sistem ini secara sengaja TIDAK MENGGUNAKAN Large Language Model (AI generatif). Keputusan ini didasari tiga pertimbangan utama:\n"
        "1. Zero Medical Hallucination: Triase kondisi darurat tidak boleh memiliki margin kesalahan atau jawaban tidak terduga dari model bahasa.\n"
        "2. Kepatuhan Standar Klinis: Logika penilaian sepenuhnya mengacu pada algoritma Buku KIA Kemenkes RI yang deterministik dan auditable secara hukum medis.\n"
        "3. Efisiensi Anggaran & Kecepatan: Meniadakan biaya token AI per kata, waktu tanggap di bawah 1 detik, dan server sangat ringan."
    )

    add_h3("B. Model Komunikasi WhatsApp Hybrid")
    doc.add_paragraph(
        "Untuk menghindari kerumitan dan biaya tinggi antarmuka live chat multi-agen di web, sistem menerapkan konsep kolaborasi dua sisi:\n"
        "1. Bot Pusat Resmi (Dinkes/Pengmas): Mengirimkan pesan pengingat jadwal dan menampung respons skrining pilihan ganda tertutup.\n"
        "2. Intervensi Klinis Langsung (wa.me): Ketika terdeteksi keluhan (status Kuning/Merah), bot mengirim kontak bidan ke pasien, "
        "dan di dashboard web bidan tersedia tombol 1-klik yang langsung membuka WhatsApp dinas bidan untuk anamnesis personal."
    )

    add_h3("C. Strategi Kontak Pasien (Nomor Utama vs Kontak Darurat)")
    doc.add_paragraph(
        "1. Nomor Utama (WhatsApp Ibu): Seluruh pesan pengingat dan formulir skrining dikirimkan langsung ke nomor WhatsApp ibu nifas, "
        "karena ibu adalah pihak yang merasakan langsung sensasi fisik tubuhnya.\n"
        "2. Kontak Darurat (Suami / Pendamping): Nomor telepon suami dicatat saat pendaftaran sebagai jalur cadangan jika ibu tidak merespons dalam 24 jam atau jika status merah kritis terdeteksi."
    )

    add_h3("D. Siklus Pemantauan Penuh 42 Hari")
    doc.add_paragraph(
        "Penanganan suatu insiden keluhan pada KF1 atau KF2 tidak menghentikan jadwal pemantauan sistem. "
        "Sistem akan terus aktif mendampingi ibu secara otomatis hingga genap hari ke-42 (KF4 selesai) dan ditandai lulus pemantauan oleh bidan."
    )

    # Bab 3
    add_h2("Bab 3. Diagram & Alur Kerja Sistem (Flowchart Operasional)")
    doc.add_paragraph(
        "Alur operasional sistem menghubungkan lima tahapan kerja terintegrasi dari faskes ke rumah pasien:"
    )
    
    # 5 Stages Box
    add_callout(
        doc,
        "LIMA TAHAP ALUR OPERASIONAL SISTEM",
        "1. Registrasi (Discharge Planning): Bidan bersama suami menginput profil singkat pasien saat persiapan pulang dari RS/Puskesmas.\n"
        "2. Pengingat Terjadwal: Mesin scheduler memeriksa jatuh tempo KF tiap pukul 08.00 WIB dan mengirim pesan otomatis ke WA ibu.\n"
        "3. Skrining Interaktif: Ibu memilih opsi angka/tombol di WhatsApp (Kondisi Aman vs Ada Keluhan).\n"
        "4. Evaluasi Triase Klinis: Sistem menghitung status (Hijau = Normal, Kuning = Waspada, Merah = Bahaya Akut).\n"
        "5. Intervensi Bidan (wa.me): Notifikasi prioritas muncul di PWA bidan; bidan mengklik tombol wa.me untuk penanganan langsung.",
        bg_color="EFF6FF",
        border_color="2563EB"
    )

    tbl_flow = doc.add_table(rows=6, cols=5)
    tbl_flow.alignment = WD_TABLE_ALIGNMENT.CENTER
    flow_widths = [Inches(1.0), Inches(1.1), Inches(1.4), Inches(1.5), Inches(1.5)]
    
    flow_data = [
        ["Tahap", "Aktor Utama", "Data Masukan (Input)", "Proses Sistem", "Hasil Keluaran (Output)"],
        ["1. Pendaftaran", "Bidan & Suami", "No WA, Tgl Bersalin, Faskes", "Simpan profil & hitung jadwal KF", "Pasien aktif dalam kohort"],
        ["2. Pengingat", "Mesin Scheduler", "Database jadwal harian", "Pencocokan tanggal bersalin", "Pesan WA terkirim ke ibu"],
        ["3. Skrining", "Ibu Nifas", "Pilihan angka / gejala", "Klasifikasi triase Buku KIA", "Penetapan Hijau/Kuning/Merah"],
        ["4. Intervensi", "Bidan Faskes", "Alert di dashboard triase", "Klik tombol wa.me & anamnesis", "Ibu tertangani klinis"],
        ["5. Kelulusan", "Bidan & Sistem", "Skrining akhir KF4 (H42)", "Verifikasi akhir masa nifas", "Status resmi Lulus Nifas"]
    ]
    for r_idx, row in enumerate(tbl_flow.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.text = flow_data[r_idx][c_idx]
            cell.width = flow_widths[c_idx]
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            if r_idx % 2 == 1 and r_idx > 0:
                set_cell_background(cell, "F8FAFC")
    format_table_headers(tbl_flow, flow_widths, "0F4C81")

    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    doc.add_paragraph("Spesifikasi diagram alir ANSI/ISO lengkap dan kode Mermaid dapat diakses pada dokumen repositori: FLOWCHART.md.")

    # Bab 4
    add_h2("Bab 4. Struktur Peran & Hak Akses (Multi-Tenant RBAC)")
    doc.add_paragraph(
        "Sistem menerapkan isolasi data faskes yang ketat untuk menjamin kerahasiaan data medis pasien:"
    )

    tbl_rbac = doc.add_table(rows=3, cols=4)
    tbl_rbac.alignment = WD_TABLE_ALIGNMENT.CENTER
    rbac_widths = [Inches(1.2), Inches(1.5), Inches(1.5), Inches(2.3)]
    rbac_data = [
        ["Peran Pengguna", "Pemegang Akun", "Cakupan Data", "Kewenangan Utama"],
        ["Super Admin", "Dinas Kesehatan Kota Surabaya", "Seluruh Surabaya (13 Faskes)", "Membuat akun faskes, dashboard agregat kota, export laporan epidemiologi dan evaluasi pengmas."],
        ["Admin Faskes", "Bidan Koordinator di RS / Puskesmas", "Terisolasi Faskes Sendiri", "Mendaftarkan pasien pulang, antrean triase harian, menghubungi ibu berisiko, mencatat tindakan."]
    ]
    for r_idx, row in enumerate(tbl_rbac.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.text = r_rbac = rbac_data[r_idx][c_idx]
            cell.width = rbac_widths[c_idx]
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
    format_table_headers(tbl_rbac, rbac_widths, "0F4C81")

    # Bab 5
    add_h2("Bab 5. Spesifikasi Teknis & Infrastruktur (Penjelasan Lengkap)")
    doc.add_paragraph(
        "Untuk memudahkan pemahaman seluruh tim pengmas dan reviewer non-teknis, berikut penjelasan teknis beserta analogi fungsinya:"
    )

    tech_items = [
        ("1. Bahasa Python 3.12 & Toolchain Astral uv",
         "Menggunakan runtime Python versi modern dengan manajer paket Astral uv untuk eksekusi virtual environment yang deterministik dan cepat.",
         "Ibarat pondasi dan kotak perkakas tukang profesional yang bekerja sangat presisi, memastikan semua suku cadang program terpasang rapi tanpa ada konflik software."),
        ("2. Framework API FastAPI",
         "Framework asynchronous berkinerja tinggi untuk menerima webhook pesan WhatsApp masuk dan menyediakan API bagi dashboard PWA bidan.",
         "Ibarat mesin pengatur lalu lintas pesan berkecepatan tinggi yang mampu memproses ratusan pesan masuk dari WhatsApp dan web secara simultan dalam hitungan milidetik."),
        ("3. Basis Data PostgreSQL 16",
         "Sistem database relasional berstandar industri dengan integritas referensial kuat untuk data pasien, log skrining, dan riwayat tindakan.",
         "Ibarat lemari arsip rekam medis digital berstandar rumah sakit yang terkunci sangat rapat, mencatat riwayat pemulihan ibu secara akurat dan tidak akan tertukar."),
        ("4. Direct Meta WhatsApp Cloud API (Graph API)",
         "Integrasi langsung ke infrastruktur resmi Meta tanpa perantara agen pihak ketiga, memanfaatkan kuota gratis 1.000 percakapan per bulan.",
         "Ibarat memasang pipa air langsung dari sumber resmi PDAM tanpa perantara pihak ketiga, sehingga biaya bulanan jauh lebih hemat dan nomor bot bebas risiko blokir."),
        ("5. Server VPS Biznet GIO NEO Lite (8 vCPU / 8 GB RAM)",
         "Server all-in-one di pusat data lokal Indonesia yang menjalankan API, database, dan web server dalam satu wadah komputasi terpadu.",
         "Ibarat menyewa gedung kantor komputer berdaya besar di dalam negeri, memastikan seluruh data pasien tetap berada di Indonesia sesuai aturan UU Perlindungan Data Pribadi (UU PDP No. 27/2022)."),
        ("6. Backup Offsite Harian (Object Storage S3-Compatible)",
         "Penyimpanan cadangan terenkripsi harian di lokasi fisik berbeda dari server utama.",
         "Ibarat brankas salinan rekam medis di gedung terpisah, menjamin data kesehatan ibu nifas tidak akan hilang sekalipun server utama mengalami kerusakan fisik."),
        ("7. Sifat Murni Standalone",
         "Sistem beroperasi mandiri tanpa dependensi langsung ke SIMPUS atau SatuSehat pada fase pilot pengmas.",
         "Sistem langsung siap digunakan di faskes tanpa harus menunggu proses perizinan birokrasi integrasi yang panjang. Data rekapitulasi tetap dapat diekspor ke format Excel sewaktu-waktu.")
    ]

    for title, tech, analogy in tech_items:
        add_h3(title)
        doc.add_paragraph(tech)
        add_callout(doc, "Analogi untuk Dosen & Tim Non-Teknis:", analogy, bg_color="F0FDF4", border_color="16A34A")

    # Bab 6
    add_h2("Bab 6. Protokol Medis & Matriks Skrining (KF1 s/d KF4)")
    doc.add_paragraph("Parameter skrining klinis merujuk pada standar Buku KIA Kementerian Kesehatan RI:")

    tbl_med = doc.add_table(rows=5, cols=4)
    tbl_med.alignment = WD_TABLE_ALIGNMENT.CENTER
    med_widths = [Inches(1.0), Inches(1.3), Inches(2.1), Inches(2.1)]
    med_data = [
        ["Tahap", "Jadwal", "Fokus Pemantauan Klinis", "Indikator Bahaya (Red Flag)"],
        ["KF1", "Hari ke-1 s/d ke-2", "Perdarahan dini, involusi rahim, tanda vital, nyeri hebat.", "Darah membasahi >2 pembalut/jam, pandangan kabur, pusing hebat."],
        ["KF2", "Hari ke-3 s/d ke-7", "Cairan nifas (lochea), infeksi, bendungan ASI, payudara.", "Demam menggigil (>38°C), lochea berbau busuk, payudara merah meradang."],
        ["KF3", "Hari ke-8 s/d ke-28", "Penyembuhan jahitan perineum/SC, infeksi lanjutan.", "Luka jahitan terbuka/bernanah, bengkak tungkai kaki asimetris."],
        ["KF4", "Hari ke-29 s/d ke-42", "Pemulihan organ reproduksi, rencana KB, kondisi psikologis.", "Gejala depresi pascasalin (sedih terus-menerus, cemas berlebih, putus asa)."]
    ]
    for r_idx, row in enumerate(tbl_med.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.text = med_data[r_idx][c_idx]
            cell.width = med_widths[c_idx]
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
    format_table_headers(tbl_med, med_widths, "0F4C81")

    # Bab 7
    add_h2("Bab 7. Rencana Anggaran Biaya & Efisiensi Finansial (Pilot 3 Bulan)")
    doc.add_paragraph(
        "Rincian anggaran telah disinkronkan secara presisi dengan lembar kerja Google Spreadsheet:"
    )

    tbl_rab = doc.add_table(rows=6, cols=4)
    tbl_rab.alignment = WD_TABLE_ALIGNMENT.CENTER
    rab_widths = [Inches(2.2), Inches(2.2), Inches(1.1), Inches(1.0)]
    rab_data = [
        ["Komponen Pengeluaran", "Spesifikasi / Alokasi", "Waktu Bayar", "Total (Rp)"],
        ["Biaya Setup & Pengerjaan Awal", "Domain .id, saldo prabayar Meta WA, kontingensi 10%", "Sekali di Awal", "Rp550.000"],
        ["Operasional Deployment Bulan 1", "VPS 8GB, storage backup, pesan WA (3.500 pesan), kontingensi", "Bulan ke-1", "Rp1.919.766"],
        ["Operasional Deployment Bulan 2", "VPS 8GB, storage backup, pesan WA (3.500 pesan), kontingensi", "Bulan ke-2", "Rp1.919.766"],
        ["Operasional Deployment Bulan 3", "VPS 8GB, storage backup, pesan WA (3.500 pesan), kontingensi", "Bulan ke-3", "Rp1.919.766"],
        ["TOTAL ANGGARAN PILOT (3 BULAN)", "Total kebutuhan dana operasional penuh 3 bulan", "3 Bulan Penuh", "Rp6.309.298"]
    ]
    for r_idx, row in enumerate(tbl_rab.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.text = rab_data[r_idx][c_idx]
            cell.width = rab_widths[c_idx]
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            if r_idx == 5:
                set_cell_background(cell, "DCFCE7")
                for p in cell.paragraphs:
                    for r in p.runs:
                        r.bold = True
                        r.font.color.rgb = RGBColor(22, 101, 52)
    format_table_headers(tbl_rab, rab_widths, "0F4C81")

    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    add_callout(
        doc,
        "CATATAN EFISIENSI FINANSIAL",
        "1. Penghematan Vendor: Mengeliminasi biaya langganan platform pihak ketiga (Rp500.000/bln) menghemat Rp1.500.000 selama 3 bulan.\n"
        "2. Bebas Lisensi Komersial: Seluruh software inti berbasis open-source (FastAPI, PostgreSQL, Linux) tanpa biaya lisensi berkala.\n"
        "3. Kontribusi In-Kind: Tenaga tim pengembang teknis merupakan kontribusi pengabdian sivitas akademika universitas.\n"
        "4. Tautan Lembar Kerja: Google Spreadsheet Tab 'RAB Revisi (3 Bulan)'.",
        bg_color="FEF9C3",
        border_color="CA8A04"
    )

    # Bab 8
    add_h2("Bab 8. Rencana Kerja Lapangan (Roadmap 3 Bulan Live Deployment)")
    doc.add_paragraph(
        "Jadwal di bawah ini menegaskan tiga bulan masa operasional langsung di lapangan (Live Deployment) di mana sistem telah aktif melayani pasien nifas:"
    )

    tbl_road = doc.add_table(rows=5, cols=3)
    tbl_road.alignment = WD_TABLE_ALIGNMENT.CENTER
    road_widths = [Inches(1.8), Inches(2.7), Inches(2.0)]
    road_data = [
        ["Periode Live Deployment", "Fokus Kegiatan Lapangan", "Target & Indikator Capaian"],
        ["Pra-Deployment (Minggu 0)", "Konfigurasi server VPS, verifikasi nomor bot WhatsApp Cloud API, setup akun faskes di 13 RS & Puskesmas.", "Sistem 100% online, nomor bot terverifikasi."],
        ["Bulan 1 Live (Minggu 1 - 4)", "Peluncuran resmi di 13 faskes mitra, sosialisasi singkat bidan penanggung jawab, onboarding Kohort 1 (~500 ibu), triase KF1 & KF2 harian.", "500 ibu terdaftar, respon triase harian terpantau, respon cepat kasus merah/kuning."],
        ["Bulan 2 Live (Minggu 5 - 8)", "Onboarding Kohort 2 (~500 ibu baru), pemantauan lanjutan Kohort 1 (KF3 & KF4), evaluasi respon bidan faskes terhadap notifikasi triase.", "1.000 ibu nifas terpantau kumulatif, optimasi alur pesan dari umpan balik nakes."],
        ["Bulan 3 Live (Minggu 9 - 12)", "Onboarding Kohort 3 (~500 ibu baru), verifikasi kelulusan nifas 42 hari Kohort 1 dan 2, penarikan data epidemiologi maternal Surabaya, penyerahan laporan pengmas ke Dinkes.", "1.500 ibu nifas terlayani penuh, laporan capaian pengmas terbit untuk Dinas Kesehatan."]
    ]
    for r_idx, row in enumerate(tbl_road.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.text = road_data[r_idx][c_idx]
            cell.width = road_widths[c_idx]
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
    format_table_headers(tbl_road, road_widths, "0F4C81")

    # Ensure output dir exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc.save(output_path)
    print(f"Successfully generated DOCX at: {output_path}")

if __name__ == "__main__":
    out_file = os.path.abspath("docs/PROJECT_CHARTER_MONITORING_NIFAS.docx")
    build_charter_docx(out_file)
