from sqlalchemy.orm import Session, joinedload

from app.modules.reading_group.models.group import CommentReaction, GroupComment, GroupMember
from app.modules.reading_group.schemas.group import CommentCreate, CommentResponse, ReactionCreate
from app.modules.reading_group.services.group_service import get_group
from app.common.exceptions import ForbiddenException, NotFoundException


def _assert_member(db: Session, group_id: int, user_id: int) -> None:
    m = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id,
    ).first()
    if not m:
        raise ForbiddenException("모임 멤버만 접근할 수 있습니다.")


def list_comments(db: Session, group_id: int, user_id: int) -> list[CommentResponse]:
    get_group(db, group_id)
    _assert_member(db, group_id, user_id)

    from app.modules.auth.models.user import User

    comments = (
        db.query(GroupComment)
        .filter(GroupComment.group_id == group_id, GroupComment.parent_comment_id == None)
        .options(joinedload(GroupComment.reactions))
        .order_by(GroupComment.created_at.asc())
        .all()
    )

    user_ids = {c.user_id for c in comments}
    nickname_map: dict = {}
    if user_ids:
        rows = db.query(User.id, User.nickname).filter(User.id.in_(user_ids)).all()
        nickname_map = {r.id: r.nickname for r in rows}

    return [
        CommentResponse(
            id=c.id,
            group_id=c.group_id,
            user_id=c.user_id,
            progress_id=c.progress_id,
            parent_comment_id=c.parent_comment_id,
            content=c.content,
            quote=c.quote,
            is_spoiler=c.is_spoiler,
            created_at=c.created_at,
            nickname=nickname_map.get(c.user_id),
            reactions=[
                {"id": r.id, "comment_id": r.comment_id, "user_id": r.user_id, "emoji": r.emoji}
                for r in c.reactions
            ],
        )
        for c in comments
    ]


def create_comment(db: Session, group_id: int, user_id: int, data: CommentCreate) -> GroupComment:
    get_group(db, group_id)
    _assert_member(db, group_id, user_id)

    comment = GroupComment(
        group_id=group_id,
        user_id=user_id,
        progress_id=data.progress_id,
        parent_comment_id=data.parent_comment_id,
        content=data.content,
        quote=data.quote,
        is_spoiler=data.is_spoiler,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


def delete_comment(db: Session, comment_id: int, user_id: int) -> None:
    comment = db.query(GroupComment).filter(GroupComment.id == comment_id).first()
    if not comment:
        raise NotFoundException("댓글을 찾을 수 없습니다.")
    if comment.user_id != user_id:
        raise ForbiddenException("본인 댓글만 삭제할 수 있습니다.")
    db.delete(comment)
    db.commit()


def toggle_reaction(db: Session, comment_id: int, user_id: int, data: ReactionCreate) -> dict:
    comment = db.query(GroupComment).filter(GroupComment.id == comment_id).first()
    if not comment:
        raise NotFoundException("댓글을 찾을 수 없습니다.")

    existing = db.query(CommentReaction).filter(
        CommentReaction.comment_id == comment_id,
        CommentReaction.user_id == user_id,
        CommentReaction.emoji == data.emoji,
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"action": "removed", "emoji": data.emoji}

    reaction = CommentReaction(comment_id=comment_id, user_id=user_id, emoji=data.emoji)
    db.add(reaction)
    db.commit()
    return {"action": "added", "emoji": data.emoji}
