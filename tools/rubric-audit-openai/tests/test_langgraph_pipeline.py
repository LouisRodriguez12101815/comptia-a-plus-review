"""Actual pipeline + SQLite integration, skipped when LangGraph is unavailable.

These tests use explicit synthetic ReplayGrader labels. They exercise real
LangGraph execution and checkpoint recovery, never OpenAI or a mocked graph.
"""
from __future__ import annotations

from collections import Counter
import json
from pathlib import Path
import tempfile
import unittest

from rubric_audit_openai.cli import execute
from rubric_audit_openai.demo import write_demo
from rubric_audit_openai.engine import AuditPipeline, ReplayGrader
from rubric_audit_openai.graph import build_graph

try:
    from langgraph.graph import StateGraph  # noqa: F401: verify both real imports
    from langgraph.checkpoint.sqlite import SqliteSaver
except ImportError:
    HAS_RUNTIME = False
else:
    HAS_RUNTIME = True


class ObservedPipeline(AuditPipeline):
    """Record real node calls and optionally stop immediately before one stage."""

    def __init__(self, config, grader, interrupt_before=None):
        super().__init__(config, grader)
        self.visits = []
        self.interrupt_before = interrupt_before

    def stages(self):
        def observed(name, stage):
            def run(state):
                self.visits.append(name)
                if name == self.interrupt_before:
                    self.interrupt_before = None
                    raise RuntimeError(f"Injected interruption before {name}")
                return stage(state)
            return run

        return {name: observed(name, stage) for name, stage in super().stages().items()}


@unittest.skipUnless(
    HAS_RUNTIME,
    "LangGraph unavailable; requires langgraph and langgraph-checkpoint-sqlite; real pipeline integration not exercised",
)
class LangGraphPipelineTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.inputs = write_demo(self.root / "inputs")
        self.config = {
            "exam": "DEMO", "rubric": self.inputs["rubric"],
            "evidence": self.inputs["evidence"], "output": str(self.root / "output"),
            "model": "fixture-replay-not-a-model", "provider": "fixture",
            "batch_size": 2,
        }

    def pipeline(self, *, interrupt_before=None, **overrides):
        grader = ReplayGrader(self.inputs["answers"])
        pipeline = ObservedPipeline(
            {**self.config, **overrides}, grader, interrupt_before=interrupt_before,
        )
        return pipeline, grader

    def pointer(self, state):
        path = Path(state["run_dir"]) / "checkpoint-pointer.json"
        pointer = json.loads(path.read_text(encoding="utf-8"))
        self.assertEqual(pointer["analysis_id"], state["run_id"])
        self.assertEqual(pointer["input_identity"], state["input_identity"])
        self.assertIsInstance(pointer["thread_id"], str)
        self.assertTrue(pointer["thread_id"])
        return pointer

    @staticmethod
    def report_bytes(state):
        return {name: Path(state["report_paths"][name]).read_bytes()
                for name in ("grades.csv", "summary.csv")}

    @staticmethod
    def json_bytes(directory):
        return {path.name: path.read_bytes() for path in sorted(directory.glob("*.json"))}

    def test_demo_and_full_cached_rerun_use_fresh_threads_and_identical_csv(self):
        first_pipeline, first_grader = self.pipeline()
        first = execute(first_pipeline, engine="langgraph", concurrency=2)
        self.assertEqual(first["status"], "complete")
        self.assertEqual(first["attempt"], 2)
        self.assertEqual(first_grader.calls, 4)  # Two jobs in each of two passes.
        self.assertEqual(Counter(first_pipeline.visits)["merge"], 2)
        self.assertEqual(len(first["batch_results"]), 4)
        originals = self.report_bytes(first)
        first_pointer = self.pointer(first)

        second_pipeline, second_grader = self.pipeline()
        second = execute(second_pipeline, engine="langgraph", concurrency=2)
        second_pointer = self.pointer(second)
        self.assertEqual(second["status"], "complete")
        self.assertEqual(second["run_id"], first["run_id"])
        self.assertEqual(second["attempt"], 2)
        self.assertEqual(second_grader.calls, 0)
        self.assertEqual(second["decisions"], first["decisions"])
        self.assertEqual(self.report_bytes(second), originals)
        self.assertNotEqual(second_pointer["thread_id"], first_pointer["thread_id"])
        self.assertEqual(Counter(second_pipeline.visits)["grade_batch"], 4)
        self.assertEqual(len(second["batch_results"]), 4)
        self.assertTrue(all(result.get("cache_hit") for result in second["batch_results"].values()))

        # A fresh execution must preserve the previous completed checkpoint.
        with SqliteSaver.from_conn_string(str(second_pipeline.output / "checkpoints.sqlite")) as saver:
            graph = build_graph(second_pipeline.stages(), checkpointer=saver)
            retained = graph.get_state({"configurable": {"thread_id": first_pointer["thread_id"]}})
        self.assertFalse(retained.next)
        self.assertEqual(retained.values["decisions"], first["decisions"])
        self.assertEqual(retained.values["run_id"], first["run_id"])

    def test_completed_resume_returns_same_state_without_node_or_grader_replay(self):
        first_pipeline, _ = self.pipeline()
        first = execute(first_pipeline, engine="langgraph")
        original_pointer = self.pointer(first)
        originals = self.report_bytes(first)
        original_manifest = (Path(first["run_dir"]) / "manifest.json").read_bytes()

        resumed_pipeline, resumed_grader = self.pipeline()
        resumed = execute(resumed_pipeline, engine="langgraph", resume=True)
        self.assertEqual(resumed, first)
        self.assertEqual(resumed_pipeline.visits, [])
        self.assertEqual(resumed_grader.calls, 0)
        self.assertEqual(self.pointer(resumed), original_pointer)
        self.assertEqual(self.report_bytes(resumed), originals)
        self.assertEqual((Path(first["run_dir"]) / "manifest.json").read_bytes(), original_manifest)

    def test_interrupted_execution_requires_resume_and_preserves_completed_requests(self):
        # Before merge: receipts/results survived, although accepted cache is empty.
        # Before recheck: merge and accepted cache also survived. Resume must not
        # repeat completed workers in either case. One full-corpus batch avoids
        # an additional recheck pass in this recovery-specific test.
        for interrupted_stage in ("merge", "recheck"):
            with self.subTest(interrupted_stage=interrupted_stage):
                options = {"output": str(self.root / interrupted_stage),
                           "batch_size": 4, "recheck": "none"}
                interrupted, grader = self.pipeline(interrupt_before=interrupted_stage, **options)
                with self.assertRaisesRegex(RuntimeError, f"Injected interruption before {interrupted_stage}"):
                    execute(interrupted, engine="langgraph")
                self.assertEqual(grader.calls, 1)
                pointers = list((interrupted.output / "runs").glob("*/checkpoint-pointer.json"))
                self.assertEqual(len(pointers), 1)
                pointer_bytes = pointers[0].read_bytes()
                pointer = json.loads(pointer_bytes)
                run_dir = pointers[0].parent
                requests = self.json_bytes(run_dir / "requests")
                receipts = self.json_bytes(run_dir / "responses")
                self.assertEqual(len(requests), 1)
                self.assertEqual(len(receipts), 1)
                accepted_before = list((interrupted.output / "cache" / "accepted").glob("*.json"))
                self.assertEqual(len(accepted_before), 0 if interrupted_stage == "merge" else 1)

                with SqliteSaver.from_conn_string(str(interrupted.output / "checkpoints.sqlite")) as saver:
                    graph = build_graph(interrupted.stages(), checkpointer=saver)
                    paused = graph.get_state({"configurable": {"thread_id": pointer["thread_id"]}})
                self.assertIn(interrupted_stage, paused.next)
                self.assertEqual(paused.values["attempt"], 1)
                self.assertEqual(len(paused.values["batch_results"]), 1)

                fresh, fresh_grader = self.pipeline(**options)
                with self.assertRaisesRegex(ValueError, "unfinished checkpoint.*--resume"):
                    execute(fresh, engine="langgraph")
                self.assertEqual(fresh_grader.calls, 0)
                self.assertEqual(fresh.visits, [])
                self.assertEqual(pointers[0].read_bytes(), pointer_bytes)

                resumed_pipeline, resumed_grader = self.pipeline(**options)
                resumed = execute(resumed_pipeline, engine="langgraph", resume=True)
                self.assertEqual(resumed["status"], "complete")
                self.assertEqual(resumed["attempt"], 1)
                self.assertEqual(resumed_grader.calls, 0)
                counts = Counter(resumed_pipeline.visits)
                for name in ("extract", "verify", "prepare", "grade_batch"):
                    self.assertEqual(counts[name], 0, name)
                self.assertEqual(counts["merge"], 1 if interrupted_stage == "merge" else 0)
                for name in ("recheck", "finish", "evaluate", "report"):
                    self.assertEqual(counts[name], 1, name)
                self.assertEqual(self.pointer(resumed), pointer)
                self.assertEqual(self.json_bytes(run_dir / "requests"), requests)
                self.assertEqual(self.json_bytes(run_dir / "responses"), receipts)
                self.assertEqual(len(resumed["decisions"]), 4)
                self.assertTrue(all(Path(path).exists() for path in resumed["report_paths"].values()))


if __name__ == "__main__":
    unittest.main()
