import logging
from datetime import datetime, timedelta, timezone
from sqlmodel import Session, select
from app.db.session import engine, init_db
from app.models.enums import (
    ContactRelation,
    DeliveryType,
    FaskesKategori,
    MilestoneKF,
    ScheduleStatus,
    StatusPemantauan,
    TriageResult,
    UserRole,
)
from app.models.faskes import Faskes
from app.models.mother import EmergencyContact, Mother
from app.models.screening import ScreeningLog, ScreeningSchedule
from app.models.user import User
from app.services.scheduler import calculate_kf_dates

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Daftar 13 Faskes Mitra Pengmas Surabaya (3 RS Rujukan + 10 Puskesmas)
FASKES_SEED_DATA = [
    # 3 RSUD Rujukan
    {"kode": "RSUD-SOETOMO", "nama": "RSUD Dr. Soetomo", "kategori": FaskesKategori.RSUD, "kecamatan": "Gubeng", "alamat": "Jl. Mayjen Prof. Dr. Moestopo No. 6-8", "telp": "031-5501078"},
    {"kode": "RSUD-SOEWANDHIE", "nama": "RSUD dr. Mohamad Soewandhie", "kategori": FaskesKategori.RSUD, "kecamatan": "Simokerto", "alamat": "Jl. Tambak Rejo No. 45-47", "telp": "031-3717141"},
    {"kode": "RSUD-BDH", "nama": "RSUD Bhakti Dharma Husada", "kategori": FaskesKategori.RSUD, "kecamatan": "Benowo", "alamat": "Jl. Kendung No. 115-117", "telp": "031-7409135"},
    # 10 Puskesmas Mitra
    {"kode": "PKM-JAGIR", "nama": "Puskesmas Jagir", "kategori": FaskesKategori.PUSKESMAS, "kecamatan": "Wonokromo", "alamat": "Jl. Jagir Wonokromo No. 356", "telp": "031-8415276"},
    {"kode": "PKM-DUPAK", "nama": "Puskesmas Dupak", "kategori": FaskesKategori.PUSKESMAS, "kecamatan": "Krembangan", "alamat": "Jl. Dupak Bangunrejo Gg. Poliklinik No. 6", "telp": "031-3532296"},
    {"kode": "PKM-KDGDORO", "nama": "Puskesmas Kedungdoro", "kategori": FaskesKategori.PUSKESMAS, "kecamatan": "Tegalsari", "alamat": "Jl. Kaliasin Pompa No. 79", "telp": "031-5343468"},
    {"kode": "PKM-PEGIRIAN", "nama": "Puskesmas Pegirian", "kategori": FaskesKategori.PUSKESMAS, "kecamatan": "Semampir", "alamat": "Jl. Karang Tembok No. 39", "telp": "031-3714415"},
    {"kode": "PKM-WNKROMO", "nama": "Puskesmas Wonokromo", "kategori": FaskesKategori.PUSKESMAS, "kecamatan": "Wonokromo", "alamat": "Jl. Karangrejo VI No. 4", "telp": "031-8288596"},
    {"kode": "PKM-MENUR", "nama": "Puskesmas Menur", "kategori": FaskesKategori.PUSKESMAS, "kecamatan": "Sukolilo", "alamat": "Jl. Menur No. 31A", "telp": "031-5947347"},
    {"kode": "PKM-PUCANG", "nama": "Puskesmas Pucang Sewu", "kategori": FaskesKategori.PUSKESMAS, "kecamatan": "Gubeng", "alamat": "Jl. Pucang Anom Timur No. 70", "telp": "031-5018316"},
    {"kode": "PKM-RANGKAH", "nama": "Puskesmas Rangkah", "kategori": FaskesKategori.PUSKESMAS, "kecamatan": "Tambaksari", "alamat": "Jl. Rangkah VII No. 94", "telp": "031-51501463"},
    {"kode": "PKM-SEMEMI", "nama": "Puskesmas Sememi", "kategori": FaskesKategori.PUSKESMAS, "kecamatan": "Benowo", "alamat": "Jl. Kendung No. 3", "telp": "031-7413622"},
    {"kode": "PKM-TKKEDINDING", "nama": "Puskesmas Tanah Kali Kedinding", "kategori": FaskesKategori.PUSKESMAS, "kecamatan": "Kenjeran", "alamat": "Jl. Kalilom Lor Indah No. 19", "telp": "031-3814890"},
]


def seed_database():
    """Mengisi database dengan 13 faskes Surabaya, user bidan, dan sampel pasien nifas."""
    init_db()

    with Session(engine) as session:
        # Cek jika data sudah pernah di-seed
        existing_faskes = session.exec(select(Faskes)).first()
        if existing_faskes:
            logger.info("Database sudah memiliki data faskes. Melewati proses seeding.")
            return

        logger.info("Memulai seeding 13 Faskes Surabaya...")
        faskes_map = {}
        for item in FASKES_SEED_DATA:
            f = Faskes(
                kode_faskes=item["kode"],
                nama_faskes=item["nama"],
                kategori=item["kategori"],
                wilayah_kecamatan=item["kecamatan"],
                alamat=item["alamat"],
                telepon=item["telp"],
                is_active=True,
            )
            session.add(f)
            session.commit()
            session.refresh(f)
            faskes_map[item["kode"]] = f

        logger.info("Seeding user Bidan dan Super Admin...")
        # Super Admin Dinkes
        admin_dinkes = User(
            username="admin_dinkes",
            password_hash="argon2_hashed_secret_placeholder",
            role=UserRole.SUPER_ADMIN_DINKES,
            nama_lengkap="Tim Pengawas Maternal Dinkes Surabaya",
            no_whatsapp="628113330001",
        )
        session.add(admin_dinkes)

        # Bidan Koordinator tiap faskes
        bidan_map = {}
        for kode, f in faskes_map.items():
            slug = kode.lower().replace("-", "_")
            b = User(
                faskes_id=f.id,
                username=f"bidan_{slug}",
                password_hash="argon2_hashed_secret_placeholder",
                role=UserRole.BIDAN_JAGA,
                nama_lengkap=f"Bidan PJ {f.nama_faskes}",
                no_whatsapp="628123456700" + str(f.id).zfill(2),
            )
            session.add(b)
            session.commit()
            session.refresh(b)
            bidan_map[kode] = b

        logger.info("Seeding 5 sampel ibu nifas dengan variasi triase klinis...")
        now = datetime.now(timezone.utc)

        # Kasus 1: MERAH (KF1) - RSUD Soewandhie (Perdarahan / Pusing Hebat)
        f_soewandhie = faskes_map["RSUD-SOEWANDHIE"]
        m1 = Mother(
            faskes_id=f_soewandhie.id,
            nik="3578015502980001",
            no_rm="RM-2026-0091",
            nama_ibu="Ny. Siti Rahayu",
            no_wa_ibu="6281230000001",
            waktu_persalinan=now - timedelta(days=1),
            metode_persalinan=DeliveryType.SC,
            paritas="P2A0",
            status_pemantauan=StatusPemantauan.AKTIF,
            catatan_khusus="Riwayat preeklampsia ringan saat inpartu",
        )
        session.add(m1)
        session.commit()
        session.refresh(m1)

        session.add(EmergencyContact(
            mother_id=m1.id,
            nama_kontak="Bpk. Eko Prasetyo",
            hubungan=ContactRelation.SUAMI,
            no_wa_darurat="6281230000002",
        ))

        # Buat jadwal KF
        kf_m1 = calculate_kf_dates(m1.waktu_persalinan)
        s1 = ScreeningSchedule(
            mother_id=m1.id,
            milestone=MilestoneKF.KF1,
            target_date=kf_m1[MilestoneKF.KF1],
            status_pengiriman=ScheduleStatus.REPLIED,
            sent_at=now - timedelta(hours=3),
            responded_at=now - timedelta(hours=2, minutes=45),
        )
        session.add(s1)
        session.commit()
        session.refresh(s1)

        # Log jawaban Merah
        session.add(ScreeningLog(
            schedule_id=s1.id,
            mother_id=m1.id,
            milestone=MilestoneKF.KF1,
            raw_message_text="2. Darah keluar banyak sekali dan kepala saya pusing muter",
            selected_option=2,
            triage_result=TriageResult.MERAH,
            gejala_terdeteksi="Keluhan pusing berat, nyeri perut hebat, atau perdarahan deras membasahi >2 pembalut/jam.",
            responded_at=now - timedelta(hours=2, minutes=45),
        ))

        # Kasus 2: KUNING (KF2) - Puskesmas Jagir (Bendungan ASI)
        f_jagir = faskes_map["PKM-JAGIR"]
        m2 = Mother(
            faskes_id=f_jagir.id,
            nik="3578026105990002",
            no_rm="RM-2026-0142",
            nama_ibu="Ny. Dewi Lestari",
            no_wa_ibu="6281230000003",
            waktu_persalinan=now - timedelta(days=4),
            metode_persalinan=DeliveryType.SPONTAN,
            paritas="P1A0",
            status_pemantauan=StatusPemantauan.AKTIF,
        )
        session.add(m2)
        session.commit()
        session.refresh(m2)

        session.add(EmergencyContact(
            mother_id=m2.id,
            nama_kontak="Bpk. Wahyu Hidayat",
            hubungan=ContactRelation.SUAMI,
            no_wa_darurat="6281230000004",
        ))

        s2 = ScreeningSchedule(
            mother_id=m2.id,
            milestone=MilestoneKF.KF2,
            target_date=now.date(),
            status_pengiriman=ScheduleStatus.REPLIED,
            sent_at=now - timedelta(hours=4),
            responded_at=now - timedelta(hours=3),
        )
        session.add(s2)
        session.commit()
        session.refresh(s2)

        session.add(ScreeningLog(
            schedule_id=s2.id,
            mother_id=m2.id,
            milestone=MilestoneKF.KF2,
            raw_message_text="2",
            selected_option=2,
            triage_result=TriageResult.KUNING,
            gejala_terdeteksi="Payudara bengkak/nyeri atau puting lecet (risiko bendungan ASI).",
            responded_at=now - timedelta(hours=3),
        ))

        # Kasus 3: HIJAU (KF3) - Puskesmas Dupak (Kondisi Pulih Baik)
        f_dupak = faskes_map["PKM-DUPAK"]
        m3 = Mother(
            faskes_id=f_dupak.id,
            nik="3578034509970003",
            no_rm="RM-2026-0210",
            nama_ibu="Ny. Anisa Fitri",
            no_wa_ibu="6281230000005",
            waktu_persalinan=now - timedelta(days=14),
            metode_persalinan=DeliveryType.SPONTAN,
            paritas="P2A0",
            status_pemantauan=StatusPemantauan.AKTIF,
        )
        session.add(m3)
        session.commit()
        session.refresh(m3)

        session.add(EmergencyContact(
            mother_id=m3.id,
            nama_kontak="Bpk. Hendra Gunawan",
            hubungan=ContactRelation.SUAMI,
            no_wa_darurat="6281230000006",
        ))

        s3 = ScreeningSchedule(
            mother_id=m3.id,
            milestone=MilestoneKF.KF3,
            target_date=now.date(),
            status_pengiriman=ScheduleStatus.REPLIED,
            sent_at=now - timedelta(hours=5),
            responded_at=now - timedelta(hours=4),
        )
        session.add(s3)
        session.commit()
        session.refresh(s3)

        session.add(ScreeningLog(
            schedule_id=s3.id,
            mother_id=m3.id,
            milestone=MilestoneKF.KF3,
            raw_message_text="1 aman bu",
            selected_option=1,
            triage_result=TriageResult.HIJAU,
            gejala_terdeteksi="Luka jahitan membaik, lochea berkurang.",
            responded_at=now - timedelta(hours=4),
        ))

        session.commit()
        logger.info("Seeding basis data berhasil 100%! Siap digunakan.")


if __name__ == "__main__":
    seed_database()
