"""
Echon Activity Feed Schemas
Recent activity and quick updates

PATH: echon/backend/app/schemas/activity.py
"""

from pydantic import BaseModel
from typing import Optional, List, Union
from datetime import datetime
from uuid import UUID


# --- RESPONSE SCHEMAS ---

class ActivityItem(BaseModel):
    """Single activity item"""
    id: Union[UUID, str]
    type: str  # "memory", "story", "member_joined", "comment", "reaction"
    space_id: Union[UUID, str]
    user_id: Union[UUID, str]
    content: Optional[str] = None
    related_id: Optional[Union[UUID, str]] = None  # ID of post, member, etc.
    created_at: datetime
    
    # User info
    user_name: str
    user_photo: Optional[str] = None
    
    # Type-specific data
    preview_url: Optional[str] = None  # For photos/audio
    preview_text: Optional[str] = None  # For posts
    
    class Config:
        from_attributes = True
        json_encoders = {UUID: str}


class ActivityFeedResponse(BaseModel):
    """Activity feed with recent items"""
    activities: List[ActivityItem]
    total: int
    page: int
    per_page: int
    has_more: bool


class QuickUpdateCreate(BaseModel):
    """Create a quick update/status"""
    space_id: str
    content: str  # What's happening?


class SpaceStats(BaseModel):
    """Space statistics"""
    total_members: int
    total_memories: int
    total_stories: int
    total_comments: int
    recent_activity_count: int  # Last 7 days