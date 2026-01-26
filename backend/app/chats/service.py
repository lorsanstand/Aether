import json
import uuid
from typing import List, Dict
import logging

from fastapi import HTTPException, status, WebSocket
from sqlalchemy import and_

from app.core.database import async_session_maker
from app.chats.dao import ChatDAO, MessageDAO, ParticipantDAO
from app.chats.models import ChatModel, MessageModel, ParticipantModel
from app.chats.schemas import Chat, MessageCreate, MessageCreateDB, ChatCreateDB, ParticipantCreateDB, Message, MessageUpdateDB, MessageUpdate
from app.users.models import UserModel
from app.core.redis import get_redis
from app.utils.connect_manager import manager

log = logging.getLogger(__name__)


class ChatService:

    @classmethod
    async def get_chats(cls, user: UserModel, offset: int, limit: int) -> List[Chat]:
        log.debug("Getting chats", extra={"user_id": user.id, "offset": offset, "limit": limit})
        async with async_session_maker() as session:
            chats = await ChatDAO.get_chats(session, user.id, offset, limit)
            log.debug("Retrieved chats", extra={"user_id": user.id, "count": len(chats)})
            return chats


    @classmethod
    async def send_message(cls, sender: UserModel, message: MessageCreate) -> Message:
        log.info("Sending message", extra={"sender_id": sender.id, "chat_id": message.chat_id, "recipient_id": message.recipient_id})
        async with async_session_maker() as session:
            target_chat_id = message.chat_id

            if target_chat_id is None:
                if message.recipient_id is None:
                    log.warning("Message send failed: missing chat_id and recipient_id", extra={"sender_id": sender.id})
                    raise HTTPException(status.HTTP_400_BAD_REQUEST, "Need chat_id or user_id")

                target_chat_id = await ChatDAO.get_chat_id(session, sender.id, message.recipient_id)

                if target_chat_id is None:
                    log.info("Creating new chat", extra={"sender_id": sender.id, "recipient_id": message.recipient_id})
                    target_chat_db = await ChatDAO.add(
                        session,
                        obj_in=ChatCreateDB(
                            is_group=False,
                            last_message=message.content
                        )
                    )
                    target_chat_id: uuid.UUID = target_chat_db.id

                    await ParticipantDAO.add(
                        session,
                        obj_in=ParticipantCreateDB(
                            user_id=sender.id,
                            chat_id=target_chat_id
                        )
                    )
                    await ParticipantDAO.add(
                        session,
                        obj_in=ParticipantCreateDB(
                            user_id=message.recipient_id,
                            chat_id=target_chat_id
                        )
                    )
                    log.info("Created new chat", extra={"chat_id": target_chat_id, "sender_id": sender.id, "recipient_id": message.recipient_id})


            members = await ParticipantDAO.find_all(
                session,
                None,
                None,
                ParticipantModel.chat_id==target_chat_id
                )

            members_ids = [member.user_id for member in members]

            if not sender.id in members_ids :
                log.warning("Access denied to chat", extra={"user_id": sender.id, "chat_id": message.chat_id})
                raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Access denied")


            message_db = await MessageDAO.add(
                session,
                obj_in=MessageCreateDB(
                    sender_id=sender.id,
                    chat_id=target_chat_id,
                    content=message.content
                )
            )

            await cls._send_ws_message(members_ids, Message.model_validate(message_db))

            await ChatDAO.update(
                session,
                ChatModel.id==target_chat_id,
                obj_in={"last_message": message.content}
            )
            await session.commit()
            log.info("Message sent", extra={"message_id": message_db.id, "sender_id": sender.id, "chat_id": target_chat_id})
            return message_db


    @classmethod
    async def get_chat(cls, chat_id: uuid.UUID, user: UserModel, offset: int = 0, limit: int = 0) -> List[Message]:
        log.debug("Getting chat messages", extra={"user_id": user.id, "chat_id": chat_id, "offset": offset, "limit": limit})
        async with async_session_maker() as session:
            chat_exist = await ChatDAO.get_chat_with_participant(session, chat_id, user.id)

            if chat_exist is None:
                log.warning("Chat not found", extra={"user_id": user.id, "chat_id": chat_id})
                raise HTTPException(status.HTTP_404_NOT_FOUND, "Chat not found")
            if chat_exist.participant_id is None:
                log.warning("Access denied to chat", extra={"user_id": user.id, "chat_id": chat_id})
                raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Access denied")

            messages = await MessageDAO.find_all_desc(
                session,
                offset,
                limit,
                MessageModel.chat_id==chat_id
            )

            log.debug("Retrieved chat messages", extra={"user_id": user.id, "chat_id": chat_id, "count": len(messages)})
            return messages


    @classmethod
    async def save_websocket(cls, user: UserModel, ws: WebSocket):
        manager.add_connection(user_id=str(user.id), ws=ws)
        log.info("WebSocket connection saved", extra={"user_id": user.id, "active_connections": manager.count_connections + 1})



    @classmethod
    async def delete_websocket(cls, user: UserModel):
        manager.delete_connection(user_id=str(user.id))
        log.info("WebSocket connection deleted", extra={"user_id": user.id, "active_connections": manager.count_connections - 1})


    @classmethod
    async def _send_ws_message(cls, user_ids: List[int], message: Message):
        redis_client = await get_redis()
        for user_id in user_ids:
            payload = {
                "user_id": str(user_id),
                "type": "send",
                "data": message.model_dump(mode='json')
            }
            await redis_client.publish("messenger_updates", json.dumps(payload))
            log.debug(f"Published message for user_id: {user_id}")


    @classmethod
    async def _delete_ws_message(cls, user_ids: List[int], message_id: uuid.UUID):
        redis_client = await get_redis()
        for user_id in user_ids:
            payload = {
                "user_id": str(user_id),
                "type": "del",
                "data": str(message_id)
            }
            await redis_client.publish("messenger_updates", json.dumps(payload))
            log.debug(f"Published message for user_id: {user_id}")


    @classmethod
    async def update_message(cls, user: UserModel, message_update: MessageUpdate) -> Message:
        async with async_session_maker() as session:
            message_exist = await MessageDAO.find_one_or_none(
                session,
            MessageModel.id==message_update.id
            )

            if message_exist is None:
                log.warning("Message not found", extra={"user_id": user.id, "message_id": message_update.id})
                raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Message not found")
            if message_exist.sender_id != user.id:
                log.warning("User does not have access to this message",
                            extra={"user_id": user.id, "message_id": message_update.id})
                raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Message not allowed")


            message_update_db = await MessageDAO.update(
                session,
                MessageModel.id==message_update.id,
                obj_in=MessageUpdateDB(
                    content=message_update.content,
                    is_edited=True
                )
            )

            members = await ParticipantDAO.find_all(
                session,
                None,
                None,
                ParticipantModel.chat_id==message_exist.chat_id
            )

            member_ids = [member.user_id for member in members]

            await cls._send_ws_message(member_ids, Message.model_validate(message_update_db))

            await session.commit()
            log.info("Message update successfully", extra={"user_id": user.id, "message_id": message_update.id})
            return message_update_db


    @classmethod
    async def delete_message(cls, user: UserModel, message_id: uuid.UUID):
        async with async_session_maker() as session:
            message_exist = await MessageDAO.find_one_or_none(
                session,
                MessageModel.id==message_id,
            )

            if message_exist is None:
                log.warning("Message not found", extra={"user_id": user.id, "message_id": message_id})
                raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Message not found")
            if message_exist.sender_id != user.id:
                log.warning("User does not have access to this message",
                            extra={"user_id": user.id, "message_id": message_id})
                raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Message not allowed")

            members = await ParticipantDAO.find_all(
                session,
                None,
                None,
                ParticipantModel.chat_id==message_exist.chat_id
            )
            member_ids = [member.user_id for member in members]

            await MessageDAO.delete(session, MessageModel.id==message_id)

            await cls._delete_ws_message(member_ids, message_id)

            await session.commit()
            log.info("Message delete successfully", extra={"user_id": user.id, "message_id": message_exist.id})