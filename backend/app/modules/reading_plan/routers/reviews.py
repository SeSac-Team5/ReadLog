from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.modules.reading_plan.deps import get_current_user_id
from app.db import get_db
from app.modules.reading_plan.schemas.review import (
    ReviewEntry,
    ReviewGetResponse,
    ReviewUpsertRequest,
)
from app.modules.reading_plan.services.review_service import (
    delete_review,
    get_review,
    upsert_review,
)

router = APIRouter(prefix="/reviews", tags=["reading-plan:reviews"])


@router.get("/{book_id}", response_model=ReviewGetResponse)
def get_review_endpoint(
    book_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> ReviewGetResponse:
    return ReviewGetResponse(review=get_review(db, user_id=user_id, book_id=book_id))


@router.put("/{book_id}", response_model=ReviewEntry)
def upsert_review_endpoint(
    book_id: int,
    payload: ReviewUpsertRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> ReviewEntry:
    return upsert_review(
        db, user_id=user_id, book_id=book_id, text=payload.review, rating=payload.rating
    )


@router.delete("/{book_id}", status_code=204, response_class=Response)
def delete_review_endpoint(
    book_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> Response:
    delete_review(db, user_id=user_id, book_id=book_id)
    return Response(status_code=204)
