"""
Echon Post/Memory Schemas
Pydantic models for memories, photos, and posts

PATH: echon/backend/app/schemas/post.py
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Union
from datetime import datetime
from uuid import UUID


# --- REQUEST SCHEMAS ---

class PostCreate(BaseModel):
    """Create a new memory/post"""
    space_id: str
    content: Optional[str] = None
    media_urls: Optional[List[str]] = None  # List of uploaded file paths
    media_type: Optional[str] = None  # "photo", "video", "audio"
    event_date: Optional[str] = None  # When the memory happened (ISO string)
    location: Optional[str] = None  # Where the memory happened
    privacy_level: str = "space"  # "space", "close_family", "extended_family"
    tags: Optional[List[str]] = None  # ["wedding", "albania", "1995"]


class CommentCreate(BaseModel):
    """Add comment to a post"""
    post_id: str
    content: str


class ReactionCreate(BaseModel):
    """Add reaction to a post"""
    post_id: str
    reaction_type: str  # "heart", "love", "care", "tears", "wow"


# --- RESPONSE SCHEMAS ---

class UserBrief(BaseModel):
    """Brief user info for posts"""
    id: Union[UUID, str]
    name: str
    profile_photo_url: Optional[str] = None
    
    class Config:
        from_attributes = True
        json_encoders = {UUID: str}


class CommentResponse(BaseModel):
    """Comment response"""
    id: Union[UUID, str]
    post_id: Union[UUID, str]
    user_id: Union[UUID, str]
    content: str
    created_at: datetime
    user: Optional[UserBrief] = None
    
    class Config:
        from_attributes = True
        json_encoders = {UUID: str}


class ReactionResponse(BaseModel):
    """Reaction response"""
    id: Union[UUID, str]
    post_id: Union[UUID, str]
    user_id: Union[UUID, str]
    reaction_type: str
    created_at: datetime
    user: Optional[UserBrief] = None
    
    class Config:
        from_attributes = True
        json_encoders = {UUID: str}


class PostResponse(BaseModel):
    """Post/Memory response"""
    id: Union[UUID, str]
    space_id: Union[UUID, str]
    user_id: Union[UUID, str]
    content: Optional[str] = None
    media_urls: Optional[List[str]] = None
    media_type: Optional[str] = None
    event_date: Optional[str] = None  # ✅ Changed to string
    location: Optional[str] = None
    privacy_level: str
    created_at: datetime
    updated_at: datetime
    
    # Related data
    user: Optional[UserBrief] = None
    comments: Optional[List[CommentResponse]] = []
    reactions: Optional[List[ReactionResponse]] = []
    tags: Optional[List[str]] = []
    
    # Counts
    comment_count: int = 0
    reaction_count: int = 0
    
    class Config:
        from_attributes = True
        json_encoders = {UUID: str}


class PostListResponse(BaseModel):
    """Paginated post list"""
    posts: List[PostResponse]
    total: int
    page: int
    per_page: int
    has_more: bool