"""
Echon Invitations API
Create invitations, join with codes, approve members

PATH: echon/backend/app/api/invitations.py
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
import string

from ..core.database import get_db
from ..models import User, FamilySpace, SpaceMember, Invitation
from .auth import get_current_user

router = APIRouter()


def generate_invitation_code() -> str:
    """Generate secure random invitation code: inv_2026_xKj9mP4nQ8"""
    year = datetime.utcnow().year
    random_part = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(10))
    return f"inv_{year}_{random_part}"


# --- CREATE INVITATION CODE ---

@router.post("/create-code", status_code=status.HTTP_201_CREATED)
def create_invitation_code(
    space_id: str,
    invitee_name: str,
    invitee_contact: str,
    relationship: str = None,
    message: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create an invitation code for someone to join the space
    Only founders and elders can create invitations
    """
    # Check if space exists
    space = db.query(FamilySpace).filter(FamilySpace.id == space_id).first()
    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Space not found"
        )
    
    # Check if user is founder or elder
    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == current_user.id,
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True
    ).first()
    
    if not membership or membership.role not in ["founder", "elder"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only founders and elders can create invitations"
        )
    
    # Generate unique code
    code = generate_invitation_code()
    
    # Create invitation
    invitation = Invitation(
        space_id=space_id,
        invited_by=current_user.id,
        invitee_name=invitee_name,
        invitee_contact=invitee_contact,
        relationship_to_inviter=relationship,
        personal_message=message,
        token=code,
        status="pending",
        expires_at=datetime.utcnow() + timedelta(days=30)  # 30 day expiry
    )
    
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    
    return {
        "invitation_code": code,
        "invitee_name": invitee_name,
        "expires_at": invitation.expires_at.isoformat(),
        "space_name": space.name,
        "message": f"Share this code with {invitee_name}: {code}"
    }


# --- JOIN WITH CODE ---

@router.post("/join-with-code", status_code=status.HTTP_200_OK)
def join_with_code(
    invitation_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    User joins a space using an invitation code
    This creates a PENDING membership that needs admin approval
    """
    # Find invitation
    invitation = db.query(Invitation).filter(
        Invitation.token == invitation_code
    ).first()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invitation code"
        )
    
    # Check if invitation is valid
    if not invitation.is_valid():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation has expired or been used"
        )
    
    # Check if user is already a member
    existing = db.query(SpaceMember).filter(
        SpaceMember.user_id == current_user.id,
        SpaceMember.space_id == invitation.space_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this space"
        )
    
    # Create PENDING membership (needs approval)
    new_membership = SpaceMember(
        space_id=invitation.space_id,
        user_id=current_user.id,
        role="member",
        is_active=False,  # ❗ NOT ACTIVE until approved!
        relationship_to_founder=invitation.relationship_to_inviter
    )
    
    db.add(new_membership)
    
    # Update invitation
    invitation.accepted_by = current_user.id
    invitation.accepted_at = datetime.utcnow()
    # Don't set to "accepted" yet - only after admin approval
    
    db.commit()
    
    # Get space info
    space = db.query(FamilySpace).filter(FamilySpace.id == invitation.space_id).first()
    
    return {
        "status": "pending_approval",
        "message": f"Your request to join {space.name} is pending approval from the space admin",
        "space_name": space.name,
        "space_id": str(space.id)
    }


# --- GET PENDING APPROVALS (FOR ADMINS) ---

@router.get("/pending-approvals/{space_id}")
def get_pending_approvals(
    space_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all pending membership requests for a space
    Only founders can see this
    """
    # Check if user is founder
    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == current_user.id,
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True
    ).first()
    
    if not membership or membership.role != "founder":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only founders can view pending approvals"
        )
    
    # Get pending memberships
    pending = db.query(SpaceMember).filter(
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == False  # Pending approval
    ).all()
    
    pending_list = []
    for member in pending:
        user = db.query(User).filter(User.id == member.user_id).first()
        if user:
            pending_list.append({
                "membership_id": str(member.id),
                "user_id": str(user.id),
                "user_name": user.name,
                "user_email": user.email,
                "user_phone": user.phone,
                "relationship": member.relationship_to_founder,
                "joined_at": member.joined_at.isoformat()
            })
    
    return {
        "pending_approvals": pending_list,
        "total": len(pending_list)
    }


# --- APPROVE/REJECT MEMBERSHIP ---

@router.post("/approve/{membership_id}")
def approve_membership(
    membership_id: str,
    space_id: str,
    approve: bool = True,  # True = approve, False = reject
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Approve or reject a pending membership
    Only founders can do this
    """
    # Check if user is founder
    admin_membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == current_user.id,
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True
    ).first()
    
    if not admin_membership or admin_membership.role != "founder":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only founders can approve memberships"
        )
    
    # Get pending membership
    membership = db.query(SpaceMember).filter(
        SpaceMember.id == membership_id,
        SpaceMember.space_id == space_id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membership not found"
        )
    
    if approve:
        # APPROVE - Activate membership
        membership.is_active = True
        db.commit()
        
        user = db.query(User).filter(User.id == membership.user_id).first()
        
        return {
            "status": "approved",
            "message": f"{user.name} has been approved to join the space",
            "user_name": user.name
        }
    else:
        # REJECT - Delete membership
        db.delete(membership)
        db.commit()
        
        return {
            "status": "rejected",
            "message": "Membership request rejected"
        }


# --- GET MY SPACES ---

@router.get("/my-spaces")
def get_my_spaces(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all spaces the current user is a member of
    Only returns ACTIVE memberships (approved)
    """
    memberships = db.query(SpaceMember).filter(
        SpaceMember.user_id == current_user.id,
        SpaceMember.is_active == True  # Only approved memberships
    ).all()
    
    spaces = []
    for membership in memberships:
        space = db.query(FamilySpace).filter(FamilySpace.id == membership.space_id).first()
        if space:
            spaces.append({
                "space_id": str(space.id),
                "space_name": space.name,
                "role": membership.role,
                "joined_at": membership.joined_at.isoformat(),
                "emblem_url": space.emblem_url
            })
    
    return {
        "spaces": spaces,
        "total": len(spaces)
    }