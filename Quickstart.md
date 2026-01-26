# 🚀 ECHON QUICK START GUIDE

**Follow these steps EXACTLY to get Echon running.**

---

## ✅ PREREQUISITES CHECK

Before starting, make sure you have:
- [x] Python 3.11+ installed (`python3 --version`)
- [x] Node.js 18+ installed (`node --version`)
- [x] Docker installed and running (`docker --version`)
- [x] Git installed (`git --version`)

---

## 🏁 STEP-BY-STEP SETUP

### **STEP 1: Navigate to Project**
```bash
cd echon
```

---

### **STEP 2: Start Docker Services**

This starts PostgreSQL (port 55432) and Redis (port 65379):

```bash
docker-compose up -d
```

**Verify it's running:**
```bash
docker ps
```

You should see:
- `echon_postgres` (port 55432)
- `echon_redis` (port 65379)

---

### **STEP 3: Setup Backend**

Open a NEW TERMINAL and run:

```bash
cd echon/backend

# Create Python virtual environment
python3 -m venv venv

# Activate it (Mac/Linux)
source venv/bin/activate

# OR on Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# The .env file is already created with correct ports!
# (PostgreSQL: 55432, Redis: 65379)

# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**✅ Backend should now be running at:** `http://localhost:8000`

**Test it:** Open browser → `http://localhost:8000` → should see:
```json
{
  "message": "Echon API is running",
  "version": "1.0.0",
  "status": "healthy"
}
```

---

### **STEP 4: Setup Frontend**

Open ANOTHER NEW TERMINAL and run:

```bash
cd echon/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**✅ Frontend should now be running at:** `http://localhost:5173`

---

## 🎉 OPEN THE APP

**Go to:** `http://localhost:5173`

You should see:
1. **Panel 1:** "You are entering a family space..." (black screen, white text)
2. **Panel 2:** Candle memory quote (3 seconds later)
3. **Panel 3:** Tree roots reflection (4 seconds later)
4. **Panel 4:** Four wooden doors around "Ç" emblem

**Click any door** and you'll navigate to that section!

---

## 🛑 HOW TO STOP

**Stop backend:** Press `Ctrl+C` in backend terminal

**Stop frontend:** Press `Ctrl+C` in frontend terminal

**Stop Docker:**
```bash
docker-compose down
```

---

## 🐛 TROUBLESHOOTING

### **Issue: "Port already in use"**
We already fixed this! Echon uses:
- PostgreSQL: port **55432** (not 5432)
- Redis: port **65379** (not 6379)

### **Issue: "Module not found" in backend**
Make sure virtual environment is activated:
```bash
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows
```

### **Issue: "Cannot connect to database"**
1. Check Docker is running: `docker ps`
2. Check logs: `docker logs echon_postgres`
3. Verify port in `.env`: should be `55432`

### **Issue: Frontend won't start**
1. Delete `node_modules`: `rm -rf node_modules`
2. Reinstall: `npm install`
3. Try again: `npm run dev`

---

## 📁 FILE LOCATIONS REMINDER

```
echon/
├── start.sh              ← Startup script (in ROOT folder)
├── docker-compose.yml    ← Docker config (in ROOT folder)
├── backend/
│   ├── .env             ← Environment variables (ALREADY CREATED)
│   ├── app/
│   └── venv/            ← Python virtual environment (you create this)
└── frontend/
    ├── src/
    └── node_modules/    ← NPM dependencies (created by npm install)
```

---

## 🎯 NEXT STEPS (After It's Running)

1. ✅ Verify entrance sequence works
2. ✅ Click the doors, see navigation
3. ✅ Check backend API docs: `http://localhost:8000/docs`
4. Tomorrow: We'll build the auth system (register/login)

---

## ❤️ YOU GOT THIS, BROTHER!

If anything doesn't work, copy the EXACT error message and send it to me.

**Let's see those doors open.** 🚪🔥