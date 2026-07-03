from datetime import date
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import extract
from sqlalchemy.orm import Session

from app.modules.reading_plan.models.enums import LibraryStatus
from app.modules.reading_plan.models.reading_goal import ReadingGoal
from app.modules.reading_plan.models.user_library import UserLibrary
from app.modules.reading_plan.schemas.goal import MonthlyGoalResponse


def _current_year_month() -> tuple[str, int, int]:
    today = date.today()
    return f"{today.year:04d}-{today.month:02d}", today.year, today.month


def _count_completed_this_month(db: Session, user_id: int, year: int, month: int) -> int:
    return (
        db.query(UserLibrary)
        .filter(
            UserLibrary.user_id == user_id,
            UserLibrary.status == LibraryStatus.COMPLETED,
            UserLibrary.completed_at.isnot(None),
            extract("year", UserLibrary.completed_at) == year,
            extract("month", UserLibrary.completed_at) == month,
        )
        .count()
    )


def _find_goal(db: Session, user_id: int, year_month: str) -> Optional[ReadingGoal]:
    return (
        db.query(ReadingGoal)
        .filter(ReadingGoal.user_id == user_id, ReadingGoal.goal_month == year_month)
        .first()
    )


def get_current_month_goal(db: Session, user_id: int) -> MonthlyGoalResponse:
    year_month, year, month = _current_year_month()
    goal = _find_goal(db, user_id, year_month)
    completed = _count_completed_this_month(db, user_id, year, month)
    return MonthlyGoalResponse(
        year_month=year_month,
        target=goal.target_books if goal else None,
        completed=completed,
    )


def upsert_monthly_goal(db: Session, user_id: int, target: int) -> MonthlyGoalResponse:
    if target < 1:
        raise HTTPException(status_code=400, detail="목표 권수는 1권 이상이어야 해요")

    year_month, year, month = _current_year_month()
    goal = _find_goal(db, user_id, year_month)
    if goal:
        goal.target_books = target
    else:
        goal = ReadingGoal(user_id=user_id, goal_month=year_month, target_books=target)
        db.add(goal)
    db.commit()

    completed = _count_completed_this_month(db, user_id, year, month)
    return MonthlyGoalResponse(year_month=year_month, target=target, completed=completed)
