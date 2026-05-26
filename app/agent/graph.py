"""LangGraph agent: a ReAct-style loop with tool calling and memory.

Graph: START -> agent (LLM) -> [tools (if tool_calls)] -> agent -> ... -> END

The current user_id is set into a contextvar (app.rag.user_context) at the
start of each agent run and reset at the end. This lets RAG tools
(document_search, document_summarizer) and the underlying retrieval layer
read the active user without us having to thread user_id through every
LangChain call site.

Observability: each agent run attaches a Langfuse callback handler (when
configured) so the full trace - LLM calls, tool calls, latency, tokens,
cost - is captured. If Langfuse isn't configured the handler is None and
the run proceeds normally with no tracing.
"""
import threading
import time
import uuid
from typing import Annotated, TypedDict

from langchain_core.messages import (
    AIMessage,
    AIMessageChunk,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from app.agent import storage
from app.agent.memory import memory
from app.core.config import settings
from app.core.language import language_directive
from app.core.llm import get_llm
from app.core.logging import get_logger
from app.core.observability import get_langfuse_handler
from app.core.schemas import AgentResponse, SourceInfo, ToolCall
from app.rag.user_context import reset_current_user, set_current_user
from app.tools.registry import get_tools

log = get_logger(__name__)

SYSTEM_PROMPT = """You are a helpful conversational assistant with access to tools.

Available capabilities:
- document_search: Look up specific facts in the user's indexed documents.
- document_summarizer: Summarize a whole indexed file or the entire corpus.
- web_search: Search the public web for current information.
- calculator: Evaluate arithmetic expressions (handles thousands-comma numbers).
- json_parser: Parse JSON and extract values by dotted path.
- datetime_tool: Date and time operations (today, weekday, days_between, etc.).
- unit_converter: Convert physical units (length, mass, temperature, etc.).
- currency_converter: Convert money between currencies (live ECB rates).
- weather: Current weather and 3-day forecast for any location.

Guidelines:
- For specific facts from indexed docs, use document_search FIRST.
- For an overview of a document, use document_summarizer (NOT document_search).
- For ANY arithmetic — even simple multiplication or percentages — use calculator FIRST, then pass the numeric result to other tools.
- NEVER put math expressions inside other tools' numeric arguments.
  WRONG: currency_converter(amount="0.15 * 240000", from_currency="USD", to_currency="EUR")
  RIGHT: calculator(expression="0.15 * 240000") -> returns 36000
         currency_converter(amount=36000, from_currency="USD", to_currency="EUR")
- For web/current info not in docs, use web_search.
- For dates, units, currency, weather — use the matching dedicated tool.
- After tools, synthesize a clear, concise answer.
- If a tool returns no useful info, say so honestly. Don't make things up.
- Preserve any source citations from document_search in your final answer.
- Keep answers focused and brief unless the user asks for detail.
"""


class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]


def _build_graph():
    tools = get_tools()
    tool_node = ToolNode(tools)
    llm = get_llm().bind_tools(tools)

    def agent_node(state: AgentState):
        response = llm.invoke(state["messages"])
        return {"messages": [response]}

    def should_continue(state: AgentState):
        last = state["messages"][-1]
        if isinstance(last, AIMessage) and last.tool_calls:
            return "tools"
        return END

    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)
    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")
    return graph.compile()


_graph = None


def get_graph():
    global _graph
    if _graph is None:
        _graph = _build_graph()
    return _graph


def _build_config(user_id: str | uuid.UUID, session_id: str) -> dict:
    """Build the LangGraph run config, including the Langfuse callback.

    The handler is None when Langfuse isn't configured; in that case the
    callbacks list is empty and the run proceeds with no tracing. The
    metadata lets us filter traces by user and session in the dashboard.
    """
    handler = get_langfuse_handler()
    return {
        "recursion_limit": settings.max_agent_iterations * 2 + 4,
        "callbacks": [handler] if handler else [],
        "run_name": "cloudnest-agent",
        "metadata": {
            "langfuse_user_id": str(user_id),
            "langfuse_session_id": session_id,
        },
    }


def _build_user_content(
    message: str,
    attachment_text: str | None,
    attachment_name: str | None,
) -> str:
    """If an attachment is provided, prepend its content as context."""
    if not attachment_text:
        return message
    snippet = attachment_text[:12000]
    truncated_note = "\n[...truncated]" if len(attachment_text) > 12000 else ""
    label = attachment_name or "attached file"
    return (
        f"[The user attached a file: {label}]\n"
        f"--- BEGIN ATTACHMENT ---\n{snippet}{truncated_note}\n--- END ATTACHMENT ---\n\n"
        f"{message}"
    )


def _extract_tool_calls(messages: list[BaseMessage]) -> list[ToolCall]:
    calls: list[ToolCall] = []
    pending: dict[str, ToolCall] = {}
    for m in messages:
        if isinstance(m, AIMessage) and m.tool_calls:
            for tc in m.tool_calls:
                pending[tc["id"]] = ToolCall(name=tc["name"], args=tc.get("args", {}))
        elif isinstance(m, ToolMessage):
            tc = pending.pop(m.tool_call_id, None)
            if tc:
                preview = (m.content or "")[:200]
                calls.append(
                    ToolCall(name=tc.name, args=tc.args, result_preview=preview)
                )
    return calls


def _extract_sources(tool_calls: list[ToolCall]) -> list[SourceInfo]:
    last_doc_q = next(
        (tc.args.get("question") for tc in reversed(tool_calls)
         if tc.name == "document_search"),
        None,
    )
    if not last_doc_q:
        return []
    from app.rag.retrieval import retrieve

    pairs = retrieve(last_doc_q)
    return [
        SourceInfo(
            source_file=d.metadata.get("source_file", "unknown"),
            page=d.metadata.get("page"),
            snippet=d.page_content[:240],
            score=round(s, 3),
        )
        for d, s in pairs
    ]


def _maybe_generate_title(
    session_id: str,
    user_id: str | uuid.UUID,
    user_message: str,
    assistant_reply: str,
) -> None:
    """Best-effort title generation in a background thread.

    The thread does NOT inherit the parent's contextvars (we use threading.Thread
    rather than asyncio), so the titler's calls into storage pass user_id
    explicitly. If it ever needs the RAG layer, it would need to set the
    contextvar itself first.
    """
    from app.agent.titler import generate_title

    def _worker():
        try:
            messages = storage.list_messages(session_id, user_id=user_id)
            user_msgs = [m for m in messages if m["role"] == "user"]
            if len(user_msgs) != 1:
                return
            session = storage.get_session(session_id, user_id=user_id)
            if not session:
                return
            title = generate_title(user_message, assistant_reply)
            if title:
                if storage.auto_set_title(session_id, title, user_id=user_id):
                    log.info("auto-titled %s -> %s", session_id[:8], title)
        except Exception as e:
            log.warning("title worker failed: %s", e)

    t = threading.Thread(target=_worker, daemon=True)
    t.start()


def run_agent(
    message: str,
    session_id: str,
    attachment_text: str | None = None,
    attachment_name: str | None = None,
    language: str = "en",
    user_id: str | uuid.UUID = storage.SYSTEM_USER_ID,
) -> AgentResponse:
    """Non-streaming agent run. Returns the final AgentResponse.

    Sets the current_user contextvar so RAG tools (document_search,
    document_summarizer) and retrieval.py can scope queries to this user.
    """
    token = set_current_user(user_id)
    try:
        t0 = time.time()
        history = memory.get(session_id, user_id=user_id)

        user_content = _build_user_content(message, attachment_text, attachment_name)
        system_prompt = SYSTEM_PROMPT + language_directive(language)

        messages: list[BaseMessage] = [SystemMessage(content=system_prompt)]
        messages.extend(history)
        messages.append(HumanMessage(content=user_content))

        config = _build_config(user_id, session_id)
        final = get_graph().invoke({"messages": messages}, config=config)

        final_messages: list[BaseMessage] = final["messages"]
        answer_msg = final_messages[-1]
        answer = (
            answer_msg.content if isinstance(answer_msg, AIMessage) else str(answer_msg)
        )

        memory.append(session_id, HumanMessage(content=message), user_id=user_id)
        memory.append(session_id, AIMessage(content=answer), user_id=user_id)

        tool_calls = _extract_tool_calls(final_messages)
        sources = _extract_sources(tool_calls)

        response = AgentResponse(
            answer=answer,
            sources=sources,
            tool_calls=tool_calls,
            session_id=session_id,
            latency_ms=int((time.time() - t0) * 1000),
        )
        _maybe_generate_title(session_id, user_id, message, answer)
        return response
    finally:
        reset_current_user(token)


def stream_agent(
    message: str,
    session_id: str,
    attachment_text: str | None = None,
    attachment_name: str | None = None,
    language: str = "en",
    user_id: str | uuid.UUID = storage.SYSTEM_USER_ID,
):
    """Stream agent execution as a sequence of events.

    Sets the current_user contextvar for the duration of the stream, so any
    tool calls invoked during execution see the right user. The contextvar
    is reset in the finally block to guarantee cleanup even if the consumer
    abandons the generator partway through.
    """
    token = set_current_user(user_id)
    try:
        t0 = time.time()
        history = memory.get(session_id, user_id=user_id)

        user_content = _build_user_content(message, attachment_text, attachment_name)
        system_prompt = SYSTEM_PROMPT + language_directive(language)

        messages: list[BaseMessage] = [SystemMessage(content=system_prompt)]
        messages.extend(history)
        messages.append(HumanMessage(content=user_content))

        config = _build_config(user_id, session_id)

        accumulated_answer = ""
        final_messages: list[BaseMessage] = []
        pending_tool_calls: dict = {}

        for event in get_graph().stream(
            {"messages": messages},
            config=config,
            stream_mode=["updates", "messages"],
        ):
            mode, payload = event

            if mode == "messages":
                chunk, meta = payload
                if isinstance(chunk, AIMessageChunk) and meta.get("langgraph_node") == "agent":
                    if chunk.content:
                        accumulated_answer += chunk.content
                        yield {"type": "token", "delta": chunk.content}

            elif mode == "updates":
                for node_name, state in payload.items():
                    if not isinstance(state, dict):
                        continue
                    new_msgs = state.get("messages", [])
                    if not isinstance(new_msgs, list):
                        new_msgs = [new_msgs]

                    for m in new_msgs:
                        final_messages.append(m)

                        if isinstance(m, AIMessage) and m.tool_calls:
                            for tc in m.tool_calls:
                                pending_tool_calls[tc["id"]] = ToolCall(
                                    name=tc["name"], args=tc.get("args", {})
                                )
                                yield {
                                    "type": "tool_start",
                                    "name": tc["name"],
                                    "args": tc.get("args", {}),
                                }

                        elif isinstance(m, ToolMessage):
                            preview = (m.content or "")[:200]
                            tc = pending_tool_calls.get(m.tool_call_id)
                            if tc:
                                tc.result_preview = preview
                            yield {
                                "type": "tool_end",
                                "name": tc.name if tc else "tool",
                                "preview": preview,
                            }

        answer = accumulated_answer
        if not answer:
            for m in reversed(final_messages):
                if isinstance(m, AIMessage):
                    answer = m.content
                    break

        memory.append(session_id, HumanMessage(content=message), user_id=user_id)
        memory.append(session_id, AIMessage(content=answer), user_id=user_id)

        tool_calls = list(pending_tool_calls.values())
        sources = _extract_sources(tool_calls)

        yield {
            "type": "done",
            "answer": answer,
            "sources": [s.model_dump() for s in sources],
            "tool_calls": [tc.model_dump() for tc in tool_calls],
            "session_id": session_id,
            "latency_ms": int((time.time() - t0) * 1000),
        }

        _maybe_generate_title(session_id, user_id, message, answer)
    finally:
        reset_current_user(token)