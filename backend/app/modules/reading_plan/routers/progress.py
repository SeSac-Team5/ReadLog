from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.reading_plan.deps import get_current_user_id
from app.db import get_db
from app.modules.reading_plan.schemas.progress import (
    LibraryCommentListResponse,
    ProgressActivityListResponse,
    ProgressCreateRequest,
    ProgressCreateResponse,
    ProgressLogListResponse,
)
from app.modules.reading_plan.services.progress_service import (
    add_progress_log,
    list_library_comments,
    list_progress_activity,
    list_progress_logs,
)

router = APIRouter(prefix="/library", tags=["reading-plan:progress"])


@router.post("/{library_id}/progress", response_model=ProgressCreateResponse, status_code=201)
def add_progress_endpoint(
    library_id: int,
    payload: ProgressCreateRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> ProgressCreateResponse:
    log, library = add_progress_log(
        db,
        library_id=library_id,
        user_id=user_id,
        page=payload.page,
        percent=payload.percent,
        memo=payload.memo,
    )
    return ProgressCreateResponse(log=log, library=library)


@router.get("/{library_id}/progress-logs", response_model=ProgressLogListResponse)
def list_progress_endpoint(
    library_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> ProgressLogListResponse:
    items = list_progress_logs(db, library_id=library_id, user_id=user_id)
    return ProgressLogListResponse(items=items)


@router.get("/comments", response_model=LibraryCommentListResponse)
def list_library_comments_endpoint(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> LibraryCommentListResponse:
    items = list_library_comments(db, user_id=user_id)
    return LibraryCommentListResponse(items=items)


@router.get("/progress-activity", response_model=ProgressActivityListResponse)
def list_progress_activity_endpoint(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> ProgressActivityListResponse:
    items = list_progress_activity(db, user_id=user_id)
    return ProgressActivityListResponse(items=items)
