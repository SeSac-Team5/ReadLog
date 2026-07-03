from sqlalchemy.orm import Session

from app.modules.reading_group.models.group import GroupMember, ReadingProgress
from app.modules.reading_group.schemas.group import ProgressCreate
from app.modules.reading_group.services.group_service import get_group
from app.common.exceptions import ForbiddenException, NotFoundException


def _assert_member(db: Session, group_id: int, user_id: int) -> None:
    m = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id,
    ).first()
    if not m:
        raise ForbiddenException("모임 멤버만 접근할 수 있습니다.")


def create_progress(db: Session, group_id: int, user_id: int, data: ProgressCreate) -> ReadingProgress:
    get_group(db, group_id)
    _assert_member(db, group_id, user_id)

    record = ReadingProgress(
        group_id=group_id,
        user_id=user_id,
        chapter=data.chapter,
        page=data.page,
        progress=data.progress,
        bookmark_title=data.bookmark_title,
        memo=data.memo,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_group_progress(db: Session, group_id: int, user_id: int) -> list[ReadingProgress]:
    get_group(db, group_id)
    _assert_member(db, group_id, user_id)
    return (
        db.query(ReadingProgress)
        .filter(ReadingProgress.group_id == group_id)
        .order_by(ReadingProgress.created_at.desc())
        .all()
    )


def list_member_progress(db: Session, group_id: int, target_user_id: int, requester_id: int) -> list[ReadingProgress]:
    get_group(db, group_id)
    _assert_member(db, group_id, requester_id)
    return (
        db.query(ReadingProgress)
        .filter(ReadingProgress.group_id == group_id, ReadingProgress.user_id == target_user_id)
        .order_by(ReadingProgress.created_at.desc())
        .all()
    )
