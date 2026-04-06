"""
Echon Post Model
Memories: stories, photos, voice recordings, documents
"""

from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Date, Integer, JSON, Boolean, ARRAY
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from ..core.database import Base


class Post(Base):
    """
    A memory shared in a family space
    Can be: story (text), photo, voice recording, or document
    """
    __tablename__ = "posts"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign Keys
    space_id = Column(UUID(as_uuid=True), ForeignKey("family_spaces.id"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Type
    type = Column(String(50), nullable=False)  
    # Types: "story" | "photo" | "voice" | "document"
    
    # Content
    content = Column(Text, nullable=True)  # Story text or description
    file_url = Column(Text, nullable=True)  # S3/R2 URL for media files
    file_type = Column(String(100), nullable=True)  # "image/jpeg", "audio/mp3", etc.
    file_size = Column(Integer, nullable=True)  # Bytes
    thumbnail_url = Column(Text, nullable=True)  # For photos/documents
    
    # Memory Details (when it happened, not when posted)
    date_of_memory = Column(Date, nullable=True)
    year_of_memory = Column(Integer, nullable=True)  # If exact date unknown
    decade = Column(String(10), nullable=True)  # "1950s", "1990s" for timeline sorting
    location_of_memory = Column(Text, nullable=True)  # "Gjakova, Kosovo"
    
    # Memory event details (added in migration 477)
    event_date = Column(Date, nullable=True)      # Specific date a memory occurred
    people_tagged = Column(ARRAY(PG_UUID(as_uuid=True)), nullable=True)  # Users tagged in this memory

    # Privacy
    privacy_level = Column(String(50), default="everyone")  
    # Levels: "everyone" | "circle" | "private"
    privacy_list = Column(JSON, nullable=True)  
    # If "circle": array of user_ids who can see
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Pinned to top of space
    is_pinned = Column(Boolean, default=False)

    # Engagement
    reaction_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    
    # Relationships
    space = relationship("FamilySpace", back_populates="posts")
    author = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    reactions = relationship("Reaction", back_populates="post", cascade="all, delete-orphan")
    tags = relationship("PostTag", back_populates="post", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Post {self.type} by {self.author_id} in {self.space_id}>"


class Comment(Base):
    """Comments on a post"""
    __tablename__ = "comments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(UUID(as_uuid=True), ForeignKey("posts.id"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    post = relationship("Post", back_populates="comments")
    author = relationship("User")
    
    def __repr__(self):
        return f"<Comment on {self.post_id}>"


class Reaction(Base):
    """Reactions (hearts, etc.) on a post"""
    __tablename__ = "reactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(UUID(as_uuid=True), ForeignKey("posts.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    type = Column(String(50), default="heart")  # "heart", "thankful", etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    post = relationship("Post", back_populates="reactions")
    user = relationship("User")
    
    def __repr__(self):
        return f"<Reaction {self.type} on {self.post_id}>"


class PostTag(Base):
    """Tag family members in a post (e.g., people in a photo)"""
    __tablename__ = "post_tags"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(UUID(as_uuid=True), ForeignKey("posts.id"), nullable=False)
    
    # Can tag either a user (if they're in the space) or a family member (non-user)
    tagged_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    tagged_name = Column(String(255), nullable=True)  # If person isn't a user
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    post = relationship("Post", back_populates="tags")
    tagged_user = relationship("User")
    
    def __repr__(self):
        return f"<PostTag on {self.post_id}>"