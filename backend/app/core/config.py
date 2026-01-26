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
    SECRET_KEY: str = "54034a0e067c13d4d797fce2d3fd8b20136de68b8dc3f97c55f944a797dc62c7"    # created via "openssl rand -hex 32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "postgresql://echon:echon_dev_password@localhost:5432/echon_db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # CORS (Frontend URLs)
    CORS_ORIGINS: list = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",
        "https://echon.vercel.app",      # Production
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
    
    # Email (SendGrid)
    SENDGRID_API_KEY: Optional[str] = None
    FROM_EMAIL: str = "noreply@echon.app"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()