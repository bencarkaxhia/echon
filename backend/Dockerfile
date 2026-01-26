# Dockerfile for Railway deployment
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Railway will override this with $PORT)
EXPOSE 8000

# Start command (Railway will use railway.json command instead)
# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]        # not working with Railway
# CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}                  # alternative not working with Railway  

# Copy startup script
COPY start.sh .
RUN chmod +x start.sh

# Use script as CMD
CMD ["./start.sh"]