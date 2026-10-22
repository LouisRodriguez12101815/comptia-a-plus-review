"""Unit and data-invariant tests for the rubric audit. Standard library only.

    python3 -m unittest discover -s tools/rubric-audit/tests
"""
import sys
import tempfile
import unittest
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "scripts"))
import common  # noqa: E402

EXAM = "220-1202"
P = common.paths(EXAM)


class Helpers(unittest.TestCase):
    def test_strip_label(self):
        self.assertEqual(common.strip_label("Step 3: Establish a plan"), "Establish a plan")
        self.assertEqual(common.strip_label("Stepping stone"), "Stepping stone")

    def test_item_terms_splits_acronym(self):
        main, alts = common.item_terms("Short Message Service (SMS)")
        self.assertIn("short", main)
        self.assertEqual(len(alts), 1)

    def test_item_terms_skips_examples(self):
        _, alts = common.item_terms("Browsers (e.g., Chrome)")
        self.assertEqual(alts, [])

    def test_sha_is_stable_and_order_sensitive(self):
        self.assertEqual(common.sha("a", "b"), common.sha("a", "b"))
        self.assertNotEqual(common.sha("a", "b"), common.sha("b", "a"))
        self.assertNotEqual(common.sha("ab", "c"), common.sha("a", "bc"))

    def test_csv_roundtrip_keeps_commas_quotes_newlines_out(self):
        rows = [{"a": 'x, "y"', "b": "z"}]
        with tempfile.TemporaryDirectory() as d:
            f = Path(d) / "t.csv"
            common.write_csv(f, rows, ["a", "b"])
            self.assertEqual(common.read_csv(f), rows)

    def test_jsonl_roundtrip(self):
        rows = [{"k": 1, "v": ["é", {"n": None}]}]
        with tempfile.TemporaryDirectory() as d:
            f = Path(d) / "t.jsonl"
            common.write_jsonl(f, rows)
            self.assertEqual(common.read_jsonl(f), rows)
            self.assertEqual(common.read_jsonl(Path(d) / "missing.jsonl"), [])


@unittest.skipUnless(Path(P["rubric"]).exists(), "rubric CSV not present")
class RubricData(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows = common.read_csv(P["rubric"])

    def test_columns(self):
        self.assertEqual(list(self.rows[0].keys()), common.RUBRIC_FIELDS)

    def test_item_ids_unique_and_parents_exist(self):
        ids = [r["item_id"] for r in self.rows]
        self.assertEqual(len(ids), len(set(ids)))
        for r in self.rows:
            if r["parent_id"]:
                self.assertIn(r["parent_id"], ids)

    def test_domain_weights_sum_to_100(self):
        w = {r["domain"]: float(r["domain_weight"]) for r in self.rows}
        self.assertEqual(sum(w.values()), 100)
        self.assertEqual(len(w), 4)

    def test_36_objectives(self):
        self.assertEqual(len({r["objective"] for r in self.rows}), 36)


@unittest.skipUnless((P["results"] / "grades.csv").exists(), "no results yet")
class ResultInvariants(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rubric = common.read_csv(P["rubric"])
        cls.grades = common.read_csv(P["results"] / "grades.csv")
        cls.summary = common.read_csv(P["results"] / "summary.csv")

    def test_every_rubric_item_graded_once(self):
        self.assertEqual(sorted(r["item_id"] for r in self.rubric),
                         sorted(g["item_id"] for g in self.grades))

    def test_grade_vocabulary(self):
        for g in self.grades:
            self.assertIn(g["notes_grade"], common.GRADES)
            self.assertIn(g["material_grade"], common.GRADES)

    def test_material_never_below_notes(self):
        rank = {"absent": 0, "mentioned": 1, "taught": 2}
        for g in self.grades:
            self.assertGreaterEqual(rank[g["material_grade"]], rank[g["notes_grade"]], g["item_id"])

    def test_reasons_are_not_templated(self):
        reasons = Counter(g["reason"] for g in self.grades if g["basis"] == "judged")
        worst, n = reasons.most_common(1)[0]
        self.assertLess(n, 5, f"reason reused {n} times: {worst!r}")

    def test_summary_scores_match_grades(self):
        by = defaultdict(list)
        for g in self.grades:
            if g["is_leaf"] == "1":
                by[g["objective"]].append(g)
        for s in self.summary:
            leaves = by[s["objective"]]
            self.assertEqual(len(leaves), int(s["leaves"]))
            got = sum(common.SCORE[g["notes_grade"]] for g in leaves) / len(leaves) * 100
            self.assertAlmostEqual(got, float(s["notes_score"]), delta=0.06, msg=s["objective"])

    def test_history_has_current_run(self):
        run_ids = {g["run_id"] for g in self.grades}
        hist = {h["run_id"] for h in common.read_csv(P["results"] / "history.csv")}
        self.assertTrue(run_ids & hist)


if __name__ == "__main__":
    unittest.main()
