"""CLI: re-index every supported document under data/docs/."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.rag.ingestion import ingest  # noqa: E402

if __name__ == "__main__":
    result = ingest()
    print(f"\n✓ Indexed {result['chunks']} chunks from {result['files']} files.")
