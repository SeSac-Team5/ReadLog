import json
from typing import Optional

from fastapi import Cookie, Depends, HTTPException, status
from redis import Redis as SyncRedis
from sqlalchemy.orm import Session

from app.core.redis import get_sync_redis
from app.db import get_db


def get_current_user(
    session_id: Optional[str] = Cookie(default=None, alias="session_id"),
    db: Session = Depends(get_db),
    redis: SyncRedis = Depends(get_sync_redis),
):
    if not session_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "로그인이 필요합니다.")

    raw = redis.get(f"session:{session_id}")
    if not raw:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "세션이 만료되었습니다. 다시 로그인해주세요.")

    user_id = json.loads(raw)["user_id"]

    from app.modules.auth.models.user import User
    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "사용자를 찾을 수 없습니다.")
    return user
