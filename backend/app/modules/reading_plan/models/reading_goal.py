from sqlalchemy import (
    BigInteger,
    Column,
    ForeignKey,
    Integer,
    String,
    TIMESTAMP,
    UniqueConstraint,
    func,
)

from app.db.base import Base


class ReadingGoal(Base):
    __tablename__ = "reading_goals"
    __table_args__ = (
        UniqueConstraint("user_id", "goal_month", name="uq_reading_goals_user_month"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # "YYYY-MM". Named goal_month (not year_month) because YEAR_MONTH is a reserved
    # MySQL keyword (INTERVAL unit) and fails as an unquoted column name.
    goal_month = Column(String(7), nullable=False)
    target_books = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
