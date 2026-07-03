from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.base import Base  # noqa: F401 — re-export for other modules

_engine_no_db = create_engine(settings.DATABASE_URL_NO_DB, echo=False)

engine = create_engine(
    settings.DATABASE_URL_SYNC,
    echo=settings.APP_ENV == "development",
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_database() -> None:
    with _engine_no_db.connect() as conn:
        conn.execute(
            text(
                f"CREATE DATABASE IF NOT EXISTS `{settings.MYSQL_DB}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        )
        conn.commit()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
