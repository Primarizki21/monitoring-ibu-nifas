import asyncio
import logging
from datetime import date, datetime, timedelta, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlmodel import Session, select
from app.core.config import settings
from app.db.session import engine
from app.models.enums import MilestoneKF, ScheduleStatus, StatusPemantauan
from app.models.mother import Mother
from app.models.screening import ScreeningSchedule
from app.services.whatsapp_service import send_whatsapp_message

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


def calculate_kf_dates(waktu_persalinan: datetime) -> dict[MilestoneKF, date]:
    """Menghitung tanggal jatuh tempo KF1 s/d KF4 sesuai linimasa nifas."""
    d_date = waktu_persalinan.date()
    return {
        MilestoneKF.KF1: d_date + timedelta(days=1),   # H+1 (rentang 6 jam - 2 hari)
        MilestoneKF.KF2: d_date + timedelta(days=4),   # H+4 (rentang 3 - 7 hari)
        MilestoneKF.KF3: d_date + timedelta(days=14),  # H+14 (rentang 8 - 28 hari)
        MilestoneKF.KF4: d_date + timedelta(days=35),  # H+35 (rentang 29 - 42 hari)
    }


def create_schedules_for_mother(session: Session, mother: Mother) -> list[ScreeningSchedule]:
    """Mendaftarkan jadwal otomatis KF1 s/d KF4 untuk ibu nifas baru."""
    kf_dates = calculate_kf_dates(mother.waktu_persalinan)
    created = []
    for milestone, target_d in kf_dates.items():
        schedule = ScreeningSchedule(
            mother_id=mother.id,
            milestone=milestone,
            target_date=target_d,
            status_pengiriman=ScheduleStatus.SCHEDULED,
        )
        session.add(schedule)
        created.append(schedule)
    session.commit()
    return created


def get_screening_prompt(milestone: MilestoneKF, nama_ibu: str) -> str:
    """Template pesan pertanyaan skrining sesuai Buku KIA Kemenkes."""
    if milestone == MilestoneKF.KF1:
        return (
            f"Selamat pagi Ibu {nama_ibu}. Bagaimana kondisi pemulihan hari ini? "
            f"Mohon pilih salah satu kondisi yang paling menggambarkan keadaan Ibu saat ini:\n"
            f"1. Kondisi baik, perdarahan wajar, tidak ada keluhan.\n"
            f"2. Ada keluhan pusing hebat, pandangan kabur, nyeri perut berat, atau darah keluar deras.\n\n"
            f"Balas dengan angka 1 atau 2."
        )
    if milestone == MilestoneKF.KF2:
        return (
            f"Selamat pagi Ibu {nama_ibu}. Bagaimana kondisi cairan nifas dan payudara hari ini?\n"
            f"1. Aman: cairan berwarna merah kecokelatan tidak berbau busuk, ASI lancar.\n"
            f"2. Keluhan Ringan: payudara bengkak/nyeri, puting lecet.\n"
            f"3. Bahaya: demam menggigil (>38°C), darah nifas berbau busuk.\n\n"
            f"Balas dengan angka 1, 2, atau 3."
        )
    if milestone == MilestoneKF.KF3:
        return (
            f"Selamat pagi Ibu {nama_ibu}. Bagaimana kondisi bekas jahitan dan tubuh Ibu saat ini?\n"
            f"1. Baik: luka membaik/kering, cairan nifas makin sedikit.\n"
            f"2. Keluhan: bekas jahitan nyeri/terbuka/bernanah, kaki bengkak berat, atau tensi naik.\n\n"
            f"Balas dengan angka 1 atau 2."
        )
    if milestone == MilestoneKF.KF4:
        return (
            f"Selamat pagi Ibu {nama_ibu}. Masa nifas hampir selesai (hari ke-42). Bagaimana perasaan dan rencana kesehatan Ibu?\n"
            f"1. Sehat fisik dan mental, sudah ada rencana KB pascasalin.\n"
            f"2. Cemas berat, sedih berkepanjangan, susah tidur (baby blues/depresi).\n"
            f"3. Belum paham pilihan KB pascasalin.\n\n"
            f"Balas dengan angka 1, 2, atau 3."
        )
    return f"Halo Ibu {nama_ibu}, bagaimana kondisi kesehatan pemulihan hari ini?"


async def run_daily_screening_job():
    """Tugas harian pemindaian antrean dan pengiriman pesan skrining KF pukul 08.00 WIB."""
    logger.info("Memulai proses eksekusi pengiriman skrining harian nifas...")
    today = date.today()

    with Session(engine) as session:
        statement = (
            select(ScreeningSchedule, Mother)
            .join(Mother, ScreeningSchedule.mother_id == Mother.id)
            .where(
                ScreeningSchedule.target_date <= today,
                ScreeningSchedule.status_pengiriman == ScheduleStatus.SCHEDULED,
                Mother.status_pemantauan == StatusPemantauan.AKTIF,
            )
        )
        results = session.exec(statement).all()
        logger.info("Ditemukan %d jadwal nifas yang jatuh tempo hari ini (%s).", len(results), today)

        delay_seconds = 1.0 / max(1, settings.rate_limit_messages_per_second)

        for schedule, mother in results:
            prompt_text = get_screening_prompt(schedule.milestone, mother.nama_ibu)
            res = await send_whatsapp_message(mother.no_wa_ibu, prompt_text)

            schedule.status_pengiriman = ScheduleStatus.SENT
            schedule.sent_at = datetime.now(timezone.utc)
            if "messages" in res and res["messages"]:
                schedule.waba_message_id = res["messages"][0].get("id")

            session.add(schedule)
            session.commit()

            # Rate limiting interval
            await asyncio.sleep(delay_seconds)

    logger.info("Pengiriman skrining harian nifas selesai.")


def start_scheduler():
    """Memulai background scheduler jika diaktifkan di konfigurasi."""
    if not settings.enable_scheduler:
        logger.info("Background scheduler dinonaktifkan via konfigurasi.")
        return

    trigger = CronTrigger(
        hour=settings.scheduler_hour_wib,
        minute=settings.scheduler_minute_wib,
        timezone="Asia/Jakarta",
    )
    scheduler.add_job(
        run_daily_screening_job,
        trigger=trigger,
        id="daily_nifas_screening",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(
        "Scheduler nifas aktif: berjalan setiap hari pukul %02d:%02d WIB.",
        settings.scheduler_hour_wib,
        settings.scheduler_minute_wib,
    )


def stop_scheduler():
    """Menghentikan background scheduler saat aplikasi shutdown."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler nifas dimatikan.")
