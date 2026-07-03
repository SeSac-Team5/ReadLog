from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.common.deps import get_current_user
from app.modules.reading_group.schemas.group import CommentCreate, CommentResponse, ReactionCreate
from app.modules.reading_group.services import comment_service

router = APIRouter(prefix="/groups", tags=["reading-group"])


@router.get("/{group_id}/comments", response_model=list[CommentResponse])
def list_comments(
    group_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return comment_service.list_comments(db, group_id, current_user.id)


@router.post("/{group_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    group_id: int,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return comment_service.create_comment(db, group_id, current_user.id, data)


@router.delete("/{group_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    group_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    comment_service.delete_comment(db, comment_id, current_user.id)


@router.post("/{group_id}/comments/{comment_id}/reactions")
def toggle_reaction(
    group_id: int,
    comment_id: int,
    data: ReactionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return comment_service.toggle_reaction(db, comment_id, current_user.id, data)
