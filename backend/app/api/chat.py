"""
Echon Chat API
Family group chat with real-time WebSocket support

PATH: echon/backend/app/api/chat.py
"""

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from typing import Dict, List
import json

from ..core.database import get_db
from ..core.security import decode_access_token
from ..models import Post, User, SpaceMember
from ..schemas.chat import ChatMessageCreate, ChatMessage, ChatMessagesResponse
from .auth import get_current_user

router = APIRouter()


# ─── WebSocket Connection Manager ────────────────────────────────────────────

class ChatConnectionManager:
    """Tracks active WebSocket connections per family space."""

    def __init__(self):
        # space_id -> list of connection dicts
        self.spaces: Dict[str, List[dict]] = {}

    async def connect(
        self,
        websocket: WebSocket,
        space_id: str,
        user_id: str,
        user_name: str,
        user_photo: str | None,
    ):
        await websocket.accept()
        if space_id not in self.spaces:
            self.spaces[space_id] = []
        self.spaces[space_id].append({
            "ws": websocket,
            "user_id": user_id,
            "user_name": user_name,
            "user_photo": user_photo,
        })

    def disconnect(self, websocket: WebSocket, space_id: str):
        if space_id in self.spaces:
            self.spaces[space_id] = [
                c for c in self.spaces[space_id] if c["ws"] is not websocket
            ]

    async def broadcast(self, space_id: str, payload: dict):
        """Send JSON payload to every connected client in the space."""
        if space_id not in self.spaces:
            return
        dead = []
        for conn in self.spaces[space_id]:
            try:
                await conn["ws"].send_json(payload)
            except Exception:
                dead.append(conn)
        for d in dead:
            try:
                self.spaces[space_id].remove(d)
            except ValueError:
                pass

    def presence_list(self, space_id: str) -> List[dict]:
        """Return list of currently connected users in a space."""
        if space_id not in self.spaces:
            return []
        seen = set()
        result = []
        for c in self.spaces[space_id]:
            if c["user_id"] not in seen:
                seen.add(c["user_id"])
                result.append({
                    "user_id": c["user_id"],
                    "user_name": c["user_name"],
                    "user_photo": c["user_photo"],
                })
        return result


chat_manager = ChatConnectionManager()


# ─── Helpers ─────────────────────────────────────────────────────────────────

def check_space_membership(db: Session, user_id: str, space_id: str) -> bool:
    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == user_id,
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True,
    ).first()
    return membership is not None


# ─── WebSocket endpoint ───────────────────────────────────────────────────────

@router.websocket("/ws/{space_id}")
async def chat_websocket(
    websocket: WebSocket,
    space_id: str,
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    """
    WebSocket endpoint for real-time family chat.
    Connect with: ws://host/api/chat/ws/{space_id}?token={jwt}
    """
    # Authenticate via token query param (WS can't use Authorization header)
    user_id = decode_access_token(token)
    if not user_id:
        await websocket.close(code=4001, reason="Invalid token")
        return

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        await websocket.close(code=4001, reason="User not found")
        return

    if not check_space_membership(db, str(user.id), space_id):
        await websocket.close(code=4003, reason="Not a member of this space")
        return

    # Connect
    await chat_manager.connect(
        websocket, space_id, str(user.id), user.name, user.profile_photo_url
    )

    # Notify others: someone entered
    await chat_manager.broadcast(space_id, {
        "type": "presence",
        "event": "joined",
        "user_id": str(user.id),
        "user_name": user.name,
        "online": chat_manager.presence_list(space_id),
    })

    try:
        while True:
            # Keep-alive: client sends "ping", we reply "pong"
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        chat_manager.disconnect(websocket, space_id)
        await chat_manager.broadcast(space_id, {
            "type": "presence",
            "event": "left",
            "user_id": str(user.id),
            "user_name": user.name,
            "online": chat_manager.presence_list(space_id),
        })


# ─── REST: Send message (persists + broadcasts) ───────────────────────────────

@router.post("/send", status_code=status.HTTP_201_CREATED)
async def send_message(
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Send a chat message.
    Saves to DB and broadcasts to all connected WS clients in the space.
    """
    if not check_space_membership(db, current_user.id, message_data.space_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this space",
        )

    new_message = Post(
        space_id=message_data.space_id,
        author_id=current_user.id,
        type="chat",
        content=message_data.content,
        privacy_level="space",
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    payload = {
        "type": "message",
        "id": str(new_message.id),
        "space_id": str(new_message.space_id),
        "user_id": str(current_user.id),
        "user_name": current_user.name,
        "user_photo": current_user.profile_photo_url,
        "content": new_message.content,
        "created_at": new_message.created_at.isoformat(),
    }

    # Broadcast to all WS clients in this space
    await chat_manager.broadcast(str(message_data.space_id), payload)

    return ChatMessage(
        id=str(new_message.id),
        space_id=str(new_message.space_id),
        user_id=str(current_user.id),
        content=new_message.content,
        created_at=new_message.created_at,
        user_name=current_user.name,
        user_photo=current_user.profile_photo_url,
    )


# ─── REST: Load message history ───────────────────────────────────────────────

@router.get("/messages/{space_id}")
def get_messages(
    space_id: str,
    page: int = 1,
    per_page: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Load chat history for a space (oldest-first for display)."""
    if not check_space_membership(db, current_user.id, space_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this space",
        )

    total = db.query(Post).filter(
        Post.space_id == space_id,
        Post.type == "chat",
        Post.is_active == True,
    ).count()

    offset = (page - 1) * per_page
    messages_query = (
        db.query(Post)
        .filter(Post.space_id == space_id, Post.type == "chat", Post.is_active == True)
        .order_by(desc(Post.created_at))
        .offset(offset)
        .limit(per_page)
        .all()
    )

    chat_messages = []
    for msg in messages_query:
        author = db.query(User).filter(User.id == msg.author_id).first()
        if author:
            chat_messages.append(ChatMessage(
                id=str(msg.id),
                space_id=str(msg.space_id),
                user_id=str(msg.author_id),
                content=msg.content,
                created_at=msg.created_at,
                user_name=author.name,
                user_photo=author.profile_photo_url,
            ))

    chat_messages.reverse()  # Oldest first for display

    return ChatMessagesResponse(
        messages=chat_messages,
        total=total,
        page=page,
        per_page=per_page,
        has_more=(offset + len(chat_messages)) < total,
    )


# ─── REST: Delete message ─────────────────────────────────────────────────────

@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    message_id: str,
    space_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a chat message. Only author or founders can delete."""
    message = db.query(Post).filter(
        Post.id == message_id, Post.type == "chat"
    ).first()

    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == current_user.id,
        SpaceMember.space_id == space_id,
    ).first()

    is_author = str(message.author_id) == str(current_user.id)
    is_founder = membership and membership.role == "founder"

    if not (is_author or is_founder):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own messages",
        )

    message.is_active = False
    db.commit()
    return None
