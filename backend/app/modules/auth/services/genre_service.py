# =====================================================
# services/genre_service.py — 관심장르 비즈니스 로직
# =====================================================

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models.genre_interest import UserGenreInterest
from app.modules.auth.models.user import User


async def get_genres(db: AsyncSession, user: User) -> list[str]:
    """유저가 등록한 관심장르 목록 조회."""
    result = await db.execute(
        select(UserGenreInterest.genre)
        .where(UserGenreInterest.user_id == user.id)
        .order_by(UserGenreInterest.id)
    )
    return list(result.scalars().all())


async def set_genres(db: AsyncSession, user: User, genres: list[str]) -> list[str]:
    """
    관심장르 전체 교체.
    기존 등록분을 모두 지우고 새로 받은 목록으로 다시 저장한다 (단순한 replace 방식).
    """
    await db.execute(delete(UserGenreInterest).where(UserGenreInterest.user_id == user.id))
    for genre in genres:
        db.add(UserGenreInterest(user_id=user.id, genre=genre))
    await db.commit()
    return genres
