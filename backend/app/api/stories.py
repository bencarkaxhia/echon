"""
Echon Stories API
Voice recordings and oral history

PATH: echon/backend/app/api/stories.py
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime

from ..core.database import get_db
from ..core.storage import save_audio, get_file_url, FileUploadError
from ..models import Post, PostTag, User, SpaceMember
from ..schemas.story import StoryCreate, StoryResponse, StoryListResponse
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


# --- UPLOAD AUDIO ---

@router.post("/upload-audio", status_code=status.HTTP_201_CREATED)
async def upload_audio(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload an audio file for a story
    Returns the file URL
    """
    try:
        file_path = await save_audio(file, subfolder="stories/audio")
        
        return {
            "file_path": file_path,
            "file_url": get_file_url(file_path),
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


# --- CREATE STORY ---

@router.post("", response_model=StoryResponse, status_code=status.HTTP_201_CREATED)
def create_story(
    story_data: StoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new voice story
    """
    # Check space membership
    if not check_space_membership(db, current_user.id, story_data.space_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this space"
        )
    
    # Convert story_date string to date if provided
    story_date_obj = None
    if story_data.story_date:
        try:
            dt = datetime.fromisoformat(story_data.story_date.replace('Z', '+00:00'))
            story_date_obj = dt.date()
        except ValueError:
            pass
    
    # Create post (stories are posts with type="voice")
    new_story = Post(
        space_id=story_data.space_id,
        author_id=current_user.id,
        type="voice",
        content=story_data.description,
        file_url=story_data.audio_url,
        file_type="audio",
        date_of_memory=story_date_obj,
        location_of_memory=story_data.location,
        privacy_level="space",
    )
    
    db.add(new_story)
    db.commit()
    db.refresh(new_story)
    
    # Add tags if provided
    if story_data.tags:
        for tag_name in story_data.tags:
            tag = PostTag(
                post_id=new_story.id,
                tagged_name=tag_name
            )
            db.add(tag)
        db.commit()
    
    # Build response
    response = StoryResponse(
        id=str(new_story.id),
        space_id=str(new_story.space_id),
        author_id=str(new_story.author_id),
        title=story_data.title,
        description=new_story.content,
        audio_url=new_story.file_url,
        duration=story_data.duration,
        story_date=new_story.date_of_memory.isoformat() if new_story.date_of_memory else None,
        location=new_story.location_of_memory,
        created_at=new_story.created_at,
        updated_at=new_story.updated_at,
        author={
            "id": str(current_user.id),
            "name": current_user.name,
            "profile_photo_url": current_user.profile_photo_url
        },
        tags=story_data.tags or [],
        play_count=0
    )
    
    return response


# --- GET STORIES (Timeline) ---

@router.get("/space/{space_id}", response_model=StoryListResponse)
def get_space_stories(
    space_id: str,
    page: int = 1,
    per_page: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all voice stories in a space
    Paginated, sorted by date
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
        Post.type == "voice",
        Post.is_active == True
    ).count()
    
    # Get stories
    offset = (page - 1) * per_page
    stories = db.query(Post).filter(
        Post.space_id == space_id,
        Post.type == "voice",
        Post.is_active == True
    ).order_by(
        Post.date_of_memory.desc().nulls_last(),
        Post.created_at.desc()
    ).offset(offset).limit(per_page).all()
    
    # Build responses
    story_responses = []
    for story in stories:
        # Get author
        author = db.query(User).filter(User.id == story.author_id).first()
        
        # Get tags
        tags = db.query(PostTag).filter(
            PostTag.post_id == story.id
        ).all()
        tag_names = [t.tagged_name for t in tags if t.tagged_name and isinstance(t.tagged_name, str)]
        
        # Build response
        response = StoryResponse(
            id=str(story.id),
            space_id=str(story.space_id),
            author_id=str(story.author_id),
            title=story.content or "Untitled Story",  # Use content as title for now
            description=story.content,
            audio_url=story.file_url,
            duration=None,  # Not stored yet
            story_date=story.date_of_memory.isoformat() if story.date_of_memory else None,
            location=story.location_of_memory,
            created_at=story.created_at,
            updated_at=story.updated_at,
            author={
                "id": str(author.id),
                "name": author.name,
                "profile_photo_url": author.profile_photo_url
            } if author else None,
            tags=tag_names,
            play_count=0
        )
        
        story_responses.append(response)
    
    return StoryListResponse(
        stories=story_responses,
        total=total,
        page=page,
        per_page=per_page,
        has_more=(offset + len(stories)) < total
    )


# --- DELETE STORY ---

@router.delete("/{story_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_story(
    story_id: str,
    space_id: str,  # Query parameter
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a story (soft delete)
    Only author or founders can delete
    """
    # Get story
    story = db.query(Post).filter(
        Post.id == story_id,
        Post.type == "voice"
    ).first()
    
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )
    
    # Check permissions
    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == current_user.id,
        SpaceMember.space_id == space_id
    ).first()
    
    is_author = str(story.author_id) == str(current_user.id)
    is_founder = membership and membership.role == "founder"
    
    if not (is_author or is_founder):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own stories"
        )
    
    # Soft delete
    story.is_active = False
    db.commit()
    
    return None