"""Langfuse observability - LLM/agent tracing.

Wires Langfuse (cloud or self-hosted) into the agent via the LangChain
callback handler. Captures every agent run as a nested trace: LLM calls,
tool calls, latencies, token counts, and cost.

DESIGN PRINCIPLE: observability is additive instrumentation, never a
dependency. If keys are missing, or Langfuse is unreachable, or the SDK
fails to initialize, the app runs exactly as before with zero traces. The
core product must never break because of the observability layer.

Langfuse Python SDK v4: the client is initialized once from settings, and
CallbackHandler() reads credentials from that initialized client (it takes
no key arguments in v4). Import path is `langfuse.langchain`.
"""
from functools import lru_cache

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__)


def _langfuse_configured() -> bool:
    """True only if both keys are present (host has a sane default)."""
    return bool(settings.langfuse_public_key and settings.langfuse_secret_key)


@lru_cache(maxsize=1)
def _init_client():
    """Initialize the Langfuse client once. Returns the client or None.

    Cached so we only construct the client a single time. Any failure here
    (bad keys, network, SDK import issue) degrades to None - tracing off,
    app unaffected.
    """
    if not _langfuse_configured():
        log.info("Langfuse not configured (keys missing) - tracing disabled.")
        return None

    try:
        from langfuse import Langfuse

        client = Langfuse(
            public_key=settings.langfuse_public_key,
            secret_key=settings.langfuse_secret_key,
            host=settings.langfuse_host,
        )
        log.info("Langfuse client initialized (host=%s)", settings.langfuse_host)
        return client
    except Exception as e:
        log.warning("Langfuse client init failed - tracing disabled: %s", e)
        return None


def get_langfuse_handler():
    """Return a LangChain CallbackHandler for Langfuse, or None.

    Pass the result into a LangGraph/LangChain config like:
        handler = get_langfuse_handler()
        config = {"callbacks": [handler] if handler else [], ...}

    Returns None when tracing is unconfigured or unavailable, so callers can
    safely do `[handler] if handler else []`.
    """
    client = _init_client()
    if client is None:
        return None

    try:
        from langfuse.langchain import CallbackHandler

        # In SDK v4 the handler reads credentials from the initialized client
        # above; it takes no key arguments.
        return CallbackHandler()
    except Exception as e:
        log.warning("Langfuse CallbackHandler unavailable - tracing off: %s", e)
        return None


def flush_langfuse() -> None:
    """Flush buffered events. Safe to call even when tracing is disabled.

    Langfuse batches events and sends them asynchronously. In short-lived
    contexts you may want to force a flush; for a long-running server this is
    largely handled automatically, but exposing it is harmless.
    """
    client = _init_client()
    if client is None:
        return
    try:
        client.flush()
    except Exception as e:
        log.debug("Langfuse flush failed (non-fatal): %s", e)