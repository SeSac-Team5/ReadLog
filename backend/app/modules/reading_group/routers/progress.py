from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.common.deps import get_current_user
from app.modules.reading_group.schemas.group import ProgressCreate, ProgressResponse
from app.modules.reading_group.services import progress_service

router = APIRouter(prefix="/groups", tags=["reading-group"])


@router.get("/{group_id}/progress", response_model=list[ProgressResponse])
def list_progress(
    group_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return progress_service.list_group_progress(db, group_id, current_user.id)


@router.post("/{group_id}/progress", response_model=ProgressResponse, status_code=status.HTTP_201_CREATED)
def share_progress(
    group_id: int,
    data: ProgressCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return progress_service.create_progress(db, group_id, current_user.id, data)
