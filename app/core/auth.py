"""fastapi-users wiring: user manager, dual auth backends, OAuth clients.

Backends:
  - "jwt": Bearer token transport (API/curl/mobile)
  - "cookie": httpOnly cookie transport (web frontend)
Both share one JWT strategy. OAuth (Google + GitHub) issues the same cookie.

Force-logout enforcement (security-critical):
  - Our JWT strategy adds an `iat` (issued-at) claim to every token.
  - When an admin force-logs out a user, users.jwt_invalidated_at is set.
  - Every request that depends on `current_active_user` runs the freshness
    check: if the JWT's iat predates jwt_invalidated_at, 401.
  - This means force-logout is genuinely global: chat, RAG, sessions, admin -
    every authenticated endpoint rejects stale tokens on the very next call.
  - Cost: one indexed users.jwt_invalidated_at lookup per request via the
    underlying fastapi-users session, plus a JWT decode we'd be doing anyway.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    CookieTransport,
    JWTStrategy,
)
from fastapi_users.jwt import generate_jwt
import jwt as pyjwt

from app.core.email import password_reset_email, send_email, password_changed_email
from fastapi_users.db import SQLAlchemyUserDatabase
from httpx_oauth.clients.github import GitHubOAuth2
from httpx_oauth.clients.google import GoogleOAuth2
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_async_session
from app.core.logging import get_logger
from app.core.roles import UserRole
from app.models.user import OAuthAccount, User

log = get_logger(__name__)


# --- User database adapter (now with OAuth support) ---

async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User, OAuthAccount)


# --- User manager ---

class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = settings.jwt_secret
    verification_token_secret = settings.jwt_secret

    async def _sync_superuser_flag(self, user: User) -> None:
        """Mirror is_superuser from role (super_admin <-> is_superuser=True).

        role is the source of truth; this keeps fastapi-users' built-in
        superuser checks consistent with it.
        """
        should_be = (
            getattr(user, "role", UserRole.user.value) == UserRole.super_admin.value
        )
        if user.is_superuser != should_be:
            await self.user_db.update(user, {"is_superuser": should_be})

    async def on_after_register(self, user: User, request=None):
        log.info("user registered: %s (%s)", user.email, user.id)
        await self._sync_superuser_flag(user)

    async def on_after_update(self, user: User, update_dict: dict, request=None):
        # If an admin changed the user's role, keep is_superuser consistent.
        if "role" in update_dict:
            await self._sync_superuser_flag(user)

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


# --- JWT strategy WITH iat claim ----------------------------------------------
# fastapi-users' default JWTStrategy emits only {sub, aud, exp}. We need `iat`
# so we can detect tokens issued before a user was force-logged-out.

class JWTStrategyWithIat(JWTStrategy):
    async def write_token(self, user) -> str:
        data = {
            "sub": str(user.id),
            "aud": self.token_audience,
            "iat": int(datetime.now(timezone.utc).timestamp()),
        }
        return generate_jwt(
            data, self.encode_key, self.lifetime_seconds, algorithm=self.algorithm
        )


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategyWithIat(
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

# fastapi-users' raw dependency (signature + active check only, NO freshness
# check). Used internally by the freshness check below. NOT exported as the
# default `current_active_user` because force-logout needs to be global.
_current_active_user_no_freshness = fastapi_users.current_user(active=True)


# --- Freshness check: rejects JWTs issued before force-logout -----------------
# Defined BEFORE the public `current_active_user` re-bind below so the public
# name (which everything imports) gets the freshness check by default. That's
# the whole point: force-logout must be enforced everywhere, not just admin.

def _extract_token(request: Request) -> Optional[str]:
    """Pull a JWT from either the Bearer header or the cookie."""
    auth = request.headers.get("Authorization", "")
    if auth.lower().startswith("bearer "):
        return auth.split(" ", 1)[1].strip()
    return request.cookies.get("genai_auth")


async def _check_freshness(request: Request, user: User) -> User:
    """Reject the request if the JWT was issued before force-logout.

    If users.jwt_invalidated_at is set and the JWT's iat is earlier (or the
    token has no iat at all -- pre-upgrade tokens), the request is rejected
    with 401. The user can simply log in again to get a fresh token.
    """
    invalidated = getattr(user, "jwt_invalidated_at", None)
    if invalidated is None:
        return user  # never force-logged-out, nothing to check

    token = _extract_token(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired"
        )

    try:
        # We trust the signature/exp check that the inner dependency already
        # passed. Here we just need the payload to read `iat`.
        payload = pyjwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256"],
            audience="fastapi-users:auth",
            options={"verify_signature": True, "verify_exp": True},
        )
    except pyjwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired"
        )

    iat = payload.get("iat")
    if iat is None:
        # Token predates the iat upgrade -> treat as stale.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired, please log in again",
        )

    if iat < int(invalidated.timestamp()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session was force-logged-out by an admin",
        )

    return user


async def current_active_user(
    request: Request,
    user: User = Depends(_current_active_user_no_freshness),
) -> User:
    """Active user + JWT-freshness check (rejects force-logged-out tokens).

    This is the dependency every authenticated route should use. Combines:
      1. fastapi-users active-user check (signature, expiry, is_active)
      2. iat-cutoff check against users.jwt_invalidated_at
    """
    return await _check_freshness(request, user)


# Backward-compat alias. `current_active_fresh_user` was the name used by
# app/core/admin_deps.py before force-logout went global. Keep the alias so
# existing admin_deps imports stay working without edits.
current_active_fresh_user = current_active_user


# Backwards-compat alias.
auth_backend = jwt_backend