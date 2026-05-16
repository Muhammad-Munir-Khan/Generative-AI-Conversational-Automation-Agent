"""Extract text from uploaded files: PDFs, images, plain text.

Handles three cases:
  - Plain text files (.txt, .md): read directly.
  - PDFs with extractable text: pypdf.
  - Image files OR scanned PDFs (pypdf returns nothing): Groq vision LLM.
"""
import base64
import io
from pathlib import Path

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__)

# Generous limits for portfolio use; tighten in production.
MAX_FILE_BYTES = 20 * 1024 * 1024   # 20 MB
MAX_PDF_PAGES_FOR_VISION = 10        # don't OCR entire books

TEXT_EXTENSIONS = {".txt", ".md", ".csv", ".tsv"}
PDF_EXTENSIONS = {".pdf"}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}


def _read_text(data: bytes, filename: str) -> str:
    """Decode a plain text file. Tries utf-8 then falls back to latin-1."""
    for encoding in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise ValueError(f"Could not decode {filename} as text")


def _extract_pdf_text(data: bytes) -> str:
    """Extract text from a PDF using pypdf. Returns '' for scanned PDFs."""
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(data))
    pages = []
    for i, page in enumerate(reader.pages):
        try:
            text = page.extract_text() or ""
        except Exception as e:
            log.warning("pypdf failed on page %d: %s", i, e)
            text = ""
        if text.strip():
            pages.append(f"--- Page {i + 1} ---\n{text}")
    return "\n\n".join(pages).strip()


def _pdf_pages_to_pngs(data: bytes, max_pages: int = MAX_PDF_PAGES_FOR_VISION) -> list[bytes]:
    """Rasterize a PDF's pages to PNG bytes for vision OCR.

    Uses pypdfium2 because it's pure Python (no Poppler install needed on Windows).
    """
    try:
        import pypdfium2 as pdfium
    except ImportError as e:
        raise RuntimeError(
            "pypdfium2 not installed. Run: pip install pypdfium2"
        ) from e

    pdf = pdfium.PdfDocument(io.BytesIO(data))
    n = min(len(pdf), max_pages)
    pngs: list[bytes] = []
    for i in range(n):
        page = pdf[i]
        # 150 DPI is a good balance: readable, not too huge.
        pil_image = page.render(scale=150 / 72).to_pil()
        buf = io.BytesIO()
        pil_image.save(buf, format="PNG")
        pngs.append(buf.getvalue())
    return pngs


def _ocr_image_with_groq(image_bytes: bytes, mime: str = "image/png") -> str:
    """Send an image to Groq's vision model and ask for full text extraction."""
    if settings.llm_provider.lower() != "groq" or not settings.groq_api_key:
        raise RuntimeError(
            "OCR for images / scanned PDFs requires LLM_PROVIDER=groq with a "
            "GROQ_API_KEY in .env (Ollama doesn't have a built-in vision model "
            "in this project's setup)."
        )

    try:
        from groq import Groq
    except ImportError as e:
        raise RuntimeError("groq package not installed") from e

    client = Groq(api_key=settings.groq_api_key)
    b64 = base64.b64encode(image_bytes).decode("ascii")

    response = client.chat.completions.create(
        model=settings.groq_vision_model,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": (
                        "Extract all text from this image. Preserve the original "
                        "structure: keep headings, paragraphs, lists, and tables "
                        "in their original layout. If a table is present, format "
                        "it as a markdown table. Output only the extracted text, "
                        "no commentary."
                    ),
                },
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{mime};base64,{b64}"},
                },
            ],
        }],
        temperature=0.0,
    )
    return response.choices[0].message.content or ""


def extract_attachment(filename: str, data: bytes) -> dict:
    """Top-level dispatcher.

    Returns: {
      "text": extracted text,
      "method": which path was used,
      "pages_processed": int (for PDFs),
      "size_bytes": original file size,
    }
    """
    if len(data) > MAX_FILE_BYTES:
        raise ValueError(
            f"File too large: {len(data) / 1e6:.1f} MB (max {MAX_FILE_BYTES / 1e6:.0f} MB)"
        )

    suffix = Path(filename).suffix.lower()
    result: dict = {"size_bytes": len(data), "pages_processed": 0}

    if suffix in TEXT_EXTENSIONS:
        result["text"] = _read_text(data, filename)
        result["method"] = "text"
        return result

    if suffix in PDF_EXTENSIONS:
        text = _extract_pdf_text(data)
        if text:
            result["text"] = text
            result["method"] = "pypdf"
            return result
        # Scanned PDF — fall back to vision.
        log.info("PDF has no extractable text, falling back to vision OCR")
        pages = _pdf_pages_to_pngs(data)
        if not pages:
            raise ValueError("PDF appears empty")
        page_texts = []
        for i, png in enumerate(pages):
            log.info("OCR page %d/%d via vision", i + 1, len(pages))
            page_texts.append(f"--- Page {i + 1} ---\n{_ocr_image_with_groq(png)}")
        result["text"] = "\n\n".join(page_texts)
        result["method"] = "pdf+vision"
        result["pages_processed"] = len(pages)
        return result

    if suffix in IMAGE_EXTENSIONS:
        mime = "image/jpeg" if suffix in {".jpg", ".jpeg"} else f"image/{suffix.lstrip('.')}"
        result["text"] = _ocr_image_with_groq(data, mime=mime)
        result["method"] = "vision"
        result["pages_processed"] = 1
        return result

    raise ValueError(
        f"Unsupported file type: {suffix}. "
        f"Allowed: {sorted(TEXT_EXTENSIONS | PDF_EXTENSIONS | IMAGE_EXTENSIONS)}"
    )