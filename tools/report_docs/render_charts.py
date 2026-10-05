import json
import os
import subprocess
import tempfile
from pathlib import Path

DRAWIO_CONFIG = {
    "theme": "base",
    "themeVariables": {
        "fontFamily": "Times New Roman, Times, serif",
        "fontSize": "12px",
        "primaryColor": "#ffffff",
        "primaryBorderColor": "#000000",
        "primaryTextColor": "#000000",
        "lineColor": "#000000",
        "textColor": "#000000",
        "edgeLabelBackground": "#ffffff",
        "clusterBkg": "#ffffff",
        "clusterBorder": "#000000"
    },
    "flowchart": {
        "curve": "stepAfter",
        "nodeSpacing": 45,
        "rankSpacing": 45,
        "htmlLabels": True
    }
}

DRAWIO_CSS = """
.node rect, .node polygon, .node path {
    fill: #ffffff !important;
    stroke: #000000 !important;
    stroke-width: 1.5px !important;
    rx: 0px !important;
    ry: 0px !important;
}
.node .label, .node text {
    font-family: 'Times New Roman', Times, serif !important;
    font-size: 12px !important;
    fill: #000000 !important;
    color: #000000 !important;
}
.cluster rect {
    fill: #ffffff !important;
    stroke: #000000 !important;
    stroke-width: 1.5px !important;
    stroke-dasharray: 5 3 !important;
    rx: 0px !important;
    ry: 0px !important;
}
.cluster text, .cluster .label {
    font-family: 'Times New Roman', Times, serif !important;
    font-size: 13px !important;
    font-weight: bold !important;
    fill: #000000 !important;
}
.edgePath path {
    stroke: #000000 !important;
    stroke-width: 1.5px !important;
}
.marker, marker path {
    fill: #000000 !important;
    stroke: #000000 !important;
}
"""

CHARTS = {
    "flowchart_1_onboarding": """%%{init: {"flowchart": {"curve": "stepAfter", "htmlLabels": true}} }%%
flowchart TD
    subgraph FASKES ["FASKES & REGISTRASI (DISCHARGE PLANNING)"]
        A([Mulai: Pasien Melahirkan di RS / Puskesmas])
        B[Persiapan Pulang / Discharge Planning]
        C[/Bidan & Pendamping Input Data: No WA Ibu & No Darurat Suami/]
        D[Simpan Profil Pasien & Hitung Linimasa KF1-KF4]
    end

    subgraph ENGINE ["SISTEM BACKEND & SCHEDULER (FASTAPI)"]
        E[Scheduler Harian Berjalan Jam 08.00 WIB]
        F{"Apakah Ada Jadwal KF Hari Ini?"}
        G[Ambil Data Pasien Jatuh Tempo]
        H[Siapkan Template Pesan Skrining KF]
        I([Standby: Menunggu Jadwal Hari Berikutnya])
    end

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F -- "Ya" --> G
    G --> H
    F -- "Tidak" --> I
""",
    "flowchart_2_triage": """%%{init: {"flowchart": {"curve": "stepAfter", "htmlLabels": true}} }%%
flowchart TD
    subgraph WA ["LAYANAN WHATSAPP (BOT & IBU NIFAS)"]
        H[Template Pesan Skrining Siap]
        J[/Kirim Pesan Pengingat & Opsi Skrining ke WA Ibu/]
        K[/Ibu Nifas Membaca & Memilih Tombol / Angka/]
        L[/Terima Respon Jawaban Skrining Ibu/]
    end

    subgraph TRIASE ["EVALUASI TRIASE & LOGIKA MEDIS"]
        M[Ekstraksi Jawaban Skrining Ibu]
        N{"Hasil Skrining Gejala Sesuai Buku KIA?"}
        O[Status HIJAU: Normal / Aman]
        P[/Kirim Pesan Edukasi Perawatan Nifas & ASI/]
        R[Status KUNING: Keluhan Sedang]
        U1[/Kirim Kontak Bidan PJ & Alert Pantauan ke PWA/]
        S[Status MERAH: Bahaya Akut]
        U2[/Kirim Pesan Darurat & Alert Prioritas Merah/]
    end

    H --> J
    J --> K
    K --> L
    L --> M
    M --> N

    N -- "Normal" --> O
    O --> P

    N -- "Waspada" --> R
    R --> U1

    N -- "Bahaya" --> S
    S --> U2
""",
    "flowchart_3_intervention": """%%{init: {"flowchart": {"curve": "stepAfter", "htmlLabels": true}} }%%
flowchart TD
    subgraph INTERVENSI ["TINDAKAN KLINIS NAKES"]
        U[Alert Triase Masuk Dashboard PWA]
        V[Bidan Meninjau Gejala & Lokasi Pasien]
        W[Jalur Utama: Bidan Klik wa.me Hubungi Ibu]
        W2[Jalur Fail-Safe: Hubungi Suami jika Ibu Tidak Respon]
        X[Bidan Melakukan Anamnesis & Tindakan Medis]
        Y[Bidan Update Catatan Rekam Medis di PWA]
    end

    subgraph SIKLUS ["SIKLUS HIDUP PEMANTAUAN 42 HARI"]
        Z{"Apakah Hari Pascasalin >= 42 Hari / KF4 Selesai?"}
        AC([Status Aktif: Menunggu Jadwal KF Berikutnya])
        AA[Tandai Pasien: LULUS / SELESAI NIFAS]
        AB([Selesai: Pemantauan Nifas Lengkap])
    end

    U --> V
    V --> W
    V -. "Darurat / Tidak Respon" .-> W2
    W --> X
    W2 --> X
    X --> Y
    Y --> Z

    Z -- "Belum (Masih Nifas)" --> AC
    Z -- "Ya (Hari 42 Selesai)" --> AA
    AA --> AB
"""
}

def render_all_charts(output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)
    results = {}
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        cfg_file = tmp_path / "mermaid_config.json"
        css_file = tmp_path / "mermaid_style.css"

        cfg_file.write_text(json.dumps(DRAWIO_CONFIG), encoding="utf-8")
        css_file.write_text(DRAWIO_CSS, encoding="utf-8")

        for name, code in CHARTS.items():
            mmd_path = tmp_path / f"{name}.mmd"
            png_path = output_dir / f"{name}.png"
            mmd_path.write_text(code, encoding="utf-8")

            cmd = [
                "npx", "@mermaid-js/mermaid-cli",
                "-i", str(mmd_path),
                "-o", str(png_path),
                "-c", str(cfg_file),
                "-C", str(css_file),
                "-b", "white",
                "-s", "2"
            ]
            print(f"Rendering {name} in Draw.io style -> {png_path}...")
            res = subprocess.run(cmd, capture_output=True, text=True)
            if res.returncode != 0:
                raise RuntimeError(f"Failed to render {name}: {res.stderr}")

            size_kb = png_path.stat().st_size / 1024
            print(f"  Done: {png_path.name} ({size_kb:.1f} KB)")
            results[name] = png_path

    return results

if __name__ == "__main__":
    assets_dir = Path(__file__).resolve().parent.parent.parent / "docs" / "assets"
    render_all_charts(assets_dir)
