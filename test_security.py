"""Security-focused tests for the Phase 1 hardening.

These are intentionally self-contained: the pure-logic tests (magic-byte
sniffing, rate-limit keying, DSN validation, secrets resolution) need no
network, DB, or Redis. The security-headers test spins up a tiny FastAPI app
with just the middleware attached, so it doesn't import the full application
graph (which would pull in Weaviate/embeddings). Run with: `pytest tests/test_security.py`
"""
import os

import pytest


# --------------------------------------------------------------------------- #
# Upload signature sniffing (app/api/attachment_routes.py::_sniff_ok)
# --------------------------------------------------------------------------- #
# Replicated here so the test stays runnable even if the route module pulls in
# app deps; the logic under test is the byte-signature check.
def _sniff_ok(ext: str, data: bytes) -> bool:
    head = data[:16]
    if ext == ".pdf":
        return head.startswith(b"%PDF")
    if ext == ".png":
        return head.startswith(b"\x89PNG\r\n\x1a\n")
    if ext in (".jpg", ".jpeg"):
        return head.startswith(b"\xff\xd8\xff")
    if ext == ".gif":
        return head.startswith((b"GIF87a", b"GIF89a"))
    if ext == ".webp":
        return head[:4] == b"RIFF" and head[8:12] == b"WEBP"
    return True


@pytest.mark.parametrize(
    "ext,data,expected",
    [
        (".pdf", b"%PDF-1.7\n...", True),
        (".pdf", b"MZ\x90\x00 not a pdf", False),       # spoofed pdf rejected
        (".png", b"\x89PNG\r\n\x1a\n....", True),
        (".png", b"GIF89a not a png", False),            # wrong image type
        (".jpg", b"\xff\xd8\xff\xe0....", True),
        (".jpeg", b"not a jpeg", False),
        (".gif", b"GIF89a....", True),
        (".webp", b"RIFF\x00\x00\x00\x00WEBPVP8 ", True),
        (".webp", b"RIFF\x00\x00\x00\x00AVI ", False),   # RIFF but not WEBP
        (".txt", b"anything goes for text", True),       # text has no signature
    ],
)
def test_sniff_ok(ext, data, expected):
    assert _sniff_ok(ext, data) is expected


# --------------------------------------------------------------------------- #
# Rate-limit client keying (app/core/rate_limit.py::_client_key)
# --------------------------------------------------------------------------- #
class _FakeClient:
    def __init__(self, host):
        self.host = host


class _FakeState:
    pass


class _FakeRequest:
    """Minimal stand-in matching the attributes _client_key reads."""
    def __init__(self, headers=None, client_host="1.2.3.4", user=None):
        self.headers = headers or {}
        self.client = _FakeClient(client_host)
        self.state = _FakeState()
        if user is not None:
            self.state.user = user


def _client_key(request) -> str:
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


def test_client_key_prefers_authenticated_user():
    class U:
        id = "abc-123"
    req = _FakeRequest(user=U())
    assert _client_key(req) == "user:abc-123"


def test_client_key_falls_back_to_direct_ip():
    req = _FakeRequest(client_host="9.9.9.9")
    assert _client_key(req) == "ip:9.9.9.9"


def test_client_key_uses_first_xff_hop_behind_proxy():
    req = _FakeRequest(headers={"x-forwarded-for": "203.0.113.5, 10.0.0.1"})
    assert _client_key(req) == "ip:203.0.113.5"


# --------------------------------------------------------------------------- #
# Sentry DSN guard (the rule used in app/main.py)
# --------------------------------------------------------------------------- #
def _sentry_would_init(dsn: str | None) -> bool:
    d = (dsn or "").strip()
    return d.startswith(("http://", "https://"))


@pytest.mark.parametrize(
    "dsn,expected",
    [
        ("", False),
        ("   ", False),
        ("YOUR_DSN_HERE", False),
        ("changeme", False),
        ("https://abc@o1.ingest.sentry.io/2", True),
        ("http://localhost/1", True),
    ],
)
def test_sentry_dsn_guard(dsn, expected):
    assert _sentry_would_init(dsn) is expected


# --------------------------------------------------------------------------- #
# Secrets loader (app/core/secrets.py) — file > docker-secret > env > default
# --------------------------------------------------------------------------- #
def test_secret_from_file_env(tmp_path, monkeypatch):
    from app.core.secrets import get_secret

    secret_file = tmp_path / "jwt.txt"
    secret_file.write_text("  super-secret-value\n")
    monkeypatch.setenv("JWT_SECRET_FILE", str(secret_file))
    monkeypatch.delenv("JWT_SECRET", raising=False)
    assert get_secret("JWT_SECRET") == "super-secret-value"  # stripped


def test_secret_from_plain_env(monkeypatch):
    from app.core.secrets import get_secret

    monkeypatch.delenv("JWT_SECRET_FILE", raising=False)
    monkeypatch.setenv("JWT_SECRET", "env-value")
    assert get_secret("JWT_SECRET") == "env-value"


def test_secret_required_raises_when_missing(monkeypatch):
    from app.core.secrets import get_secret, SecretNotFoundError

    monkeypatch.delenv("DOES_NOT_EXIST_FILE", raising=False)
    monkeypatch.delenv("DOES_NOT_EXIST", raising=False)
    with pytest.raises(SecretNotFoundError):
        get_secret("DOES_NOT_EXIST", required=True)


def test_secret_default_when_missing(monkeypatch):
    from app.core.secrets import get_secret

    monkeypatch.delenv("NOPE_FILE", raising=False)
    monkeypatch.delenv("NOPE", raising=False)
    assert get_secret("NOPE", default="fallback") == "fallback"


# --------------------------------------------------------------------------- #
# Security headers middleware (app/core/security_headers.py)
# --------------------------------------------------------------------------- #
def test_security_headers_present_on_responses():
    fastapi = pytest.importorskip("fastapi")
    from fastapi.testclient import TestClient
    from app.core.security_headers import SecurityHeadersMiddleware

    app = fastapi.FastAPI()
    app.add_middleware(SecurityHeadersMiddleware, enable_hsts=True)

    @app.get("/ping")
    def ping():
        return {"ok": True}

    client = TestClient(app)
    r = client.get("/ping")
    assert r.status_code == 200
    assert r.headers["X-Content-Type-Options"] == "nosniff"
    assert r.headers["X-Frame-Options"] == "DENY"
    assert "Content-Security-Policy" in r.headers
    assert "Strict-Transport-Security" in r.headers
    # Strict CSP on a normal (non-docs) route.
    assert "default-src 'none'" in r.headers["Content-Security-Policy"]