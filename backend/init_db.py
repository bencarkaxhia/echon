"""
Database Initialization Script
Creates all tables in PostgreSQL

PATH: echon/backend/init_db.py

Usage:
    python init_db.py
"""

from app.core.database import engine, Base
from app.models import User, FamilySpace, SpaceMember, Post, Comment, Reaction, PostTag, Invitation

print("🔨 Creating database tables...")

# This will create all tables defined in our models
Base.metadata.create_all(bind=engine)

print("✅ Database tables created successfully!")
print("\nTables created:")
print("  - users")
print("  - family_spaces")
print("  - space_members")
print("  - posts")
print("  - comments")
print("  - reactions")
print("  - post_tags")
print("  - invitations")