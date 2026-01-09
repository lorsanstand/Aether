from typing import Dict
import logging

from fastapi import APIRouter, Response, Depends, UploadFile, File

from app.users.schemas import User, UserUpdate
from app.users.service import UserService
from app.auth.service import AuthService
from app.users.models import UserModel
from app.auth.dependencies import get_current_verified_user, get_current_superuser

router = APIRouter(prefix="/users", tags=["User"])

log = logging.getLogger(__name__)


@router.get("/me")
async def get_current_user(user: UserModel = Depends(get_current_verified_user)) -> User:
    log.debug("Getting current user profile", extra={"user_id": str(user.id)})
    return user

@router.get("/")
async def get_users(offset: int, limit: int, user: UserModel = Depends(get_current_superuser)):
    log.info("Getting users list", extra={"offset": offset, "limit": limit})
    return await UserService.get_users_list(offset=offset, limit=limit)

@router.put("/me")
async def update_current_user(update_user: UserUpdate, user: UserModel = Depends(get_current_verified_user)) -> User:
    return await UserService.update_user(user.id, update_user)

@router.delete("/me")
async def delete_current_user(response: Response, user: UserModel = Depends(get_current_verified_user)) -> Dict:
    log.debug("User deleting their account", extra={"user_id": user.id, "email": user.email})
    response.delete_cookie('access_token')
    response.delete_cookie('refresh_token')

    await AuthService.abort_all_sessions(user.id)
    await UserService.delete_user(user.id)
    return {"status": True, "message": "User successfully deleted"}

@router.post("/me/avatar")
async def upload_avatar(
        avatar: UploadFile = File(...),
        user: UserModel = Depends(get_current_verified_user)
) -> User:
    return await UserService.upload_avatar(user, avatar)

@router.delete('/me/avatar')
async def delete_avatar(user: UserModel = Depends(get_current_verified_user)) -> Dict:
    await UserService.delete_avatar(user)
    return {"status": True, "message": "Avatar successfully deleted"}