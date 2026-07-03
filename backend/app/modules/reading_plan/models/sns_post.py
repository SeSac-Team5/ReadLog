from sqlalchemy import TIMESTAMP, BigInteger, Column, ForeignKey, Text, func
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import relationship

from app.db.base import Base


class SnsPost(Base):
    __tablename__ = "sns_posts"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id = Column(BigInteger, ForeignKey("books.id", ondelete="SET NULL"), nullable=True)
    # LONGTEXT because we currently store the captured image as a base64 data: URI
    # directly (no object storage yet) — see docs/reading-plan-tradeoffs.md.
    image_url = Column(LONGTEXT, nullable=True)
    content = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    stickers = relationship("SnsSticker", back_populates="post", cascade="all, delete-orphan")
