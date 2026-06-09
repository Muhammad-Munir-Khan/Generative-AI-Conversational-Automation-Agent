"""Redis-backed rate limiting for FastAPI.

A fixed-window counter keyed by the authenticated user id when available,
otherwise the client IP (first hop of X-Forwarded-For when behind a proxy).
Used as a route dependency:

    from app.core.rate_limit import RateLimiter

    @router.post(
        "/query",
        dependencies=[Depends(RateLimiter(times=30, seconds=60, scope="rag"))],
    )
    async def query(...): ...

Design choices:
  - **Fail-open.** If Redis is unreachable the request is allowed and a warning
    is logged. For a limiter, availability is normally preferred over strict
    enforcement (don't take the whole app down because Redis blipped). Flip
    `_FAIL_OPEN = False` to fail closed (return 503) instead.
  - **Fixed window.** Simple and cheap (one INCR + one EXPIRE). It allows a
    burst at the window boundary; that's acceptable for a first cut. Upgrade to
    a sliding-window or token-bucket later if boundary bursts matter.

Config via env (override in .env; can be promoted into config.py later):
  REDIS_URL                 default redis://redis:6379/0
  RATE_LIMIT_FAIL_OPEN      default "true"

Requires the `redis` package (redis-py, async client): add `redis>=5` to
requirements.txt, and a `redis` service to docker-compose (see README/below).
"""
import os
import time

from fastapi import HTTPException, Request, status

from app.core.logging import get_logger

log = get_logger(__name__)

try:
    from redis import asyncio as aioredis
except ImportError:  # redis not installed yet — limiter degrades to no-op
    aioredis = None

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
_FAIL_OPEN = os.getenv("RATE_LIMIT_FAIL_OPEN", "true").lower() in ("1", "true", "yes")

_redis = None


def _get_redis():
    """Lazy singleton async Redis client. Returns None if redis isn't installed."""
    global _redis
    if aioredis is None:
        return None
    if _redis is None:
        _redis = aioredis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
    return _redis


def _client_key(request: Request) -> str:
    """Identify the caller: authenticated user if present, else client IP.

    request.state.user is populated by the auth dependency when a route is
    authenticated. For public routes (login, register) we fall back to IP. When
    behind a reverse proxy / load balancer, the real client IP is the first hop
    of X-Forwarded-For (the proxy MUST be trusted to set this correctly).
    """
    user = getattr(request.state, "user", None)
    user_id = getattr(user, "id", None) if user is not None else None
    if user_id is not None:
        return f"user:{user_id}"

    xff = request.headers.get("x-forwarded-for")
    if xff:
        ip = xff.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"
    return f"ip:{ip}"


class RateLimiter:
    """Dependency factory limiting to `times` requests per `seconds` window.

    `scope` namespaces the counter so different endpoint groups (auth, rag,
    agent) get independent budgets for the same caller.
    """

    def __init__(self, times: int, seconds: int, scope: str = "default"):
        self.times = times
        self.seconds = seconds
        self.scope = scope

    async def __call__(self, request: Request) -> None:
        r = _get_redis()
        if r is None:
            if _FAIL_OPEN:
                return
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE, "rate limiter unavailable"
            )

        window = int(time.time() // self.seconds)
        key = f"rl:{self.scope}:{_client_key(request)}:{window}"

        try:
            current = await r.incr(key)
            if current == 1:
                await r.expire(key, self.seconds)
        except Exception as e:
            log.warning(
                "rate limiter Redis error (failing %s): %s",
                "open" if _FAIL_OPEN else "closed",
                e,
            )
            if _FAIL_OPEN:
                return
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE, "rate limiter error"
            )

        if current > self.times:
            raise HTTPException(
                status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded: max {self.times} requests per {self.seconds}s.",
                headers={"Retry-After": str(self.seconds)},
            )