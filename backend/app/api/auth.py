"""
Echon Authentication API
Register, Login, Get Current User
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime

from ..core.database import get_db
from ..core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from ..models.user import User
from ..schemas.auth import UserRegister, UserLogin, LoginResponse, UserResponse

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
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
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


# --- LOGOUT (Client-side) ---
# Note: JWT logout is handled on the frontend by deleting the token
# No backend endpoint needed (tokens expire automatically)