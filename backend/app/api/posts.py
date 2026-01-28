"""
Echon Posts/Memories API
Create and manage family memories

PATH: echon/backend/app/api/posts.py
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json

from ..core.database import get_db
from ..core.storage import save_image, save_video, save_audio, save_file, get_file_url, FileUploadError
from ..models import Post, Comment, Reaction, PostTag, User, SpaceMember
from ..schemas.post import (
    PostCreate, PostResponse, PostListResponse,
    CommentCreate, CommentResponse,
    ReactionCreate, ReactionResponse
)
from .auth import get_current_user
from .notification_helpers import notify_space_members      # notify space members for new posts
from .notification_helpers import notify_specific_user      # notify users for comments on their posts

router = APIRouter()


def check_space_membership(db: Session, user_id: str, space_id: str) -> bool:
    """Check if user is a member of the space"""
    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == user_id,
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True
    ).first()
    return membership is not None


# --- FILE UPLOAD ---

@router.post("/upload-media", status_code=status.HTTP_201_CREATED)
async def upload_media(
    file: UploadFile = File(...),
    media_type: str = Form(...),  # "photo", "video", "audio", "pdf"
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a photo, video, audio, or PDF file
    Returns the file URL
    """
    try:
        if media_type == "photo":
            result = await save_image(file, subfolder="memories/photos")
            file_path = result["original"]
        elif media_type == "video":
            file_path = await save_video(file, subfolder="memories/videos")
        elif media_type == "audio":
            file_path = await save_audio(file, subfolder="memories/audio")
        elif media_type == "pdf":
            # Use the general save_file function for PDFs
            result = await save_image(file, subfolder="memories/photos")
            # Use full URL if available (R2), otherwise use key (local)
            file_path = result.get("url") or result["original"]
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid media_type. Must be: photo, video, audio, or pdf"
            )
        
        return {
            "file_path": file_path,
            "file_url": get_file_url(file_path),
            "media_type": media_type
        }
    
    except FileUploadError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )


# --- CREATE POST/MEMORY ---

@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new memory/post
    """
    # Check space membership
    if not check_space_membership(db, current_user.id, post_data.space_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this space"
        )
    
    # Convert event_date string to date if provided
    date_of_memory = None
    if post_data.event_date:
        try:
            dt = datetime.fromisoformat(post_data.event_date.replace('Z', '+00:00'))
            date_of_memory = dt.date()
        except ValueError:
            pass
    
    # Determine post type
    post_type = "photo" if post_data.media_type == "photo" else "story"
    
    # Get first media URL (model uses single file_url, not array)
    file_url = post_data.media_urls[0] if post_data.media_urls else None
    
    # Create post
    new_post = Post(
        space_id=post_data.space_id,
        author_id=current_user.id,  # ✅ Use author_id not user_id
        type=post_type,  # ✅ Use type not media_type
        content=post_data.content,
        file_url=file_url,  # ✅ Use file_url not media_urls
        date_of_memory=date_of_memory,  # ✅ Use date_of_memory not event_date
        location_of_memory=post_data.location,  # ✅ Use location_of_memory
        privacy_level=post_data.privacy_level,
    )
    
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    # Add notification after post has been created - for all space members
    try:
        notify_space_members(
            db=db,
            space_id=post_data.space_id,
            exclude_user_id=current_user.id,
            notification_type="new_post",
            title=f"{current_user.name} posted a new memory",
            message=new_post.content[:100] if new_post.content else "Check out the new post!",
            link_url="/space/memories",
            actor_id=current_user.id,
            actor_name=current_user.name,
            actor_photo=current_user.profile_photo_url
        )
    except Exception as e:
        print(f"Failed to send notifications: {e}")
        # Don't fail the post creation if notification fails
    
    # Add tags if provided (store as text tags in PostTag.tag field)
    if post_data.tags:
        for tag_name in post_data.tags:
            tag = PostTag(
                post_id=new_post.id,
                tagged_name=tag_name  # Store tag as tagged_name
            )
            db.add(tag)
        db.commit()
    
    # Build response manually (don't use model_validate - field names don't match!)
    response = PostResponse(
        id=str(new_post.id),
        space_id=str(new_post.space_id),
        user_id=str(new_post.author_id),  # Map author_id → user_id
        content=new_post.content,
        media_urls=[file_url] if file_url else None,
        media_type=post_data.media_type,
        event_date=new_post.date_of_memory.isoformat() if new_post.date_of_memory else None,
        location=new_post.location_of_memory,
        privacy_level=new_post.privacy_level or "space",
        created_at=new_post.created_at,
        updated_at=new_post.updated_at,
        user={
            "id": str(current_user.id),
            "name": current_user.name,
            "profile_photo_url": current_user.profile_photo_url
        },
        tags=post_data.tags or [],
        comments=[],
        reactions=[],
        comment_count=0,
        reaction_count=0
    )
    
    return response


# --- GET POSTS (Timeline) ---

@router.get("/space/{space_id}", response_model=PostListResponse)
def get_space_posts(
    space_id: str,
    page: int = 1,
    per_page: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all posts/memories in a space (timeline)
    Paginated, sorted by date_of_memory (or created_at)
    """
    # Check space membership
    if not check_space_membership(db, current_user.id, space_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this space"
        )
    
    # Get total count
    total = db.query(Post).filter(
        Post.space_id == space_id,
        Post.is_active == True
    ).count()
    
    # Get posts
    offset = (page - 1) * per_page
    posts = db.query(Post).filter(
        Post.space_id == space_id,
        Post.is_active == True
    ).order_by(
        Post.date_of_memory.desc().nulls_last(),
        Post.created_at.desc()
    ).offset(offset).limit(per_page).all()
    
    # Prepare response
    post_responses = []
    for post in posts:
        # Get author
        author = db.query(User).filter(User.id == post.author_id).first()
        
        # Get comments
        comments = db.query(Comment).filter(
            Comment.post_id == post.id,
            Comment.is_active == True
        ).all()
        
        # Get reactions
        reactions = db.query(Reaction).filter(
            Reaction.post_id == post.id
        ).all()
        
        # Get tags - extract only valid tag names
        tags = db.query(PostTag).filter(
            PostTag.post_id == post.id
        ).all()
        tag_names = [t.tagged_name for t in tags if t.tagged_name and isinstance(t.tagged_name, str)]
        
        # Map model fields to API response fields
        response = PostResponse(
            id=str(post.id),
            space_id=str(post.space_id),
            user_id=str(post.author_id),
            content=post.content,
            media_urls=[post.file_url] if post.file_url else None,
            media_type="photo" if post.type == "photo" else None,
            event_date=post.date_of_memory.isoformat() if post.date_of_memory else None,
            location=post.location_of_memory,
            privacy_level=post.privacy_level or "space",
            created_at=post.created_at,
            updated_at=post.updated_at,
            user={
                "id": str(author.id),
                "name": author.name,
                "profile_photo_url": author.profile_photo_url
            } if author else None,
            comment_count=len(comments),
            reaction_count=len(reactions),
            tags=tag_names,  # ✅ Use pre-extracted tag names
            comments=[],
            reactions=[]
        )
        
        post_responses.append(response)
    
    return PostListResponse(
        posts=post_responses,
        total=total,
        page=page,
        per_page=per_page,
        has_more=(offset + len(posts)) < total
    )


# --- ADD COMMENT ---

@router.post("/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a comment to a post
    """
    # Check if post exists
    post = db.query(Post).filter(Post.id == comment_data.post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check space membership
    if not check_space_membership(db, current_user.id, post.space_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this space"
        )
    
    # Create comment
    new_comment = Comment(
        post_id=comment_data.post_id,
        author_id=current_user.id,  # ✅ Use author_id not user_id
        content=comment_data.content
    )
    
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    # Create new comment notification for the user who created the post
    # First get the post author
    post = db.query(Post).filter(Post.id == comment_data.post_id).first()

    if post and post.author_id != current_user.id:
        # Notify the post author
        try:
            notify_specific_user(
                db=db,
                user_id=post.author_id,
                space_id=post.space_id,
                notification_type="new_comment",
                title=f"{current_user.name} commented on your post",
                message=new_comment.content[:100],
                link_url=f"/space/memories",
                actor_id=current_user.id,
                actor_name=current_user.name,
                actor_photo=current_user.profile_photo_url
            )
        except Exception as e:
            print(f"Failed to send notification: {e}")
    
    # Build response manually
    response = CommentResponse(
        id=str(new_comment.id),
        post_id=str(new_comment.post_id),
        user_id=str(new_comment.author_id),  # Map author_id → user_id
        content=new_comment.content,
        created_at=new_comment.created_at,
        user={
            "id": str(current_user.id),
            "name": current_user.name,
            "profile_photo_url": current_user.profile_photo_url
        }
    )
    
    return response


# --- ADD REACTION ---

@router.post("/reactions", response_model=ReactionResponse, status_code=status.HTTP_201_CREATED)
def add_reaction(
    reaction_data: ReactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a reaction to a post
    """
    # Check if post exists
    post = db.query(Post).filter(Post.id == reaction_data.post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check space membership
    if not check_space_membership(db, current_user.id, post.space_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this space"
        )
    
    # Check if user already reacted
    existing = db.query(Reaction).filter(
        Reaction.post_id == reaction_data.post_id,
        Reaction.user_id == current_user.id
    ).first()
    
    if existing:
        # Update reaction type
        existing.type = reaction_data.reaction_type  # ✅ Use type field
        db.commit()
        db.refresh(existing)
        
        # Build response manually
        response = ReactionResponse(
            id=str(existing.id),
            post_id=str(existing.post_id),
            user_id=str(existing.user_id),
            reaction_type=existing.type,  # Map type → reaction_type
            created_at=existing.created_at,
            user={
                "id": str(current_user.id),
                "name": current_user.name,
                "profile_photo_url": current_user.profile_photo_url
            }
        )
    else:
        # Create new reaction
        new_reaction = Reaction(
            post_id=reaction_data.post_id,
            user_id=current_user.id,
            type=reaction_data.reaction_type  # ✅ Use type field
        )
        
        db.add(new_reaction)
        db.commit()
        db.refresh(new_reaction)
        
        # Build response manually
        response = ReactionResponse(
            id=str(new_reaction.id),
            post_id=str(new_reaction.post_id),
            user_id=str(new_reaction.user_id),
            reaction_type=new_reaction.type,  # Map type → reaction_type
            created_at=new_reaction.created_at,
            user={
                "id": str(current_user.id),
                "name": current_user.name,
                "profile_photo_url": current_user.profile_photo_url
            }
        )
    
    return response


# --- UPDATE POST ---

@router.patch("/{post_id}", response_model=PostResponse)
def update_post(
    post_id: str,
    space_id: str,  # Query parameter
    caption: Optional[str] = None,
    location: Optional[str] = None,
    event_date: Optional[str] = None,
    tags: Optional[str] = None,  # Comma-separated
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a post/memory
    Only author or space founders can update
    """
    # Get post
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check permissions
    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == current_user.id,
        SpaceMember.space_id == space_id
    ).first()
    
    is_author = str(post.author_id) == str(current_user.id)
    is_founder = membership and membership.role == "founder"
    
    if not (is_author or is_founder):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own posts"
        )
    
    # Update fields
    if caption is not None:
        post.content = caption
    
    if location is not None:
        post.location_of_memory = location
    
    if event_date is not None:
        try:
            dt = datetime.fromisoformat(event_date.replace('Z', '+00:00'))
            post.date_of_memory = dt.date()
        except ValueError:
            pass
    
    # Update tags
    if tags is not None:
        # Delete old tags
        db.query(PostTag).filter(PostTag.post_id == post_id).delete()
        
        # Add new tags
        if tags.strip():
            tag_list = [t.strip() for t in tags.split(',') if t.strip()]
            for tag_name in tag_list:
                new_tag = PostTag(post_id=post_id, tagged_name=tag_name)
                db.add(new_tag)
    
    post.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(post)
    
    # Get author
    author = db.query(User).filter(User.id == post.author_id).first()
    
    # Get tags
    post_tags = db.query(PostTag).filter(PostTag.post_id == post_id).all()
    tag_names = [t.tagged_name for t in post_tags if t.tagged_name and isinstance(t.tagged_name, str)]
    
    # Get comments
    comments = db.query(Comment).filter(
        Comment.post_id == post_id,
        Comment.is_active == True
    ).all()
    
    # Get reactions
    reactions = db.query(Reaction).filter(Reaction.post_id == post_id).all()
    
    # Build response
    return PostResponse(
        id=str(post.id),
        space_id=str(post.space_id),
        user_id=str(post.author_id),
        content=post.content,
        media_urls=[post.file_url] if post.file_url else None,
        media_type=post.type,
        event_date=post.date_of_memory.isoformat() if post.date_of_memory else None,
        location=post.location_of_memory,
        privacy_level=post.privacy_level,
        created_at=post.created_at,
        updated_at=post.updated_at,
        user={
            "id": str(author.id),
            "name": author.name,
            "profile_photo_url": author.profile_photo_url
        } if author else None,
        tags=tag_names,
        comment_count=len(comments),
        reaction_count=len(reactions)
    )


# --- DELETE POST ---

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: str,
    space_id: str,  # Query parameter
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a post/memory (soft delete)
    Only author or space founders can delete
    """
    # Get post
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check permissions
    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == current_user.id,
        SpaceMember.space_id == space_id
    ).first()
    
    is_author = str(post.author_id) == str(current_user.id)
    is_founder = membership and membership.role == "founder"
    
    if not (is_author or is_founder):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own posts"
        )
    
    # Soft delete
    post.is_active = False
    db.commit()
    
    return None


# --- UPLOAD VIDEO/PDF ---

from ..core.storage import save_file, FileUploadError

@router.post("/upload-file", status_code=status.HTTP_200_OK)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload video or PDF file
    Returns file URL to attach to post
    """
    try:
        result = await save_file(file, subfolder="media")
        return {
            "file_url": result["url"],
            "file_path": result["path"],
            "file_type": result["type"],
            "file_size": result["size"],
            "original_filename": result["original_filename"]
        }
    except FileUploadError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )