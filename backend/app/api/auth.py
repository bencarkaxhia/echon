"""
Echon Authentication API
Register, Login, Get Current User
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import logging

from ..core.database import get_db
from ..core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from ..core.storage import save_image, get_file_url, FileUploadError
from ..models.user import User
from ..schemas.auth import UserRegister, UserLogin, LoginResponse, UserResponse
from pydantic import BaseModel, Field, field_validator

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