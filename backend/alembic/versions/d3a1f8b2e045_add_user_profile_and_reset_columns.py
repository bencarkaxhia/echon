"""add_user_profile_and_reset_columns

Adds columns to users table that were added directly to VPS DB:
  - birth_date, death_date, current_location, bio  (profile fields)
  - reset_token, reset_token_expires_at            (forgot-password flow)

Uses ADD COLUMN IF NOT EXISTS so it is safe to run on DBs that already have
these columns (created via create_all before migrations were in place).

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
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS death_date DATE")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS current_location VARCHAR(200)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(64)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP WITHOUT TIME ZONE")
    # Index is safe to create conditionally
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_indexes
                WHERE tablename = 'users' AND indexname = 'ix_users_reset_token'
            ) THEN
                CREATE INDEX ix_users_reset_token ON users (reset_token);
            END IF;
        END
        $$;
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_users_reset_token")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS reset_token_expires_at")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS reset_token")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS bio")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS current_location")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS death_date")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS birth_date")
