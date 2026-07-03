from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.reading_plan.deps import get_current_user_id
from app.db import get_db
from app.modules.reading_plan.schemas.sns import (
    SnsPostCreateRequest,
    SnsPostResponse,
    StickerBulkCreateRequest,
)
from app.modules.reading_plan.services.sns_service import add_stickers, create_post

router = APIRouter(prefix="/sns-posts", tags=["reading-plan:sns"])


@router.post("", response_model=SnsPostResponse, status_code=201)
def create_post_endpoint(
    payload: SnsPostCreateRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> SnsPostResponse:
    return create_post(db, user_id=user_id, payload=payload)


@router.post("/{post_id}/stickers", response_model=SnsPostResponse, status_code=201)
def add_stickers_endpoint(
    post_id: int,
    payload: StickerBulkCreateRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> SnsPostResponse:
    return add_stickers(db, post_id=post_id, user_id=user_id, stickers=payload.stickers)
