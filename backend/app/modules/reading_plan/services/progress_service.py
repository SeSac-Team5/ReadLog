from datetime import date
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.reading_plan.models.enums import LibraryStatus
from app.modules.reading_plan.models.reading_progress_log import ReadingProgressLog
from app.modules.reading_plan.models.user_library import UserLibrary
from app.modules.reading_plan.schemas.library import UserLibraryItem
from app.modules.reading_plan.schemas.progress import (
    LibraryCommentBook,
    LibraryCommentEntry,
    ProgressActivityEntry,
    ProgressLogEntry,
)
from app.modules.reading_plan.services.library_service import to_library_item_response


def _get_owned_library_entry(db: Session, library_id: int, user_id: int) -> UserLibrary:
    entry = (
        db.query(UserLibrary)
        .filter(UserLibrary.id == library_id, UserLibrary.user_id == user_id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="해당 서재 항목을 찾을 수 없습니다")
    return entry


def _to_log_entry(log: ReadingProgressLog) -> ProgressLogEntry:
    return ProgressLogEntry(
        id=str(log.id),
        library_id=str(log.library_id),
        page=log.page,
        percent=log.percent,
        memo=log.memo,
        recorded_at=log.recorded_at,
    )


def add_progress_log(
    db: Session,
    library_id: int,
    user_id: int,
    page: Optional[int],
    percent: Optional[float],
    memo: Optional[str],
) -> tuple[ProgressLogEntry, UserLibraryItem]:
    entry = _get_owned_library_entry(db, library_id, user_id)
    total_pages = entry.book.page_count

    if page is None and percent is not None and total_pages:
        page = round(percent / 100 * total_pages)
    if percent is None and page is not None and total_pages:
        percent = round(page / total_pages * 100, 1)

    current_page = entry.current_page or 0
    if page is not None and page < current_page:
        raise HTTPException(
            status_code=400,
            detail=f"현재 진도(p.{current_page})보다 낮은 값으로는 기록할 수 없습니다",
        )

    log = ReadingProgressLog(library_id=library_id, page=page, percent=percent, memo=memo)
    db.add(log)

    if page is not None:
        entry.current_page = page

    if total_pages and page is not None and page >= total_pages:
        entry.status = LibraryStatus.COMPLETED
        if entry.completed_at is None:
            entry.completed_at = date.today()

    db.commit()
    db.refresh(log)
    db.refresh(entry)

    return _to_log_entry(log), to_library_item_response(entry)


def list_progress_logs(db: Session, library_id: int, user_id: int) -> list[ProgressLogEntry]:
    _get_owned_library_entry(db, library_id, user_id)
    logs = (
        db.query(ReadingProgressLog)
        .filter(ReadingProgressLog.library_id == library_id)
        .order_by(ReadingProgressLog.recorded_at.desc())
        .all()
    )
    return [_to_log_entry(log) for log in logs]


def list_library_comments(db: Session, user_id: int) -> list[LibraryCommentEntry]:
    logs = (
        db.query(ReadingProgressLog)
        .join(UserLibrary, ReadingProgressLog.library_id == UserLibrary.id)
        .filter(UserLibrary.user_id == user_id, ReadingProgressLog.memo.isnot(None))
        .order_by(ReadingProgressLog.recorded_at.desc())
        .all()
    )
    return [
        LibraryCommentEntry(
            id=str(log.id),
            library_id=str(log.library_id),
            book=LibraryCommentBook(
                id=str(log.library_entry.book.id),
                title=log.library_entry.book.title,
                cover_url=log.library_entry.book.cover_url,
            ),
            memo=log.memo,
            recorded_at=log.recorded_at,
        )
        for log in logs
    ]


def list_progress_activity(db: Session, user_id: int) -> list[ProgressActivityEntry]:
    # 연속독서 계산용 — 진도를 새로 입력한 날짜(코멘트 여부 무관)를 "그날 읽었다"로 친다.
    # 책 하나로 스코프된 list_progress_logs와 달리 사용자의 모든 서재 항목을 다 본다.
    logs = (
        db.query(ReadingProgressLog)
        .join(UserLibrary, ReadingProgressLog.library_id == UserLibrary.id)
        .filter(UserLibrary.user_id == user_id)
        .all()
    )
    return [ProgressActivityEntry(recorded_at=log.recorded_at) for log in logs]
