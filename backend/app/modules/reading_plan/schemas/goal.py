from typing import Optional

from app.modules.reading_plan.schemas.base import CamelModel


class MonthlyGoalResponse(CamelModel):
    year_month: str  # "YYYY-MM"
    target: Optional[int] = None
    completed: int


class MonthlyGoalUpsertRequest(CamelModel):
    target: int
