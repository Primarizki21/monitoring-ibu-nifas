import uuid
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel


class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"

    id: int | None = Field(default=None, primary_key=True)
    user_id: uuid.UUID | None = Field(default=None, foreign_key="users.id", index=True)
    action: str = Field(index=True, max_length=50)
    table_name: str = Field(index=True, max_length=50)
    record_id: str = Field(index=True, max_length=100)
    ip_address: str | None = Field(default=None, max_length=45)
    user_agent: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
