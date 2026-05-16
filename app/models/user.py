"""User model — extends fastapi-users base for authentication."""
from fastapi_users.db import SQLAlchemyBaseUserTable
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String

import uuid

from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTableUUID

from app.core.db import Base


class User(SQLAlchemyBaseUserTableUUID, Base):
    """Application user.

    Inherits from fastapi-users' base, which already provides:
      - id (UUID)
      - email
      - hashed_password
      - is_active
      - is_superuser
      - is_verified

    We add our own fields here as the app grows. Keep it minimal for now.
    """
    __tablename__ = "users"

    # Optional display name (shown in the UI). Defaults to email prefix.
    display_name: Mapped[str | None] = mapped_column(String(80), nullable=True)