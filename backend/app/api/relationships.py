"""
Relationships API
Manage family relationships and generate family trees

PATH: echon/backend/app/api/relationships.py
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from collections import defaultdict, deque

from ..core.database import get_db
from ..models import User, SpaceMember
from ..models.relationship import Relationship
from ..schemas.relationship import (
    RelationshipCreate, RelationshipResponse, 
    FamilyTreeResponse, FamilyTreeNode,
    RelationshipCalculation
)
from .auth import get_current_user
from .notification_helpers import notify_space_members      # Notify space members for newly created relationships

router = APIRouter()


def check_space_membership(db: Session, user_id: str, space_id: str) -> bool:
    """Check if user is a member of the space"""
    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == user_id,
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True
    ).first()
    return membership is not None


# --- CREATE RELATIONSHIP ---

@router.post("", response_model=RelationshipResponse, status_code=status.HTTP_201_CREATED)
def create_relationship(
    rel_data: RelationshipCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new family relationship
    Anyone in the space can add relationships
    """
    # Check membership
    if not check_space_membership(db, current_user.id, rel_data.space_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this space"
        )
    
    # Check if both people are members
    person_a_member = check_space_membership(db, rel_data.person_a_id, rel_data.space_id)
    person_b_member = check_space_membership(db, rel_data.person_b_id, rel_data.space_id)
    
    if not person_a_member or not person_b_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both people must be members of this space"
        )
    
    # Create relationship
    new_rel = Relationship(
        space_id=rel_data.space_id,
        person_a_id=rel_data.person_a_id,
        person_b_id=rel_data.person_b_id,
        relationship_type=rel_data.relationship_type,
        rel_metadata=rel_data.rel_metadata,
        confidence_level=rel_data.confidence_level,
        created_by=current_user.id
    )
    
    db.add(new_rel)
    db.commit()
    db.refresh(new_rel)
    
    # Notify space members for new created relationships
    try:
        person_a = db.query(User).filter(User.id == rel_data.person_a_id).first()
        person_b = db.query(User).filter(User.id == rel_data.person_b_id).first()
        
        notify_space_members(
            db=db,
            space_id=rel_data.space_id,
            exclude_user_id=current_user.id,
            notification_type="new_relationship",
            title="New family relationship added",
            message=f"{person_a.name if person_a else 'Someone'} is {rel_data.relationship_type} of {person_b.name if person_b else 'someone'}",
            link_url="/space/family/tree",
            actor_id=current_user.id,
            actor_name=current_user.name,
            actor_photo=current_user.profile_photo_url
        )
    except Exception as e:
        print(f"Failed to send notifications: {e}")
    
    # Get person names
    person_a = db.query(User).filter(User.id == rel_data.person_a_id).first()
    person_b = db.query(User).filter(User.id == rel_data.person_b_id).first()
    
    return RelationshipResponse(
        id=str(new_rel.id),
        space_id=str(new_rel.space_id),
        person_a_id=str(new_rel.person_a_id),
        person_b_id=str(new_rel.person_b_id),
        relationship_type=new_rel.relationship_type,
        rel_metadata=new_rel.rel_metadata,
        confidence_level=new_rel.confidence_level,
        created_by=str(new_rel.created_by),
        created_at=new_rel.created_at,
        person_a_name=person_a.name if person_a else None,
        person_b_name=person_b.name if person_b else None
    )


# --- GET RELATIONSHIPS ---

@router.get("/{space_id}", response_model=List[RelationshipResponse])
def get_relationships(
    space_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all relationships in a space"""
    if not check_space_membership(db, current_user.id, space_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this space"
        )
    
    relationships = db.query(Relationship).filter(
        Relationship.space_id == space_id,
        Relationship.is_active == True
    ).all()
    
    result = []
    for rel in relationships:
        person_a = db.query(User).filter(User.id == rel.person_a_id).first()
        person_b = db.query(User).filter(User.id == rel.person_b_id).first()
        
        result.append(RelationshipResponse(
            id=str(rel.id),
            space_id=str(rel.space_id),
            person_a_id=str(rel.person_a_id),
            person_b_id=str(rel.person_b_id),
            relationship_type=rel.relationship_type,
            rel_metadata=rel.rel_metadata,
            confidence_level=rel.confidence_level,
            created_by=str(rel.created_by),
            created_at=rel.created_at,
            person_a_name=person_a.name if person_a else None,
            person_b_name=person_b.name if person_b else None
        ))
    
    return result


# --- GET FAMILY TREE ---

@router.get("/{space_id}/tree", response_model=FamilyTreeResponse)
def get_family_tree(
    space_id: str,
    root_person_id: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get complete family tree for a space
    Optionally centered on a specific person
    """
    if not check_space_membership(db, current_user.id, space_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this space"
        )
    
    # Get all members
    memberships = db.query(SpaceMember).filter(
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True
    ).all()
    
    nodes = []
    for member in memberships:
        user = db.query(User).filter(User.id == member.user_id).first()
        if user:
            # Get relationships for this person
            rels = db.query(Relationship).filter(
                Relationship.space_id == space_id,
                ((Relationship.person_a_id == user.id) | (Relationship.person_b_id == user.id)),
                Relationship.is_active == True
            ).all()
            
            relationships_data = []
            for rel in rels:
                other_person_id = str(rel.person_b_id) if str(rel.person_a_id) == str(user.id) else str(rel.person_a_id)
                relationships_data.append({
                    "type": rel.relationship_type,
                    "to_person_id": other_person_id,
                    "confidence": rel.confidence_level
                })
            
            nodes.append(FamilyTreeNode(
                id=str(user.id),
                name=user.name,
                profile_photo_url=user.profile_photo_url,
                birth_date=getattr(user, 'birth_date', None),
                death_date=getattr(user, 'death_date', None),
                bio=getattr(user, 'bio', None),
                relationships=relationships_data
            ))
    
    # Get all edges
    edges = get_relationships(space_id, current_user, db)
    
    return FamilyTreeResponse(
        nodes=nodes,
        edges=edges,
        root_person_id=root_person_id or str(current_user.id)
    )


# --- CALCULATE RELATIONSHIP ---

@router.get("/{space_id}/calculate/{person_a_id}/{person_b_id}", response_model=RelationshipCalculation)
def calculate_relationship(
    space_id: str,
    person_a_id: str,
    person_b_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculate how two people are related
    Uses BFS to find shortest path
    """
    if not check_space_membership(db, current_user.id, space_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this space"
        )
    
    # Build adjacency list
    relationships = db.query(Relationship).filter(
        Relationship.space_id == space_id,
        Relationship.is_active == True
    ).all()
    
    graph = defaultdict(list)
    for rel in relationships:
        graph[str(rel.person_a_id)].append((str(rel.person_b_id), rel.relationship_type))
        graph[str(rel.person_b_id)].append((str(rel.person_a_id), rel.relationship_type))
    
    # BFS to find shortest path
    queue = deque([(person_a_id, [person_a_id], [])])
    visited = {person_a_id}
    
    while queue:
        current, path, rel_types = queue.popleft()
        
        if current == person_b_id:
            # Found it!
            relationship_name = describe_relationship(rel_types)
            return RelationshipCalculation(
                person_a_id=person_a_id,
                person_b_id=person_b_id,
                relationship=relationship_name,
                path=path,
                degree=len(path) - 1
            )
        
        for neighbor, rel_type in graph[current]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, path + [neighbor], rel_types + [rel_type]))
    
    # No relationship found
    return RelationshipCalculation(
        person_a_id=person_a_id,
        person_b_id=person_b_id,
        relationship="No known relationship",
        path=[],
        degree=-1
    )


def describe_relationship(rel_types: List[str]) -> str:
    """Convert relationship path to human-readable description"""
    if not rel_types:
        return "Same person"
    
    if len(rel_types) == 1:
        return rel_types[0].replace("_", " ").title()
    
    # Simple patterns
    if rel_types == ["parent", "parent"]:
        return "Grandparent"
    if rel_types == ["child", "child"]:
        return "Grandchild"
    if rel_types == ["parent", "sibling"]:
        return "Aunt/Uncle"
    if rel_types == ["sibling", "child"]:
        return "Niece/Nephew"
    if rel_types == ["parent", "sibling", "child"]:
        return "Cousin"
    
    # Complex - just describe the path
    return f"{len(rel_types)} degrees of separation"


# --- DELETE RELATIONSHIP ---

@router.delete("/{relationship_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_relationship(
    relationship_id: str,
    space_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a relationship (soft delete)"""
    if not check_space_membership(db, current_user.id, space_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this space"
        )
    
    rel = db.query(Relationship).filter(
        Relationship.id == relationship_id,
        Relationship.space_id == space_id
    ).first()
    
    if not rel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relationship not found"
        )
    
    rel.is_active = False
    db.commit()
    
    return None