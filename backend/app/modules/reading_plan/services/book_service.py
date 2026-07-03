from datetime import date
from typing import Optional

from sqlalchemy.orm import Session

from app.modules.reading_plan.models.book import Book
from app.modules.reading_plan.schemas.book import BookSearchResponse, BookSearchResult
from app.modules.reading_plan.services.aladin_client import (
    lookup_book_by_isbn,
    search_books_from_aladin,
)


def _parse_published_date(raw: Optional[str]) -> Optional[date]:
    if not raw:
        return None
    try:
        return date.fromisoformat(raw)
    except ValueError:
        return None


def _merge_with_existing_book(item: BookSearchResult, existing: Optional[Book]) -> BookSearchResult:
    if not existing:
        return item

    return BookSearchResult(
        isbn13=item.isbn13,
        title=existing.title or item.title,
        author=existing.author or item.author,
        publisher=existing.publisher or item.publisher,
        cover_url=existing.cover_url or item.cover_url,
        page_count=existing.page_count or item.page_count,
        published_date=existing.published_date or item.published_date,
        description=existing.description or item.description,
    )


async def search_books(db: Session, query: str, page: int, page_size: int) -> BookSearchResponse:
    raw = await search_books_from_aladin(query=query, page=page, page_size=page_size)
    items = [
        BookSearchResult(
            isbn13=item.get("isbn13") or item.get("isbn") or "",
            title=item.get("title", ""),
            author=item.get("author"),
            publisher=item.get("publisher"),
            cover_url=item.get("cover"),
            page_count=(item.get("subInfo") or {}).get("itemPage"),
            published_date=_parse_published_date(item.get("pubDate")),
            description=item.get("description"),
        )
        for item in raw.get("item", [])
    ]

    isbn_list = [item.isbn13 for item in items if item.isbn13]
    existing_by_isbn = {}
    if isbn_list:
        existing_by_isbn = {
            book.isbn13: book
            for book in db.query(Book).filter(Book.isbn13.in_(isbn_list)).all()
        }

    merged_items = [
        _merge_with_existing_book(item, existing_by_isbn.get(item.isbn13)) for item in items
    ]

    return BookSearchResponse(items=merged_items, total_count=raw.get("totalResults", len(items)))


def get_or_create_book(db: Session, book_input: BookSearchResult) -> Book:
    book = db.query(Book).filter(Book.isbn13 == book_input.isbn13).first()
    if book:
        return book

    page_count = book_input.page_count
    if not page_count and book_input.isbn13:
        looked_up = lookup_book_by_isbn(book_input.isbn13)
        if looked_up:
            page_count = (looked_up.get("subInfo") or {}).get("itemPage") or page_count

    book = Book(
        isbn13=book_input.isbn13,
        title=book_input.title,
        author=book_input.author,
        publisher=book_input.publisher,
        description=book_input.description,
        cover_url=book_input.cover_url,
        page_count=page_count,
        published_date=book_input.published_date,
    )
    db.add(book)
    db.flush()
    return book
