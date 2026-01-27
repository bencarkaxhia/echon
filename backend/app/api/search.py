"""
Echon Search API
Search posts and members

PATH: echon/backend/app/api/search.py
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from ..core.database import get_db
from ..models import Post, User, SpaceMember
from .auth import get_current_user

router = APIRouter()


@router.get("/posts/{space_id}")
def search_posts(
    space_id: str,
    q: str,  # Search query
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search posts in a space
    Searches in: content, location, tags
    """
    # Check membership
    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == current_user.id,
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this space"
        )
    
    # Search
    search_term = f"%{q}%"
    posts = db.query(Post).filter(
        Post.space_id == space_id,
        Post.is_active == True,
        or_(
            Post.content.ilike(search_term),
            Post.location.ilike(search_term),
            Post.tags.contains([q.lower()])
        )
    ).order_by(desc(Post.created_at)).limit(50).all()
    
    # Format results
    results = []
    for post in posts:
        author = db.query(User).filter(User.id == post.author_id).first()
        results.append({
            "id": str(post.id),
            "type": post.type,
            "content": post.content,
            "author_name": author.name if author else "Unknown",
            "created_at": post.created_at.isoformat(),
            "image_urls": post.image_urls or [],
            "location": post.location,
            "tags": post.tags or []
        })
    
    return {
        "results": results,
        "total": len(results),
        "query": q
    }


@router.get("/members/{space_id}")
def search_members(
    space_id: str,
    q: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search members in a space
    Searches in: name, birth_location
    """
    # Check membership
    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == current_user.id,
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this space"
        )
    
    # Get all members
    memberships = db.query(SpaceMember).filter(
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True
    ).all()
    
    # Search
    search_term = f"%{q}%"
    results = []
    
    for m in memberships:
        user = db.query(User).filter(User.id == m.user_id).first()
        if user and (
            q.lower() in user.name.lower() or
            (user.birth_location and q.lower() in user.birth_location.lower())
        ):
            results.append({
                "id": str(user.id),
                "name": user.name,
                "role": m.role,
                "birth_location": user.birth_location,
                "profile_photo_url": user.profile_photo_url
            })
    
    return {
        "results": results,
        "total": len(results),
        "query": q
    }