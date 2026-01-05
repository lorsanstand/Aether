from datetime import date
import uuid

from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy import DATE, UUID, ForeignKey

from app.database import Base

class UserModel(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    display_name: Mapped[str] = mapped_column()
    username: Mapped[str] = mapped_column(index=True, unique=True)
    email: Mapped[str] = mapped_column(index=True, unique=True)
    birth_day: Mapped[date] = mapped_column(DATE, nullable=True)
    description: Mapped[str] = mapped_column(nullable=True)
    avatar_url: Mapped[str] = mapped_column(nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    is_verified: Mapped[bool] = mapped_column(default=False)
    is_superuser: Mapped[bool] = mapped_column(default=False)
    hashed_password: Mapped[str] = mapped_column()

# class RefreshSessionModel(Base):
#     __tablename__ = "refresh_session"
#
#     id: Mapped[int] = mapped_column(primary_key=True, index=True)
#     refresh_token: Mapped[uuid.UUID] = mapped_column(UUID, index=True)
#     expires_in: Mapped[int] = mapped_column()
#     user_ud: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))