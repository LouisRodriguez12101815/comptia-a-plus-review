"""Compare your study sources with one exam's objectives and report gaps.

Examples (run from this folder, inside the virtual environment):

    python report.py --exam 220-1202 --notes ../content/core2-notes.md
    python report.py --exam clf-c02 --pdf my-notes.pdf --youtube dQw4w9WgXcQ
    python report.py --exam 220-1202 --caption-file captions.txt --json out.json

Paths default to the repo's content/objectives.json, which is read-only here.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from ingest import Chunk, load_caption_file, load_notes, load_pdf, load_youtube
from matcher import DEFAULT_THRESHOLD, ObjectiveResult, load_objectives, match_objectives

HERE = Path(__file__).resolve().parent
DEFAULT_OBJECTIVES = HERE.parent / "content" / "objectives.json"


def collect_chunks(args: argparse.Namespace) -> list[Chunk]:
    chunks: list[Chunk] = []
    for path in args.notes:
        chunks += load_notes(path)
    for path in args.pdf:
        chunks += load_pdf(path)
    for path in args.caption_file:
        chunks += load_caption_file(path)
    for video_id in args.youtube:
        chunks += load_youtube(video_id)
    return chunks


def summarize(results: list[ObjectiveResult]) -> dict:
    covered = [r for r in results if r.matches]
    gaps = [r for r in results if not r.matches]
    return {
        "objectives": len(results),
        "covered": len(covered),
        "gaps": len(gaps),
        "gap_ids": [r.objective.id for r in gaps],
        "results": [
            {
                "id": r.objective.id,
                "title": r.objective.title,
                "domain": r.objective.domain_title,
                "status": r.objective.status,
                "best_score": round(r.best_score, 1),
                "matches": [
                    {
                        "kind": m.chunk.kind,
                        "source": m.chunk.source,
                        "label": m.chunk.label,
                        "score": round(m.score, 1),
                    }
                    for m in r.matches[:5]
                ],
            }
            for r in results
        ],
    }


def print_text(report: dict) -> None:
    print(f"Objectives: {report['objectives']}  covered: {report['covered']}  gaps: {report['gaps']}")
    print()
    for item in report["results"]:
        marker = "OK  " if item["matches"] else "GAP "
        print(f"{marker}{item['id']:<6} {item['title']}  (best {item['best_score']})")
        for match in item["matches"][:3]:
            print(f"        {match['score']:>5}  {match['kind']}: {match['source']} / {match['label']}")
    print()
    if report["gap_ids"]:
        print("Gaps to study or add sources for: " + ", ".join(report["gap_ids"]))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--exam", required=True, help="exam code in objectives.json, for example 220-1202")
    parser.add_argument("--objectives", type=Path, default=DEFAULT_OBJECTIVES, help="path to objectives.json")
    parser.add_argument("--notes", action="append", default=[], type=Path, help="Markdown notes (repeatable)")
    parser.add_argument("--pdf", action="append", default=[], type=Path, help="PDF with a text layer (repeatable)")
    parser.add_argument("--caption-file", action="append", default=[], type=Path, help="saved caption text (repeatable)")
    parser.add_argument("--youtube", action="append", default=[], help="YouTube video id (repeatable)")
    parser.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD, help="minimum match score, 0-100")
    parser.add_argument("--json", type=Path, dest="json_out", help="also write the full report as JSON")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if not any([args.notes, args.pdf, args.caption_file, args.youtube]):
        print("Give at least one source: --notes, --pdf, --caption-file or --youtube.", file=sys.stderr)
        return 2

    objectives = load_objectives(args.objectives, args.exam)
    chunks = collect_chunks(args)
    results = match_objectives(objectives, chunks, threshold=args.threshold)
    report = summarize(results)

    print_text(report)
    if args.json_out:
        args.json_out.write_text(json.dumps(report, indent=2), encoding="utf-8")
        print(f"JSON written to {args.json_out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
