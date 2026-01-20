import uuid

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import ForeignKey, UUID, UniqueConstraint

from app.core.database import Base


class MessageModel(Base):
    __tablename__ = "message"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, index=True, default=uuid.uuid4)
    sender_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="SET NULL"), index=True)
    chat_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("chat.id", ondelete="CASCADE"), index=True)
    content: Mapped[str] = mapped_column()
    is_read: Mapped[bool] = mapped_column(default=False)


class ChatModel(Base):
    __tablename__ = "chat"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, index=True, default=uuid.uuid4)
    is_group: Mapped[bool] = mapped_column(default=False)
    last_message: Mapped[str] = mapped_column(nullable=True)


class ParticipantModel(Base):
    __tablename__ = "Participant"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, index=True, default=uuid.uuid4)
    chat_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("chat.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), index=True)

    __table_args__ = (
        UniqueConstraint("chat_id", "user_id", name="uq_chat_user"),
    )