from datetime import date

from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy import DATE

from app.core.database import Base

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