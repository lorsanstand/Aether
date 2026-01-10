from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import ForeignKey

from app.core.database import Base


class MessageModel(Base):
    __tablename__ = "message"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), index=True)
    recipient_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), index=True)
    content: Mapped[str] = mapped_column()