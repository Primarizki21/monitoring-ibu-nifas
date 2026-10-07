import logging
import re
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlmodel import Session, select
from app.core.config import settings
from app.db.session import get_session
from app.models.enums import MilestoneKF, ScheduleStatus, StatusPemantauan
from app.models.faskes import Faskes
from app.models.mother import Mother
from app.models.screening import ScreeningLog, ScreeningSchedule
from app.models.user import User
from app.services.triage_engine import (
    evaluate_triage,
    get_fallback_message,
    get_triage_response_message,
    normalize_reply,
)
from app.services.whatsapp_service import normalize_phone_number, send_whatsapp_message

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhook", tags=["WhatsApp Webhook"])


@router.get("")
def verify_webhook(
    hub_mode: str = Query(..., alias="hub.mode"),
    hub_challenge: str = Query(..., alias="hub.challenge"),
    hub_verify_token: str = Query(..., alias="hub.verify_token"),
):
    """Endpoint verifikasi webhook resmi dari Meta Developer Console."""
    if hub_mode == "subscribe" and hub_verify_token == settings.meta_wa_verify_token:
        logger.info("Verifikasi webhook Meta WhatsApp berhasil disetujui.")
        return Response(content=hub_challenge, media_type="text/plain")

    logger.warning("Verifikasi webhook Meta gagal: token tidak cocok.")
    raise HTTPException(status_code=403, detail="Verification token mismatch")


@router.post("")
async def receive_whatsapp_message(
    request: Request,
    session: Session = Depends(get_session),
):
    """Menerima dan memproses pesan masuk dari WhatsApp Cloud API secara real-time.
    
    Mendukung format payload resmi Meta Cloud API dan direct test JSON.
    """
    body = await request.json()
    logger.info("Webhook WhatsApp payload masuk: %s", body)

    # Ekstraksi nomor pengirim & teks (fleksibel: payload Meta asli atau payload dev)
    sender_phone = None
    message_text = None

    if "entry" in body:
        try:
            changes = body["entry"][0]["changes"][0]["value"]
            if "messages" in changes and len(changes["messages"]) > 0:
                msg = changes["messages"][0]
                sender_phone = msg.get("from")
                if msg.get("type") == "text":
                    message_text = msg["text"].get("body", "")
                elif msg.get("type") == "interactive":
                    # Klik tombol interaktif
                    message_text = msg["interactive"].get("button_reply", {}).get("id", "")
        except (IndexError, KeyError) as e:
            logger.error("Gagal parsing payload Meta webhook: %s", e)
            return {"status": "ignored_format"}
    else:
        # Format payload pengujian langsung (dev-friendly)
        sender_phone = body.get("from")
        message_text = body.get("text")

    if not sender_phone or not message_text:
        return {"status": "no_message_found"}

    clean_phone = normalize_phone_number(sender_phone)

    # 1. Cari ibu nifas berdasarkan nomor telepon
    mother_stmt = select(Mother).where(
        (Mother.no_wa_ibu == clean_phone) | (Mother.no_wa_ibu == "0" + clean_phone[2:])
    )
    mother = session.exec(mother_stmt).first()
    if not mother:
        logger.warning("Pesan dari nomor tidak terdaftar di sistem nifas: %s", clean_phone)
        return {"status": "mother_not_found", "phone": clean_phone}

    # 2. Ambil faskes & kontak bidan pembina
    faskes = session.get(Faskes, mother.faskes_id)
    nama_faskes = faskes.nama_faskes if faskes else "Puskesmas Surabaya"

    # Cari bidan pembina di faskes
    bidan = session.exec(
        select(User).where(User.faskes_id == mother.faskes_id)
    ).first()
    nama_bidan = bidan.nama_lengkap if bidan else "Bidan Jaga"
    no_bidan = bidan.no_whatsapp if bidan else "08123456789"

    # 3. Tangani fase ONBOARDING PENDING
    if mother.status_pemantauan == StatusPemantauan.ONBOARDING_PENDING:
        normalized_choice = normalize_reply(message_text)
        if normalized_choice == 1 or message_text.strip().lower() in {"ya", "y", "ok"}:
            mother.status_pemantauan = StatusPemantauan.AKTIF
            session.add(mother)
            session.commit()

            ack_text = (
                f"Terima kasih Ibu {mother.nama_ibu}. Layanan pemantauan nifas resmi aktif. "
                f"Bidan {nama_bidan} ({nama_faskes}) siap mendampingi masa pemulihan Ibu hingga hari ke-42. "
                f"Pesan pengingat pertama akan kami kirimkan sesuai jadwal pemantauan."
            )
            await send_whatsapp_message(clean_phone, ack_text)
            return {"status": "onboarded_active", "mother_id": mother.id}

    # 4. Tangani balasan skrining aktif (KF1 - KF4)
    active_sched = session.exec(
        select(ScreeningSchedule)
        .where(
            ScreeningSchedule.mother_id == mother.id,
            ScreeningSchedule.status_pengiriman.in_([ScheduleStatus.SENT, ScheduleStatus.SCHEDULED]),
        )
        .order_by(ScreeningSchedule.target_date.asc())
    ).first()

    # Tentukan milestone yang dijawab
    target_milestone = active_sched.milestone if active_sched else MilestoneKF.KF1
    max_opts = 3 if target_milestone in {MilestoneKF.KF2, MilestoneKF.KF4} else 2

    chosen_option = normalize_reply(message_text, max_options=max_opts)

    # 5. Jika balasan tidak valid / tidak terbaca
    if chosen_option is None:
        fallback_msg = get_fallback_message(mother.nama_ibu, nama_bidan, no_bidan)
        await send_whatsapp_message(clean_phone, fallback_msg)
        return {"status": "fallback_sent", "raw_reply": message_text}

    # 6. Evaluasi triase klinis
    triage_result, gejala_desc = evaluate_triage(target_milestone, chosen_option)

    # 7. Simpan ke ScreeningLog
    log = ScreeningLog(
        schedule_id=active_sched.id if active_sched else None,
        mother_id=mother.id,
        milestone=target_milestone,
        raw_message_text=message_text,
        selected_option=chosen_option,
        triage_result=triage_result,
        gejala_terdeteksi=gejala_desc,
        responded_at=datetime.now(timezone.utc),
    )
    session.add(log)

    if active_sched:
        active_sched.status_pengiriman = ScheduleStatus.REPLIED
        active_sched.responded_at = datetime.now(timezone.utc)
        session.add(active_sched)

    session.commit()

    # 8. Kirim balasan triase ke ibu
    reply_to_mother = get_triage_response_message(
        triage_result,
        mother.nama_ibu,
        nama_bidan,
        nama_faskes,
        no_bidan,
    )
    await send_whatsapp_message(clean_phone, reply_to_mother)

    return {
        "status": "triage_evaluated",
        "mother_id": mother.id,
        "milestone": target_milestone,
        "selected_option": chosen_option,
        "triage_result": triage_result,
    }
