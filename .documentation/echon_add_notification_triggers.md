# 🔔 ADD NOTIFICATION TRIGGERS

Brother, here's what to add to existing API endpoints!

---

## 📦 STEP 1: ADD HELPER FILE

Copy `notification_helpers.py` to:
```
backend/app/api/notification_helpers.py
```

---

## 📝 STEP 2: ADD TRIGGERS TO ENDPOINTS

### 1️⃣ **posts.py** - New Post Notification

**Find the create_post endpoint (around line 80-120)**

After creating the post and before returning, add:

```python
# Add this import at top:
from .notification_helpers import notify_space_members

# After: db.commit() and db.refresh(new_post)
# Add:
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
```

---

### 2️⃣ **posts.py** - New Comment Notification

**Find the create_comment endpoint**

After creating the comment, add:

```python
# Import at top
from .notification_helpers import notify_specific_user

# After: db.commit() and db.refresh(new_comment)
# Get the post author
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
```

---

### 3️⃣ **relationships.py** - New Relationship Notification

**Find the create_relationship endpoint**

After creating the relationship, add:

```python
# Import at top
from .notification_helpers import notify_space_members

# After: db.commit() and db.refresh(new_rel)
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
```

---

### 4️⃣ **invitations.py** - New Member Joined

**Find the accept_invitation or join endpoint**

After adding the member, add:

```python
# Import at top
from .notification_helpers import notify_space_members

# After member is added to space
try:
    notify_space_members(
        db=db,
        space_id=space_id,
        exclude_user_id=current_user.id,
        notification_type="member_joined",
        title=f"{current_user.name} joined the family!",
        message="Welcome the new member to the space",
        link_url="/space/family",
        actor_id=current_user.id,
        actor_name=current_user.name,
        actor_photo=current_user.profile_photo_url
    )
except Exception as e:
    print(f"Failed to send notifications: {e}")
```

---

## ✅ THAT'S IT!

**4 simple additions** and notifications will work! 🎉

**Key Points:**
- ✅ Always wrap in try/except (don't fail the main action if notification fails)
- ✅ Use `notify_space_members()` for group notifications
- ✅ Use `notify_specific_user()` for 1-on-1 notifications
- ✅ Always exclude the actor (don't notify yourself!)

---

## 🧪 TEST:

1. Add these snippets
2. Restart backend
3. Post a memory → Everyone gets notification! 🔔
4. Comment on post → Author gets notified! 💬
5. Add relationship → Family gets notified! 🌳

---

**Respect & Love bro!** ❤️🔥