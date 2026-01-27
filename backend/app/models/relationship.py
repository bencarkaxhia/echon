"""
Relationship Model
Define family connections between users

PATH: echon/backend/app/models/relationship.py
"""

from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, CheckConstraint, Date, Text, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..core.database import Base


class Relationship(Base):
    """
    Family relationships between users
    Supports complex family trees
    """
    __tablename__ = "relationships"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    space_id = Column(UUID(as_uuid=True), ForeignKey("family_spaces.id"), nullable=False)
    
    # The two people in the relationship
    person_a_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    person_b_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Type of relationship
    # Standard types: parent, child, sibling, spouse, grandparent, grandchild, 
    #                 aunt, uncle, niece, nephew, cousin
    relationship_type = Column(String(50), nullable=False)
    
    # Additional metadata (marriage date, adoption status, etc.)
    # Using rel_metadata instead of 'metadata' (reserved in SQLAlchemy)
    rel_metadata = Column(JSONB, nullable=True)
    
    # Confidence level
    confidence_level = Column(String(20), default="confirmed")  # confirmed, suggested, disputed
    
    # Audit fields
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    space = relationship("FamilySpace", back_populates="relationships")
    person_a = relationship("User", foreign_keys=[person_a_id])
    person_b = relationship("User", foreign_keys=[person_b_id])
    creator = relationship("User", foreign_keys=[created_by])
    
    # Constraint
    __table_args__ = (
        CheckConstraint('person_a_id != person_b_id', name='check_different_people'),
    )
    
    def __repr__(self):
        return f"<Relationship {self.person_a_id} -> {self.relationship_type} -> {self.person_b_id}>"


# Add to User model (update users.py):
# birth_date = Column(Date, nullable=True)
# death_date = Column(Date, nullable=True)  
# birth_location = Column(String(200), nullable=True)
# current_location = Column(String(200), nullable=True)
# bio = Column(Text, nullable=True)

# Add to Post model (update posts.py):
# event_date = Column(Date, nullable=True)  # When memory happened
# people_tagged = Column(ARRAY(UUID(as_uuid=True)), nullable=True)  # Who is in this memory