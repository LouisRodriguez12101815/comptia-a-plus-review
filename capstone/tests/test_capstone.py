"""Focused course checks and extra cleaning edge cases."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from capstone_analysis import analyze_records, load_data, run_course_checks

HERE = Path(__file__).resolve().parents[1]
FIXTURES = HERE / "fixtures"
VALID_FIXTURE = FIXTURES / "practice_records.csv"


class CourseChecks(unittest.TestCase):
    def test_four_required_course_checks(self) -> None:
        run_course_checks(VALID_FIXTURE, FIXTURES / "missing_column.csv")

    def test_entirely_invalid_data_is_reported_without_fake_summary(self) -> None:
        result = analyze_records([
            {"record_id": "bad-1", "domain": "compute", "practice_score": "unknown"},
            {"record_id": "bad-2", "domain": "network", "practice_score": ""},
        ])
        self.assertEqual(result["metadata"]["clean_status"], "no_valid_scores")
        self.assertEqual(result["summary"], [])
        self.assertEqual(result["flagged"], [])
        self.assertEqual(result["dropped_count"], 2)
        self.assertEqual(len(result["audit_rows"]), 2)

    def test_empty_data_is_reported_as_empty_not_as_no_flags(self) -> None:
        result = analyze_records([])
        self.assertEqual(result["metadata"]["clean_status"], "empty_input")
        self.assertEqual(result["metadata"]["original_count"], 0)
        self.assertEqual(result["summary"], [])
        self.assertEqual(result["flagged"], [])
        self.assertEqual(result["dropped_count"], 0)

    def test_explicit_fallback_is_the_one_row_mock_used_by_the_course_guide(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            missing = Path(folder) / "absent.csv"
            frame, metadata = load_data(missing, use_mock_fallback=True)
        self.assertEqual(len(frame), 1)
        self.assertTrue(metadata["fallback_used"])
        self.assertEqual(metadata["source_kind"], "mock_fallback")
        self.assertIn("DEMO FALLBACK", metadata["notice"])

    def test_missing_file_without_explicit_fallback_raises(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            missing = Path(folder) / "absent.csv"
            with self.assertRaisesRegex(FileNotFoundError, "Input CSV not found"):
                load_data(missing)


if __name__ == "__main__":
    unittest.main(verbosity=2)
