"""User model + OAuth account model for fastapi-users authentication."""
import uuid

from fastapi_users.db import SQLAlchemyBaseOAuthAccountTableUUID
from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTableUUID
from fastapi_users_db_sqlalchemy.generics import GUID
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class OAuthAccount(SQLAlchemyBaseOAuthAccountTableUUID, Base):
    """One external OAuth account (Google/GitHub) linked to a User."""
    __tablename__ = "oauth_account"

    # Explicit FK to users.id. The base class declares user_id, but we
    # re-declare it here with an explicit ForeignKey so SQLAlchemy can
    # resolve the User.oauth_accounts relationship join condition.
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("users.id", ondelete="cascade"),
        nullable=False,
    )


class User(SQLAlchemyBaseUserTableUUID, Base):
    """Application user."""
    __tablename__ = "users"

    display_name: Mapped[str | None] = mapped_column(String(80), nullable=True)

    oauth_accounts: Mapped[list[OAuthAccount]] = relationship(
        "OAuthAccount",
        lazy="joined",
    )