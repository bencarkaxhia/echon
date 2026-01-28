"""
Notifications Model
In-app notifications for family activities

PATH: echon/backend/app/models/notification.py
"""

from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..core.database import Base


class Notification(Base):
    """
    In-app notifications
    """
    __tablename__ = "notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Who receives this notification
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # What space is this about
    space_id = Column(UUID(as_uuid=True), ForeignKey("family_spaces.id"), nullable=False)
    
    # Notification content
    type = Column(String(50), nullable=False)  
    # Types: new_post, new_comment, new_member, birthday, new_story, 
    #        new_relationship, member_joined, invitation_accepted
    
    title = Column(String(255), nullable=False)  # "New memory posted"
    message = Column(Text, nullable=False)  # "John posted a new photo"
    
    # Optional: Link to related content
    link_url = Column(String(500), nullable=True)  # "/space/memories/123"
    
    # Optional: Who triggered this (for "John posted...")
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    actor_name = Column(String(255), nullable=True)  # Denormalized for performance
    actor_photo = Column(String(500), nullable=True)
    
    # Status
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    space = relationship("FamilySpace")
    actor = relationship("User", foreign_keys=[actor_id])
    
    def __repr__(self):
        return f"<Notification {self.type} for {self.user_id}>"