"""Match study chunks to CompTIA objectives from content/objectives.json.

Matching is fuzzy: each objective title is compared with each chunk using
RapidFuzz's token_set_ratio, which rewards shared words even when the chunk
is much longer than the title. Scores run from 0 to 100.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

from rapidfuzz import fuzz

from ingest import Chunk

DEFAULT_THRESHOLD = 70.0


@dataclass(frozen=True)
class Objective:
    id: str
    title: str
    domain_id: str
    domain_title: str
    status: str


@dataclass(frozen=True)
class Match:
    chunk: Chunk
    score: float


@dataclass
class ObjectiveResult:
    objective: Objective
    matches: list[Match] = field(default_factory=list)

    @property
    def best_score(self) -> float:
        return max((m.score for m in self.matches), default=0.0)


def load_objectives(path: str | Path, exam_code: str) -> list[Objective]:
    """Read every objective for one exam code from objectives.json."""
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    for exam in data["exams"]:
        if exam["code"] == exam_code:
            return [
                Objective(
                    id=objective["id"],
                    title=objective["title"],
                    domain_id=domain["id"],
                    domain_title=domain["title"],
                    status=objective.get("status", "unknown"),
                )
                for domain in exam["domains"]
                for objective in domain["objectives"]
            ]
    known = ", ".join(e["code"] for e in data["exams"])
    raise KeyError(f"exam code {exam_code!r} not found; known codes: {known}")


def score(title: str, text: str) -> float:
    return float(fuzz.token_set_ratio(title.lower(), text.lower()))


def match_objectives(
    objectives: list[Objective],
    chunks: list[Chunk],
    threshold: float = DEFAULT_THRESHOLD,
) -> list[ObjectiveResult]:
    """Return one result per objective, keeping chunks that score at or above the threshold."""
    results: list[ObjectiveResult] = []
    for objective in objectives:
        result = ObjectiveResult(objective)
        for chunk in chunks:
            value = score(objective.title, chunk.text)
            if value >= threshold:
                result.matches.append(Match(chunk, value))
        result.matches.sort(key=lambda m: m.score, reverse=True)
        results.append(result)
    return results
