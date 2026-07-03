from sqlalchemy import (
    DECIMAL,
    BigInteger,
    Column,
    Date,
    Enum,
    ForeignKey,
    Integer,
    TIMESTAMP,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.modules.reading_plan.models.enums import LibraryStatus


class UserLibrary(Base):
    __tablename__ = "user_library"
    __table_args__ = (UniqueConstraint("user_id", "book_id", name="uq_user_library_user_book"),)

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id = Column(BigInteger, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    status = Column(
        Enum(LibraryStatus, native_enum=False, values_callable=lambda cls: [member.value for member in cls]),
        nullable=False,
        default=LibraryStatus.READING,
    )
    rating = Column(DECIMAL(2, 1), nullable=True)
    current_page = Column(Integer, nullable=False, default=0)
    started_at = Column(Date, nullable=True)
    completed_at = Column(Date, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    book = relationship("Book", back_populates="library_entries")
    progress_logs = relationship(
        "ReadingProgressLog", back_populates="library_entry", cascade="all, delete-orphan"
    )
