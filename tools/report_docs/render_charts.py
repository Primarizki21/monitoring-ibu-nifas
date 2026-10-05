import os
import subprocess
import tempfile
from pathlib import Path

CHARTS = {
    "flowchart_1_onboarding": """%%{init: {"flowchart": {"curve": "ortho", "htmlLabels": true}} }%%
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
        I[Tunggu Jadwal Hari Berikutnya]
    end

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F -- "Tidak" --> I
    I --> E
    F -- "Ya" --> G
    G --> H
""",
    "flowchart_2_triage": """%%{init: {"flowchart": {"curve": "ortho", "htmlLabels": true}} }%%
flowchart TD
    subgraph WA ["LAYANAN WHATSAPP (BOT & IBU NIFAS)"]
        H[Template Pesan Skrining Siap]
        J[/Kirim Pesan Pengingat & Opsi Skrining ke WA Ibu/]
        K[/Ibu Nifas Membaca & Memilih Tombol / Angka/]
        L[/Terima Respon Jawaban Skrining Ibu/]
    end

    subgraph TRIASE ["EVALUASI TRIASE & LOGIKA MEDIS"]
        M[Ekstraksi Jawaban Skrining Ibu]
        N{"Apakah Ditemukan Tanda Bahaya / Keluhan?"}
        O[Tetapkan Status HIJAU: Normal / Aman]
        P[Kirim Pesan Edukasi Perawatan Nifas & ASI]
        Q{"Tingkat Keparahan Keluhan?"}
        R[Tetapkan Status KUNING: Perlu Evaluasi]
        S[Tetapkan Status MERAH: Bahaya Akut]
        T[/Kirim Pesan Darurat & Kontak Bidan PJ ke WA Ibu/]
        U[/Kirim Alert Prioritas ke Dashboard PWA Bidan/]
    end

    H --> J
    J --> K
    K --> L
    L --> M
    M --> N
    N -- "Tidak Ada Keluhan" --> O
    O --> P
    N -- "Ada Keluhan" --> Q
    Q -- "Keluhan Ringan/Sedang" --> R
    Q -- "Gejala Bahaya / Red Flag" --> S
    R --> T
    S --> T
    T --> U
""",
    "flowchart_3_intervention": """%%{init: {"flowchart": {"curve": "ortho", "htmlLabels": true}} }%%
flowchart TD
    subgraph INTERVENSI ["TINDAKAN KLINIS NAKES"]
        U[Alert Triase Masuk Dashboard PWA]
        V[Bidan Meninjau Gejala & Lokasi Pasien]
        W[Bidan Klik Tombol wa.me Hubungi Ibu]
        W2[Opsi Fail-Safe: Hubungi Kontak Darurat Suami jika Ibu Tidak Respon]
        X[Bidan Melakukan Anamnesis & Tindakan Medis]
        Y[Bidan Update Catatan Rekam Medis di PWA]
    end

    subgraph SIKLUS ["SIKLUS HIDUP PEMANTAUAN 42 HARI"]
        Z{"Apakah Hari Pascasalin >= 42 Hari / KF4 Selesai?"}
        AA[Tandai Pasien: LULUS / SELESAI NIFAS]
        AB([Selesai: Pemantauan Nifas Lengkap])
        AC[Tetap Aktif untuk Jadwal KF Berikutnya]
    end

    U --> V
    V --> W
    V -. "Ibu Tidak Respon" .-> W2
    W --> X
    W2 --> X
    X --> Y
    Y --> Z
    Z -- "Belum (Masih Masa Nifas)" --> AC
    Z -- "Ya (Selesai 42 Hari)" --> AA
    AA --> AB
"""
}

def render_all_charts(output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)
    results = {}
    with tempfile.TemporaryDirectory() as tmpdir:
        for name, code in CHARTS.items():
            mmd_path = Path(tmpdir) / f"{name}.mmd"
            png_path = output_dir / f"{name}.png"
            mmd_path.write_text(code, encoding="utf-8")
            
            cmd = [
                "npx", "@mermaid-js/mermaid-cli",
                "-i", str(mmd_path),
                "-o", str(png_path),
                "-b", "white",
                "-s", "2"
            ]
            print(f"Rendering {name} -> {png_path}...")
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
