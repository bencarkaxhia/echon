"""
Echon Family Space Schemas
Pydantic models for space creation and management

PATH: echon/backend/app/schemas/space.py
"""

from pydantic import BaseModel, Field
from typing import Optional, Union
from datetime import datetime
from uuid import UUID


# --- REQUEST SCHEMAS ---

class SpaceCreate(BaseModel):
    """Create family space request"""
    name: str = Field(..., min_length=2, max_length=255)
    secondary_name: Optional[str] = Field(None, max_length=255)
    origin_location: Optional[str] = None
    origin_cities: Optional[str] = None


# --- RESPONSE SCHEMAS ---

class SpaceResponse(BaseModel):
    """Family space response"""
    id: Union[UUID, str]
    name: str
    secondary_name: Optional[str] = None
    slug: str
    origin_location: Optional[str] = None
    origin_cities: Optional[str] = None
    emblem_url: Optional[str] = None
    color_primary: str
    color_secondary: str
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True
        json_encoders = {
            UUID: str
        }


class SpaceMemberResponse(BaseModel):
    """Space member response"""
    id: Union[UUID, str]
    space_id: Union[UUID, str]
    user_id: Union[UUID, str]
    role: str
    generation: Optional[str] = None
    lineage: str
    relationship_to_founder: Optional[str] = None
    joined_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            UUID: str
        }