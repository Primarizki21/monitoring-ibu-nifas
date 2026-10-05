from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.table import WD_TABLE_ALIGNMENT

from tools.report_docs.styles import (
    apply_page_setup,
    add_callout,
    format_table_headers,
    set_cell_margins,
    set_cell_background,
    add_heading_2,
    add_heading_3,
)
from tools.report_docs import content

def build_project_charter_doc() -> Document:
    doc = Document()
    apply_page_setup(doc)

    # Document Title
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(2)
    r_title = p_title.add_run(content.METADATA["title"])
    r_title.bold = True
    r_title.font.size = Pt(20)
    r_title.font.color.rgb = RGBColor(15, 76, 129)

    # Subtitle
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(14)
    r_sub = p_sub.add_run(content.METADATA["subtitle"])
    r_sub.font.size = Pt(12)
    r_sub.font.color.rgb = RGBColor(71, 85, 105)

    # Project Metadata Callout
    add_callout(
        doc,
        "INFORMASI PROYEK PENGABDIAN MASYARAKAT",
        content.METADATA["project_info"],
        bg_color="F8FAFC",
        border_color="0F4C81",
        title_color=(15, 76, 129),
    )

    # Bab 1. Ringkasan Eksekutif
    add_heading_2(doc, "Bab 1. Ringkasan Eksekutif (Executive Summary)", page_break=True)
    for p_text in content.CHAPTER_1_TEXTS:
        doc.add_paragraph(p_text)

    # Bab 2. Prinsip Desain
    add_heading_2(doc, "Bab 2. Prinsip Desain & Keputusan Kritis Sistem", page_break=True)
    for sub_title, text in content.CHAPTER_2_ITEMS:
        add_heading_3(doc, sub_title)
        doc.add_paragraph(text)

    # Bab 3. Diagram & Alur Kerja Sistem
    add_heading_2(doc, "Bab 3. Diagram & Alur Kerja Sistem (Flowchart Operasional)", page_break=True)
    doc.add_paragraph("Alur operasional sistem menghubungkan lima tahapan kerja terintegrasi dari faskes ke rumah pasien:")

    add_callout(
        doc,
        "LIMA TAHAP ALUR OPERASIONAL SISTEM",
        content.FLOW_STAGES_SUMMARY,
        bg_color="EFF6FF",
        border_color="2563EB",
        title_color=(30, 64, 175),
    )

    tbl_flow = doc.add_table(rows=len(content.FLOW_TABLE_DATA), cols=5)
    tbl_flow.alignment = WD_TABLE_ALIGNMENT.CENTER
    flow_widths = [Inches(1.0), Inches(1.1), Inches(1.4), Inches(1.5), Inches(1.5)]
    for r_idx, row in enumerate(tbl_flow.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.text = content.FLOW_TABLE_DATA[r_idx][c_idx]
            cell.width = flow_widths[c_idx]
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            if r_idx % 2 == 1 and r_idx > 0:
                set_cell_background(cell, "F8FAFC")
    format_table_headers(tbl_flow, flow_widths, "0F4C81")

    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    doc.add_paragraph("Spesifikasi diagram alir ANSI/ISO lengkap dan kode Mermaid dapat diakses pada dokumen repositori: FLOWCHART.md.")

    # Bab 4. Multi-Tenant RBAC
    add_heading_2(doc, "Bab 4. Struktur Peran & Hak Akses (Multi-Tenant RBAC)", page_break=True)
    doc.add_paragraph("Sistem menerapkan isolasi data faskes yang ketat untuk menjamin kerahasiaan data medis pasien:")

    tbl_rbac = doc.add_table(rows=len(content.RBAC_TABLE_DATA), cols=4)
    tbl_rbac.alignment = WD_TABLE_ALIGNMENT.CENTER
    rbac_widths = [Inches(1.2), Inches(1.5), Inches(1.5), Inches(2.3)]
    for r_idx, row in enumerate(tbl_rbac.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.text = content.RBAC_TABLE_DATA[r_idx][c_idx]
            cell.width = rbac_widths[c_idx]
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
    format_table_headers(tbl_rbac, rbac_widths, "0F4C81")

    # Bab 5. Spesifikasi Teknis & Analogi
    add_heading_2(doc, "Bab 5. Spesifikasi Teknis & Infrastruktur (Penjelasan Lengkap)", page_break=True)
    doc.add_paragraph("Untuk memudahkan pemahaman seluruh tim pengmas dan reviewer non-teknis, berikut penjelasan teknis beserta analogi fungsinya:")

    for title, tech, analogy in content.TECH_ITEMS:
        add_heading_3(doc, title)
        doc.add_paragraph(tech)
        add_callout(doc, "Analogi untuk Dosen & Tim Non-Teknis:", analogy, bg_color="F0FDF4", border_color="16A34A")

    # Bab 6. Protokol Medis KF1-KF4
    add_heading_2(doc, "Bab 6. Protokol Medis & Matriks Skrining (KF1 s/d KF4)", page_break=True)
    doc.add_paragraph("Parameter skrining klinis merujuk pada standar Buku KIA Kementerian Kesehatan RI:")

    tbl_med = doc.add_table(rows=len(content.MEDICAL_TABLE_DATA), cols=4)
    tbl_med.alignment = WD_TABLE_ALIGNMENT.CENTER
    med_widths = [Inches(1.0), Inches(1.3), Inches(2.1), Inches(2.1)]
    for r_idx, row in enumerate(tbl_med.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.text = content.MEDICAL_TABLE_DATA[r_idx][c_idx]
            cell.width = med_widths[c_idx]
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
    format_table_headers(tbl_med, med_widths, "0F4C81")

    # Bab 7. RAB & Efisiensi Finansial
    add_heading_2(doc, "Bab 7. Rencana Anggaran Biaya & Efisiensi Finansial (Pilot 3 Bulan)", page_break=True)
    doc.add_paragraph("Rincian anggaran telah disinkronkan secara presisi dengan lembar kerja Google Spreadsheet:")

    tbl_rab = doc.add_table(rows=len(content.BUDGET_TABLE_DATA), cols=4)
    tbl_rab.alignment = WD_TABLE_ALIGNMENT.CENTER
    rab_widths = [Inches(2.2), Inches(2.2), Inches(1.1), Inches(1.0)]
    for r_idx, row in enumerate(tbl_rab.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.text = content.BUDGET_TABLE_DATA[r_idx][c_idx]
            cell.width = rab_widths[c_idx]
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            if r_idx == len(content.BUDGET_TABLE_DATA) - 1:
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
        content.EFFICIENCY_NOTES,
        bg_color="FEF9C3",
        border_color="CA8A04",
        title_color=(133, 77, 14),
    )

    # Bab 8. Roadmap 3 Bulan Live Deployment
    add_heading_2(doc, "Bab 8. Rencana Kerja Lapangan (Roadmap 3 Bulan Live Deployment)", page_break=True)
    doc.add_paragraph(
        "Jadwal di bawah ini menegaskan tiga bulan masa operasional langsung di lapangan (Live Deployment) di mana sistem telah aktif melayani pasien nifas:"
    )

    tbl_road = doc.add_table(rows=len(content.ROADMAP_TABLE_DATA), cols=3)
    tbl_road.alignment = WD_TABLE_ALIGNMENT.CENTER
    road_widths = [Inches(1.8), Inches(2.7), Inches(2.0)]
    for r_idx, row in enumerate(tbl_road.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.text = content.ROADMAP_TABLE_DATA[r_idx][c_idx]
            cell.width = road_widths[c_idx]
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
    format_table_headers(tbl_road, road_widths, "0F4C81")

    return doc
