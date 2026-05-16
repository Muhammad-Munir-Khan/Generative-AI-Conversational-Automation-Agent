/**
 * Shared types matching the FastAPI backend's Pydantic schemas.
 */

export type Provider = "GROQ" | "OLLAMA" | string;

export interface HealthResponse {
  status: string;
  version: string;
  provider: string;
  llm_model: string;
  embedding_model: string;
  voice_enabled: boolean;
  tts_backend: string;
  indexed: boolean;
}

export interface SourceInfo {
  source_file: string;
  page: number | null;
  snippet: string;
  score: number | null;
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  result_preview: string | null;
}

export interface AgentResponse {
  answer: string;
  sources: SourceInfo[];
  tool_calls: ToolCall[];
  session_id: string;
  latency_ms: number;
}

export interface QueryResponse {
  answer: string;
  sources: SourceInfo[];
  latency_ms: number;
}

export interface AttachmentResponse {
  filename: string;
  text: string;
  method: string;
  pages_processed: number;
  size_bytes: number;
  char_count: number;
}

export interface TranscribeResponse {
  text: string;
  language: string | null;
  duration_sec: number | null;
}

// Streaming events from /agent/stream
export type StreamEvent =
  | { type: "tool_start"; name: string; args: Record<string, unknown> }
  | { type: "tool_end"; name: string; preview: string }
  | { type: "token"; delta: string }
  | { type: "done"; answer: string; sources: SourceInfo[]; tool_calls: ToolCall[]; session_id: string; latency_ms: number }
  | { type: "error"; message: string };

// Multi-LLM ensemble (defined inline to avoid circular imports with api.ts)
export interface EnsembleData {
  question: string;
  candidates: {
    model: string;
    answer: string;
    latency_ms: number;
    error: string | null;
  }[];
  ranking: { model: string; rank: number; reason: string }[];
  verdict: string;
  judge_model: string;
  total_latency_ms: number;
}

// Local-only chat message used by the UI
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachmentName?: string;
  sources?: SourceInfo[];
  toolCalls?: ToolCall[];
  trace?: TraceEntry[];
  latencyMs?: number;
  ensemble?: EnsembleData;
}

export interface TraceEntry {
  name: string;
  args: Record<string, unknown>;
  preview?: string;
  status: "running" | "done";
}

export type Mode = "agent" | "rag";