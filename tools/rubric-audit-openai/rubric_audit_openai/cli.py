"""Local CLI. Repository inputs are read-only; no Git mutation or publishing."""
from __future__ import annotations

import argparse
import json
import uuid
from pathlib import Path

from .demo import write_demo
from .engine import AuditPipeline, FileGrader, ReplayGrader
from .evaluation import agreement_metrics
from .graph import build_graph, graph_mermaid, run_linear
from .provider import OpenAIGrader
from .util import atomic_text, read_csv, write_json


def execute(pipeline, engine="langgraph", resume=False, concurrency=3):
    state = pipeline.initial_state()
    if engine == "reference":
        if resume:
            raise ValueError("The reference executor has no checkpoints; use LangGraph for resume")
        return run_linear(pipeline.stages(), state)
    try:
        from langgraph.checkpoint.sqlite import SqliteSaver
    except ImportError as exc:
        raise RuntimeError("Install the [graph] extra to run LangGraph with SQLite; no fallback is performed silently") from exc
    preflight = pipeline.snapshot(state, persist=False)
    pointer_path = Path(preflight["run_dir"]) / "checkpoint-pointer.json"
    pointer = json.loads(pointer_path.read_text(encoding="utf-8")) if pointer_path.exists() else None
    if pointer and pointer.get("input_identity") != preflight["input_identity"]:
        raise ValueError("Checkpoint input fingerprint does not match current inputs")
    stages = pipeline.stages()
    # Freeze once: do not reread a changing filesystem after choosing its identity.
    stages["snapshot"] = lambda _: pipeline.persist_snapshot(preflight)
    pipeline.output.mkdir(parents=True, exist_ok=True)
    with SqliteSaver.from_conn_string(str(pipeline.output / "checkpoints.sqlite")) as saver:
        graph = build_graph(stages, checkpointer=saver)
        previous_config = {"configurable": {"thread_id": pointer["thread_id"]}} if pointer else None
        previous = graph.get_state(previous_config) if previous_config else None
        if resume:
            if previous is None or not previous.values:
                raise ValueError("No checkpoint matches these exact inputs, model and workflow configuration")
            if previous.values.get("input_identity") != preflight["input_identity"]:
                raise ValueError("Checkpoint input fingerprint does not match current inputs")
            if not previous.next:
                return dict(previous.values)
            config = {**previous_config, "max_concurrency": concurrency,
                      "recursion_limit": 12 + 6 * pipeline.config["max_attempts"]}
            return graph.invoke(None, config=config, durability="sync")
        if previous is not None and previous.values and previous.next:
            raise ValueError("An unfinished checkpoint exists; repeat with --resume")
        # A fresh execution keeps old checkpoints but starts with empty reducers.
        # The analysis ID remains stable so accepted answers and CSVs are reused.
        thread_id = preflight["run_id"] + ":" + uuid.uuid4().hex
        write_json(pointer_path, {"analysis_id": preflight["run_id"], "thread_id": thread_id,
                                  "input_identity": preflight["input_identity"]})
        config = {"configurable": {"thread_id": thread_id}, "max_concurrency": concurrency,
                  "recursion_limit": 12 + 6 * pipeline.config["max_attempts"]}
        return graph.invoke({**state, **preflight}, config=config, durability="sync")


def parser():
    ap = argparse.ArgumentParser(description=__doc__)
    subs = ap.add_subparsers(dest="command", required=True)
    demo = subs.add_parser("demo", help="Run explicit synthetic fixtures without an API key")
    demo.add_argument("--out", required=True)
    demo.add_argument("--engine", choices=["reference", "langgraph"], default="reference")
    run = subs.add_parser("run", help="Independently grade a local rubric and source snapshot")
    run.add_argument("--repo")
    run.add_argument("--rubric", required=True)
    run.add_argument("--evidence", help="Structured JSONL input or supplement, including exported labs/PBQs")
    run.add_argument("--out", required=True)
    run.add_argument("--exam", default="220-1202")
    run.add_argument("--model", required=True, help="Explicit model identifier available to your OpenAI API project")
    run.add_argument("--engine", choices=["langgraph", "reference"], default="langgraph")
    run.add_argument("--answers-dir", help="Read supplied OpenAI answer envelopes instead of making API calls")
    run.add_argument("--recheck", choices=["all", "gaps", "none"], default="all")
    run.add_argument("--max-attempts", type=int, default=3, help="Maximum global grading rounds, including rechecks")
    run.add_argument("--batch-size", type=int, default=4)
    run.add_argument("--max-context-chars", type=int, default=60000)
    run.add_argument("--concurrency", type=int, default=3)
    run.add_argument("--max-output-tokens", type=int, default=6000)
    run.add_argument("--reasoning-effort")
    run.add_argument("--resume", action="store_true")
    mermaid = subs.add_parser("diagram", help="Export the graph representation as Mermaid")
    mermaid.add_argument("--out")
    compare = subs.add_parser("score-review", help="Measure agreement after the blinded review is complete")
    compare.add_argument("--grades", required=True)
    compare.add_argument("--review", required=True)
    compare.add_argument("--manifest", required=True, help="Frozen sampling-manifest.json")
    compare.add_argument("--view", choices=["notes", "material"], default="notes")
    compare.add_argument("--reviewer-type", choices=["human", "model"], required=True)
    compare.add_argument("--out", required=True)
    return ap


def main(argv=None):
    args = parser().parse_args(argv)
    try:
        if args.command == "diagram":
            if args.out:
                atomic_text(args.out, graph_mermaid() + "\n")
            else:
                print(graph_mermaid())
            return 0
        if args.command == "score-review":
            original = read_csv(args.grades)
            reference = read_csv(args.review)
            manifest = json.loads(Path(args.manifest).read_text(encoding="utf-8"))
            selected = manifest["selected_ids"]
            if len(selected) != len(set(selected)):
                raise ValueError("Sample manifest contains duplicate IDs")
            if {r["item_id"] for r in reference} != set(selected):
                raise ValueError("Review must contain the entire frozen sample; do not drop disagreements")
            baseline = [r for r in original if r["item_id"] in set(selected)]
            if any(row.get("run_id") != manifest["analysis_id"] for row in baseline):
                raise ValueError("Original grades do not match the frozen analysis ID")
            if args.view == "material" and any(row.get("material_grade") == "unresolved" for row in baseline):
                raise ValueError("The frozen notes sample contains unresolved material grades; resolve those judgments before measuring material agreement, without dropping sample rows")
            metrics = agreement_metrics(baseline, reference, field=args.view + "_grade")
            metrics.update({"reviewer_type": args.reviewer_type, "analysis_id": manifest["analysis_id"],
                            "sample_manifest": manifest, "human_reference_validated": False})
            write_json(args.out, metrics)
            print(json.dumps(metrics, indent=2))
            return 0
        if args.command == "demo":
            inputs = write_demo(Path(args.out).resolve() / "synthetic-inputs")
            grader = ReplayGrader(inputs["answers"])
            pipeline = AuditPipeline({"exam": "DEMO", "rubric": inputs["rubric"], "evidence": inputs["evidence"],
                                      "output": args.out, "model": "fixture-replay-not-a-model", "provider": "fixture"}, grader)
            state = execute(pipeline, engine=args.engine)
            print(json.dumps({"status": state["status"], "analysis_id": state["run_id"], "fixture_calls": grader.calls,
                              "live_model_calls": 0, "report_paths": state["report_paths"]}, indent=2))
        else:
            if args.concurrency < 1:
                raise ValueError("concurrency must be positive")
            config = {"exam": args.exam, "repo": args.repo, "rubric": args.rubric, "evidence": args.evidence,
                      "output": args.out, "model": args.model, "provider": "openai-import" if args.answers_dir else "openai",
                      "recheck": args.recheck, "max_attempts": args.max_attempts, "batch_size": args.batch_size,
                      "max_context_chars": args.max_context_chars, "max_output_tokens": args.max_output_tokens,
                      "reasoning_effort": args.reasoning_effort}
            grader = FileGrader(args.answers_dir) if args.answers_dir else OpenAIGrader(
                args.model, max_output_tokens=args.max_output_tokens, reasoning_effort=args.reasoning_effort)
            pipeline = AuditPipeline(config, grader)
            state = execute(pipeline, engine=args.engine, resume=args.resume, concurrency=args.concurrency)
            print(json.dumps({"status": state["status"], "analysis_id": state["run_id"], "report_paths": state["report_paths"]}, indent=2))
        return 0 if state["status"] == "complete" else 2
    except (ValueError, RuntimeError, OSError) as exc:
        print(f"Audit stopped: {exc}")
        return 1
