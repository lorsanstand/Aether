from typing import Dict, Optional

from fastapi import WebSocket


class ConnectManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}


    def get_connection(self, user_id: str) -> Optional[WebSocket]:
        return self.active_connections.get(user_id)


    def add_connection(self, user_id: str, ws: WebSocket):
        self.active_connections[user_id] = ws


    def delete_connection(self, user_id: str):
        self.active_connections.pop(user_id)

    @property
    def count_connections(self) -> int:
        return len(self.active_connections)



manager = ConnectManager()