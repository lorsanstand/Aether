import json
import logging

from fastapi import WebSocket

from app.core.redis import get_redis
from app.utils.connect_manager import manager

log = logging.getLogger(__name__)


class PubSubMessenger:
    @classmethod
    def get_handlers(cls) -> dict:
        return dict(
            messenger_updates=cls.handle_message
        )

    @classmethod
    async def subscribe_to_channels(cls):
        print("test")
        redis_client = await get_redis()
        pubsub = redis_client.pubsub()

        await pubsub.subscribe(*cls.get_handlers().keys())

        async for message in pubsub.listen():
            log.debug(f"Received message from Redis: {message}")
            if message["type"] != "message":
                continue

            payload = json.loads(message["data"])
            user_id = payload["user_id"]

            ws = manager.get_connection(str(user_id))

            if ws is None:
                log.debug(f"User {user_id} not connected")
                continue

            handler = cls.get_handlers().get(message['channel'])
            if handler:
                await handler(payload["data"], ws)


    @classmethod
    async def handle_message(cls, message, ws: WebSocket):
        await ws.send_json(message)
        log.info(f"Message sent to user via WebSocket")



# async def message_listener():
#     redis_client = await get_redis()
#
#     pubsub = redis_client.pubsub()
#
#     await pubsub.subscribe("messenger_updates")
#
#     async for message in pubsub.listen():
#         log.debug(f"Received message from Redis: {message}")
#         if message["type"] == "message":
#             payload = json.loads(message["data"])
#             user_id = payload["user_id"]
#
#             ws = manager.get_connection(str(user_id))
#
#             if ws is None:
#                 log.debug(f"User {user_id} not connected")
#                 continue
#
#             await ws.send_json(payload["message"])
#             log.info(f"Message sent to user {user_id} via WebSocket")