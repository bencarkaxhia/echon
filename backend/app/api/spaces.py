"""
Echon Family Spaces API
Create and manage family spaces

PATH: echon/backend/app/api/spaces.py
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import re

from ..core.database import get_db
from ..models import FamilySpace, SpaceMember, User
from ..schemas.space import SpaceCreate, SpaceResponse, SpaceMemberResponse
from .auth import get_current_user

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