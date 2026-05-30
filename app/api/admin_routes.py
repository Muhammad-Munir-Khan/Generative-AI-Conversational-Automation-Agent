"""Admin endpoints - user management + global knowledge base management.

All routes are gated by role (app/core/admin_deps.py):
  - corpus_admin or higher: corpus ingest/stats/sources/search
  - super_admin only:        user listing, role changes, activate/deactivate,
                             edit details, send reset, force logout

Mounted in main.py with: app.include_router(admin_routes.router)
The router already carries the /admin prefix.
"""
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi_users import BaseUserManager
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.admin_deps import require_corpus_admin, require_super_admin
from app.core.auth import get_user_manager
from app.core.db import get_async_session
from app.core.logging import get_logger
from app.core.roles import UserRole
from app.models.user import User
from app.rag.global_collection import (
    add_to_global_corpus,
    delete_by_source,
    global_corpus_count,
    global_search,
    list_sources,
)

log = get_logger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])

MAX_PDF_BYTES = 25 * 1024 * 1024  # 25MB for corpus books


# =============================================================================
# Schemas
# =============================================================================

class AdminUserInfo(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    is_active: bool
    is_verified: bool
    display_name: str | None = None
    created_at: datetime | None = None


class RoleUpdateRequest(BaseModel):
    role: UserRole


class ActiveUpdateRequest(BaseModel):
    is_active: bool


class UserDetailsUpdate(BaseModel):
    display_name: str | None = None


class CorpusItem(BaseModel):
    """One structured item to ingest into the global corpus."""
    text: str = Field(..., min_length=1)
    content_type: str = "book"
    source_title: str | None = None
    language: str | None = None
    scholar: str | None = None
    arabic_text: str | None = None
    translation: str | None = None
    translator: str | None = None
    # quran
    surah_number: int | None = None
    surah_name: str | None = None
    ayah_number: int | None = None
    # hadith
    collection: str | None = None
    hadith_number: str | None = None
    book_name: str | None = None
    narrator_chain: str | None = None
    grading: str | None = None
    grading_source: str | None = None
    # tafsir/fiqh/book
    book_title: str | None = None
    author: str | None = None
    madhab: str | None = None
    topic: str | None = None
    volume: str | None = None
    page: str | None = None


class CorpusIngestRequest(BaseModel):
    items: list[CorpusItem] = Field(..., min_length=1)


class CorpusIngestResponse(BaseModel):
    inserted: int
    total_in_corpus: int
    message: str


class CorpusStats(BaseModel):
    total: int


class SystemStats(BaseModel):
    total_users: int
    corpus_total: int


# =============================================================================
# User management (super_admin only)
# =============================================================================

@router.get("/users", response_model=list[AdminUserInfo])
async def list_users(
    admin: User = Depends(require_super_admin),
    session: AsyncSession = Depends(get_async_session),
):
    """List all users with their roles. Super-admin only."""
    result = await session.execute(select(User))
    users = result.scalars().unique().all()
    return [
        AdminUserInfo(
            id=u.id,
            email=u.email,
            role=getattr(u, "role", UserRole.user.value),
            is_active=u.is_active,
            is_verified=u.is_verified,
            display_name=getattr(u, "display_name", None),
            created_at=getattr(u, "created_at", None),
        )
        for u in users
    ]


@router.patch("/users/{user_id}/role", response_model=AdminUserInfo)
async def set_user_role(
    user_id: uuid.UUID,
    req: RoleUpdateRequest,
    admin: User = Depends(require_super_admin),
    session: AsyncSession = Depends(get_async_session),
):
    """Change a user's role. Super-admin only.

    Keeps is_superuser in sync (super_admin <-> True) directly here, since this
    updates the DB row outside the fastapi-users manager flow.
    """
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalars().unique().one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin.id and req.role != UserRole.super_admin:
        raise HTTPException(
            status_code=400,
            detail="You cannot change your own super_admin role.",
        )

    is_super = req.role == UserRole.super_admin
    await session.execute(
        update(User)
        .where(User.id == user_id)
        .values(role=req.role.value, is_superuser=is_super)
    )
    await session.commit()

    return AdminUserInfo(
        id=user.id,
        email=user.email,
        role=req.role.value,
        is_active=user.is_active,
        is_verified=user.is_verified,
        display_name=getattr(user, "display_name", None),
        created_at=getattr(user, "created_at", None),
    )


@router.patch("/users/{user_id}/active", response_model=AdminUserInfo)
async def set_user_active(
    user_id: uuid.UUID,
    req: ActiveUpdateRequest,
    admin: User = Depends(require_super_admin),
    session: AsyncSession = Depends(get_async_session),
):
    """Activate or deactivate a user. Super-admin only."""
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalars().unique().one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin.id and not req.is_active:
        raise HTTPException(
            status_code=400, detail="You cannot deactivate your own account."
        )

    await session.execute(
        update(User).where(User.id == user_id).values(is_active=req.is_active)
    )
    await session.commit()

    return AdminUserInfo(
        id=user.id,
        email=user.email,
        role=getattr(user, "role", UserRole.user.value),
        is_active=req.is_active,
        is_verified=user.is_verified,
        display_name=getattr(user, "display_name", None),
        created_at=getattr(user, "created_at", None),
    )


@router.patch("/users/{user_id}", response_model=AdminUserInfo)
async def edit_user_details(
    user_id: uuid.UUID,
    req: UserDetailsUpdate,
    admin: User = Depends(require_super_admin),
    session: AsyncSession = Depends(get_async_session),
):
    """Edit a user's display name. Super-admin only.

    Email is intentionally NOT editable here (login identity + tied to OAuth).
    """
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalars().unique().one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    await session.execute(
        update(User).where(User.id == user_id).values(display_name=req.display_name)
    )
    await session.commit()

    return AdminUserInfo(
        id=user.id,
        email=user.email,
        role=getattr(user, "role", UserRole.user.value),
        is_active=user.is_active,
        is_verified=user.is_verified,
        display_name=req.display_name,
        created_at=getattr(user, "created_at", None),
    )


@router.post("/users/{user_id}/send-reset")
async def send_password_reset(
    user_id: uuid.UUID,
    admin: User = Depends(require_super_admin),
    session: AsyncSession = Depends(get_async_session),
    user_manager: BaseUserManager = Depends(get_user_manager),
):
    """Trigger a password-reset email to the target user. Super-admin only.

    Reuses the fastapi-users forgot_password flow (generates token, calls
    on_after_forgot_password -> our UserManager sends the email).
    """
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalars().unique().one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        await user_manager.forgot_password(user)
    except Exception as e:
        log.exception("admin-triggered reset failed for %s", user.email)
        raise HTTPException(status_code=500, detail=f"Could not send reset: {e}")

    log.info("admin %s sent password reset to %s", admin.email, user.email)
    return {"status": "sent", "email": user.email}


@router.post("/users/{user_id}/force-logout")
async def force_logout(
    user_id: uuid.UUID,
    admin: User = Depends(require_super_admin),
    session: AsyncSession = Depends(get_async_session),
):
    """Invalidate every JWT issued to the user before NOW. Super-admin only.

    Sets users.jwt_invalidated_at = now(). The fresh-user auth dependency
    rejects any token whose iat predates this timestamp. The user can log
    in again to get a fresh token.

    Self-protection: an admin cannot force-logout themselves (lockout risk).
    """
    if user_id == admin.id:
        raise HTTPException(
            status_code=400, detail="You cannot force-logout yourself."
        )

    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalars().unique().one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    now = datetime.now(timezone.utc)
    await session.execute(
        update(User).where(User.id == user_id).values(jwt_invalidated_at=now)
    )
    await session.commit()

    log.info("admin %s force-logged-out %s", admin.email, user.email)
    return {"status": "ok", "email": user.email, "invalidated_at": now.isoformat()}


# =============================================================================
# Corpus management (corpus_admin or higher)
# =============================================================================

@router.post("/corpus/ingest", response_model=CorpusIngestResponse)
async def ingest_structured(
    req: CorpusIngestRequest,
    admin: User = Depends(require_corpus_admin),
):
    """Ingest structured content (JSON) into the global corpus.

    Each item carries explicit metadata for citation. Use this path for any
    content that needs precise citation (Quran, hadith, etc.).
    """
    items = [it.model_dump(exclude_none=True) for it in req.items]
    try:
        inserted = add_to_global_corpus(items)
    except Exception as e:
        log.exception("corpus ingest failed")
        raise HTTPException(status_code=500, detail=f"Ingest failed: {e}")

    total = global_corpus_count()
    log.info("admin %s ingested %d items into global corpus", admin.email, inserted)
    return CorpusIngestResponse(
        inserted=inserted,
        total_in_corpus=total,
        message=f"Ingested {inserted} items. Corpus now holds {total}.",
    )


@router.post("/corpus/upload", response_model=CorpusIngestResponse)
async def ingest_file(
    file: UploadFile = File(...),
    content_type: str = "document",
    source_title: str | None = None,
    author: str | None = None,
    admin: User = Depends(require_corpus_admin),
):
    """Ingest a document file into the global knowledge base.

    Accepts any file type the per-user RAG handles (.pdf, .txt, .md, .docx).
    The file is parsed + chunked using the same loaders as per-user RAG, then
    each chunk is embedded and inserted into the global corpus with the
    metadata you pass (content_type, source_title, author).

    content_type is free-form: pass whatever label suits your knowledge base
    (e.g. "document", "policy", "manual", "research", "hadith", ...).
    """
    from app.rag.ingestion import SUPPORTED_EXTENSIONS, _load_one, chunk_documents
    import tempfile

    if not file.filename:
        raise HTTPException(status_code=400, detail="filename required")
    safe_name = Path(file.filename).name
    suffix = Path(safe_name).suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type {suffix}. "
                   f"Supported: {sorted(SUPPORTED_EXTENSIONS)}",
        )

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty file")
    if len(data) > MAX_PDF_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max {MAX_PDF_BYTES // (1024*1024)}MB.",
        )

    tmp_path = Path(tempfile.gettempdir()) / safe_name
    tmp_path.write_bytes(data)
    try:
        raw = _load_one(tmp_path)
        chunks = chunk_documents(raw)
        items = [
            {
                "text": c.page_content,
                "content_type": content_type,
                "source_title": source_title or safe_name,
                "author": author,
                "page": str(c.metadata.get("page", "")),
            }
            for c in chunks
        ]
        inserted = add_to_global_corpus(items)
    except Exception as e:
        log.exception("file ingest failed: %s", safe_name)
        raise HTTPException(status_code=500, detail=f"Ingest failed: {e}")
    finally:
        tmp_path.unlink(missing_ok=True)

    total = global_corpus_count()
    log.info("admin %s ingested %s (%d chunks)", admin.email, safe_name, inserted)
    return CorpusIngestResponse(
        inserted=inserted,
        total_in_corpus=total,
        message=f"Ingested {inserted} chunks from {safe_name}. Corpus now holds {total}.",
    )


@router.get("/corpus/stats", response_model=CorpusStats)
async def corpus_stats(admin: User = Depends(require_corpus_admin)):
    """Total objects in the global corpus."""
    return CorpusStats(total=global_corpus_count())


class CorpusSourceInfo(BaseModel):
    source_title: str
    content_type: str
    chunk_count: int


class CorpusSearchHit(BaseModel):
    text: str
    score: float
    source_title: str | None = None
    content_type: str | None = None
    author: str | None = None
    page: str | None = None


class CorpusSearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    k: int = 8
    content_type: str | None = None
    alpha: float = 0.5


class CorpusSearchResponse(BaseModel):
    hits: list[CorpusSearchHit]


@router.get("/corpus/sources", response_model=list[CorpusSourceInfo])
async def corpus_sources(admin: User = Depends(require_corpus_admin)):
    """List every source in the knowledge base (grouped by source_title).

    Shows how many chunks each source contributed + its content_type. Sorted
    most-chunks-first. Empty list if the corpus is empty or aggregation
    fails (logs a warning).
    """
    rows = list_sources()
    return [CorpusSourceInfo(**r) for r in rows]


@router.delete("/corpus/sources")
async def delete_corpus_source(
    source_title: str,
    admin: User = Depends(require_corpus_admin),
):
    """Delete every chunk whose source_title matches exactly. corpus_admin+.

    `source_title` comes as a query parameter (not a path segment) because
    titles can contain slashes and arbitrary punctuation.
    """
    if not source_title or not source_title.strip():
        raise HTTPException(status_code=400, detail="source_title required")
    deleted = delete_by_source(source_title)
    log.info("admin %s deleted source %r (%d chunks)", admin.email, source_title, deleted)
    return {"source_title": source_title, "deleted": deleted}


@router.post("/corpus/search", response_model=CorpusSearchResponse)
async def search_corpus(
    req: CorpusSearchRequest,
    admin: User = Depends(require_corpus_admin),
):
    """Hybrid (BM25 + vector) search over the knowledge base.

    Admin-only search/preview tool: lets you sanity-check what's retrievable
    for a query. Uses the same `global_search` your RAG agent uses.

    alpha: 0.0 = pure keyword, 1.0 = pure vector, 0.5 = balanced.
    """
    results = global_search(
        query=req.query,
        k=max(1, min(req.k, 50)),
        content_type=req.content_type,
        alpha=req.alpha,
    )
    hits: list[CorpusSearchHit] = []
    for doc, score in results:
        meta = doc.metadata or {}
        hits.append(CorpusSearchHit(
            text=doc.page_content,
            score=float(score),
            source_title=meta.get("source_title"),
            content_type=meta.get("content_type"),
            author=meta.get("author"),
            page=str(meta.get("page", "")) or None,
        ))
    return CorpusSearchResponse(hits=hits)


# =============================================================================
# System overview
# =============================================================================

@router.get("/stats", response_model=SystemStats)
async def system_stats(
    admin: User = Depends(require_super_admin),
    session: AsyncSession = Depends(get_async_session),
):
    """High-level system stats for the admin dashboard."""
    from sqlalchemy import func
    result = await session.execute(select(func.count()).select_from(User))
    total_users = int(result.scalar() or 0)
    return SystemStats(total_users=total_users, corpus_total=global_corpus_count())