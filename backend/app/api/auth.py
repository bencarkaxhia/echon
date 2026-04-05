"""
Echon Authentication API
Register, Login, Get Current User
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import logging
import secrets

from ..core.database import get_db
from ..core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from ..core.storage import save_image, get_file_url, FileUploadError
from ..core.config import settings
from ..models.user import User
from ..schemas.auth import UserRegister, UserLogin, LoginResponse, UserResponse
from pydantic import BaseModel, Field, EmailStr, field_validator

logger = logging.getLogger(__name__)


class ProfileUpdate(BaseModel):
    birth_year: Optional[int] = Field(None, ge=1900, le=2100)
    birth_location: Optional[str] = Field(None, max_length=200)

    @field_validator("birth_year")
    @classmethod
    def year_not_future(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v > datetime.utcnow().year:
            raise ValueError("Birth year cannot be in the future")
        return v

router = APIRouter()
security = HTTPBearer()


# --- HELPER: Get Current User from Token ---

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Extract user from JWT token
    Used as dependency in protected routes
    """
    token = credentials.credentials
    user_id = decode_access_token(token)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or account deactivated"
        )
    
    # Update last active timestamp
    user.last_active = datetime.utcnow()
    db.commit()
    
    return user


# --- REGISTER ---

@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user
    Returns JWT token + user info
    """
    # Validation: Must provide either email or phone
    if not user_data.email and not user_data.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either email or phone number"
        )
    
    # Check if user already exists
    existing_user = None
    if user_data.email:
        existing_user = db.query(User).filter(User.email == user_data.email).first()
    if not existing_user and user_data.phone:
        existing_user = db.query(User).filter(User.phone == user_data.phone).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or phone already exists"
        )
    
    # Create new user
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        password_hash=get_password_hash(user_data.password),
        birth_year=user_data.birth_year,
        birth_location=user_data.birth_location,
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate JWT token
    access_token = create_access_token(data={"sub": str(new_user.id)})
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )


# --- LOGIN ---

@router.post("/login", response_model=LoginResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email/phone and password
    Returns JWT token + user info
    """
    # Find user by email or phone
    user = db.query(User).filter(
        (User.email == credentials.email_or_phone) | 
        (User.phone == credentials.email_or_phone)
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    # Update last active
    user.last_active = datetime.utcnow()
    db.commit()
    
    # Generate JWT token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


# --- GET CURRENT USER ---

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current logged-in user's profile
    Protected route: requires valid JWT token
    """
    return UserResponse.model_validate(current_user)


# --- UPDATE PROFILE ---

@router.patch("/me", response_model=UserResponse)
def update_me(
    updates: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update birth_year and/or birth_location for the current user."""
    if updates.birth_year is not None:
        current_user.birth_year = updates.birth_year
    if updates.birth_location is not None:
        current_user.birth_location = updates.birth_location
    current_user.last_active = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


# --- LOGOUT (Client-side) ---
# Note: JWT logout is handled on the frontend by deleting the token
# No backend endpoint needed (tokens expire automatically)


# --- UPLOAD PROFILE PHOTO ---

@router.post("/upload-photo", status_code=status.HTTP_200_OK)
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload profile photo for current user
    """
    try:
        # Save image
        result = await save_image(file, subfolder="profiles", create_thumbnail=True)
        file_url = result.get("url") or get_file_url(result["original"])             # added "url" for R2 Storage - Railway Deployment
        
        # Update user
        current_user.profile_photo_url = file_url
        current_user.last_active = datetime.utcnow()
        db.commit()
        db.refresh(current_user)
        
        return {
            "profile_photo_url": file_url,
            "message": "Profile photo updated successfully"
        }
    
    except FileUploadError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception:
        logger.exception("Photo upload failed for user %s", current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Upload failed — please try again"
        )


# ─── EMAIL HELPER ────────────────────────────────────────────────────────────

def _send_reset_email(to_email: str, reset_url: str) -> bool:
    """
    Send password-reset email.
    Uses SendGrid if SENDGRID_API_KEY is configured.
    Falls back to logging the URL (useful before email is configured).
    Returns True if sent, False if only logged.
    """
    if not settings.SENDGRID_API_KEY:
        logger.warning(
            "No SENDGRID_API_KEY set — reset link for %s: %s",
            to_email, reset_url
        )
        return False

    try:
        import urllib.request, json as _json
        payload = _json.dumps({
            "personalizations": [{"to": [{"email": to_email}]}],
            "from": {"email": settings.FROM_EMAIL, "name": "Echon"},
            "subject": "Reset your Echon password",
            "content": [{"type": "text/html", "value": f"""
<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
  <h2 style="color:#c9a84c">Reset your Echon password</h2>
  <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
  <a href="{reset_url}"
     style="display:inline-block;background:#c9a84c;color:#1a1207;padding:12px 24px;
            border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
    Reset Password
  </a>
  <p style="color:#888;font-size:12px">If you didn't request this, ignore this email.</p>
  <p style="color:#888;font-size:12px">Or copy this link:<br>{reset_url}</p>
</div>"""}],
        }).encode()
        req = urllib.request.Request(
            "https://api.sendgrid.com/v3/mail/send",
            data=payload,
            headers={
                "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status in (200, 202)
    except Exception:
        logger.exception("SendGrid send failed for %s", to_email)
        return False


# ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Request a password reset link.
    Always returns 200 to avoid email enumeration.
    Sends email if SendGrid is configured; otherwise logs the link.
    """
    user = db.query(User).filter(User.email == data.email).first()

    if user:
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expires_at = datetime.utcnow() + timedelta(hours=1)
        db.commit()

        reset_url = f"https://echon.app/reset-password/{token}"
        email_sent = _send_reset_email(user.email, reset_url)

        if not email_sent:
            # No email configured — return the URL directly so the user can act on it
            # (useful until SendGrid key is added)
            return {
                "message": "no_email_configured",
                "reset_url": reset_url,
            }

    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Set a new password using a valid reset token.
    Token is single-use and expires after 1 hour.
    """
    user = db.query(User).filter(User.reset_token == data.token).first()

    if not user or not user.reset_token_expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid or expired reset link.")

    if datetime.utcnow() > user.reset_token_expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="This reset link has expired. Please request a new one.")

    user.password_hash = get_password_hash(data.new_password)
    user.reset_token = None
    user.reset_token_expires_at = None
    db.commit()

    return {"message": "Password updated successfully. You can now log in."}