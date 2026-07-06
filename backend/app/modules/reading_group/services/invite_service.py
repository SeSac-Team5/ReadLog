import secrets
import string
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.modules.reading_group.models.group import GroupInvite, GroupMember, MemberRole, ReadingGroup
from app.modules.reading_group.services.group_service import get_group, member_count
from app.common.exceptions import BadRequestException, ConflictException, NotFoundException
from app.modules.reading_plan.models.book import Book
from app.modules.reading_plan.models.user_library import UserLibrary
from app.modules.reading_plan.models.enums import LibraryStatus


def _gen_temp_code() -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(chars) for _ in range(10))


def create_temp_invite(db: Session, group_id: int, expires_hours: int) -> GroupInvite:
    get_group(db, group_id)  # 존재 확인
    invite = GroupInvite(
        group_id=group_id,
        invite_code=_gen_temp_code(),
        expires_at=datetime.utcnow() + timedelta(hours=expires_hours),
        used=False,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite


def join_by_code(db: Session, user_id: int, code: str) -> tuple[GroupMember, bool, Optional[str]]:
    # 상시 코드로 조회
    group = db.query(ReadingGroup).filter(ReadingGroup.invite_code == code).first()

    # 임시 코드로 조회
    if not group:
        temp = db.query(GroupInvite).filter(
            GroupInvite.invite_code == code,
            GroupInvite.used == False,
            GroupInvite.expires_at > datetime.utcnow(),
        ).first()
        if not temp:
            raise BadRequestException("유효하지 않은 초대 코드입니다.")
        group = db.query(ReadingGroup).filter(ReadingGroup.id == temp.group_id).first()
        temp.used = True

    if not group:
        raise NotFoundException("독서모임을 찾을 수 없습니다.")

    existing = db.query(GroupMember).filter(
        GroupMember.group_id == group.id,
        GroupMember.user_id == user_id,
    ).first()
    if existing:
        raise ConflictException("이미 참여 중인 모임입니다.")

    count = member_count(db, group.id)
    if count >= group.max_member:
        raise BadRequestException("모임 정원이 가득 찼습니다.")

    member = GroupMember(group_id=group.id, user_id=user_id, role=MemberRole.MEMBER)
    db.add(member)

    # 모임 도서가 있으면 서재에 자동 추가
    book_added = False
    book_title: Optional[str] = None
    if group.book_id:
        book = db.query(Book).filter(Book.id == group.book_id).first()
        if book:
            already_in_library = db.query(UserLibrary).filter(
                UserLibrary.user_id == user_id,
                UserLibrary.book_id == group.book_id,
            ).first()
            if not already_in_library:
                db.add(UserLibrary(
                    user_id=user_id,
                    book_id=group.book_id,
                    status=LibraryStatus.READING,
                ))
                book_added = True
                book_title = book.title

    db.commit()
    db.refresh(member)
    return member, book_added, book_title
