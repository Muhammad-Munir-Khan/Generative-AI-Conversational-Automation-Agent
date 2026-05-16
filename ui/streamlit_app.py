"""Streamlit chat UI for the GenAI agent — with attachments + streaming."""
import json
import os
import uuid

import requests
import streamlit as st

API_URL = os.getenv("API_URL", "http://localhost:8000")

st.set_page_config(page_title="GenAI Agent", page_icon="🤖", layout="wide")

st.markdown(
    """
    <style>
    .mic-dock {
        position: fixed; bottom: 14px; right: 24px;
        z-index: 1000; background: transparent;
    }
    .mic-dock label { display: none !important; }
    .mic-dock div[data-testid="stAudioInput"] { width: 260px; }
    section[data-testid="stChatInput"] { padding-right: 280px !important; }
    @media (max-width: 900px) {
        .mic-dock { position: fixed; bottom: 80px; right: 16px; left: 16px; }
        section[data-testid="stChatInput"] { padding-right: 0 !important; }
    }
    /* Compact the file uploader so it sits like a button */
    [data-testid="stSidebar"] [data-testid="stFileUploader"] section {
        padding: 0.6rem !important;
    }
    .attachment-chip {
        display: inline-flex; align-items: center; gap: 0.5rem;
        background: rgba(6, 182, 212, 0.12);
        border: 1px solid rgba(6, 182, 212, 0.4);
        border-radius: 100px;
        padding: 0.35rem 0.9rem;
        font-family: monospace; font-size: 0.8rem;
        color: #22d3ee;
        margin: 0.5rem 0;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

st.title("🤖 GenAI Conversational Agent")
st.caption("Local RAG + Agent + Voice + Attachments")


# ---------- Session state ----------

if "messages" not in st.session_state:
    st.session_state.messages = []
if "session_id" not in st.session_state:
    st.session_state.session_id = str(uuid.uuid4())
if "mode" not in st.session_state:
    st.session_state.mode = "Agent"
if "last_audio_id" not in st.session_state:
    st.session_state.last_audio_id = None
if "pending_attachment" not in st.session_state:
    # Holds {"name": str, "text": str, "method": str} once a file has been
    # uploaded and extracted, until the next message is sent.
    st.session_state.pending_attachment = None
if "uploader_key" not in st.session_state:
    # Bumped after each send so the file_uploader resets cleanly.
    st.session_state.uploader_key = 0


# ---------- Helpers ----------

def render_sources(sources: list[dict]) -> None:
    if not sources:
        return
    with st.expander(f"📎 Sources ({len(sources)})"):
        for s in sources:
            score_str = f" · score {s['score']:.2f}" if s.get("score") else ""
            st.markdown(f"**{s['source_file']}** · page {s.get('page', '?')}{score_str}")
            st.caption(s["snippet"])


def render_tool_calls(tool_calls: list[dict]) -> None:
    if not tool_calls:
        return
    with st.expander(f"🛠 Tool calls ({len(tool_calls)})"):
        for tc in tool_calls:
            st.markdown(f"**{tc['name']}** — `{tc['args']}`")
            if tc.get("result_preview"):
                st.code(tc["result_preview"], language=None)


def latency_pill(ms: int) -> str:
    if ms < 2000:
        emoji, color = "⚡", "#10b981"
    elif ms < 8000:
        emoji, color = "◆", "#06b6d4"
    else:
        emoji, color = "🐢", "#f59e0b"
    display = f"{ms / 1000:.1f}s" if ms >= 1000 else f"{ms} ms"
    return (
        f'<span style="font-family:monospace;font-size:0.75rem;color:{color};'
        f'background:rgba(255,255,255,0.04);border:1px solid {color}33;'
        f'padding:2px 8px;border-radius:100px;">{emoji} {display}</span>'
    )


def play_tts(text: str) -> None:
    try:
        r = requests.post(f"{API_URL}/voice/tts", json={"text": text}, timeout=120)
        r.raise_for_status()
        content_type = r.headers.get("content-type", "audio/wav")
        st.audio(r.content, format=content_type, autoplay=True)
    except requests.RequestException as e:
        st.warning(f"TTS unavailable: {e}")


def transcribe_bytes(audio_bytes: bytes, filename: str = "recording.wav") -> str | None:
    try:
        files = {"file": (filename, audio_bytes, "audio/wav")}
        r = requests.post(f"{API_URL}/voice/transcribe", files=files, timeout=300)
        r.raise_for_status()
        return r.json()["text"]
    except requests.RequestException as e:
        st.error(f"Transcription failed: {e}")
        return None


def extract_attachment(file, persist: bool = False) -> dict | None:
    """Upload to /attachments/extract; return the parsed response dict."""
    try:
        files = {"file": (file.name, file.getvalue(), file.type or "application/octet-stream")}
        data = {"persist": "true" if persist else "false"}
        r = requests.post(
            f"{API_URL}/attachments/extract",
            files=files,
            data=data,
            timeout=300,
        )
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        # Pull a better error message from the response body if possible.
        detail = ""
        try:
            detail = r.json().get("detail", "")
        except Exception:
            pass
        st.error(f"Attachment failed: {detail or e}")
        return None


# ---------- Sidebar ----------

with st.sidebar:
    st.header("⚙️ Setup")

    try:
        h = requests.get(f"{API_URL}/health", timeout=2).json()
        provider = h.get("provider", "?").upper()
        provider_emoji = "☁️" if provider == "GROQ" else "💻"
        st.success(f"API up · {provider_emoji} `{provider}` · `{h['llm_model']}`")
        if not h.get("indexed"):
            st.warning("No documents indexed yet — click **Re-index** below.")
    except requests.RequestException:
        st.error(f"API not reachable at {API_URL}")
        st.stop()

    st.session_state.mode = st.radio(
        "Mode",
        ["Agent", "RAG only"],
        help="Agent: multi-turn, can use tools. RAG only: single-shot doc QA.",
    )

    enable_tts = st.checkbox("🔊 Speak responses", value=False)

    st.divider()
    st.subheader("📎 Attach a file")
    uploaded = st.file_uploader(
        "Drop a PDF, image, or text file",
        type=["pdf", "png", "jpg", "jpeg", "webp", "txt", "md", "csv"],
        key=f"attach_{st.session_state.uploader_key}",
        label_visibility="collapsed",
    )
    persist = st.checkbox(
        "Save to knowledge base",
        value=False,
        help="Off = file is used for this question only. "
             "On = file is permanently indexed for future questions.",
    )

    if uploaded is not None and st.session_state.pending_attachment is None:
        with st.spinner(f"Reading {uploaded.name}..."):
            extracted = extract_attachment(uploaded, persist=persist)
        if extracted:
            st.session_state.pending_attachment = {
                "name": extracted["filename"],
                "text": extracted["text"],
                "method": extracted["method"],
                "chars": extracted["char_count"],
                "pages": extracted["pages_processed"],
            }
            method_label = {
                "text": "plain text",
                "pypdf": "PDF text",
                "vision": "vision OCR",
                "pdf+vision": "PDF + vision OCR",
            }.get(extracted["method"], extracted["method"])
            st.success(
                f"Read {extracted['char_count']:,} chars via {method_label}."
                + (" Saved to docs." if persist else "")
            )

    st.divider()
    st.subheader("📚 Documents")
    if st.button("Re-index documents", use_container_width=True):
        with st.spinner("Indexing..."):
            try:
                r = requests.post(f"{API_URL}/rag/ingest", timeout=900)
                r.raise_for_status()
                st.success(r.json()["message"])
            except requests.RequestException as e:
                st.error(f"Ingestion failed: {e}")

    st.divider()
    st.subheader("💬 Conversation")
    st.caption(f"Session: `{st.session_state.session_id[:8]}...`")
    if st.button("New conversation", use_container_width=True):
        try:
            requests.delete(
                f"{API_URL}/agent/sessions/{st.session_state.session_id}",
                timeout=5,
            )
        except requests.RequestException:
            pass
        st.session_state.messages = []
        st.session_state.session_id = str(uuid.uuid4())
        st.session_state.last_audio_id = None
        st.session_state.pending_attachment = None
        st.session_state.uploader_key += 1
        st.rerun()


# ---------- Chat history ----------

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        if msg.get("attachment_name"):
            st.markdown(
                f'<span class="attachment-chip">📎 {msg["attachment_name"]}</span>',
                unsafe_allow_html=True,
            )
        st.markdown(msg["content"])
        if msg["role"] == "assistant" and msg.get("latency_ms") is not None:
            st.markdown(latency_pill(msg["latency_ms"]), unsafe_allow_html=True)
        render_sources(msg.get("sources") or [])
        render_tool_calls(msg.get("tool_calls") or [])


# ---------- Pending attachment indicator ----------

if st.session_state.pending_attachment:
    att = st.session_state.pending_attachment
    cols = st.columns([10, 1])
    with cols[0]:
        st.markdown(
            f'<span class="attachment-chip">📎 {att["name"]} · {att["chars"]:,} chars</span>',
            unsafe_allow_html=True,
        )
    with cols[1]:
        if st.button("✕", help="Remove attachment", key="remove_att"):
            st.session_state.pending_attachment = None
            st.session_state.uploader_key += 1
            st.rerun()


# ---------- Mic dock + chat input ----------

st.markdown('<div class="mic-dock">', unsafe_allow_html=True)
audio_value = st.audio_input("🎙", label_visibility="collapsed", key="mic")
st.markdown("</div>", unsafe_allow_html=True)

text_question = st.chat_input("Type or tap the mic to ask a question...")


# ---------- Decide which input fired this turn ----------

question: str | None = None

if audio_value is not None:
    audio_id = f"{audio_value.size}-{getattr(audio_value, 'name', '')}"
    if audio_id != st.session_state.last_audio_id:
        st.session_state.last_audio_id = audio_id
        with st.spinner("Transcribing..."):
            transcribed = transcribe_bytes(audio_value.getvalue(), "recording.wav")
        if transcribed:
            st.toast(f'Heard: "{transcribed}"', icon="🎙")
            question = transcribed

if text_question:
    question = text_question


# ---------- Run the question ----------

if question:
    # Snapshot the attachment, then clear it so the next turn doesn't re-use it.
    attachment = st.session_state.pending_attachment
    st.session_state.pending_attachment = None

    user_msg = {"role": "user", "content": question}
    if attachment:
        user_msg["attachment_name"] = attachment["name"]
    st.session_state.messages.append(user_msg)

    with st.chat_message("user"):
        if attachment:
            st.markdown(
                f'<span class="attachment-chip">📎 {attachment["name"]}</span>',
                unsafe_allow_html=True,
            )
        st.markdown(question)

    with st.chat_message("assistant"):
        # --- Agent mode (streaming + attachment) ---
        if st.session_state.mode == "Agent":
            trace_box = st.empty()
            answer_box = st.empty()
            trace_lines: list[str] = []
            accumulated = ""
            final_data: dict | None = None

            payload = {
                "message": question,
                "session_id": st.session_state.session_id,
            }
            if attachment:
                payload["attachment_text"] = attachment["text"]
                payload["attachment_name"] = attachment["name"]

            try:
                with requests.post(
                    f"{API_URL}/agent/stream",
                    json=payload,
                    stream=True,
                    timeout=600,
                ) as r:
                    r.raise_for_status()
                    for raw in r.iter_lines(decode_unicode=True):
                        if not raw or not raw.startswith("data: "):
                            continue
                        try:
                            evt = json.loads(raw[6:])
                        except json.JSONDecodeError:
                            continue

                        kind = evt.get("type")
                        if kind == "tool_start":
                            args_brief = ", ".join(
                                f"{k}={v!r}" for k, v in (evt.get("args") or {}).items()
                            )
                            trace_lines.append(f"⚙ **calling** `{evt['name']}`({args_brief})")
                            trace_box.markdown("\n\n".join(trace_lines))
                        elif kind == "tool_end":
                            preview = (evt.get("preview") or "").strip().split("\n")[0]
                            preview = preview[:120] + ("..." if len(preview) > 120 else "")
                            trace_lines.append(f"✓ **{evt['name']}** → `{preview}`")
                            trace_box.markdown("\n\n".join(trace_lines))
                        elif kind == "token":
                            accumulated += evt.get("delta", "")
                            answer_box.markdown(accumulated + "▌")
                        elif kind == "done":
                            final_data = evt
                            answer_box.markdown(evt.get("answer", accumulated))
                            if trace_lines:
                                trace_box.empty()
                        elif kind == "error":
                            st.error(f"Agent error: {evt.get('message')}")
                            st.stop()
            except requests.RequestException as e:
                st.error(f"Stream failed: {e}")
                st.stop()

            if final_data is None:
                st.error("Agent stream ended without a final event.")
                st.stop()

            ms = final_data.get("latency_ms", 0)
            st.markdown(latency_pill(ms), unsafe_allow_html=True)

            if trace_lines:
                with st.expander(f"🧠 Agent trace ({len(trace_lines)} steps)"):
                    for line in trace_lines:
                        st.markdown(line)

            render_sources(final_data.get("sources") or [])
            render_tool_calls(final_data.get("tool_calls") or [])

            if enable_tts:
                play_tts(final_data.get("answer", ""))

            st.session_state.messages.append({
                "role": "assistant",
                "content": final_data.get("answer", ""),
                "sources": final_data.get("sources") or [],
                "tool_calls": final_data.get("tool_calls") or [],
                "latency_ms": ms,
            })

        # --- RAG-only mode ---
        else:
            with st.spinner("Thinking..."):
                try:
                    # RAG mode doesn't take attachments yet; just use the question
                    # (or warn if user attached and selected RAG mode).
                    if attachment:
                        st.info(
                            "RAG mode ignores attachments. Switch to Agent mode "
                            "to use attached files."
                        )
                    r = requests.post(
                        f"{API_URL}/rag/query",
                        json={"question": question},
                        timeout=300,
                    )
                    r.raise_for_status()
                    data = r.json()
                except requests.RequestException as e:
                    st.error(f"Request failed: {e}")
                    st.stop()

            st.markdown(data["answer"])
            ms = data.get("latency_ms", 0)
            st.markdown(latency_pill(ms), unsafe_allow_html=True)
            render_sources(data.get("sources") or [])
            render_tool_calls(data.get("tool_calls") or [])

            if enable_tts:
                play_tts(data["answer"])

            st.session_state.messages.append({
                "role": "assistant",
                "content": data["answer"],
                "sources": data.get("sources") or [],
                "tool_calls": data.get("tool_calls") or [],
                "latency_ms": ms,
            })

    # Reset uploader so the user can attach a new file next turn.
    st.session_state.uploader_key += 1