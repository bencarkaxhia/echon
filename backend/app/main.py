"""
Echon API
Main FastAPI application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from .core.config import settings
from .core.database import engine, Base

# Create all database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    debug=settings.DEBUG
)

# CORS middleware (allow frontend to call API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Expose all headers
    max_age=3600,  # Cache preflight requests for 1 hour
)


@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "message": "Echon API is running",
        "version": settings.VERSION,
        "status": "healthy"
    }


@app.get("/health")
def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "timestamp": "2025-01-26"
    }


# Import and include API routers (direct imports to avoid circular dependency)
from .api.auth import router as auth_router
from .api.spaces import router as spaces_router
from .api.posts import router as posts_router
from .api.family import router as family_router
from .api.stories import router as stories_router
from .api.activity import router as activity_router

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(spaces_router, prefix="/api/spaces", tags=["spaces"])
app.include_router(posts_router, prefix="/api/posts", tags=["posts"])
app.include_router(family_router, prefix="/api/family", tags=["family"])
app.include_router(stories_router, prefix="/api/stories", tags=["stories"])
app.include_router(activity_router, prefix="/api/activity", tags=["activity"])

# Serve uploaded files
UPLOAD_DIR = Path("/tmp/echon_uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")