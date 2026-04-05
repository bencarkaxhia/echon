"""sync_models_with_db

Aligns models with the actual database schema (created via create_all before migrations were in place).
- Marks relationships.created_at / updated_at / is_active as NOT NULL (they always had values)
- notifications table and all indexes are preserved as-is

Revision ID: c2af53046123
Revises: 477c6a8fc34b
Create Date: 2026-04-05
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'c2af53046123'
down_revision: Union[str, Sequence[str], None] = '477c6a8fc34b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Fix nullable mismatches on relationships — data has always had values, safe to enforce
    op.alter_column('relationships', 'created_at',
                    existing_type=postgresql.TIMESTAMP(),
                    nullable=False,
                    existing_server_default=sa.text('now()'))
    op.alter_column('relationships', 'updated_at',
                    existing_type=postgresql.TIMESTAMP(),
                    nullable=False,
                    existing_server_default=sa.text('now()'))
    op.alter_column('relationships', 'is_active',
                    existing_type=sa.BOOLEAN(),
                    nullable=False,
                    existing_server_default=sa.text('true'))


def downgrade() -> None:
    op.alter_column('relationships', 'is_active',
                    existing_type=sa.BOOLEAN(),
                    nullable=True,
                    existing_server_default=sa.text('true'))
    op.alter_column('relationships', 'updated_at',
                    existing_type=postgresql.TIMESTAMP(),
                    nullable=True,
                    existing_server_default=sa.text('now()'))
    op.alter_column('relationships', 'created_at',
                    existing_type=postgresql.TIMESTAMP(),
                    nullable=True,
                    existing_server_default=sa.text('now()'))
