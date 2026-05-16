# CLAUDE.md

Guidance for Claude Code working in this repository.

## What this project is

End-to-end conversational agent: RAG + tool-using agent + voice I/O + Docker deployment. Fully open-source, no paid APIs. Targets local CPU inference (Llama 3.2 3B via Ollama).

## Commands

**Run all services locally** (three terminals):

```bash
ollama serve                                                       # 1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000           # 2
streamlit run ui/streamlit_app.py                                  # 3
```

**Re-index documents:** `python scripts/ingest.py`

**Smoke test the API:** `python scripts/smoke_test.py`

**Run unit tests:** `pytest`

**RAG quality eval:** `pip install -r requirements-eval.txt && python evals/ragas_eval.py`

**Docker:** `cd docker && docker compose up --build`

## Architecture in one diagram

```
UI (Streamlit) ─► API (FastAPI) ─┬─► RAG chain ─► Chroma ─► LLM
                                 ├─► Agent (LangGraph) ─► tools (doc/web/calc)
                                 ├─► STT (faster-whisper)
                                 └─► TTS (Piper)
                                 LLM via Ollama (llama3.2:3b)
```

Read `docs/ARCHITECTURE.md` for the full design.

## Key design decisions to preserve

1. **Agent uses RAG as a tool, not a pre-step.** The LLM decides per turn whether documents are relevant. Don't change `/agent/chat` to always retrieve.
2. **Memory persists only Human+AI pairs**, not tool messages. This keeps context clean. Don't add tool messages to `memory.append`.
3. **Singletons via `lru_cache`.** Vectorstore, embeddings, LLM, Whisper model. Restart the process to reload them — don't add invalidation logic without good reason.
4. **Calculator is AST-based with a strict whitelist.** Never replace with `eval()`. Tests in `tests/test_calculator.py` enforce this.
5. **Sources surface at two layers.** Both `document_search` (text) and `_extract_sources` (structured for the UI). Keep both — the LLM might drop citations, the UI shouldn't.

## File map

- `app/core/` — config, logging, llm factory, schemas
- `app/rag/` — ingestion, embeddings, retrieval, single-shot chain
- `app/agent/` — LangGraph state machine, in-memory session store
- `app/tools/` — three @tool functions + registry
- `app/voice/` — faster-whisper STT, Piper TTS
- `app/api/` — FastAPI routers
- `ui/` — Streamlit app
- `scripts/` — CLI helpers
- `tests/` — pytest suite (no Ollama required)
- `evals/` — Ragas RAG quality eval
- `docker/` — Dockerfiles and compose
- `data/docs/` — user PDFs / TXT / MD live here

## Configuration

All settings in `app/core/config.py`. Override via `.env` (copy from `.env.example`). Most tweaked: `LLM_MODEL`, `TOP_K`, `CHUNK_SIZE`, `MEMORY_WINDOW`.

## When extending

- New tool → drop in `app/tools/`, register in `tools/registry.py`. The agent picks it up automatically.
- New endpoint → add a router in `app/api/`, include it in `app/main.py`.
- New file type for ingestion → extend `_load_one` in `app/rag/ingestion.py` and add to `SUPPORTED_EXTENSIONS`.
- Different vector DB → change `app/rag/retrieval.py` and `app/rag/ingestion.py`. The interface is `similarity_search_with_relevance_scores`.

## Things to ask the user before doing

- Pulling new Ollama models (large download)
- Installing new system packages (apt, brew)
- Anything that wipes `data/chroma/` or `data/docs/`
- Pushing to git
