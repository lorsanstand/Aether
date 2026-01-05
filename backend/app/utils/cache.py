import json
from functools import wraps

from fastapi import Request

from app.utils.redis import get_redis


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
                return json.loads(response_cache)

            response_cache = await func(*args, **kwargs)
            await redis.setex(str(request.url), ttl, json.dumps(response_cache))
            return response_cache

        return wrapper
    return decorator
