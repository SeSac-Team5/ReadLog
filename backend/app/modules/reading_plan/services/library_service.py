from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.reading_plan.models.enums import LibraryStatus
from app.modules.reading_plan.models.user_library import UserLibrary
from app.modules.reading_plan.schemas.book import BookSearchResult
from app.modules.reading_plan.schemas.library import (
    LibraryBookSummary,
    LibraryListResponse,
    UserLibraryItem,
)
from app.modules.reading_plan.services.book_service import get_or_create_book


def to_library_item_response(entry: UserLibrary) -> UserLibraryItem:
    return UserLibraryItem(
        id=str(entry.id),
        book=LibraryBookSummary(
            id=str(entry.book.id),
            isbn13=entry.book.isbn13,
            title=entry.book.title,
            author=entry.book.author,
            publisher=entry.book.publisher,
            cover_url=entry.book.cover_url,
            page_count=entry.book.page_count,
            description=entry.book.description,
            published_date=entry.book.published_date,
        ),
        status=entry.status,
        current_page=entry.current_page,
        rating=float(entry.rating) if entry.rating is not None else None,
        started_at=entry.started_at,
        completed_at=entry.completed_at,
    )


def add_to_library(
    db: Session,
    user_id: int,
    book_input: BookSearchResult,
    status: LibraryStatus,
) -> UserLibraryItem:
    book = get_or_create_book(db, book_input)
    entry = (
        db.query(UserLibrary)
        .filter(UserLibrary.user_id == user_id, UserLibrary.book_id == book.id)
        .first()
    )
    if entry:
        entry.status = status
    else:
        entry = UserLibrary(user_id=user_id, book_id=book.id, status=status)
        db.add(entry)

    db.commit()
    db.refresh(entry)
    return to_library_item_response(entry)


def list_library(db: Session, user_id: int) -> LibraryListResponse:
    entries = db.query(UserLibrary).filter(UserLibrary.user_id == user_id).all()
    return LibraryListResponse(items=[to_library_item_response(entry) for entry in entries])


def remove_from_library(db: Session, user_id: int, library_id: int) -> None:
    entry = (
        db.query(UserLibrary)
        .filter(UserLibrary.id == library_id, UserLibrary.user_id == user_id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="내 서재에서 책을 찾을 수 없습니다")
    db.delete(entry)
    db.commit()
