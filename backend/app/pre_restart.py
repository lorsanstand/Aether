import asyncio

from app.core.database import async_session_maker
from app.core.config import settings
from app.users.schemas import UserCreateDB
from app.users.dao import UserDAO
from app.utils.hash_password import hash_password


async def init() -> None:
    async with async_session_maker() as session:
        super_user = await UserDAO.find_one_or_none(session, email=settings.FIRST_SUPER_USER_EMAIL)

        if super_user is not None:
            return

        await UserDAO.add(
            session,
            obj_in=UserCreateDB(
                email=settings.FIRST_SUPER_USER_EMAIL,
                username=settings.FIRST_SUPER_USER_USERNAME,
                display_name="Admin",
                hashed_password=hash_password(settings.FIRST_SUPER_USER_PASS),
                is_active=True,
                is_verified=True,
                is_superuser=True
            )
        )
        await session.commit()

asyncio.run(init())