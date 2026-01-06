import logging
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException, status
from jose import jwt
from sqlalchemy import or_

from app.utils.hash_password import hash_password, verify_password
from app.services.redis_service import RefreshTokenStorage, EmailTokenStorage
from app.utils.redis import get_redis
from app.exceptions import InvalidTokenException, TokenExpiredException
from app.users.models import UserModel
from app.users.dao import UserDAO
from app.database import async_session_maker
from app.users.schemas import Token, UserCreate, UserCreateDB, User
from app.tasks.email_tasks import EmailTasks
from app.config import settings

log = logging.getLogger(__name__)


class AuthService:
    @classmethod
    async def create_token(cls, user_id: int) -> Token:

        access_token = cls._create_access_token(user_id)
        refresh_token_expires = timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = cls._create_refresh_token()

        await RefreshTokenStorage.save_token(refresh_token, user_id, int(refresh_token_expires.total_seconds()))

        log.info("Token created has user", extra={"user_id": user_id})
        return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")

    @classmethod
    async def logout(cls, token: uuid.UUID) -> None:
        user_id = await RefreshTokenStorage.getdel_token(token)
        log.info("User logged out", extra={"user_id": user_id})

    @classmethod
    async def refresh_token(cls, token: uuid.UUID) -> Token:
        async with async_session_maker() as session:
            refresh_session = await RefreshTokenStorage.getdel_token(token)

            if refresh_session is None:
                log.warning("Refresh token not found")
                raise InvalidTokenException

            user = await UserDAO.find_one_or_none(session, id=int(refresh_session))
            if user is None:
                log.error("User not found during token refresh", extra={"user_id": str(refresh_session.user_id)})
                raise InvalidTokenException

            access_token = cls._create_access_token(user.id)
            refresh_token_expires = timedelta(
                days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
            refresh_token = cls._create_refresh_token()

            await RefreshTokenStorage.save_token(
                refresh_token,
                user.id,
                int(refresh_token_expires.total_seconds())
            )

            await session.commit()
            log.info("Token refreshed for user", extra={"user_id": str(user.id)})
        return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")

    @classmethod
    async def authenticate_user(cls, email_or_username: str, password: str) -> Optional[UserModel]:
        async with async_session_maker() as session:
            db_user = await UserDAO.find_one_or_none(
                session,
                or_(
                    UserModel.email==email_or_username,
                    UserModel.username==email_or_username
                )
            )
        if db_user and verify_password(password, db_user.hashed_password):
            log.info("User authenticated successfully", extra={"username": db_user.username})
            return db_user
        log.warning("Authentication failed", extra={"email": email_or_username})
        return None

    @classmethod
    async def abort_all_sessions(cls, user_id: int):
        await RefreshTokenStorage.abort_all_tokens(user_id)

    @classmethod
    def _create_access_token(cls, user_id: int) -> str:
        to_encode = {
            "sub": str(user_id),
            "exp": datetime.utcnow() + timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        }
        encoded_jwt = jwt.encode(
            to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return f'Bearer {encoded_jwt}'

    @classmethod
    def _create_refresh_token(cls) -> uuid.UUID:
        return uuid.uuid4()


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
        redis_client = await get_redis()

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
        redis_client = await get_redis()
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
