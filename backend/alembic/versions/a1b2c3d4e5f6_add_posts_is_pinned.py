"""add_posts_is_pinned

Adds is_pinned boolean to posts table so important memories can be
pinned to the top of the space.

Revision ID: a1b2c3d4e5f6
Revises: e1b2c3d4f567
Create Date: 2026-04-06
"""
from typing import Sequence, Union
from alembic import op

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'e1b2c3d4f567'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE posts DROP COLUMN IF EXISTS is_pinned")
