import logging
from typing import Optional

from fastapi import Depends, HTTPException, status
from jose import jwt, JWTError

from app.utils.OAuth2WithCookie import OAuth2PasswordBearerWithCookie
from app.core.config import settings
from app.users.models import UserModel
from app.users.service import UserService
from app.core.exceptions import InvalidTokenException

log = logging.getLogger(__name__)
oauth2_scheme = OAuth2PasswordBearerWithCookie(tokenUrl="/api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> Optional[UserModel]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=settings.ALGORITHM)
        user_id = int(payload.get("sub"))
        log.debug("Successfully get current_user id", extra={"user_id": user_id})

        if user_id is None:
            log.warning("User id is None")
            raise InvalidTokenException
    except (Exception, JWTError) as ex:
        if isinstance(ex, InvalidTokenException):
            raise ex

        if isinstance(ex, JWTError):
            log.error("JWT error")
            raise ex

        log.error("Unknown exception")
        raise ex

    current_user = await UserService.get_user(user_id)

    if not current_user.is_active:
        log.debug("User is not active", extra={"user_id": current_user.id})
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="User is not active")

    return current_user


async def get_current_superuser(current_user: UserModel = Depends(get_current_user)) -> Optional[UserModel]:
    if not current_user.is_superuser:
        log.debug("User not enough privileges", extra={"user_id": current_user.id})
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Not enough privileges")

    return current_user

async def get_current_verified_user(current_user: UserModel = Depends(get_current_user)):
    if not current_user.is_verified:
        log.debug("User has not confirmed the email.", extra={"user_id": str(current_user.id)})
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="verify email")

    return current_user