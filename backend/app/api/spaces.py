"""
Echon Family Spaces API
Create and manage family spaces

PATH: echon/backend/app/api/spaces.py
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import re
import logging

from pydantic import BaseModel, Field, field_validator

from ..core.database import get_db
from ..models import FamilySpace, SpaceMember, User
from ..schemas.space import SpaceCreate, SpaceResponse, SpaceMemberResponse
from .auth import get_current_user

logger = logging.getLogger(__name__)

_HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


class SpaceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    secondary_name: Optional[str] = Field(None, max_length=100)
    origin_location: Optional[str] = Field(None, max_length=200)
    origin_cities: Optional[str] = Field(None, max_length=500)
    color_primary: Optional[str] = Field(None, max_length=7)
    color_secondary: Optional[str] = Field(None, max_length=7)

    @field_validator("color_primary", "color_secondary", mode="before")
    @classmethod
    def validate_hex_color(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not _HEX_COLOR_RE.match(v):
            raise ValueError("Color must be a valid hex value e.g. #A1B2C3")
        return v.upper()

router = APIRouter()


def create_slug(name: str) -> str:
    """
    Create URL-safe slug from family name
    e.g., "Çarkaxhia" -> "carkaxhia"
    """
    # Remove special characters, convert to lowercase
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug


# --- CREATE SPACE ---

@router.post("", response_model=SpaceResponse, status_code=status.HTTP_201_CREATED)
def create_space(
    space_data: SpaceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new family space
    User becomes the founder automatically
    """
    # Create slug from name
    slug = create_slug(space_data.name)
    
    # Check if slug already exists
    existing_space = db.query(FamilySpace).filter(FamilySpace.slug == slug).first()
    if existing_space:
        # Add a number to make it unique
        counter = 1
        while db.query(FamilySpace).filter(FamilySpace.slug == f"{slug}-{counter}").first():
            counter += 1
        slug = f"{slug}-{counter}"
    
    # Create space
    new_space = FamilySpace(
        name=space_data.name,
        secondary_name=space_data.secondary_name,
        slug=slug,
        origin_location=space_data.origin_location,
        origin_cities=space_data.origin_cities,
    )
    
    db.add(new_space)
    db.commit()
    db.refresh(new_space)
    
    # Add creator as founder
    founder_membership = SpaceMember(
        space_id=new_space.id,
        user_id=current_user.id,
        role="founder",
        generation="middle",  # Default, can be updated later
        lineage="both",
    )
    
    db.add(founder_membership)
    db.commit()
    
    return SpaceResponse.model_validate(new_space)


# --- GET MY SPACES ---

@router.get("/my-spaces", response_model=List[SpaceResponse])
def get_my_spaces(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all family spaces the current user is a member of
    """
    # Get all memberships for this user
    memberships = db.query(SpaceMember).filter(
        SpaceMember.user_id == current_user.id,
        SpaceMember.is_active == True
    ).all()
    
    # Get the spaces
    space_ids = [m.space_id for m in memberships]
    spaces = db.query(FamilySpace).filter(
        FamilySpace.id.in_(space_ids),
        FamilySpace.is_active == True
    ).all()
    
    return [SpaceResponse.model_validate(space) for space in spaces]


# --- GET SINGLE SPACE ---

@router.get("/{space_id}", response_model=SpaceResponse)
def get_space(
    space_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific family space
    User must be a member to access
    """
    # Check if user is a member of this space
    membership = db.query(SpaceMember).filter(
        SpaceMember.space_id == space_id,
        SpaceMember.user_id == current_user.id,
        SpaceMember.is_active == True
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this family space"
        )
    
    space = db.query(FamilySpace).filter(FamilySpace.id == space_id).first()
    
    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family space not found"
        )
    
    return SpaceResponse.model_validate(space)


# --- UPDATE SPACE SETTINGS ---

@router.patch("/{space_id}", response_model=SpaceResponse)
def update_space(
    space_id: str,
    updates: SpaceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update space name, colors, etc. Only founders can do this."""
    space = db.query(FamilySpace).filter(FamilySpace.id == space_id).first()
    if not space:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Space not found")

    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == current_user.id,
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True,
    ).first()
    if not membership or membership.role != "founder":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only founders can update space settings")

    if updates.name is not None:
        space.name = updates.name
    if updates.secondary_name is not None:
        space.secondary_name = updates.secondary_name
    if updates.origin_location is not None:
        space.origin_location = updates.origin_location
    if updates.origin_cities is not None:
        space.origin_cities = updates.origin_cities
    if updates.color_primary is not None:
        space.color_primary = updates.color_primary
    if updates.color_secondary is not None:
        space.color_secondary = updates.color_secondary

    db.commit()
    db.refresh(space)
    return SpaceResponse.model_validate(space)


# --- REMOVE MEMBER ---

@router.delete("/{space_id}/members/{member_user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    space_id: str,
    member_user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a member from the space. Founders only. Cannot remove other founders."""
    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == current_user.id,
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True,
    ).first()
    if not membership or membership.role != "founder":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only founders can remove members")

    target = db.query(SpaceMember).filter(
        SpaceMember.user_id == member_user_id,
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True,
    ).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    if target.role == "founder":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot remove a founder")

    target.is_active = False
    db.commit()
    return None


# --- UPDATE SPACE EMBLEM ---

from fastapi import UploadFile, File
from ..core.storage import save_image, get_file_url, FileUploadError

@router.post("/{space_id}/upload-emblem", status_code=status.HTTP_200_OK)
async def upload_space_emblem(
    space_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload emblem/logo for family space
    Only founders can upload
    """
    # Get space
    space = db.query(FamilySpace).filter(FamilySpace.id == space_id).first()
    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Space not found"
        )
    
    # Check if user is founder
    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == current_user.id,
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True
    ).first()
    
    if not membership or membership.role != "founder":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only founders can upload space emblem"
        )
    
    try:
        # Save image
        result = await save_image(file, subfolder="emblems", create_thumbnail=True)
        file_url = result.get("url") or get_file_url(result["original"])          # added "url" for R2 Storage - Railway Deployment
        
        # Update space
        space.emblem_url = file_url
        db.commit()
        db.refresh(space)
        
        return {
            "emblem_url": file_url,
            "message": "Space emblem updated successfully"
        }
    
    except FileUploadError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )