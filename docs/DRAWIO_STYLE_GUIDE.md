# Panduan Baku Desain Flowchart (Flowchart & Architecture Style Guide)

Dokumen ini mendokumentasikan aturan baku (*style guide*) pembuatan dan penataan diagram alir (*flowchart*) sistem monitoring kesehatan ibu nifas.
Seluruh diagram alir telah dimigrasikan secara penuh ke mesin **Python Matplotlib murni** (`tools/report_docs/chart_engine.py` & `flowchart_definitions.py`) untuk menghasilkan aset visual resolusi tinggi (300 DPI) secara deterministik tanpa ketergantungan Node.js atau Mermaid CLI.

## 1. Tata Letak Fase Horizontal (Horizontal Column Swimlanes)

Untuk memastikan diagram padat (*compact*) dan proporsional saat dimasukkan ke dalam laporan:
- **Arah Alur Global**: Horizontal dari kiri ke kanan (sumbu X berurutan: Fase 1 $\rightarrow$ Fase 2 $\rightarrow$ Fase 3 $\rightarrow$ Fase 4 $\rightarrow$ Fase 5).
- **Koordinat Wadah (*Container*)**:
  - Seluruh wadah fase diletakkan sejajar pada koordinat vertikal yang sama (misal: `Y = 534`).
  - Wadah fase berbentuk kolom persegi panjang vertikal yang berdampingan secara horizontal.
- **Arah Alur Internal**: Di dalam masing-masing wadah fase, langkah-langkah proses mengalir secara vertikal dari atas ke bawah (Top-to-Bottom).

---

## 2. Aturan Titik Sambung Elemen Keputusan (Decision Diamond Ports)

Garis pada bentuk belah ketupat keputusan (*decision diamond*) wajib mematuhi aturan titik sudut (*vertex ports*) presisi:

```
                      ▲ Titik Masuk: (entryX=0.5, entryY=0)
                      │
                   ┌──┴──┐
   Titik Keluar ◄──┤  ◇  ├──► Titik Keluar Kanan: (exitX=1, exitY=0.5)
   Kiri:           └──┬──┘
(exitX=0, exitY=0.5)  │
                      ▼ Titik Keluar Bawah: (exitX=0.5, exitY=1)
```

1. **Titik Masuk (*Entry Point*)**:
   - Panah dari proses sebelumnya selalu masuk tepat di **puncak atas belah ketupat**:  
     `entryX=0.5, entryY=0`.
2. **Titik Keluar (*Exit Points*)**:
   - Garis keluar **HARUS** memancar langsung dari ujung lancip belah ketupat, tidak boleh dari sisi miring:
     - **Ujung Lancip Kiri (`exitX=0, exitY=0.5`)**: Untuk cabang alternatif, kondisi negatif (*Tidak*), atau status aman (*Hijau*).
     - **Ujung Lancip Bawah (`exitX=0.5, exitY=1`)**: Untuk cabang alur utama (*Ya*), atau status perhatian sedang (*Kuning*).
     - **Ujung Lancip Kanan (`exitX=1, exitY=0.5`)**: Untuk cabang eskalasi kritis, darurat, atau status bahaya (*Merah*).
3. **Titik Masuk ke Kotak Tujuan**:
   - Seluruh cabang keputusan masuk ke kotak proses berikutnya tepat di **tengah sisi atas**:  
     `entryX=0.5, entryY=0`.

---

## 3. Aturan Transisi Antar-Fase (Inter-Phase Bridge Routing)

Penyambungan alur dari fase satu ke fase berikutnya menerapkan prinsip jembatan horizontal:

```
[ WADAH FASE A ]                                [ WADAH FASE B ]
┌─────────────────────────┐                     ┌─────────────────────────┐
│                         │                     │ ┌─────────────────────┐ │
│ ┌─────────────────────┐ │                     │ │ Node Pertama Fase B │ │
│ │ Node Terakhir Fase A├──┼─────────────────────┼─►│                     │ │
│ └─────────────────────┘ │ (exitX=1, exitY=0.5) │ └─────────────────────┘ │
│                         │ (entryX=0, entryY=0.5)                        │
└─────────────────────────┘                     └─────────────────────────┘
```

1. **Transisi Satu Jalur (Linear Transition)**:
   - Panah keluar dari **titik tengah sisi kanan** kotak terakhir di Fase A:  
     `exitX=1, exitY=0.5`.
   - Garis bergerak lurus horizontal menyeberang ke wadah Fase B, lalu masuk tepat di **titik tengah sisi kiri** kotak pertama di Fase B:  
     `entryX=0, entryY=0.5`.
2. **Transisi Multi-Cabang (Branching Transition - misal Triase ke Intervensi)**:
   - Jika terdapat beberapa node cabang yang harus menyeberang (seperti status *Kuning* dan *Merah* menuju dashboard bidan):
     - Garis keluar dari bagian bawah node masing-masing (`exitX=0.5, exitY=1`), turun lurus, lalu berbelok siku-siku 90° ke kanan menyeberang wadah.
     - Memasuki sisi kiri tengah kotak penerima alert di fase berikutnya (`entryX=0, entryY=0.5`).
3. **Pencegahan Garis Rancu (*Line Jumps*)**:
   - Jika ada garis yang saling bersilangan, wajib menerapkan gaya jembatan lengkung:  
     `jumpStyle=arc; jumpSize=12;`.

---

## 4. Spesifikasi Visual & Tipografi

Mengacu pada berkas acuan `Flowchart_1.drawio`:
- **Wadah Fase (*Container/Swimlane*)**:
  - Warna latar (*fill*): Hijau pastel lembut (`fillColor=#F0FDF4`).
  - Garis batas (*stroke*): Hijau solid (`strokeColor=#4ADE80`, `strokeWidth=1`).
  - Judul wadah: Rata atas (*verticalAlign=top*), font `Recursive`, ukuran 14px tebal.
- **Bentuk Kotak Proses (*Process Nodes*)**:
  - Warna latar (*fill*): Putih murni (`fillColor=#FFFFFF`).
  - Garis tepi (*stroke*): Gelap tegas tebal 2px (`strokeColor=#28253D`, `strokeWidth=2`).
  - Efek bayangan (*Shadow*): Drop shadow tegas (`shadow=1; shadowOffsetX=4; shadowOffsetY=4; shadowBlur=0; shadowOpacity=6;`).
  - Tipografi isi: Font `Recursive` / `Arial`, ukuran 14px, teks gelap `#28253D`.
- **Garis Penghubung (*Connectors*)**:
  - Tipe garis: `orthogonalEdgeStyle` (siku-siku kaku 90 derajat, `curved=0`, `rounded=1`).
  - Ketebalan: `strokeWidth=2`, warna hitam `#000000`.
  - Kepala panah (*Arrowhead*): `endArrow=block; endSize=8;`.

---

## 5. Implementasi Mesin Python Matplotlib (`chart_engine.py`)

Untuk menghilangkan ketergantungan rapuh pada manipulasi file XML dan CLI eksternal, seluruh aturan di atas telah dienkapsulasi ke dalam kode Python native:

1. **Arsitektur Objek**:
   - `Flowchart(figsize=(w, h), dpi=300)`: Mengelola canvas dan resolusi publikasi.
   - `add_container()`: Menghasilkan wadah swimlane berbasis `matplotlib.patches.FancyBboxPatch` dengan palet hijau (`#F0FDF4` / `#4ADE80`) dan toska (`#F0FDFA` / `#2DD4BF`).
   - `add_node()`: Menghasilkan 4 tipe bentuk baku (terminator, process, decision rhombus 4-point polygon, dan parallelogram I/O).
   - `add_edge()`: Perutean ortogonal (`matplotlib.path.Path`) dengan penanda panah presisi `FancyArrowPatch(arrowstyle="-|>")`.
2. **Perintah Eksekusi Render**:
   ```bash
   uv run python tools/report_docs/render_charts.py
   ```
3. **Penyusunan ke Dokumen Laporan DOCX**:
   ```bash
   uv run python tools/report_docs/main.py
   ```
