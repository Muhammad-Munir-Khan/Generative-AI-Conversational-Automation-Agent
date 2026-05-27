"""Vectorstore retrieval - scoped to the current user via contextvar.

Every query is routed to the current user's Weaviate tenant. Cross-tenant
reads are impossible: search_for() always passes the tenant, and the store has
multi-tenancy enabled so a missing tenant raises rather than leaking.
"""
from langchain_core.documents import Document

from app.rag.collections import count_for, search_for
from app.rag.user_context import get_current_user
from app.core.config import settings


def retrieve(query: str, k: int | None = None) -> list[tuple[Document, float]]:
    """Return [(doc, similarity_score), ...] for the CURRENT user's tenant.

    The user_id is read from the contextvar set by the API route. Tools
    invoked by the agent inherit this context automatically.
    """
    k = k or settings.top_k
    user_id = get_current_user()
    return search_for(user_id, query, k)


def has_documents() -> bool:
    """Check if the CURRENT user's tenant has any indexed content."""
    try:
        user_id = get_current_user()
        return count_for(user_id) > 0
    except Exception:
        return False


def has_documents_for(user_id: str) -> bool:
    """Same check, explicit user_id (used by /health endpoint)."""
    try:
        return count_for(user_id) > 0
    except Exception:
        return False