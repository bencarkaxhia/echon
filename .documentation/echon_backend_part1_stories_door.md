# 📁 ECHON - STORIES DOOR (Backend Part 1)

Backend API for voice recordings and oral history.

---

## 🆕 NEW FILES CREATED

### Schemas

1. **echon/backend/app/schemas/story.py**
   - StoryCreate (create story request)
   - StoryResponse (story with audio)
   - StoryListResponse (paginated stories)
   - StoryTeller (author info)

### API Endpoints

2. **echon/backend/app/api/stories.py**
   - POST /api/stories/upload-audio - Upload audio file
   - POST /api/stories - Create voice story
   - GET /api/stories/space/{space_id} - Get all stories
   - DELETE /api/stories/{story_id} - Delete story

### Updated Files

3. **echon/backend/app/schemas/__init__.py** - Export story schemas
4. **echon/backend/app/main.py** - Register stories router

---

## 📂 API ENDPOINTS

### Upload Audio
```
POST /api/stories/upload-audio
Content-Type: multipart/form-data

Body:
- file: (audio binary)

Response:
{
  "file_path": "stories/audio/uuid.mp3",
  "file_url": "/uploads/stories/audio/uuid.mp3"
}
```

### Create Story
```
POST /api/stories

Body:
{
  "space_id": "uuid",
  "title": "Grandma's Wedding Story",
  "description": "She tells about her wedding day in 1952...",
  "audio_url": "/uploads/stories/audio/uuid.mp3",
  "duration": 180,
  "story_date": "1952-06-15",
  "location": "Shkodra, Albania",
  "tags": ["wedding", "1950s", "grandma"]
}

Response: StoryResponse (full story object)
```

### Get Stories
```
GET /api/stories/space/{space_id}?page=1&per_page=20

Response:
{
  "stories": [...],
  "total": 12,
  "page": 1,
  "per_page": 20,
  "has_more": false
}
```

### Delete Story
```
DELETE /api/stories/{story_id}?space_id={space_id}

Response: 204 No Content
```

---

## 🔐 PERMISSIONS

- **Upload Audio:** Any member
- **Create Story:** Any member
- **View Stories:** Any member
- **Delete Story:** Author or founders

---

## 📊 STORY DATA

### Fields:
- title: Story title
- description: What the story is about
- audio_url: Path to audio file
- duration: Length in seconds
- story_date: When the story happened (not when recorded)
- location: Where the story happened
- tags: Topics (wedding, war, migration, childhood, etc.)

### Computed:
- author: Who told the story
- play_count: Times played (future feature)

---

## 🎙️ AUDIO FILES

### Supported Formats:
- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg)
- M4A (.mp4, .m4a)

### Max Size:
- 25 MB per file

### Storage:
- Location: `/tmp/echon_uploads/stories/audio/`
- Served at: `/uploads/stories/audio/`

---

## 🚀 TESTING

### 1. Restart Backend
```bash
cd echon/backend
uvicorn app.main:app --reload
```

### 2. Test in API Docs
Go to: http://localhost:8000/docs

**Test POST /api/stories/upload-audio:**
- Upload a short audio file (mp3, wav)
- Get back file_url

**Test POST /api/stories:**
- Create story with:
  - Title
  - Description
  - Audio URL from upload
  - Tags
- Get back full story object

**Test GET /api/stories/space/{your_space_id}:**
- Should return list of stories

---

## 📝 NOTES

- Stories are stored as Posts with type="voice"
- Uses same Post table as Memories
- Audio files stored in separate folder
- Tags stored in PostTag table
- Soft delete (is_active = False)

---

## 🔜 FRONTEND FEATURES

Next we'll build:
- Voice recorder (record in browser)
- Audio upload
- Story cards with audio player
- Story creation form
- Timeline of stories

---

**BACKEND IS READY! Next: Frontend UI with voice recorder!** 🎙️🔥