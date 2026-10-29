// Kontrak teks pesan otomatis (PRD 6.2). Diubah di sini saja agar konsisten dengan PRD.

const zonaWIB = { timeZone: "Asia/Jakarta" } as const;

export function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { ...zonaWIB, day: "numeric", month: "long", year: "numeric" });
}

export function formatWaktu(iso: string) {
  return (
    new Date(iso).toLocaleString("id-ID", {
      ...zonaWIB,
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB"
  );
}

export type DataPenugasan = {
  nama_puskesmas: string;
  nama_rs: string;
  nama_ibu: string;
  nik: string;
  alamat_lengkap: string;
  no_whatsapp: string;
  diagnosis_sebelum_pulang: string;
  diagnosis_perawatan: string;
  rekomendasi_perawatan: string;
  deadline_sla: string;
  jadwal_kunjungan_ulang: string;
  faskes_tujuan: string;
  url_kunjungan_token: string;
};

export function waAssign01(d: DataPenugasan) {
  return `[NOTIFIKASI MONITORING IBU NIFAS - KOTA SURABAYA]

Yth. Bidan Kelurahan & Kepala Puskesmas ${d.nama_puskesmas},

Terdapat pasien ibu nifas baru yang dipulangkan dari ${d.nama_rs} dan memerlukan kunjungan rumah:

- Nama Ibu: ${d.nama_ibu}
- NIK: ${d.nik}
- Alamat Lengkap: ${d.alamat_lengkap}
- No. WhatsApp: ${d.no_whatsapp}
- Diagnosis Sebelum Pulang: ${d.diagnosis_sebelum_pulang}
- Diagnosis Perawatan: ${d.diagnosis_perawatan}
- Rekomendasi di Rumah: ${d.rekomendasi_perawatan}

BATAS WAKTU KUNJUNGAN: Maksimal 2x24 Jam (Sebelum ${formatWaktu(d.deadline_sla)})
Jadwal Kunjungan Ulang: ${formatTanggal(d.jadwal_kunjungan_ulang)} di ${d.faskes_tujuan}

Segera lakukan kunjungan rumah dan laporkan hasilnya melalui tautan resmi berikut:
${d.url_kunjungan_token}`;
}

export type DataEdukasi = {
  nama_ibu: string;
  faskes_tujuan: string;
  jadwal_kunjungan_ulang: string;
  nama_bidan: string;
  no_whatsapp_bidan: string;
};

export function waEduPasien(d: DataEdukasi) {
  return `Halo Ibu ${d.nama_ibu},

Salam hangat dari Tim Layanan Kesehatan Ibu dan Anak Kota Surabaya. Kami siap mendampingi masa pemulihan Ibu pasca-melahirkan.

Jangan lupa untuk melakukan Kunjungan Ulang (Kontrol Nifas) ke ${d.faskes_tujuan} pada:
Tanggal: ${formatTanggal(d.jadwal_kunjungan_ulang)}

Segera hubungi bidan atau faskes terdekat jika Ibu merasakan salah satu TANDA BAHAYA NIFAS berikut:
1. Demam > 38°C
2. Perdarahan banyak dari jalan lahir
3. Nyeri hebat pada bagian perut
4. Bau tidak sedap atau cairan nanah pada luka jahitan
5. Pusing berat, muntah terus-menerus, atau lemas ekstrem

Kontak Bidan Kelurahan Pendamping Anda:
Bidan ${d.nama_bidan}: ${d.no_whatsapp_bidan}

Bersama Kita Pastikan Ibu dan Bayi Sehat, Aman, dan Sejahtera.`;
}

// Teks berikut tidak dirinci di PRD 6.2; disusun mengikuti gaya template di atas.

export type DataSla = {
  nama_ibu: string;
  alamat_lengkap: string;
  nama_rs: string;
  deadline_sla: string;
  url_kunjungan_token: string;
};

export function waRemind24h(d: DataSla) {
  return `[PENGINGAT KUNJUNGAN NIFAS - SISA WAKTU 24 JAM]

Kunjungan rumah untuk pasien berikut belum dilaporkan:
- Nama Ibu: ${d.nama_ibu}
- Alamat Lengkap: ${d.alamat_lengkap}
- Dipulangkan dari: ${d.nama_rs}

Batas waktu kunjungan: ${formatWaktu(d.deadline_sla)}

Laporkan hasil kunjungan melalui tautan berikut:
${d.url_kunjungan_token}`;
}

export function waAlert48h(d: DataSla & { nama_bidan: string }) {
  return `[ESKALASI KETERLAMBATAN KUNJUNGAN NIFAS]

Batas waktu kunjungan 2x24 jam telah TERLEWATI tanpa laporan:
- Nama Ibu: ${d.nama_ibu}
- Alamat Lengkap: ${d.alamat_lengkap}
- Dipulangkan dari: ${d.nama_rs}
- Bidan Kelurahan: ${d.nama_bidan}
- Batas waktu: ${formatWaktu(d.deadline_sla)}

Mohon Kepala Puskesmas segera memastikan kunjungan rumah dilakukan.
Tautan laporan kunjungan:
${d.url_kunjungan_token}`;
}

export function waNomorPasienGagal(nama_ibu: string) {
  return `Nomor WA Pasien ${nama_ibu} tidak valid. Mohon lakukan pengecekan langsung saat kunjungan rumah.`;
}

export function waEmergency(d: {
  nama_ibu: string;
  alamat_lengkap: string;
  no_whatsapp: string;
  deskripsi_gejala_bahaya: string;
  timestamp_laporan: string;
}) {
  return `[PERINGATAN BAHAYA NIFAS - SEGERA TINDAK LANJUT]

Ditemukan indikasi tanda bahaya pada pasien nifas binaan Anda:
- Nama Ibu: ${d.nama_ibu}
- Alamat Lengkap: ${d.alamat_lengkap}
- No. WhatsApp: ${d.no_whatsapp}
- Jenis Masalah: ${d.deskripsi_gejala_bahaya}
- Waktu Laporan: ${formatWaktu(d.timestamp_laporan)}

Instruksi: Bidan Kelurahan bersama Tim Puskesmas dimohon segera melakukan pemeriksaan fisik langsung atau memfasilitasi rujukan cepat ke IGD Faskes/RS terdekat!`;
}
