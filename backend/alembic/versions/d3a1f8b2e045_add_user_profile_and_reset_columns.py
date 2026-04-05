"""add_user_profile_and_reset_columns

Adds columns to users table that were added directly to VPS DB:
  - birth_date, death_date, current_location, bio  (profile fields)
  - reset_token, reset_token_expires_at            (forgot-password flow)

Revision ID: d3a1f8b2e045
Revises: c2af53046123
Create Date: 2026-04-06
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'd3a1f8b2e045'
down_revision: Union[str, Sequence[str], None] = 'c2af53046123'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('birth_date', sa.Date(), nullable=True))
    op.add_column('users', sa.Column('death_date', sa.Date(), nullable=True))
    op.add_column('users', sa.Column('current_location', sa.String(200), nullable=True))
    op.add_column('users', sa.Column('bio', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('reset_token', sa.String(64), nullable=True))
    op.add_column('users', sa.Column('reset_token_expires_at', sa.DateTime(), nullable=True))
    op.create_index('ix_users_reset_token', 'users', ['reset_token'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_users_reset_token', table_name='users')
    op.drop_column('users', 'reset_token_expires_at')
    op.drop_column('users', 'reset_token')
    op.drop_column('users', 'bio')
    op.drop_column('users', 'current_location')
    op.drop_column('users', 'death_date')
    op.drop_column('users', 'birth_date')
