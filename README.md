# Echon — Family Space

**A private, self-hostable platform for families to share memories, tell stories, and stay present across generations and distance.**

No algorithms. No ads. No tracking. Just your family.

---

## What is Echon?

Echon gives your family a private digital home — a space where you can:

- **Share memories** — photos, documents, voice recordings
- **Tell stories** — oral history matters as much as documents
- **Stay present** — see who's "home" right now, chat in a shared family room
- **Map relationships** — an interactive family tree with auto-layout for 200+ members
- **Invite with care** — founder creates a space, members join by invitation code only

It is not a social network. It is a sanctuary.

---

## Current Status

> **Alpha — working for real families, not yet polished for self-hosters**

| Area | Status |
|------|--------|
| Auth (register, login, JWT, profile photo) | ✅ Working |
| Family spaces (create, invite, join flow) | ✅ Working |
| Entrance sequence + door navigation | ✅ Working |
| Chat (real-time WebSocket) | ✅ Working |
| Presence ("home now" avatars) | ✅ Working |
| Memories (photo/doc upload + feed) | ✅ Working |
| Stories (voice recording + playback) | ✅ Working |
| Family tree — Card View | ✅ Working |
| Family tree — Graph View (dagre auto-layout) | ✅ Working |
| Notifications | ✅ Working |
| Activity feed | ✅ Working |
| PWA (installable on Android via Chrome) | ✅ Working |
| Alembic migrations | ⚠️ Not set up (schema via `create_all`) |
| Test coverage | ⚠️ 0% — needs work |
| Elder simplified mode | 🔲 Planned |

---

## Tech Stack

**Backend:** Python 3.12 · FastAPI · SQLAlchemy (sync) · PostgreSQL · Redis · JWT

**Frontend:** React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · ReactFlow · Three.js

**Infrastructure:** Docker (local dev) · Nginx (VPS) · Cloudflare R2 (file storage, optional) · Railway/Render (managed hosting option)

---

## Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose

### 1. Clone and configure

```bash
git clone https://github.com/YOUR_USERNAME/echon.git
cd echon
```

```bash
# Backend env
cp backend/.env.example backend/.env
# Edit backend/.env — at minimum set a real SECRET_KEY
```

```bash
# Frontend env
echo "VITE_API_URL=http://localhost:8001" > frontend/.env
```

### 2. Start infrastructure

```bash
docker-compose up -d
# PostgreSQL on localhost:55432, Redis on localhost:65379
```

### 3. Start backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

API docs: http://localhost:8001/docs

### 4. Start frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

---

## Self-Hosting on a VPS

Tested on Ubuntu 22.04 with Nginx + Docker.

### 1. Clone on your server

```bash
git clone https://github.com/YOUR_USERNAME/echon.git ~/echon
cd ~/echon
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
# Set: SECRET_KEY, DATABASE_URL, REDIS_URL, CLOUDFLARE_R2_* (or leave storage as local)
```

### 3. Start with Docker Compose

```bash
docker-compose -f docker-compose.yml up -d
```

### 4. Nginx config

Point your domain to the server and configure Nginx:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    # Frontend (built static files or Vite proxy)
    location / {
        proxy_pass http://127.0.0.1:5173;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket — presence (must be before generic /api/ block)
    location /api/presence/ws/ {
        proxy_pass http://127.0.0.1:8001/api/presence/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # WebSocket — chat
    location /api/chat/ws/ {
        proxy_pass http://127.0.0.1:8001/api/chat/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
    }
}
```

**Note:** WebSocket location blocks must appear **before** generic `/api/` blocks in Nginx.

### 5. Set up automated database backups

```bash
# Copy backup script to server
cp scripts/vps_backup.sh ~/echon/scripts/
chmod +x ~/echon/scripts/vps_backup.sh

# Add daily cron at 3 AM
crontab -e
# Add: 0 3 * * * /bin/bash ~/echon/scripts/vps_backup.sh >> ~/echon/logs/backup.log 2>&1
```

To pull the latest backup to your local machine:
```bash
VPS_HOST=yourdomain.com ./scripts/pull_vps_backup.sh
# Saves to ./backup/ (gitignored)
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | **Yes** | JWT signing key — generate with `openssl rand -hex 32` |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string |
| `REDIS_URL` | **Yes** | Redis connection string |
| `CLOUDFLARE_R2_ACCOUNT_ID` | No | R2 storage (falls back to `/tmp/echon_uploads`) |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | No | R2 credentials |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | No | R2 credentials |
| `CLOUDFLARE_R2_BUCKET_NAME` | No | R2 bucket name |
| `SENDGRID_API_KEY` | No | Email invitations |
| `TWILIO_*` | No | SMS invitations |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | **Yes** | Backend base URL, e.g. `https://api.yourdomain.com` |

---

## Contributing

Echon is open-source and welcomes contributors. Here's what's most needed:

### Good first issues
- Replace `alert()` calls with inline UI feedback (there are ~10 across components)
- Add loading skeletons to the memory feed and family tree
- Write backend API tests (currently 0% coverage — target 80%)
- Add Alembic migration setup (replace `Base.metadata.create_all`)

### Architecture to know before diving in

**How the invitation flow works:**
Founder creates a space → generates invite code → sends link → new user hits `/register?join=1` → enters code → gets added to space

**How WebSocket auth works:**
JWT is passed as `?token=` query param (browsers can't send Authorization headers on WS connections)

**How file storage works:**
`StorageService` in `backend/app/core/storage.py` — if R2 env vars are set, uploads go to Cloudflare R2; otherwise files go to `/tmp/echon_uploads` and are served via `/api/media/`

**How the family tree works:**
`FamilyTreeGraph.tsx` uses dagre for hierarchical auto-layout. All members are nodes; edges are deduplicated by sorted pair key (one edge per pair, highest specificity relationship type wins). ReactFlow custom nodes **must** have `<Handle>` components or edges won't render.

### Running tests

```bash
cd backend
source venv/bin/activate
pytest
pytest --cov=app --cov-report=term-missing
```

### Code style

Backend: Python, FastAPI patterns, SQLAlchemy sync sessions, Pydantic v2 schemas  
Frontend: TypeScript strict, React functional components, Tailwind utility classes, no `alert()` in new code

---

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full milestone plan.

**Short version:**
- **v0.1** (now) — Core working for one real family, self-hostable with effort
- **v0.2** — Polish, test coverage, Alembic, media handling improvements
- **v0.3** — Timeline view, decade browsing, reactions
- **v0.4** — Elder simplified mode, accessibility pass
- **v0.5** — Multi-family support, granular privacy controls
- **v1.0** — Public release, one-click deploy, full docs

---

## Philosophy

> *"First stone. Let's build something that matters."*

Echon exists because family memory is fragile, scattered across WhatsApp threads and hard drives that will eventually fail. It belongs together, in one place, owned by the family.

The project is committed to:
- **No tracking** — zero analytics, no third-party scripts that phone home
- **Data ownership** — your data stays on infrastructure you control
- **Free forever** — open-source, self-hostable, no subscription required
- **Human-first** — designed for grandparents and children, not power users

---

## License

MIT License — see [LICENSE](LICENSE)

---

**Built with love. The first family: The Çarkaxhia Space. 🇦🇱**
