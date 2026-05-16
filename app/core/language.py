"""Language utilities used across the agent, ensemble, and RAG chain.

The dropdown in the UI sends ISO-639-1 codes (e.g., "en", "ur", "ar"). We
translate those into a system-prompt directive that forces the LLM to
respond in that language and translate any English tool/document outputs.
"""

LANGUAGE_NAMES: dict[str, str] = {
    "en": "English",
    "ur": "Urdu",
    "ar": "Arabic",
    "hi": "Hindi",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "ru": "Russian",
    "zh": "Chinese",
    "ja": "Japanese",
    "ko": "Korean",
    "tr": "Turkish",
    "nl": "Dutch",
    "pl": "Polish",
    "sv": "Swedish",
    "id": "Indonesian",
    "th": "Thai",
    "vi": "Vietnamese",
    "bn": "Bengali",
    "ta": "Tamil",
    "te": "Telugu",
    "mr": "Marathi",
    "ml": "Malayalam",
    "gu": "Gujarati",
    "kn": "Kannada",
    "fa": "Persian",
    "he": "Hebrew",
    "el": "Greek",
    "cs": "Czech",
    "ro": "Romanian",
    "hu": "Hungarian",
    "uk": "Ukrainian",
    "fil": "Filipino",
    "ms": "Malay",
    "sw": "Swahili",
}


def language_directive(language: str | None) -> str:
    """Return a system-prompt suffix that forces the response language.

    Returns an empty string for English (no directive needed) or unknown codes.
    """
    if not language or language == "en":
        return ""
    name = LANGUAGE_NAMES.get(language)
    if not name:
        return ""
    return (
        f"\n\nIMPORTANT: You MUST respond entirely in {name}. "
        f"Translate any English tool outputs (weather, web search results, "
        f"document snippets, calculator results, etc.) into {name} before "
        f"presenting them to the user. Use proper {name} script and natural "
        f"phrasing. Do not mix English with {name} unless the user explicitly "
        f"asks for it. Code, identifiers, and proper nouns may stay in their "
        f"original form."
    )