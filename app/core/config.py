"""Application settings, overridable via environment variables or .env."""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Paths
    data_dir: Path = PROJECT_ROOT / "data"

    # --- LLM provider selection ---
    # Options: "ollama" (local), "groq" (cloud, fast), "openrouter" (cloud, multi-model gateway)
    llm_provider: str = "ollama"
    llm_temperature: float = 0.1

    # Ollama
    llm_model: str = "llama3.2:3b"
    ollama_base_url: str = "http://localhost:11434"

    # Groq
    groq_api_key: str | None = None
    groq_model: str = "llama-3.1-8b-instant"
    groq_vision_model: str = "meta-llama/llama-4-scout-17b-16e-instruct"

    # OpenRouter — OpenAI-compatible gateway with access to Claude, GPT-4,
    # Gemini, Llama, Mistral, and ~100 other models through a single API key.
    # See https://openrouter.ai/models for the full catalog and per-model pricing.
    openrouter_api_key: str | None = None
    openrouter_model: str = "meta-llama/llama-3.3-70b-instruct"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_site_url: str | None = None
    openrouter_app_name: str | None = "GenAI Agent"

    # Embeddings
    embedding_model: str = "BAAI/bge-small-en-v1.5"

    # Retrieval
    chunk_size: int = 800
    chunk_overlap: int = 100
    top_k: int = 4

    # Agent
    max_agent_iterations: int = 6
    memory_window: int = 10

    # Voice — STT
    whisper_model: str = "base"
    whisper_compute_type: str = "int8"
    whisper_language: str | None = None
    enable_voice: bool = True

    # Voice — TTS
    tts_backend: str = "piper"
    piper_voice: str = "en_US-lessac-medium"
    edge_tts_voice: str = "en-US-AriaNeural"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:8501",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8501",
    ]

    # Observability
    langfuse_public_key: str | None = None
    langfuse_secret_key: str | None = None
    langfuse_host: str = "http://localhost:3000"

    # Tools
    enable_web_search: bool = True
    enable_calculator: bool = True
    enable_python_repl: bool = True
    web_search_max_results: int = 4

    # --- OAuth providers ---
    google_oauth_client_id: str = ""
    google_oauth_client_secret: str = ""
    github_oauth_client_id: str = ""
    github_oauth_client_secret: str = ""

    # --- Frontend + backend URLs for OAuth redirect flow ---
    # frontend_url: where we send the browser AFTER successful OAuth login
    # backend_url: the OAuth callback target Google/GitHub redirect back to
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"

    # --- Multi-LLM ensemble ---
    # Two model lists — one for each provider that supports ensemble mode.
    # The active list is selected automatically based on LLM_PROVIDER.
    # OpenRouter's free-tier catalog shifts; verify model availability at
    # https://openrouter.ai/models?q=free before counting on a specific name.
    ensemble_models: str = (
        "llama-3.1-8b-instant,llama-3.3-70b-versatile,openai/gpt-oss-20b"
    )
    ensemble_judge_model: str = "openai/gpt-oss-120b"

    ensemble_models_openrouter: str = (
        "qwen/qwen3-next-80b-a3b-instruct:free,"
        "openai/gpt-oss-20b:free,"
        "google/gemma-4-31b-it:free"
    )
    ensemble_judge_model_openrouter: str = "meta-llama/llama-3.3-70b-instruct:free"

    ensemble_max_tokens: int = 2000
    ensemble_timeout_sec: int = 30

    # --- Database (Postgres for multi-tenant user data) ---
    database_url: str = "postgresql+asyncpg://genai:devpassword@localhost:5432/genai"

    # --- Auth (fastapi-users JWT) ---
    jwt_secret: str = "CHANGE_ME_IN_ENV"
    jwt_lifetime_seconds: int = 604800  # 7 days

    @property
    def docs_dir(self) -> Path:
        return self.data_dir / "docs"

    @property
    def chroma_dir(self) -> Path:
        return self.data_dir / "chroma"

    @property
    def audio_dir(self) -> Path:
        return self.data_dir / "audio"

    @property
    def ensemble_models_list(self) -> list[str]:
        """Candidate models for the currently-active provider's ensemble.

        Returns the Groq list when LLM_PROVIDER=groq, the OpenRouter list
        when LLM_PROVIDER=openrouter. Other providers don't support ensemble.
        """
        provider = self.llm_provider.lower()
        if provider == "openrouter":
            raw = self.ensemble_models_openrouter
        else:
            raw = self.ensemble_models
        return [m.strip() for m in raw.split(",") if m.strip()]

    @property
    def active_judge_model(self) -> str:
        """Judge model for the currently-active provider's ensemble."""
        provider = self.llm_provider.lower()
        if provider == "openrouter":
            return self.ensemble_judge_model_openrouter
        return self.ensemble_judge_model

    @property
    def edge_tts_voice_by_lang(self) -> dict[str, str]:
        return {
            "en": "en-US-AriaNeural",
            "ur": "ur-PK-UzmaNeural",
            "ar": "ar-EG-SalmaNeural",
            "hi": "hi-IN-SwaraNeural",
            "es": "es-ES-ElviraNeural",
            "fr": "fr-FR-DeniseNeural",
            "de": "de-DE-KatjaNeural",
            "it": "it-IT-ElsaNeural",
            "pt": "pt-BR-FranciscaNeural",
            "ru": "ru-RU-SvetlanaNeural",
            "zh": "zh-CN-XiaoxiaoNeural",
            "ja": "ja-JP-NanamiNeural",
            "ko": "ko-KR-SunHiNeural",
            "tr": "tr-TR-EmelNeural",
            "nl": "nl-NL-FennaNeural",
            "pl": "pl-PL-AgnieszkaNeural",
            "sv": "sv-SE-SofieNeural",
            "id": "id-ID-GadisNeural",
            "th": "th-TH-PremwadeeNeural",
            "vi": "vi-VN-HoaiMyNeural",
            "bn": "bn-IN-TanishaaNeural",
            "ta": "ta-IN-PallaviNeural",
            "te": "te-IN-ShrutiNeural",
            "mr": "mr-IN-AarohiNeural",
            "ml": "ml-IN-SobhanaNeural",
            "gu": "gu-IN-DhwaniNeural",
            "kn": "kn-IN-SapnaNeural",
            "fa": "fa-IR-DilaraNeural",
            "he": "he-IL-HilaNeural",
            "el": "el-GR-AthinaNeural",
            "cs": "cs-CZ-VlastaNeural",
            "ro": "ro-RO-AlinaNeural",
            "hu": "hu-HU-NoemiNeural",
            "uk": "uk-UA-PolinaNeural",
            "fil": "fil-PH-BlessicaNeural",
            "ms": "ms-MY-YasminNeural",
            "sw": "sw-TZ-RehemaNeural",
        }


settings = Settings()
for d in (settings.docs_dir, settings.chroma_dir, settings.audio_dir):
    d.mkdir(parents=True, exist_ok=True)