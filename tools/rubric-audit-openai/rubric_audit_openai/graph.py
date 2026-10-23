"""Control flow for the audit; grading and scoring live in ordinary stage functions.

``build_graph`` uses the real LangGraph runtime. ``run_linear`` is a small,
sequential reference executor for offline fixtures, with no checkpointing. It
must never be described as a successful LangGraph execution.

Each worker receives only ``{"job": job}``. Jobs must therefore carry their own
immutable request data, and worker results must be keyed by a unique ``job_id``.
Use a new job ID for a retry with a different request or attempt.
"""
from __future__ import annotations

from collections.abc import Callable, Mapping
from copy import deepcopy
from typing import Annotated, Any, TypedDict


Stage = Callable[[dict[str, Any]], dict[str, Any]]
STAGE_NAMES = (
    "snapshot", "extract", "verify", "prepare", "grade_batch", "merge",
    "recheck", "finish", "evaluate", "report",
)


def merge_batch_results(
    previous: Mapping[str, Any] | None,
    update: Mapping[str, Any] | None,
) -> dict[str, Any]:
    """Order-independent fan-in, accepting identical replay but not conflicts."""
    result = dict(previous or {})
    for job_id, envelope in (update or {}).items():
        if not isinstance(job_id, str) or not job_id:
            raise ValueError("Batch result keys must be non-empty job IDs")
        if job_id in result and result[job_id] != envelope:
            raise ValueError(f"Conflicting results for immutable job {job_id}")
        result[job_id] = envelope
    return {key: result[key] for key in sorted(result)}


class AuditState(TypedDict, total=False):
    run_id: str
    manifest: dict[str, Any]
    rubric: list[dict[str, Any]]
    evidence: list[dict[str, Any]]
    inventory: list[dict[str, Any]]
    jobs: list[dict[str, Any]]
    batch_results: Annotated[dict[str, Any], merge_batch_results]
    pending_jobs: list[dict[str, Any]]
    attempt: int
    max_attempts: int
    needs_retry: bool
    retry_exhausted: bool
    decisions: dict[str, Any]
    errors: list[Any]
    status: str
    report_paths: dict[str, str]
    recheck_done: bool
    config: dict[str, Any]
    accepted: dict[str, Any]
    requests: dict[str, Any]
    outcomes: dict[str, Any]
    candidate_decisions: dict[str, Any]
    run_dir: str
    input_identity: dict[str, Any]
    source_hashes: dict[str, str]
    raw_rubric: str
    phases: dict[str, Any]
    sample_path: str
    data: dict[str, Any]


class WorkerState(TypedDict):
    job: dict[str, Any]


def _validate_stages(stages: Mapping[str, Stage]) -> None:
    missing = [name for name in STAGE_NAMES if not callable(stages.get(name))]
    if missing:
        raise ValueError("Missing stage functions: " + ", ".join(missing))


def _budget(state: Mapping[str, Any]) -> tuple[int, int]:
    attempt = state.get("attempt", 0)
    limit = state.get("max_attempts")
    if type(limit) is not int or limit < 1:
        raise ValueError("max_attempts must be a positive integer")
    if type(attempt) is not int or not 0 <= attempt <= limit:
        raise ValueError("attempt must be an integer between zero and max_attempts")
    return attempt, limit


def _invoke_stage(fn: Stage, state: dict[str, Any]) -> dict[str, Any]:
    update = fn(state)
    if not isinstance(update, dict):
        raise TypeError("Stage functions must return dictionaries")
    unknown = set(update) - set(AuditState.__annotations__)
    if unknown:
        raise ValueError("Unknown graph state fields: " + ", ".join(sorted(unknown)))
    return update


def _prepare(stages: Mapping[str, Stage], state: dict[str, Any]) -> dict[str, Any]:
    attempt, limit = _budget(state)
    if attempt >= limit:
        raise ValueError("Cannot prepare another round after the retry budget")
    update = _invoke_stage(stages["prepare"], state)
    if type(update.get("attempt")) is not int or update["attempt"] != attempt + 1:
        raise ValueError("prepare must increment attempt by exactly one")
    if update.get("max_attempts", limit) != limit:
        raise ValueError("prepare cannot change the retry budget")
    _jobs({**state, **update})
    return update


def _jobs(state: Mapping[str, Any]) -> list[dict[str, Any]]:
    jobs = state.get("jobs", [])
    if not isinstance(jobs, list):
        raise TypeError("jobs must be a list")
    seen: set[str] = set()
    for job in jobs:
        if not isinstance(job, dict):
            raise TypeError("Every job must be a dictionary")
        job_id = job.get("job_id")
        if not isinstance(job_id, str) or not job_id or job_id in seen:
            raise ValueError("Every pending job must have a unique non-empty job_id")
        seen.add(job_id)
    return jobs


def _worker(stages: Mapping[str, Stage], state: dict[str, Any]) -> dict[str, Any]:
    job_id = state["job"]["job_id"]
    update = _invoke_stage(stages["grade_batch"], state)
    if set(update) != {"batch_results"}:
        raise ValueError("grade_batch must return only the batch_results update")
    results = update["batch_results"]
    if not isinstance(results, dict) or set(results) != {job_id}:
        raise ValueError("grade_batch must return exactly its own job_id")
    return update


def _finish(stages: Mapping[str, Stage], state: dict[str, Any]) -> dict[str, Any]:
    update = _invoke_stage(stages["finish"], state)
    combined = {**state, **update}
    attempt, limit = _budget(combined)
    if type(combined.get("needs_retry")) is not bool:
        raise ValueError("finish must explicitly set the boolean needs_retry")
    if combined["needs_retry"] and attempt >= limit:
        update = {**update, "status": "needs_review", "retry_exhausted": True}
    return update


def route_after_finish(state: Mapping[str, Any]) -> str:
    """Retry only inside the explicit budget; exhausted items remain unresolved."""
    attempt, limit = _budget(state)
    if type(state.get("needs_retry")) is not bool:
        raise ValueError("needs_retry must be a boolean")
    return "prepare" if state["needs_retry"] and attempt < limit else "evaluate"


def _terminal(stages: Mapping[str, Stage], name: str, state: dict[str, Any]) -> dict[str, Any]:
    update = _invoke_stage(stages[name], state)
    if state.get("retry_exhausted"):
        # A downstream formatting/evaluation stage cannot erase an exhausted
        # work queue's terminal review requirement.
        update = {**update, "retry_exhausted": True, "status": "needs_review"}
    return update


def build_graph(stages: Mapping[str, Stage], *, checkpointer: Any = None) -> Any:
    """Compile the genuine LangGraph StateGraph with dynamic batch fan-out.

    For persistence, construct ``SqliteSaver`` in its context manager and keep
    that context open for graph execution. Invoke with a stable ``thread_id``.
    Imports are intentionally lazy: offline fixture tests do not need LangGraph.
    """
    _validate_stages(stages)
    try:
        from langgraph.graph import END, START, StateGraph
        from langgraph.types import Send
    except ImportError as exc:
        raise RuntimeError(
            "LangGraph unavailable. Install the project's graph dependencies; "
            "run_linear is a sequential reference executor, not LangGraph."
        ) from exc

    builder = StateGraph(AuditState)

    def ordinary_node(fn: Stage) -> Stage:
        def node(state: AuditState) -> dict[str, Any]:
            return _invoke_stage(fn, state)
        return node

    def grade_batch_node(state: WorkerState) -> dict[str, Any]:
        return _worker(stages, state)

    for name in STAGE_NAMES:
        if name == "prepare":
            builder.add_node(name, lambda state: _prepare(stages, state))
        elif name == "grade_batch":
            builder.add_node(name, grade_batch_node, input_schema=WorkerState)
        elif name == "finish":
            builder.add_node(name, lambda state: _finish(stages, state))
        elif name == "evaluate":
            builder.add_node(name, lambda state: _terminal(stages, "evaluate", state))
        elif name == "report":
            builder.add_node(name, lambda state: _terminal(stages, "report", state))
        else:
            builder.add_node(name, ordinary_node(stages[name]))

    def dispatch(state: AuditState) -> Any:
        jobs = _jobs(state)
        if not jobs:
            return "merge"
        return [Send("grade_batch", {"job": job}) for job in jobs]

    builder.add_edge(START, "snapshot")
    builder.add_edge("snapshot", "extract")
    builder.add_edge("extract", "verify")
    builder.add_edge("verify", "prepare")
    builder.add_conditional_edges("prepare", dispatch, ["grade_batch", "merge"])
    builder.add_edge("grade_batch", "merge")
    builder.add_edge("merge", "recheck")
    builder.add_edge("recheck", "finish")
    builder.add_conditional_edges("finish", route_after_finish, ["prepare", "evaluate"])
    builder.add_edge("evaluate", "report")
    builder.add_edge("report", END)
    return builder.compile(checkpointer=checkpointer)


def _apply(state: dict[str, Any], update: dict[str, Any]) -> None:
    for key, value in update.items():
        if key == "batch_results":
            state[key] = merge_batch_results(state.get(key), value)
        else:
            state[key] = value


def run_linear(stages: Mapping[str, Stage], initial_state: Mapping[str, Any]) -> dict[str, Any]:
    """Run the same stage functions sequentially, without LangGraph or checkpoints.

    This is an offline reference executor for fixtures and deterministic replay.
    It provides no parallelism or persistent recovery and is labelled separately
    by the CLI. It does not make model calls unless the supplied stages do so.
    """
    _validate_stages(stages)
    state = deepcopy(dict(initial_state))
    _budget(state)
    for name in ("snapshot", "extract", "verify"):
        _apply(state, _invoke_stage(stages[name], state))
    while True:
        _apply(state, _prepare(stages, state))
        for job in _jobs(state):
            _apply(state, _worker(stages, {"job": job}))
        for name in ("merge", "recheck"):
            _apply(state, _invoke_stage(stages[name], state))
        _apply(state, _finish(stages, state))
        if route_after_finish(state) != "prepare":
            break
    for name in ("evaluate", "report"):
        _apply(state, _terminal(stages, name, state))
    return state


def graph_mermaid() -> str:
    """A dependency-free overview; use get_graph().draw_mermaid() for runtime detail."""
    return '''flowchart TD
    start(["Start"]) --> snapshot["Freeze inputs and configuration"]
    snapshot --> extract["Import rubric"]
    extract --> verify["Verify rubric structure"]
    verify --> prepare["Prepare fingerprinted requests"]
    prepare -->|"Jobs: parallel fan-out"| grade_batch["OpenAI grader batches"]
    prepare -->|"No pending jobs"| merge["Validate and merge answers"]
    grade_batch --> merge
    merge --> recheck["Plan broader evidence recheck"]
    recheck --> finish{"More grading required?"}
    finish -->|"Yes, within attempt limit"| prepare
    finish -->|"Complete or limit reached"| evaluate["Prepare blinded review sample"]
    evaluate --> report["Write CSV and review report"]
    report --> done(["Complete or needs review"])
'''
