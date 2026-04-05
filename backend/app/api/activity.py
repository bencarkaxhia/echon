"""
Echon Activity Feed API
Recent activity and quick updates

PATH: echon/backend/app/api/activity.py
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta

from ..core.database import get_db
from ..models import Post, Comment, User, SpaceMember
from ..schemas.activity import (
    ActivityItem, ActivityFeedResponse, QuickUpdateCreate, SpaceStats
)
from .auth import get_current_user

router = APIRouter()


def check_space_membership(db: Session, user_id: str, space_id: str) -> bool:
    """Check if user is a member of the space"""
    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == user_id,
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True
    ).first()
    return membership is not None


# --- GET ACTIVITY FEED ---

@router.get("/space/{space_id}", response_model=ActivityFeedResponse)
def get_activity_feed(
    space_id: str,
    page: int = 1,
    per_page: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get recent activity in a space
    Combines posts, comments, reactions, new members
    """
    # Check space membership
    if not check_space_membership(db, current_user.id, space_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this space"
        )
    
    activities = []
    
    # Get recent posts (memories, stories, and chat messages)
    recent_posts = db.query(Post).filter(
        Post.space_id == space_id,
        Post.is_active == True
    ).order_by(desc(Post.created_at)).limit(30).all()

    # Batch-load authors
    author_ids = list({str(p.author_id) for p in recent_posts})
    authors = {str(u.id): u for u in db.query(User).filter(User.id.in_(author_ids)).all()}

    for post in recent_posts:
        author = authors.get(str(post.author_id))
        if not author:
            continue

        if post.type == "photo":
            activity_type = "memory"
        elif post.type == "voice":
            activity_type = "story"
        elif post.type == "chat":
            activity_type = "chat"
        else:
            activity_type = "story"

        activities.append(ActivityItem(
            id=str(post.id),
            type=activity_type,
            space_id=str(post.space_id),
            user_id=str(post.author_id),
            content=post.content,
            related_id=str(post.id),
            created_at=post.created_at,
            user_name=author.name,
            user_photo=author.profile_photo_url,
            preview_url=post.file_url if post.file_url else None,
            preview_text=post.content[:100] if post.content else None,
        ))
    
    # Get recent comments
    recent_comments = db.query(Comment).join(
        Post, Comment.post_id == Post.id
    ).filter(
        Post.space_id == space_id,
        Comment.is_active == True
    ).order_by(desc(Comment.created_at)).limit(20).all()

    comment_author_ids = list({str(c.author_id) for c in recent_comments})
    comment_authors = {str(u.id): u for u in db.query(User).filter(User.id.in_(comment_author_ids)).all()}

    for comment in recent_comments:
        author = comment_authors.get(str(comment.author_id))
        if not author:
            continue

        activities.append(ActivityItem(
            id=str(comment.id),
            type="comment",
            space_id=str(space_id),
            user_id=str(comment.author_id),
            content=comment.content,
            related_id=str(comment.post_id),
            created_at=comment.created_at,
            user_name=author.name,
            user_photo=author.profile_photo_url,
            preview_text=comment.content[:100],
        ))
    
    # Get recent member joins
    recent_members = db.query(SpaceMember).filter(
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True
    ).order_by(desc(SpaceMember.joined_at)).limit(10).all()

    member_user_ids = list({str(m.user_id) for m in recent_members})
    member_users = {str(u.id): u for u in db.query(User).filter(User.id.in_(member_user_ids)).all()}

    for membership in recent_members:
        user = member_users.get(str(membership.user_id))
        if not user:
            continue

        activities.append(ActivityItem(
            id=str(membership.id),
            type="member_joined",
            space_id=str(space_id),
            user_id=str(user.id),
            content=f"{user.name} joined the family",
            related_id=str(user.id),
            created_at=membership.joined_at,
            user_name=user.name,
            user_photo=user.profile_photo_url,
        ))
    
    # Sort all activities by date
    activities.sort(key=lambda x: x.created_at, reverse=True)
    
    # Paginate
    total = len(activities)
    offset = (page - 1) * per_page
    paginated = activities[offset:offset + per_page]
    
    return ActivityFeedResponse(
        activities=paginated,
        total=total,
        page=page,
        per_page=per_page,
        has_more=(offset + len(paginated)) < total
    )


# --- CREATE QUICK UPDATE ---

@router.post("/quick-update", status_code=status.HTTP_201_CREATED)
def create_quick_update(
    update_data: QuickUpdateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Post a quick update/status
    """
    # Check space membership
    if not check_space_membership(db, current_user.id, update_data.space_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this space"
        )
    
    # Create as a text post
    new_post = Post(
        space_id=update_data.space_id,
        author_id=current_user.id,
        type="story",  # Use story type for text updates
        content=update_data.content,
        privacy_level="space"
    )
    
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    return {
        "id": str(new_post.id),
        "content": new_post.content,
        "created_at": new_post.created_at
    }


# --- GET SPACE STATS ---

@router.get("/stats/{space_id}", response_model=SpaceStats)
def get_space_stats(
    space_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get statistics for a space
    """
    # Check space membership
    if not check_space_membership(db, current_user.id, space_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this space"
        )
    
    # Count members
    total_members = db.query(SpaceMember).filter(
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True
    ).count()
    
    # Count memories (photos)
    total_memories = db.query(Post).filter(
        Post.space_id == space_id,
        Post.type == "photo",
        Post.is_active == True
    ).count()
    
    # Count stories (voice)
    total_stories = db.query(Post).filter(
        Post.space_id == space_id,
        Post.type == "voice",
        Post.is_active == True
    ).count()
    
    # Count comments
    total_comments = db.query(Comment).join(
        Post, Comment.post_id == Post.id
    ).filter(
        Post.space_id == space_id,
        Comment.is_active == True
    ).count()
    
    # Count recent activity (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_posts = db.query(Post).filter(
        Post.space_id == space_id,
        Post.created_at >= seven_days_ago,
        Post.is_active == True
    ).count()
    
    recent_comments = db.query(Comment).join(
        Post, Comment.post_id == Post.id
    ).filter(
        Post.space_id == space_id,
        Comment.created_at >= seven_days_ago,
        Comment.is_active == True
    ).count()
    
    recent_activity_count = recent_posts + recent_comments
    
    return SpaceStats(
        total_members=total_members,
        total_memories=total_memories,
        total_stories=total_stories,
        total_comments=total_comments,
        recent_activity_count=recent_activity_count
    )