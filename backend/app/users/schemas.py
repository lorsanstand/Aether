from typing import Optional
from datetime import date
import uuid

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    display_name: Optional[str] = None
    username: Optional[str] = None
    # email: Optional[str] = None
    birth_day: Optional[date] = None
    # description: str
    # avatar_url: str


class UserCreate(UserBase):
    display_name: str
    username: str
    email: EmailStr
    password: str

    class Config:
        from_attributes = True


class UserUpdate(UserBase):
    description: Optional[str] = None
    birth_day: Optional[date] = None


class User(UserBase):
    id: int
    display_name: str
    username: str
    email: EmailStr
    birth_day: Optional[date] = None
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_superuser: bool

class UserCreateDB(UserBase):
    email: Optional[str] = None
    hashed_password: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    is_superuser: Optional[bool] = None

class UserUpdateDB(UserBase):
    email: Optional[str] = None
    hashed_password: str
    description: Optional[str] = None
    birth_day: Optional[date] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    is_superuser: Optional[bool] = None

class Token(BaseModel):
    access_token: str
    refresh_token: uuid.UUID
    token_type: str

