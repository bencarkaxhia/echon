"""
Echon Backend Configuration
Environment variables and app settings
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # App Info
    APP_NAME: str = "Echon API"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Security
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database — set via .env (local or Railway)
    DATABASE_URL: str = "postgresql://echon:echon_dev_password@localhost:55432/echon_db"

    # Redis — set via .env (local or Railway)
    REDIS_URL: str = "redis://localhost:65379/0"
    
    # CORS (Frontend URLs)
    CORS_ORIGINS: list = [
        "http://localhost:5173",            # Vite local dev server
        "http://localhost:5174",            # Vite alt port
        "http://localhost:3000",
        "https://echon.vercel.app",         # Vercel Production Testing
        "https://echon.app",                # Production
    ]
    
    # File Storage (S3 / Cloudflare R2)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: str = "echon-media"
    AWS_REGION: str = "us-east-1"
    
    # Cloudflare R2 (cheaper alternative to S3)
    # R2_ACCOUNT_ID: Optional[str] = None
    # R2_ACCESS_KEY_ID: Optional[str] = None
    # R2_SECRET_ACCESS_KEY: Optional[str] = None
    
    # Twilio (SMS Invitations)
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    
    # Email — supports Resend (preferred) or SendGrid
    RESEND_API_KEY: Optional[str] = None
    SENDGRID_API_KEY: Optional[str] = None
    FROM_EMAIL: str = "noreply@echon.app"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()