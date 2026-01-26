# 📁 ECHON - NOW DOOR (Backend Part 1)

Backend API for activity feed and quick updates.

---

## 🆕 NEW FILES CREATED

### Schemas

1. **echon/backend/app/schemas/activity.py**
   - ActivityItem (single activity)
   - ActivityFeedResponse (feed with pagination)
   - QuickUpdateCreate (post status)
   - SpaceStats (space statistics)

### API Endpoints

2. **echon/backend/app/api/activity.py**
   - GET /api/activity/space/{space_id} - Get activity feed
   - POST /api/activity/quick-update - Post quick update
   - GET /api/activity/stats/{space_id} - Get space stats

### Updated Files

3. **echon/backend/app/schemas/__init__.py** - Export activity schemas
4. **echon/backend/app/main.py** - Register activity router

---

## 📂 API ENDPOINTS

### Get Activity Feed
```
GET /api/activity/space/{space_id}?page=1&per_page=50

Response:
{
  "activities": [
    {
      "id": "uuid",
      "type": "memory",  // "memory", "story", "comment", "reaction", "member_joined"
      "space_id": "uuid",
      "user_id": "uuid",
      "content": "Family reunion",
      "related_id": "uuid",
      "created_at": "2026-01-26...",
      "user_name": "Beni Çarkaxhia",
      "user_photo": null,
      "preview_url": "/uploads/...",
      "preview_text": "Family reunion..."
    }
  ],
  "total": 45,
  "page": 1,
  "per_page": 50,
  "has_more": false
}
```

### Post Quick Update
```
POST /api/activity/quick-update

Body:
{
  "space_id": "uuid",
  "content": "Just finished dinner with the family!"
}

Response:
{
  "id": "uuid",
  "content": "Just finished...",
  "created_at": "2026-01-26..."
}
```

### Get Space Stats
```
GET /api/activity/stats/{space_id}

Response:
{
  "total_members": 3,
  "total_memories": 12,
  "total_stories": 5,
  "total_comments": 28,
  "recent_activity_count": 8  // Last 7 days
}
```

---

## 📊 ACTIVITY TYPES

### memory
- New photo uploaded
- Shows preview image
- Links to memory

### story
- New voice story recorded
- Shows audio icon
- Links to story

### comment
- Someone commented
- Shows comment text
- Links to post

### reaction
- Someone reacted (heart)
- Shows reaction type
- Links to post

### member_joined
- New member joined
- Shows user photo
- Links to profile

---

## 🔐 PERMISSIONS

- **View Activity:** Any member
- **Post Updates:** Any member
- **View Stats:** Any member

---

## 📈 STATISTICS

### Tracked:
- Total members
- Total memories (photos)
- Total stories (voice)
- Total comments
- Recent activity (last 7 days)

---

## 🚀 TESTING

### 1. Restart Backend
```bash
cd echon/backend
uvicorn app.main:app --reload
```

### 2. Test in API Docs
Go to: http://localhost:8000/docs

**Test GET /api/activity/space/{your_space_id}**
- Should return all recent activity

**Test GET /api/activity/stats/{your_space_id}**
- Should return space statistics

**Test POST /api/activity/quick-update**
- Post a status update

---

## 📝 NOTES

- Activity feed combines posts, comments, reactions, members
- Sorted by date (newest first)
- Paginated (default 50 per page)
- Quick updates stored as text posts
- Stats computed in real-time

---

**BACKEND IS READY! Next: Frontend UI with activity feed!** 💬🔥