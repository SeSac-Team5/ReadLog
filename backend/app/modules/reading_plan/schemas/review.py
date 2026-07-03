from datetime import datetime
from typing import Optional

from app.modules.reading_plan.schemas.base import CamelModel


class ReviewUpsertRequest(CamelModel):
    review: str
    rating: Optional[float] = None


class ReviewEntry(CamelModel):
    id: str
    book_id: str
    rating: Optional[float] = None
    review: str
    created_at: datetime
    updated_at: datetime


class ReviewGetResponse(CamelModel):
    review: Optional[ReviewEntry] = None
