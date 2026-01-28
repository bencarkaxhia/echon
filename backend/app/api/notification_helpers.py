"""
Notification Helpers
Functions to create notifications for various events

PATH: echon/backend/app/api/notification_helpers.py
"""

from sqlalchemy.orm import Session
from ..models import SpaceMember
from ..models.notification import Notification
from typing import Optional, List


def notify_space_members(
    db: Session,
    space_id: str,
    exclude_user_id: str,  # Don't notify the person who triggered it
    notification_type: str,
    title: str,
    message: str,
    link_url: Optional[str] = None,
    actor_id: Optional[str] = None,
    actor_name: Optional[str] = None,
    actor_photo: Optional[str] = None,
) -> int:
    """
    Send notification to all members of a space (except the actor)
    Returns: number of notifications created
    """
    # Get all active members except the actor
    members = db.query(SpaceMember).filter(
        SpaceMember.space_id == space_id,
        SpaceMember.user_id != exclude_user_id,
        SpaceMember.is_active == True
    ).all()
    
    count = 0
    for member in members:
        notification = Notification(
            user_id=member.user_id,
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
        count += 1
    
    db.commit()
    return count


def notify_specific_user(
    db: Session,
    user_id: str,
    space_id: str,
    notification_type: str,
    title: str,
    message: str,
    link_url: Optional[str] = None,
    actor_id: Optional[str] = None,
    actor_name: Optional[str] = None,
    actor_photo: Optional[str] = None,
) -> None:
    """
    Send notification to a specific user
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