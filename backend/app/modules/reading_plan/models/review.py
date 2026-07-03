from sqlalchemy import DECIMAL, TIMESTAMP, BigInteger, Column, ForeignKey, String, UniqueConstraint, func

from app.db.base import Base


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("user_id", "book_id", name="uq_reviews_user_book"),)

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id = Column(BigInteger, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    rating = Column(DECIMAL(2, 1), nullable=True)
    review = Column(String(300), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
