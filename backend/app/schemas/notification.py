"""
Notification Schemas
API models for notifications

PATH: echon/backend/app/schemas/notification.py
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationResponse(BaseModel):
    """Notification response"""
    id: str
    user_id: str
    space_id: str
    type: str
    title: str
    message: str
    link_url: Optional[str] = None
    actor_id: Optional[str] = None
    actor_name: Optional[str] = None
    actor_photo: Optional[str] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """List of notifications with count"""
    notifications: list[NotificationResponse]
    total: int
    unread_count: int


class NotificationStats(BaseModel):
    """Notification statistics"""
    total: int
    unread: int
    today: int