import uuid
from typing import List

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from app.chats.service import ChatService
from app.auth.dependencies import get_current_verified_user
from app.users.models import UserModel
from app.chats.schemas import Chat, MessageCreate, Message

router = APIRouter(prefix="/chats", tags=["chats"])

@router.get("/")
async def get_chats(
        offset: int = 0,
        limit: int = 10,
        user: UserModel = Depends(get_current_verified_user)
) -> List[Chat]:
    return await ChatService.get_chats(user, offset, limit)

@router.get("/{chat_id}")
async def get_chat(
        chat_id: uuid.UUID,
        offset: int = 0,
        limit: int = 10,
        user: UserModel = Depends(get_current_verified_user)
) -> List[Message]:
    return await ChatService.get_chat(chat_id, user, offset, limit)

@router.post("/message")
async def send_message(message: MessageCreate, user: UserModel = Depends(get_current_verified_user)) -> Message:
    return await ChatService.send_message(user, message)


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, user: UserModel = Depends(get_current_verified_user)):
    await ws.accept()
    await ChatService.save_websocket(user, ws)

    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        await ChatService.delete_websocket(user)