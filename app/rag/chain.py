"""Single-shot RAG chain: retrieve top-k chunks then answer with citations."""
import time

from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate

from app.core.language import language_directive
from app.core.llm import get_llm
from app.core.schemas import QueryResponse, SourceInfo
from app.rag.retrieval import retrieve

SYSTEM_PROMPT = """You are a precise assistant that answers strictly from the provided context.

Rules:
- Use ONLY the information in the context below.
- If the context does not contain the answer, reply: "I don't know based on the provided documents."
- After each factual claim, cite the source like [filename.pdf].
- Be concise.

Context:
{context}
"""


def format_context(docs: list[Document]) -> str:
    parts = []
    for i, d in enumerate(docs, 1):
        src = d.metadata.get("source_file", "unknown")
        page = d.metadata.get("page", "?")
        parts.append(f"[{i}] {src} (p.{page})\n{d.page_content}")
    return "\n\n".join(parts)


def rag_answer(
    question: str,
    top_k: int | None = None,
    language: str = "en",
) -> QueryResponse:
    t0 = time.time()
    pairs = retrieve(question, k=top_k)
    docs = [p[0] for p in pairs]
    scores = [p[1] for p in pairs]

    if not docs:
        return QueryResponse(
            answer="I don't have any indexed documents yet. Please upload some first.",
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

    sources = [
        SourceInfo(
            source_file=d.metadata.get("source_file", "unknown"),
            page=d.metadata.get("page"),
            snippet=d.page_content[:240],
            score=round(s, 3),
        )
        for d, s in zip(docs, scores)
    ]

    return QueryResponse(
        answer=response.content,
        sources=sources,
        latency_ms=int((time.time() - t0) * 1000),
    )