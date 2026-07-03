from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.reading_plan.models.sns_post import SnsPost
from app.modules.reading_plan.models.sns_sticker import SnsSticker
from app.modules.reading_plan.schemas.sns import (
    SnsPostCreateRequest,
    SnsPostResponse,
    StickerEntry,
    StickerInput,
)


def _to_sticker_entry(sticker: SnsSticker) -> StickerEntry:
    return StickerEntry(
        id=str(sticker.id),
        type=sticker.type,
        emoji=sticker.emoji,
        content=sticker.content,
        background_color=sticker.background_color,
        x=sticker.x,
        y=sticker.y,
        scale=sticker.scale,
        rotation=sticker.rotation,
        visible=sticker.visible,
    )


def _to_post_response(post: SnsPost) -> SnsPostResponse:
    return SnsPostResponse(
        id=str(post.id),
        book_id=str(post.book_id) if post.book_id else None,
        image_url=post.image_url,
        content=post.content,
        created_at=post.created_at,
        stickers=[_to_sticker_entry(sticker) for sticker in post.stickers],
    )


def create_post(db: Session, user_id: int, payload: SnsPostCreateRequest) -> SnsPostResponse:
    post = SnsPost(
        user_id=user_id,
        book_id=int(payload.book_id) if payload.book_id else None,
        image_url=payload.image_url,
        content=payload.content,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return _to_post_response(post)


def _get_owned_post(db: Session, post_id: int, user_id: int) -> SnsPost:
    post = db.query(SnsPost).filter(SnsPost.id == post_id, SnsPost.user_id == user_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시물을 찾을 수 없습니다")
    return post


def add_stickers(
    db: Session, post_id: int, user_id: int, stickers: list[StickerInput]
) -> SnsPostResponse:
    post = _get_owned_post(db, post_id, user_id)
    for sticker_input in stickers:
        db.add(
            SnsSticker(
                post_id=post.id,
                type=sticker_input.type,
                emoji=sticker_input.emoji,
                content=sticker_input.content,
                background_color=sticker_input.background_color,
                x=sticker_input.x,
                y=sticker_input.y,
                scale=sticker_input.scale,
                rotation=sticker_input.rotation,
                visible=sticker_input.visible,
            )
        )
    db.commit()
    db.refresh(post)
    return _to_post_response(post)
