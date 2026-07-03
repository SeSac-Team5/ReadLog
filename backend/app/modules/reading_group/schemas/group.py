from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from app.modules.reading_group.models.group import MemberRole


# ── Group ──────────────────────────────────────────────────────────────────

class GroupCreate(BaseModel):
    book_id: Optional[int] = None
    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_public: bool = True
    max_member: int = Field(8, ge=2, le=50)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_public: Optional[bool] = None
    max_member: Optional[int] = Field(None, ge=2, le=50)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class GroupResponse(BaseModel):
    id: int
    owner_id: int
    book_id: Optional[int]
    name: str
    description: Optional[str]
    is_public: bool
    max_member: int
    invite_code: str
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    created_at: datetime
    member_count: int = 0

    class Config:
        from_attributes = True


# ── Invite ─────────────────────────────────────────────────────────────────

class InviteCreate(BaseModel):
    expires_hours: int = Field(72, ge=1, le=720)


class InviteResponse(BaseModel):
    id: int
    group_id: int
    invite_code: str
    expires_at: datetime
    used: bool

    class Config:
        from_attributes = True


class JoinGroupRequest(BaseModel):
    code: str = Field(..., description="상시 초대 코드 또는 임시 초대 코드")


# ── Member ─────────────────────────────────────────────────────────────────

class MemberResponse(BaseModel):
    id: int
    group_id: int
    user_id: int
    role: MemberRole
    joined_at: datetime
    nickname: Optional[str] = None
    profile_image: Optional[str] = None

    class Config:
        from_attributes = True


class DelegateRequest(BaseModel):
    target_user_id: int


# ── ChapterGoal ────────────────────────────────────────────────────────────

class ChapterGoalCreate(BaseModel):
    chapter_name: str = Field(..., max_length=100)
    target_date: datetime


class ChapterGoalUpdate(BaseModel):
    chapter_name: Optional[str] = Field(None, max_length=100)
    target_date: Optional[datetime] = None


class ChapterGoalResponse(BaseModel):
    id: int
    group_id: int
    chapter_name: str
    target_date: datetime

    class Config:
        from_attributes = True


# ── Progress ───────────────────────────────────────────────────────────────

class ProgressCreate(BaseModel):
    chapter: Optional[str] = Field(None, max_length=100)
    page: Optional[int] = Field(None, ge=0)
    progress: Optional[float] = Field(None, ge=0, le=100)
    bookmark_title: Optional[str] = Field(None, max_length=100)
    memo: Optional[str] = Field(None, max_length=300)

    @field_validator("progress")
    @classmethod
    def progress_or_page_required(cls, v, info):
        if v is None and info.data.get("page") is None:
            raise ValueError("page 또는 progress 중 하나는 필수입니다.")
        return v


class ProgressResponse(BaseModel):
    id: int
    group_id: int
    user_id: int
    chapter: Optional[str]
    page: Optional[int]
    progress: Optional[float]
    bookmark_title: Optional[str]
    memo: Optional[str]
    created_at: datetime
    nickname: Optional[str] = None

    class Config:
        from_attributes = True


# ── Comment ────────────────────────────────────────────────────────────────

class CommentCreate(BaseModel):
    progress_id: Optional[int] = None
    parent_comment_id: Optional[int] = None
    content: str = Field(..., min_length=1)
    quote: Optional[str] = None
    is_spoiler: bool = False


class CommentResponse(BaseModel):
    id: int
    group_id: int
    user_id: int
    progress_id: Optional[int]
    parent_comment_id: Optional[int]
    content: str
    quote: Optional[str]
    is_spoiler: bool
    created_at: datetime
    nickname: Optional[str] = None
    reactions: list = []

    class Config:
        from_attributes = True


# ── Reaction ───────────────────────────────────────────────────────────────

class ReactionCreate(BaseModel):
    emoji: str = Field(..., max_length=20)


class ReactionResponse(BaseModel):
    id: int
    comment_id: int
    user_id: int
    emoji: str

    class Config:
        from_attributes = True
