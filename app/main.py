"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api import agent_routes, attachment_routes, rag_routes, voice_routes
from app.core.auth import cookie_backend, fastapi_users, jwt_backend
from app.core.config import settings
from app.core.llm import active_model_name, active_provider
from app.core.logging import configure_logging
from app.core.schemas_user import UserCreate, UserRead, UserUpdate

configure_logging()

app = FastAPI(
    title="GenAI Conversational Automation Agent",
    description="RAG + Agent + Voice. Multi-tenant, Postgres-backed.",
    version=__version__,
)

# IMPORTANT: when allow_credentials=True, allow_origins cannot be ["*"].
# Browsers will reject the response. List origins explicitly. See settings.cors_origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Application routes ------------------------------------------------------
app.include_router(rag_routes.router)
app.include_router(agent_routes.router)
app.include_router(voice_routes.router)
app.include_router(attachment_routes.router)

# --- Auth routes -------------------------------------------------------------
# Two login backends mounted under different prefixes:
#   POST /auth/jwt/login     → returns {access_token, token_type} JSON (for API/curl)
#   POST /auth/cookie/login  → sets httpOnly cookie, returns 204 No Content (for browser)
#   POST /auth/jwt/logout    → no-op (JWT is stateless)
#   POST /auth/cookie/logout → clears the cookie
app.include_router(
    fastapi_users.get_auth_router(jwt_backend),
    prefix="/auth/jwt",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_auth_router(cookie_backend),
    prefix="/auth/cookie",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_verify_router(UserRead),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)


@app.get("/health")
def health():
    """Public health check."""
    return {
        "status": "ok",
        "version": __version__,
        "provider": active_provider(),
        "llm_model": active_model_name(),
        "embedding_model": settings.embedding_model,
        "voice_enabled": settings.enable_voice,
        "tts_backend": settings.tts_backend,
        "indexed": None,
    }


@app.get("/")
def root():
    return {
        "name": "GenAI Agent",
        "version": __version__,
        "docs": "/docs",
        "endpoints": {
            "health": "/health",
            "register": "POST /auth/register",
            "login_bearer": "POST /auth/jwt/login (for API/curl, returns token JSON)",
            "login_cookie": "POST /auth/cookie/login (for browser, sets httpOnly cookie)",
            "logout_cookie": "POST /auth/cookie/logout",
            "me": "GET /users/me",
            "documents": "GET/POST/DELETE /rag/documents",
            "rag_query": "POST /rag/query",
            "agent_chat": "POST /agent/chat",
            "agent_stream": "POST /agent/stream",
            "transcribe": "POST /voice/transcribe",
            "tts": "POST /voice/tts",
        },
    }