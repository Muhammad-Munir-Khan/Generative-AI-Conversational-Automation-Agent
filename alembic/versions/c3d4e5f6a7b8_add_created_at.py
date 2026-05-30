"""add created_at column to users + backfill existing users

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-05-29 00:00:00.000000

fastapi-users' base user table does not include created_at by default. We
add it here so admin tooling can show "when did this user sign up". For
users that already exist (no real signup timestamp available), we backfill
with the current time as a sane placeholder. New users get `server_default
= now()` automatically.

The column is NOT NULL because every user must have a timestamp going
forward; the backfill ensures that's true for existing rows too.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c3d4e5f6a7b8"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add the column. server_default=now() handles new inserts.
    #    nullable=True initially so we can backfill, then we ALTER to NOT NULL.
    op.add_column(
        "users",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=True,
        ),
    )

    # 2. Backfill existing rows with now() (the placeholder for users that
    #    pre-date this column).
    op.execute("UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL")

    # 3. Tighten to NOT NULL now that all rows have a value.
    op.alter_column("users", "created_at", nullable=False)


def downgrade() -> None:
    op.drop_column("users", "created_at")