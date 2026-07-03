from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.common.deps import get_current_user
from app.modules.reading_group.schemas.group import (
    GroupCreate, GroupResponse, GroupUpdate, ChapterGoalCreate, ChapterGoalResponse, ChapterGoalUpdate,
)
from app.modules.reading_group.services import group_service

router = APIRouter(prefix="/groups", tags=["reading-group"])


@router.get("", response_model=list[GroupResponse])
def list_my_groups(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    groups = group_service.list_user_groups(db, current_user.id)
    result = []
    for g in groups:
        count = group_service.member_count(db, g.id)
        r = GroupResponse.model_validate(g)
        r.member_count = count
        result.append(r)
    return result


@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(
    data: GroupCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    group = group_service.create_group(db, current_user.id, data)
    r = GroupResponse.model_validate(group)
    r.member_count = 1
    return r


@router.get("/{group_id}", response_model=GroupResponse)
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    group = group_service.get_group(db, group_id)
    r = GroupResponse.model_validate(group)
    r.member_count = group_service.member_count(db, group_id)
    return r


@router.patch("/{group_id}/settings", response_model=GroupResponse)
def update_group(
    group_id: int,
    data: GroupUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    group = group_service.update_group(db, group_id, current_user.id, data)
    r = GroupResponse.model_validate(group)
    r.member_count = group_service.member_count(db, group_id)
    return r


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    group_service.delete_group(db, group_id, current_user.id)


# ── Chapter Goals ──────────────────────────────────────────────────────────

@router.get("/{group_id}/chapter-goals", response_model=list[ChapterGoalResponse])
def list_chapter_goals(
    group_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    group = group_service.get_group(db, group_id)
    return group.chapter_goals


@router.post("/{group_id}/chapter-goals", response_model=ChapterGoalResponse, status_code=status.HTTP_201_CREATED)
def add_chapter_goal(
    group_id: int,
    data: ChapterGoalCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return group_service.add_chapter_goal(db, group_id, current_user.id, data.chapter_name, data.target_date)


@router.patch("/{group_id}/chapter-goals/{goal_id}", response_model=ChapterGoalResponse)
def update_chapter_goal(
    group_id: int,
    goal_id: int,
    data: ChapterGoalUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return group_service.update_chapter_goal(db, goal_id, current_user.id, data.chapter_name, data.target_date)
