"""Pydantic schemas for user create / read / update.

Required by fastapi-users for its auto-generated routes.
"""
import uuid

from fastapi_users import schemas


class UserRead(schemas.BaseUser[uuid.UUID]):
    display_name: str | None = None
    role: str = "user"


class UserCreate(schemas.BaseUserCreate):
    display_name: str | None = None


class UserUpdate(schemas.BaseUserUpdate):
    display_name: str | None = None