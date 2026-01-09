import logging
import uuid
from datetime import timedelta
from typing import List

from fastapi import HTTPException, status, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm.sync import update

from app.utils.hash_password import hash_password, verify_password
from app.services.redis_service import EmailTokenStorage, ChangePasswordTokenStorage
from app.core.S3_client import s3_client
from app.core.exceptions import InvalidTokenException, TokenExpiredException, UserNotFoundException
from app.users.models import UserModel
from app.users.dao import UserDAO
from app.core.database import async_session_maker
from app.users.schemas import UserCreate, UserCreateDB, User, UserUpdate, UserUpdateDB, ChangePassword
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
                raise UserNotFoundException
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
        token = cls._create_uuid_token()
        url = f"{settings.URL}/verify-email/{token}"
        email_token_expires = timedelta(minutes=settings.EMAIL_TOKEN_EXPIRE_MINUTES)

        await EmailTokenStorage.save_token(
            token,
            user.id,
            int(email_token_expires.total_seconds())
        )
        EmailTasks.send_verify_email_task.delay(email=user.email, username=user.username, url=url)


    @classmethod
    def _create_uuid_token(cls) -> uuid.UUID:
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
                UserModel.id==user_exist.id,
                obj_in={"is_verified": True}
            )
            await session.commit()
            log.info("Email verified", extra={"email": user_exist.email, "user_id": user_exist.id})


    @classmethod
    async def get_users_list(cls, offset: int = 0, limit: int = 10) -> List[UserModel]:
        async with async_session_maker() as session:
            users = await UserDAO.find_all(session, offset, limit)

            if users is None:
                log.warning("Users not found")
                raise UserNotFoundException
            log.debug("Users fetched", extra={"count": len(users), "offset": offset, "limit": limit})
            return users


    @classmethod
    async def update_user(cls, user_id: int, update_user: UserUpdate) -> User:
        async with async_session_maker() as session:

            user_exist = await UserDAO.find_one_or_none(session, id=user_id)

            if user_exist is None:
                log.warning("User not found", extra={"user_id": user_id})
                raise UserNotFoundException

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
                raise UserNotFoundException

            await UserDAO.update(
                session,
                UserModel.id==user_id,
                obj_in={"is_active": False}
            )
            await session.commit()
            log.info("User is inactive", extra={"user_id": user_id})


    @classmethod
    async def change_password(cls, user: UserModel, change_password: ChangePassword):
        async with async_session_maker() as session:
            if not verify_password(change_password.old_password, user.hashed_password):
                log.warning("Invalid current password", extra={"user_id": user.id})
                raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid current password")

            await UserDAO.update(
                session,
                UserModel.id==user.id,
                obj_in={"hashed_password": hash_password(change_password.new_password)}
            )
            await session.commit()
            log.info("Successfully changed password", extra={"user_id": user.id})


    @classmethod
    async def send_reset_password_email(cls, username: str):
        async with async_session_maker() as session:
            user = await UserDAO.find_one_or_none(session, username=username)

            if user is None:
                raise UserNotFoundException

            token = cls._create_uuid_token()
            url = f"{settings.URL}/reset-password/{token}"
            token_expires = timedelta(minutes=settings.EMAIL_TOKEN_EXPIRE_MINUTES)

            await ChangePasswordTokenStorage.save_token(
                token,
                user.id,
                int(token_expires.total_seconds())
            )

            EmailTasks.send_reset_password_email_task.delay(
                email=user.email,
                username=user.username,
                url=url
            )


    @classmethod
    async def reset_password(cls, token: uuid.UUID, new_password: str):
        async with async_session_maker() as session:
            user_id = await ChangePasswordTokenStorage.getdel_token(token)

            if user_id is None:
                raise TokenExpiredException

            user_exist = await UserDAO.find_one_or_none(session, id=int(user_id))

            if user_exist is None:
                raise InvalidTokenException

            await UserDAO.update(
                session,
                UserModel.id==user_exist.id,
                obj_in={"hashed_password": hash_password(new_password)}
            )
            await session.commit()
            log.info("Successfully reset password", extra={"user_id": user_id})


    @classmethod
    async def upload_avatar(cls, user: UserModel, avatar: UploadFile) -> User:
        async with async_session_maker() as session:
            allowed_types = ["image/jpeg", "image/png", "image/gif"]

            if not avatar.content_type in allowed_types:
                log.warning("Using not allowed type photo", extra={"user_id": user.id})
                raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="allowed type png and jpeg")

            if user.avatar_url is not None:
                await cls.delete_avatar(user)

            type: str = avatar.filename.split(".")[-1]
            object_name: str = f"avatar_{user.id}_{uuid.uuid4()}.{type}"

            url = await s3_client.upload_file(
                file=avatar.file.read(),
                object_name=object_name,
                content_type=avatar.content_type
            )

            update_user = await UserDAO.update(
                session,
                UserModel.id==user.id,
                obj_in={"avatar_url": url}
            )
            await session.commit()
            log.info("Successfully upload avatar", extra={"user_id": user.id, "avatar_url": url})
            return update_user


    @classmethod
    async def delete_avatar(cls, user: UserModel):
        async with async_session_maker() as session:

            if user.avatar_url is None:
                log.warning("Avatar is none", extra={"user_id": user.id})
                return

            avatar_name = user.avatar_url.split("/")[-1]

            await s3_client.delete_file(avatar_name)

            await UserDAO.update(
                session,
                UserModel.id==user.id,
                obj_in={"avatar_url": None}
            )
            log.info("Avatar successfully deleted", extra={"user_id": user.id})
            await session.commit()