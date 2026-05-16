"""fastapi-users wiring: user manager, dual auth backends, route registration.

Two auth backends are registered:
  - "jwt": Bearer token transport (for API/curl/mobile)
  - "cookie": httpOnly cookie transport (for the web frontend)

Both use the same JWT strategy under the hood — the only difference is how
the token is transported. A user logging in via /auth/cookie/login gets the
JWT in a httpOnly cookie; /auth/jwt/login gets it in the response body.

The current_active_user dependency accepts either, so any endpoint that
gates on auth works for both browser and curl clients.
"""
import uuid

from fastapi import Depends
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    CookieTransport,
    JWTStrategy,
)
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_async_session
from app.core.logging import get_logger
from app.models.user import User

log = get_logger(__name__)


# --- User database adapter ---

async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User)


# --- User manager ---

class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = settings.jwt_secret
    verification_token_secret = settings.jwt_secret

    async def on_after_register(self, user: User, request=None):
        log.info("user registered: %s (%s)", user.email, user.id)

    async def on_after_forgot_password(self, user: User, token: str, request=None):
        log.info("password reset requested for %s — token: %s", user.email, token)

    async def on_after_request_verify(self, user: User, token: str, request=None):
        log.info("email verification requested for %s — token: %s", user.email, token)


async def get_user_manager(user_db=Depends(get_user_db)):
    yield UserManager(user_db)


# --- Shared JWT strategy ---

def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(
        secret=settings.jwt_secret,
        lifetime_seconds=settings.jwt_lifetime_seconds,
    )


# --- Backend 1: Bearer (for API/curl/mobile) ---

bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")

jwt_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)


# --- Backend 2: Cookie (for web frontend) ---
#
# httpOnly: True   → JavaScript cannot read the cookie (XSS protection)
# secure:   False  → set True in production over HTTPS; False for localhost dev
# samesite: "lax"  → sent on top-level cross-origin navigation, blocks most CSRF
#                    "lax" is the right default for a single-origin SPA + API setup.
#                    If frontend and backend are on truly different domains in prod,
#                    switch to "none" + secure=True.

cookie_transport = CookieTransport(
    cookie_name="genai_auth",
    cookie_max_age=settings.jwt_lifetime_seconds,
    cookie_httponly=True,
    cookie_secure=False,  # TODO: True when deployed over HTTPS
    cookie_samesite="lax",
)

cookie_backend = AuthenticationBackend(
    name="cookie",
    transport=cookie_transport,
    get_strategy=get_jwt_strategy,
)


# --- The fastapi-users instance ---
#
# Order matters: when fastapi-users checks for auth on a request, it tries
# the backends in order. Putting cookie first means browser requests with
# both a cookie AND a stale Authorization header use the cookie.

fastapi_users = FastAPIUsers[User, uuid.UUID](
    get_user_manager,
    [cookie_backend, jwt_backend],
)

# Dependency to use in routes that need an authenticated user.
# Accepts either cookie or bearer token transparently.
current_active_user = fastapi_users.current_user(active=True)


# Backwards-compat alias (existing imports of `auth_backend` won't break).
auth_backend = jwt_backend