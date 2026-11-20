"""Pandas analysis and an interruptible, side-effect-free LangGraph review flow."""

from __future__ import annotations

from math import isfinite
from pathlib import Path
from typing import Any, Literal, TypedDict

import pandas as pd
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import interrupt

REQUIRED_COLUMNS = ("record_id", "domain", "practice_score")
DEFAULT_THRESHOLD = 70.0

# Clearly mock data used only when the caller explicitly permits fallback.
MOCK_FALLBACK_RECORDS: list[dict[str, str]] = [
    {"record_id": "mock-fallback-01", "domain": "demo", "practice_score": "75"},
]


class ReviewState(TypedDict, total=False):
    """JSON-like state; DataFrames stay local to nodes and never enter the graph."""

    data_path: str
    use_mock_fallback: bool
    threshold: float
    input_metadata: dict[str, Any]
    raw_records: list[dict[str, Any]]
    raw_columns: list[str]
    cleaned_records: list[dict[str, Any]]
    audit_rows: list[dict[str, Any]]
    original_count: int
    retained_count: int
    dropped_count: int
    clean_status: str
    summary: list[dict[str, Any]]
    flagged: list[dict[str, Any]]
    review_packet: dict[str, Any]
    review_decision: dict[str, str]
    workflow_status: str
    external_action: str


def load_data(
    source: str | Path,
    *,
    use_mock_fallback: bool = False,
) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Read CSV rows; optional missing-file fallback is explicit in returned metadata."""
    path = Path(source)
    if not path.is_file():
        if not use_mock_fallback:
            raise FileNotFoundError(f"Input CSV not found: {path}")
        frame = pd.DataFrame(MOCK_FALLBACK_RECORDS)
        return frame, {
            "source_kind": "mock_fallback",
            "source_path": str(path),
            "fallback_used": True,
            "fallback_reason": f"Input CSV not found: {path}",
            "notice": "DEMO FALLBACK: using explicitly labeled synthetic records; these are not learner outcomes.",
        }

    frame = pd.read_csv(path, dtype={"practice_score": "string"}, keep_default_na=False)
    return frame, {
        "source_kind": "csv_file",
        "source_path": str(path),
        "fallback_used": False,
        "fallback_reason": None,
        "notice": "Loaded the supplied CSV file.",
    }


def validate_required_columns(frame: pd.DataFrame) -> None:
    missing = [column for column in REQUIRED_COLUMNS if column not in frame.columns]
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")


def _clean_records(frame: pd.DataFrame) -> tuple[pd.DataFrame, list[dict[str, Any]], dict[str, int | str]]:
    validate_required_columns(frame)
    original_count = int(len(frame))
    work = frame.copy()
    original_scores = work["practice_score"].astype("string").fillna("").str.strip()
    numeric_scores = pd.to_numeric(original_scores, errors="coerce")
    invalid_mask = numeric_scores.isna()

    audit_rows: list[dict[str, Any]] = []
    for index in work.index[invalid_mask]:
        raw_value = str(original_scores.loc[index])
        reason = "blank practice_score" if raw_value == "" else "practice_score is not numeric; coerced to missing"
        audit_rows.append({
            "record_id": str(work.loc[index, "record_id"]),
            "domain": str(work.loc[index, "domain"]),
            "raw_practice_score": raw_value,
            "excluded": True,
            "reason": reason,
        })

    work["practice_score"] = numeric_scores
    retained = work.loc[~invalid_mask].copy()
    retained["practice_score"] = retained["practice_score"].astype(float)
    counts: dict[str, int | str] = {
        "original_count": original_count,
        "retained_count": int(len(retained)),
        "dropped_count": original_count - int(len(retained)),
        "clean_status": "no_valid_scores" if original_count > 0 and retained.empty else ("empty_input" if original_count == 0 else "ok"),
    }
    return retained, audit_rows, counts


def analyze_records(
    records: pd.DataFrame | list[dict[str, Any]],
    *,
    threshold: float = DEFAULT_THRESHOLD,
    source_metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Clean, summarize, and flag low observed practice scores; returns plain values."""
    if not isfinite(float(threshold)):
        raise ValueError("threshold must be a finite number")
    frame = records.copy() if isinstance(records, pd.DataFrame) else pd.DataFrame(records)
    if frame.empty and len(frame.columns) == 0:
        frame = pd.DataFrame(columns=REQUIRED_COLUMNS)
    retained, audit_rows, counts = _clean_records(frame)

    if retained.empty:
        summary: list[dict[str, Any]] = []
        flagged: list[dict[str, Any]] = []
    else:
        grouped = (
            retained.groupby("domain", dropna=False)["practice_score"]
            .agg(mean_practice_score="mean", record_count="count")
            .reset_index()
        )
        grouped["mean_practice_score"] = grouped["mean_practice_score"].round(2)
        summary = [
            {"domain": str(row.domain), "mean_practice_score": float(row.mean_practice_score), "record_count": int(row.record_count)}
            for row in grouped.itertuples(index=False)
        ]
        flagged = [
            {"record_id": str(row.record_id), "domain": str(row.domain), "practice_score": float(row.practice_score)}
            for row in retained.loc[retained["practice_score"] < float(threshold), REQUIRED_COLUMNS].itertuples(index=False)
        ]

    meta: dict[str, Any] = {
        **(source_metadata or {"source_kind": "in_memory_records", "fallback_used": False}),
        **counts,
        "threshold": float(threshold),
        "invalid_score_policy": "pd.to_numeric(errors='coerce'); exclude invalid or blank scores from summaries and flags; preserve each exclusion and reason in audit_rows.",
        "signal_note": "A score below the configurable cutoff is a review signal, not a diagnosis, prediction, or learner outcome.",
    }
    return {"summary": summary, "flagged": flagged, "dropped_count": int(counts["dropped_count"]), "metadata": meta, "audit_rows": audit_rows}



def run_course_checks(fixture_path: str | Path, missing_column_path: str | Path) -> None:
    """Run four requested assertions and print success only after each assertion passes."""
    valid_frame, valid_source = load_data(fixture_path)
    valid = analyze_records(valid_frame, threshold=70, source_metadata=valid_source)
    assert valid["metadata"]["original_count"] == 8
    assert valid["metadata"]["retained_count"] == 6
    assert valid["dropped_count"] == 2
    assert valid["summary"] == [
        {"domain": "compute", "mean_practice_score": 88.0, "record_count": 1},
        {"domain": "database", "mean_practice_score": 69.5, "record_count": 2},
        {"domain": "network", "mean_practice_score": 93.0, "record_count": 1},
        {"domain": "storage", "mean_practice_score": 66.5, "record_count": 2},
    ]
    assert [row["record_id"] for row in valid["flagged"]] == ["r003", "r006"]
    assert len(valid["audit_rows"]) == 2
    print("ok 1 — valid fixture summary, flags, and cleaning counts")

    missing_path = Path(fixture_path).parent / "intentionally_missing.csv"
    fallback_frame, fallback_meta = load_data(missing_path, use_mock_fallback=True)
    fallback = analyze_records(fallback_frame, threshold=70, source_metadata=fallback_meta)
    assert fallback["metadata"]["fallback_used"] is True
    assert fallback["metadata"]["source_kind"] == "mock_fallback"
    assert "DEMO FALLBACK" in fallback["metadata"]["notice"]
    assert fallback["metadata"]["original_count"] == 1
    assert fallback["metadata"]["retained_count"] == 1
    assert fallback["metadata"]["dropped_count"] == 0
    assert fallback["summary"] == [{"domain": "demo", "mean_practice_score": 75.0, "record_count": 1}]
    print("fallback notice:", fallback["metadata"]["notice"])
    print("fallback reason:", fallback["metadata"]["fallback_reason"])
    print("ok 2 — missing-file fallback is explicit and visible")

    missing_columns, _ = load_data(missing_column_path)
    try:
        analyze_records(missing_columns)
    except ValueError as error:
        assert str(error) == "Missing required columns: practice_score"
    else:
        raise AssertionError("missing required column did not raise ValueError")
    print("ok 3 — missing-column error is clear")

    no_flags = analyze_records(valid_frame, threshold=58)
    assert no_flags["flagged"] == []
    assert no_flags["metadata"]["threshold"] == 58.0
    print("ok 4 — lower boundary threshold produces no flags")
    print("all tests passed")

def _load_node(state: ReviewState) -> dict[str, Any]:
    frame, metadata = load_data(state["data_path"], use_mock_fallback=state.get("use_mock_fallback", False))
    # Keep LangGraph state serializable; no DataFrame crosses a node boundary.
    raw_records = frame.astype("string").fillna("").to_dict(orient="records")
    return {"raw_records": raw_records, "raw_columns": [str(column) for column in frame.columns], "input_metadata": metadata}


def _clean_node(state: ReviewState) -> dict[str, Any]:
    frame = pd.DataFrame(state["raw_records"], columns=state.get("raw_columns"))
    retained, audit_rows, counts = _clean_records(frame)
    clean_records = retained.assign(practice_score=retained["practice_score"].astype(float)).to_dict(orient="records")
    return {
        "cleaned_records": clean_records,
        "audit_rows": audit_rows,
        **counts,
    }


def _analyze_node(state: ReviewState) -> dict[str, Any]:
    result = analyze_records(
        state["cleaned_records"],
        threshold=state.get("threshold", DEFAULT_THRESHOLD),
        source_metadata=state.get("input_metadata"),
    )
    return {"summary": result["summary"], "flagged": result["flagged"], "external_action": "none"}


def _human_review_node(state: ReviewState) -> dict[str, Any]:
    packet = {
        "summary": state.get("summary", []),
        "flagged": state.get("flagged", []),
        "audit_rows": state.get("audit_rows", []),
        "safety": "Review only. No message, site change, or other external action is performed by this workflow.",
        "required_response": {"decision": "approve or reject", "notes": "reviewer explanation"},
    }
    decision = interrupt(packet)
    if not isinstance(decision, dict) or decision.get("decision") not in {"approve", "reject"}:
        raise ValueError("Reviewer must resume with a decision of 'approve' or 'reject'.")
    normalized = {
        "decision": str(decision["decision"]),
        "notes": str(decision.get("notes", "")),
    }
    return {
        "review_packet": packet,
        "review_decision": normalized,
        "workflow_status": "review_approved_no_external_action" if normalized["decision"] == "approve" else "review_rejected_no_external_action",
        "external_action": "none",
    }


def build_review_graph():
    """Build the real four-node workflow using current LangGraph interrupt APIs."""
    graph = StateGraph(ReviewState)
    graph.add_node("load", _load_node)
    graph.add_node("clean", _clean_node)
    graph.add_node("analyze", _analyze_node)
    graph.add_node("human_review", _human_review_node)
    graph.add_edge(START, "load")
    graph.add_edge("load", "clean")
    graph.add_edge("clean", "analyze")
    graph.add_edge("analyze", "human_review")
    graph.add_edge("human_review", END)
    return graph.compile(checkpointer=InMemorySaver())
