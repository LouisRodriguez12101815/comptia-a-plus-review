"""Load study sources (notes, PDFs, YouTube captions) as text chunks.

Every loader returns a list of Chunk objects. A chunk keeps where the text
came from (source kind, file or video id, and a label such as a heading or
page number) so the report can point back to the exact place.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

HEADING = re.compile(r"^(#{1,6})\s+(.*\S)\s*$")
CAPTION_WINDOW = 20  # transcript snippets per chunk


@dataclass(frozen=True)
class Chunk:
    kind: str  # "notes", "pdf", "captions"
    source: str  # file name or YouTube video id
    label: str  # heading text, "page 3", or "00:01:30 window"
    text: str


def load_notes(path: str | Path) -> list[Chunk]:
    """Split a Markdown file into chunks, one per heading section."""
    path = Path(path)
    lines = path.read_text(encoding="utf-8").splitlines()

    chunks: list[Chunk] = []
    label = path.stem
    buffer: list[str] = []

    def flush() -> None:
        body = "\n".join(buffer).strip()
        if body:
            chunks.append(Chunk("notes", path.name, label, body))
        buffer.clear()

    for line in lines:
        match = HEADING.match(line)
        if match:
            flush()
            label = match.group(2)
            continue
        buffer.append(line)
    flush()
    return chunks


def load_pdf(path: str | Path) -> list[Chunk]:
    """Extract text from each page of a PDF that has a text layer."""
    from pypdf import PdfReader

    path = Path(path)
    reader = PdfReader(str(path))
    chunks: list[Chunk] = []
    for number, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        if text:
            chunks.append(Chunk("pdf", path.name, f"page {number}", text))
    return chunks


def load_caption_file(path: str | Path) -> list[Chunk]:
    """Load a plain-text caption or transcript file (for example one you saved by hand)."""
    path = Path(path)
    lines = [line.strip() for line in path.read_text(encoding="utf-8").splitlines()]
    lines = [line for line in lines if line]
    return _window_lines(lines, source=path.name)


def load_youtube(video_id: str, languages: tuple[str, ...] = ("en",), client=None) -> list[Chunk]:
    """Fetch captions for one YouTube video and chunk them into windows.

    Pass a ``client`` (anything with a ``fetch`` method shaped like
    ``YouTubeTranscriptApi().fetch``) to test without network access.
    """
    if client is None:
        from youtube_transcript_api import YouTubeTranscriptApi

        client = YouTubeTranscriptApi()
    transcript = client.fetch(video_id, languages=languages, preserve_formatting=False)

    chunks: list[Chunk] = []
    snippets = list(transcript)
    for start in range(0, len(snippets), CAPTION_WINDOW):
        window = snippets[start : start + CAPTION_WINDOW]
        text = " ".join(snippet.text.strip() for snippet in window if snippet.text.strip())
        if text:
            label = _timestamp(window[0].start)
            chunks.append(Chunk("captions", video_id, f"{label} window", text))
    return chunks


def _window_lines(lines: list[str], source: str) -> list[Chunk]:
    chunks: list[Chunk] = []
    for start in range(0, len(lines), CAPTION_WINDOW):
        window = lines[start : start + CAPTION_WINDOW]
        chunks.append(Chunk("captions", source, f"lines {start + 1}-{start + len(window)}", " ".join(window)))
    return chunks


def _timestamp(seconds: float) -> str:
    total = int(seconds)
    hours, rest = divmod(total, 3600)
    minutes, secs = divmod(rest, 60)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"
