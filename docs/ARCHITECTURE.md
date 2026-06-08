# Architecture

This document describes the design of the GenAI Conversational Automation Agent: what each component does, why it's there, and what the alternatives were.

## Goals

1. **Local-first.** The system must run on a developer laptop with no paid APIs.
2. **Modular.** Swapping the LLM, vector store, or embedder should be a one-line change.
3. **Production-shaped.** The code should look like something you'd ship, not a notebook.
4. **Honest.** No fake AGI claims; the agent answers from documents, the web, or arithmetic — and says so.

## Layers

### Core (`app/core/`)

Cross-cutting concerns. `config.py` is `pydantic-settings`-based so every setting can be overridden via environment variables or a `.env`. `llm.py` wraps `ChatOllama` with `lru_cache` so we don't recreate the client on every request. `schemas.py` holds every Pydantic model used at the API boundary, in one place.

### RAG (`app/rag/`)

The retrieval pipeline. `ingestion.py` walks `data/docs/`, loads each file with the right LangChain loader (PyPDFLoader for PDFs, TextLoader for text/markdown), splits into ~800-char chunks with 100-char overlap using `RecursiveCharacterTextSplitter`, embeds with `BAAI/bge-small-en-v1.5`, and persists to Chroma. `retrieval.py` exposes `similarity_search_with_relevance_scores` so the API can show ranking confidence. `chain.py` is the single-shot RAG: retrieve → format context with `[i] filename (p.X)` headers → invoke LLM with a strict system prompt that mandates citations and an "I don't know" fallback.

### Tools (`app/tools/`)

Three tools, each a `@tool`-decorated function that LangChain can introspect:

- **document_search** — wraps the RAG chain. Returns text + source list.
- **web_search** — DuckDuckGo via `ddgs`. No API key. Returns a bullet list with title, snippet, URL.
- **calculator** — a hand-rolled AST evaluator that whitelists arithmetic operators only. Refuses names, function calls, and imports. Tested against malicious input.

`registry.py` aggregates them based on settings flags.

### Agent (`app/agent/`)

The conversational engine, built on LangGraph. The state machine has two nodes:

```
START → agent → ┬→ tools → agent → ...
                └→ END
```

`agent` is the LLM with tools bound; it produces either a final answer or a `tool_calls` array. `tools` is a prebuilt `ToolNode` that executes the requested tools in parallel and appends `ToolMessage`s back to the state. The conditional edge re-enters `agent` whenever there are tool calls, falls through to `END` otherwise. Recursion is bounded by `max_agent_iterations` to prevent runaway loops.

`memory.py` is a simple in-process store keyed by `session_id`, with a per-session `deque(maxlen=N*2)`. Thread-safe via a `Lock`. For multi-replica deployments, the interface is small enough to swap for a Redis backend in ~50 lines.

A subtle but important design choice: we persist only the *human/assistant* pair to memory, not the intermediate tool messages. This keeps the LLM's context clean across turns and prevents memory bloat from large tool outputs.

### Voice (`app/voice/`)

`stt.py` wraps faster-whisper. The `WhisperModel` is `lru_cache`d because loading takes 1–3 seconds. Set to `int8` compute type for CPU performance. Voice activity detection (`vad_filter=True`) trims silence automatically.

`tts.py` wraps Piper. Voice models (~60 MB) are downloaded on first use to `~/.cache/piper-voices/`. The synthesis returns raw WAV bytes which the API hands back as `audio/wav`.

### API (`app/api/`)

Three FastAPI routers, one per domain. The shape is intentionally narrow:

- `/rag/ingest`, `/rag/query` — single-shot retrieval
- `/agent/chat`, `DELETE /agent/sessions/{id}` — multi-turn agent + memory control
- `/voice/transcribe`, `/voice/tts` — speech I/O

`/health` reports indexing state so the UI can warn when the vectorstore is empty.

### UI (`ui/streamlit_app.py`)

Streamlit because it's the fastest path to a chat UI that displays citations and tool calls. The mode toggle (Agent / RAG only) lets you compare the two paths side-by-side. Voice input goes through a file upload → `/voice/transcribe` → re-injected as the next chat message. TTS is opt-in to keep the default flow snappy.

## Data flow examples

### Question about a document

```
user types → /agent/chat
  agent node: LLM sees question, decides "this is about user docs"
  agent node: emits tool_call for document_search(question="...")
  tools node: runs document_search → RAG chain → top-4 chunks → LLM → answer + citations
  agent node: receives tool result, synthesizes final answer
  END
```

### Math question

```
user types "what is 23 * (45 + 7) / 2" → /agent/chat
  agent node: emits tool_call for calculator(expression="23 * (45 + 7) / 2")
  tools node: AST evaluator returns "598.0"
  agent node: "The answer is 598."
  END
```

### Multi-turn follow-up

```
turn 1: "what is 23 * 45?"  → calculator → "1035"
                             → memory now has [Human, AI]
turn 2: "now multiply that by 2"
        → memory loaded, full history sent to agent
        → calculator(expression="1035 * 2")
        → "2070"
```

The model resolves "that" because the previous answer is in its context.

## Deployment

`docker/docker-compose.yml` orchestrates three services:

- **ollama** — official image, persistent volume for downloaded models
- **ollama-pull** — one-shot helper that runs `ollama pull` once Ollama is healthy
- **api** — Python image with the full app, bind-mounts `./data/` for live document ingestion
- **ui** — minimal Streamlit container

A shared `hf_cache` volume prevents re-downloading the embedding model on every rebuild.

## Trade-offs explicitly accepted

- **CPU-only inference is slow.** A 3B model on a laptop CPU produces ~10–20 tok/s; first response after a cold start is dominated by model loading. Acceptable for a portfolio project; not acceptable for production. The path to GPU is one Docker flag (`runtime: nvidia`).
- **Chroma is embedded, not a service.** Single-process only. Great for MVP, doesn't scale horizontally. Migration to Qdrant or pgvector is well-understood.
- **No streaming.** The API returns full responses. For a real product, switch the agent endpoint to Server-Sent Events and wire Streamlit's `st.write_stream`.
- **Memory is in-process and lost on restart.** Fine for demo, fine for single-user. Not fine for SaaS.
- **DuckDuckGo can rate-limit on bursty traffic.** Acceptable for personal use.

## What's deliberately not here

- **Authentication.** No login flow. This is a single-user local tool.
- **Streaming responses.** The plumbing works but isn't surfaced.
- **Fine-tuning.** The proposal mentioned it; in practice prompt engineering + RAG outperforms fine-tuning for this scale.
- **Multi-modal images.** Voice yes, vision no. Adding a vision-capable LLM (e.g. `llava`) would be a few-line change.

## Where to extend

| Want to... | Touch... |
|---|---|
| Add a tool | `app/tools/your_tool.py` + `registry.py` |
| Swap the LLM | `ollama_chat_model` env var, or `app/core/llm.py` for a non-Ollama backend |
| Use a different vector DB | `app/rag/retrieval.py` and `app/rag/ingestion.py` |
| Add streaming | Switch `/agent/chat` to `StreamingResponse` and use `agent.astream_events` |
| Persist memory across restarts | Replace `MemoryStore` internals with Redis |
| Add user auth | Add a FastAPI dependency in `app/main.py` and key memory by `user_id` |
