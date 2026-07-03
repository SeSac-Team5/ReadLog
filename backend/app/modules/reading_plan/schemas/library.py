from datetime import date
from typing import Optional

from app.modules.reading_plan.models.enums import LibraryStatus
from app.modules.reading_plan.schemas.base import CamelModel
from app.modules.reading_plan.schemas.book import BookSearchResult


class LibraryCreateRequest(CamelModel):
    book: BookSearchResult
    status: LibraryStatus


class LibraryBookSummary(CamelModel):
    id: str
    isbn13: str
    title: str
    author: Optional[str] = None
    publisher: Optional[str] = None
    cover_url: Optional[str] = None
    page_count: Optional[int] = None
    description: Optional[str] = None
    published_date: Optional[date] = None


class UserLibraryItem(CamelModel):
    id: str
    book: LibraryBookSummary
    status: LibraryStatus
    current_page: int
    rating: Optional[float] = None
    started_at: Optional[date] = None
    completed_at: Optional[date] = None


class LibraryListResponse(CamelModel):
    items: list[UserLibraryItem]
