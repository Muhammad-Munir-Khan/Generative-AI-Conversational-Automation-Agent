# CloudNest.ai

> The conversational AI platform you can actually run.

A multi-tenant conversational AI platform built end-to-end. Combines per-user retrieval-augmented generation, a 9-tool agent loop, multi-LLM consensus mode, voice in/out, vision, multilingual support across 37 languages, and a streaming Next.js frontend. Switches between Groq, OpenRouter, and Ollama through one config line.

> **Stack:** FastAPI · LangGraph · LangChain · PostgreSQL · Chroma · BGE embeddings · faster-whisper · Edge TTS · Next.js 15 · Tailwind · fastapi-users
>
> **Three swappable LLM providers.** Groq for raw speed, OpenRouter for access to ~100 commercial models (Claude, GPT-4, Gemini), or Ollama for fully local inference. One `.env` line picks the active backend.

---

## What it does

- **Per-user document Q&A with real citations.** Each user gets their own private Chroma collection. Upload PDFs, images, TXT, MD, or DOCX through the UI — every answer surfaces source filenames, page numbers, and similarity scores so you can verify rather than trust.
- **9-tool agent loop.** A LangGraph ReAct agent decides per turn whether to search documents, search the web, do math, convert units or currency, fetch weather, or just answer.
- **Multi-LLM consensus mode.** Toggle on to fan a single query out to **3 different models in parallel**. A 4th model judges the responses, ranks them with reasoning, and synthesizes a final verdict. Works on either Groq or OpenRouter — picks the active provider automatically.
- **Streaming with live agent trace.** SSE-based token streaming. Tool calls appear in a vertical timeline as they execute (`document_search` → `calculator` → `currency_converter`), each transitioning from `running` to `done` in real time.
- **Real multi-tenant auth & isolation.** JWT + httpOnly cookies (XSS-resistant). Postgres-backed user accounts. Per-user sessions, messages, documents, and vector collections. Two users on the same backend never see each other's data — enforced at the database, vector store, API, and agent context layers.
- **Voice in / voice out.** faster-whisper for STT, Microsoft Edge neural voices for TTS. One-tap mic button. Matched native voices for every supported language.
- **Vision for images and scanned PDFs.** When text extraction falls short, the vision model (Llama-4 Scout 17B via Groq) reads images directly. No manual workflow.
- **37 languages.** The agent responds in the user's chosen language with a matched native TTS voice. Tool outputs (numbers, currency, dates) translate to fit the conversation naturally.
- **Provider abstraction.** Groq, OpenRouter, or Ollama. Switch with `LLM_PROVIDER=...` in `.env`. Same agent loop, same tools, same UX. The platform is built against a provider interface, not vendor lock-in.
- **Light/dark theme.** Cyan accent, branded gradient. CSS-variable architecture, no flash on page load. Theme toggle in both the landing page nav and the chat sidebar, synced through one hook.

---

## Architecture

```
+--------------------------+          +--------------------------+
|   Next.js 15 frontend    |   HTTP   |    FastAPI backend       |
|   (Tailwind + SSE)       | <------> |  (LangGraph + agents)    |
+--------------------------+          +--------------------------+
                                                  |
        +-----------------------+-----------------+-----------------+
        v                       v                                   v
+----------------+    +---------------------+              +----------------+
|  LLM provider  |    |   Tools registry    |              |  RAG pipeline  |
|  Groq /        |    |   (9 tools)         |              |  Chroma + BGE  |
|  OpenRouter /  |    +---------------------+              |  per-user      |
|  Ollama        |              |                          |  collections   |
+----------------+              v                          +----------------+
                       +-----------------+
                       |  Voice & vision |
                       |  Whisper + Edge |
                       |  Llama-4 Scout  |
                       +-----------------+

+----------------------------------------------------------------+
|                       PostgreSQL                                |
|  users · sessions · messages · alembic migrations              |
+----------------------------------------------------------------+
```

**RAG path (per-user, single-shot):**
`question + user_id (from contextvar) -> embed -> Chroma top-k in user collection -> format with sources -> LLM -> answer + citations`

**Agent path (multi-turn, streaming):**
`message + session history + user_id -> LangGraph 'agent' node -> LLM with bound tools -> if tool calls, route to 'tools' node -> loop until plain answer -> persist to Postgres -> emit SSE events as it runs`

**Multi-LLM ensemble path:**
`question -> asyncio.gather across N models on active provider -> judge model receives all candidates -> ranks them with JSON output -> synthesizes final verdict`

The agent is given RAG as a *tool*, not as a prompt prefix. The LLM decides whether documents are relevant for a given turn — much better than blindly retrieving on every message.

Per-user isolation is enforced through a Python `contextvar` set in the agent entry point. Every tool that touches user data (`document_search`, `document_summarizer`) reads `get_current_user()` and scopes its work accordingly. The pattern is small, auditable, and impossible to forget at the route layer.

---

## Tools

The agent has 9 tools registered. It picks per turn based on the user's intent:

| Tool                  | What it does                                                       |
|-----------------------|--------------------------------------------------------------------|
| `document_search`     | Semantic search over the current user's indexed documents          |
| `document_summarizer` | Summarize a whole file or the user's entire corpus                 |
| `web_search`          | DuckDuckGo (no API key needed)                                     |
| `calculator`          | Safe AST-based math (no `eval`), handles thousands-comma numbers   |
| `json_parser`         | Parse JSON and extract values via dotted path                      |
| `datetime_tool`       | Date math and timezone-aware queries                               |
| `unit_converter`      | Physical unit conversions using `pint`                             |
| `currency_converter`  | Live ECB exchange rates via Frankfurter API                        |
| `weather`             | Current + 3-day forecast (Open-Meteo)                              |

Tool selection turned out to be a system-prompt problem more than a model problem — most "wrong tool" issues went away after rewriting tool descriptions to emphasize *when* to use each one.

> **Note on the missing two:** `python_repl` and `csv_reader` are in the repo but temporarily unregistered. Small open-source models (gpt-oss-20B, Llama 3.1 8B) hallucinate filenames and forget to `print()` results, making chained CSV-analysis flows unreliable. They'll be re-enabled in Phase 5 with a persistent Jupyter-style kernel and a larger model for tool calling. See the roadmap below.

---

## Project structure

```
cloudnest/
├── app/                         # FastAPI backend
│   ├── core/                    # config · logging · LLM provider · auth · DB · schemas
│   ├── rag/
│   │   ├── ingestion.py         # per-user document indexing
│   │   ├── retrieval.py         # contextvar-scoped retrieval
│   │   ├── collections.py       # per-user Chroma collection naming
│   │   ├── embeddings.py        # BGE-small singleton
│   │   ├── extraction.py        # PDF/image text extraction + vision fallback
│   │   └── user_context.py      # contextvar holding the active user UUID
│   ├── agent/
│   │   ├── graph.py             # LangGraph ReAct loop (run + stream)
│   │   ├── ensemble.py          # Multi-LLM parallel execution + judge
│   │   ├── memory.py            # Session-scoped conversation buffer
│   │   ├── storage.py           # Postgres-backed sessions & messages
│   │   └── titler.py            # LLM-based automatic chat naming
│   ├── tools/                   # 9 tool implementations
│   ├── voice/                   # STT (Whisper) + TTS (Edge / Piper)
│   ├── api/                     # FastAPI route modules (auth, rag, agent, voice, attachments)
│   ├── models/                  # SQLAlchemy models (user, session, message)
│   ├── alembic/                 # Database migrations
│   └── main.py                  # FastAPI entry point
│
├── frontend/                    # Next.js 15 app
│   ├── app/
│   │   ├── page.tsx             # Landing page (CloudNest.ai)
│   │   ├── chat/page.tsx        # Main chat UI
│   │   ├── login/page.tsx       # Login (cookie auth)
│   │   ├── signup/page.tsx      # Signup
│   │   └── layout.tsx           # Theme bootstrapping + AuthProvider
│   ├── components/              # UI components (Sidebar, Composer, ChatMessage, etc.)
│   └── lib/                     # API client, types, theme hook, auth helpers
│
├── scripts/                     # ingestion & testing utilities
├── tests/                       # pytest test suite
├── evals/                       # Ragas RAG evaluation harness
│
├── data/
│   ├── docs/<user_hex>/         # per-user uploaded documents
│   ├── chroma/                  # per-user vector collections (gitignored)
│   └── audio/                   # generated TTS files (gitignored)
│
├── docker-compose.yml           # Postgres 17
├── requirements.txt
├── .env.example
└── README.md
```

---

## Quick start

### Prerequisites
- Python 3.11
- Node.js 20+
- Docker (for Postgres)
- Either a free [Groq API key](https://console.groq.com/keys), an [OpenRouter key](https://openrouter.ai/keys), or [Ollama](https://ollama.com/download) installed locally

### 1. Database

```bash
docker-compose up -d
```

This starts Postgres 17 with the project's schema. The container is volume-backed, so user accounts and chat history survive restarts.

### 2. Backend setup

```bash
git clone https://github.com/Muhammad-Munir-Khan/<repo-name>
cd <repo-name>

python -m venv .venv
.\.venv\Scripts\activate          # Windows
# source .venv/bin/activate       # macOS / Linux

pip install -r requirements.txt
alembic upgrade head              # apply database schema
```

### 3. Environment

Copy the example env file and add your keys:

```bash
copy .env.example .env            # Windows
# cp .env.example .env            # macOS / Linux
```

For the **Groq path** (recommended for speed — sub-second responses):

```
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here
```

For the **OpenRouter path** (access to Claude / GPT-4 / Gemini / ~100 models through one key):

```
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1_your_key_here
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct
```

For the **local path** (no API key needed):

```
LLM_PROVIDER=ollama
```

Then `ollama pull llama3.2:3b` (~2 GB).

Set a strong `JWT_SECRET` in `.env` for production. The default value is fine for local development.

### 4. Frontend setup

```bash
cd frontend
npm install
```

### 5. Run

```bash
# Terminal 1 — Backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev

# Terminal 3 (only if using LLM_PROVIDER=ollama)
ollama serve
```

Open **http://localhost:3000** (not `127.0.0.1` — cookie auth is scoped to `localhost` in dev).

### 6. Sign up and upload documents

Click **Get started** on the landing page, create an account, and you're dropped into your private workspace at `/chat`. Use the document manager in the sidebar to upload PDFs, text, or DOCX files. They're chunked, embedded with BGE, and indexed into your private Chroma collection — strict isolation, no shared corpus.

---

## Demo questions to try

1. **RAG with citations:** Upload a document, then ask *"What does this document say about X?"* → returns the answer with source file + page + similarity score
2. **Multi-step tool chain:** *"What is 87,500 × 24, then convert to EUR?"* → triggers `calculator` → `currency_converter` and synthesizes the final answer in ~9 seconds
3. **Multi-LLM consensus:** Toggle multi-LLM mode, ask *"My startup has $50k, 4 months of runway. Should I hire one senior at $15k/month or two juniors at $7k/month each?"* → 3 models answer in parallel, judge ranks them, synthesized verdict appears
4. **Voice round-trip:** Tap the mic, say *"What's the weather in Karachi?"*, hear the answer spoken back in your selected language
5. **Multi-tenant isolation:** Sign up as a second user — none of your first account's chats, documents, or RAG answers leak across

---

## Configuration

Every tunable lives in `.env`:

| Variable                            | Default                            | Description                                                |
|-------------------------------------|------------------------------------|------------------------------------------------------------|
| `LLM_PROVIDER`                      | `groq`                             | Backend: `groq`, `openrouter`, or `ollama`                 |
| `GROQ_MODEL`                        | `openai/gpt-oss-20b`               | Main agent model when using Groq                           |
| `OPENROUTER_MODEL`                  | `meta-llama/llama-3.3-70b-instruct`| Main agent model when using OpenRouter                     |
| `LLM_MODEL`                         | `llama3.2:3b`                      | Main agent model when using Ollama                         |
| `ENSEMBLE_MODELS`                   | 3 Groq models                      | Comma-separated list for multi-LLM ensemble (Groq path)    |
| `ENSEMBLE_MODELS_OPENROUTER`        | 3 OpenRouter models                | Comma-separated list for ensemble on OpenRouter            |
| `ENSEMBLE_JUDGE_MODEL`              | `openai/gpt-oss-120b`              | Judge model on Groq                                        |
| `ENSEMBLE_JUDGE_MODEL_OPENROUTER`   | varies                             | Judge model on OpenRouter                                  |
| `DATABASE_URL`                      | local Postgres                     | SQLAlchemy async DSN                                       |
| `JWT_SECRET`                        | dev placeholder                    | **Change for production.** Secret for signing JWTs.        |
| `JWT_LIFETIME_SECONDS`              | `604800`                           | Token lifetime (default 7 days)                            |
| `CHUNK_SIZE / OVERLAP / TOP_K`      | `800 / 100 / 4`                    | RAG retrieval configuration                                |
| `WHISPER_MODEL`                     | `base`                             | STT model size: `tiny`, `base`, `small`, `medium`          |
| `TTS_BACKEND`                       | `edge`                             | Voice engine: `edge` (neural online) or `piper` (offline)  |
| `MAX_AGENT_ITERATIONS`              | `6`                                | Maximum tool-call loop iterations                          |
| `MEMORY_WINDOW`                     | `10`                               | Past message pairs kept in agent context                   |
| `ENABLE_WEB_SEARCH`                 | `true`                             | Enable/disable web search tool                             |
| `ENABLE_VOICE`                      | `true`                             | Enable/disable voice input/output                          |

See `.env.example` for the full reference with comments.

---

## API reference

| Method | Path                                | Purpose                                                  |
|--------|-------------------------------------|----------------------------------------------------------|
| GET    | `/health`                           | Service status, active provider, model info             |
| POST   | `/auth/cookie/login`                | Login (httpOnly cookie response)                        |
| POST   | `/auth/cookie/logout`               | Logout (clears cookie)                                   |
| POST   | `/auth/jwt/login`                   | Login (Bearer token response, for API/curl)             |
| POST   | `/auth/register`                    | Register a new account                                   |
| GET    | `/users/me`                         | Current user info                                        |
| POST   | `/rag/query`                        | Single-shot RAG Q&A with citations (per-user)            |
| GET    | `/rag/documents`                    | List the current user's indexed documents                |
| POST   | `/rag/upload`                       | Upload + index a document into the user's collection     |
| DELETE | `/rag/documents/{filename}`         | Remove a document from the user's collection             |
| POST   | `/rag/reindex`                      | Re-index every file in the user's docs folder            |
| POST   | `/agent/chat`                       | Multi-turn agent with tools + memory (non-streaming)     |
| POST   | `/agent/stream`                     | Streaming agent (tokens + tool events via SSE)           |
| POST   | `/agent/ensemble`                   | Multi-LLM consensus mode                                 |
| GET    | `/agent/sessions`                   | List the current user's chat sessions                    |
| GET    | `/agent/sessions/{id}/messages`     | Full session message history                             |
| PATCH  | `/agent/sessions/{id}`              | Rename a session                                         |
| DELETE | `/agent/sessions/{id}`              | Delete a session                                         |
| POST   | `/voice/transcribe`                 | Audio → text (Whisper)                                   |
| POST   | `/voice/tts`                        | Text → audio (Edge or Piper)                             |
| POST   | `/attachments/extract`              | PDF/image → text (vision fallback for scanned docs)      |

All endpoints except `/health`, `/auth/*`, and `/auth/register` require authentication. Browser clients authenticate via httpOnly cookie; CLI tools and scripts use `Authorization: Bearer <token>` headers. Same JWT under the hood.

**Interactive docs:** http://localhost:8000/docs

---

## Testing

```bash
pip install pytest
pytest
```

Tests cover the calculator (including malicious input rejection), schema validation, memory eviction, tool argument parsing, and authentication flows. They run in a few seconds and don't require Ollama, Groq, or a vectorstore.

For RAG quality evaluation:

```bash
pip install -r requirements-eval.txt
python evals/ragas_eval.py
```

Outputs faithfulness, answer relevancy, context precision, and context recall.

---

## Trade-offs and design notes

- **LangGraph over LangChain agents.** Explicit state transitions make streaming, debugging, and testing dramatically easier. Trying to stream from a LangChain `AgentExecutor` was painful; LangGraph emits `updates` and `messages` events you can directly forward over SSE.
- **Per-user Chroma collections over a single shared collection with metadata filters.** Strict isolation is easier to reason about when it's enforced by the storage layer, not by a query filter you have to remember to apply.
- **Provider abstraction with contextvar-based user isolation.** Every tool that touches user data reads `get_current_user()` instead of receiving a `user_id` parameter. This keeps tool signatures clean for the LLM, prevents accidental cross-user leakage, and makes the agent loop trivially auditable.
- **PostgreSQL + Alembic over SQLite or "AI memory frameworks."** Real multi-tenant data needs real relational guarantees and migration tooling. fastapi-users handles auth on top of SQLAlchemy and does the boring parts well.
- **httpOnly cookies for browser, Bearer JWT for CLI.** Two transports, same JWT strategy. Browser clients are XSS-resistant; API clients still work with `Authorization` headers.
- **Two SQLAlchemy engines** — one for the main event loop, one for the background event loop where the auto-titler runs. Discovered the hard way that sharing a connection pool across loops corrupts asyncpg state.
- **BGE-small over OpenAI embeddings.** Runs locally, no per-token cost, top-tier on MTEB for its size class.
- **SSE over WebSockets.** Simpler. One-way streaming is all we need. FastAPI's `StreamingResponse` handles it natively.
- **DuckDuckGo, not Google.** No API key. Trade-off is occasionally lower-quality results.
- **The agent gets RAG as a tool, not a prompt prefix.** The LLM decides whether documents are relevant for a given turn instead of blindly retrieving on every message.
- **Lazy-loaded singletons** (vectorstore per user, embeddings, LLM, Whisper model) are cached with `lru_cache` so first request is slow but subsequent ones are fast.

---

## Honest limitations

I'd rather list these than have a recruiter find them:

- **CSV analysis and Python REPL are temporarily disabled.** Small open-source models hallucinate filenames and forget to wrap results in `print()`. The tools are still in the repo but unregistered. Rebuilding in Phase 5 with a persistent Jupyter-style kernel and a larger tool-calling model.
- **OpenRouter free tier is rate-limited.** Free-tier requests go into a low-priority queue at the upstream provider; under load they time out. The architecture works perfectly — switching `LLM_PROVIDER=openrouter` routes the entire app through OpenRouter — but for production demos, a $5–10 credit removes the queue.
- **Chroma for vectors, Postgres for everything else.** Two stores means two backup paths and no SQL joins across user data and embeddings. Phase 5 will migrate to pgvector for unified storage.
- **No prompt-injection defense.** A malicious document or attachment could try to manipulate the agent. For production, add a content classifier and tool-output filtering.
- **LLM-as-judge bias in the ensemble.** The judge is biased toward verbose/confident answers. Mitigated by mixing model families but not eliminated.
- **No observability backend wired.** Langfuse hooks exist in `app/core/config.py` but aren't connected. Easy to add.
- **In-memory rate limiting only.** Production would need Redis-backed per-user rate limits.

---

## What I learned building this

A few things tutorials don't cover:

- **Multi-tenant isolation is easier with a contextvar than with explicit parameters.** Threading `user_id` through every LangChain call site is painful and error-prone. Setting it once in the agent entry point and reading it from `get_current_user()` in tools is small, auditable, and impossible to forget at the route layer.
- **Tool selection is a system-prompt problem, not a model problem.** Most "the agent picked the wrong tool" issues went away after rewriting tool descriptions to emphasize *when* to use each one, not just *what* it does.
- **Streaming UX is the difference between "demo" and "product."** Users tolerate latency if they can see something happening. The live trace timeline shipped before any actual perf work, and it changed how the system felt.
- **Multi-LLM ensembling produces visibly better answers on judgment questions, not factual ones.** For "what year was X invented" three models give the same answer. For "should I hire a senior or two juniors with limited runway" they disagree productively — and a smaller model from a different family caught a budget constraint that two bigger Llamas missed. The judge picked it. That's the moment the architecture earned its compute.
- **Defensive tool schemas catch real production bugs.** Groq's strict schema validation rejects LLM-quoted numeric arguments (`amount: "2100000"` when schema declares `float`). Adding `value: float | int | str` plus a coercion block in `calculator`, `currency_converter`, and `unit_converter` fixed a class of intermittent failures.
- **Two SQLAlchemy engines are sometimes necessary.** A connection pool can't safely span event loops in asyncpg. The main FastAPI loop and the background titler loop each need their own.
- **CSS variables beat duplicating styles.** Light/dark theming with a single source of truth (theme tokens in `globals.css`) made the implementation small and fixes effortless. The first attempt — Tailwind `dark:` variants on every component — was 20× the code.

---

## Phase 5 roadmap

What's next, ordered by priority:

1. **Migrate vectors from Chroma to pgvector.** Unified storage layer, real transactions across user data and embeddings, simpler backups.
2. **Rebuild `python_repl` and `csv_reader` with a persistent Jupyter-style kernel.** Faster (no subprocess boot per call), more reliable (state persists across calls), and pair with a bigger tool-calling model.
3. **Per-user rate limiting via Redis.** Currently in-memory only.
4. **Langfuse observability.** Config hooks exist; just need wiring.
5. **Ragas-based eval harness in CI.** Measure retrieval quality on every change to the RAG pipeline.
6. **Prompt-injection content classifier.** Run uploaded documents through a safety check before they enter the agent context.

---

## Credits

Built by [Munir Khan](https://www.linkedin.com/in/munir-k-0106b1256/). If this helped you understand how to build a real GenAI platform end-to-end, a star on the repo is appreciated.