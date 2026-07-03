from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db import get_db
from app.common.exceptions import UnauthorizedException

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
):
    if not credentials:
        raise UnauthorizedException()

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id: int = int(payload.get("sub", 0))
        if not user_id:
            raise UnauthorizedException()
    except JWTError:
        raise UnauthorizedException("토큰이 유효하지 않습니다.")

    # 순환 import 방지를 위해 함수 내부에서 import
    from app.modules.auth.models.user import User

    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise UnauthorizedException("사용자를 찾을 수 없습니다.")
    return user
