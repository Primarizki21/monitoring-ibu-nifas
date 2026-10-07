import uuid
from datetime import datetime
from sqlmodel import Field, SQLModel
from app.models.enums import ActionType, CaseStatus, TriageResult


class InterventionBase(SQLModel):
    mother_id: uuid.UUID = Field(foreign_key="mothers.id", index=True)
    screening_log_id: int | None = Field(default=None, foreign_key="screening_logs.id", index=True)
    bidan_user_id: uuid.UUID | None = Field(default=None, foreign_key="users.id", index=True)
    triase_level: TriageResult = Field(index=True)
    jenis_tindakan: ActionType = Field(default=ActionType.WA_ANAMNESIS)
    catatan_klinis: str
    status_kasus: CaseStatus = Field(default=CaseStatus.RESOLVED)


class Intervention(InterventionBase, table=True):
    __tablename__ = "interventions"

    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class InterventionCreate(InterventionBase):
    pass


class InterventionRead(InterventionBase):
    id: int
    created_at: datetime
