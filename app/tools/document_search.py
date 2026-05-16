"""Tool: search the indexed knowledge base."""
from langchain_core.tools import tool

from app.rag.chain import rag_answer


@tool
def document_search(question: str) -> str:
    """Search the user's indexed documents (PDFs, TXT, MD) for an answer.

    Use this whenever the user asks about content from their uploaded files,
    domain knowledge, manuals, policies, or anything that could be in the docs.

    Args:
        question: A natural-language question to search the documents for.

    Returns:
        An answer with bracketed source citations, or a no-answer message.
    """
    result = rag_answer(question)
    if not result.sources:
        return "No matching information found in the indexed documents."
    sources_str = ", ".join(s.source_file for s in result.sources)
    return f"{result.answer}\n\nSources: {sources_str}"
