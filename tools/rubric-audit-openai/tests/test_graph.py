"""Routing tests always run; actual LangGraph integration explicitly needs its deps."""
from __future__ import annotations

import importlib.util
from pathlib import Path
import tempfile
import unittest

from rubric_audit_openai.graph import (
    STAGE_NAMES, build_graph, graph_mermaid, merge_batch_results,
    route_after_finish, run_linear,
)


def has_module(name):
    try:
        return importlib.util.find_spec(name) is not None
    except (ModuleNotFoundError, ValueError):
        return False


HAS_LANGGRAPH = has_module("langgraph.graph")
HAS_SQLITE = has_module("langgraph.checkpoint.sqlite")


def fixtures(job_count=0, retries=0):
    visited = []

    def marker(name):
        def run(state):
            visited.append(name)
            return {}
        return run

    stages = {name: marker(name) for name in STAGE_NAMES}

    def prepare(state):
        visited.append("prepare")
        attempt = state.get("attempt", 0) + 1
        return {
            "attempt": attempt,
            "jobs": [{"job_id": f"a{attempt}-j{i}", "item": i} for i in range(job_count)],
        }

    def worker(state):
        visited.append("grade_batch")
        job = state["job"]
        return {"batch_results": {job["job_id"]: {"item": job["item"], "status": "accepted"}}}

    def finish(state):
        visited.append("finish")
        again = state["attempt"] <= retries
        return {"needs_retry": again, "status": "pending" if again else "complete"}

    stages.update(prepare=prepare, grade_batch=worker, finish=finish)
    return stages, visited


class ReducerTests(unittest.TestCase):
    def test_parallel_order_does_not_change_result(self):
        a = {"b": {"answer": 2}}
        b = {"a": {"answer": 1}}
        self.assertEqual(merge_batch_results(a, b), merge_batch_results(b, a))
        self.assertEqual(list(merge_batch_results(a, b)), ["a", "b"])

    def test_identical_replay_is_idempotent(self):
        original = {"job": {"answer": 1}}
        self.assertEqual(merge_batch_results(original, original), original)

    def test_conflicting_duplicate_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "Conflicting results"):
            merge_batch_results({"job": 1}, {"job": 2})


class ReferenceExecutorTests(unittest.TestCase):
    def test_cached_no_jobs_still_merges_and_reports(self):
        stages, visited = fixtures()
        result = run_linear(stages, {"attempt": 0, "max_attempts": 2})
        self.assertEqual(result["status"], "complete")
        self.assertNotIn("grade_batch", visited)
        self.assertEqual(visited, [
            "snapshot", "extract", "verify", "prepare", "merge", "recheck",
            "finish", "evaluate", "report",
        ])

    def test_all_workers_merge_before_next_stage(self):
        stages, visited = fixtures(job_count=3)
        result = run_linear(stages, {"attempt": 0, "max_attempts": 2})
        self.assertEqual(len(result["batch_results"]), 3)
        self.assertEqual(visited.count("merge"), 1)
        self.assertLess(max(i for i, name in enumerate(visited) if name == "grade_batch"), visited.index("merge"))

    def test_retry_budget_has_explicit_review_terminal_state(self):
        stages, visited = fixtures(job_count=2, retries=99)
        result = run_linear(stages, {"attempt": 0, "max_attempts": 2})
        self.assertEqual(result["attempt"], 2)
        self.assertEqual(visited.count("prepare"), 2)
        self.assertEqual(result["status"], "needs_review")
        self.assertTrue(result["retry_exhausted"])
        self.assertTrue(result["needs_retry"])
        self.assertNotIn("decisions", result)  # No fabricated absent labels.

    def test_successful_retry_reaches_complete(self):
        stages, visited = fixtures(job_count=1, retries=1)
        result = run_linear(stages, {"attempt": 0, "max_attempts": 3})
        self.assertEqual(result["attempt"], 2)
        self.assertEqual(result["status"], "complete")
        self.assertFalse(result.get("retry_exhausted", False))

    def test_terminal_report_cannot_erase_retry_exhaustion(self):
        stages, _ = fixtures(retries=99)
        stages["evaluate"] = lambda state: {"status": "complete", "retry_exhausted": False}
        stages["report"] = lambda state: {"status": "complete", "retry_exhausted": False}
        result = run_linear(stages, {"attempt": 0, "max_attempts": 1})
        self.assertEqual(result["status"], "needs_review")
        self.assertTrue(result["retry_exhausted"])

    def test_unknown_state_field_fails_instead_of_silently_disappearing(self):
        stages, _ = fixtures()
        stages["snapshot"] = lambda state: {"misspelled_field": "lost in LangGraph"}
        with self.assertRaisesRegex(ValueError, "Unknown graph state"):
            run_linear(stages, {"attempt": 0, "max_attempts": 1})

    def test_nonadvancing_prepare_cannot_loop(self):
        stages, _ = fixtures()
        stages["prepare"] = lambda state: {"attempt": state["attempt"], "jobs": []}
        with self.assertRaisesRegex(ValueError, "increment attempt"):
            run_linear(stages, {"attempt": 0, "max_attempts": 2})

    def test_invalid_worker_identity_is_rejected(self):
        stages, _ = fixtures(job_count=1)
        stages["grade_batch"] = lambda state: {"batch_results": {"different-job": {}}}
        with self.assertRaisesRegex(ValueError, "own job_id"):
            run_linear(stages, {"attempt": 0, "max_attempts": 2})

    def test_duplicate_pending_job_ids_are_rejected(self):
        stages, _ = fixtures()
        stages["prepare"] = lambda state: {"attempt": 1, "jobs": [{"job_id": "same"}, {"job_id": "same"}]}
        with self.assertRaisesRegex(ValueError, "unique"):
            run_linear(stages, {"attempt": 0, "max_attempts": 2})

    def test_missing_stage_and_invalid_budget_fail_early(self):
        with self.assertRaisesRegex(ValueError, "Missing stage"):
            run_linear({}, {"attempt": 0, "max_attempts": 1})
        stages, _ = fixtures()
        for limit in (0, -1, 2.5, True, None):
            with self.subTest(limit=limit), self.assertRaises(ValueError):
                run_linear(stages, {"attempt": 0, "max_attempts": limit})

    def test_routes_and_diagram_express_bounded_retry(self):
        self.assertEqual(route_after_finish({"attempt": 1, "max_attempts": 2, "needs_retry": True}), "prepare")
        self.assertEqual(route_after_finish({"attempt": 2, "max_attempts": 2, "needs_retry": True}), "evaluate")
        self.assertEqual(route_after_finish({"attempt": 1, "max_attempts": 2, "needs_retry": False}), "evaluate")
        self.assertIn("finish -->|\"Yes, within attempt limit\"| prepare", graph_mermaid())


@unittest.skipUnless(HAS_LANGGRAPH, "LangGraph unavailable; real runtime integration not exercised")
class LangGraphIntegrationTests(unittest.TestCase):
    def test_real_fanout_matches_reference_executor(self):
        initial = {"attempt": 0, "max_attempts": 3}
        reference_stages, _ = fixtures(job_count=3, retries=1)
        expected = run_linear(reference_stages, initial)
        graph_stages, visited = fixtures(job_count=3, retries=1)
        actual = build_graph(graph_stages).invoke(initial, {"recursion_limit": 50})
        for key in ("batch_results", "attempt", "status", "needs_retry"):
            self.assertEqual(actual[key], expected[key])
        self.assertEqual(visited.count("merge"), 2)

    def test_real_empty_jobs_and_budget_exhaustion(self):
        stages, _ = fixtures(job_count=0, retries=99)
        actual = build_graph(stages).invoke({"attempt": 0, "max_attempts": 2})
        self.assertEqual(actual["status"], "needs_review")
        self.assertTrue(actual["retry_exhausted"])

    @unittest.skipUnless(HAS_SQLITE, "LangGraph SQLite checkpointer unavailable")
    def test_real_checkpoint_resume_preserves_completed_stages(self):
        from langgraph.checkpoint.sqlite import SqliteSaver

        stages, visited = fixtures(job_count=1)
        original_report = stages["report"]
        failure = {"remaining": 1}

        def report(state):
            if failure["remaining"]:
                failure["remaining"] -= 1
                raise RuntimeError("Injected interruption before report")
            return original_report(state)

        stages["report"] = report
        config = {"configurable": {"thread_id": "fixture-resume"}}
        with tempfile.TemporaryDirectory() as temp:
            database = str(Path(temp) / "checkpoints.sqlite")
            with SqliteSaver.from_conn_string(database) as saver:
                graph = build_graph(stages, checkpointer=saver)
                with self.assertRaisesRegex(RuntimeError, "Injected interruption"):
                    graph.invoke({"attempt": 0, "max_attempts": 2}, config)
            worker_calls = visited.count("grade_batch")
            with SqliteSaver.from_conn_string(database) as saver:
                graph = build_graph(stages, checkpointer=saver)
                result = graph.invoke(None, config)
            self.assertEqual(result["status"], "complete")
            self.assertEqual(visited.count("grade_batch"), worker_calls)


if __name__ == "__main__":
    unittest.main()
