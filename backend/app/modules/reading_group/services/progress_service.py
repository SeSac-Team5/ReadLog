from sqlalchemy import or_, and_
from sqlalchemy.orm import Session

from app.modules.reading_group.models.group import GroupMember, MemberRole, ReadingProgress
from app.modules.reading_group.schemas.group import ProgressCreate, ProgressResponse, ProgressUpdate
from app.modules.reading_group.services.group_service import get_group, get_member_role
from app.common.exceptions import ForbiddenException, NotFoundException


def _assert_member(db: Session, group_id: int, user_id: int) -> None:
    m = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id,
    ).first()
    if not m:
        raise ForbiddenException("모임 멤버만 접근할 수 있습니다.")


def _get_progress(db: Session, group_id: int, progress_id: int) -> ReadingProgress:
    p = db.query(ReadingProgress).filter(
        ReadingProgress.id == progress_id,
        ReadingProgress.group_id == group_id,
    ).first()
    if not p:
        raise NotFoundException("진도 기록을 찾을 수 없습니다.")
    return p


def _build_response(db: Session, record: ReadingProgress) -> ProgressResponse:
    from app.modules.auth.models.user import User
    user = db.query(User).filter(User.id == record.user_id).first()
    return ProgressResponse(
        id=record.id,
        group_id=record.group_id,
        user_id=record.user_id,
        chapter=record.chapter,
        page=record.page,
        progress=record.progress,
        bookmark_title=record.bookmark_title,
        memo=record.memo,
        created_at=record.created_at,
        nickname=user.nickname if user else None,
        deleted_by_owner=record.deleted_by_owner,
    )


def create_progress(db: Session, group_id: int, user_id: int, data: ProgressCreate) -> ProgressResponse:
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
    return _build_response(db, record)


def update_progress(db: Session, group_id: int, progress_id: int, actor_id: int, data: ProgressUpdate) -> ProgressResponse:
    get_group(db, group_id)
    _assert_member(db, group_id, actor_id)
    record = _get_progress(db, group_id, progress_id)

    if record.user_id != actor_id:
        raise ForbiddenException("본인이 작성한 진도만 수정할 수 있습니다.")
    if record.deleted_by_owner:
        raise ForbiddenException("owner에 의해 삭제된 진도는 수정할 수 없습니다.")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return _build_response(db, record)


def delete_progress(db: Session, group_id: int, progress_id: int, actor_id: int) -> None:
    get_group(db, group_id)
    _assert_member(db, group_id, actor_id)
    record = _get_progress(db, group_id, progress_id)

    if record.user_id == actor_id:
        # 본인이 삭제 → hard delete
        db.delete(record)
        db.commit()
    else:
        # 타인 진도 삭제 → OWNER만 가능, soft delete
        role = get_member_role(db, group_id, actor_id)
        if role != MemberRole.OWNER:
            raise ForbiddenException("타인의 진도는 방장만 삭제할 수 있습니다.")
        record.deleted_by_owner = True
        db.commit()


def dismiss_progress_notice(db: Session, group_id: int, progress_id: int, actor_id: int) -> None:
    _assert_member(db, group_id, actor_id)
    record = _get_progress(db, group_id, progress_id)

    if record.user_id != actor_id:
        raise ForbiddenException("본인의 삭제 알림만 지울 수 있습니다.")
    if not record.deleted_by_owner:
        raise NotFoundException("삭제 알림이 없습니다.")

    record.dismissed_by_member = True
    db.commit()


def list_group_progress(db: Session, group_id: int, user_id: int) -> list[ProgressResponse]:
    get_group(db, group_id)
    _assert_member(db, group_id, user_id)
    from app.modules.auth.models.user import User
    rows = (
        db.query(ReadingProgress, User.nickname)
        .join(User, ReadingProgress.user_id == User.id)
        .filter(
            ReadingProgress.group_id == group_id,
            or_(
                ReadingProgress.deleted_by_owner == False,
                and_(
                    ReadingProgress.deleted_by_owner == True,
                    ReadingProgress.dismissed_by_member == False,
                ),
            ),
        )
        .order_by(ReadingProgress.created_at.desc())
        .all()
    )
    return [
        ProgressResponse(
            id=p.id,
            group_id=p.group_id,
            user_id=p.user_id,
            chapter=p.chapter,
            page=p.page,
            progress=p.progress,
            bookmark_title=p.bookmark_title,
            memo=p.memo,
            created_at=p.created_at,
            nickname=nickname,
            deleted_by_owner=p.deleted_by_owner,
        )
        for p, nickname in rows
    ]


def list_member_progress(db: Session, group_id: int, target_user_id: int, requester_id: int) -> list[ReadingProgress]:
    get_group(db, group_id)
    _assert_member(db, group_id, requester_id)
    return (
        db.query(ReadingProgress)
        .filter(ReadingProgress.group_id == group_id, ReadingProgress.user_id == target_user_id)
        .order_by(ReadingProgress.created_at.desc())
        .all()
    )
