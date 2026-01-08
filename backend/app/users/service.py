import logging
import uuid
from datetime import timedelta
from typing import List

from fastapi import HTTPException, status
from sqlalchemy import or_

from app.utils.hash_password import hash_password
from app.services.redis_service import EmailTokenStorage
from app.core.redis import get_redis
from app.core.exceptions import InvalidTokenException, TokenExpiredException
from app.users.models import UserModel
from app.users.dao import UserDAO
from app.core.database import async_session_maker
from app.users.schemas import UserCreate, UserCreateDB, User, UserUpdate, UserUpdateDB
from app.tasks.email_tasks import EmailTasks
from app.core.config import settings

log = logging.getLogger(__name__)


class UserService:
    @classmethod
    async def get_user(cls, user_id: int) -> User:
        async with async_session_maker() as session:
            user_exist = await UserDAO.find_one_or_none(session, id=user_id)
            if user_exist is None:
                log.warning("User not found", extra={"user_id": user_id})
                raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found")
            log.debug("User fetched", extra={"user_id": user_id})

            return user_exist


    @classmethod
    async def register_new_user(cls, user: UserCreate) -> User:
        async with async_session_maker() as session:
            user_exist = await UserDAO.find_one_or_none(session, or_(
                UserModel.email==user.email,
                UserModel.username==user.username
            ))

            if user_exist:
                log.warning("User already registered", extra={"email": user.email})
                raise HTTPException(status_code=400, detail="User already exists")
            print(user.email)

            user_db = await UserDAO.add(
                session,
                UserCreateDB(
                    **user.model_dump(),
                    hashed_password=hash_password(user.password),
                    is_active=True,
                    is_verified=False,
                    is_superuser=False
                )
            )
            await session.commit()

            await cls.send_verify_email(user_db)
            return user_db


    @classmethod
    async def send_verify_email(cls, user: UserModel):
        redis_client = await get_redis()

        token = cls._create_email_verification_token()
        url = f"{settings.URL}/api/v1/auth/verify/{token}"
        email_token_expires = timedelta(minutes=settings.EMAIL_TOKEN_EXPIRE_MINUTES)

        await EmailTokenStorage.save_token(
            token,
            user.id,
            int(email_token_expires.total_seconds())
        )
        EmailTasks.send_verify_email_task.delay(email=user.email, username=user.username, url=url)


    @classmethod
    def _create_email_verification_token(cls) -> uuid.UUID:
        return uuid.uuid4()


    @classmethod
    async def verify_email(cls, token: uuid.UUID):
        async with async_session_maker() as session:
            user_id = await EmailTokenStorage.getdel_token(token)

            if user_id is None:
                raise TokenExpiredException

            user_exist = await UserDAO.find_one_or_none(session, id=int(user_id))
            if user_exist is None:
                raise InvalidTokenException
            if user_exist.is_verified:
                raise HTTPException(status_code=400, detail="Email already verified")

            await UserDAO.update(
                session,
                UserModel.id==int(user_id),
                obj_in={"is_verified": True}
            )

            await session.commit()


    @classmethod
    async def get_users_list(cls, offset: int = 0, limit: int = 10) -> List[UserModel]:
        async with async_session_maker() as session:
            users = await UserDAO.find_all(session, offset, limit)

            if users is None:
                log.warning("Users not found")
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Users not found")
            log.debug("Users fetched", extra={"count": len(users), "offset": offset, "limit": limit})
            return users


    @classmethod
    async def update_user(cls, user_id: int, update_user: UserUpdate):
        async with async_session_maker() as session:

            user_exist = await UserDAO.find_one_or_none(session, id=user_id)

            if user_exist is None:
                log.warning("User not found", extra={"user_id": user_id})
                raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found")

            if user_exist.username != update_user.username:
                username_exist = await UserDAO.find_one_or_none(session, username=update_user.username)
                if username_exist:
                    log.warning("Username is taken", extra={"user_id": user_id})
                    raise HTTPException(status.HTTP_409_CONFLICT, detail="Username is taken")

            update_user_db = await UserDAO.update(
                session,
                UserModel.id==user_id,
                obj_in=UserUpdateDB(
                    **update_user.model_dump()
                )
            )
            await session.commit()
            log.info("User updated", extra={"user_id": user_id})
            return update_user_db


    @classmethod
    async def delete_user(cls, user_id):
        async with async_session_maker() as session:
            user_exist = await UserDAO.find_one_or_none(session, id=user_id)

            if user_exist is None:
                log.warning("User not found", extra={"user_id": user_id})
                raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found")

            await UserDAO.update(
                session,
                UserModel.id==user_id,
                obj_in={"is_active": False}
            )
            await session.commit()
            log.info("User is inactive", extra={"user_id": user_id})