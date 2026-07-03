# =====================================================
# genre_interest.py — 관심장르 테이블 모델
# =====================================================

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String, UniqueConstraint, func
from app.db.base import Base


class UserGenreInterest(Base):
    """
    user_genre_interests 테이블과 1:1로 대응.

    사용자 한 명이 여러 장르를 관심 등록할 수 있어서
    (user_id, genre) 조합 1행 = 관심 장르 1개.
    같은 유저가 같은 장르를 두 번 등록하지 못하도록 UNIQUE 제약.
    """
    __tablename__ = "user_genre_interests"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # 고정 장르 목록 중 하나 (검증은 schemas/genre.py의 GENRE_CHOICES에서 수행)
    genre = Column(String(30), nullable=False)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "genre", name="uq_user_genre"),
    )
