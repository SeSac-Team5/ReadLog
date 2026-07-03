from datetime import datetime
from typing import Optional

from app.modules.reading_plan.models.sns_sticker import StickerType
from app.modules.reading_plan.schemas.base import CamelModel


class StickerInput(CamelModel):
    type: StickerType
    emoji: Optional[str] = None
    content: Optional[str] = None
    background_color: Optional[str] = None
    x: float
    y: float
    scale: float = 1.0
    rotation: float = 0.0
    visible: bool = True


class StickerEntry(StickerInput):
    id: str


class SnsPostCreateRequest(CamelModel):
    book_id: Optional[str] = None
    image_url: str
    content: Optional[str] = None


class StickerBulkCreateRequest(CamelModel):
    stickers: list[StickerInput]


class SnsPostResponse(CamelModel):
    id: str
    book_id: Optional[str] = None
    image_url: Optional[str] = None
    content: Optional[str] = None
    created_at: datetime
    stickers: list[StickerEntry] = []
