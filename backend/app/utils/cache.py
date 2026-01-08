import json
import logging
from functools import wraps

from fastapi import Request
from fastapi.encoders import jsonable_encoder

from app.core.redis import get_redis

log = logging.getLogger(__name__)

def cache(ttl: int = 10):
    if ttl <= 0:
        raise ValueError("TTL must be greater than zero.")

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            redis = await get_redis()
            request: Request = kwargs.get("request")
            response_cache = await redis.get(str(request.url))
            if response_cache is not None:
                log.debug("Getting from cache")
                return json.loads(response_cache)

            response_cache = await func(*args, **kwargs)
            serializable_data = jsonable_encoder(response_cache)
            await redis.setex(str(request.url), ttl, json.dumps(serializable_data))
            return response_cache

        return wrapper
    return decorator
