"""Attachment endpoints: extract text, optionally persist to docs. Auth required.

Beyond text extraction, the raw uploaded file is also saved into the user's
per-user workspace folder (data/repl_workspace/<user_hex>/) so that the
python_repl and csv_reader tools can find it by its original filename in
subsequent agent turns.
"""
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.core.auth import current_active_user
from app.core.config import settings
from app.core.logging import get_logger
from app.models.user import User
from app.rag.extraction import extract_attachment

log = get_logger(__name__)
router = APIRouter(prefix="/attachments", tags=["attachments"])


class ExtractResponse(BaseModel):
    filename: str
    text: str
    method: str
    pages_processed: int
    size_bytes: int
    char_count: int


def _sanitize_filename(name: str) -> str:
    """Strip directory components and unsafe characters from an uploaded
    filename so we can use it safely as a path inside the user's workspace.
    """
    # Path(name).name drops any directory parts (defense against ../../).
    base = Path(name).name
    # Replace anything that isn't alnum, dot, dash, underscore.
    safe = "".join(c if c.isalnum() or c in "._-" else "_" for c in base)
    # Avoid pathological empty names.
    return safe or "upload.bin"


def _save_to_user_workspace(user: User, filename: str, data: bytes) -> Path | None:
    """Save the raw uploaded bytes into the user's repl_workspace folder so
    python_repl and csv_reader can find the file by name.

    Best-effort: if this fails (disk full, permissions, etc.) the request
    still succeeds because the extracted text is enough for most uses.
    """
    try:
        workspace = settings.data_dir / "repl_workspace" / user.id.hex
        workspace.mkdir(parents=True, exist_ok=True)
        target = workspace / _sanitize_filename(filename)
        target.write_bytes(data)
        log.info(
            "saved attachment %s to user workspace %s (%d bytes)",
            target.name, user.id.hex, len(data),
        )
        return target
    except Exception as e:
        log.warning("failed to save attachment to user workspace: %s", e)
        return None


@router.post("/extract", response_model=ExtractResponse)
async def extract(
    file: UploadFile = File(...),
    persist: bool = Form(False),
    user: User = Depends(current_active_user),
):
    """Extract text from an uploaded file. Optionally persist into data/docs.

    The raw file is ALWAYS also saved into the user's repl_workspace folder
    so python_repl and csv_reader can read it by filename.

    NOTE: `persist=True` re-indexes the SHARED corpus, which all users currently
    query. To prevent random users from polluting it, persist+reindex is now
    restricted to superusers.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="filename required")

    if persist and not user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Only admins can persist documents to the shared corpus. "
                   "Per-user document upload coming in Phase 2c.",
        )

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty file")

    # Save raw file to the user's private workspace BEFORE extraction so that
    # tools can find it even if extraction later fails. Best-effort.
    _save_to_user_workspace(user, file.filename, data)

    try:
        result = extract_attachment(file.filename, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        log.exception("extraction failed")
        raise HTTPException(status_code=500, detail=f"Extraction failed: {e}")

    if persist:
        # Save the original file into data/docs and re-index.
        target = settings.docs_dir / Path(file.filename).name
        target.write_bytes(data)
        log.info("persisted attachment to %s", target)
        # Trigger background re-ingest. Synchronous is fine for small corpora.
        try:
            from app.rag.ingestion import ingest
            ingest()
        except Exception as e:
            log.warning("re-ingest after persist failed: %s", e)

    return ExtractResponse(
        filename=file.filename,
        text=result["text"],
        method=result["method"],
        pages_processed=result["pages_processed"],
        size_bytes=result["size_bytes"],
        char_count=len(result["text"]),
    )