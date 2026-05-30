"""add role column to users

Revision ID: a1b2c3d4e5f6
Revises: 34b74b238aa8
Create Date: 2026-05-28 10:00:00.000000

Adds the admin role tier (user / corpus_admin / super_admin) to users.

- New column `role` String(20), NOT NULL, server_default 'user' so existing
  rows backfill automatically.
- Any existing user with is_superuser = true is promoted to 'super_admin' so
  you are NOT locked out of the new admin system after migrating.
- role is the source of truth going forward; is_superuser is kept in sync by
  the user manager (super_admin <-> is_superuser=true).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '34b74b238aa8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add the column with a server-side default so existing rows get 'user'.
    op.add_column(
        'users',
        sa.Column('role', sa.String(length=20), nullable=False,
                  server_default='user'),
    )
    # Promote any existing superuser to super_admin so the operator who set up
    # the system keeps full access under the new role model.
    op.execute(
        "UPDATE users SET role = 'super_admin' WHERE is_superuser = true"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'role')