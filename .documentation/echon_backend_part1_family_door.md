# 📁 ECHON - FAMILY DOOR (Backend Part 1)

Backend API for family members and profiles.

---

## 🆕 NEW FILES CREATED

### Schemas

1. **echon/backend/app/schemas/family.py**
   - MemberUpdate (update profile request)
   - MemberProfile (full member details)
   - MemberBrief (brief member info)
   - MemberListResponse (list of members)

### API Endpoints

2. **echon/backend/app/api/family.py**
   - GET /api/family/space/{space_id} - Get all members
   - GET /api/family/{member_id}?space_id=X - Get member profile
   - PATCH /api/family/{member_id}?space_id=X - Update profile

### Updated Files

3. **echon/backend/app/schemas/__init__.py** - Export family schemas
4. **echon/backend/app/main.py** - Register family router

---

## 📂 API ENDPOINTS

### Get All Members in Space
```
GET /api/family/space/{space_id}

Response:
{
  "members": [
    {
      "id": "uuid",
      "name": "Beni Çarkaxhia",
      "profile_photo_url": null,
      "birth_year": 1985,
      "birth_location": "Shkodra, Albania",
      "role": "founder",
      "generation": "middle",
      "lineage": "both",
      "relationship_to_founder": null,
      "joined_at": "2026-01-26...",
      "post_count": 5,
      "comment_count": 12
    }
  ],
  "total": 3,
  "founders": 1,
  "elders": 1,
  "members": 1
}
```

### Get Member Profile
```
GET /api/family/{member_id}?space_id={space_id}

Response: Single MemberProfile object
```

### Update Member Profile
```
PATCH /api/family/{member_id}?space_id={space_id}

Body:
{
  "name": "Updated Name",
  "birth_year": 1985,
  "birth_location": "Shkodra",
  "generation": "middle",
  "lineage": "paternal",
  "relationship_to_founder": "Son"
}

All fields optional - only send what you want to update
```

---

## 🔐 PERMISSIONS

- **View Members:** Any member of the space
- **Update Own Profile:** Any member
- **Update Other Profiles:** Only founders

---

## 📊 MEMBER DATA

### User Fields (from users table):
- name
- email
- phone
- birth_year
- birth_location
- profile_photo_url

### Membership Fields (from space_members table):
- role: "founder", "elder", "member", "guest"
- generation: "elder", "middle", "younger"
- lineage: "paternal", "maternal", "both"
- relationship_to_founder: "Father", "Mother", "Son", etc.

### Computed Stats:
- post_count: Number of memories posted
- comment_count: Number of comments made

---

## 🚀 TESTING

### 1. Restart Backend
```bash
cd echon/backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### 2. Test in API Docs
Go to: http://localhost:8000/docs

**Test GET /api/family/space/{your_space_id}**
- Should return list of members (currently just you)

---

## 📝 NOTES

- Database already has all tables (users, space_members)
- SpaceMember tracks role, generation, lineage
- Stats are computed on-the-fly (not stored)
- Founders can edit any member's profile
- Members can only edit their own profile

---

**NEXT: Frontend UI to display member grid and profiles!** 🔥