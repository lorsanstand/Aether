from typing import Dict
import logging
import uuid

from fastapi import APIRouter, status, Response, Depends, Request, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from app.users.schemas import UserCreate, User, Token
from app.users.service import AuthService, UserService
from app.users.models import UserModel
from app.exceptions import InvalidCredentialsException
from app.users.dependencies import get_current_user, get_current_verified_user
from app.config import settings

user_router = APIRouter(prefix="/users", tags=["User"])
auth_router = APIRouter(prefix="/auth", tags=["Auth"])

log = logging.getLogger(__name__)

@auth_router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate) -> User:
    return await UserService.register_new_user(user)

@auth_router.get("/verify/{token}")
async def verify_email(token: uuid.UUID) -> Dict:
    await UserService.verify_email(token)
    return {"status": True, "message": "User successfully verified email"}

@auth_router.post("/send/verify-email")
async def resend_verify_email(user: UserModel = Depends(get_current_user)) -> Dict:
    if user.is_verified:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Email already verified")

    await UserService.send_verify_email(user)
    return {"status": True, "message": "Successfully send email letter"}

@auth_router.post("/login")
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

@auth_router.post("/refresh")
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

@auth_router.post("/logout")
async def logout(request: Request, response: Response, user: UserModel = Depends(get_current_user)) -> Dict:
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")

    await AuthService.logout(uuid.UUID(request.cookies.get("refresh_token")))
    return {"status": True, "message": "Logged out successfully"}

@auth_router.post("/abort")
async def abort_all_sessions(user: UserModel = Depends(get_current_user)) -> Dict:
    await AuthService.abort_all_sessions(user.id)
    return {"status": True, "message": "All sessions was aborted"}