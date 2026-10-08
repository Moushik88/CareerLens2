"""Resume PDF parsing — text layer first, OCR fallback for scanned pages."""

from __future__ import annotations

import io
import re
from dataclasses import dataclass

import fitz  # PyMuPDF


KNOWN_SKILLS = [
    "python",
    "tensorflow",
    "pytorch",
    "sql",
    "react",
    "javascript",
    "typescript",
    "machine learning",
    "deep learning",
    "pandas",
    "numpy",
    "git",
    "docker",
    "aws",
    "html",
    "css",
    "node.js",
    "java",
    "statistics",
    "deployment",
    "fastapi",
    "flask",
]


@dataclass
class ParsedResume:
    text: str
    method: str
    page_count: int
    name: str | None
    skills: list[str]
    projects: list[str]
    warning: str | None = None


def _looks_thin(text: str) -> bool:
    letters = len(re.findall(r"[A-Za-z]", text))
    words = [w for w in text.split() if len(w) > 2]
    return letters < 80 or len(words) < 25


def _extract_skills(text: str) -> list[str]:
    lower = text.lower()
    found: list[str] = []
    for skill in KNOWN_SKILLS:
        pattern = rf"(^|[^a-z0-9+.#/]){re.escape(skill)}([^a-z0-9+.#/]|$)"
        if re.search(pattern, lower):
            found.append(skill.title() if skill != "sql" else "SQL")
    # normalize a few
    normalized = []
    for s in found:
        key = s.lower()
        if key == "machine learning":
            normalized.append("Machine Learning")
        elif key == "deep learning":
            normalized.append("Deep Learning")
        elif key == "node.js":
            normalized.append("Node.js")
        else:
            normalized.append(s if s.isupper() else s.title())
    return sorted(set(normalized))


def _extract_projects(text: str) -> list[str]:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    hints = re.compile(r"project|built|developed|created|implemented|classifier|predictor", re.I)
    out = []
    for line in lines:
        if hints.search(line) and 18 < len(line) < 180:
            out.append(line)
    return list(dict.fromkeys(out))[:8]


def _guess_name(text: str) -> str | None:
    for line in text.splitlines():
        line = line.strip()
        if 2 < len(line) < 60 and "@" not in line and not re.search(
            r"skill|education|experience|project|summary|resume", line, re.I
        ):
            return line
    return None


def _ocr_pages(doc: fitz.Document, max_pages: int = 4) -> str:
    try:
        import pytesseract
        from PIL import Image
    except ImportError as exc:
        raise RuntimeError(
            "OCR dependencies missing. Install pillow + pytesseract and system Tesseract."
        ) from exc

    chunks: list[str] = []
    for i in range(min(doc.page_count, max_pages)):
        page = doc.load_page(i)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img = Image.open(io.BytesIO(pix.tobytes("png")))
        chunks.append(pytesseract.image_to_string(img))
    return "\n\n".join(chunks).strip()


def parse_resume_bytes(data: bytes, filename: str = "resume.pdf") -> ParsedResume:
    if filename.lower().endswith((".txt", ".md")):
        text = data.decode("utf-8", errors="ignore")
        return ParsedResume(
            text=text,
            method="text",
            page_count=1,
            name=_guess_name(text),
            skills=_extract_skills(text),
            projects=_extract_projects(text),
        )

    doc = fitz.open(stream=data, filetype="pdf")
    pages = [page.get_text("text") for page in doc]
    text = "\n\n".join(pages).strip()
    method = "text"
    warning = None

    if _looks_thin(text):
        try:
            ocr_text = _ocr_pages(doc)
            if not _looks_thin(ocr_text):
                text = ocr_text
                method = "ocr"
            elif ocr_text:
                text = f"{text}\n\n{ocr_text}".strip()
                method = "hybrid"
                warning = "OCR quality may be limited — prefer a clearer scan if possible."
            else:
                warning = "Scanned PDF detected but OCR returned little text. Is Tesseract installed?"
                method = "ocr"
        except Exception as exc:  # noqa: BLE001
            warning = f"Scanned PDF needs OCR but failed: {exc}"
            method = "text"

    return ParsedResume(
        text=text,
        method=method,
        page_count=doc.page_count,
        name=_guess_name(text),
        skills=_extract_skills(text),
        projects=_extract_projects(text),
        warning=warning,
    )
