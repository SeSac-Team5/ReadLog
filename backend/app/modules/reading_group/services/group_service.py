import secrets
import string
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.modules.reading_group.models.group import (
    ChapterGoal, GroupInvite, GroupMember, MemberRole, ReadingGroup,
)
from app.modules.reading_group.schemas.group import GroupCreate, GroupUpdate
from app.common.exceptions import NotFoundException, ForbiddenException, ConflictException
from app.modules.reading_plan.models.book import Book


def _gen_invite_code(length: int = 9) -> str:
    chars = string.ascii_uppercase + string.digits
    raw = "".join(secrets.choice(chars) for _ in range(8))
    return f"RDLG-{raw[:4]}{raw[4:]}"


def create_group(db: Session, owner_id: int, data: GroupCreate) -> ReadingGroup:
    code = _gen_invite_code()
    group = ReadingGroup(
        owner_id=owner_id,
        book_id=data.book_id,
        name=data.name,
        description=data.description,
        max_member=data.max_member,
        invite_code=code,
        start_date=data.start_date,
        end_date=data.end_date,
    )
    db.add(group)
    db.flush()

    owner_member = GroupMember(group_id=group.id, user_id=owner_id, role=MemberRole.OWNER)
    db.add(owner_member)
    db.commit()
    db.refresh(group)
    return group


def get_group(db: Session, group_id: int) -> ReadingGroup:
    group = db.query(ReadingGroup).filter(ReadingGroup.id == group_id).first()
    if not group:
        raise NotFoundException("독서모임을 찾을 수 없습니다.")
    return group


def list_user_groups(db: Session, user_id: int) -> list[ReadingGroup]:
    return (
        db.query(ReadingGroup)
        .join(GroupMember, GroupMember.group_id == ReadingGroup.id)
        .filter(GroupMember.user_id == user_id)
        .all()
    )


def update_group(db: Session, group_id: int, actor_id: int, data: GroupUpdate) -> ReadingGroup:
    group = get_group(db, group_id)
    # [MANAGER 확장 포인트] MANAGER에게 모임 설정 편집 권한 부여 시 MemberRole.MANAGER 추가.
    _require_role(db, group_id, actor_id, {MemberRole.OWNER})

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(group, field, value)

    db.commit()
    db.refresh(group)
    return group


def delete_group(db: Session, group_id: int, actor_id: int) -> None:
    group = get_group(db, group_id)
    _require_role(db, group_id, actor_id, {MemberRole.OWNER})
    db.delete(group)
    db.commit()


def member_count(db: Session, group_id: int) -> int:
    return db.query(func.count(GroupMember.id)).filter(GroupMember.group_id == group_id).scalar()


def get_book_meta(db: Session, book_id: Optional[int]) -> tuple[Optional[str], Optional[int]]:
    """Returns (cover_url, page_count) for the group's book. Single query."""
    if book_id is None:
        return None, None
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        return None, None
    return book.cover_url, book.page_count


def get_member_role(db: Session, group_id: int, user_id: int) -> Optional[MemberRole]:
    m = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id,
    ).first()
    return m.role if m else None


def _require_role(db: Session, group_id: int, user_id: int, allowed: set[MemberRole]) -> None:
    role = get_member_role(db, group_id, user_id)
    if role not in allowed:
        raise ForbiddenException("권한이 없습니다.")


# ── Chapter Goals ──────────────────────────────────────────────────────────

def add_chapter_goal(db: Session, group_id: int, actor_id: int, chapter_name: str, target_date: datetime) -> ChapterGoal:
    # [MANAGER 확장 포인트] MANAGER에게 챕터 목표 추가 권한 부여 시 MemberRole.MANAGER 추가.
    _require_role(db, group_id, actor_id, {MemberRole.OWNER})
    goal = ChapterGoal(group_id=group_id, chapter_name=chapter_name, target_date=target_date)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def update_chapter_goal(db: Session, goal_id: int, actor_id: int, chapter_name: Optional[str], target_date: Optional[datetime]) -> ChapterGoal:
    goal = db.query(ChapterGoal).filter(ChapterGoal.id == goal_id).first()
    if not goal:
        raise NotFoundException("챕터 목표를 찾을 수 없습니다.")
    # [MANAGER 확장 포인트] MANAGER에게 챕터 목표 수정 권한 부여 시 MemberRole.MANAGER 추가.
    _require_role(db, goal.group_id, actor_id, {MemberRole.OWNER})
    if chapter_name:
        goal.chapter_name = chapter_name
    if target_date:
        goal.target_date = target_date
    db.commit()
    db.refresh(goal)
    return goal
