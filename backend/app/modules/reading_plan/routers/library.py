from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.modules.reading_plan.deps import get_current_user_id
from app.db import get_db
from app.modules.reading_plan.schemas.library import (
    LibraryCreateRequest,
    LibraryListResponse,
    UserLibraryItem,
)
from app.modules.reading_plan.services.library_service import (
    add_to_library,
    list_library,
    remove_from_library,
)

router = APIRouter(prefix="/library", tags=["reading-plan:library"])


@router.post("", response_model=UserLibraryItem, status_code=201)
def add_to_library_endpoint(
    payload: LibraryCreateRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> UserLibraryItem:
    return add_to_library(db, user_id=user_id, book_input=payload.book, status=payload.status)


@router.get("", response_model=LibraryListResponse)
def list_library_endpoint(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> LibraryListResponse:
    return list_library(db, user_id=user_id)


@router.delete("/{library_id}", status_code=204, response_class=Response)
def remove_from_library_endpoint(
    library_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> Response:
    remove_from_library(db, user_id=user_id, library_id=library_id)
    return Response(status_code=204)
