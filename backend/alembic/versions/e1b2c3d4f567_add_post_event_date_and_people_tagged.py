"""add_post_event_date_and_people_tagged

Adds columns to posts table that exist in the Post model but were missing
from DBs created before this migration was added:
  - event_date       (Date, nullable) — when the memory occurred
  - people_tagged    (UUID[], nullable) — users tagged in the memory

Uses ADD COLUMN IF NOT EXISTS for idempotency.

Revision ID: e1b2c3d4f567
Revises: d3a1f8b2e045
Create Date: 2026-04-06
"""
from typing import Sequence, Union

from alembic import op

revision: str = 'e1b2c3d4f567'
down_revision: Union[str, Sequence[str], None] = 'd3a1f8b2e045'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_date DATE")
    op.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS people_tagged UUID[]")


def downgrade() -> None:
    op.execute("ALTER TABLE posts DROP COLUMN IF EXISTS people_tagged")
    op.execute("ALTER TABLE posts DROP COLUMN IF EXISTS event_date")
