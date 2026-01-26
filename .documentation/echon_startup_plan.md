# Backend Setup

# Create project folder
mkdir echon
cd echon

# Backend folder
mkdir backend
cd backend

# Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install core packages
pip install fastapi uvicorn sqlalchemy psycopg2-binary alembic python-jose passlib bcrypt python-multipart boto3 twilio redis

# Create requirements.txt
pip freeze > requirements.txt

# Project structure
mkdir -p app/{api,models,schemas,services,core}
touch app/__init__.py
touch app/main.py
touch app/api/__init__.py
touch app/models/__init__.py
touch app/schemas/__init__.py
touch app/services/__init__.py
touch app/core/{config.py,security.py,database.py}

# Docker Setup

version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: echon
      POSTGRES_PASSWORD: echon_dev_password
      POSTGRES_DB: echon_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:

# Frontend Setup

# Go back to root
cd ..

# Create Vite React app with TypeScript
npm create vite@latest frontend -- --template react-ts

cd frontend

# Install dependencies
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install UI libraries
npm install @tanstack/react-query axios zustand
npm install framer-motion
npm install three @react-three/fiber @react-three/drei  # For 3D sphere/doors
npm install react-router-dom

# Dev server
npm run dev
```

---

## 🎯 WHAT WE BUILD FIRST (MVP Sprint 1)

### **Week 1: Core Authentication + Database**

**Backend:**
- [ ] Database schema (family_spaces, members, invitations tables)
- [ ] User registration/login API
- [ ] JWT authentication
- [ ] Create family space endpoint

**Frontend:**
- [ ] Tailwind config (your color palette)
- [ ] Basic routing (login, onboarding, space home)
- [ ] Login/signup forms
- [ ] Family space creation form

**Goal:** You can create the Çarkaxhia Space and log in

---

### **Week 2: The 3D Entrance (The Doors)**

**Frontend:**
- [ ] Three.js setup
- [ ] Central sphere (rotating family emblem)
- [ ] 4 doors positioned around sphere
- [ ] Door hover effects (glow, open slightly)
- [ ] Click door → route to that section
- [ ] Mobile fallback (if 3D doesn't work, show 4 buttons)

**Backend:**
- [ ] Upload family emblem/logo endpoint
- [ ] Serve emblem for sphere texture

**Goal:** Users see the beautiful entrance and click doors

---

### **Week 3: Memory Vault (Door 1 — Photos)**

**Backend:**
- [ ] S3/R2 file upload endpoint
- [ ] Posts table CRUD (create, read, update, delete)
- [ ] Image processing (thumbnails)

**Frontend:**
- [ ] Upload photo modal
- [ ] Display photos in timeline
- [ ] Photo detail view (full size, comments)
- [ ] Privacy selector (who can see)

**Goal:** You upload first family photo to Çarkaxhia Space

---

### **Week 4: Invitation System + Elder Mode**

**Backend:**
- [ ] Create invitation endpoint (send SMS via Twilio)
- [ ] Accept invitation endpoint (token validation)

**Frontend:**
- [ ] Invite member modal
- [ ] Invitation link page (what Masar sees)
- [ ] Simplified mode toggle (elder-friendly UI)
- [ ] Voice recorder component (Web Audio API)

**Goal:** You invite Masar, he joins, uploads first voice memo

---

## 🎨 THE ENTRANCE DESIGN — Let's Nail This

Once you upload your PNG, I'll:

1. **Analyze your visual concept**
2. **Create Three.js code** for the sphere + doors
3. **Design the color scheme** for each door
4. **Animate the transitions** (door opens → content fades in)

**My guess at what you're imagining:**
```
        ┌─────────────────────────────┐
        │                             │
        │     🚪 DOOR 1 (Memories)    │
        │                             │
        │         ┌───────┐           │
        │  🚪 ←──│  🌐  │──→ 🚪      │
        │  DOOR 4 │SPHERE│   DOOR 2   │
        │         └───────┘           │
        │                             │
        │     🚪 DOOR 3 (Family)      │
        │                             │
        └─────────────────────────────┘