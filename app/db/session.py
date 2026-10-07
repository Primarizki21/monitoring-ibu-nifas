import logging
from collections.abc import Generator
from sqlalchemy import text
from sqlmodel import Session, SQLModel, create_engine
from app.core.config import settings

logger = logging.getLogger(__name__)


def build_engine():
    db_url = settings.database_url
    try:
        if db_url.startswith("postgresql"):
            # Coba koneksi ke PostgreSQL dengan timeout 2 detik
            test_engine = create_engine(
                db_url,
                pool_pre_ping=True,
                connect_args={"connect_timeout": 2},
            )
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Terhubung ke PostgreSQL database: %s", db_url.split("@")[-1])
            return test_engine
    except Exception as exc:
        logger.warning(
            "PostgreSQL tidak dapat dijangkau (%s). Beralih ke fallback SQLite: %s",
            exc,
            settings.sqlite_fallback_url,
        )

    # Fallback ke SQLite untuk developer lokal
    connect_args = {"check_same_thread": False} if "sqlite" in settings.sqlite_fallback_url else {}
    return create_engine(
        settings.sqlite_fallback_url,
        connect_args=connect_args,
        pool_pre_ping=True,
    )


engine = build_engine()


def init_db() -> None:
    """Inisialisasi seluruh tabel basis data sesuai model SQLModel."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Dependency injection session basis data untuk FastAPI endpoint."""
    with Session(engine) as session:
        yield session
