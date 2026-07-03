from sqlalchemy import BigInteger, Column, Table
from sqlalchemy.orm import declarative_base

Base = declarative_base()

# TEMPORARY placeholder so FK("users.id") in reading_plan models can resolve.
# Delete this once the auth module defines the real mapped User class for `users`
# (having both registered under the same name will raise a duplicate-table error).
Table("users", Base.metadata, Column("id", BigInteger, primary_key=True))

from app.modules.reading_plan.models import (  # noqa: E402,F401
    book,
    reading_goal,
    reading_progress_log,
    review,
    sns_post,
    sns_sticker,
    user_library,
)
