from datetime import date
from typing import Optional

from app.modules.reading_plan.schemas.base import CamelModel


class BookSearchResult(CamelModel):
    isbn13: str
    title: str
    author: Optional[str] = None
    publisher: Optional[str] = None
    cover_url: Optional[str] = None
    page_count: Optional[int] = None
    published_date: Optional[date] = None
    description: Optional[str] = None


class BookSearchResponse(CamelModel):
    items: list[BookSearchResult]
    total_count: int
