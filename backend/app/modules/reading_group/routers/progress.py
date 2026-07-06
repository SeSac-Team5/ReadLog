from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.common.deps import get_current_user
from app.modules.reading_group.schemas.group import ProgressCreate, ProgressUpdate, ProgressResponse
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


@router.patch("/{group_id}/progress/{progress_id}", response_model=ProgressResponse)
def update_progress(
    group_id: int,
    progress_id: int,
    data: ProgressUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return progress_service.update_progress(db, group_id, progress_id, current_user.id, data)


@router.delete("/{group_id}/progress/{progress_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_progress(
    group_id: int,
    progress_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    progress_service.delete_progress(db, group_id, progress_id, current_user.id)


@router.delete("/{group_id}/progress/{progress_id}/dismiss", status_code=status.HTTP_204_NO_CONTENT)
def dismiss_progress_notice(
    group_id: int,
    progress_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    progress_service.dismiss_progress_notice(db, group_id, progress_id, current_user.id)
