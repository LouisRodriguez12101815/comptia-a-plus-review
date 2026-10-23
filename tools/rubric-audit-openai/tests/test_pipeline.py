"""End-to-end fixture checks, with no network or model dependency."""
import copy
import csv
import io
import json
import tempfile
import unittest
from pathlib import Path

from rubric_audit_openai.cli import execute, main
from rubric_audit_openai.demo import write_demo
from rubric_audit_openai.engine import AuditPipeline, InvalidResponse, ReplayGrader, select_evidence, validate_response
from rubric_audit_openai.reporting import rollups, summarize
from rubric_audit_openai.util import canonical, read_csv, write_csv, write_jsonl


class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.inputs = write_demo(self.root / "inputs")
        self.config = {"exam": "DEMO", "rubric": self.inputs["rubric"],
                       "evidence": self.inputs["evidence"], "output": str(self.root / "output"),
                       "model": "fixture-replay-not-a-model", "provider": "fixture"}

    def run_fixture(self, answers=None, **overrides):
        grader = ReplayGrader(answers if answers is not None else self.inputs["answers"])
        pipeline = AuditPipeline({**self.config, **overrides}, grader)
        return execute(pipeline, engine="reference"), grader

    def prepared(self):
        pipeline = AuditPipeline(self.config, ReplayGrader(self.inputs["answers"]))
        state = pipeline.initial_state()
        for name in ("snapshot", "extract", "verify", "prepare"):
            state.update(getattr(pipeline, name)(state))
        return pipeline, state, state["jobs"][0]

    def test_demo_reports_both_views_and_expected_weights(self):
        state, grader = self.run_fixture()
        self.assertEqual(state["status"], "complete")
        self.assertEqual(state["attempt"], 2)
        self.assertEqual(grader.calls, 2)
        grades = read_csv(state["report_paths"]["grades.csv"])
        self.assertEqual(len(grades), 4)
        self.assertEqual(len({r["item_id"] for r in grades}), 4)
        summary = read_csv(state["report_paths"]["summary.csv"])
        domains, overall = rollups(summary)
        self.assertEqual(overall["notes_lower"], 37.5)
        self.assertEqual(overall["material_lower"], 75.0)
        self.assertEqual(overall["notes_unresolved"], 0)
        for row in summary:
            for view in ("notes", "material"):
                relevant = [g for g in grades if g["objective"] == row["objective"]]
                for label in ("taught", "mentioned", "absent", "unresolved"):
                    self.assertEqual(int(row[f"{view}_{label}"]), sum(g[f"{view}_grade"] == label for g in relevant))
        text = Path(state["report_paths"]["report.md"]).read_text()
        self.assertIn("Synthetic fixture replay only", text)
        self.assertIn("Review not performed", text)
        self.assertFalse(state["manifest"]["rubric_structure"]["pdf_wording_verified"])

    def test_cached_rerun_is_byte_identical_without_model_calls(self):
        first, _ = self.run_fixture()
        originals = {name: Path(first["report_paths"][name]).read_bytes()
                     for name in ("grades.csv", "summary.csv", "todo.csv", "history.csv")}
        second, grader = self.run_fixture()
        self.assertEqual(first["run_id"], second["run_id"])
        self.assertEqual(grader.calls, 0)
        for name, data in originals.items():
            self.assertEqual(Path(second["report_paths"][name]).read_bytes(), data, name)
        self.assertEqual(len(read_csv(second["report_paths"]["history.csv"])), 2)

    def test_changed_model_and_evidence_cannot_reuse_previous_identity(self):
        first, _ = self.run_fixture()
        changed_model, grader = self.run_fixture(model="another-explicit-fixture-model")
        self.assertNotEqual(first["run_id"], changed_model["run_id"])
        self.assertGreater(grader.calls, 0)
        units = [json.loads(line) for line in Path(self.inputs["evidence"]).read_text().splitlines()]
        units[0]["text"] += " A revised explanation has been added."
        write_jsonl(self.inputs["evidence"], units)
        changed_source, grader = self.run_fixture()
        self.assertNotEqual(first["run_id"], changed_source["run_id"])
        self.assertGreater(grader.calls, 0)

    def test_rejected_batch_never_enters_accepted_cache(self):
        answers = copy.deepcopy(self.inputs["answers"])
        answers["1.1.01"]["notes_citations"] = []
        state, grader = self.run_fixture(answers, max_attempts=2, recheck="none")
        self.assertEqual(state["status"], "needs_review")
        self.assertTrue(state["retry_exhausted"])
        self.assertEqual(grader.calls, 2)
        self.assertFalse(list((self.root / "output" / "cache" / "accepted").glob("*.json")))
        self.assertEqual(len(list((Path(state["run_dir"]) / "rejected").glob("*.json"))), 2)
        self.assertTrue(all(d["notes_grade"] == "unresolved" for d in state["decisions"].values()))

    def test_unanswered_batch_retains_denominator_and_blank_exact_score(self):
        state, grader = self.run_fixture({}, max_attempts=2)
        self.assertEqual(grader.calls, 2)
        self.assertEqual(state["status"], "needs_review")
        summary = read_csv(state["report_paths"]["summary.csv"])
        for row in summary:
            self.assertEqual(row["notes_score"], "")
            self.assertEqual(float(row["notes_lower"]), 0)
            self.assertEqual(float(row["notes_upper"]), 100)
            self.assertEqual(row["notes_absent"], "0")
            self.assertEqual(row["notes_unresolved"], row["leaves"])
        manifest = json.loads((Path(state["run_dir"]) / "validation" / "sampling-manifest.json").read_text())
        self.assertEqual(manifest["sample_count"], 0)
        self.assertEqual(manifest["unresolved_or_invalid_notes_leaves"], 4)

    def test_recheck_conflicts_can_raise_or_lower_and_stay_unresolved(self):
        answers = copy.deepcopy(self.inputs["answers"])
        for iid, revised in (("1.1.01", "mentioned"), ("1.1.02", "taught")):
            initial = copy.deepcopy(answers[iid])
            recheck = copy.deepcopy(initial)
            recheck["notes_grade"] = revised
            answers[iid] = {"initial": initial, "recheck": recheck}
        state, _ = self.run_fixture(answers)
        self.assertEqual(state["status"], "needs_review")
        self.assertFalse(state["needs_retry"])
        for iid in ("1.1.01", "1.1.02"):
            self.assertEqual(state["decisions"][iid]["notes_grade"], "unresolved")
            self.assertIn("disagree", state["decisions"][iid]["notes_reason"])
            self.assertEqual(state["decisions"][iid]["material_grade"], "taught")

    def test_missing_required_recheck_is_not_complete(self):
        state, grader = self.run_fixture(max_attempts=1)
        self.assertEqual(grader.calls, 1)
        self.assertEqual(state["status"], "needs_review")
        self.assertTrue(state["retry_exhausted"])
        self.assertTrue(all(d["notes_grade"] == "unresolved" for d in state["decisions"].values()))

    def test_incomplete_context_does_not_become_absence(self):
        answers = copy.deepcopy(self.inputs["answers"])
        for answer in answers.values():
            answer.update(notes_grade="absent", material_grade="absent", notes_citations=[], material_citations=[])
        state, _ = self.run_fixture(answers, max_context_chars=1)
        self.assertEqual(state["status"], "needs_review")
        for decision in state["decisions"].values():
            self.assertEqual(decision["notes_grade"], "unresolved")
            self.assertEqual(decision["notes_observed"], "absent")
            self.assertIn("entire scanned corpus", decision["notes_reason"])

    def test_notes_rank_by_relevance_before_using_context_budget(self):
        unrelated = {"evidence_id": "note:000", "source_type": "note", "text": "Unrelated printer paper."}
        relevant = {"evidence_id": "note:999", "source_type": "note", "text": "WPA3 uses stronger wireless authentication."}
        config = {"max_context_chars": len(canonical(relevant)), "candidate_limit": 1}
        item = {"item_text": "WPA3", "path": "Wireless security > WPA3", "objective": "2.3"}
        for expanded in (False, True):
            selected, scope = select_evidence([item], [unrelated, relevant], config, expanded=expanded)
            self.assertEqual([unit["evidence_id"] for unit in selected], ["note:999"])
            self.assertFalse(scope["notes_complete"])

    def test_uncertain_grader_cannot_issue_a_resolved_label(self):
        answers = copy.deepcopy(self.inputs["answers"])
        answers["1.1.01"]["retrieval_uncertain"] = True
        state, _ = self.run_fixture(answers)
        self.assertEqual(state["decisions"]["1.1.01"]["status"], "needs_review")

    def test_cache_is_revalidated_before_use(self):
        first, _ = self.run_fixture()
        cache_files = list((self.root / "output" / "cache" / "accepted").glob("*.json"))
        for path in cache_files:
            saved = json.loads(path.read_text())
            saved["request_hash"] = "tampered"
            path.write_text(json.dumps(saved))
        # Receipts are another valid cache; corrupt both to exercise a fresh call.
        for path in (Path(first["run_dir"]) / "responses").glob("*.json"):
            path.write_text("{}")
        state, grader = self.run_fixture()
        self.assertEqual(state["status"], "complete")
        self.assertEqual(grader.calls, 2)

    def test_invalid_input_csv_rejected_by_pipeline_extraction(self):
        pipeline, state, _ = self.prepared()
        for raw in ("item_id,item_id\na,b\n", "item_id,exam\na,b,c\n", "item_id,exam\na\n"):
            with self.subTest(raw=raw):
                with self.assertRaises(ValueError):
                    pipeline.extract({"raw_rubric": raw})

    def test_output_inside_source_repository_is_refused(self):
        with self.assertRaisesRegex(ValueError, "outside the source repository"):
            AuditPipeline({**self.config, "repo": str(self.root), "output": str(self.root / "generated")}, None)

    def test_empty_evidence_is_an_input_error(self):
        Path(self.inputs["evidence"]).write_text("")
        with self.assertRaisesRegex(ValueError, "No eligible evidence"):
            self.run_fixture()

    def test_preflight_does_not_erase_verified_manifest(self):
        state, _ = self.run_fixture()
        manifest_path = Path(state["run_dir"]) / "manifest.json"
        original = manifest_path.read_bytes()
        pipeline = AuditPipeline(self.config, ReplayGrader(self.inputs["answers"]))
        preflight = pipeline.snapshot(pipeline.initial_state(), persist=False)
        self.assertEqual(preflight["run_id"], state["run_id"])
        self.assertEqual(manifest_path.read_bytes(), original)
        self.assertIn("rubric_structure", json.loads(manifest_path.read_text()))

    def test_reference_resume_cannot_pretend_to_have_checkpoints(self):
        pipeline = AuditPipeline(self.config, ReplayGrader(self.inputs["answers"]))
        with self.assertRaisesRegex(ValueError, "no checkpoints"):
            execute(pipeline, engine="reference", resume=True)

    def test_review_sample_contains_no_predictions(self):
        state, _ = self.run_fixture()
        rows = read_csv(state["sample_path"])
        self.assertEqual(len(rows), 4)
        for row in rows:
            self.assertNotIn("notes_grade", row)
            self.assertNotIn("notes_reason", row)
            self.assertEqual(row["reference_notes_grade"], "")
        manifest = json.loads((Path(state["sample_path"]).parent / "sampling-manifest.json").read_text())
        self.assertEqual(manifest["analysis_id"], state["run_id"])
        self.assertEqual(set(manifest["selected_ids"]), {r["item_id"] for r in rows})

    def test_cached_rerun_preserves_completed_human_review(self):
        state, _ = self.run_fixture()
        path = Path(state["sample_path"])
        rows = read_csv(path)
        for row in rows:
            row["reference_notes_grade"] = "mentioned"
            row["reason"] = "Human review text that must not be overwritten."
        write_csv(path, rows, list(rows[0]))
        reviewed = path.read_bytes()
        self.run_fixture()
        self.assertEqual(path.read_bytes(), reviewed)

    def test_response_identity_membership_ordering_and_quotes_are_enforced(self):
        _, _, job = self.prepared()
        base = ReplayGrader(self.inputs["answers"])(job)
        self.assertEqual(len(validate_response(job, base)), 4)
        variants = []
        wrong_hash = copy.deepcopy(base); wrong_hash["request_hash"] = "old"; variants.append(wrong_hash)
        wrong_job = copy.deepcopy(base); wrong_job["job_id"] = "other"; variants.append(wrong_job)
        duplicate = copy.deepcopy(base); duplicate["judgments"][1] = duplicate["judgments"][0]; variants.append(duplicate)
        missing = copy.deepcopy(base); missing["judgments"].pop(); variants.append(missing)
        lower = copy.deepcopy(base); lower["judgments"][0]["material_grade"] = "absent"; variants.append(lower)
        quote = copy.deepcopy(base); quote["judgments"][0]["notes_citations"][0]["quote"] = "fabricated quotation"; variants.append(quote)
        source = copy.deepcopy(base); source["judgments"][0]["notes_citations"] = copy.deepcopy(base["judgments"][1]["material_citations"]); variants.append(source)
        extra = copy.deepcopy(base); extra["judgments"][0]["unrequested"] = True; variants.append(extra)
        repeated = copy.deepcopy(base)
        for j in repeated["judgments"]:
            j["notes_reason"] = "This identical generic sentence applies to every item."
        variants.append(repeated)
        for position, envelope in enumerate(variants):
            with self.subTest(position=position):
                with self.assertRaises(InvalidResponse):
                    validate_response(job, envelope)


if __name__ == "__main__":
    unittest.main()
