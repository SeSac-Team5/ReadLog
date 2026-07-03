from sqlalchemy.orm import Session

from app.modules.reading_group.models.group import GroupMember, MemberRole
from app.modules.reading_group.schemas.group import MemberResponse
from app.modules.reading_group.services.group_service import _require_role, get_group
from app.common.exceptions import BadRequestException, ForbiddenException, NotFoundException


def list_members(db: Session, group_id: int) -> list[MemberResponse]:
    get_group(db, group_id)
    from app.modules.auth.models.user import User
    rows = (
        db.query(GroupMember, User.nickname, User.profile_image)
        .join(User, GroupMember.user_id == User.id)
        .filter(GroupMember.group_id == group_id)
        .all()
    )
    return [
        MemberResponse(
            id=m.id,
            group_id=m.group_id,
            user_id=m.user_id,
            role=m.role,
            joined_at=m.joined_at,
            nickname=nickname,
            profile_image=profile_image,
        )
        for m, nickname, profile_image in rows
    ]


def kick_member(db: Session, group_id: int, actor_id: int, target_user_id: int) -> None:
    _require_role(db, group_id, actor_id, {MemberRole.OWNER})

    target = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == target_user_id,
    ).first()
    if not target:
        raise NotFoundException("해당 멤버를 찾을 수 없습니다.")
    if target.role == MemberRole.OWNER:
        raise ForbiddenException("모임장은 강퇴할 수 없습니다.")

    db.delete(target)
    db.commit()


def delegate_ownership(db: Session, group_id: int, actor_id: int, target_user_id: int) -> None:
    """소유권 이전: OWNER → MANAGER, 대상 → OWNER (트랜잭션 보장)."""
    _require_role(db, group_id, actor_id, {MemberRole.OWNER})

    target = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == target_user_id,
    ).first()
    if not target:
        raise NotFoundException("해당 멤버를 찾을 수 없습니다.")
    if target.user_id == actor_id:
        raise BadRequestException("자기 자신에게 위임할 수 없습니다.")

    current_owner = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == actor_id,
    ).first()

    # 원자적 처리 — OWNER가 2명 이상 동시에 존재하지 않도록
    current_owner.role = MemberRole.MANAGER
    target.role = MemberRole.OWNER
    db.commit()


def promote_to_manager(db: Session, group_id: int, actor_id: int, target_user_id: int) -> GroupMember:
    _require_role(db, group_id, actor_id, {MemberRole.OWNER})

    target = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == target_user_id,
    ).first()
    if not target:
        raise NotFoundException("해당 멤버를 찾을 수 없습니다.")
    if target.role == MemberRole.OWNER:
        raise BadRequestException("OWNER는 변경할 수 없습니다.")

    target.role = MemberRole.MANAGER
    db.commit()
    db.refresh(target)
    return target


def leave_group(db: Session, group_id: int, user_id: int) -> None:
    member = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id,
    ).first()
    if not member:
        raise NotFoundException("참여 중인 모임이 아닙니다.")
    if member.role == MemberRole.OWNER:
        raise BadRequestException("모임장은 소유권 위임 후 탈퇴해야 합니다.")

    db.delete(member)
    db.commit()
