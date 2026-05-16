"""Text-to-speech with two backends: Piper (offline) and Edge TTS (online).

Backend chosen by settings.tts_backend: "piper" or "edge".
Edge backend supports per-language neural voices via settings.edge_tts_voice_by_lang.
"""
import asyncio
import io
import urllib.request
import wave
from functools import lru_cache
from pathlib import Path

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__)


# =============================================================================
# Edge TTS backend (Microsoft cloud, high-quality, requires internet)
# =============================================================================

def _resolve_edge_voice(language: str) -> str:
    """Pick the right Edge TTS voice for the given language code.

    Falls back to the configured default English voice for unknown codes.
    """
    voice_map = settings.edge_tts_voice_by_lang
    if language and language in voice_map:
        return voice_map[language]
    return settings.edge_tts_voice


def _synthesize_edge(text: str, language: str = "en") -> bytes:
    """Use Microsoft Edge's neural voices via edge-tts.

    NOTE: edge-tts uses an undocumented Microsoft API. Free, no key, but
    Microsoft could change or revoke access at any time. Returns MP3 bytes.
    """
    try:
        import edge_tts
    except ImportError as e:
        raise RuntimeError(
            "edge-tts is not installed. Run: pip install edge-tts"
        ) from e

    voice = _resolve_edge_voice(language)
    log.debug("Edge TTS synthesizing in %s with voice %s", language, voice)

    async def _run() -> bytes:
        communicate = edge_tts.Communicate(text, voice=voice)
        buf = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                buf.write(chunk["data"])
        return buf.getvalue()

    return asyncio.run(_run())


# =============================================================================
# Piper backend (local, offline, English-only with the bundled voice)
# =============================================================================

VOICES_DIR = Path.home() / ".cache" / "piper-voices"
VOICE_BASE_URL = (
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/"
)
VOICE_FILES = {
    "en_US-lessac-medium.onnx": VOICE_BASE_URL + "en_US-lessac-medium.onnx",
    "en_US-lessac-medium.onnx.json": VOICE_BASE_URL + "en_US-lessac-medium.onnx.json",
}


def _ensure_piper_voice() -> Path:
    VOICES_DIR.mkdir(parents=True, exist_ok=True)
    onnx_path = VOICES_DIR / "en_US-lessac-medium.onnx"
    json_path = VOICES_DIR / "en_US-lessac-medium.onnx.json"
    for name, url in VOICE_FILES.items():
        target = VOICES_DIR / name
        if target.exists() and target.stat().st_size > 0:
            continue
        log.info("downloading piper voice file %s", name)
        urllib.request.urlretrieve(url, target)
    if not onnx_path.exists() or not json_path.exists():
        raise RuntimeError("Failed to download Piper voice files")
    return onnx_path


@lru_cache(maxsize=1)
def _get_piper_voice():
    from piper import PiperVoice
    onnx = _ensure_piper_voice()
    return PiperVoice.load(str(onnx))


def _synthesize_piper(text: str) -> bytes:
    voice = _get_piper_voice()
    buf = io.BytesIO()

    if hasattr(voice, "synthesize_wav"):
        with wave.open(buf, "wb") as wav:
            voice.synthesize_wav(text, wav)
        return buf.getvalue()

    if hasattr(voice, "synthesize"):
        chunks = list(voice.synthesize(text))
        if not chunks:
            raise RuntimeError("Piper produced no audio chunks")
        first = chunks[0]
        sample_rate = getattr(first, "sample_rate", 22050)
        sample_width = getattr(first, "sample_width", 2)
        channels = getattr(first, "sample_channels", 1)
        with wave.open(buf, "wb") as wav:
            wav.setnchannels(channels)
            wav.setsampwidth(sample_width)
            wav.setframerate(sample_rate)
            for ch in chunks:
                data = getattr(ch, "audio_int16_bytes", None)
                if data is None:
                    data = getattr(ch, "audio", b"")
                if isinstance(data, memoryview):
                    data = bytes(data)
                wav.writeframes(data)
        return buf.getvalue()

    raise RuntimeError("Installed piper-tts has no recognized synthesis method.")


# =============================================================================
# Public API
# =============================================================================

def synthesize(text: str, language: str = "en") -> bytes:
    """Synthesize text → audio bytes (WAV for Piper, MP3 for Edge).

    The `language` parameter only affects the Edge backend, where it
    selects a matching neural voice. Piper uses its bundled English voice
    regardless — switch to Edge if you need multilingual TTS.
    """
    if not settings.enable_voice:
        raise RuntimeError("Voice features are disabled (settings.enable_voice).")

    backend = settings.tts_backend.lower()
    if backend == "edge":
        return _synthesize_edge(text, language=language)
    if backend == "piper":
        if language and language != "en":
            log.warning(
                "Piper backend only supports English; ignoring language=%s. "
                "Switch TTS_BACKEND=edge for multilingual support.",
                language,
            )
        return _synthesize_piper(text)
    raise ValueError(f"Unknown tts_backend: {settings.tts_backend!r}")


def get_media_type() -> str:
    """Return the MIME type the current backend produces."""
    return "audio/mpeg" if settings.tts_backend.lower() == "edge" else "audio/wav"