-- Data master wilayah percontohan (PRD 2.2).
-- Pemetaan kelurahan -> Puskesmas pembina masih PERKIRAAN; wajib diverifikasi Dinkes Surabaya.

insert into m_puskesmas (nama_puskesmas, kecamatan) values
    ('Puskesmas Gundih', 'Bubutan'),
    ('Puskesmas Tembok Dukuh', 'Bubutan'),
    ('Puskesmas Dupak', 'Bubutan'),
    ('Puskesmas Mojo', 'Gubeng'),
    ('Puskesmas Pucang Sewu', 'Gubeng'),
    ('Puskesmas Tanah Kali Kedinding', 'Kenjeran'),
    ('Puskesmas Tambak Wedi', 'Kenjeran'),
    ('Puskesmas Bulak Banteng', 'Kenjeran'),
    ('Puskesmas Mulyorejo', 'Mulyorejo'),
    ('Puskesmas Simolawang', 'Simokerto'),
    ('Puskesmas Tambak Rejo', 'Simokerto'),
    ('Puskesmas Sidotopo Wetan', 'Simokerto'),
    ('Puskesmas Pacar Keling', 'Tambaksari'),
    ('Puskesmas Rangkah', 'Tambaksari'),
    ('Puskesmas Gading', 'Tambaksari');

insert into m_kelurahan (puskesmas_id, nama_kelurahan, kecamatan)
select p.id, k.nama_kelurahan, k.kecamatan
  from (values
    ('Puskesmas Gundih', 'Gundih', 'Bubutan'),
    ('Puskesmas Tembok Dukuh', 'Tembok Dukuh', 'Bubutan'),
    ('Puskesmas Tembok Dukuh', 'Bubutan', 'Bubutan'),
    ('Puskesmas Tembok Dukuh', 'Alun-Alun Contong', 'Bubutan'),
    ('Puskesmas Dupak', 'Jepara', 'Bubutan'),
    ('Puskesmas Mojo', 'Mojo', 'Gubeng'),
    ('Puskesmas Mojo', 'Airlangga', 'Gubeng'),
    ('Puskesmas Pucang Sewu', 'Pucang Sewu', 'Gubeng'),
    ('Puskesmas Pucang Sewu', 'Barata Jaya', 'Gubeng'),
    ('Puskesmas Pucang Sewu', 'Kertajaya', 'Gubeng'),
    ('Puskesmas Pucang Sewu', 'Gubeng', 'Gubeng'),
    ('Puskesmas Tanah Kali Kedinding', 'Tanah Kali Kedinding', 'Kenjeran'),
    ('Puskesmas Tambak Wedi', 'Tambak Wedi', 'Kenjeran'),
    ('Puskesmas Bulak Banteng', 'Bulak Banteng', 'Kenjeran'),
    ('Puskesmas Sidotopo Wetan', 'Sidotopo Wetan', 'Kenjeran'),
    ('Puskesmas Mulyorejo', 'Mulyorejo', 'Mulyorejo'),
    ('Puskesmas Mulyorejo', 'Manyar Sabrangan', 'Mulyorejo'),
    ('Puskesmas Mulyorejo', 'Kejawan Putih Tambak', 'Mulyorejo'),
    ('Puskesmas Mulyorejo', 'Kalisari', 'Mulyorejo'),
    ('Puskesmas Mulyorejo', 'Kalijudan', 'Mulyorejo'),
    ('Puskesmas Mulyorejo', 'Dukuh Sutorejo', 'Mulyorejo'),
    ('Puskesmas Simolawang', 'Simolawang', 'Simokerto'),
    ('Puskesmas Simolawang', 'Simokerto', 'Simokerto'),
    ('Puskesmas Tambak Rejo', 'Tambakrejo', 'Simokerto'),
    ('Puskesmas Tambak Rejo', 'Kapasan', 'Simokerto'),
    ('Puskesmas Tambak Rejo', 'Sidodadi', 'Simokerto'),
    ('Puskesmas Pacar Keling', 'Pacar Keling', 'Tambaksari'),
    ('Puskesmas Pacar Keling', 'Pacar Kembang', 'Tambaksari'),
    ('Puskesmas Pacar Keling', 'Tambaksari', 'Tambaksari'),
    ('Puskesmas Rangkah', 'Rangkah', 'Tambaksari'),
    ('Puskesmas Rangkah', 'Ploso', 'Tambaksari'),
    ('Puskesmas Gading', 'Gading', 'Tambaksari'),
    ('Puskesmas Gading', 'Kapas Madya Baru', 'Tambaksari'),
    ('Puskesmas Gading', 'Dukuh Setro', 'Tambaksari')
  ) as k(nama_puskesmas, nama_kelurahan, kecamatan)
  join m_puskesmas p on p.nama_puskesmas = k.nama_puskesmas;

insert into m_rumah_sakit (nama_rs, kecamatan) values
    ('RS Ibu dan Anak IBI Surabaya', 'Bubutan'),
    ('RS Griya Husada', 'Bubutan'),
    ('RSUD Dr. Soetomo', 'Gubeng'),
    ('RS DKT Gubeng', 'Gubeng'),
    ('RSU Siloam', 'Gubeng'),
    ('RS Husada Utama', 'Gubeng'),
    ('RSU Haji', 'Gubeng'),
    ('RS Mitra Keluarga Kenjeran', 'Kenjeran'),
    ('RSUD Soewandhie', 'Kenjeran'),
    ('RSIA Kendangsari', 'Kenjeran'),
    ('RS Universitas Airlangga', 'Mulyorejo'),
    ('RS Adi Husada Kapasari', 'Simokerto'),
    ('RSUP Kemenkes Surabaya', 'Simokerto'),
    ('RSIA Adi Guna', 'Tambaksari'),
    ('RS Adi Husada Undaan', 'Tambaksari');
