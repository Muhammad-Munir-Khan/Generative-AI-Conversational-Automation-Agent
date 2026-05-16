"""Request and response schemas."""
from typing import Literal

from pydantic import BaseModel, Field


# --- Sources / RAG ---

class SourceInfo(BaseModel):
    source_file: str
    page: int | None = None
    snippet: str
    score: float | None = None


# --- Plain RAG ---

class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1)
    top_k: int | None = None
    language: str = Field(
        "en",
        description="ISO-639-1 code (e.g., 'en', 'ur', 'ar'). Forces the answer "
                    "into that language even if the question is in English.",
    )


class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceInfo]
    latency_ms: int


# --- Ingestion ---

class IngestResponse(BaseModel):
    chunks_indexed: int
    files_processed: int
    message: str


# --- Agent (multi-turn) ---

class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class AgentRequest(BaseModel):
    message: str = Field(..., min_length=1)
    session_id: str = Field(..., description="Stable id grouping a conversation")
    attachment_text: str | None = Field(
        None,
        description="Optional text extracted from an uploaded attachment. "
                    "Prepended to the message as additional context.",
    )
    attachment_name: str | None = None
    language: str = Field(
        "en",
        description="ISO-639-1 code (e.g., 'en', 'ur', 'ar'). Forces the agent "
                    "to respond in that language regardless of the input language.",
    )


class ToolCall(BaseModel):
    name: str
    args: dict
    result_preview: str | None = None


class AgentResponse(BaseModel):
    answer: str
    sources: list[SourceInfo] = []
    tool_calls: list[ToolCall] = []
    session_id: str
    latency_ms: int


# --- Voice ---

class TranscribeResponse(BaseModel):
    text: str
    language: str | None = None
    duration_sec: float | None = None


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1)
    language: str = Field(
        "en",
        description="ISO-639-1 code. Selects the matching Edge TTS neural voice.",
    )