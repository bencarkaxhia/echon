"""
Echon Chat API
Family group chat

PATH: echon/backend/app/api/chat.py
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime

from ..core.database import get_db
from ..models import Post, User, SpaceMember
from ..schemas.chat import ChatMessageCreate, ChatMessage, ChatMessagesResponse
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


# --- SEND MESSAGE ---

@router.post("/send", status_code=status.HTTP_201_CREATED)
def send_message(
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a chat message to the family space
    Uses Posts table with type='chat'
    """
    # Check space membership
    if not check_space_membership(db, current_user.id, message_data.space_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this space"
        )
    
    # Create message as a post
    new_message = Post(
        space_id=message_data.space_id,
        author_id=current_user.id,
        type="chat",
        content=message_data.content,
        privacy_level="space"
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return ChatMessage(
        id=str(new_message.id),
        space_id=str(new_message.space_id),
        user_id=str(new_message.author_id),
        content=new_message.content,
        created_at=new_message.created_at,
        user_name=current_user.name,
        user_photo=current_user.profile_photo_url
    )


# --- GET MESSAGES ---

@router.get("/messages/{space_id}")
def get_messages(
    space_id: str,
    page: int = 1,
    per_page: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get chat messages for a space
    Returns messages in chronological order (oldest first for display)
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
        Post.type == "chat",
        Post.is_active == True
    ).count()
    
    # Get messages (newest first for pagination, will reverse in frontend)
    offset = (page - 1) * per_page
    messages_query = db.query(Post).filter(
        Post.space_id == space_id,
        Post.type == "chat",
        Post.is_active == True
    ).order_by(desc(Post.created_at)).offset(offset).limit(per_page).all()
    
    # Build response
    chat_messages = []
    for msg in messages_query:
        author = db.query(User).filter(User.id == msg.author_id).first()
        if author:
            chat_messages.append(ChatMessage(
                id=str(msg.id),
                space_id=str(msg.space_id),
                user_id=str(msg.author_id),
                content=msg.content,
                created_at=msg.created_at,
                user_name=author.name,
                user_photo=author.profile_photo_url
            ))
    
    # Reverse to show oldest first
    chat_messages.reverse()
    
    return ChatMessagesResponse(
        messages=chat_messages,
        total=total,
        page=page,
        per_page=per_page,
        has_more=(offset + len(chat_messages)) < total
    )


# --- DELETE MESSAGE ---

@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    message_id: str,
    space_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a chat message
    Only author or founders can delete
    """
    # Get message
    message = db.query(Post).filter(
        Post.id == message_id,
        Post.type == "chat"
    ).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Check permissions
    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == current_user.id,
        SpaceMember.space_id == space_id
    ).first()
    
    is_author = str(message.author_id) == str(current_user.id)
    is_founder = membership and membership.role == "founder"
    
    if not (is_author or is_founder):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own messages"
        )
    
    # Soft delete
    message.is_active = False
    db.commit()
    
    return None