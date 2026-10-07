import re
from app.models.enums import MilestoneKF, TriageResult


def normalize_reply(text: str, max_options: int = 3) -> int | None:
    """Normalisasi input teks pesan pasien ke angka pilihan deterministik.
    
    Mendukung format angka langsung, teks angka Indonesia, dan kata kunci klinis umum.
    """
    if not text:
        return None

    cleaned = text.strip().lower()

    # 1. Khusus konfirmasi onboarding / persetujuan
    afirmasi_set = {"ya", "ok", "oke", "siap", "setuju", "ikut", "y", "iya", "nggih", "monggo"}
    words = set(re.findall(r"\w+", cleaned))
    if afirmasi_set & words:
        return 1

    # 2. Cari digit terisolasi (misal '1', '1.', 'pilihan 2', 'opsi 3')
    match = re.search(r"\b([1-9])\b", cleaned)
    if match:
        val = int(match.group(1))
        if 1 <= val <= max_options:
            return val

    # 2. Pemetaan kata ejaan angka & kata kunci khas Surabaya/Indonesia
    word_map = {
        "satu": 1,
        "aman": 1,
        "baik": 1,
        "sehat": 1,
        "normal": 1,
        "dua": 2,
        "keluhan": 2,
        "ringan": 2,
        "sakit": 2,
        "nyeri": 2,
        "tiga": 3,
        "bahaya": 3,
        "parah": 3,
        "demam": 3,
        "darah": 2,  # pada KF1 opsi 2 adalah perdarahan
    }

    for word, val in word_map.items():
        if word in cleaned and val <= max_options:
            return val

    return None


def evaluate_triage(milestone: MilestoneKF, option: int) -> tuple[TriageResult, str]:
    """Mengevaluasi status triase berdasarkan standar Buku KIA Kemenkes RI."""
    if milestone == MilestoneKF.ONBOARDING:
        return TriageResult.HIJAU, "Nomor terkonfirmasi aktif, pasien setuju dipantau."

    if milestone == MilestoneKF.KF1:
        if option == 1:
            return TriageResult.HIJAU, "Kondisi baik, perdarahan wajar, tidak ada keluhan."
        return (
            TriageResult.MERAH,
            "Keluhan pusing berat, nyeri perut hebat, atau perdarahan deras membasahi >2 pembalut/jam.",
        )

    if milestone == MilestoneKF.KF2:
        if option == 1:
            return TriageResult.HIJAU, "Lochea merah kecokelatan tidak bau, ASI lancar."
        if option == 2:
            return TriageResult.KUNING, "Payudara bengkak/nyeri atau puting lecet (risiko bendungan ASI)."
        return (
            TriageResult.MERAH,
            "Demam menggigil (>38°C) atau cairan nifas berbau busuk (risiko sepsis puerperalis).",
        )

    if milestone == MilestoneKF.KF3:
        if option == 1:
            return TriageResult.HIJAU, "Luka jahitan membaik, lochea berkurang."
        return (
            TriageResult.MERAH,
            "Bekas jahitan nyeri/terbuka/bernanah, kaki bengkak berat, atau tensi naik.",
        )

    if milestone == MilestoneKF.KF4:
        if option == 1:
            return TriageResult.HIJAU, "Sehat fisik dan mental, rencana KB siap."
        if option == 2:
            return TriageResult.KUNING, "Skrining awal depresi postpartum (sedih berkepanjangan/cemas/sulit tidur)."
        return TriageResult.KUNING, "Kebutuhan konseling pilihan kontrasepsi pascasalin."

    return TriageResult.HIJAU, "Status pemantauan normal."


def get_triage_response_message(
    triage: TriageResult,
    nama_ibu: str,
    nama_bidan: str,
    nama_faskes: str,
    no_bidan: str,
) -> str:
    """Format pesan balasan sistem ke pasien berdasarkan hasil triase."""
    clean_no_bidan = re.sub(r"\D", "", no_bidan)
    if clean_no_bidan.startswith("0"):
        clean_no_bidan = "62" + clean_no_bidan[1:]

    if triage == TriageResult.MERAH:
        return (
            f"PERINGATAN KESEHATAN: Ibu {nama_ibu}, gejala yang dilaporkan membutuhkan pemeriksaan segera oleh bidan/dokter. "
            f"Bidan {nama_bidan} ({nama_faskes}) telah kami beritahu. Kontak Bidan: wa.me/{clean_no_bidan}. "
            f"Jika kondisi terasa lemas, segera ke IGD Puskesmas/RS terdekat bersama keluarga."
        )

    if triage == TriageResult.KUNING:
        return (
            f"Terima kasih atas laporannya Ibu {nama_ibu}. Keluhan Ibu telah diteruskan ke Bidan {nama_bidan} di {nama_faskes}. "
            f"Bidan akan segera menghubungi Ibu via WhatsApp untuk memberikan panduan penanganan lanjutan."
        )

    return (
        f"Alhamdulillah, terima kasih Ibu {nama_ibu}. Kondisi pemulihan terpantau baik. "
        f"Tetap cukupi asupan cairan, nutrisi bergizi, istirahat saat bayi tidur, dan berikan ASI eksklusif."
    )


def get_fallback_message(nama_ibu: str, nama_bidan: str, no_bidan: str) -> str:
    """Pesan santun jika input pasien tidak terbaca oleh normalizer angka."""
    clean_no = re.sub(r"\D", "", no_bidan)
    if clean_no.startswith("0"):
        clean_no = "62" + clean_no[1:]

    return (
        f"Mohon maaf Ibu {nama_ibu}, sistem otomatis hanya dapat memproses balasan berupa angka pilihan (misal: 1, 2, atau 3). "
        f"Mohon balas dengan angka kondisi yang sesuai ya Bu. "
        f"Jika ada keluhan mendesak, Ibu dapat langsung menghubungi Bidan {nama_bidan} di wa.me/{clean_no}."
    )
