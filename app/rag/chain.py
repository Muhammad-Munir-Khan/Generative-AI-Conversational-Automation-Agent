"""Single-shot RAG chain: retrieve top-k chunks then answer with citations.

Now retrieves from BOTH the user's personal documents AND the shared global
knowledge base (admin-curated). Results are merged and scored together; each
SourceInfo carries an `origin` field ("personal" or "knowledge_base") so the
UI can render a small badge distinguishing the two.

If the user has no personal documents and the KB is empty, we tell them so;
otherwise the agent answers from whatever is available.
"""
import time

from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate

from app.core.language import language_directive
from app.core.llm import get_llm
from app.core.schemas import QueryResponse, SourceInfo
from app.rag.retrieval import retrieve_merged

SYSTEM_PROMPT = """You are a precise assistant that answers strictly from the provided context.

The context below contains chunks from two possible sources:
- The user's own indexed documents.
- A shared knowledge base curated by administrators.

Rules:
- Use ONLY the information in the context below.
- If the context does not contain the answer, reply: "I don't know based on the provided documents."
- After each factual claim, cite the source like [filename].
- Be concise.

Context:
{context}
"""


def _source_label(doc: Document) -> str:
    """Best human-readable label for a chunk.

    Personal docs:        metadata["source_file"]
    Global KB chunks:     metadata["source_title"]  (set by admin upload)
    Falls back to "unknown" if neither is present.
    """
    md = doc.metadata or {}
    return md.get("source_file") or md.get("source_title") or "unknown"


def format_context(docs: list[Document]) -> str:
    parts = []
    for i, d in enumerate(docs, 1):
        src = _source_label(d)
        page = (d.metadata or {}).get("page", "?")
        origin = (d.metadata or {}).get("origin", "personal")
        origin_label = "knowledge base" if origin == "knowledge_base" else "your documents"
        parts.append(f"[{i}] {src} (p.{page}, {origin_label})\n{d.page_content}")
    return "\n\n".join(parts)


def rag_answer(
    question: str,
    top_k: int | None = None,
    language: str = "en",
) -> QueryResponse:
    t0 = time.time()
    pairs = retrieve_merged(question, k=top_k)
    docs = [p[0] for p in pairs]
    scores = [p[1] for p in pairs]

    if not docs:
        return QueryResponse(
            answer=(
                "I don't have anything indexed to answer from yet. "
                "Upload a document, or ask an admin to add content to the knowledge base."
            ),
            sources=[],
            latency_ms=int((time.time() - t0) * 1000),
        )

    context = format_context(docs)
    system_with_lang = SYSTEM_PROMPT + language_directive(language)

    prompt = ChatPromptTemplate.from_messages(
        [("system", system_with_lang), ("user", "{question}")]
    )
    chain = prompt | get_llm()
    response = chain.invoke({"context": context, "question": question})

    sources = []
    for d, s in zip(docs, scores):
        md = d.metadata or {}
        origin = md.get("origin", "personal")
        # `page` may be a non-int string ("?", "") from some loaders; coerce
        # carefully so SourceInfo (page: int | None) stays happy.
        raw_page = md.get("page")
        try:
            page_val = int(raw_page) if raw_page not in (None, "", "?") else None
        except (TypeError, ValueError):
            page_val = None
        sources.append(
            SourceInfo(
                source_file=_source_label(d),
                page=page_val,
                snippet=d.page_content[:240],
                score=round(s, 3) if s is not None else None,
                origin=origin if origin in ("personal", "knowledge_base") else "personal",
            )
        )

    return QueryResponse(
        answer=response.content,
        sources=sources,
        latency_ms=int((time.time() - t0) * 1000),
    )