"""
Echon User Model
Members who can log in to family spaces
"""

from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from ..core.database import Base


class User(Base):
    """
    User account (member who can log in)
    Each user can belong to one or more family spaces
    """
    __tablename__ = "users"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Authentication
    email = Column(String(255), unique=True, nullable=True, index=True)
    phone = Column(String(50), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=False)
    
    # Profile
    name = Column(String(255), nullable=False)
    birth_year = Column(Integer, nullable=True)
    birth_date = Column(Date, nullable=True)
    death_date = Column(Date, nullable=True)
    birth_location = Column(Text, nullable=True)
    current_location = Column(String(200), nullable=True)
    bio = Column(Text, nullable=True)
    profile_photo_url = Column(Text, nullable=True)
    
    # Settings
    simplified_mode = Column(Boolean, default=False)  # Elder-friendly UI
    language = Column(String(10), default="en")  # en, sq (Albanian), de, etc.
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    memberships = relationship("SpaceMember", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.name} ({self.email or self.phone})>"   