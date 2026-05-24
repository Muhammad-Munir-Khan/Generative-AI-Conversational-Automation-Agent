"""fastapi-users wiring: user manager, dual auth backends, OAuth clients.

Backends:
  - "jwt": Bearer token transport (API/curl/mobile)
  - "cookie": httpOnly cookie transport (web frontend)
Both share one JWT strategy. OAuth (Google + GitHub) issues the same cookie.
"""
import uuid
from datetime import datetime, timezone
from fastapi import Depends
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    CookieTransport,
    JWTStrategy,
)
from app.core.email import password_reset_email, send_email, password_changed_email
from fastapi_users.db import SQLAlchemyUserDatabase
from httpx_oauth.clients.github import GitHubOAuth2
from httpx_oauth.clients.google import GoogleOAuth2
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_async_session
from app.core.logging import get_logger
from app.models.user import OAuthAccount, User

log = get_logger(__name__)


# --- User database adapter (now with OAuth support) ---

async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User, OAuthAccount)


# --- User manager ---

class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = settings.jwt_secret
    verification_token_secret = settings.jwt_secret

    async def on_after_register(self, user: User, request=None):
        log.info("user registered: %s (%s)", user.email, user.id)

    async def on_after_forgot_password(self, user: User, token: str, request=None):
        log.info("password reset requested for %s", user.email)
        reset_link = f"{settings.frontend_url}/reset-password?token={token}"
        subject, html_body, text_body = password_reset_email(reset_link)
        await send_email(user.email, subject, html_body, text_body)

    async def on_after_request_verify(self, user: User, token: str, request=None):
        log.info("email verification requested for %s", user.email)

    async def on_after_login(self, user: User, request=None, response=None):
        log.info("user logged in: %s (%s)", user.email, user.id)

    async def on_after_reset_password(self, user: User, request=None):
        log.info("password changed for %s", user.email)
        when = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")
        subject, html_body, text_body = password_changed_email(when)
        await send_email(user.email, subject, html_body, text_body)

async def get_user_manager(user_db=Depends(get_user_db)):
    yield UserManager(user_db)



# --- Shared JWT strategy ---

def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(
        secret=settings.jwt_secret,
        lifetime_seconds=settings.jwt_lifetime_seconds,
    )


# --- Backend 1: Bearer (API/curl/mobile) ---

bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")

jwt_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)


# --- Backend 2: Cookie (web frontend) ---

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


# --- OAuth clients ---

google_oauth_client = GoogleOAuth2(
    settings.google_oauth_client_id,
    settings.google_oauth_client_secret,
)

github_oauth_client = GitHubOAuth2(
    settings.github_oauth_client_id,
    settings.github_oauth_client_secret,
)


# --- The fastapi-users instance ---

fastapi_users = FastAPIUsers[User, uuid.UUID](
    get_user_manager,
    [cookie_backend, jwt_backend],
)

current_active_user = fastapi_users.current_user(active=True)

# Backwards-compat alias.
auth_backend = jwt_backend