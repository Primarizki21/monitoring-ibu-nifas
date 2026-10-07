from datetime import datetime
from sqlmodel import Field, SQLModel
from app.models.enums import FaskesKategori


class FaskesBase(SQLModel):
    kode_faskes: str = Field(index=True, unique=True, max_length=20)
    nama_faskes: str = Field(index=True, max_length=100)
    kategori: FaskesKategori = Field(default=FaskesKategori.PUSKESMAS)
    alamat: str | None = None
    wilayah_kecamatan: str = Field(index=True, max_length=50)
    telepon: str | None = None
    is_active: bool = Field(default=True)


class Faskes(FaskesBase, table=True):
    __tablename__ = "faskes"

    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FaskesRead(FaskesBase):
    id: int
    created_at: datetime
