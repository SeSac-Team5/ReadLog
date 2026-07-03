import enum

from sqlalchemy import BigInteger, Boolean, Column, Enum, Float, ForeignKey, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class StickerType(str, enum.Enum):
    EMOJI = "emoji"
    COMMENT = "comment"
    BOOK_COVER = "book_cover"
    PROGRESS_RING = "progress_ring"
    PROGRESS_BAR = "progress_bar"
    PROGRESS_BADGE = "progress_badge"


class SnsSticker(Base):
    __tablename__ = "sns_stickers"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    post_id = Column(BigInteger, ForeignKey("sns_posts.id", ondelete="CASCADE"), nullable=False)
    emoji = Column(String(20), nullable=True)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    scale = Column(Float, nullable=False, default=1.0)
    rotation = Column(Float, nullable=False, default=0.0)
    type = Column(
        Enum(StickerType, native_enum=False, values_callable=lambda cls: [member.value for member in cls]),
        nullable=False,
        default=StickerType.EMOJI,
    )
    content = Column(String(300), nullable=True)
    background_color = Column(String(20), nullable=True)
    visible = Column(Boolean, nullable=False, default=True)

    post = relationship("SnsPost", back_populates="stickers")
