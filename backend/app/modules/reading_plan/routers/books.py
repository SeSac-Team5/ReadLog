from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.reading_plan.schemas.book import BookSearchResponse
from app.modules.reading_plan.services.book_service import search_books

router = APIRouter(prefix="/books", tags=["reading-plan:books"])


@router.get("/search", response_model=BookSearchResponse)
async def search_books_endpoint(
    query: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50, alias="pageSize"),
    db: Session = Depends(get_db),
) -> BookSearchResponse:
    return await search_books(db, query=query, page=page, page_size=page_size)
