from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.common.deps import get_current_user
from app.modules.reading_group.schemas.group import DelegateRequest, MemberResponse
from app.modules.reading_group.services import member_service

router = APIRouter(prefix="/groups", tags=["reading-group"])


@router.get("/{group_id}/members", response_model=list[MemberResponse])
def list_members(
    group_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return member_service.list_members(db, group_id)


@router.delete("/{group_id}/members/me", status_code=status.HTTP_204_NO_CONTENT)
def leave_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    member_service.leave_group(db, group_id, current_user.id)


@router.delete("/{group_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def kick_member(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    member_service.kick_member(db, group_id, current_user.id, user_id)


@router.post("/{group_id}/members/{user_id}/delegate", status_code=status.HTTP_204_NO_CONTENT)
def delegate_ownership(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    member_service.delegate_ownership(db, group_id, current_user.id, user_id)


@router.post("/{group_id}/members/{user_id}/promote", response_model=MemberResponse)
def promote_to_manager(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return member_service.promote_to_manager(db, group_id, current_user.id, user_id)
