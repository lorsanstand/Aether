import logging
import uuid
from datetime import datetime, timedelta
from typing import Optional

from jose import jwt
from sqlalchemy import or_

from app.utils.hash_password import verify_password
from app.services.redis_service import RefreshTokenStorage
from app.core.exceptions import InvalidTokenException
from app.users.models import UserModel
from app.users.dao import UserDAO
from app.core.database import async_session_maker
from app.auth.schemas import Token
from app.core.config import settings

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