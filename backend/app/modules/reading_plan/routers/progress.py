from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.common.deps import get_current_user_id
from app.db.session import get_db
from app.modules.reading_plan.schemas.progress import (
    ProgressCreateRequest,
    ProgressCreateResponse,
    ProgressLogListResponse,
)
from app.modules.reading_plan.services.progress_service import add_progress_log, list_progress_logs

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
