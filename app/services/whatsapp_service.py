import logging
import re
import urllib.parse
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


def normalize_phone_number(phone: str) -> str:
    """Normalisasi format nomor telepon Indonesia ke format standar internasional (628xxx)."""
    digits = re.sub(r"\D", "", phone)
    if digits.startswith("0"):
        return "62" + digits[1:]
    if digits.startswith("62"):
        return digits
    return "62" + digits


def generate_wa_me_url(phone: str, prefilled_text: str) -> str:
    """Membuat link wa.me dengan teks otomatis siap kirim."""
    clean_phone = normalize_phone_number(phone)
    encoded_text = urllib.parse.quote(prefilled_text)
    return f"https://wa.me/{clean_phone}?text={encoded_text}"


def generate_bidan_followup_message(
    nama_ibu: str,
    nama_bidan: str,
    nama_faskes: str,
    gejala: str,
) -> str:
    """Membuat teks sapaan pre-filled untuk 1-klik wa.me Bidan ke Ibu."""
    return (
        f"Halo Ibu {nama_ibu}, saya Bidan {nama_bidan} dari {nama_faskes}. "
        f"Kami menerima laporan pemantauan nifas Ibu dengan keluhan: '{gejala}'. "
        f"Bagaimana kondisi yang Ibu rasakan saat ini? Apakah ada yang mendampingi di rumah?"
    )


def generate_husband_emergency_message(
    nama_suami: str,
    nama_ibu: str,
    nama_bidan: str,
    nama_faskes: str,
    gejala: str,
) -> str:
    """Membuat teks notifikasi darurat pre-filled untuk 1-klik wa.me Bidan ke Suami."""
    return (
        f"PENTING: Yth. Bapak {nama_suami}, saya Bidan {nama_bidan} dari {nama_faskes}. "
        f"Sistem pemantauan kesehatan nifas mendeteksi tanda bahaya pada Ibu {nama_ibu}: '{gejala}'. "
        f"Mohon segera dampingi Ibu dan periksa kondisi fisiknya. "
        f"Jika lemas, segera bawa Ibu ke IGD Puskesmas/RS terdekat."
    )


async def send_whatsapp_message(to_phone: str, message_text: str) -> dict:
    """Mengirim pesan teks melalui Meta WhatsApp Cloud API (Graph API).
    
    Pada mode development (token dummy), sistem melakukan simulasi pengiriman dan mencatat ke log.
    """
    clean_phone = normalize_phone_number(to_phone)

    # Cek apakah menggunakan token dev/dummy
    if "dummy" in settings.meta_wa_access_token or "placeholder" in settings.meta_wa_access_token:
        logger.info(
            "[DEV SIMULATION] WA message sent to %s: %s",
            clean_phone,
            message_text[:80] + "..." if len(message_text) > 80 else message_text,
        )
        return {
            "messaging_product": "whatsapp",
            "contacts": [{"input": clean_phone, "wa_id": clean_phone}],
            "messages": [{"id": f"wamid.simulated_{clean_phone}_001"}],
            "status": "simulated",
        }

    url = f"{settings.meta_wa_api_url}/{settings.meta_wa_phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {settings.meta_wa_access_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": clean_phone,
        "type": "text",
        "text": {"preview_url": False, "body": message_text},
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as exc:
            logger.error("Gagal mengirim pesan WhatsApp ke %s: %s", clean_phone, exc)
            return {"error": str(exc), "status": "failed"}
