"""
Echon Chat Schemas
PATH: echon/backend/app/schemas/chat.py
"""

from datetime import datetime
from typing import List

from pydantic import BaseModel


# --- BASE MODELS ---


class ChatMessageBase(BaseModel):
    space_id: str
    content: str


# --- CREATE ---


class ChatMessageCreate(ChatMessageBase):
    """
    Payload for sending a new chat message.
    """
    pass


# --- RESPONSE ITEM ---


class ChatMessage(ChatMessageBase):
    id: str
    user_id: str
    created_at: datetime
    user_name: str
    user_photo: str | None = None

    class Config:
        from_attributes = True  # for ORM mode (Pydantic v1: orm_mode = True)


# --- LIST RESPONSE ---


class ChatMessagesResponse(BaseModel):
    messages: List[ChatMessage]
    total: int
    page: int
    per_page: int
    has_more: bool
