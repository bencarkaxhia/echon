"""
Echon Invitation Model
How family members are invited to join a space
"""

from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import uuid
import secrets
from ..core.database import Base


class Invitation(Base):
    """
    Invitation to join a family space
    Sent via email, SMS, or WhatsApp link
    """
    __tablename__ = "invitations"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign Keys
    space_id = Column(UUID(as_uuid=True), ForeignKey("family_spaces.id"), nullable=False)
    invited_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Invitee Info (they're not a user yet)
    invitee_name = Column(String(255), nullable=False)
    invitee_contact = Column(String(255), nullable=False)  # Email or phone
    relationship_to_inviter = Column(String(255), nullable=True)  # "Father", "Sister"
    
    # Message
    personal_message = Column(Text, nullable=True)
    
    # Token (unique invite link)
    token = Column(String(255), unique=True, index=True, nullable=False)
    
    # Status
    status = Column(String(50), default="pending")  
    # Statuses: "pending" | "accepted" | "expired" | "revoked"
    
    # Accepted user (once they join)
    accepted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=7))
    accepted_at = Column(DateTime, nullable=True)
    
    # Relationships
    space = relationship("FamilySpace", back_populates="invitations")
    inviter = relationship("User", foreign_keys=[invited_by])
    accepter = relationship("User", foreign_keys=[accepted_by])
    
    @staticmethod
    def generate_token() -> str:
        """Generate a secure random token for the invite link"""
        return secrets.token_urlsafe(32)
    
    def is_valid(self) -> bool:
        """Check if invitation is still valid"""
        if self.status != "pending":
            return False
        if datetime.utcnow() > self.expires_at:
            return False
        return True
    
    def __repr__(self):
        return f"<Invitation to {self.invitee_name} for {self.space_id}>"