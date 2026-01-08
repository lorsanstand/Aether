import logging
import uuid

from app.core.redis import get_redis

log = logging.getLogger(__name__)


class RefreshTokenStorage:
    PREFIX: str = "refresh"

    @classmethod
    async def save_token(cls, token: uuid.UUID, user_id: int, ttl: int):
        redis_client = await get_redis()

        await redis_client.setex(f"{cls.PREFIX}:{token}", ttl, user_id)
        await redis_client.sadd(f"user:{user_id}:{cls.PREFIX}", str(token))
        await redis_client.expire(f"user:{user_id}:{cls.PREFIX}", ttl+3600)

        log.info("Save new refresh token from redis", extra={"user_id": user_id, "token": token})


    @classmethod
    async def getdel_token(cls, token: uuid.UUID) -> int:
        redis_client = await get_redis()
        user_id = await redis_client.getdel(f"{cls.PREFIX}:{token}")
        await redis_client.srem(f"user:{user_id}:{cls.PREFIX}", str(token))
        log.info("Remove token", extra={"user_id": user_id, "token": token})
        return user_id


    @classmethod
    async def get_token(cls, token: uuid.UUID) -> int:
        redis_client = await get_redis()
        user_id = await redis_client.get(f"{cls.PREFIX}:{token}")
        log.debug("User_id fetched from refresh token", extra={"user_id": user_id, "token": token})
        return user_id


    @classmethod
    async def abort_all_tokens(cls, user_id: int):
        redis_client = await get_redis()
        log.debug("Start abort all tokens", extra={"user_id": user_id})

        tokens = await redis_client.smembers(f"user:{user_id}:{cls.PREFIX}")

        for token in tokens:
            await redis_client.delete(f"{cls.PREFIX}:{token}")

        await redis_client.delete(f"user:{user_id}:{cls.PREFIX}")

        log.info("Successfully abort all tokens", extra={"user_id": user_id})



class EmailTokenStorage:
    PREFIX: str = "email"

    @classmethod
    async def save_token(cls, token: uuid.UUID, user_id: int, ttl: int):
        redis_client = await get_redis()

        await redis_client.setex(f"{cls.PREFIX}:{token}", ttl, user_id)

        log.info("Save new refresh token from redis", extra={"user_id": user_id, "token": token})


    @classmethod
    async def getdel_token(cls, token: uuid.UUID) -> int:
        redis_client = await get_redis()
        log.debug("User_id fetched from email token", extra={"token": token})
        return await redis_client.getdel(f"{cls.PREFIX}:{token}")