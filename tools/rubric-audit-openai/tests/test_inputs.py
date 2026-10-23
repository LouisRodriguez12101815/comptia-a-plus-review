"""Synthetic fixtures only: these are not official exam-objective text."""
import copy
import csv
import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from rubric_audit_openai.inputs import (
    RUBRIC_FIELDS, collect_evidence, load_evidence_jsonl, load_rubric, verify_rubric,
)


EXAM = "DEMO-1"


def rubric_rows():
    base = {"exam": EXAM, "domain": "1", "domain_weight": "100", "objective": "1.1",
            "objective_title": "Synthetic process", "level": "1", "parent_id": "",
            "item_id": "1.1.01", "item_text": "Demonstration group", "path": "Demonstration group"}
    child = dict(base, item_id="1.1.02", level="2", parent_id="1.1.01",
                 item_text="Synthetic action", path="Demonstration group > Synthetic action")
    return [base, child]


class RubricInputs(unittest.TestCase):
    def test_load_preserves_ids_and_adds_leaf_flags(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "rubric.csv"
            with path.open("w", newline="", encoding="utf-8") as handle:
                writer = csv.DictWriter(handle, fieldnames=RUBRIC_FIELDS)
                writer.writeheader()
                writer.writerows(rubric_rows())
            rows = load_rubric(path, EXAM)
        self.assertEqual([r["item_id"] for r in rows], ["1.1.01", "1.1.02"])
        self.assertEqual([r["is_leaf"] for r in rows], [False, True])
        checked = verify_rubric(rows, EXAM)
        self.assertEqual(checked["leaves"], 1)
        self.assertEqual(checked["verification"], "structural_only")
        self.assertFalse(checked["pdf_wording_verified"])

    def test_duplicate_ids_rejected(self):
        rows = rubric_rows()
        rows.append(copy.deepcopy(rows[0]))
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            verify_rubric(rows, EXAM)

    def test_cycles_rejected(self):
        rows = rubric_rows()
        rows[0]["parent_id"] = rows[1]["item_id"]
        with self.assertRaisesRegex(ValueError, "Cycle"):
            verify_rubric(rows, EXAM)

    def test_inconsistent_and_nonfinite_weights_rejected(self):
        for replacement in ("90", "NaN", "Infinity", "0"):
            with self.subTest(replacement=replacement):
                rows = rubric_rows()
                rows[1]["domain_weight"] = replacement
                with self.assertRaises(ValueError):
                    verify_rubric(rows, EXAM)

    def test_legacy_decimal_domain_ids_and_four_domain_weights(self):
        rows = rubric_rows()
        for row in rows:
            row.update(domain="1.0", domain_weight="28")
        for domain, weight in ((2, 28), (3, 23), (4, 21)):
            rows.append(dict(rows[0], domain=f"{domain}.0", domain_weight=str(weight),
                             objective=f"{domain}.1", objective_title=f"Synthetic domain {domain}",
                             item_id=f"{domain}.1.01", item_text=f"Synthetic topic {domain}"))
        before = copy.deepcopy(rows)
        result = verify_rubric(rows, EXAM)
        self.assertEqual(result["domain_weights"], {"1.0": 28.0, "2.0": 28.0, "3.0": 23.0, "4.0": 21.0})
        self.assertEqual(result["domains"], 4)
        self.assertEqual(result["leaves"], 4)
        self.assertEqual(rows, before)

    def test_mixed_domain_aliases_rejected_before_weights_can_split(self):
        rows = rubric_rows()
        rows[0].update(domain="1", domain_weight="50")
        rows[1].update(domain="1.0", domain_weight="50")
        with self.assertRaisesRegex(ValueError, "Mixed aliases"):
            verify_rubric(rows, EXAM)

    def test_missing_parent_cross_objective_and_title_changes_rejected(self):
        for field, value in (("parent_id", "unknown"), ("objective", "1.2"), ("objective_title", "Different")):
            with self.subTest(field=field):
                rows = rubric_rows()
                rows[1][field] = value
                with self.assertRaises(ValueError):
                    verify_rubric(rows, EXAM)


class EvidenceInputs(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name) / "repo"
        self.repo.mkdir()
        self.write("content/topics.json", [{"id": "demo", "title": "Example notes", "examCodes": [EXAM],
                                           "summary": "A synthetic summary.", "concept": "A synthetic concept.",
                                           "sections": [{"id": "process", "title": "Example process", "blocks": []}]}])

    def write(self, relative, value):
        path = self.repo / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value), encoding="utf-8")
        return path

    def topics(self):
        return json.loads((self.repo / "content/topics.json").read_text())

    def test_full_sections_and_summary_concept_retained(self):
        topics = self.topics()
        long_text = "Long explanatory sentence. " * 100 + "UNTRUNCATED END"
        topics[0]["sections"][0]["blocks"] = [
            {"type": "paragraph", "text": long_text},
            {"type": "bullets", "items": ["First action", "Second action"]},
            {"type": "table", "headers": ["Name", "Purpose"], "rows": [["Widget", "Synthetic purpose"]]},
            {"type": "code", "text": "example_command()\nsecond_line()"},
        ]
        self.write("content/topics.json", topics)
        units, inventory, hashes = collect_evidence(self.repo, EXAM)
        by_id = {u["evidence_id"]: u for u in units}
        self.assertIn("note:demo/summary", by_id)
        self.assertIn("note:demo/concept", by_id)
        section = by_id["note:demo/process"]
        self.assertIn(long_text, section["text"])
        self.assertIn("Name: Widget | Purpose: Synthetic purpose", section["text"])
        self.assertIn("example_command()\nsecond_line()", section["text"])
        self.assertEqual(section["locator"], "/0/sections/0")
        raw = (self.repo / "content/topics.json").read_bytes()
        self.assertEqual(hashes["content/topics.json"], hashlib.sha256(raw).hexdigest())
        self.assertEqual(collect_evidence(self.repo, EXAM), (units, inventory, hashes))

    def test_question_uses_any_topic_and_excludes_distractors(self):
        topics = self.topics()
        topics.append({"id": "other", "title": "Another track", "examCodes": ["OTHER"], "sections": []})
        self.write("content/topics.json", topics)
        self.write("content/questions.json", [{"id": "q-demo", "topicId": ["other", "demo"],
                                               "prompt": "Choose the synthetic valid action.",
                                               "choices": ["WRONG_SECRET_OPTION", "Correct synthetic action"],
                                               "answer": 1, "explanation": "This describes the valid action."}])
        units, _, _ = collect_evidence(self.repo, EXAM)
        question = next(u for u in units if u["evidence_id"] == "question:q-demo")
        self.assertIn("Correct synthetic action", question["text"])
        self.assertNotIn("WRONG_SECRET_OPTION", question["text"])

    def test_explicit_exam_codes_override_topic_membership(self):
        self.write("content/flashcards.json", [
            {"id": "excluded", "topicId": "demo", "examCodes": [], "front": "Prompt", "back": "Response"},
            {"id": "included", "topicId": "unknown", "examCodes": [EXAM], "front": "Prompt", "back": "Response"},
        ])
        units, _, _ = collect_evidence(self.repo, EXAM)
        ids = {u["evidence_id"] for u in units}
        self.assertIn("card:included", ids)
        self.assertNotIn("card:excluded", ids)

    def test_invalid_answer_index_rejected(self):
        self.write("content/questions.json", [{"id": "invalid", "topicId": "demo", "prompt": "Prompt",
                                               "choices": ["Choice"], "answer": -1, "explanation": "Reason"}])
        with self.assertRaisesRegex(ValueError, "correct-answer"):
            collect_evidence(self.repo, EXAM)

    def test_missing_visual_recorded(self):
        self.write("content/track-visuals.json", {"demo": [{"file": "missing.html"}]})
        _, inventory, hashes = collect_evidence(self.repo, EXAM)
        row = next(i for i in inventory if i["source_path"] == "public/visuals/missing.html")
        self.assertEqual(row["status"], "missing")
        self.assertNotIn("public/visuals/missing.html", hashes)

    def test_visual_svg_kept_scripts_and_hidden_content_excluded(self):
        self.write("content/track-visuals.json", {"demo": [{"file": "demo.html"}]})
        visual = self.repo / "public/visuals/demo.html"
        visual.parent.mkdir(parents=True)
        visual.write_text('<html><head><title>Not evidence</title></head><body><p>Visible explanation</p>'
                          '<svg><text>SVG teaching text</text></svg><div hidden>Hidden text</div>'
                          '<script>"Not rendered teaching"</script></body></html>', encoding="utf-8")
        units, inventory, _ = collect_evidence(self.repo, EXAM)
        unit = next(u for u in units if u["source_type"] == "visual")
        self.assertIn("SVG teaching text", unit["text"])
        self.assertIn("Visible explanation", unit["text"])
        self.assertNotIn("Not rendered", unit["text"])
        self.assertNotIn("Hidden text", unit["text"])
        self.assertNotIn("Not evidence", unit["text"])
        self.assertEqual(next(i for i in inventory if i["source_path"] == "public/visuals/demo.html")["status"], "partial")

    def test_visual_traversal_and_external_symlinks_rejected(self):
        self.write("content/track-visuals.json", {"demo": [{"file": "../../outside.html"}]})
        with self.assertRaisesRegex(ValueError, "Unsafe"):
            collect_evidence(self.repo, EXAM)
        outside = Path(self.temp.name) / "outside.html"
        outside.write_text("Must not read", encoding="utf-8")
        visual = self.repo / "public/visuals/link.html"
        visual.parent.mkdir(parents=True)
        visual.symlink_to(outside)
        self.write("content/track-visuals.json", {"demo": [{"file": "link.html"}]})
        with self.assertRaisesRegex(ValueError, "escapes"):
            collect_evidence(self.repo, EXAM)

    def test_unknown_blocks_are_partial_and_labs_require_export(self):
        topics = self.topics()
        topics[0]["sections"][0]["blocks"].append({"type": "unknown_widget", "text": "Unverified"})
        self.write("content/topics.json", topics)
        self.write("content/labs.json", {"unknown_schema": "Do not infer teaching"})
        source = self.repo / "lib/practice/demo.ts"
        source.parent.mkdir(parents=True)
        source.write_text('throw new Error("Never execute");', encoding="utf-8")
        _, inventory, hashes = collect_evidence(self.repo, EXAM)
        statuses = {i["source_path"]: i["status"] for i in inventory}
        self.assertEqual(statuses["content/topics.json"], "partial")
        self.assertEqual(statuses["content/labs.json"], "requires_structured_export")
        self.assertEqual(statuses["lib/practice/demo.ts"], "requires_structured_export")
        self.assertNotIn("lib/practice/demo.ts", hashes)
        self.assertNotIn("content/labs.json", hashes)

    def test_extra_exports_accept_labs_pbqs_and_reject_duplicates(self):
        path = Path(self.temp.name) / "extra.jsonl"
        rows = [{"evidence_id": f"{kind}:example", "source_type": kind, "source_path": "supplied/export.json",
                 "locator": f"/{kind}/example", "text": f"Synthetic {kind} instructions.",
                 "objectives": ["1.1"], "exam": EXAM} for kind in ("lab", "pbq")]
        path.write_text("\n".join(json.dumps(r) for r in rows), encoding="utf-8")
        self.assertEqual(len(load_evidence_jsonl(path, EXAM)), 2)
        units, inventory, hashes = collect_evidence(self.repo, EXAM, path)
        self.assertTrue({"lab:example", "pbq:example"}.issubset({u["evidence_id"] for u in units}))
        self.assertIn("extra-evidence.jsonl", hashes)
        self.assertIn("completeness", next(i for i in inventory if i["source_path"] == "extra-evidence.jsonl")["detail"])
        path.write_text("\n".join(json.dumps(r) for r in rows + [rows[0]]), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            load_evidence_jsonl(path, EXAM)

    def test_extra_export_type_text_and_objectives_are_strict(self):
        base = {"evidence_id": "note:example", "source_type": "note", "source_path": "example.json",
                "locator": "/example", "text": "Synthetic teaching", "objectives": []}
        path = Path(self.temp.name) / "bad.jsonl"
        for change in ({"source_type": "unsupported"}, {"text": " "}, {"objectives": "1.1"}):
            with self.subTest(change=change):
                path.write_text(json.dumps(dict(base, **change)), encoding="utf-8")
                with self.assertRaises(ValueError):
                    load_evidence_jsonl(path, EXAM)


if __name__ == "__main__":
    unittest.main()
