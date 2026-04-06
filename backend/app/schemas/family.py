"""
Echon Family/Member Schemas
Pydantic models for family members and profiles

PATH: echon/backend/app/schemas/family.py
"""

from pydantic import BaseModel, Field
from typing import Optional, Union
from datetime import datetime, date
from uuid import UUID


# --- REQUEST SCHEMAS ---

class MemberUpdate(BaseModel):
    """Update member profile"""
    name: Optional[str] = None
    birth_year: Optional[int] = None
    birth_date: Optional[date] = None       # Full date for birthday reminders (MM-DD used, year optional)
    birth_location: Optional[str] = None
    generation: Optional[str] = None  # "elder", "middle", "younger"
    lineage: Optional[str] = None  # "paternal", "maternal", "both"
    relationship_to_founder: Optional[str] = None  # "Father", "Mother", etc.


# --- RESPONSE SCHEMAS ---

class MemberProfile(BaseModel):
    """Full member profile"""
    # User info
    id: Union[UUID, str]
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    birth_year: Optional[int] = None
    birth_date: Optional[date] = None
    birth_location: Optional[str] = None
    profile_photo_url: Optional[str] = None

    # Space membership info
    role: str  # "founder", "elder", "member", "guest"
    generation: Optional[str] = None
    lineage: Optional[str] = None
    relationship_to_founder: Optional[str] = None
    joined_at: datetime

    # Stats
    post_count: int = 0
    comment_count: int = 0
    
    class Config:
        from_attributes = True
        json_encoders = {UUID: str}


class MemberBrief(BaseModel):
    """Brief member info for lists"""
    id: Union[UUID, str]
    name: str
    profile_photo_url: Optional[str] = None
    role: str
    generation: Optional[str] = None
    
    class Config:
        from_attributes = True
        json_encoders = {UUID: str}


class MemberListResponse(BaseModel):
    """List of members in a space"""
    members: list[MemberProfile]
    total: int
    founders: int
    elders: int
    regular_members: int  # ✅ Changed from 'members' to 'regular_members'