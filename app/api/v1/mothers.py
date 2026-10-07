import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.api.deps import get_current_faskes_id
from app.db.session import get_session
from app.models.enums import ScheduleStatus, StatusPemantauan
from app.models.mother import (
    EmergencyContact,
    EmergencyContactBase,
    Mother,
    MotherCreate,
    MotherRead,
)
from app.models.screening import ScreeningLog, ScreeningSchedule
from app.services.scheduler import create_schedules_for_mother
from app.services.whatsapp_service import send_whatsapp_message

router = APIRouter(prefix="/mothers", tags=["Ibu Nifas (Pendaftaran & Siklus)"])


@router.post("", response_model=MotherRead, status_code=201)
async def register_mother(
    payload: MotherCreate,
    session: Session = Depends(get_session),
    faskes_id: int | None = Depends(get_current_faskes_id),
):
    """Mendaftarkan ibu nifas baru saat kepulangan (Discharge Planning).
    
    Otomatis mendaftarkan kontak darurat suami, menjadwalkan KF1 s/d KF4,
    dan mengirim pesan onboarding verifikasi ke WhatsApp ibu.
    """
    target_faskes_id = faskes_id or payload.faskes_id

    # 1. Simpan profil ibu
    mother_data = payload.model_dump(exclude={"nama_suami", "no_wa_suami", "hubungan"})
    mother_data["faskes_id"] = target_faskes_id
    mother = Mother(**mother_data)
    session.add(mother)
    session.commit()
    session.refresh(mother)

    # 2. Simpan kontak darurat suami/keluarga
    emergency = EmergencyContact(
        mother_id=mother.id,
        nama_kontak=payload.nama_suami,
        hubungan=payload.hubungan,
        no_wa_darurat=payload.no_wa_suami,
    )
    session.add(emergency)
    session.commit()

    # 3. Buat jadwal otomatis KF1 s/d KF4
    create_schedules_for_mother(session, mother)

    # 4. Kirim sapaan onboarding verifikasi nomor aktif
    onboarding_text = (
        f"Halo Ibu {mother.nama_ibu}. Selamat atas kelahiran buah hati. "
        f"Ini adalah layanan resmi pemantauan nifas Puskesmas/RS Surabaya. "
        f"Kami akan menyapa Ibu secara berkala hingga hari ke-42 untuk memastikan pemulihan aman. "
        f"Balas YA untuk mengonfirmasi penerimaan layanan ini."
    )
    await send_whatsapp_message(mother.no_wa_ibu, onboarding_text)

    session.refresh(emergency)
    read_obj = MotherRead(
        **mother.model_dump(),
        emergency_contact=EmergencyContactBase(
            mother_id=emergency.mother_id,
            nama_kontak=emergency.nama_kontak,
            hubungan=emergency.hubungan,
            no_wa_darurat=emergency.no_wa_darurat,
        ),
    )
    return read_obj


@router.get("", response_model=list[MotherRead])
def list_mothers(
    status: StatusPemantauan | None = Query(default=None),
    session: Session = Depends(get_session),
    faskes_id: int | None = Depends(get_current_faskes_id),
):
    """Daftar ibu nifas. Jika diakses Admin Faskes, otomatis terisolasi pada faskes masing-masing."""
    statement = select(Mother)
    if faskes_id is not None:
        statement = statement.where(Mother.faskes_id == faskes_id)
    if status is not None:
        statement = statement.where(Mother.status_pemantauan == status)

    statement = statement.order_by(Mother.created_at.desc())
    mothers = session.exec(statement).all()

    results = []
    for m in mothers:
        em = session.exec(
            select(EmergencyContact).where(EmergencyContact.mother_id == m.id)
        ).first()
        contact_base = None
        if em:
            contact_base = EmergencyContactBase(
                mother_id=em.mother_id,
                nama_kontak=em.nama_kontak,
                hubungan=em.hubungan,
                no_wa_darurat=em.no_wa_darurat,
            )
        item = MotherRead(**m.model_dump(), emergency_contact=contact_base)
        results.append(item)
    return results


@router.get("/{mother_id}")
def get_mother_detail(
    mother_id: uuid.UUID,
    session: Session = Depends(get_session),
    faskes_id: int | None = Depends(get_current_faskes_id),
):
    """Detail lengkap ibu nifas, kontak darurat, jadwal KF, dan riwayat log triase."""
    mother = session.get(Mother, mother_id)
    if not mother:
        raise HTTPException(status_code=404, detail="Data ibu nifas tidak ditemukan")

    if faskes_id is not None and mother.faskes_id != faskes_id:
        raise HTTPException(status_code=403, detail="Akses ditolak: pasien bukan binaan faskes ini")

    emergency = session.exec(
        select(EmergencyContact).where(EmergencyContact.mother_id == mother_id)
    ).first()

    schedules = session.exec(
        select(ScreeningSchedule).where(ScreeningSchedule.mother_id == mother_id).order_by(ScreeningSchedule.target_date)
    ).all()

    logs = session.exec(
        select(ScreeningLog).where(ScreeningLog.mother_id == mother_id).order_by(ScreeningLog.responded_at.desc())
    ).all()

    return {
        "profile": mother,
        "emergency_contact": emergency,
        "schedules": schedules,
        "triage_logs": logs,
    }


@router.patch("/{mother_id}/status")
def update_mother_status(
    mother_id: uuid.UUID,
    status: StatusPemantauan,
    session: Session = Depends(get_session),
    faskes_id: int | None = Depends(get_current_faskes_id),
):
    """Mengubah status siklus hidup nifas (misal: LULUS, DIRUJUK, NONAKTIF)."""
    mother = session.get(Mother, mother_id)
    if not mother:
        raise HTTPException(status_code=404, detail="Data ibu nifas tidak ditemukan")

    if faskes_id is not None and mother.faskes_id != faskes_id:
        raise HTTPException(status_code=403, detail="Akses ditolak: pasien bukan binaan faskes ini")

    mother.status_pemantauan = status
    session.add(mother)
    session.commit()
    session.refresh(mother)
    return {"status": "ok", "mother_id": mother.id, "new_status": mother.status_pemantauan}
