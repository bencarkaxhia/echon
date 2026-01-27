"""add relationships

Revision ID: 477c6a8fc34b
Revises: 001
Create Date: 2026-01-27

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid


# revision identifiers
revision = '477c6a8fc34b'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    # Create relationships table
    op.create_table(
        'relationships',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('space_id', UUID(as_uuid=True), sa.ForeignKey('family_spaces.id'), nullable=False),
        sa.Column('person_a_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('person_b_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('relationship_type', sa.String(50), nullable=False),
        sa.Column('metadata', JSONB, nullable=True),
        sa.Column('confidence_level', sa.String(20), server_default='confirmed'),
        sa.Column('created_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime, server_default=sa.text('now()'), nullable=False),
        sa.Column('is_active', sa.Boolean, server_default='true', nullable=False),
    )
    
    # Indexes
    op.create_index('idx_relationships_space', 'relationships', ['space_id'])
    op.create_index('idx_relationships_person_a', 'relationships', ['person_a_id'])
    op.create_index('idx_relationships_person_b', 'relationships', ['person_b_id'])
    op.create_index('idx_relationships_type', 'relationships', ['relationship_type'])
    
    # Constraint
    op.create_check_constraint(
        'check_different_people',
        'relationships',
        'person_a_id != person_b_id'
    )
    
    # Add columns to users
    op.add_column('users', sa.Column('birth_date', sa.Date, nullable=True))
    op.add_column('users', sa.Column('death_date', sa.Date, nullable=True))
    op.add_column('users', sa.Column('birth_location', sa.String(200), nullable=True))
    op.add_column('users', sa.Column('current_location', sa.String(200), nullable=True))
    op.add_column('users', sa.Column('bio', sa.Text, nullable=True))
    
    # Add columns to posts
    op.add_column('posts', sa.Column('event_date', sa.Date, nullable=True))
    op.add_column('posts', sa.Column('people_tagged', sa.ARRAY(UUID(as_uuid=True)), nullable=True))


def downgrade():
    op.drop_table('relationships')
    op.drop_column('users', 'birth_date')
    op.drop_column('users', 'death_date')
    op.drop_column('users', 'birth_location')
    op.drop_column('users', 'current_location')
    op.drop_column('users', 'bio')
    op.drop_column('posts', 'event_date')
    op.drop_column('posts', 'people_tagged')