"""
Cloudflare R2 Storage Adapter
Production file storage using Cloudflare R2

PATH: echon/backend/app/core/r2_storage.py
"""

import os
import boto3
from botocore.exceptions import ClientError
from pathlib import Path
from typing import Optional
from fastapi import UploadFile

# R2 Configuration (set via environment variables)
R2_ENDPOINT = os.getenv("R2_ENDPOINT")  # e.g., https://xxxx.r2.cloudflarestorage.com
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "echon-storage")
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL")  # e.g., https://storage.echon.app

# Check if R2 is configured
R2_ENABLED = bool(R2_ENDPOINT and R2_ACCESS_KEY and R2_SECRET_KEY)


def get_r2_client():
    """Get configured R2 client"""
    if not R2_ENABLED:
        return None
    
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        region_name='auto'
    )


async def upload_to_r2(file: UploadFile, key: str) -> str:
    """
    Upload file to R2
    Returns the public URL
    """
    if not R2_ENABLED:
        raise Exception("R2 storage not configured")
    
    client = get_r2_client()
    
    # Read file content
    content = await file.read()
    
    # Upload to R2
    try:
        client.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=key,
            Body=content,
            ContentType=file.content_type or 'application/octet-stream'
        )
    except ClientError as e:
        raise Exception(f"Failed to upload to R2: {str(e)}")
    
    # Return public URL
    if R2_PUBLIC_URL:
        return f"{R2_PUBLIC_URL}/{key}"
    else:
        return f"{R2_ENDPOINT}/{R2_BUCKET_NAME}/{key}"


def delete_from_r2(key: str) -> bool:
    """Delete file from R2"""
    if not R2_ENABLED:
        return False
    
    client = get_r2_client()
    
    try:
        client.delete_object(Bucket=R2_BUCKET_NAME, Key=key)
        return True
    except ClientError:
        return False