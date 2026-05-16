"""Ingest documents (PDF + text) into per-user Chroma collections."""
import uuid
from pathlib import Path
from typing import Iterable

from langchain_chroma import Chroma
from langchain_community.document_loaders import (
    Docx2txtLoader,
    PyPDFLoader,
    TextLoader,
)
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import settings
from app.core.logging import get_logger
from app.rag.collections import (
    collection_name_for,
    docs_dir_for,
    get_user_vectorstore,
)
from app.rag.embeddings import get_embeddings

log = get_logger(__name__)

SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".md", ".docx"}


def _load_one(path: Path) -> list[Document]:
    """Load a single file based on its extension."""
    ext = path.suffix.lower()
    if ext == ".pdf":
        return PyPDFLoader(str(path)).load()
    if ext in {".txt", ".md"}:
        return TextLoader(str(path), encoding="utf-8").load()
    if ext == ".docx":
        return Docx2txtLoader(str(path)).load()
    raise ValueError(f"Unsupported file type: {ext}")


def load_documents(docs_dir: Path) -> tuple[list[Document], int]:
    """Load every supported file under docs_dir. Returns (docs, file_count)."""
    files = sorted(
        p for p in docs_dir.rglob("*")
        if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS
    )
    if not files:
        raise FileNotFoundError(
            f"No supported files in {docs_dir}. "
            f"Drop PDFs / TXT / MD / DOCX files there and try again."
        )

    docs: list[Document] = []
    for f in files:
        loaded = _load_one(f)
        for d in loaded:
            d.metadata["source_file"] = f.name
            d.metadata.setdefault("page", d.metadata.get("page", 0))
        docs.extend(loaded)
        log.info("loaded %s (%d sections)", f.name, len(loaded))
    return docs, len(files)


def chunk_documents(docs: Iterable[Document]) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    return splitter.split_documents(list(docs))


def ingest_for_user(user_id: str | uuid.UUID) -> dict:
    """Index every file in this user's docs folder into their collection.

    Wipes the user's collection first so re-runs produce a clean state. Use
    ingest_single_file_for_user() for incremental upload-then-index flows.
    """
    user_dir = docs_dir_for(user_id)
    log.info("ingesting for user %s from %s", user_id, user_dir)

    docs, n_files = load_documents(user_dir)
    log.info("loaded %d sections from %d files", len(docs), n_files)

    chunks = chunk_documents(docs)
    log.info("created %d chunks", len(chunks))

    # Wipe and recreate the collection.
    store = get_user_vectorstore(user_id)
    try:
        store.delete_collection()
    except Exception as e:
        log.debug("delete_collection (likely empty): %s", e)

    Chroma.from_documents(
        documents=chunks,
        embedding=get_embeddings(),
        persist_directory=str(settings.chroma_dir),
        collection_name=collection_name_for(user_id),
    )
    log.info("ingestion complete for user %s", user_id)
    return {"files": n_files, "chunks": len(chunks)}


def ingest_single_file_for_user(
    user_id: str | uuid.UUID,
    file_path: Path,
) -> dict:
    """Index one file (typically just-uploaded) into the user's collection.

    Does NOT wipe the existing collection — chunks are added on top of any
    previously ingested ones. Returns chunk count for this file only.
    """
    if file_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {file_path.suffix}")

    log.info("ingesting single file %s for user %s", file_path.name, user_id)
    raw = _load_one(file_path)
    for d in raw:
        d.metadata["source_file"] = file_path.name
        d.metadata.setdefault("page", d.metadata.get("page", 0))
    chunks = chunk_documents(raw)

    # Open the existing collection and add to it (don't wipe).
    store = get_user_vectorstore(user_id)
    store.add_documents(chunks)
    log.info("added %d chunks for %s", len(chunks), file_path.name)
    return {"file": file_path.name, "chunks": len(chunks)}


def delete_file_from_user(user_id: str | uuid.UUID, filename: str) -> int:
    """Remove all chunks for a specific source file from the user's collection.

    Returns the number of chunks deleted.
    """
    store = get_user_vectorstore(user_id)
    # Chroma's where filter — match by source_file metadata.
    coll = store._collection
    matches = coll.get(where={"source_file": filename})
    ids = matches.get("ids", [])
    if not ids:
        return 0
    coll.delete(ids=ids)
    log.info("deleted %d chunks for %s (user=%s)", len(ids), filename, user_id)
    return len(ids)


def list_files_for_user(user_id: str | uuid.UUID) -> list[dict]:
    """List files in the user's docs folder with size + chunk-count metadata."""
    user_dir = docs_dir_for(user_id)
    files = []
    store = get_user_vectorstore(user_id)
    coll = store._collection

    for path in sorted(user_dir.iterdir()):
        if not path.is_file():
            continue
        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue
        chunks = coll.get(where={"source_file": path.name})
        files.append({
            "filename": path.name,
            "size_bytes": path.stat().st_size,
            "chunks_indexed": len(chunks.get("ids", [])),
        })
    return files


# --- Legacy global ingestion (superuser-only fallback) ---

def ingest() -> dict:
    """Legacy global ingestion. Now reserved for superuser /rag/ingest endpoint.

    Reads from settings.docs_dir (the root, not a per-user subdir) and writes
    to a 'documents' collection. Use ingest_for_user() for normal user flows.
    """
    log.info("LEGACY global ingest from %s", settings.docs_dir)
    docs, n_files = load_documents(settings.docs_dir)
    chunks = chunk_documents(docs)
    Chroma.from_documents(
        documents=chunks,
        embedding=get_embeddings(),
        persist_directory=str(settings.chroma_dir),
        collection_name="documents",
    )
    return {"files": n_files, "chunks": len(chunks)}


if __name__ == "__main__":
    # CLI entry point — prompts for a user_id since there's no implicit "default user" anymore
    import sys
    if len(sys.argv) < 2:
        print("Usage: python -m app.rag.ingestion <user_uuid>")
        sys.exit(1)
    result = ingest_for_user(sys.argv[1])
    print(f"\n✓ Indexed {result['chunks']} chunks from {result['files']} files.")