"""
Definisi dan builder keempat diagram alir (flowchart) sistem pemantauan nifas
menggunakan engine Matplotlib murni.
"""
from pathlib import Path
from tools.report_docs.chart_engine import Flowchart


def build_flowchart_1_onboarding() -> Flowchart:
    """Diagram 3.1: Alur Onboarding Pasien & Penjadwalan Otomatis (Tahap 1 & 2)."""
    fc = Flowchart(figsize=(11.5, 7.5), dpi=300)

    # 1. Container Faskes
    fc.add_container(
        id="c_faskes",
        label="1. FASKES & REGISTRASI (DISCHARGE PLANNING)",
        x=3,
        y=4,
        w=44,
        h=92,
        bg_color="#F0FDF4",
        border_color="#4ADE80",
        title_color="#166534",
    )

    fc.add_node(
        id="A",
        label="Mulai: Pasien Melahirkan di RS / Puskesmas",
        x=7,
        y=77,
        w=36,
        h=9,
        shape="terminator",
    )
    fc.add_node(
        id="B",
        label="Persiapan Pulang / Discharge Planning",
        x=7,
        y=57,
        w=36,
        h=9,
        shape="process",
    )
    fc.add_node(
        id="C",
        label="Bidan & Pendamping Input Data:\nNo WA Ibu & No Darurat Suami",
        x=7,
        y=37,
        w=36,
        h=10,
        shape="io",
    )
    fc.add_node(
        id="D",
        label="Simpan Profil Pasien &\nHitung Linimasa Jadwal KF1–KF4",
        x=7,
        y=17,
        w=36,
        h=10,
        shape="process",
    )

    fc.add_edge("A", "B", "bottom", "top")
    fc.add_edge("B", "C", "bottom", "top")
    fc.add_edge("C", "D", "bottom", "top")

    # 2. Container Backend
    fc.add_container(
        id="c_backend",
        label="2. SISTEM BACKEND & SCHEDULER (FASTAPI)",
        x=53,
        y=4,
        w=44,
        h=92,
        bg_color="#F0FDFA",
        border_color="#2DD4BF",
        title_color="#0F766E",
    )

    fc.add_node(
        id="E",
        label="Scheduler Harian Berjalan\nSetiap Jam 08.00 WIB",
        x=57,
        y=77,
        w=36,
        h=9,
        shape="process",
    )
    fc.add_node(
        id="F",
        label="Apakah Ada Jadwal\nKF Hari Ini?",
        x=64,
        y=53,
        w=22,
        h=14,
        shape="decision",
    )
    fc.add_node(
        id="G",
        label="Ambil Data Pasien\nJatuh Tempo",
        x=74,
        y=33,
        w=20,
        h=9,
        shape="process",
    )
    fc.add_node(
        id="H",
        label="Siapkan Template\nPesan Skrining KF",
        x=74,
        y=15,
        w=20,
        h=9,
        shape="process",
    )
    fc.add_node(
        id="I",
        label="Standby: Menunggu\nJadwal Berikutnya",
        x=56,
        y=33,
        w=15,
        h=10,
        shape="terminator",
    )

    fc.add_edge("E", "F", "bottom", "top")
    fc.add_edge("F", "G", "right", "top", label="Ya", waypoints=[(84, 60)])
    fc.add_edge("G", "H", "bottom", "top")
    fc.add_edge("F", "I", "left", "top", label="Tidak", waypoints=[(63.5, 60)])

    # Bridge D -> E
    fc.add_edge(
        "D",
        "E",
        "right",
        "left",
        waypoints=[(48.5, 22), (48.5, 81.5)],
        label="Registrasi Selesai",
        label_pos=(48.5, 52),
    )

    return fc


def build_flowchart_2_triage() -> Flowchart:
    """Diagram 3.2: Alur Interaksi WhatsApp & Triase Klinis Deterministik (Tahap 3 & 4)."""
    fc = Flowchart(figsize=(12, 8), dpi=300)

    # 1. Container WhatsApp
    fc.add_container(
        id="c_wa",
        label="3. LAYANAN WHATSAPP (BOT & IBU NIFAS)",
        x=3,
        y=4,
        w=34,
        h=92,
        bg_color="#F0FDFA",
        border_color="#2DD4BF",
        title_color="#0F766E",
    )

    fc.add_node(
        id="H",
        label="Template Pesan Skrining Siap",
        x=6,
        y=77,
        w=28,
        h=9,
        shape="process",
    )
    fc.add_node(
        id="J",
        label="Kirim Pesan Pengingat &\nOpsi Skrining ke WA Ibu",
        x=6,
        y=57,
        w=28,
        h=10,
        shape="io",
    )
    fc.add_node(
        id="K",
        label="Ibu Nifas Membaca &\nMemilih Tombol / Angka",
        x=6,
        y=37,
        w=28,
        h=10,
        shape="io",
    )
    fc.add_node(
        id="L",
        label="Terima Respon Jawaban\nSkrining Ibu",
        x=6,
        y=17,
        w=28,
        h=10,
        shape="io",
    )

    fc.add_edge("H", "J", "bottom", "top")
    fc.add_edge("J", "K", "bottom", "top")
    fc.add_edge("K", "L", "bottom", "top")

    # 2. Container Triase
    fc.add_container(
        id="c_triage",
        label="4. EVALUASI TRIASE & LOGIKA MEDIS DETERMINISTIK (BUKU KIA)",
        x=41,
        y=4,
        w=56,
        h=92,
        bg_color="#F0FDF4",
        border_color="#4ADE80",
        title_color="#166534",
    )

    fc.add_node(
        id="M",
        label="Ekstraksi Jawaban Skrining Ibu",
        x=55,
        y=77,
        w=28,
        h=9,
        shape="process",
    )
    fc.add_node(
        id="N",
        label="Hasil Skrining\nBuku KIA?",
        x=58,
        y=53,
        w=22,
        h=14,
        shape="decision",
    )

    # Branch 1: Normal (Hijau)
    fc.add_node(
        id="O",
        label="Status HIJAU:\nNormal / Aman",
        x=43,
        y=33,
        w=16,
        h=9,
        shape="process",
        bg_color="#DCFCE7",
        border_color="#16A34A",
    )
    fc.add_node(
        id="P",
        label="Kirim Edukasi\nPerawatan & ASI",
        x=43,
        y=15,
        w=16,
        h=10,
        shape="io",
    )

    # Branch 2: Waspada (Kuning)
    fc.add_node(
        id="R",
        label="Status KUNING:\nKeluhan Sedang",
        x=61,
        y=33,
        w=16,
        h=9,
        shape="process",
        bg_color="#FEF9C3",
        border_color="#CA8A04",
    )
    fc.add_node(
        id="U1",
        label="Kirim Kontak Bidan &\nAlert Pantauan PWA",
        x=61,
        y=15,
        w=16,
        h=10,
        shape="io",
    )

    # Branch 3: Bahaya (Merah)
    fc.add_node(
        id="S",
        label="Status MERAH:\nBahaya Akut",
        x=79,
        y=33,
        w=16,
        h=9,
        shape="process",
        bg_color="#FEE2E2",
        border_color="#DC2626",
    )
    fc.add_node(
        id="U2",
        label="Kirim Pesan Darurat &\nAlert Prioritas Merah",
        x=79,
        y=15,
        w=16,
        h=10,
        shape="io",
    )

    fc.add_edge("M", "N", "bottom", "top")

    fc.add_edge(
        "N",
        "O",
        "left",
        "top",
        label="Normal",
        waypoints=[(51, 60)],
    )
    fc.add_edge("O", "P", "bottom", "top")

    fc.add_edge("N", "R", "bottom", "top", label="Waspada")
    fc.add_edge("R", "U1", "bottom", "top")

    fc.add_edge(
        "N",
        "S",
        "right",
        "top",
        label="Bahaya",
        waypoints=[(87, 60)],
    )
    fc.add_edge("S", "U2", "bottom", "top")

    # Bridge L -> M
    fc.add_edge(
        "L",
        "M",
        "right",
        "left",
        waypoints=[(37.5, 22), (37.5, 81.5)],
        label="Kirim Respon",
        label_pos=(37.5, 52),
    )

    return fc


def build_flowchart_3_intervention() -> Flowchart:
    """Diagram 3.3: Alur Tindakan Intervensi Tenaga Kesehatan & Siklus Hidup 42 Hari (Tahap 5)."""
    fc = Flowchart(figsize=(12, 8), dpi=300)

    # 1. Container Intervensi
    fc.add_container(
        id="c_intervensi",
        label="5. TINDAKAN KLINIS TENAGA KESEHATAN (BIDAN)",
        x=3,
        y=4,
        w=51,
        h=92,
        bg_color="#F0FDF4",
        border_color="#4ADE80",
        title_color="#166534",
    )

    fc.add_node(
        id="U",
        label="Alert Triase Masuk Dashboard PWA Bidan",
        x=11,
        y=78,
        w=35,
        h=8,
        shape="process",
    )
    fc.add_node(
        id="V",
        label="Bidan Meninjau Gejala &\nData Riwayat Pasien",
        x=11,
        y=63,
        w=35,
        h=9,
        shape="process",
    )
    fc.add_node(
        id="W",
        label="Jalur Utama: Bidan Klik\nwa.me Hubungi Ibu",
        x=6,
        y=44,
        w=21,
        h=10,
        shape="process",
    )
    fc.add_node(
        id="W2",
        label="Jalur Fail-Safe: Hubungi\nKontak Darurat Suami",
        x=30,
        y=44,
        w=21,
        h=10,
        shape="process",
    )
    fc.add_node(
        id="X",
        label="Bidan Melakukan Anamnesis &\nTindakan Medis / Kunjungan",
        x=11,
        y=26,
        w=35,
        h=9,
        shape="process",
    )
    fc.add_node(
        id="Y",
        label="Bidan Update Catatan Rekam\nMedis Pasien di Dashboard PWA",
        x=11,
        y=11,
        w=35,
        h=9,
        shape="process",
    )

    fc.add_edge("U", "V", "bottom", "top")
    fc.add_edge("V", "W", "bottom", "top", waypoints=[(28.5, 58), (16.5, 58)])
    fc.add_edge(
        "V",
        "W2",
        "bottom",
        "top",
        waypoints=[(28.5, 58), (40.5, 58)],
        label="Tidak Respon",
        style="dashed",
    )
    fc.add_edge("W", "X", "bottom", "top", waypoints=[(16.5, 39), (28.5, 39)])
    fc.add_edge("W2", "X", "bottom", "top", waypoints=[(40.5, 39), (28.5, 39)])
    fc.add_edge("X", "Y", "bottom", "top")

    # 2. Container Siklus Hidup 42 Hari
    fc.add_container(
        id="c_siklus",
        label="SIKLUS HIDUP PEMANTAUAN (42 HARI NIFAS)",
        x=57,
        y=4,
        w=40,
        h=92,
        bg_color="#F0FDFA",
        border_color="#2DD4BF",
        title_color="#0F766E",
    )

    fc.add_node(
        id="Z",
        label="Apakah Masa Pascasalin\n>= 42 Hari / Selesai KF4?",
        x=64,
        y=59,
        w=26,
        h=14,
        shape="decision",
    )
    fc.add_node(
        id="AC",
        label="Status Tetap Aktif:\nMenunggu Jadwal KF\nBerikutnya",
        x=59,
        y=34,
        w=17,
        h=13,
        shape="terminator",
    )
    fc.add_node(
        id="AA",
        label="Tandai Pasien:\nLULUS / SELESAI\nPEMANTAUAN NIFAS",
        x=78,
        y=34,
        w=17,
        h=13,
        shape="process",
    )
    fc.add_node(
        id="AB",
        label="Selesai: Pemantauan\nNifas Lengkap",
        x=78,
        y=14,
        w=17,
        h=10,
        shape="terminator",
    )

    fc.add_edge(
        "Z",
        "AC",
        "left",
        "top",
        label="Belum (Masih Nifas)",
        waypoints=[(67.5, 54)],
    )
    fc.add_edge(
        "Z",
        "AA",
        "right",
        "top",
        label="Ya (Hari 42)",
        waypoints=[(86.5, 54)],
    )
    fc.add_edge("AA", "AB", "bottom", "top")

    # Bridge Y -> Z
    fc.add_edge(
        "Y",
        "Z",
        "right",
        "left",
        waypoints=[(54, 15.5), (54, 66)],
        label="Evaluasi Siklus",
        label_pos=(54, 40),
    )

    return fc


def build_flowchart_master() -> Flowchart:
    """Diagram Master Lengkap: 5 Fase Pemantauan Nifas Surabaya End-to-End."""
    fc = Flowchart(figsize=(24, 7.5), dpi=300)

    # 1. Faskes
    fc.add_container("c1", "1. FASKES & DISCHARGE", 2, 4, 17, 92, "#F0FDF4", "#4ADE80", title_color="#166534")
    fc.add_node("A", "Mulai: Melahirkan di RS / Puskesmas", 3.5, 77, 14, 9, "terminator")
    fc.add_node("B", "Persiapan Pulang (Discharge)", 3.5, 57, 14, 9, "process")
    fc.add_node("C", "Input No WA Ibu & No Darurat", 3.5, 37, 14, 10, "io")
    fc.add_node("D", "Simpan Profil & Linimasa KF", 3.5, 17, 14, 10, "process")
    fc.add_edge("A", "B", "bottom", "top")
    fc.add_edge("B", "C", "bottom", "top")
    fc.add_edge("C", "D", "bottom", "top")

    # 2. Backend
    fc.add_container("c2", "2. BACKEND & SCHEDULER", 21, 4, 17, 92, "#F0FDFA", "#2DD4BF", title_color="#0F766E")
    fc.add_node("E", "Scheduler Jam 08.00 WIB", 22.5, 77, 14, 9, "process")
    fc.add_node("F", "Ada Jadwal KF?", 23, 53, 13, 13, "decision")
    fc.add_node("G", "Ambil Data Pasien", 27.5, 33, 9.5, 9, "process")
    fc.add_node("H", "Siapkan Pesan Skrining", 27.5, 15, 9.5, 9, "process")
    fc.add_node("I", "Standby Besok", 22, 33, 4.5, 9, "terminator")
    fc.add_edge("E", "F", "bottom", "top")
    fc.add_edge("F", "G", "right", "top", label="Ya", waypoints=[(32.25, 59.5)])
    fc.add_edge("G", "H", "bottom", "top")
    fc.add_edge("F", "I", "left", "top", label="Tidak", waypoints=[(24.25, 59.5)])
    fc.add_edge("D", "E", "right", "left", waypoints=[(19.5, 22), (19.5, 81.5)])

    # 3. WhatsApp
    fc.add_container("c3", "3. LAYANAN WHATSAPP", 40, 4, 17, 92, "#F0FDFA", "#2DD4BF", title_color="#0F766E")
    fc.add_node("H2", "Template Skrining Siap", 41.5, 77, 14, 9, "process")
    fc.add_node("J", "Kirim Pengingat ke WA Ibu", 41.5, 57, 14, 10, "io")
    fc.add_node("K", "Ibu Memilih Angka/Tombol", 41.5, 37, 14, 10, "io")
    fc.add_node("L", "Terima Respon Ibu", 41.5, 17, 14, 10, "io")
    fc.add_edge("H2", "J", "bottom", "top")
    fc.add_edge("J", "K", "bottom", "top")
    fc.add_edge("K", "L", "bottom", "top")
    fc.add_edge("H", "H2", "right", "left", waypoints=[(38.5, 19.5), (38.5, 81.5)])

    # 4. Triase
    fc.add_container("c4", "4. TRIASE KLINIS", 59, 4, 19, 92, "#F0FDF4", "#4ADE80", title_color="#166534")
    fc.add_node("M", "Ekstraksi Jawaban Ibu", 60.5, 77, 16, 9, "process")
    fc.add_node("N", "Triase Gejala?", 62.5, 53, 12, 13, "decision")
    fc.add_node("O", "HIJAU: Normal", 59.5, 33, 5.5, 9, "process", bg_color="#DCFCE7", border_color="#16A34A")
    fc.add_node("P", "Edukasi ASI", 59.5, 15, 5.5, 9, "io")
    fc.add_node("R", "KUNING: Waspada", 65.5, 33, 6, 9, "process", bg_color="#FEF9C3", border_color="#CA8A04")
    fc.add_node("U1", "Alert PWA", 65.5, 15, 6, 9, "io")
    fc.add_node("S", "MERAH: Bahaya", 72, 33, 5.5, 9, "process", bg_color="#FEE2E2", border_color="#DC2626")
    fc.add_node("U2", "Pesan Darurat", 72, 15, 5.5, 9, "io")
    fc.add_edge("M", "N", "bottom", "top")
    fc.add_edge("N", "O", "left", "top", label="Aman", waypoints=[(62.25, 59.5)])
    fc.add_edge("O", "P", "bottom", "top")
    fc.add_edge("N", "R", "bottom", "top", label="Waspada")
    fc.add_edge("R", "U1", "bottom", "top")
    fc.add_edge("N", "S", "right", "top", label="Bahaya", waypoints=[(74.75, 59.5)])
    fc.add_edge("S", "U2", "bottom", "top")
    fc.add_edge("L", "M", "right", "left", waypoints=[(57.5, 22), (57.5, 81.5)])

    # 5. Intervensi & Siklus
    fc.add_container("c5", "5. NAKES & SIKLUS 42 HARI", 80, 4, 18, 92, "#F0FDF4", "#4ADE80", title_color="#166534")
    fc.add_node("U_in", "Alert Masuk Dashboard PWA", 81.5, 77, 15, 9, "process")
    fc.add_node("V_in", "Bidan Tinjau & Klik wa.me", 81.5, 59, 15, 9, "process")
    fc.add_node("X_in", "Anamnesis & Tindakan", 81.5, 43, 15, 9, "process")
    fc.add_node("Y_in", "Update Rekam Medis", 81.5, 27, 15, 9, "process")
    fc.add_node("Z_in", "Selesai 42 Hari?", 82.5, 10, 13, 11, "decision")
    fc.add_edge("U_in", "V_in", "bottom", "top")
    fc.add_edge("V_in", "X_in", "bottom", "top")
    fc.add_edge("X_in", "Y_in", "bottom", "top")
    fc.add_edge("Y_in", "Z_in", "bottom", "top")
    fc.add_edge("U1", "U_in", "right", "left", waypoints=[(79, 19.5), (79, 81.5)])
    fc.add_edge("U2", "U_in", "right", "left", waypoints=[(79, 19.5), (79, 81.5)])

    return fc
