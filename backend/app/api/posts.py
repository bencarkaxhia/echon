"""
Echon Posts/Memories API
Create and manage family memories

PATH: echon/backend/app/api/posts.py
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, func
from typing import List, Optional
from datetime import datetime, date
import json

from ..core.database import get_db
from ..core.storage import save_image, save_video, save_audio, save_file, get_file_url, FileUploadError
from ..models import Post, Comment, Reaction, PostTag, User, SpaceMember
from ..schemas.post import (
    PostCreate, PostResponse, PostListResponse,
    CommentCreate, CommentResponse,
    ReactionCreate, ReactionResponse,
    DecadeCount, DecadesResponse,
)
from .auth import get_current_user
from .notification_helpers import notify_space_members
from .notification_helpers import notify_specific_user

router = APIRouter()


# ── Helpers ──────────────────────────────────────────────────────────────────

def check_space_membership(db: Session, user_id, space_id: str) -> bool:
    return db.query(SpaceMember).filter(
        SpaceMember.user_id == user_id,
        SpaceMember.space_id == space_id,
        SpaceMember.is_active == True
    ).first() is not None


def _to_decade(d: date) -> str:
    """1965-07-14 → '1960s'"""
    return f"{(d.year // 10) * 10}s"


def _parse_event_date(raw: str):
    """
    Accepts:
      - "YYYY"           → date(YYYY, 1, 1)  (year-only)
      - "YYYY-MM-DD"     → date(YYYY, MM, DD)
      - ISO datetime     → date portion
    Returns (date_obj, decade_str) or (None, None).
    """
    if not raw:
        return None, None
    raw = raw.strip()
    try:
        if len(raw) == 4 and raw.isdigit():
            d = date(int(raw), 1, 1)
        elif "T" in raw or "Z" in raw:
            d = datetime.fromisoformat(raw.replace("Z", "+00:00")).date()
        else:
            d = date.fromisoformat(raw)
        return d, _to_decade(d)
    except (ValueError, TypeError):
        return None, None


def _build_post_response(post: Post, author: User, reactions: list, tags: list) -> PostResponse:
    """Build a PostResponse dict from ORM objects."""
    reaction_responses = [
        ReactionResponse(
            id=str(r.id),
            post_id=str(r.post_id),
            user_id=str(r.user_id),
            reaction_type=r.type,
            created_at=r.created_at,
            user={
                "id": str(r.user.id),
                "name": r.user.name,
                "profile_photo_url": r.user.profile_photo_url,
            } if r.user else None,
        )
        for r in reactions
    ]

    # event_date: show year-only when day is Jan 1 and decade was set from year-only input
    event_date_str = None
    if post.date_of_memory:
        d = post.date_of_memory
        # If stored as Jan-1 and decade exists, display as year only
        if d.month == 1 and d.day == 1 and post.decade:
            event_date_str = str(d.year)
        else:
            event_date_str = d.isoformat()

    return PostResponse(
        id=str(post.id),
        space_id=str(post.space_id),
        user_id=str(post.author_id),
        content=post.content,
        media_urls=[post.file_url] if post.file_url else None,
        media_type="photo" if post.type == "photo" else (post.type if post.type else None),
        event_date=event_date_str,
        location=post.location_of_memory,
        privacy_level=post.privacy_level or "space",
        is_pinned=bool(post.is_pinned),
        created_at=post.created_at,
        updated_at=post.updated_at,
        user={
            "id": str(author.id),
            "name": author.name,
            "profile_photo_url": author.profile_photo_url,
        } if author else None,
        tags=tags,
        comments=[],
        reactions=reaction_responses,
        comment_count=post.comment_count or 0,
        reaction_count=len(reaction_responses),
    )


# ── FILE UPLOAD ───────────────────────────────────────────────────────────────

@router.post("/upload-media", status_code=status.HTTP_201_CREATED)
async def upload_media(
    file: UploadFile = File(...),
    media_type: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if media_type == "photo":
            result = await save_image(file, subfolder="memories/photos")
            file_path = result.get("url") or result["original"]
        elif media_type == "video":
            file_path = await save_video(file, subfolder="memories/videos")
        elif media_type == "audio":
            file_path = await save_audio(file, subfolder="memories/audio")
        elif media_type == "pdf":
            result = await save_image(file, subfolder="memories/photos")
            file_path = result.get("url") or result["original"]
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid media_type. Must be: photo, video, audio, or pdf"
            )
        return {
            "file_path": file_path,
            "file_url": get_file_url(file_path),
            "media_type": media_type,
        }
    except FileUploadError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Upload failed: {str(e)}")


# ── CREATE POST ───────────────────────────────────────────────────────────────

@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not check_space_membership(db, current_user.id, post_data.space_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You are not a member of this space")

    # Require either content or media
    if not post_data.content and not post_data.media_urls:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="A memory must have text or media.")

    date_of_memory, decade = _parse_event_date(post_data.event_date)

    # Determine type
    if post_data.media_urls:
        post_type = post_data.media_type or "photo"
    else:
        post_type = "story"

    file_url = post_data.media_urls[0] if post_data.media_urls else None

    new_post = Post(
        space_id=post_data.space_id,
        author_id=current_user.id,
        type=post_type,
        content=post_data.content,
        file_url=file_url,
        date_of_memory=date_of_memory,
        decade=decade,
        location_of_memory=post_data.location,
        privacy_level=post_data.privacy_level,
        comment_count=0,
        reaction_count=0,
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    # Notifications
    try:
        notify_space_members(
            db=db,
            space_id=post_data.space_id,
            exclude_user_id=current_user.id,
            notification_type="new_post",
            title=f"{current_user.name} posted a new memory",
            message=new_post.content[:100] if new_post.content else "Check out the new memory!",
            link_url="/space/memories",
            actor_id=current_user.id,
            actor_name=current_user.name,
            actor_photo=current_user.profile_photo_url,
        )
    except Exception:
        pass

    # Tags
    if post_data.tags:
        for tag_name in post_data.tags:
            db.add(PostTag(post_id=new_post.id, tagged_name=tag_name))
        db.commit()

    tag_names = post_data.tags or []
    return _build_post_response(new_post, current_user, [], tag_names)


# ── GET POSTS (with optional decade filter) ───────────────────────────────────

@router.get("/space/{space_id}", response_model=PostListResponse)
def get_space_posts(
    space_id: str,
    page: int = 1,
    per_page: int = 20,
    decade: Optional[str] = None,        # e.g. "1960s"
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not check_space_membership(db, current_user.id, space_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You are not a member of this space")

    q = db.query(Post).filter(Post.space_id == space_id, Post.is_active == True)
    if decade:
        q = q.filter(Post.decade == decade)

    total = q.count()

    offset = (page - 1) * per_page
    posts = q.order_by(
        Post.is_pinned.desc(),              # pinned first
        Post.date_of_memory.desc().nulls_last(),
        Post.created_at.desc()
    ).offset(offset).limit(per_page).all()

    post_responses = []
    for post in posts:
        author = db.query(User).filter(User.id == post.author_id).first()
        reactions = (
            db.query(Reaction)
            .filter(Reaction.post_id == post.id)
            .join(User, Reaction.user_id == User.id, isouter=True)
            .all()
        )
        for r in reactions:
            r.user  # preload

        tag_names = [
            t.tagged_name for t in
            db.query(PostTag).filter(PostTag.post_id == post.id).all()
            if t.tagged_name and isinstance(t.tagged_name, str)
        ]

        post_responses.append(_build_post_response(post, author, reactions, tag_names))

    return PostListResponse(
        posts=post_responses,
        total=total,
        page=page,
        per_page=per_page,
        has_more=(offset + len(posts)) < total,
    )


# ── GET AVAILABLE DECADES ──────────────────────────────────────────────────────

@router.get("/space/{space_id}/decades", response_model=DecadesResponse)
def get_decades(
    space_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return list of decades that have at least one post in this space."""
    if not check_space_membership(db, current_user.id, space_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You are not a member of this space")

    rows = (
        db.query(Post.decade, func.count(Post.id).label("cnt"))
        .filter(
            Post.space_id == space_id,
            Post.is_active == True,
            Post.decade.isnot(None),
        )
        .group_by(Post.decade)
        .order_by(Post.decade.asc())
        .all()
    )
    return DecadesResponse(decades=[DecadeCount(decade=r.decade, count=r.cnt) for r in rows])


# ── GET COMMENTS FOR POST ──────────────────────────────────────────────────────

@router.get("/{post_id}/comments", response_model=List[CommentResponse])
def get_post_comments(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id, Post.is_active == True).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if not check_space_membership(db, current_user.id, post.space_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member")

    comments = (
        db.query(Comment)
        .filter(Comment.post_id == post_id, Comment.is_active == True)
        .order_by(Comment.created_at.asc())
        .all()
    )
    result = []
    for c in comments:
        author = db.query(User).filter(User.id == c.author_id).first()
        result.append(CommentResponse(
            id=str(c.id),
            post_id=str(c.post_id),
            user_id=str(c.author_id),
            content=c.content,
            created_at=c.created_at,
            user={"id": str(author.id), "name": author.name,
                  "profile_photo_url": author.profile_photo_url} if author else None,
        ))
    return result


# ── ADD COMMENT ───────────────────────────────────────────────────────────────

@router.post("/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == comment_data.post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if not check_space_membership(db, current_user.id, post.space_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You are not a member of this space")

    new_comment = Comment(
        post_id=comment_data.post_id,
        author_id=current_user.id,
        content=comment_data.content,
    )
    db.add(new_comment)

    # Increment comment_count
    post.comment_count = (post.comment_count or 0) + 1
    db.commit()
    db.refresh(new_comment)

    # Notify post author
    if post.author_id != current_user.id:
        try:
            notify_specific_user(
                db=db,
                user_id=post.author_id,
                space_id=post.space_id,
                notification_type="new_comment",
                title=f"{current_user.name} commented on your memory",
                message=new_comment.content[:100],
                link_url="/space/memories",
                actor_id=current_user.id,
                actor_name=current_user.name,
                actor_photo=current_user.profile_photo_url,
            )
        except Exception:
            pass

    return CommentResponse(
        id=str(new_comment.id),
        post_id=str(new_comment.post_id),
        user_id=str(new_comment.author_id),
        content=new_comment.content,
        created_at=new_comment.created_at,
        user={"id": str(current_user.id), "name": current_user.name,
              "profile_photo_url": current_user.profile_photo_url},
    )


# ── TOGGLE REACTION ───────────────────────────────────────────────────────────

@router.post("/reactions", status_code=status.HTTP_200_OK)
def toggle_reaction(
    reaction_data: ReactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Toggle a reaction:
    - No existing reaction → create
    - Same type exists → remove (toggle off)
    - Different type exists → update to new type
    Returns {"action": "added"|"removed"|"changed", "reaction": {...}|null}
    """
    post = db.query(Post).filter(Post.id == reaction_data.post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if not check_space_membership(db, current_user.id, post.space_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You are not a member of this space")

    existing = db.query(Reaction).filter(
        Reaction.post_id == reaction_data.post_id,
        Reaction.user_id == current_user.id,
    ).first()

    if existing:
        if existing.type == reaction_data.reaction_type:
            # Same type → remove
            db.delete(existing)
            db.commit()
            return {"action": "removed", "reaction": None}
        else:
            # Different type → update
            existing.type = reaction_data.reaction_type
            db.commit()
            db.refresh(existing)
            return {
                "action": "changed",
                "reaction": ReactionResponse(
                    id=str(existing.id),
                    post_id=str(existing.post_id),
                    user_id=str(existing.user_id),
                    reaction_type=existing.type,
                    created_at=existing.created_at,
                    user={"id": str(current_user.id), "name": current_user.name,
                          "profile_photo_url": current_user.profile_photo_url},
                ),
            }

    # New reaction
    new_reaction = Reaction(
        post_id=reaction_data.post_id,
        user_id=current_user.id,
        type=reaction_data.reaction_type,
    )
    db.add(new_reaction)
    db.commit()
    db.refresh(new_reaction)
    return {
        "action": "added",
        "reaction": ReactionResponse(
            id=str(new_reaction.id),
            post_id=str(new_reaction.post_id),
            user_id=str(new_reaction.user_id),
            reaction_type=new_reaction.type,
            created_at=new_reaction.created_at,
            user={"id": str(current_user.id), "name": current_user.name,
                  "profile_photo_url": current_user.profile_photo_url},
        ),
    }


# ── PIN / UNPIN ────────────────────────────────────────────────────────────────

@router.post("/{post_id}/pin", status_code=status.HTTP_200_OK)
def toggle_pin(
    post_id: str,
    space_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle pin status of a memory. Any space member can pin/unpin."""
    post = db.query(Post).filter(Post.id == post_id, Post.is_active == True).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if not check_space_membership(db, current_user.id, space_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member")

    post.is_pinned = not bool(post.is_pinned)
    db.commit()
    return {"is_pinned": post.is_pinned}


# ── UPDATE POST ───────────────────────────────────────────────────────────────

@router.patch("/{post_id}", response_model=PostResponse)
def update_post(
    post_id: str,
    space_id: str,
    caption: Optional[str] = None,
    location: Optional[str] = None,
    event_date: Optional[str] = None,
    tags: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == current_user.id,
        SpaceMember.space_id == space_id,
    ).first()
    is_author = str(post.author_id) == str(current_user.id)
    is_founder = membership and membership.role == "founder"
    if not (is_author or is_founder):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You can only edit your own memories")

    if caption is not None:
        post.content = caption
    if location is not None:
        post.location_of_memory = location
    if event_date is not None:
        d, decade = _parse_event_date(event_date)
        post.date_of_memory = d
        post.decade = decade

    if tags is not None:
        db.query(PostTag).filter(PostTag.post_id == post_id).delete()
        if tags.strip():
            for tag_name in [t.strip() for t in tags.split(",") if t.strip()]:
                db.add(PostTag(post_id=post_id, tagged_name=tag_name))

    post.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(post)

    author = db.query(User).filter(User.id == post.author_id).first()
    reactions = db.query(Reaction).filter(Reaction.post_id == post_id).all()
    for r in reactions:
        r.user
    tag_names = [
        t.tagged_name for t in db.query(PostTag).filter(PostTag.post_id == post_id).all()
        if t.tagged_name and isinstance(t.tagged_name, str)
    ]
    return _build_post_response(post, author, reactions, tag_names)


# ── DELETE POST ───────────────────────────────────────────────────────────────

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: str,
    space_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    membership = db.query(SpaceMember).filter(
        SpaceMember.user_id == current_user.id,
        SpaceMember.space_id == space_id,
    ).first()
    is_author = str(post.author_id) == str(current_user.id)
    is_founder = membership and membership.role == "founder"
    if not (is_author or is_founder):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You can only delete your own memories")

    post.is_active = False
    db.commit()


# ── UPLOAD FILE ───────────────────────────────────────────────────────────────

from ..core.storage import save_file

@router.post("/upload-file", status_code=status.HTTP_200_OK)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    try:
        result = await save_file(file, subfolder="media")
        return {
            "file_url": result["url"],
            "file_path": result["path"],
            "file_type": result["type"],
            "file_size": result["size"],
            "original_filename": result["original_filename"],
        }
    except FileUploadError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
