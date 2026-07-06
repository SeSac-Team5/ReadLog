from sqlalchemy import (
    BigInteger, Boolean, Column, DateTime, Enum, Float, ForeignKey,
    String, Text, UniqueConstraint, func
)
from sqlalchemy.orm import relationship
from app.db import Base
import enum


class MemberRole(str, enum.Enum):
    OWNER = "OWNER"
    # [MANAGER 확장 포인트] 현재 미사용 role.
    # promote_to_manager API(member_service.py), delegate 시 강등 로직(member_service.py)과 세트.
    # 활성화 시: group_service.py의 _require_role 체크에 추가 + GroupSettingsScreen.tsx UI 구현 필요.
    # 미사용 시: 이 항목 및 member_service.promote_to_manager, delegate 강등 로직 함께 제거 검토.
    MANAGER = "MANAGER"
    MEMBER = "MEMBER"


class ReadingGroup(Base):
    __tablename__ = "reading_groups"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    owner_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    book_id = Column(BigInteger, ForeignKey("books.id"), nullable=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    max_member = Column(BigInteger, default=8)
    invite_code = Column(String(30), unique=True, nullable=False)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())

    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    invites = relationship("GroupInvite", back_populates="group", cascade="all, delete-orphan")
    chapter_goals = relationship("ChapterGoal", back_populates="group", cascade="all, delete-orphan")
    progress_records = relationship("ReadingProgress", back_populates="group", cascade="all, delete-orphan")
    comments = relationship("GroupComment", back_populates="group", cascade="all, delete-orphan")


class GroupInvite(Base):
    __tablename__ = "group_invites"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    group_id = Column(BigInteger, ForeignKey("reading_groups.id", ondelete="CASCADE"), nullable=False)
    invite_code = Column(String(30), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)

    group = relationship("ReadingGroup", back_populates="invites")


class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    group_id = Column(BigInteger, ForeignKey("reading_groups.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(MemberRole), default=MemberRole.MEMBER, nullable=False)
    joined_at = Column(DateTime, server_default=func.now())

    __table_args__ = (UniqueConstraint("group_id", "user_id"),)

    group = relationship("ReadingGroup", back_populates="members")


class ChapterGoal(Base):
    __tablename__ = "chapter_goals"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    group_id = Column(BigInteger, ForeignKey("reading_groups.id", ondelete="CASCADE"), nullable=False)
    chapter_name = Column(String(100), nullable=False)
    target_date = Column(DateTime, nullable=False)

    group = relationship("ReadingGroup", back_populates="chapter_goals")


class ReadingProgress(Base):
    __tablename__ = "reading_progress"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    group_id = Column(BigInteger, ForeignKey("reading_groups.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    chapter = Column(String(100))
    page = Column(BigInteger)
    progress = Column(Float)  # 0~100
    bookmark_title = Column(String(100))
    memo = Column(String(300))
    created_at = Column(DateTime, server_default=func.now())
    deleted_by_owner = Column(Boolean, default=False, nullable=False)
    dismissed_by_member = Column(Boolean, default=False, nullable=False)

    group = relationship("ReadingGroup", back_populates="progress_records")
    comments = relationship("GroupComment", back_populates="progress_record")


class GroupComment(Base):
    __tablename__ = "group_comments"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    group_id = Column(BigInteger, ForeignKey("reading_groups.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    progress_id = Column(BigInteger, ForeignKey("reading_progress.id", ondelete="SET NULL"), nullable=True)
    parent_comment_id = Column(BigInteger, ForeignKey("group_comments.id", ondelete="CASCADE"), nullable=True)
    content = Column(Text, nullable=False)
    quote = Column(Text)
    is_spoiler = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    group = relationship("ReadingGroup", back_populates="comments")
    progress_record = relationship("ReadingProgress", back_populates="comments")
    reactions = relationship("CommentReaction", back_populates="comment", cascade="all, delete-orphan")
    replies = relationship("GroupComment", backref="parent", remote_side="GroupComment.id")


class CommentReaction(Base):
    __tablename__ = "comment_reactions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    comment_id = Column(BigInteger, ForeignKey("group_comments.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    emoji = Column(String(20), nullable=False)

    __table_args__ = (UniqueConstraint("comment_id", "user_id", "emoji"),)

    comment = relationship("GroupComment", back_populates="reactions")
