"""
Notifications API
Manage user notifications

PATH: echon/backend/app/api/notifications.py
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import Optional
from datetime import datetime, timedelta

from ..core.database import get_db
from ..models import User
from ..models.notification import Notification
from ..schemas.notification import (
    NotificationResponse, 
    NotificationListResponse,
    NotificationStats
)
from .auth import get_current_user

router = APIRouter()


# --- GET NOTIFICATIONS ---

@router.get("/", response_model=NotificationListResponse)
def get_notifications(
    space_id: Optional[str] = None,
    unread_only: bool = False,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's notifications
    """
    query = db.query(Notification).filter(
        Notification.user_id == current_user.id
    )
    
    # Filter by space
    if space_id:
        query = query.filter(Notification.space_id == space_id)
    
    # Filter unread only
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    # Get total count
    total = query.count()
    
    # Get unread count
    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    
    # Get notifications (newest first)
    notifications = query.order_by(
        Notification.created_at.desc()
    ).limit(limit).all()
    
    return NotificationListResponse(
        notifications=[
            NotificationResponse(
                id=str(n.id),
                user_id=str(n.user_id),
                space_id=str(n.space_id),
                type=n.type,
                title=n.title,
                message=n.message,
                link_url=n.link_url,
                actor_id=str(n.actor_id) if n.actor_id else None,
                actor_name=n.actor_name,
                actor_photo=n.actor_photo,
                is_read=n.is_read,
                read_at=n.read_at,
                created_at=n.created_at
            )
            for n in notifications
        ],
        total=total,
        unread_count=unread_count
    )


# --- GET STATS ---

@router.get("/stats", response_model=NotificationStats)
def get_notification_stats(
    space_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notification statistics"""
    query = db.query(Notification).filter(
        Notification.user_id == current_user.id
    )
    
    if space_id:
        query = query.filter(Notification.space_id == space_id)
    
    total = query.count()
    unread = query.filter(Notification.is_read == False).count()
    
    # Today's notifications
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today = query.filter(Notification.created_at >= today_start).count()
    
    return NotificationStats(
        total=total,
        unread=unread,
        today=today
    )


# --- MARK AS READ ---

@router.post("/{notification_id}/read", status_code=status.HTTP_200_OK)
def mark_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Notification marked as read"}


# --- MARK ALL AS READ ---

@router.post("/mark-all-read", status_code=status.HTTP_200_OK)
def mark_all_as_read(
    space_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    query = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    )
    
    if space_id:
        query = query.filter(Notification.space_id == space_id)
    
    count = query.update({
        "is_read": True,
        "read_at": datetime.utcnow()
    })
    
    db.commit()
    
    return {"message": f"Marked {count} notifications as read"}


# --- DELETE NOTIFICATION ---

@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    db.delete(notification)
    db.commit()
    
    return None


# --- HELPER: CREATE NOTIFICATION (for internal use) ---

def create_notification(
    db: Session,
    user_id: str,
    space_id: str,
    notification_type: str,
    title: str,
    message: str,
    link_url: str = None,
    actor_id: str = None,
    actor_name: str = None,
    actor_photo: str = None
):
    """
    Helper function to create notifications
    Called by other API endpoints (posts, comments, etc.)
    """
    notification = Notification(
        user_id=user_id,
        space_id=space_id,
        type=notification_type,
        title=title,
        message=message,
        link_url=link_url,
        actor_id=actor_id,
        actor_name=actor_name,
        actor_photo=actor_photo
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    return notification