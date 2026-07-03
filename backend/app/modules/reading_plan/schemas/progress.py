from datetime import datetime
from typing import Optional

from pydantic import model_validator

from app.modules.reading_plan.schemas.base import CamelModel
from app.modules.reading_plan.schemas.library import UserLibraryItem


class ProgressCreateRequest(CamelModel):
    page: Optional[int] = None
    percent: Optional[float] = None
    memo: Optional[str] = None

    @model_validator(mode="after")
    def check_page_or_percent(self) -> "ProgressCreateRequest":
        if self.page is None and self.percent is None:
            raise ValueError("page 또는 percent 중 하나는 필요합니다")
        return self


class ProgressLogEntry(CamelModel):
    id: str
    library_id: str
    page: Optional[int] = None
    percent: Optional[float] = None
    memo: Optional[str] = None
    recorded_at: datetime


class ProgressCreateResponse(CamelModel):
    log: ProgressLogEntry
    library: UserLibraryItem


class ProgressLogListResponse(CamelModel):
    items: list[ProgressLogEntry]
