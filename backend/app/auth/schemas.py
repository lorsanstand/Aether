import uuid

from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    refresh_token: uuid.UUID
    token_type: str