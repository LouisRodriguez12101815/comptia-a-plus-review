"""Reproducible blinded samples and agreement with supplied reference labels.

Agreement is not automatically accuracy. A second model's labels are another
assessment; a validated human reference is needed for an accuracy claim.
The sampling frame is resolved notes-grade leaf items, not all rubric headings
or unresolved items. sampling_manifest exposes the excluded population counts.
"""
from __future__ import annotations

import hashlib
import json
import math
from collections.abc import Iterable

GRADES = ("absent", "mentioned", "taught")
SCORES = {"absent": 0.0, "mentioned": 0.5, "taught": 1.0}
DEFAULT_SEED = "core2-openai-validation-v1"


def _indexed(rows: Iterable[dict], name: str) -> dict[str, dict]:
    index: dict[str, dict] = {}
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError(f"{name} contains a non-object row.")
        iid = row.get("item_id")
        if not isinstance(iid, str) or not iid:
            raise ValueError(f"{name} contains an invalid item_id.")
        if iid in index:
            raise ValueError(f"{name} contains duplicate item_id: {iid}")
        index[iid] = row
    return index


def _is_leaf(row: dict) -> bool:
    return row.get("is_leaf") is True or row.get("is_leaf") == "1"


def _population(rows: Iterable[dict]) -> tuple[dict[str, dict], list[dict], list[dict]]:
    index = _indexed(rows, "Population")
    leaves = [row for row in index.values() if _is_leaf(row)]
    eligible = [row for row in leaves if row.get("notes_grade") in GRADES]
    return index, leaves, eligible


def sample_rows(rows: Iterable[dict], count: int = 40, seed: str = DEFAULT_SEED) -> list[dict]:
    """Return up to count resolved leaf rows using a seeded hash permutation.

    Freeze the seed before examining individual outcomes. This deterministic
    pseudo-random ordering is stable across input order and Python versions.
    If fewer eligible rows exist, return all of them; the manifest records this.
    Unresolved/invalid notes labels are excluded and must be reported separately.
    """
    if not isinstance(count, int) or isinstance(count, bool) or count <= 0:
        raise ValueError("count must be a positive integer.")
    if not isinstance(seed, str) or not seed:
        raise ValueError("seed must be a nonempty string.")
    _, _, eligible = _population(rows)
    def rank(row: dict) -> tuple[str, str]:
        iid = row["item_id"]
        return hashlib.sha256((seed + "\0" + iid).encode("utf-8")).hexdigest(), iid
    return [dict(row) for row in sorted(eligible, key=rank)[:count]]


def sampling_manifest(rows: Iterable[dict], count: int = 40, seed: str = DEFAULT_SEED) -> dict:
    """Describe the exact sampling frame, exclusions, seed, and selected IDs."""
    source = list(rows)
    index, leaves, eligible = _population(source)
    selected = sample_rows(source, count=count, seed=seed)
    population_ids = sorted(row["item_id"] for row in eligible)
    digest = hashlib.sha256(json.dumps(population_ids, separators=(",", ":"),
                                      ensure_ascii=False).encode("utf-8")).hexdigest()
    return {
        "seed": seed,
        "algorithm": "ascending SHA-256(seed + NUL + item_id), without replacement",
        "population_definition": "Leaf rows with a resolved notes_grade (absent, mentioned, or taught).",
        "total_rows": len(index),
        "leaf_rows": len(leaves),
        "nonleaf_rows": len(index) - len(leaves),
        "eligible_resolved_notes": len(eligible),
        "unresolved_or_invalid_notes_leaves": len(leaves) - len(eligible),
        "requested_count": count,
        "sample_count": len(selected),
        "population_ids_sha256": digest,
        "selected_ids": [row["item_id"] for row in selected],
        "limitation": "Agreement on this sample does not assess unresolved items or systematic reviewer error.",
    }


def blinded_rows(rows: Iterable[dict]) -> list[dict]:
    """Create review rows with no original labels, reasons, citations, or scores."""
    index = _indexed(rows, "Sample")
    return [
        {**{field: row.get(field, "") for field in ("item_id", "objective", "path", "item_text")},
         "reference_notes_grade": "", "reference_material_grade": "",
         "reason": "", "evidence_refs": ""}
        for row in index.values()
    ]


def agreement_metrics(original: Iterable[dict], reference: Iterable[dict],
                      field: str = "notes_grade") -> dict:
    """Compare exact, complete ID sets; reject unresolved or missing labels.

    Reference columns are reference_notes_grade or reference_material_grade.
    Wilson bounds approximate sampling uncertainty in agreement, not systematic
    reviewer error or exam readiness. Counts refer to items, not two independent
    observations when notes and material are evaluated on the same sample.
    """
    if field not in ("notes_grade", "material_grade"):
        raise ValueError("field must be notes_grade or material_grade.")
    baseline = _indexed(original, "Original")
    reviewed = _indexed(reference, "Reference")
    if not baseline:
        raise ValueError("At least one reviewed item is required.")
    if set(baseline) != set(reviewed):
        missing = len(set(baseline) - set(reviewed))
        extra = len(set(reviewed) - set(baseline))
        raise ValueError(f"Reference ID set differs: {missing} missing, {extra} unexpected.")
    reference_field = "reference_" + field
    matrix = {a: {b: 0 for b in GRADES} for a in GRADES}
    agreements = overgraded = undergraded = 0
    absolute_difference = 0.0
    for iid in sorted(baseline):
        a, b = baseline[iid].get(field), reviewed[iid].get(reference_field)
        if a not in GRADES:
            raise ValueError(f"Original {field} is unresolved or invalid for {iid}.")
        if b not in GRADES:
            raise ValueError(f"Reference {reference_field} is missing or invalid for {iid}.")
        matrix[a][b] += 1
        agreements += a == b
        overgraded += SCORES[a] > SCORES[b]
        undergraded += SCORES[a] < SCORES[b]
        absolute_difference += abs(SCORES[a] - SCORES[b])
    n = len(baseline)
    p, z = agreements / n, 1.959963984540054
    denominator = 1 + z * z / n
    center = (p + z * z / (2 * n)) / denominator
    halfwidth = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denominator
    return {
        "field": field,
        "sample_size": n,
        "agreements": agreements,
        "agreement_percent": round(100 * p, 4),
        "wilson_95_percent": {
            "low": round(100 * max(0.0, center - halfwidth), 4),
            "high": round(100 * min(1.0, center + halfwidth), 4),
        },
        "confusion_matrix": matrix,
        "confusion_orientation": "Rows: original labels. Columns: reference labels.",
        "overgraded": overgraded,
        "undergraded": undergraded,
        "mean_absolute_grade_difference": round(absolute_difference / n, 6),
        "grade_scale": dict(SCORES),
        "methodology": "Agreement with supplied reference; not measured accuracy unless the reference is validated by humans.",
        "interval_scope": "Approximate sampling interval for agreement; excludes systematic reviewer error and unresolved items.",
    }
