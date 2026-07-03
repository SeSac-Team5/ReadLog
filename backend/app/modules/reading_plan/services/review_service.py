from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.reading_plan.models.review import Review
from app.modules.reading_plan.schemas.review import ReviewEntry


def _to_entry(review: Review) -> ReviewEntry:
    return ReviewEntry(
        id=str(review.id),
        book_id=str(review.book_id),
        rating=float(review.rating) if review.rating is not None else None,
        review=review.review,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


def _find(db: Session, user_id: int, book_id: int) -> Optional[Review]:
    return (
        db.query(Review)
        .filter(Review.user_id == user_id, Review.book_id == book_id)
        .first()
    )


def get_review(db: Session, user_id: int, book_id: int) -> Optional[ReviewEntry]:
    review = _find(db, user_id, book_id)
    return _to_entry(review) if review else None


def upsert_review(
    db: Session, user_id: int, book_id: int, text: str, rating: Optional[float]
) -> ReviewEntry:
    review = _find(db, user_id, book_id)
    if review:
        review.review = text
        review.rating = rating
    else:
        review = Review(user_id=user_id, book_id=book_id, review=text, rating=rating)
        db.add(review)

    db.commit()
    db.refresh(review)
    return _to_entry(review)


def delete_review(db: Session, user_id: int, book_id: int) -> None:
    review = _find(db, user_id, book_id)
    if not review:
        raise HTTPException(status_code=404, detail="한줄평을 찾을 수 없습니다")
    db.delete(review)
    db.commit()
