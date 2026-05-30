"""add jwt_invalidated_at column to users

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-29 00:00:00.000000

Adds a nullable timestamp used by the "force logout" admin action.
When set, any JWT issued before this timestamp is rejected (see
app/core/auth.py's current_active_fresh_user dependency).

Nullable so existing users default to "no forced invalidation."
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "jwt_invalidated_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "jwt_invalidated_at")