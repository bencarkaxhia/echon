# Echon — The Private Digital Home for Families

**A self-hostable platform where families preserve memories, tell stories, and stay connected across generations — privately, and without surveillance.**

No algorithms. No ads. No data mining. No social media noise.  
Just your family.

---

## Why Echon Exists

Modern communication platforms were not built for families — they fragment them.

Photos get lost in WhatsApp threads. Stories disappear with the people who lived them. Generations drift apart. And all of it runs on infrastructure owned by companies whose interests are not yours.

Echon exists to solve that.

**A family should have a place that belongs only to them** — a living archive of their identity, their history, and their present — running on infrastructure they control.

---

## The Four Doors

At the heart of Echon is a 3D spatial interface: your **family emblem** surrounded by four symbolic entry points.

| Door | What's inside |
|------|--------------|
| 📸 **Memories** | Photos, videos, documents — your family's visual archive |
| 🎙️ **Stories** | Voice recordings and oral histories — the irreplaceable ones |
| 👥 **Family** | Interactive tree, member profiles, relationships across generations |
| 🔔 **Now** | Real-time chat, activity feed, who's home right now |

This structure is designed to be intuitive, emotional, and timeless — working equally well for a tech-savvy founder and an 80-year-old grandparent.

---

## Current Status

> **Alpha — working for real families, not yet polished for self-hosters**
>
> First family: **The Çarkaxhia Space** 🇦🇱 (live at [echon.app](https://echon.app))

| Capability | Status |
|-----------|--------|
| Auth (register, login, JWT, profile photo) | ✅ |
| Family spaces — create, invite, join | ✅ |
| Magic-link invitations (`/join/:token`) | ✅ |
| Approval workflow (founder approves members) | ✅ |
| Entrance sequence + door navigation | ✅ |
| Real-time chat (WebSocket) | ✅ |
| Presence — "home now" avatars | ✅ |
| Memories — photo/video/doc upload + timeline | ✅ |
| Stories — voice recording + playback | ✅ |
| Family tree — card grid + interactive graph (dagre) | ✅ |
| Reactions (❤️ 🕯️ 🙏) and comments | ✅ |
| Activity feed with date grouping | ✅ |
| Notifications | ✅ |
| Birthday reminders in Now feed | ✅ |
| Member profiles with search + pagination | ✅ |
| Space settings (identity, members, pending approvals) | ✅ |
| PWA — installable on Android/iOS via browser | ✅ |
| VPS deployment (Nginx + Docker) | ✅ |
| Alembic migrations | ⚠️ Not set up (`create_all` used) |
| Test coverage | ⚠️ 0% — needs work |

---

## Tech Stack

**Backend:** Python 3.12 · FastAPI · SQLAlchemy (sync) · PostgreSQL · Redis · JWT (python-jose) · argon2

**Frontend:** React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · ReactFlow · Three.js

**Infrastructure:** Docker Compose · Nginx · Cloudflare R2 (file storage, optional — falls back to local) · SendGrid (email, optional)

---

## Quick Start — Local Development

### Prerequisites
- Python 3.11+, Node.js 18+, Docker & Docker Compose

### 1. Clone and configure

```bash
git clone https://github.com/bencarkaxhia/echon.git
cd echon
```

```bash
# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env — at minimum set a real SECRET_KEY:
# openssl rand -hex 32
```

```bash
# Frontend environment
echo "VITE_API_URL=http://localhost:8001" > frontend/.env
```

### 2. Start infrastructure (Postgres + Redis)

```bash
docker-compose up -d
# PostgreSQL → localhost:55432
# Redis → localhost:65379
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

### 1. Clone and configure

```bash
git clone https://github.com/bencarkaxhia/echon.git ~/echon
cd ~/echon
cp backend/.env.example backend/.env
# Set: SECRET_KEY, DATABASE_URL, REDIS_URL
# Optional: CLOUDFLARE_R2_* for file storage, SENDGRID_API_KEY for email
```

### 2. Build and start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 3. Nginx — WebSocket proxying

WebSocket location blocks **must appear before** the generic `/api/` block:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    client_max_body_size 50m;

    location / {
        root /path/to/echon/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # WebSocket — presence (before /api/)
    location /api/presence/ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400s;
    }

    # WebSocket — chat (before /api/)
    location /api/chat/ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400s;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. Build frontend for production

```bash
cd frontend
VITE_API_URL=https://yourdomain.com npm run build
# Sync dist/ to your server via rsync (not rm+cp — breaks Docker bind mount)
rsync -av --delete dist/ user@yourserver:/path/to/echon/frontend/dist/
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | **Yes** | JWT signing key — `openssl rand -hex 32` |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string |
| `REDIS_URL` | **Yes** | Redis connection string |
| `CLOUDFLARE_R2_ACCOUNT_ID` | No | R2 storage (falls back to local `/uploads/`) |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | No | |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | No | |
| `CLOUDFLARE_R2_BUCKET_NAME` | No | |
| `SENDGRID_API_KEY` | No | Email for invitations and password reset |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | **Yes** | Backend base URL — must be set at **build time** |

> ⚠️ `VITE_API_URL` is baked into the production bundle. Always build with the correct URL.

---

## Contributing

Echon is open-source and welcomes contributors. Here's what's most needed right now:

### Good first issues
- Replace `alert()` calls with inline UI feedback (~8 remaining across components)
- Add loading skeletons to the memory feed and family tree
- Write backend API tests (currently 0% — target 80%)
- Set up Alembic migrations (replace `Base.metadata.create_all`)
- Add image compression before upload (max 2 MB stored)

### Architecture to understand before diving in

**Invitation flow:** Founder creates space → generates magic link (`/join/:token`) → invitee registers via that page → auto-approved if founder sent it, pending approval otherwise

**WebSocket auth:** JWT passed as `?token=` query param (browsers can't set Authorization headers on WS connections)

**File storage:** `StorageService` in `backend/app/core/storage.py` — R2 if env vars are set, otherwise local `/uploads/` served via `/api/media/`

**Family tree:** `FamilyTreeGraph.tsx` uses dagre for auto-layout. ReactFlow custom nodes **must** have `<Handle>` components or edges won't render. Edges are deduplicated by sorted pair key.

**Voice stories:** Stored as `Post` records with `type="voice"` and `file_url` pointing to the audio. They appear in the Memories feed with a distinct amber voice-story card UI.

### Running tests

```bash
cd backend
source venv/bin/activate
pytest
pytest --cov=app --cov-report=term-missing
```

### Code conventions

- Backend: FastAPI patterns, SQLAlchemy sync sessions, Pydantic v2 schemas
- Frontend: TypeScript strict, React functional components, Tailwind utility classes
- No `alert()` in new code — use inline state-driven feedback
- No hardcoded API URLs — always use `VITE_API_URL`

---

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full phase plan.

---

## Principles

Echon is built on non-negotiable commitments:

- **Privacy-first** — no tracking, no analytics that phone home, no third-party scripts
- **Family-owned data** — runs on infrastructure you control
- **Open source** — transparent, forkable, community-driven
- **Human-first design** — built for grandparents and children, not power users
- **Long-term thinking** — built for decades, not engagement metrics

---

> *"First stone. Let's build something that matters."*
>
> Built with love. The first family: **The Çarkaxhia Space** 🇦🇱

---

## License

MIT — see [LICENSE](LICENSE)
