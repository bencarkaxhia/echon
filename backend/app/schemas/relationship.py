"""
Relationship Schemas
API request/response models for family relationships

PATH: echon/backend/app/schemas/relationship.py
"""

from pydantic import BaseModel, validator
from typing import Optional, Dict, Any, List
from datetime import datetime, date
from uuid import UUID


class RelationshipCreate(BaseModel):
    """Create a new relationship"""
    space_id: str
    person_a_id: str
    person_b_id: str
    relationship_type: str
    rel_metadata: Optional[Dict[str, Any]] = None
    confidence_level: str = "confirmed"
    
    @validator('relationship_type')
    def validate_relationship_type(cls, v):
        valid_types = [
            # Specific family types
            'father', 'mother', 'son', 'daughter', 'brother', 'sister',
            'grandfather', 'grandmother', 'grandson', 'granddaughter',
            'step_father', 'step_mother', 'step_son', 'step_daughter',
            'step_brother', 'step_sister',
            'husband', 'wife',
            # Generic types (for flexibility)
            'parent', 'child', 'sibling', 'spouse',
            'grandparent', 'grandchild',
            'aunt', 'uncle', 'niece', 'nephew', 'cousin',
            'in_law', 'half_sibling', 'adopted_child', 'adopted_parent'
        ]
        if v not in valid_types:
            raise ValueError(f'Invalid relationship type. Must be one of: {", ".join(valid_types)}')
        return v


class RelationshipResponse(BaseModel):
    """Relationship response"""
    id: str
    space_id: str
    person_a_id: str
    person_b_id: str
    relationship_type: str
    rel_metadata: Optional[Dict[str, Any]]
    confidence_level: str
    created_by: str
    created_at: datetime
    
    # Person details
    person_a_name: Optional[str] = None
    person_b_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class FamilyTreeNode(BaseModel):
    """Node in family tree"""
    id: str
    name: str
    profile_photo_url: Optional[str] = None
    birth_date: Optional[date] = None
    death_date: Optional[date] = None
    bio: Optional[str] = None
    relationships: List[Dict[str, Any]] = []


class FamilyTreeResponse(BaseModel):
    """Complete family tree"""
    nodes: List[FamilyTreeNode]
    edges: List[RelationshipResponse]
    root_person_id: Optional[str] = None


class RelationshipCalculation(BaseModel):
    """Calculate relationship between two people"""
    person_a_id: str
    person_b_id: str
    relationship: str  # "Second cousin", "Great aunt", etc.
    path: List[str]  # List of person IDs in the path
    degree: int  # How many steps apart


class TimelineEvent(BaseModel):
    """Event in family timeline"""
    id: str
    event_type: str  # birth, death, marriage, memory, post
    date: date
    title: str
    description: Optional[str] = None
    people_involved: List[str] = []
    location: Optional[str] = None
    media_urls: List[str] = []


class TimelineResponse(BaseModel):
    """Timeline of family events"""
    events: List[TimelineEvent]
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_events: int