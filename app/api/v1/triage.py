import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session, select
from app.api.deps import (
    get_current_faskes_id,
    get_current_user_id,
)
from app.db.session import get_session
from app.models.audit import AuditLog
from app.models.enums import TriageResult
from app.models.faskes import Faskes
from app.models.intervention import (
    Intervention,
    InterventionCreate,
    InterventionRead,
)
from app.models.mother import EmergencyContact, Mother
from app.models.screening import ScreeningLog
from app.models.user import User
from app.services.whatsapp_service import (
    generate_bidan_followup_message,
    generate_husband_emergency_message,
    generate_wa_me_url,
)

router = APIRouter(prefix="/triage", tags=["Antrean Triase & Intervensi"])


@router.get("/queue")
def get_triage_queue(
    triage_result: TriageResult | None = Query(default=None, description="Filter: MERAH, KUNING, HIJAU"),
    session: Session = Depends(get_session),
    faskes_id: int | None = Depends(get_current_faskes_id),
):
    """Antrean pasien triase harian untuk Bidan Faskes.
    
    Menampilkan keluhan, status warna triase, serta tombol direct wa.me ke Ibu dan Suami dengan teks otomatis siap kirim.
    """
    statement = (
        select(ScreeningLog, Mother, EmergencyContact, Faskes)
        .join(Mother, ScreeningLog.mother_id == Mother.id)
        .outerjoin(EmergencyContact, EmergencyContact.mother_id == Mother.id)
        .outerjoin(Faskes, Faskes.id == Mother.faskes_id)
    )

    if faskes_id is not None:
        statement = statement.where(Mother.faskes_id == faskes_id)

    if triage_result is not None:
        statement = statement.where(ScreeningLog.triage_result == triage_result)

    # Urutkan berdasarkan waktu respon terbaru
    statement = statement.order_by(ScreeningLog.responded_at.desc())
    items = session.exec(statement).all()

    # Pre-fetch nama bidan per faskes dalam 1 query batch
    faskes_ids = {m.faskes_id for _, m, _, _ in items if m.faskes_id is not None}
    bidan_map: dict[int, str] = {}
    if faskes_ids:
        users = session.exec(select(User).where(User.faskes_id.in_(faskes_ids))).all()
        for u in users:
            if u.faskes_id and u.faskes_id not in bidan_map:
                bidan_map[u.faskes_id] = u.nama_lengkap

    queue_data = []
    for log, mother, emergency, faskes in items:
        nama_faskes = faskes.nama_faskes if faskes else "Puskesmas"
        nama_bidan = bidan_map.get(mother.faskes_id, "Bidan Jaga")

        # 1-klik wa.me Ibu
        mother_msg = generate_bidan_followup_message(
            nama_ibu=mother.nama_ibu,
            nama_bidan=nama_bidan,
            nama_faskes=nama_faskes,
            gejala=log.gejala_terdeteksi or log.raw_message_text,
        )
        wa_me_mother = generate_wa_me_url(mother.no_wa_ibu, mother_msg)

        # 1-klik wa.me Suami (Darurat / Fail-safe)
        wa_me_husband = None
        if emergency:
            husband_msg = generate_husband_emergency_message(
                nama_suami=emergency.nama_kontak,
                nama_ibu=mother.nama_ibu,
                nama_bidan=nama_bidan,
                nama_faskes=nama_faskes,
                gejala=log.gejala_terdeteksi or log.raw_message_text,
            )
            wa_me_husband = generate_wa_me_url(emergency.no_wa_darurat, husband_msg)

        # Cek apakah sudah pernah ditindaklanjuti
        intervened = session.exec(
            select(Intervention).where(Intervention.screening_log_id == log.id)
        ).first()

        queue_data.append({
            "log_id": log.id,
            "mother_id": mother.id,
            "nama_ibu": mother.nama_ibu,
            "faskes_id": mother.faskes_id,
            "nama_faskes": nama_faskes,
            "milestone": log.milestone,
            "triage_result": log.triage_result,
            "gejala": log.gejala_terdeteksi,
            "jawaban_pasien": log.raw_message_text,
            "responded_at": log.responded_at,
            "wa_me_mother_url": wa_me_mother,
            "wa_me_husband_url": wa_me_husband,
            "nama_suami": emergency.nama_kontak if emergency else None,
            "no_wa_suami": emergency.no_wa_darurat if emergency else None,
            "is_intervened": intervened is not None,
            "latest_intervention": intervened,
        })

    # Sort in memory: MERAH first, then KUNING, then HIJAU
    priority_order = {TriageResult.MERAH: 0, TriageResult.KUNING: 1, TriageResult.HIJAU: 2}
    queue_data.sort(key=lambda x: priority_order.get(x["triage_result"], 3))

    return queue_data


@router.post("/interventions", response_model=InterventionRead, status_code=201)
def record_intervention(
    payload: InterventionCreate,
    request: Request,
    session: Session = Depends(get_session),
    faskes_id: int | None = Depends(get_current_faskes_id),
    user_id: uuid.UUID | None = Depends(get_current_user_id),
):
    """Mencatat tindakan klinis / anamnesis yang dilakukan oleh Bidan terhadap pasien bergejala."""
    mother = session.get(Mother, payload.mother_id)
    if not mother:
        raise HTTPException(status_code=404, detail="Ibu nifas tidak ditemukan")

    if faskes_id is not None and mother.faskes_id != faskes_id:
        raise HTTPException(status_code=403, detail="Akses ditolak: pasien bukan binaan faskes Anda")

    data = payload.model_dump()
    if user_id:
        data["bidan_user_id"] = user_id

    intervention = Intervention(**data)
    session.add(intervention)
    session.commit()
    session.refresh(intervention)

    # Catat audit log rekam medis (kepatuhan UU PDP)
    audit = AuditLog(
        user_id=user_id,
        action="CREATE_INTERVENTION",
        table_name="interventions",
        record_id=str(intervention.id),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    session.add(audit)
    session.commit()

    return intervention


@router.get("/interventions", response_model=list[InterventionRead])
def list_interventions(
    mother_id: uuid.UUID | None = None,
    session: Session = Depends(get_session),
    faskes_id: int | None = Depends(get_current_faskes_id),
):
    """Melihat riwayat tindakan intervensi yang telah tercatat."""
    statement = select(Intervention).join(Mother, Intervention.mother_id == Mother.id)
    if faskes_id is not None:
        statement = statement.where(Mother.faskes_id == faskes_id)
    if mother_id is not None:
        statement = statement.where(Intervention.mother_id == mother_id)

    statement = statement.order_by(Intervention.created_at.desc())
    return session.exec(statement).all()
