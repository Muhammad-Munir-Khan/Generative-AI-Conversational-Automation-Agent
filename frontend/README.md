# GenAI Agent — Next.js Frontend

A premium dark/cyan UI for the GenAI Conversational Agent. Talks to the FastAPI
backend in `../app/` via HTTP + Server-Sent Events.

## Features

- Streaming agent responses with token-by-token rendering
- Live agent trace timeline (tool calls appear as the agent works)
- Collapsing source citations and tool-call panels
- File attachments (drag-and-drop or click): PDFs, images, text files
  - Auto-OCR via your backend's vision pipeline for scanned PDFs / images
- Voice input (microphone via MediaRecorder → /voice/transcribe)
- Voice output (TTS playback with custom audio player)
- Mode toggle: Agent (tools + memory) vs RAG-only
- Live status card showing provider, model, TTS backend, indexing state
- Latency badges, suggestion cards, responsive layout

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Env vars

Copy `.env.local.example` to `.env.local` if you need to override the backend URL:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Backend requirement

The frontend assumes the FastAPI backend at `http://localhost:8000` allows
CORS from `http://localhost:3000`. See `PATCH-backend-cors.md` in this folder
for the one-line backend change you need to make.

## File map

```
app/
  page.tsx          — main app, wires everything together
  layout.tsx        — root layout, fonts
  globals.css       — Tailwind v4 theme + animations

components/
  Hero.tsx          — header
  Sidebar.tsx       — left rail with status + controls
  EmptyState.tsx    — suggestion cards before first message
  ChatMessage.tsx   — user/assistant bubble
  Composer.tsx      — input bar (textarea + paperclip + mic + send)
  MicButton.tsx     — recording widget with pulsing red state
  AttachmentChip.tsx — file chip preview
  AgentTrace.tsx    — live trace timeline
  SourcesPanel.tsx  — citation cards
  ToolCallsPanel.tsx — tool log
  LatencyPill.tsx   — fast/medium/slow badge
  AudioPlayer.tsx   — TTS playback

lib/
  api.ts            — fetch wrappers + SSE generator
  types.ts          — shared types
  utils.ts          — helpers (cn, uuid, format)
```

## Notes

- The mic uses MediaRecorder. WebM/Opus is the default; the backend's
  `/voice/transcribe` already handles WebM via faster-whisper.
- For images and scanned PDFs, OCR happens via the backend's Groq vision
  pipeline. You must have `LLM_PROVIDER=groq` and a `GROQ_API_KEY` for
  image OCR to work.
- Streaming uses SSE. If it fails for any reason, the page automatically
  falls back to the non-streaming `/agent/chat` endpoint.
