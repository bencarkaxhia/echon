"""Initial schema - all tables

Revision ID: 001
Revises: 
Create Date: 2026-01-26

PATH: echon/backend/alembic/versions/001_initial_schema.py
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSON

# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create all initial tables"""
    
    # Users table
    op.create_table('users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=True, index=True),
        sa.Column('phone', sa.String(50), unique=True, nullable=True, index=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('birth_year', sa.Integer, nullable=True),
        sa.Column('birth_location', sa.Text, nullable=True),
        sa.Column('profile_photo_url', sa.Text, nullable=True),
        sa.Column('simplified_mode', sa.Boolean, default=False),
        sa.Column('language', sa.String(10), default='en'),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('last_active', sa.DateTime, server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean, default=True),
    )
    
    # Family Spaces table
    op.create_table('family_spaces',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('secondary_name', sa.String(255), nullable=True),
        sa.Column('slug', sa.String(255), unique=True, index=True),
        sa.Column('origin_location', sa.Text, nullable=True),
        sa.Column('origin_cities', sa.Text, nullable=True),
        sa.Column('emblem_url', sa.Text, nullable=True),
        sa.Column('color_primary', sa.String(7), default='#8B1E3F'),
        sa.Column('color_secondary', sa.String(7), default='#D4AF37'),
        sa.Column('settings', JSON, default={}),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean, default=True),
    )
    
    # Space Members table
    op.create_table('space_members',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('space_id', UUID(as_uuid=True), sa.ForeignKey('family_spaces.id'), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('role', sa.String(50), default='member'),
        sa.Column('generation', sa.String(50), nullable=True),
        sa.Column('lineage', sa.String(50), default='both'),
        sa.Column('relationship_to_founder', sa.String(255), nullable=True),
        sa.Column('joined_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('last_visited', sa.DateTime, server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean, default=True),
    )
    
    # Posts table
    op.create_table('posts',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('space_id', UUID(as_uuid=True), sa.ForeignKey('family_spaces.id'), nullable=False),
        sa.Column('author_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('content', sa.Text, nullable=True),
        sa.Column('file_url', sa.Text, nullable=True),
        sa.Column('file_type', sa.String(100), nullable=True),
        sa.Column('file_size', sa.Integer, nullable=True),
        sa.Column('thumbnail_url', sa.Text, nullable=True),
        sa.Column('date_of_memory', sa.Date, nullable=True),
        sa.Column('year_of_memory', sa.Integer, nullable=True),
        sa.Column('decade', sa.String(10), nullable=True),
        sa.Column('location_of_memory', sa.Text, nullable=True),
        sa.Column('privacy_level', sa.String(50), default='everyone'),
        sa.Column('privacy_list', JSON, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('reaction_count', sa.Integer, default=0),
        sa.Column('comment_count', sa.Integer, default=0),
    )
    
    # Comments table
    op.create_table('comments',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('post_id', UUID(as_uuid=True), sa.ForeignKey('posts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('author_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean, default=True),
    )
    
    # Reactions table
    op.create_table('reactions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('post_id', UUID(as_uuid=True), sa.ForeignKey('posts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('type', sa.String(50), default='heart'),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )
    
    # Post Tags table
    op.create_table('post_tags',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('post_id', UUID(as_uuid=True), sa.ForeignKey('posts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('tagged_user_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('tagged_name', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )
    
    # Invitations table
    op.create_table('invitations',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('space_id', UUID(as_uuid=True), sa.ForeignKey('family_spaces.id'), nullable=False),
        sa.Column('invited_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('invitee_name', sa.String(255), nullable=False),
        sa.Column('invitee_contact', sa.String(255), nullable=False),
        sa.Column('relationship_to_inviter', sa.String(255), nullable=True),
        sa.Column('personal_message', sa.Text, nullable=True),
        sa.Column('token', sa.String(255), unique=True, index=True, nullable=False),
        sa.Column('status', sa.String(50), default='pending'),
        sa.Column('accepted_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime, nullable=False),
        sa.Column('accepted_at', sa.DateTime, nullable=True),
    )


def downgrade() -> None:
    """Drop all tables"""
    op.drop_table('invitations')
    op.drop_table('post_tags')
    op.drop_table('reactions')
    op.drop_table('comments')
    op.drop_table('posts')
    op.drop_table('space_members')
    op.drop_table('family_spaces')
    op.drop_table('users')