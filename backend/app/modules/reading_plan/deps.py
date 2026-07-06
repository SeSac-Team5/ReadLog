from fastapi import Depends

from app.common.deps import get_current_user
from app.modules.auth.models.user import User


def get_current_user_id(user: User = Depends(get_current_user)) -> int:
    return user.id
