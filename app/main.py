import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from app.api.v1 import api_router
from app.core.config import settings
from app.db.seed import seed_database
from app.db.prd_seed import seed_prd_data
from app.models.prd_models import MRumahSakit
from app.db.session import engine, init_db
from app.models.faskes import Faskes
from app.services.scheduler import scheduler, start_scheduler, stop_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("pengmas-nifas")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Inisialisasi tabel basis data
    logger.info("Menginisialisasi skema basis data...")
    init_db()

    # 2. Cek dan jalankan seeder otomatis jika basis data masih kosong
    with Session(engine) as session:
        has_faskes = session.exec(select(Faskes)).first()
        if not has_faskes:
            logger.info("Basis data baru terdeteksi: menjalankan seeder 13 Faskes Surabaya...")
            seed_database()
        has_rs = session.exec(select(MRumahSakit)).first()
        if not has_rs:
            logger.info("Basis data baru terdeteksi: menjalankan seeder PRD Wilayah & RS Surabaya...")
            seed_prd_data()

    # 3. Jalankan background scheduler harian pukul 08.00 WIB
    start_scheduler()

    yield

    # 4. Matikan background scheduler saat aplikasi berhenti
    stop_scheduler()


app = FastAPI(
    title=settings.app_name,
    description=(
        "Backend API sistem pemantauan kesehatan ibu nifas terautomasi berbasis WhatsApp Cloud API "
        "dan PWA Triase Bidan Faskes (Kegiatan Pengabdian Masyarakat Surabaya)."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

# CORS Middleware (mendukung PWA frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Daftarkan Router API v1
app.include_router(api_router)


@app.get("/", tags=["Info"])
def root():
    return {
        "app": settings.app_name,
        "version": "2.0.0",
        "docs_url": "/docs",
        "status": "online",
        "description": "Sistem Monitoring Nifas Surabaya (Strictly No LLM - Rule-Based Buku KIA)",
    }


@app.get("/health", tags=["Info"])
def health_check():
    db_type = "postgresql" if "postgresql" in str(engine.url) else "sqlite"
    return {
        "status": "healthy",
        "database": db_type,
        "scheduler_running": scheduler.running,
        "environment": settings.app_env,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=True)
