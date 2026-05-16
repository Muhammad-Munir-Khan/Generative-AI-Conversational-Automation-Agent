"""Vectorstore retrieval — scoped to the current user via contextvar."""
from langchain_core.documents import Document

from app.rag.collections import get_user_vectorstore
from app.rag.user_context import get_current_user
from app.core.config import settings


def retrieve(query: str, k: int | None = None) -> list[tuple[Document, float]]:
    """Return [(doc, similarity_score), ...] for the CURRENT user's collection.

    The user_id is read from the contextvar set by the API route. Tools
    invoked by the agent inherit this context automatically.
    """
    k = k or settings.top_k
    user_id = get_current_user()
    store = get_user_vectorstore(user_id)
    pairs = store.similarity_search_with_relevance_scores(query, k=k)
    return pairs


def has_documents() -> bool:
    """Check if the CURRENT user's collection has any indexed content."""
    try:
        user_id = get_current_user()
        store = get_user_vectorstore(user_id)
        return store._collection.count() > 0
    except Exception:
        return False


def has_documents_for(user_id: str) -> bool:
    """Same check, explicit user_id (used by /health endpoint)."""
    try:
        store = get_user_vectorstore(user_id)
        return store._collection.count() > 0
    except Exception:
        return False