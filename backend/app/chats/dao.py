import uuid
from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select, and_

from app.core.dao import BaseDAO
from app.chats.models import ChatModel, MessageModel, ParticipantModel
from app.chats.schemas import ChatCreateDB, MessageCreateDB, ParticipantCreateDB
from app.chats.schemas import ChatUpdateDB, MessageUpdateDB, ParticipantUpdateDB
from app.users.models import UserModel


class ChatDAO(BaseDAO[ChatModel, ChatCreateDB, ChatUpdateDB]):
    model = ChatModel

    @classmethod
    async def get_chat_id(cls, session: AsyncSession, user_a_id: int, user_b_id: int) -> Optional[uuid.UUID]:
        stmt = (
            select(ParticipantModel.chat_id)
            .join(ChatModel)
            .where(ChatModel.is_group == False)
            .where(ParticipantModel.user_id.in_([user_a_id, user_b_id]))
            .group_by(ParticipantModel.chat_id)
            .having(func.count(ParticipantModel.chat_id) == 2)
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()


    @classmethod
    async def get_chats(cls, session: AsyncSession, user_id: int, offset: int = 0, limit: int = 10):

        stmt = (
            select(
                ChatModel.id.label("chat_id"),
                ChatModel.last_message,
                UserModel.id.label("user_id"),
                UserModel.avatar_url,
                UserModel.display_name
            )
            .join(ParticipantModel, ParticipantModel.chat_id==ChatModel.id)
            .join(UserModel, UserModel.id==ParticipantModel.user_id)
            .where(
                ChatModel.id.in_(
                    select(ParticipantModel.chat_id).where(ParticipantModel.user_id==user_id)
                )
            )
            .where(UserModel.id!=user_id)
            .where(ChatModel.is_group==False)
            .order_by(ChatModel.updated_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await session.execute(stmt)
        return result.mappings().all()


    @classmethod
    async def get_chat_with_participant(cls, session: AsyncSession, chat_id: uuid.UUID, user_id: int):
        stmt = (
            select(ChatModel, ParticipantModel.id.label("participant_id"))
            .outerjoin(
                ParticipantModel,
                and_(
                    ParticipantModel.chat_id==ChatModel.id,
                    ParticipantModel.user_id==user_id
                )
            )
            .where(ChatModel.id==chat_id)
        )
        result = await session.execute(stmt)
        return result.first()


class MessageDAO(BaseDAO[MessageModel, MessageCreateDB, MessageUpdateDB]):
    model = MessageModel

    @classmethod
    async def find_all_asc(
            cls,
            session: AsyncSession,
            offset: Optional[int],
            limit: Optional[int],
            *filter,
            **filter_by
    ) -> List[MessageModel]:
        stmt = select(MessageModel).filter(*filter).filter_by(**filter_by).order_by(MessageModel.created_at.asc())

        if offset is not None:
            stmt = stmt.offset(offset)
        if limit is not None:
            stmt = stmt.limit(limit)

        result = await session.execute(stmt)
        return result.scalars().all()


class ParticipantDAO(BaseDAO[ParticipantModel, ParticipantCreateDB, ParticipantUpdateDB]):
    model = ParticipantModel