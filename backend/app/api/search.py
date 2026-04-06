"""
Echon Search API
Search posts and members

PATH: echon/backend/app/api/search.py
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from ..core.database import get_db
from ..models import Post, PostTag, User, SpaceMember
from .auth import get_current_user

router = APIRouter()


@router.get("/posts/{space_id}")
def search_posts(
    space_id: str,
    q: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search posts in a space.
    Searches in: content, location_of_memory, and PostTag.tagged_name.
    """
    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == current_user.id,
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True,
    ).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Not a member of this space")

    search_term = f"%{q}%"

    # Posts matching content or location
    matched_post_ids = set()

    content_matches = db.query(Post.id).filter(
        Post.space_id == space_id,
        Post.is_active == True,
        or_(
            Post.content.ilike(search_term),
            Post.location_of_memory.ilike(search_term),
        )
    ).all()
    for row in content_matches:
        matched_post_ids.add(row.id)

    # Posts matching tags
    tag_matches = db.query(PostTag.post_id).filter(
        PostTag.tagged_name.ilike(search_term)
    ).all()
    for row in tag_matches:
        matched_post_ids.add(row.post_id)

    if not matched_post_ids:
        return {"results": [], "total": 0, "query": q}

    posts = db.query(Post).filter(
        Post.id.in_(matched_post_ids),
        Post.is_active == True,
    ).order_by(desc(Post.date_of_memory.nullslast()), desc(Post.created_at)).limit(50).all()

    results = []
    for post in posts:
        author = db.query(User).filter(User.id == post.author_id).first()
        tags = [
            t.tagged_name for t in
            db.query(PostTag).filter(PostTag.post_id == post.id).all()
            if t.tagged_name
        ]

        # event_date display
        event_date_str = None
        if post.date_of_memory:
            d = post.date_of_memory
            if d.month == 1 and d.day == 1 and post.decade:
                event_date_str = str(d.year)
            else:
                event_date_str = d.isoformat()

        results.append({
            "id": str(post.id),
            "type": post.type,
            "content": post.content,
            "author_name": author.name if author else "Unknown",
            "author_photo": author.profile_photo_url if author else None,
            "event_date": event_date_str,
            "created_at": post.created_at.isoformat(),
            "media_urls": [post.file_url] if post.file_url else [],
            "location": post.location_of_memory,
            "tags": tags,
            "is_pinned": bool(post.is_pinned),
        })

    return {"results": results, "total": len(results), "query": q}


@router.get("/members/{space_id}")
def search_members(
    space_id: str,
    q: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search members in a space by name or birth_location."""
    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == current_user.id,
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True,
    ).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Not a member of this space")

    memberships = db.query(SpaceMember).filter(
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True,
    ).all()

    q_lower = q.lower()
    results = []
    for m in memberships:
        user = db.query(User).filter(User.id == m.user_id).first()
        if user and (
            q_lower in user.name.lower() or
            (user.birth_location and q_lower in user.birth_location.lower())
        ):
            results.append({
                "id": str(user.id),
                "name": user.name,
                "role": m.role,
                "birth_location": user.birth_location,
                "profile_photo_url": user.profile_photo_url,
            })

    return {"results": results, "total": len(results), "query": q}
