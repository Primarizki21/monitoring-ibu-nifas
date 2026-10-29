from datetime import date, datetime, timezone
from enum import Enum
from typing import Optional
import uuid
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class RolePengguna(str, Enum):
    SUPERADMIN_DINKES = "SUPERADMIN_DINKES"
    KEPALA_PUSKESMAS = "KEPALA_PUSKESMAS"
    BIDAN_KELURAHAN = "BIDAN_KELURAHAN"
    BIDAN_RS = "BIDAN_RS"


class StatusSLAKunjungan(str, Enum):
    PENDING = "PENDING"
    VISITED_ON_TIME = "VISITED_ON_TIME"
    VISITED_LATE = "VISITED_LATE"
    NOT_VISITED = "NOT_VISITED"


class StatusKesehatanIbu(str, Enum):
    SEHAT = "SEHAT"
    KOMPLIKASI = "KOMPLIKASI"
    TANDA_BAHAYA = "TANDA_BAHAYA"
    DIRAWAT_KEMBALI = "DIRAWAT_KEMBALI"
    MENINGGAL = "MENINGGAL"


class TipeFaskesRujukan(str, Enum):
    RS = "RS"
    PUSKESMAS = "PUSKESMAS"


# 1. Master Wilayah & Faskes
class MPuskesmas(SQLModel, table=True):
    __tablename__ = "m_puskesmas"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    nama_puskesmas: str = Field(index=True)
    kecamatan: str = Field(index=True)
    no_telp_operasional: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)


class MKelurahan(SQLModel, table=True):
    __tablename__ = "m_kelurahan"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    puskesmas_id: str = Field(foreign_key="m_puskesmas.id", index=True)
    nama_kelurahan: str = Field(index=True)
    created_at: datetime = Field(default_factory=utc_now)


class MRumahSakit(SQLModel, table=True):
    __tablename__ = "m_rumah_sakit"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    nama_rs: str = Field(index=True)
    tipe_rs: str = Field(default="B")
    alamat_rs: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)


# 2. Pengguna Sistem (PRD RBAC)
class PRDUser(SQLModel, table=True):
    __tablename__ = "prd_users"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    nama_lengkap: str
    nip: Optional[str] = None
    email: str = Field(unique=True, index=True)
    password_hash: str = Field(default="mock_hash")
    no_whatsapp: str
    role: RolePengguna
    faskes_id: Optional[str] = None  # ID RS atau Puskesmas
    kelurahan_id: Optional[str] = Field(default=None, foreign_key="m_kelurahan.id")
    is_active: bool = True
    created_at: datetime = Field(default_factory=utc_now)


# 3. Transaksi Discharge (Pemulangan Pasien dari RS)
class TrDischarge(SQLModel, table=True):
    __tablename__ = "tr_discharge"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    token_kunjungan: str = Field(unique=True, index=True)
    nik: str = Field(index=True)
    nama_ibu: str = Field(index=True)
    alamat_lengkap: str
    kelurahan_id: str = Field(foreign_key="m_kelurahan.id", index=True)
    no_whatsapp_ibu: str
    diagnosis_sebelum_pulang: str
    diagnosis_perawatan: str
    rekomendasi_perawatan_rumah: str
    jadwal_kunjungan_ulang: date
    faskes_kunjungan_ulang: TipeFaskesRujukan
    rs_asal_id: str = Field(foreign_key="m_rumah_sakit.id")
    bidan_rs_id: str = Field(foreign_key="prd_users.id")
    waktu_krs: datetime = Field(default_factory=utc_now, index=True)
    deadline_sla: datetime
    status_kunjungan: StatusSLAKunjungan = Field(default=StatusSLAKunjungan.PENDING, index=True)
    status_kesehatan: StatusKesehatanIbu = Field(default=StatusKesehatanIbu.SEHAT, index=True)
    is_emergency: bool = Field(default=False)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


# 4. Transaksi Pelaporan Kunjungan Rumah (Home Visit Bidan Kelurahan)
class TrHomeVisit(SQLModel, table=True):
    __tablename__ = "tr_home_visit"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    discharge_id: str = Field(foreign_key="tr_discharge.id", unique=True, index=True)
    bidan_pelaksana_id: str = Field(foreign_key="prd_users.id")
    waktu_kunjungan: datetime = Field(default_factory=utc_now)
    durasi_jam_sejak_krs: float
    suhu_tubuh: float
    perdarahan_abnormal: bool = False
    nyeri_perut_hebat: bool = False
    luka_berbau_infeksi: bool = False
    pusing_muntah_lemas: bool = False
    status_hasil: str = "BAIK"  # 'BAIK' / 'ADA_MASALAH'
    catatan_kebidanan: Optional[str] = None
    konfirmasi_jadwal_kontrol: date
    created_at: datetime = Field(default_factory=utc_now)


# 5. Eskalasi Kedaruratan (Red Alert)
class TrEmergencyAlert(SQLModel, table=True):
    __tablename__ = "tr_emergency_alert"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    discharge_id: str = Field(foreign_key="tr_discharge.id", index=True)
    jenis_masalah: str
    waktu_laporan: datetime = Field(default_factory=utc_now)
    is_resolved: bool = False
    catatan_tindakan: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = Field(default=None, foreign_key="prd_users.id")


# 6. Audit Log Notifikasi WhatsApp
class LogNotifikasiWA(SQLModel, table=True):
    __tablename__ = "log_notifikasi_wa"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    discharge_id: Optional[str] = Field(default=None, foreign_key="tr_discharge.id")
    nomor_tujuan: str
    peran_penerima: str
    template_id: str
    pesan_terkirim: str
    status_pengiriman: str = "SENT"
    response_gateway: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)
