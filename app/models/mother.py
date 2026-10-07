import uuid
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel
from app.models.enums import ContactRelation, DeliveryType, StatusPemantauan


class MotherBase(SQLModel):
    faskes_id: int = Field(foreign_key="faskes.id", index=True)
    nik: str = Field(index=True, max_length=16)
    no_rm: str | None = Field(default=None, max_length=50)
    nama_ibu: str = Field(index=True, max_length=100)
    no_wa_ibu: str = Field(index=True, max_length=20)
    waktu_persalinan: datetime = Field(index=True)
    metode_persalinan: DeliveryType = Field(default=DeliveryType.SPONTAN)
    paritas: str | None = Field(default=None, max_length=20)
    status_pemantauan: StatusPemantauan = Field(default=StatusPemantauan.ONBOARDING_PENDING, index=True)
    catatan_khusus: str | None = None


class Mother(MotherBase, table=True):
    __tablename__ = "mothers"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_by: uuid.UUID | None = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EmergencyContactBase(SQLModel):
    mother_id: uuid.UUID = Field(foreign_key="mothers.id", index=True)
    nama_kontak: str = Field(max_length=100)
    hubungan: ContactRelation = Field(default=ContactRelation.SUAMI)
    no_wa_darurat: str = Field(max_length=20)


class EmergencyContact(EmergencyContactBase, table=True):
    __tablename__ = "emergency_contacts"

    id: int | None = Field(default=None, primary_key=True)


class MotherCreate(MotherBase):
    nama_suami: str = Field(max_length=100)
    no_wa_suami: str = Field(max_length=20)
    hubungan: ContactRelation = Field(default=ContactRelation.SUAMI)


class MotherRead(MotherBase):
    id: uuid.UUID
    created_at: datetime
    emergency_contact: EmergencyContactBase | None = None
