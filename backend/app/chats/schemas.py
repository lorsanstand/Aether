from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, ConfigDict


class MessageCreate(BaseModel):
    recipient_id: Optional[int] = None
    chat_id: Optional[uuid.UUID] = None
    content: str


class MessageUpdate(BaseModel):
    id: uuid.UUID
    content: str


class MessageCreateDB(BaseModel):
    sender_id: Optional[int]
    chat_id: Optional[uuid.UUID]
    content: Optional[str]
    is_read: Optional[bool] = False
    is_edited: Optional[bool] = False


class MessageUpdateDB(BaseModel):
    content: Optional[str]
    is_edited: Optional[bool] = False



class Message(BaseModel):
    id: uuid.UUID
    sender_id: int
    chat_id: uuid.UUID
    content: str
    is_edited: Optional[bool] = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatBase(BaseModel):
    is_group: Optional[bool] = False
    last_message: Optional[str] = None


class ChatCreateDB(ChatBase):
    pass


class ChatUpdateDB(ChatBase):
    pass


class Chat(BaseModel):
    chat_id: uuid.UUID
    user_id: int
    last_message: Optional[str]
    avatar_url: Optional[str]
    display_name: str


class ParticipantCreateDB(BaseModel):
    chat_id: Optional[uuid.UUID]
    user_id: Optional[int]


class ParticipantUpdateDB(BaseModel):
    chat_id: Optional[uuid.UUID]
    user_id: Optional[int]