from datetime import date, datetime, timedelta, timezone
import logging
import uuid
from sqlmodel import Session, select
from app.db.session import engine
from app.models.prd_models import (
    RolePengguna,
    StatusSLAKunjungan,
    StatusKesehatanIbu,
    TipeFaskesRujukan,
    MPuskesmas,
    MKelurahan,
    MRumahSakit,
    PRDUser,
    TrDischarge,
    TrHomeVisit,
    TrEmergencyAlert,
    LogNotifikasiWA,
)

logger = logging.getLogger(__name__)


def seed_prd_data():
    """Mengisi basis data dengan data inisial sesuai PRD SIM-NIFAS Surabaya."""
    with Session(engine) as session:
        # Cek jika data sudah ada
        existing_rs = session.exec(select(MRumahSakit)).first()
        if existing_rs:
            logger.info("Data master PRD sudah ada, melewati proses seed.")
            return

        logger.info("Memulai seeding master data wilayah dan faskes Surabaya...")

        # 1. Master Rumah Sakit Rujukan
        rs_list = [
            MRumahSakit(
                id=str(uuid.uuid4()),
                nama_rs="RSUD Dr. Soetomo",
                tipe_rs="A",
                alamat_rs="Jl. Mayjen Prof. Dr. Moestopo No. 6-8, Gubeng, Surabaya",
            ),
            MRumahSakit(
                id=str(uuid.uuid4()),
                nama_rs="RSUD Dr. Mohamad Soewandhie",
                tipe_rs="B",
                alamat_rs="Jl. Tambak Rejo No. 45-47, Simokerto, Surabaya",
            ),
            MRumahSakit(
                id=str(uuid.uuid4()),
                nama_rs="RS Universitas Airlangga (RSUA)",
                tipe_rs="B",
                alamat_rs="Kampus C Unair, Jl. Mulyorejo, Surabaya",
            ),
            MRumahSakit(
                id=str(uuid.uuid4()),
                nama_rs="RSUP Kemenkes Surabaya",
                tipe_rs="A",
                alamat_rs="Jl. Indrapura No. 17, Krembangan, Surabaya",
            ),
            MRumahSakit(
                id=str(uuid.uuid4()),
                nama_rs="RSIA IBI Surabaya",
                tipe_rs="C",
                alamat_rs="Jl. Dupak No. 15, Bubutan, Surabaya",
            ),
            MRumahSakit(
                id=str(uuid.uuid4()),
                nama_rs="RS Mitra Keluarga Kenjeran",
                tipe_rs="B",
                alamat_rs="Jl. Kenjeran No. 506, Kenjeran, Surabaya",
            ),
        ]
        session.add_all(rs_list)
        session.flush()

        # 2. Master Puskesmas & Kelurahan (6 Kecamatan Percontohan)
        wilayah_spec = [
            {
                "kecamatan": "Bubutan",
                "puskesmas": [
                    {"nama": "Puskesmas Gundih", "kelurahan": ["Gundih", "Alun-Alun Contong"]},
                    {"nama": "Puskesmas Tembok Dukuh", "kelurahan": ["Tembok Dukuh", "Bubutan"]},
                    {"nama": "Puskesmas Dupak", "kelurahan": ["Dupak", "Jepara"]},
                ],
            },
            {
                "kecamatan": "Gubeng",
                "puskesmas": [
                    {"nama": "Puskesmas Mojo", "kelurahan": ["Mojo", "Gubeng"]},
                    {"nama": "Puskesmas Pucang Sewu", "kelurahan": ["Pucang Sewu", "Kertajaya", "Baratajaya", "Airlangga"]},
                ],
            },
            {
                "kecamatan": "Kenjeran",
                "puskesmas": [
                    {"nama": "Puskesmas Tanah Kali Kedinding", "kelurahan": ["Tanah Kali Kedinding"]},
                    {"nama": "Puskesmas Tambak Wedi", "kelurahan": ["Tambak Wedi"]},
                    {"nama": "Puskesmas Bulak Banteng", "kelurahan": ["Bulak Banteng", "Sidotopo Wetan"]},
                ],
            },
            {
                "kecamatan": "Mulyorejo",
                "puskesmas": [
                    {"nama": "Puskesmas Mulyorejo", "kelurahan": ["Mulyorejo", "Kalisari", "Sutorejo", "Kejawan Putih Tambak", "Manyar Sabrangan"]},
                ],
            },
            {
                "kecamatan": "Simokerto",
                "puskesmas": [
                    {"nama": "Puskesmas Simolawang", "kelurahan": ["Simolawang", "Kapasan"]},
                    {"nama": "Puskesmas Tambak Rejo", "kelurahan": ["Tambakrejo", "Sidodadi"]},
                ],
            },
            {
                "kecamatan": "Tambaksari",
                "puskesmas": [
                    {"nama": "Puskesmas Pacar Keling", "kelurahan": ["Pacar Keling", "Pacar Kembang"]},
                    {"nama": "Puskesmas Rangkah", "kelurahan": ["Rangkah", "Ploso"]},
                    {"nama": "Puskesmas Gading", "kelurahan": ["Gading", "Dukuh Setro"]},
                ],
            },
        ]

        kelurahan_dict = {}  # nama_kelurahan -> MKelurahan object
        puskesmas_dict = {}  # nama_puskesmas -> MPuskesmas object

        for kec in wilayah_spec:
            kec_nama = kec["kecamatan"]
            for p_info in kec["puskesmas"]:
                p_obj = MPuskesmas(
                    id=str(uuid.uuid4()),
                    nama_puskesmas=p_info["nama"],
                    kecamatan=kec_nama,
                    no_telp_operasional="031-503" + str(len(puskesmas_dict)).zfill(4),
                )
                session.add(p_obj)
                session.flush()
                puskesmas_dict[p_info["nama"]] = p_obj

                for kel_nama in p_info["kelurahan"]:
                    k_obj = MKelurahan(
                        id=str(uuid.uuid4()),
                        puskesmas_id=p_obj.id,
                        nama_kelurahan=kel_nama,
                    )
                    session.add(k_obj)
                    session.flush()
                    kelurahan_dict[kel_nama] = k_obj

        # 3. Pengguna Sistem (Users)
        user_dinkes = PRDUser(
            id=str(uuid.uuid4()),
            nama_lengkap="Dr. Hendro Tri Laksono, M.Kes",
            nip="197508122002121003",
            email="dinkes@surabaya.go.id",
            password_hash="mock_hash_dinkes",
            no_whatsapp="62811340001",
            role=RolePengguna.SUPERADMIN_DINKES,
        )
        user_bidan_rs1 = PRDUser(
            id=str(uuid.uuid4()),
            nama_lengkap="Bidan Siti Rahmawati, S.Tr.Keb",
            nip="198904122014022001",
            email="bidan.soetomo@surabaya.go.id",
            password_hash="mock_hash_rs",
            no_whatsapp="6281234000001",
            role=RolePengguna.BIDAN_RS,
            faskes_id=rs_list[0].id,
        )
        user_bidan_rs2 = PRDUser(
            id=str(uuid.uuid4()),
            nama_lengkap="Bidan Nurul Anisa, S.Tr.Keb",
            nip="199105232015032002",
            email="bidan.soewandhie@surabaya.go.id",
            password_hash="mock_hash_rs2",
            no_whatsapp="6281234000002",
            role=RolePengguna.BIDAN_RS,
            faskes_id=rs_list[1].id,
        )

        p_gundih = puskesmas_dict["Puskesmas Gundih"]
        kel_gundih = kelurahan_dict["Gundih"]

        user_kapus = PRDUser(
            id=str(uuid.uuid4()),
            nama_lengkap="dr. Sri Wahyuningsih (Kapus Gundih)",
            nip="198002142006042009",
            email="kapus.gundih@surabaya.go.id",
            password_hash="mock_hash_kapus",
            no_whatsapp="6281234560001",
            role=RolePengguna.KEPALA_PUSKESMAS,
            faskes_id=p_gundih.id,
        )
        user_bidan_kel = PRDUser(
            id=str(uuid.uuid4()),
            nama_lengkap="Bidan Anisa Putri, A.Md.Keb (Bidan Gundih)",
            nip="199308192019032008",
            email="bidan.gundih@surabaya.go.id",
            password_hash="mock_hash_bidankel",
            no_whatsapp="6281234560002",
            role=RolePengguna.BIDAN_KELURAHAN,
            faskes_id=p_gundih.id,
            kelurahan_id=kel_gundih.id,
        )
        session.add_all([user_dinkes, user_bidan_rs1, user_bidan_rs2, user_kapus, user_bidan_kel])
        session.flush()

        # 4. Transaksi Discharge & Kunjungan Sampel
        now = datetime.now(timezone.utc)

        # Kasus 1: Visited On Time & Sehat (Ny. Siti Aisyah)
        t_krs_1 = now - timedelta(hours=30)
        t_deadline_1 = t_krs_1 + timedelta(hours=48)
        d1 = TrDischarge(
            id=str(uuid.uuid4()),
            token_kunjungan="token_siti_aisyah_01",
            nik="3578015501980001",
            nama_ibu="Ny. Siti Aisyah",
            alamat_lengkap="Jl. Margorukun Gang 2 No. 14, Kel. Gundih, Kec. Bubutan",
            kelurahan_id=kel_gundih.id,
            no_whatsapp_ibu="6281234567890",
            diagnosis_sebelum_pulang="Post partum normal hari ke-2",
            diagnosis_perawatan="Perawatan luka perineum derajat 2",
            rekomendasi_perawatan_rumah="Jaga kebersihan luka jahitan, konsumsi tablet tambah darah dan nutrisi tinggi protein",
            jadwal_kunjungan_ulang=(now + timedelta(days=5)).date(),
            faskes_kunjungan_ulang=TipeFaskesRujukan.PUSKESMAS,
            rs_asal_id=rs_list[0].id,
            bidan_rs_id=user_bidan_rs1.id,
            waktu_krs=t_krs_1,
            deadline_sla=t_deadline_1,
            status_kunjungan=StatusSLAKunjungan.VISITED_ON_TIME,
            status_kesehatan=StatusKesehatanIbu.SEHAT,
            is_emergency=False,
        )
        session.add(d1)
        session.flush()

        v1 = TrHomeVisit(
            id=str(uuid.uuid4()),
            discharge_id=d1.id,
            bidan_pelaksana_id=user_bidan_kel.id,
            waktu_kunjungan=t_krs_1 + timedelta(hours=22),
            durasi_jam_sejak_krs=22.0,
            suhu_tubuh=36.7,
            perdarahan_abnormal=False,
            nyeri_perut_hebat=False,
            luka_berbau_infeksi=False,
            pusing_muntah_lemas=False,
            status_hasil="BAIK",
            catatan_kebidanan="Kondisi umum ibu baik, TTV normal, involusi uterus baik 2 jari di bawah pusat, ASI keluar lancar.",
            konfirmasi_jadwal_kontrol=(now + timedelta(days=5)).date(),
        )
        session.add(v1)

        # Kasus 2: Pending (Belum dikunjungi, dalam batas SLA) (Ny. Dewi Rahayu)
        t_krs_2 = now - timedelta(hours=14)
        t_deadline_2 = t_krs_2 + timedelta(hours=48)
        d2 = TrDischarge(
            id=str(uuid.uuid4()),
            token_kunjungan="token_dewi_rahayu_02",
            nik="3578014402950002",
            nama_ibu="Ny. Dewi Rahayu",
            alamat_lengkap="Jl. Semarang No. 42, Kel. Tembok Dukuh, Kec. Bubutan",
            kelurahan_id=kelurahan_dict["Tembok Dukuh"].id,
            no_whatsapp_ibu="6281234567891",
            diagnosis_sebelum_pulang="Post SC a/i panggul sempit relatif H-3",
            diagnosis_perawatan="Perawatan luka insisi Pfannenstiel post SC",
            rekomendasi_perawatan_rumah="Rawat luka kering, ganti perban sesuai jadwal, mobilisasi bertahap",
            jadwal_kunjungan_ulang=(now + timedelta(days=4)).date(),
            faskes_kunjungan_ulang=TipeFaskesRujukan.RS,
            rs_asal_id=rs_list[0].id,
            bidan_rs_id=user_bidan_rs1.id,
            waktu_krs=t_krs_2,
            deadline_sla=t_deadline_2,
            status_kunjungan=StatusSLAKunjungan.PENDING,
            status_kesehatan=StatusKesehatanIbu.SEHAT,
            is_emergency=False,
        )
        session.add(d2)

        # Kasus 3: Kunjungan Terlambat + TANDA BAHAYA / Red Alert (Ny. Rina Marlina)
        t_krs_3 = now - timedelta(hours=54)
        t_deadline_3 = t_krs_3 + timedelta(hours=48)
        d3 = TrDischarge(
            id=str(uuid.uuid4()),
            token_kunjungan="token_rina_marlina_03",
            nik="3578026107930003",
            nama_ibu="Ny. Rina Marlina",
            alamat_lengkap="Jl. Mojo III No. 8, Kel. Mojo, Kec. Gubeng",
            kelurahan_id=kelurahan_dict["Mojo"].id,
            no_whatsapp_ibu="6281234567892",
            diagnosis_sebelum_pulang="Post partum spontan H-2 dengan riwayat PEB",
            diagnosis_perawatan="Observasi tensi nifas dan lokia",
            rekomendasi_perawatan_rumah="Minum antihipertensi nifedipin rutin, hindari konsumsi garam berlebih",
            jadwal_kunjungan_ulang=(now + timedelta(days=3)).date(),
            faskes_kunjungan_ulang=TipeFaskesRujukan.RS,
            rs_asal_id=rs_list[1].id,
            bidan_rs_id=user_bidan_rs2.id,
            waktu_krs=t_krs_3,
            deadline_sla=t_deadline_3,
            status_kunjungan=StatusSLAKunjungan.VISITED_LATE,
            status_kesehatan=StatusKesehatanIbu.TANDA_BAHAYA,
            is_emergency=True,
        )
        session.add(d3)
        session.flush()

        v3 = TrHomeVisit(
            id=str(uuid.uuid4()),
            discharge_id=d3.id,
            bidan_pelaksana_id=user_bidan_kel.id,
            waktu_kunjungan=t_krs_3 + timedelta(hours=51),
            durasi_jam_sejak_krs=51.0,
            suhu_tubuh=38.6,
            perdarahan_abnormal=True,
            nyeri_perut_hebat=True,
            luka_berbau_infeksi=False,
            pusing_muntah_lemas=True,
            status_hasil="ADA_MASALAH",
            catatan_kebidanan="Pasien demam tinggi menggigil, perdarahan pembalut penuh dalam 30 menit, tensi 150/95 mmHg. Segera difasilitasi rujukan IGD Soetomo.",
            konfirmasi_jadwal_kontrol=(now + timedelta(days=1)).date(),
        )
        session.add(v3)

        alert3 = TrEmergencyAlert(
            id=str(uuid.uuid4()),
            discharge_id=d3.id,
            jenis_masalah="Demam 38.6°C, Perdarahan aktif abnormal, Nyeri perut hebat, TD 150/95 mmHg",
            waktu_laporan=now - timedelta(hours=3),
            is_resolved=False,
            catatan_tindakan="Bidan kelurahan telah menghubungi ambulans 112 dan berkoordinasi dengan IGD RSUD Dr. Soetomo.",
        )
        session.add(alert3)

        # Kasus 4: Komplikasi Kunjungan (Ny. Nurul Hidayah)
        t_krs_4 = now - timedelta(hours=36)
        t_deadline_4 = t_krs_4 + timedelta(hours=48)
        d4 = TrDischarge(
            id=str(uuid.uuid4()),
            token_kunjungan="token_nurul_hidayah_04",
            nik="3578035205940004",
            nama_ibu="Ny. Nurul Hidayah",
            alamat_lengkap="Jl. Bulak Banteng Lor No. 19, Kel. Bulak Banteng, Kec. Kenjeran",
            kelurahan_id=kelurahan_dict["Bulak Banteng"].id,
            no_whatsapp_ibu="6281234567893",
            diagnosis_sebelum_pulang="Post partum normal H-2",
            diagnosis_perawatan="Perawatan luka jahitan perineum",
            rekomendasi_perawatan_rumah="Jaga higienitas genetalia, cebok air hangat",
            jadwal_kunjungan_ulang=(now + timedelta(days=6)).date(),
            faskes_kunjungan_ulang=TipeFaskesRujukan.PUSKESMAS,
            rs_asal_id=rs_list[1].id,
            bidan_rs_id=user_bidan_rs2.id,
            waktu_krs=t_krs_4,
            deadline_sla=t_deadline_4,
            status_kunjungan=StatusSLAKunjungan.VISITED_ON_TIME,
            status_kesehatan=StatusKesehatanIbu.KOMPLIKASI,
            is_emergency=False,
        )
        session.add(d4)
        session.flush()

        v4 = TrHomeVisit(
            id=str(uuid.uuid4()),
            discharge_id=d4.id,
            bidan_pelaksana_id=user_bidan_kel.id,
            waktu_kunjungan=t_krs_4 + timedelta(hours=26),
            durasi_jam_sejak_krs=26.0,
            suhu_tubuh=37.4,
            perdarahan_abnormal=False,
            nyeri_perut_hebat=False,
            luka_berbau_infeksi=True,
            pusing_muntah_lemas=False,
            status_hasil="ADA_MASALAH",
            catatan_kebidanan="Luka jahitan tampak kemerahan dan keluar cairan berbau tidak sedap. Diberikan KIE perawatan luka dan jadwalkan kontrol ulang lebih awal.",
            konfirmasi_jadwal_kontrol=(now + timedelta(days=2)).date(),
        )
        session.add(v4)

        # Kasus 5: Tidak Dilakukan Kunjungan (SLA Expired > 48h) (Ny. Anisa Fitri)
        t_krs_5 = now - timedelta(hours=62)
        t_deadline_5 = t_krs_5 + timedelta(hours=48)
        d5 = TrDischarge(
            id=str(uuid.uuid4()),
            token_kunjungan="token_anisa_fitri_05",
            nik="3578044709920005",
            nama_ibu="Ny. Anisa Fitri",
            alamat_lengkap="Jl. Pacar Keling No. 71, Kel. Pacar Keling, Kec. Tambaksari",
            kelurahan_id=kelurahan_dict["Pacar Keling"].id,
            no_whatsapp_ibu="6281234567894",
            diagnosis_sebelum_pulang="Post SC H-3",
            diagnosis_perawatan="Perawatan luka operasi SC",
            rekomendasi_perawatan_rumah="Minum antibiotik dan analgetik tuntas",
            jadwal_kunjungan_ulang=(now + timedelta(days=4)).date(),
            faskes_kunjungan_ulang=TipeFaskesRujukan.RS,
            rs_asal_id=rs_list[0].id,
            bidan_rs_id=user_bidan_rs1.id,
            waktu_krs=t_krs_5,
            deadline_sla=t_deadline_5,
            status_kunjungan=StatusSLAKunjungan.NOT_VISITED,
            status_kesehatan=StatusKesehatanIbu.SEHAT,
            is_emergency=False,
        )
        session.add(d5)

        # Kasus 6: Dirawat Kembali (Ny. Tri Wahyuni)
        t_krs_6 = now - timedelta(days=4)
        t_deadline_6 = t_krs_6 + timedelta(hours=48)
        d6 = TrDischarge(
            id=str(uuid.uuid4()),
            token_kunjungan="token_tri_wahyuni_06",
            nik="3578055112910006",
            nama_ibu="Ny. Tri Wahyuni",
            alamat_lengkap="Jl. Sutorejo Prima No. 12, Kel. Sutorejo, Kec. Mulyorejo",
            kelurahan_id=kelurahan_dict["Sutorejo"].id,
            no_whatsapp_ibu="6281234567895",
            diagnosis_sebelum_pulang="Post partum H-2",
            diagnosis_perawatan="Observasi masa nifas dini",
            rekomendasi_perawatan_rumah="Istirahat cukup dan nutrisi",
            jadwal_kunjungan_ulang=(now - timedelta(days=1)).date(),
            faskes_kunjungan_ulang=TipeFaskesRujukan.RS,
            rs_asal_id=rs_list[2].id,
            bidan_rs_id=user_bidan_rs1.id,
            waktu_krs=t_krs_6,
            deadline_sla=t_deadline_6,
            status_kunjungan=StatusSLAKunjungan.VISITED_ON_TIME,
            status_kesehatan=StatusKesehatanIbu.DIRAWAT_KEMBALI,
            is_emergency=False,
        )
        session.add(d6)

        # 5. Log Notifikasi WhatsApp Terkirim
        logs = [
            LogNotifikasiWA(
                discharge_id=d1.id,
                nomor_tujuan=user_bidan_kel.no_whatsapp,
                peran_penerima="BIDAN_KELURAHAN",
                template_id="WA-ASSIGN-01",
                pesan_terkirim="Terdapat pasien ibu nifas baru yang dipulangkan dari RSUD Dr. Soetomo dan memerlukan kunjungan rumah...",
                status_pengiriman="DELIVERED",
            ),
            LogNotifikasiWA(
                discharge_id=d1.id,
                nomor_tujuan=d1.no_whatsapp_ibu,
                peran_penerima="IBU_NIFAS",
                template_id="WA-EDU-PASIEN",
                pesan_terkirim="Halo Ibu Ny. Siti Aisyah, Salam hangat dari Tim Layanan Kesehatan Ibu dan Anak Kota Surabaya...",
                status_pengiriman="DELIVERED",
            ),
            LogNotifikasiWA(
                discharge_id=d3.id,
                nomor_tujuan=user_bidan_kel.no_whatsapp,
                peran_penerima="BIDAN_KELURAHAN",
                template_id="WA-EMERGENCY",
                pesan_terkirim="[PERINGATAN BAHAYA NIFAS] Ditemukan indikasi tanda bahaya pada Ny. Rina Marlina. Segera tindak lanjut!",
                status_pengiriman="DELIVERED",
            ),
        ]
        session.add_all(logs)

        session.commit()
        logger.info("Seeding data PRD SIM-NIFAS Surabaya berhasil 100%!")


if __name__ == "__main__":
    from app.db.session import init_db
    init_db()
    seed_prd_data()
