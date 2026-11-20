"""Integration checks for actual LangGraph interrupt/checkpoint/resume behavior."""

from __future__ import annotations

import json
import unittest
from pathlib import Path

from langgraph.types import Command

from capstone_analysis import build_review_graph

HERE = Path(__file__).resolve().parents[1]
FIXTURE = HERE / "fixtures" / "practice_records.csv"


class ReviewGraphTests(unittest.TestCase):
    def setUp(self) -> None:
        self.graph = build_review_graph()

    def _pause(self, thread_id: str):
        config = {"configurable": {"thread_id": thread_id}}
        paused = self.graph.invoke(
            {
                "data_path": str(FIXTURE),
                "threshold": 70.0,
                "use_mock_fallback": False,
            },
            config,
        )
        self.assertIn("__interrupt__", paused)
        self.assertEqual(len(paused["__interrupt__"]), 1)
        interrupt_packet = paused["__interrupt__"][0].value
        self.assertEqual([row["record_id"] for row in interrupt_packet["flagged"]], ["r003", "r006"])
        self.assertIn("No message", interrupt_packet["safety"])
        snapshot = self.graph.get_state(config)
        self.assertEqual(snapshot.next, ("human_review",))
        json.dumps(snapshot.values)  # State written to the checkpointer is JSON-like.
        return config, interrupt_packet

    def test_pause_update_resume_approval_without_external_action(self) -> None:
        config, packet = self._pause("test-review-approve")
        self.assertEqual(len(packet["summary"]), 4)
        # Test-only synthetic reviewer input; no external action is authorized or performed.
        result = self.graph.invoke(
            Command(resume={"decision": "approve", "notes": "Demo reviewer checked the sample."}),
            config,
        )
        self.assertEqual(result["workflow_status"], "review_approved_no_external_action")
        self.assertEqual(result["review_decision"]["decision"], "approve")
        self.assertEqual(result["external_action"], "none")

    def test_pause_update_resume_rejection_without_external_action(self) -> None:
        config, _ = self._pause("test-review-reject")
        # Test-only synthetic reviewer input; rejection is also resumed through LangGraph.
        result = self.graph.invoke(
            Command(resume={"decision": "reject", "notes": "Demo reviewer requests another check."}),
            config,
        )
        self.assertEqual(result["workflow_status"], "review_rejected_no_external_action")
        self.assertEqual(result["review_decision"]["decision"], "reject")
        self.assertEqual(result["external_action"], "none")


if __name__ == "__main__":
    unittest.main(verbosity=2)
