#!/bin/bash
PORT=${PORT:-8000}
echo "🚀 Starting on port $PORT"
exec uvicorn app.main:app --host 0.0.0.0        #--port $PORT