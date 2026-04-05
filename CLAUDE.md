# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What This Is

**Echon** is a family memory / presence application. The concept revolves around a 3D spatial interface where family members ("persons") exist in shared "family spaces" accessed through "doors", with "memories" attached to those spaces. A WebSocket presence layer tracks who is currently connected.

The project is early-stage — most API routes are stubs and the AI layer (`historian.py`, `whisper.py`) is empty.

---

## Running the Stack

### Infrastructure (Postgres + Redis)
```bash
docker-compose up -d
# Postgres on localhost:5433, Redis on localhost:6382
```

### Backend (FastAPI)
```bash
cd backend
source venv/bin/activate          # or: source ../venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Frontend (React + Vite)
```bash
cd frontend
npm run dev                        # dev server at http://localhost:5173
npm run build
npm run preview
```

---

## Testing

```bash
# Backend
cd backend
source venv/bin/activate
pytest                             # run all tests
pytest tests/path/to/test_file.py  # single file
pytest -k "test_name"              # single test by name
pytest --cov=app --cov-report=term-missing
```

No frontend test runner is configured yet.

---

## Architecture

### Backend (`backend/app/`)

- **`main.py`** — FastAPI entry point; mounts routers and the WebSocket endpoint
- **`api/`** — Route handlers: `users`, `families`, `memories`, `doors`. Most are currently placeholder stubs; `doors.py` is the most complete (queries DB via SQLAlchemy)
- **`models/`** — SQLAlchemy ORM models: `User`, `FamilySpace`, `Door`, `Memory`, `Person`
- **`db/session.py`** — DB engine + `get_db()` dependency; hardcoded to `postgresql://echon:echon@localhost:5433/echon`
- **`ws/presence.py`** — `PresenceManager` singleton that tracks active WebSocket connections and broadcasts messages
- **`ai/`** — Placeholder files (`historian.py`, `whisper.py`) intended for Anthropic/AI integration (the `anthropic` SDK is already in `requirements.txt`)
- **`utils/`** — `security.py` and `storage.py` (both currently empty stubs)

### Frontend (`frontend/src/`)

- **`App.jsx`** — Mounts `MemoryAnchor` and calls `usePresence("Arben")` to open a WebSocket connection
- **`components/MemoryAnchor.jsx`** — The main visual: a full-screen Three.js/R3F canvas with an animated memory orb (core sphere + particle fragments + aura)
- **`hooks/usePresence.js`** — Opens `ws://localhost:8000/ws/presence` and sends the user's name on connect
- **`pages/`** — `Entry.jsx` and `MemoryRoom.jsx` (routing not yet wired in `App.jsx`)

### Key relationships
- `FamilySpace` → has many `Door`s and `Memory`s
- `Door` → belongs to a `FamilySpace`, has a `position` (integer, likely ordering)
- `Person` and `User` are separate models (persons represent family members, users are auth accounts)
- The WebSocket route in `main.py` is `/ws/presence/{user_name}` but `usePresence.js` connects to `/ws/presence` (mismatch to fix)

### Infrastructure
- Docker Compose provides Postgres 16 (port 5433) and Redis 7 (port 6382)
- `backend/Dockerfile` runs uvicorn with `--reload` (dev mode only — change for production)
- DB credentials are hardcoded in `db/session.py`; no `.env` handling is wired yet despite `python-dotenv` being installed

---

## Known Gaps / Active TODOs

- `ai/historian.py` and `ai/whisper.py` are empty — intended for Anthropic SDK usage
- `utils/security.py` and `utils/storage.py` are empty stubs
- `api/users.py`, `api/families.py`, `api/memories.py` return placeholder strings — no real DB queries
- No Alembic migrations set up yet (alembic is in requirements.txt)
- No auth middleware wired (passlib, python-jose, argon2 are installed but unused)
- `main.py` registers `doors.router` twice under two different prefixes (`/api/doors` and `/api`) — likely a bug
- Frontend routing (`react-router-dom`) is imported but `pages/` are not yet connected in `App.jsx`
