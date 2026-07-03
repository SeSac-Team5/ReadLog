from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.common.deps import get_current_user
from app.modules.reading_group.schemas.group import InviteCreate, InviteResponse, JoinGroupRequest, MemberResponse
from app.modules.reading_group.services import invite_service

router = APIRouter(prefix="/groups", tags=["reading-group"])


@router.post("/{group_id}/invite", response_model=InviteResponse, status_code=status.HTTP_201_CREATED)
def create_temp_invite(
    group_id: int,
    data: InviteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return invite_service.create_temp_invite(db, group_id, data.expires_hours)


@router.post("/{group_id}/join", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
def join_group(
    group_id: int,
    data: JoinGroupRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return invite_service.join_by_code(db, current_user.id, data.code)
