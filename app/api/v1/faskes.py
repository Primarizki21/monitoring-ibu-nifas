from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, func, select
from app.db.session import get_session
from app.models.enums import StatusPemantauan, TriageResult
from app.models.faskes import Faskes, FaskesRead
from app.models.mother import Mother
from app.models.screening import ScreeningLog

router = APIRouter(prefix="/faskes", tags=["Faskes & Statistik"])


@router.get("", response_model=list[FaskesRead])
def list_faskes(
    session: Session = Depends(get_session),
    is_active: bool = True,
):
    """Mendapatkan daftar seluruh Rumah Sakit dan Puskesmas mitra di Surabaya."""
    statement = select(Faskes).where(Faskes.is_active == is_active).order_by(Faskes.kategori, Faskes.nama_faskes)
    return session.exec(statement).all()


@router.get("/{faskes_id}", response_model=FaskesRead)
def get_faskes_detail(
    faskes_id: int,
    session: Session = Depends(get_session),
):
    """Mendapatkan detail fasilitas kesehatan berdasarkan ID."""
    faskes = session.get(Faskes, faskes_id)
    if not faskes:
        raise HTTPException(status_code=404, detail="Faskes tidak ditemukan")
    return faskes


@router.get("/{faskes_id}/summary")
def get_faskes_summary(
    faskes_id: int,
    session: Session = Depends(get_session),
):
    """Ringkasan pemantauan maternal faskes: total pasien aktif dan sebaran kasus triase."""
    faskes = session.get(Faskes, faskes_id)
    if not faskes:
        raise HTTPException(status_code=404, detail="Faskes tidak ditemukan")

    # Hitung total pasien aktif
    total_aktif = session.exec(
        select(func.count(Mother.id)).where(
            Mother.faskes_id == faskes_id,
            Mother.status_pemantauan == StatusPemantauan.AKTIF,
        )
    ).one()

    # Hitung sebaran triase
    logs_stmt = (
        select(ScreeningLog.triage_result, func.count(ScreeningLog.id))
        .join(Mother, ScreeningLog.mother_id == Mother.id)
        .where(Mother.faskes_id == faskes_id)
        .group_by(ScreeningLog.triage_result)
    )
    triage_counts = dict(session.exec(logs_stmt).all())

    return {
        "faskes_id": faskes.id,
        "nama_faskes": faskes.nama_faskes,
        "kategori": faskes.kategori,
        "total_ibu_aktif": total_aktif,
        "triage_summary": {
            "merah": triage_counts.get(TriageResult.MERAH, 0),
            "kuning": triage_counts.get(TriageResult.KUNING, 0),
            "hijau": triage_counts.get(TriageResult.HIJAU, 0),
        },
    }
