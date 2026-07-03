from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import create_database
from app.db.base import Base
from app.db.session import engine as async_engine

# ── 모든 모델 등록 (create_all 전에 import 필수) ───────────────────────────
import app.modules.auth.models.user  # noqa: F401
import app.modules.reading_plan.models.book  # noqa: F401
import app.modules.reading_plan.models.user_library  # noqa: F401
import app.modules.reading_plan.models.reading_progress_log  # noqa: F401
import app.modules.reading_plan.models.review  # noqa: F401
import app.modules.reading_plan.models.sns_post  # noqa: F401
import app.modules.reading_plan.models.sns_sticker  # noqa: F401
import app.modules.reading_plan.models.reading_goal  # noqa: F401
import app.modules.reading_group.models.group  # noqa: F401

# ── 라우터 ─────────────────────────────────────────────────────────────────
from app.modules.reading_group.routers import (
    comments, groups, invites, members, progress,
)
from app.modules.reading_plan.routers import (
    books, goals, library, progress as rp_progress, reviews, sns as rp_sns,
)
from app.modules.auth.routers.auth_router import router as auth_router

app = FastAPI(title="ReadLog API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 라우터 등록 ────────────────────────────────────────────────────────────
app.include_router(groups.router, prefix="/api")
app.include_router(members.router, prefix="/api")
app.include_router(invites.router, prefix="/api")
app.include_router(progress.router, prefix="/api")
app.include_router(comments.router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(books.router, prefix="/api")
app.include_router(library.router, prefix="/api")
app.include_router(rp_progress.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(rp_sns.router, prefix="/api")
app.include_router(goals.router, prefix="/api")


# ── 서버 시작 시 DB 생성 + 테이블 자동 생성 ────────────────────────────────
@app.on_event("startup")
async def startup() -> None:
    create_database()
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# ── 헬스체크 ───────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok"}
