from enum import Enum


class FaskesKategori(str, Enum):
    RSUD = "RSUD"
    PUSKESMAS = "PUSKESMAS"


class UserRole(str, Enum):
    SUPER_ADMIN_DINKES = "SUPER_ADMIN_DINKES"
    ADMIN_FASKES = "ADMIN_FASKES"
    BIDAN_JAGA = "BIDAN_JAGA"


class DeliveryType(str, Enum):
    SPONTAN = "SPONTAN"
    SC = "SC"
    TINDAKAN = "TINDAKAN"


class ContactRelation(str, Enum):
    SUAMI = "SUAMI"
    ORANG_TUA = "ORANG_TUA"
    KELUARGA_LAIN = "KELUARGA_LAIN"


class StatusPemantauan(str, Enum):
    ONBOARDING_PENDING = "ONBOARDING_PENDING"
    AKTIF = "AKTIF"
    LULUS = "LULUS"
    DIRUJUK = "DIRUJUK"
    NONAKTIF = "NONAKTIF"
    MENINGGAL = "MENINGGAL"


class MilestoneKF(str, Enum):
    ONBOARDING = "ONBOARDING"
    KF1 = "KF1"
    KF2 = "KF2"
    KF3 = "KF3"
    KF4 = "KF4"


class TriageResult(str, Enum):
    HIJAU = "HIJAU"
    KUNING = "KUNING"
    MERAH = "MERAH"


class ScheduleStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"
    REPLIED = "REPLIED"
    EXPIRED = "EXPIRED"


class ActionType(str, Enum):
    WA_ANAMNESIS = "WA_ANAMNESIS"
    TELEPON_SUAMI = "TELEPON_SUAMI"
    KUNJUNGAN_RUMAH = "KUNJUNGAN_RUMAH"
    KONTROL_FASKES = "KONTROL_FASKES"
    RUJUK_RSUD = "RUJUK_RSUD"


class CaseStatus(str, Enum):
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    REFERRED = "REFERRED"
