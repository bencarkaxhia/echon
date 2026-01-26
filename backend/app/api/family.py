"""
Echon Family/Members API
Manage family members and profiles

PATH: echon/backend/app/api/family.py
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..core.database import get_db
from ..models import User, FamilySpace, SpaceMember, Post, Comment
from ..schemas.family import MemberUpdate, MemberProfile, MemberBrief, MemberListResponse
from .auth import get_current_user

router = APIRouter()


def check_space_membership(db: Session, user_id: str, space_id: str) -> bool:
    """Check if user is a member of the space"""
    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == user_id,
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True
    ).first()
    return membership is not None


# --- GET ALL MEMBERS IN A SPACE ---

@router.get("/space/{space_id}", response_model=MemberListResponse)
def get_space_members(
    space_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all members in a family space
    """
    # Check if user is a member
    if not check_space_membership(db, current_user.id, space_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this space"
        )
    
    # Get all memberships
    memberships = db.query(SpaceMember).filter(
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True
    ).all()
    
    # Build member profiles
    member_profiles = []
    role_counts = {"founder": 0, "elder": 0, "member": 0}
    
    for membership in memberships:
        # Get user
        user = db.query(User).filter(User.id == membership.user_id).first()
        if not user:
            continue
        
        # Get stats
        post_count = db.query(Post).filter(
            Post.author_id == user.id,
            Post.space_id == space_id,
            Post.is_active == True
        ).count()
        
        comment_count = db.query(Comment).filter(
            Comment.author_id == user.id,
            Comment.is_active == True
        ).count()
        
        # Build profile
        profile = MemberProfile(
            id=str(user.id),
            name=user.name,
            email=user.email,
            phone=user.phone,
            birth_year=user.birth_year,
            birth_location=user.birth_location,
            profile_photo_url=user.profile_photo_url,
            role=membership.role,
            generation=membership.generation,
            lineage=membership.lineage,
            relationship_to_founder=membership.relationship_to_founder,
            joined_at=membership.joined_at,
            post_count=post_count,
            comment_count=comment_count
        )
        
        member_profiles.append(profile)
        
        # Count roles
        if membership.role in role_counts:
            role_counts[membership.role] += 1
    
    return MemberListResponse(
        members=member_profiles,
        total=len(member_profiles),
        founders=role_counts["founder"],
        elders=role_counts["elder"],
        regular_members=role_counts["member"]  # ✅ Changed to regular_members
    )


# --- GET SINGLE MEMBER PROFILE ---

@router.get("/{member_id}", response_model=MemberProfile)
def get_member_profile(
    member_id: str,
    space_id: str,  # Query parameter
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed profile of a specific member
    """
    # Check if current user is in the space
    if not check_space_membership(db, current_user.id, space_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this space"
        )
    
    # Get member
    user = db.query(User).filter(User.id == member_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    # Get membership
    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == member_id,
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not in this space"
        )
    
    # Get stats
    post_count = db.query(Post).filter(
        Post.author_id == user.id,
        Post.space_id == space_id,
        Post.is_active == True
    ).count()
    
    comment_count = db.query(Comment).filter(
        Comment.author_id == user.id,
        Comment.is_active == True
    ).count()
    
    # Build profile
    return MemberProfile(
        id=str(user.id),
        name=user.name,
        email=user.email,
        phone=user.phone,
        birth_year=user.birth_year,
        birth_location=user.birth_location,
        profile_photo_url=user.profile_photo_url,
        role=membership.role,
        generation=membership.generation,
        lineage=membership.lineage,
        relationship_to_founder=membership.relationship_to_founder,
        joined_at=membership.joined_at,
        post_count=post_count,
        comment_count=comment_count
    )


# --- UPDATE MEMBER PROFILE ---

@router.patch("/{member_id}", response_model=MemberProfile)
def update_member_profile(
    member_id: str,
    space_id: str,  # Query parameter
    updates: MemberUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update member profile
    Users can update their own profile
    Founders can update any member
    """
    # Check if current user is in the space
    current_membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == current_user.id,
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True
    ).first()
    
    if not current_membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this space"
        )
    
    # Check permissions (can edit own profile or be founder)
    if str(current_user.id) != member_id and current_membership.role != "founder":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own profile"
        )
    
    # Get member
    user = db.query(User).filter(User.id == member_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    # Get membership
    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == member_id,
        SpaceMember.space_id == space_id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not in this space"
        )
    
    # Update user fields
    if updates.name:
        user.name = updates.name
    if updates.birth_year:
        user.birth_year = updates.birth_year
    if updates.birth_location:
        user.birth_location = updates.birth_location
    
    # Update membership fields
    if updates.generation:
        membership.generation = updates.generation
    if updates.lineage:
        membership.lineage = updates.lineage
    if updates.relationship_to_founder:
        membership.relationship_to_founder = updates.relationship_to_founder
    
    db.commit()
    db.refresh(user)
    db.refresh(membership)
    
    # Get stats
    post_count = db.query(Post).filter(
        Post.author_id == user.id,
        Post.space_id == space_id,
        Post.is_active == True
    ).count()
    
    comment_count = db.query(Comment).filter(
        Comment.author_id == user.id,
        Comment.is_active == True
    ).count()
    
    return MemberProfile(
        id=str(user.id),
        name=user.name,
        email=user.email,
        phone=user.phone,
        birth_year=user.birth_year,
        birth_location=user.birth_location,
        profile_photo_url=user.profile_photo_url,
        role=membership.role,
        generation=membership.generation,
        lineage=membership.lineage,
        relationship_to_founder=membership.relationship_to_founder,
        joined_at=membership.joined_at,
        post_count=post_count,
        comment_count=comment_count
    )