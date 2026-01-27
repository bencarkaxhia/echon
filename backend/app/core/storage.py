"""
Echon File Storage Utilities
Handle file uploads, storage, and serving

PATH: echon/backend/app/core/storage.py
"""

import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import UploadFile
import aiofiles
from PIL import Image
import io


# Storage directory
UPLOAD_DIR = Path("/tmp/echon_uploads")  # For now, use /tmp (later: S3)
UPLOAD_DIR.mkdir(exist_ok=True)

# Allowed file types
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"}
ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/webm"}
ALLOWED_PDF_TYPES = {"application/pdf"}
ALLOWED_DOCUMENT_TYPES = ALLOWED_PDF_TYPES  # Can add more later

# Max file sizes (in bytes)
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100 MB
MAX_AUDIO_SIZE = 25 * 1024 * 1024  # 25 MB
MAX_PDF_SIZE = 25 * 1024 * 1024  # 25 MB


class FileUploadError(Exception):
    """Custom exception for file upload errors"""
    pass


def get_file_extension(filename: str) -> str:
    """Get file extension from filename"""
    return filename.split(".")[-1].lower() if "." in filename else ""


def generate_unique_filename(original_filename: str) -> str:
    """Generate unique filename to prevent collisions"""
    ext = get_file_extension(original_filename)
    unique_id = str(uuid.uuid4())
    return f"{unique_id}.{ext}" if ext else unique_id


async def save_upload_file(file: UploadFile, subfolder: str = "general") -> str:
    """
    Save uploaded file to disk
    Returns: relative file path
    """
    # Create subfolder (including parent directories)
    folder_path = UPLOAD_DIR / subfolder
    folder_path.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    filename = generate_unique_filename(file.filename or "upload")
    file_path = folder_path / filename
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Return relative path
    return f"{subfolder}/{filename}"


async def save_image(
    file: UploadFile,
    subfolder: str = "images",
    max_size: int = MAX_IMAGE_SIZE,
    create_thumbnail: bool = True
) -> dict:
    """
    Save image file with validation and optional thumbnail
    Returns: dict with original and thumbnail paths
    """
    # Validate file type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise FileUploadError(f"Invalid file type. Allowed: {ALLOWED_IMAGE_TYPES}")
    
    # Read file content
    content = await file.read()
    
    # Validate file size
    if len(content) > max_size:
        raise FileUploadError(f"File too large. Max size: {max_size / 1024 / 1024}MB")
    
    # Save original
    await file.seek(0)
    original_path = await save_upload_file(file, subfolder)
    
    result = {
        "original": original_path,
        "thumbnail": None
    }
    
    # Create thumbnail if requested
    if create_thumbnail:
        try:
            # Open image with PIL
            image = Image.open(io.BytesIO(content))
            
            # Create thumbnail (max 400x400)
            image.thumbnail((400, 400), Image.Resampling.LANCZOS)
            
            # Save thumbnail
            thumb_filename = f"thumb_{generate_unique_filename(file.filename or 'image')}"
            thumb_path = UPLOAD_DIR / subfolder / thumb_filename
            image.save(thumb_path, optimize=True, quality=85)
            
            result["thumbnail"] = f"{subfolder}/{thumb_filename}"
        except Exception as e:
            print(f"Thumbnail creation failed: {e}")
            # Continue without thumbnail
    
    return result


async def save_video(
    file: UploadFile,
    subfolder: str = "videos",
    max_size: int = MAX_VIDEO_SIZE
) -> str:
    """
    Save video file with validation
    Returns: file path
    """
    # Validate file type
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise FileUploadError(f"Invalid file type. Allowed: {ALLOWED_VIDEO_TYPES}")
    
    # Validate file size
    content = await file.read()
    if len(content) > max_size:
        raise FileUploadError(f"File too large. Max size: {max_size / 1024 / 1024}MB")
    
    # Save file
    await file.seek(0)
    return await save_upload_file(file, subfolder)


async def save_audio(
    file: UploadFile,
    subfolder: str = "audio",
    max_size: int = MAX_AUDIO_SIZE
) -> str:
    """
    Save audio file with validation
    Returns: file path
    """
    # Validate file type
    if file.content_type not in ALLOWED_AUDIO_TYPES:
        raise FileUploadError(f"Invalid file type. Allowed: {ALLOWED_AUDIO_TYPES}")
    
    # Validate file size
    content = await file.read()
    if len(content) > max_size:
        raise FileUploadError(f"File too large. Max size: {max_size / 1024 / 1024}MB")
    
    # Save file
    await file.seek(0)
    return await save_upload_file(file, subfolder)


def get_file_url(file_path: str) -> str:
    """
    Convert file path to URL
    For now returns relative path, later will be S3 URL
    """
    return f"/uploads/{file_path}"


def delete_file(file_path: str) -> bool:
    """
    Delete file from storage
    Returns: True if successful
    """
    try:
        full_path = UPLOAD_DIR / file_path
        if full_path.exists():
            full_path.unlink()
            return True
        return False
    except Exception as e:
        print(f"File deletion failed: {e}")
        return False


async def save_file(file: UploadFile, subfolder: str = "files") -> dict:
    """
    Save any type of file (video, PDF, etc.)
    Returns file info with path and URL
    """
    # Validate file type
    file_type = file.content_type
    
    allowed_types = (
        ALLOWED_IMAGE_TYPES | 
        ALLOWED_VIDEO_TYPES | 
        ALLOWED_AUDIO_TYPES | 
        ALLOWED_DOCUMENT_TYPES
    )
    
    if file_type not in allowed_types:
        raise FileUploadError(
            f"File type {file_type} not allowed. "
            f"Allowed: images, videos, audio, PDFs"
        )
    
    # Check file size
    content = await file.read()
    file_size = len(content)
    
    max_size = MAX_VIDEO_SIZE  # Use largest limit
    if file_type in ALLOWED_IMAGE_TYPES:
        max_size = MAX_IMAGE_SIZE
    elif file_type in ALLOWED_AUDIO_TYPES:
        max_size = MAX_AUDIO_SIZE
    elif file_type in ALLOWED_DOCUMENT_TYPES:
        max_size = MAX_PDF_SIZE
    
    if file_size > max_size:
        raise FileUploadError(
            f"File too large. Max size: {max_size / (1024*1024)}MB"
        )
    
    # Generate unique filename
    filename = generate_unique_filename(file.filename or "file")
    
    # Create subfolder
    folder_path = UPLOAD_DIR / subfolder
    folder_path.mkdir(exist_ok=True, parents=True)
    
    # Save file
    file_path = folder_path / filename
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    # Return file info
    relative_path = f"{subfolder}/{filename}"
    
    return {
        "filename": filename,
        "original_filename": file.filename,
        "path": relative_path,
        "url": get_file_url(relative_path),
        "size": file_size,
        "type": file_type
    }