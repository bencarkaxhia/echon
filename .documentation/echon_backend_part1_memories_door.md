# 📁 ECHON - MEMORIES FEATURE (Backend Part 1)

Backend for photo/video upload and memory creation.

---

## 🆕 NEW FILES CREATED

### Core Utilities

1. **echon/backend/app/core/storage.py**
   - File upload handling (photos, videos, audio)
   - Image thumbnail creation
   - File validation (type, size)
   - File serving utilities
   - Storage: `/tmp/echon_uploads` (local for now, S3 later)

### Schemas

2. **echon/backend/app/schemas/post.py**
   - PostCreate (create memory request)
   - PostResponse (memory with comments/reactions)
   - CommentCreate, CommentResponse
   - ReactionCreate, ReactionResponse
   - PostListResponse (paginated timeline)

### API Endpoints

3. **echon/backend/app/api/posts.py**
   - POST /api/posts/upload-media - Upload photo/video/audio
   - POST /api/posts - Create memory/post
   - GET /api/posts/space/{space_id} - Get timeline (paginated)
   - POST /api/posts/comments - Add comment
   - POST /api/posts/reactions - Add reaction (heart, love, etc.)

### Updated Files

4. **echon/backend/app/schemas/__init__.py** - Export post schemas
5. **echon/backend/app/main.py** - Register posts router + serve uploads
6. **echon/backend/requirements.txt** - Add aiofiles

---

## 📂 API ENDPOINTS

### Upload Media
```
POST /api/posts/upload-media
Content-Type: multipart/form-data

Body:
- file: (binary)
- media_type: "photo" | "video" | "audio"

Response:
{
  "file_path": "memories/photos/uuid.jpg",
  "file_url": "/uploads/memories/photos/uuid.jpg",
  "media_type": "photo"
}
```

### Create Memory
```
POST /api/posts
Content-Type: application/json

Body:
{
  "space_id": "uuid",
  "content": "Family reunion in Shkodra",
  "media_urls": ["/uploads/memories/photos/uuid.jpg"],
  "media_type": "photo",
  "event_date": "2024-08-15T12:00:00",
  "location": "Shkodra, Albania",
  "privacy_level": "space",
  "tags": ["reunion", "albania", "2024"]
}

Response: PostResponse (full memory object)
```

### Get Timeline
```
GET /api/posts/space/{space_id}?page=1&per_page=20

Response:
{
  "posts": [...],
  "total": 45,
  "page": 1,
  "per_page": 20,
  "has_more": true
}
```

### Add Comment
```
POST /api/posts/comments

Body:
{
  "post_id": "uuid",
  "content": "Beautiful memory!"
}
```

### Add Reaction
```
POST /api/posts/reactions

Body:
{
  "post_id": "uuid",
  "reaction_type": "heart"
}
```

---

## 🔐 SECURITY

- All endpoints require authentication
- Space membership checked before:
  - Creating posts
  - Viewing posts
  - Adding comments/reactions
- File type validation
- File size limits:
  - Images: 10 MB
  - Videos: 100 MB
  - Audio: 25 MB

---

## 💾 FILE STORAGE

**Current:** Local storage in `/tmp/echon_uploads`
**Structure:**
```
/tmp/echon_uploads/
├── memories/
│   ├── photos/
│   │   ├── uuid-1.jpg
│   │   └── thumb_uuid-1.jpg
│   ├── videos/
│   │   └── uuid-2.mp4
│   └── audio/
│       └── uuid-3.mp3
```

**Future:** AWS S3 bucket

---

## 🚀 INSTALLATION

```bash
cd echon/backend
source venv/bin/activate
pip install aiofiles==24.1.0
uvicorn app.main:app --reload
```

---

## ✅ TEST THE API

Go to: http://localhost:8000/docs

**Test Flow:**
1. POST /api/posts/upload-media → Upload a photo
2. POST /api/posts → Create memory with uploaded photo
3. GET /api/posts/space/{your_space_id} → See timeline
4. POST /api/posts/comments → Add comment
5. POST /api/posts/reactions → Add heart reaction

---

## 📝 NOTES

- Thumbnails auto-created for images (400x400)
- Posts sorted by event_date (or created_at)
- Privacy levels: space, close_family, extended_family
- Reaction types: heart, love, care, tears, wow
- Tags are searchable (future feature)

---

**NEXT: Frontend UI for uploading photos and viewing timeline!** 🔥