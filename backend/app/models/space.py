"""
Echon Family Space Models
The core concept: each family has their own private space
"""

from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from ..core.database import Base


class FamilySpace(Base):
    """
    A private family space (e.g., "The Çarkaxhia Space")
    Completely isolated from other families
    """
    __tablename__ = "family_spaces"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Identity
    name = Column(String(255), nullable=False)  # "Çarkaxhia"
    secondary_name = Column(String(255), nullable=True)  # "Çulaj" (maternal line)
    slug = Column(String(255), unique=True, index=True)  # URL-safe: "carkaxhia"
    
    # Origin
    origin_location = Column(Text, nullable=True)  # "Albania, Kosovo"
    origin_cities = Column(Text, nullable=True)  # "Shkodra, Gjakova, Prishtina"
    
    # Customization
    emblem_url = Column(Text, nullable=True)  # Family coat of arms / logo
    color_primary = Column(String(7), default="#8B1E3F")  # Hex color
    color_secondary = Column(String(7), default="#D4AF37")
    
    # Settings (stored as JSON)
    settings = Column(JSON, default={
        "who_can_invite": "founders_and_elders",  # "anyone" | "founders_only" | "founders_and_elders"
        "who_can_see_members": "all",  # "all" | "members_only"
        "moderation": "founder_approval"  # "open" | "founder_approval"
    })
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    members = relationship("SpaceMember", back_populates="space", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="space", cascade="all, delete-orphan")
    invitations = relationship("Invitation", back_populates="space", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<FamilySpace {self.name}>"


class SpaceMember(Base):
    """
    Membership: Links a User to a FamilySpace with a role
    A user can be a member of multiple spaces (e.g., father's and mother's families)
    """
    __tablename__ = "space_members"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign Keys
    space_id = Column(UUID(as_uuid=True), ForeignKey("family_spaces.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Role
    role = Column(String(50), default="member")  
    # Roles: "founder" | "elder" | "member" | "guest"
    
    # Family Context
    generation = Column(String(50), nullable=True)  # "elder" | "middle" | "younger"
    lineage = Column(String(50), default="both")  # "paternal" | "maternal" | "both"
    relationship_to_founder = Column(String(255), nullable=True)  # "Father", "Sister", etc.
    
    # Metadata
    joined_at = Column(DateTime, default=datetime.utcnow)
    last_visited = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    space = relationship("FamilySpace", back_populates="members")
    user = relationship("User", back_populates="memberships")
    
    def __repr__(self):
        return f"<SpaceMember {self.user_id} in {self.space_id} ({self.role})>"