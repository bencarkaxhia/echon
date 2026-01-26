"""
Echon Authentication Schemas
Pydantic models for API request/response validation

PATH: echon/backend/app/schemas/auth.py
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Union
from datetime import datetime
from uuid import UUID


# --- REQUEST SCHEMAS ---

class UserRegister(BaseModel):
    """Registration request"""
    name: str = Field(..., min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str = Field(..., min_length=8, max_length=128)  # Reasonable limit
    
    # Optional profile info
    birth_year: Optional[int] = None
    birth_location: Optional[str] = None


class UserLogin(BaseModel):
    """Login request"""
    email_or_phone: str  # Can be email or phone
    password: str


# --- RESPONSE SCHEMAS ---

class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """User profile response"""
    id: Union[UUID, str]  # Accept both UUID and string
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    birth_year: Optional[int] = None
    birth_location: Optional[str] = None
    profile_photo_url: Optional[str] = None
    simplified_mode: bool = False
    language: str = "en"
    created_at: datetime
    last_active: datetime
    
    class Config:
        from_attributes = True
        # Pydantic will automatically convert UUID to string in JSON
        json_encoders = {
            UUID: str
        }


class LoginResponse(BaseModel):
    """Complete login response with token and user info"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse