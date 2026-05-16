"""Tool: web search via DuckDuckGo (no API key required)."""
from langchain_core.tools import tool

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__)


@tool
def web_search(query: str) -> str:
    """Search the public web for current or general information.

    Use this when the user asks about recent events, real-time facts, or
    information that is unlikely to be in their personal documents.

    Args:
        query: A short search query (3-8 words works best).

    Returns:
        A bullet list of the top results with title, snippet, and URL.
    """
    try:
        from ddgs import DDGS
    except ImportError:  # fallback to old package name
        from duckduckgo_search import DDGS

    try:
        with DDGS() as ddgs:
            results = list(
                ddgs.text(query, max_results=settings.web_search_max_results)
            )
    except Exception as e:
        log.warning("web search failed: %s", e)
        return f"Web search failed: {e}"

    if not results:
        return "No web results found."

    lines = []
    for r in results:
        title = r.get("title", "Untitled")
        snippet = r.get("body", "").strip()
        url = r.get("href") or r.get("url", "")
        lines.append(f"- {title}\n  {snippet}\n  {url}")
    return "\n".join(lines)
