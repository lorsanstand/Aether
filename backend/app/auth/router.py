from typing import Dict
import logging
import uuid

from fastapi import APIRouter, status, Response, Depends, Request, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from app.users.schemas import UserCreate, User, ChangePassword
from app.auth.schemas import Token
from app.users.service import UserService
from app.auth.service import AuthService
from app.users.models import UserModel
from app.core.exceptions import InvalidCredentialsException
from app.auth.dependencies import get_current_user, get_current_verified_user
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])

log = logging.getLogger(__name__)

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate) -> User:
    return await UserService.register_new_user(user)

@router.post("/email/verify/{token}")
async def verify_email(token: uuid.UUID) -> Dict:
    await UserService.verify_email(token)
    return {"status": True, "message": "User successfully verified email"}

@router.post("/email/resend-verification")
async def resend_verify_email(user: UserModel = Depends(get_current_user)) -> Dict:
    if user.is_verified:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Email already verified")

    await UserService.send_verify_email(user)
    return {"status": True, "message": "Successfully send email letter"}

@router.post("/login")
async def login(response: Response, credentials: OAuth2PasswordRequestForm = Depends()) -> Token:
    user = await AuthService.authenticate_user(credentials.username, credentials.password)
    if not user:
        log.warning("Failed login attempt", extra={"email or username": credentials.username})
        raise InvalidCredentialsException
    token = await AuthService.create_token(user.id)
    response.set_cookie(
        'access_token',
        token.access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True
    )
    response.set_cookie(
        'refresh_token',
        str(token.refresh_token),
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 30 * 24 * 60,
        httponly=True
    )
    return token

@router.post("/refresh")
async def refresh_token(request: Request, response: Response) -> Token:
    new_token = await AuthService.refresh_token(uuid.UUID(request.cookies.get("refresh_token")))

    response.set_cookie(
        'access_token',
        new_token.access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True
    )
    response.set_cookie(
        'refresh_token',
        str(new_token.refresh_token),
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 30 * 24 * 60,
        httponly=True
    )
    log.debug("Token refreshed via endpoint")
    return new_token

@router.post("/logout")
async def logout(request: Request, response: Response, user: UserModel = Depends(get_current_user)) -> Dict:
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")

    await AuthService.logout(uuid.UUID(request.cookies.get("refresh_token")))
    return {"status": True, "message": "Logged out successfully"}

@router.post("/abort")
async def abort_all_sessions(user: UserModel = Depends(get_current_user)) -> Dict:
    await AuthService.abort_all_sessions(user.id)
    return {"status": True, "message": "All sessions was aborted"}

@router.post("/password/change")
async def change_password(
        passwords: ChangePassword,
        user: UserModel = Depends(get_current_verified_user)
) -> Dict:
    await UserService.change_password(user, passwords)
    return {"status": True, "message": "Successfully change password"}

@router.post("/password/reset")
async def send_reset_password_email(
        username: str
) -> Dict:
    await UserService.send_reset_password_email(username)
    return {"status": True, "message": "Successfully send email reset password"}

@router.post("/password/reset/{token}")
async def reset_password(token: uuid.UUID, new_password: str) -> Dict:
    await UserService.reset_password(token, new_password)
    return {"status": True, "message": "Successfully reset password"}