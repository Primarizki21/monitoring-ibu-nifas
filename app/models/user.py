import uuid
from datetime import datetime
from sqlmodel import Field, SQLModel
from app.models.enums import UserRole


class UserBase(SQLModel):
    faskes_id: int | None = Field(default=None, foreign_key="faskes.id", index=True)
    username: str = Field(index=True, unique=True, max_length=50)
    role: UserRole = Field(default=UserRole.BIDAN_JAGA)
    nama_lengkap: str = Field(max_length=100)
    no_whatsapp: str = Field(max_length=20)
    is_active: bool = Field(default=True)


class User(UserBase, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    password_hash: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserRead(UserBase):
    id: uuid.UUID
    created_at: datetime
