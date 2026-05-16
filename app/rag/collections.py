"""Per-user Chroma collection management.

Each user gets their own Chroma collection named `user_<hex>` where <hex> is
the user's UUID with dashes stripped. Chroma collection names must:
  - Be 3-63 chars
  - Start and end with alphanumeric
  - Contain only alphanumerics, underscores, hyphens, dots
  - Not contain consecutive dots

`user_<32 hex chars>` is 37 chars, well within limits.
"""
import shutil
import uuid
from pathlib import Path

from langchain_chroma import Chroma

from app.core.config import settings
from app.core.logging import get_logger
from app.rag.embeddings import get_embeddings

log = get_logger(__name__)


def collection_name_for(user_id: str | uuid.UUID) -> str:
    """Return the Chroma collection name for a given user."""
    if isinstance(user_id, str):
        user_id = uuid.UUID(user_id)
    return f"user_{user_id.hex}"


def docs_dir_for(user_id: str | uuid.UUID) -> Path:
    """Return the on-disk doc folder for a user. Creates it if missing."""
    if isinstance(user_id, str):
        user_id = uuid.UUID(user_id)
    path = settings.docs_dir / user_id.hex
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_user_vectorstore(user_id: str | uuid.UUID) -> Chroma:
    """Open (or create) a user's Chroma collection.

    All collections live under the same persist_directory (settings.chroma_dir);
    Chroma keeps them logically separate by collection_name. No directory-per-user
    setup is needed.
    """
    return Chroma(
        persist_directory=str(settings.chroma_dir),
        embedding_function=get_embeddings(),
        collection_name=collection_name_for(user_id),
    )


def delete_user_collection(user_id: str | uuid.UUID) -> None:
    """Drop a user's collection entirely. Used on account deletion."""
    store = get_user_vectorstore(user_id)
    try:
        store.delete_collection()
        log.info("deleted collection for user %s", user_id)
    except Exception as e:
        log.warning("failed to delete collection for %s: %s", user_id, e)


def delete_user_docs_dir(user_id: str | uuid.UUID) -> None:
    """Remove a user's docs folder and all its files."""
    path = docs_dir_for(user_id)
    if path.exists():
        shutil.rmtree(path)
        log.info("deleted docs dir for user %s", user_id)