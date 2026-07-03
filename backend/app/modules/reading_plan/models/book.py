from sqlalchemy import BigInteger, Column, Date, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    isbn13 = Column(String(20), unique=True, nullable=True)
    title = Column(String(300), nullable=False)
    author = Column(String(200), nullable=True)
    publisher = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    cover_url = Column(String(500), nullable=True)
    page_count = Column(Integer, nullable=True)
    published_date = Column(Date, nullable=True)

    library_entries = relationship("UserLibrary", back_populates="book")
