# 🏠 ECHON — Your Family Space

**A private platform for families to share memories, stories, and stay connected across generations and distance.**

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (via Docker)
- Redis (via Docker)

---

## 📦 Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd echon
```

### 2. Start Docker Services (PostgreSQL + Redis)
```bash
docker-compose up -d
```

Verify services are running:
```bash
docker ps
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your values (SECRET_KEY, etc.)

# Run database migrations (will create tables)
# alembic upgrade head  # (We'll set this up next)

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: **http://localhost:8000**
API docs: **http://localhost:8000/docs**

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🏗️ Project Structure

```
echon/
├── backend/              # Python FastAPI backend
│   ├── app/
│   │   ├── api/         # API routes
│   │   ├── models/      # Database models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── core/        # Config, security, database
│   │   └── main.py      # FastAPI app
│   └── requirements.txt
│
├── frontend/            # React + Vite frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   └── App.tsx      # Main app
│   └── package.json
│
└── docker-compose.yml   # PostgreSQL + Redis
```

---

## 🎨 Design Philosophy

**Echon is not a social network. It's a sanctuary.**

- **Privacy First**: Each family space is completely isolated
- **Elder-Friendly**: Simplified interfaces for older generations
- **Story-Focused**: Oral history matters as much as documents
- **Respect**: No algorithms, no exploitation, no ads

---

## 🔑 Key Features (MVP)

- [x] Family space creation
- [x] Invitation system (email/SMS)
- [x] Beautiful entrance sequence (4-panel emotional journey)
- [x] Interactive 4-door navigation
- [ ] Photo/video upload
- [ ] Voice recording
- [ ] Timeline view (memories by decade)
- [ ] Comments & reactions
- [ ] Privacy controls
- [ ] Elder simplified mode

---

## 🧪 Development

### Run tests
```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

### Database migrations
```bash
cd backend
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

---

## 🚢 Deployment

### Backend (Railway / Render)
- Push to GitHub
- Connect repo to Railway/Render
- Set environment variables
- Deploy

### Frontend (Vercel)
- Push to GitHub
- Connect repo to Vercel
- Deploy

---

## 🛠️ Tech Stack

**Backend:**
- FastAPI (Python)
- PostgreSQL
- Redis
- SQLAlchemy
- JWT Authentication

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion (animations)
- Three.js (3D entrance, optional)

**Infrastructure:**
- Docker (local dev)
- Railway/Render (backend hosting)
- Vercel (frontend hosting)
- AWS S3 / Cloudflare R2 (file storage)

---

## 📝 License

Private project. All rights reserved.

---

## ❤️ About

Built with love for families who want to stay connected.

**First family: The Çarkaxhia Space** 🇦🇱

---

## 🤝 Contributing

This is a private family project. Contact the maintainers for access.

---

**The first stone. Let's build something that matters.**