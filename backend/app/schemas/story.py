"""
Echon Story Schemas
Pydantic models for voice recordings and oral history

PATH: echon/backend/app/schemas/story.py
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Union
from datetime import datetime
from uuid import UUID


# --- REQUEST SCHEMAS ---

class StoryCreate(BaseModel):
    """Create a new voice story"""
    space_id: str
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    audio_url: str  # URL from upload
    duration: Optional[int] = None  # Duration in seconds
    story_date: Optional[str] = None  # When the story is about
    location: Optional[str] = None  # Where the story is about
    tags: Optional[List[str]] = None  # ["childhood", "war", "migration"]


# --- RESPONSE SCHEMAS ---

class StoryTeller(BaseModel):
    """Who told the story"""
    id: Union[UUID, str]
    name: str
    profile_photo_url: Optional[str] = None
    
    class Config:
        from_attributes = True
        json_encoders = {UUID: str}


class StoryResponse(BaseModel):
    """Voice story response"""
    id: Union[UUID, str]
    space_id: Union[UUID, str]
    author_id: Union[UUID, str]
    title: str
    description: Optional[str] = None
    audio_url: str
    duration: Optional[int] = None
    story_date: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Related data
    author: Optional[StoryTeller] = None
    tags: Optional[List[str]] = []
    play_count: int = 0
    
    class Config:
        from_attributes = True
        json_encoders = {UUID: str}


class StoryListResponse(BaseModel):
    """Paginated story list"""
    stories: List[StoryResponse]
    total: int
    page: int
    per_page: int
    has_more: bool