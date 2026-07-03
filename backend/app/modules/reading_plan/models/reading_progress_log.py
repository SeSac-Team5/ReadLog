from sqlalchemy import TIMESTAMP, BigInteger, Column, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class ReadingProgressLog(Base):
    __tablename__ = "reading_progress_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    library_id = Column(BigInteger, ForeignKey("user_library.id", ondelete="CASCADE"), nullable=False)
    page = Column(Integer, nullable=True)
    percent = Column(Float, nullable=True)
    memo = Column(String(300), nullable=True)
    recorded_at = Column(TIMESTAMP, server_default=func.now())

    library_entry = relationship("UserLibrary", back_populates="progress_logs")
