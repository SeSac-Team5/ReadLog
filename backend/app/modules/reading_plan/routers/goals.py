from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.common.deps import get_current_user_id
from app.db.session import get_db
from app.modules.reading_plan.schemas.goal import (
    MonthlyGoalResponse,
    MonthlyGoalUpsertRequest,
)
from app.modules.reading_plan.services.goal_service import (
    get_current_month_goal,
    upsert_monthly_goal,
)

router = APIRouter(prefix="/goals", tags=["reading-plan:goals"])


@router.get("/current", response_model=MonthlyGoalResponse)
def get_current_month_goal_endpoint(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> MonthlyGoalResponse:
    return get_current_month_goal(db, user_id=user_id)


@router.put("/current", response_model=MonthlyGoalResponse)
def upsert_current_month_goal_endpoint(
    payload: MonthlyGoalUpsertRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> MonthlyGoalResponse:
    return upsert_monthly_goal(db, user_id=user_id, target=payload.target)
