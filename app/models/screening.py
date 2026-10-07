import uuid
from datetime import date, datetime, timezone
from sqlmodel import Field, SQLModel
from app.models.enums import MilestoneKF, ScheduleStatus, TriageResult


class ScreeningSchedule(SQLModel, table=True):
    __tablename__ = "screening_schedules"

    id: int | None = Field(default=None, primary_key=True)
    mother_id: uuid.UUID = Field(foreign_key="mothers.id", index=True)
    milestone: MilestoneKF = Field(index=True)
    target_date: date = Field(index=True)
    status_pengiriman: ScheduleStatus = Field(default=ScheduleStatus.SCHEDULED, index=True)
    waba_message_id: str | None = Field(default=None, max_length=100)
    sent_at: datetime | None = None
    responded_at: datetime | None = None


class ScreeningLog(SQLModel, table=True):
    __tablename__ = "screening_logs"

    id: int | None = Field(default=None, primary_key=True)
    schedule_id: int | None = Field(default=None, foreign_key="screening_schedules.id", index=True)
    mother_id: uuid.UUID = Field(foreign_key="mothers.id", index=True)
    milestone: MilestoneKF = Field(index=True)
    raw_message_text: str
    selected_option: int
    triage_result: TriageResult = Field(index=True)
    gejala_terdeteksi: str | None = None
    responded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
