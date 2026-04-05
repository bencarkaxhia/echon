"""
Echon Space Presence API
Tracks who is currently on the door / home scene in real-time.

PATH: echon/backend/app/api/presence.py
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy.orm import Session
from typing import Dict, List

from ..core.database import get_db
from ..core.security import decode_access_token
from ..models import User, SpaceMember

router = APIRouter()


# ─── Presence Manager ────────────────────────────────────────────────────────

class SpacePresenceManager:
    """Tracks who is live on the door scene per family space."""

    def __init__(self):
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

    def presence_list(self, space_id: str) -> List[dict]:
        if space_id not in self.spaces:
            return []
        seen: set = set()
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

    async def broadcast_presence(self, space_id: str):
        """Push updated presence list to all connections in the space."""
        if space_id not in self.spaces:
            return
        payload = {"type": "presence", "online": self.presence_list(space_id)}
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


presence_manager = SpacePresenceManager()


# ─── WebSocket endpoint ───────────────────────────────────────────────────────

@router.websocket("/ws/{space_id}")
async def space_presence_ws(
    websocket: WebSocket,
    space_id: str,
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    """
    WebSocket for door-scene presence.
    Connect: ws://host/api/presence/ws/{space_id}?token={jwt}
    Server sends: {"type": "presence", "online": [{user_id, user_name, user_photo?}]}
    Client sends: "ping" → server replies "pong"
    """
    user_id = decode_access_token(token)
    if not user_id:
        await websocket.close(code=4001, reason="Invalid token")
        return

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        await websocket.close(code=4001, reason="User not found")
        return

    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == user_id,
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True,
    ).first()
    if not membership:
        await websocket.close(code=4003, reason="Not a member of this space")
        return

    await presence_manager.connect(
        websocket, space_id, str(user.id), user.name, user.profile_photo_url
    )
    await presence_manager.broadcast_presence(space_id)

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        presence_manager.disconnect(websocket, space_id)
        await presence_manager.broadcast_presence(space_id)
