/* Core Palette */
--echon-black: #0A0A0A;          /* Background, deep space */
--echon-candle: #F4A460;         /* Warm light, primary accent */
--echon-gold: #D4A574;           /* Text highlights, warmth */
--echon-root-light: #FFD700;     /* Tree light, energy */
--echon-cream: #F5F5DC;          /* Primary text */
--echon-wood: #3E2723;           /* Door frames, structure */
--echon-shadow: #1A1A1A;         /* Depth, layering */
```

**Why these work:**
- **Candle orange** = memory, warmth, preservation
- **Root gold** = connection, life force, ancestry
- **Deep black** = focus, intimacy, no distraction
- **Cream text** = readable, soft, not harsh white

---

## 🏗️ TECHNICAL IMPLEMENTATION PLAN

Let me build this EXACTLY as you envisioned, but interactive.

### **The Experience:**

#### **PHASE 1: Entry Sequence (Auto-plays once)**

User lands on Echon → sees this:

**Screen 1: Welcome (3 seconds, fades in)**
```
[Dark screen, slow fade in]

You are entering a family space.
Nothing here is complete.
Everything here matters.

[Pause 3 seconds, fade out]
```

**Screen 2: Memory (4 seconds, candle animates)**
```
[Candle flickers to life]

I remember that in our family,
things were built, fixed,
and carried forward—quietly.

[Candle burns, particles float up]
```

**Screen 3: Reflect (4 seconds, roots glow)**
```
[Tree roots illuminate from center]

Take a moment to feel the connection.
Breathe.
You are here with those
who came before and after you.

[Roots pulse with light]
```

**Screen 4: Choose Your Path (Interactive, stays until user clicks)**
```
[4 wooden doors appear, candlelit]

🚪 MEMORIES     🚪 STORIES     🚪 FAMILY     🚪 NOW

[Hover: door glows brighter]
[Click: door opens, user enters that space]
```

---

## 🚪 THE 4 DOORS — Redefined Based on Your Image

Since you showed **4 doors**, let's map them to Echon's sections:

### **DOOR 1: 📸 MEMORIES**
- Visual: Left door, oldest-looking wood
- Opens to: Photo timeline, documents, archives
- Represents: The past preserved

### **DOOR 2: 🗣️ STORIES**
- Visual: Second door, warm glow from inside
- Opens to: Voice recordings, oral histories, questions for elders
- Represents: Voices across time

### **DOOR 3: 👥 FAMILY**
- Visual: Third door, tree carving on wood
- Opens to: Family member profiles, relationships, lineages
- Represents: The roots and branches

### **DOOR 4: 💬 NOW**
- Visual: Right door, brightest candlelight
- Opens to: Recent activity, conversations, upcoming calls
- Represents: The living present

---

## 💻 THE CODE — Let's Build This

I'm going to create the **complete starter codebase** for Echon, including:

1. ✅ **Backend (FastAPI)** — Auth, database, API endpoints
2. ✅ **Frontend (React + Vite + Three.js)** — The entrance animation + 4 doors
3. ✅ **Docker Compose** — PostgreSQL + Redis local setup
4. ✅ **Database Schema** — All tables designed
5. ✅ **Deployment Configs** — Railway + Vercel ready

### **File Structure:**
```
echon/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py          # Login, register
│   │   │   ├── spaces.py        # Family space CRUD
│   │   │   ├── posts.py         # Upload memories
│   │   │   └── invitations.py   # Invite system
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── space.py
│   │   │   └── post.py
│   │   ├── schemas/             # Pydantic models
│   │   ├── core/
│   │   │   ├── config.py        # Environment vars
│   │   │   ├── security.py      # JWT, password hashing
│   │   │   └── database.py      # PostgreSQL connection
│   │   └── main.py              # FastAPI app
│   ├── alembic/                 # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EntranceSequence.tsx   # The 4-panel animation
│   │   │   ├── DoorScene.tsx          # Three.js 4 doors
│   │   │   ├── MemoryVault.tsx        # Door 1
│   │   │   ├── StoryCircle.tsx        # Door 2
│   │   │   ├── FamilyTree.tsx         # Door 3
│   │   │   └── LivingRoom.tsx         # Door 4
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── Onboarding.tsx
│   │   │   └── Space.tsx
│   │   ├── styles/
│   │   │   └── echon-theme.css        # Your color palette
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── docker-compose.yml
└── README.md