from redis.asyncio import Redis, from_url
from redis import Redis as SyncRedis
from app.core.config import settings

_redis: Redis | None = None
_sync_redis: SyncRedis | None = None


async def get_redis() -> Redis:
    global _redis
    if _redis is None:
        _redis = from_url(settings.REDIS_URL, decode_responses=True)
    return _redis


def get_sync_redis() -> SyncRedis:
    global _sync_redis
    if _sync_redis is None:
        _sync_redis = SyncRedis.from_url(settings.REDIS_URL, decode_responses=True)
    return _sync_redis
