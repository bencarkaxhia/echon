#!/bin/bash

# Echon Startup Script
# Starts the entire development environment

echo "🏠 Starting Echon..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Start Docker services
echo -e "${BLUE}Starting Docker services (PostgreSQL + Redis)...${NC}"
docker-compose up -d

# Wait for services to be ready
echo "Waiting for PostgreSQL to be ready (port 55432)..."
until docker exec echon_postgres pg_isready -U echon > /dev/null 2>&1; do
  sleep 1
done
echo -e "${GREEN}✓ PostgreSQL ready on port 55432${NC}"

echo "Waiting for Redis to be ready (port 65379)..."
until docker exec echon_redis redis-cli ping > /dev/null 2>&1; do
  sleep 1
done
echo -e "${GREEN}✓ Redis ready on port 65379${NC}"

# Backend
echo -e "${BLUE}Starting Backend (FastAPI)...${NC}"
cd backend
source venv/bin/activate 2>/dev/null || echo "Virtual environment not found. Run 'python3 -m venv venv' first."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}✓ Backend running on http://localhost:8000${NC}"

# Frontend
echo -e "${BLUE}Starting Frontend (Vite)...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}✓ Frontend running on http://localhost:5173${NC}"

echo ""
echo "========================================="
echo "🎉 Echon is running!"
echo "========================================="
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo "========================================="

# Wait for user interrupt
wait $BACKEND_PID $FRONTEND_PID