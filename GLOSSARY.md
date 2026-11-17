# Glosarium SIM-NIFAS Surabaya

Istilah domain resmi SIM-NIFAS Surabaya. Sumber kebenaran: PRD SIM-NIFAS Surabaya. Glosarium ini memuat makna istilah, bukan detail teknis.

## KRS / Pemulangan
Kepulangan ibu nifas dari rumah sakit yang dicatat saat discharge planning. Dari titik ini dihitung batas kunjungan rumah dan diterbitkan penugasan ke bidan wilayah.

## SLA 2×24 jam
Batas waktu kunjungan rumah ibu nifas, paling lambat 48 jam sejak pemulangan. Dipakai untuk pengingat dan eskalasi keterlambatan.

## T0
Waktu pemulangan pasien dicatat, yakni titik awal hitung mundur SLA 2×24 jam.

## Deadline SLA
Batas akhir kunjungan rumah, yaitu T0 ditambah 48 jam. Laporan yang masuk setelah batas ini dikategorikan terlambat.

## Token kunjungan
Tautan akses sekali pakai yang diberikan kepada Bidan Kelurahan untuk mengisi laporan kunjungan tanpa login. Berlaku maksimal 7 hari.

## Kunjungan rumah
Pemeriksaan fisik langsung di rumah ibu nifas oleh Bidan Kelurahan dalam batas SLA, meliputi suhu tubuh dan lima tanda bahaya nifas.

## Status kunjungan
- PENDING: belum ada laporan dan deadline belum terlewati.
- VISITED_ON_TIME: laporan masuk pada atau sebelum deadline SLA.
- VISITED_LATE: laporan masuk setelah deadline SLA.
- NOT_VISITED: deadline terlewati tanpa laporan kunjungan.

## Status kesehatan
- SEHAT: tidak ada tanda bahaya dan pemulihan berjalan wajar.
- KOMPLIKASI: hasil laporan kunjungan ketika bidan menyatakan ADA_MASALAH tanpa checklist tanda bahaya. Status ini tetap menandai kasus sebagai darurat dan memicu WA-EMERGENCY sesuai PRD §7.2.
- TANDA_BAHAYA: satu atau lebih tanda bahaya nifas terpenuhi, termasuk suhu di atas 38 °C. Status ini menandai kasus sebagai darurat dan memicu WA-EMERGENCY.
- DIRAWAT_KEMBALI: pasien dirawat lagi setelah pemulangan, ditetapkan manual oleh nakes yang berwenang.
- MENINGGAL: pasien meninggal setelah pemulangan, ditetapkan manual oleh nakes yang berwenang.

## Red Alert
Peringatan darurat yang muncul di dashboard pimpinan saat laporan kunjungan menandai kondisi darurat, disertai pesan WA-EMERGENCY kepada nakes.

## Triase deterministik
Penetapan status kesehatan hasil kunjungan dengan aturan tetap dari Buku KIA Kemenkes, tanpa model generatif. Setiap hasil dapat ditelusuri kembali ke aturan yang dipakai.

## Bidan RS
Tenaga kesehatan di rumah sakit yang menginput KRS saat pasien akan pulang.

## Bidan Kelurahan
Tenaga kesehatan di wilayah kelurahan yang melakukan kunjungan rumah dan mengisi laporan hasil pemeriksaan.

## Kepala Puskesmas
Pimpinan puskesmas yang menerima tembusan penugasan, eskalasi keterlambatan SLA, dan peringatan darurat untuk wilayahnya.

## Superadmin Dinkes
Pengguna di tingkat Dinas Kesehatan Kota Surabaya dengan akses dashboard seluruh kota serta pengelolaan master faskes dan akun.

## Readmission
Kasus pemulangan ulang pasien dengan NIK yang sama dalam rentang kurang dari 40 hari sejak KRS sebelumnya. Sistem meminta konfirmasi bahwa ini memang perawatan berulang.
