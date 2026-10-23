import copy
import unittest

from rubric_audit_openai.evaluation import (
    agreement_metrics, blinded_rows, sample_rows, sampling_manifest,
)


def row(i, notes="absent", material="taught", leaf="1"):
    return {"item_id": f"1.1.{i:02}", "objective": "1.1", "path": f"Concept > {i}",
            "item_text": f"Concept {i}", "notes_grade": notes,
            "material_grade": material, "is_leaf": leaf, "reason": "ORIGINAL REASON",
            "best_evidence": "ORIGINAL CITATION", "score": 0.75}


class EvaluationTests(unittest.TestCase):
    def test_sample_is_reproducible_order_independent_and_unique(self):
        rows = [row(i) for i in range(60)]
        a = sample_rows(rows, count=40, seed="predeclared-seed")
        b = sample_rows(reversed(rows), count=40, seed="predeclared-seed")
        self.assertEqual(a, b)
        self.assertEqual(len(a), 40)
        self.assertEqual(len({r["item_id"] for r in a}), 40)
        self.assertNotEqual(a, sample_rows(rows, count=40, seed="different-seed"))

    def test_sampling_reports_excluded_headings_and_unresolved_items(self):
        rows = [row(1), row(2, leaf=True), row(3, notes="unresolved"), row(4, leaf="0")]
        manifest = sampling_manifest(rows)
        self.assertEqual(manifest["total_rows"], 4)
        self.assertEqual(manifest["leaf_rows"], 3)
        self.assertEqual(manifest["eligible_resolved_notes"], 2)
        self.assertEqual(manifest["unresolved_or_invalid_notes_leaves"], 1)
        self.assertEqual(manifest["sample_count"], 2)
        self.assertEqual(manifest["requested_count"], 40)
        self.assertEqual(set(manifest["selected_ids"]), {"1.1.01", "1.1.02"})
        self.assertEqual(len(manifest["population_ids_sha256"]), 64)

    def test_duplicates_and_invalid_sampling_settings_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "duplicate"):
            sample_rows([row(1), row(1)])
        for count in (0, -1, True):
            with self.subTest(count=count), self.assertRaises(ValueError):
                sample_rows([row(1)], count=count)
        with self.assertRaises(ValueError):
            sample_rows([row(1)], seed="")

    def test_blind_export_cannot_expose_original_decisions(self):
        original = [row(1, notes="taught")]
        untouched = copy.deepcopy(original)
        blinded = blinded_rows(original)
        self.assertEqual(set(blinded[0]), {"item_id", "objective", "path", "item_text",
                                         "reference_notes_grade", "reference_material_grade",
                                         "reason", "evidence_refs"})
        self.assertEqual(blinded[0]["reason"], "")
        self.assertEqual(blinded[0]["reference_notes_grade"], "")
        self.assertEqual(original, untouched)
        self.assertNotIn("ORIGINAL", str(blinded))

    def test_counts_confusion_direction_and_wilson_interval(self):
        original = [row(1, "absent"), row(2, "mentioned"), row(3, "taught"), row(4, "taught")]
        reference = [{"item_id": r["item_id"], "reference_notes_grade": label}
                     for r, label in zip(original, ("absent", "taught", "mentioned", "taught"))]
        result = agreement_metrics(original, reference)
        self.assertEqual(result["sample_size"], 4)
        self.assertEqual(result["agreements"], 2)
        self.assertEqual(result["agreement_percent"], 50.0)
        self.assertEqual(result["overgraded"], 1)
        self.assertEqual(result["undergraded"], 1)
        self.assertEqual(result["mean_absolute_grade_difference"], 0.25)
        self.assertEqual(result["confusion_matrix"]["taught"]["mentioned"], 1)
        self.assertEqual(result["confusion_matrix"]["mentioned"]["taught"], 1)
        self.assertAlmostEqual(result["wilson_95_percent"]["low"], 15.0039, places=3)
        self.assertAlmostEqual(result["wilson_95_percent"]["high"], 84.9961, places=3)
        self.assertIn("not measured accuracy", result["methodology"])

    def test_material_metrics_use_material_reference_column(self):
        original = [row(1, notes="absent", material="taught")]
        reference = [{"item_id": "1.1.01", "reference_notes_grade": "mentioned",
                      "reference_material_grade": "taught"}]
        result = agreement_metrics(original, reference, field="material_grade")
        self.assertEqual(result["agreements"], 1)
        self.assertEqual(result["sample_size"], 1)
        self.assertEqual(result["wilson_95_percent"]["high"], 100.0)
        self.assertGreater(result["wilson_95_percent"]["low"], 0)

    def test_incomplete_extra_duplicate_or_invalid_references_fail(self):
        original = [row(1), row(2)]
        references = [
            [{"item_id": "1.1.01", "reference_notes_grade": "absent"}],
            [{"item_id": "1.1.01", "reference_notes_grade": "absent"},
             {"item_id": "1.1.03", "reference_notes_grade": "absent"}],
            [{"item_id": "1.1.01", "reference_notes_grade": "absent"},
             {"item_id": "1.1.01", "reference_notes_grade": "absent"}],
            [{"item_id": "1.1.01", "reference_notes_grade": "absent"},
             {"item_id": "1.1.02", "reference_notes_grade": ""}],
            [{"item_id": "1.1.01", "reference_notes_grade": "absent"},
             {"item_id": "1.1.02", "reference_notes_grade": "half"}],
        ]
        for reference in references:
            with self.subTest(reference=reference), self.assertRaises(ValueError):
                agreement_metrics(original, reference)

    def test_unresolved_predictions_and_empty_samples_are_not_scored(self):
        with self.assertRaisesRegex(ValueError, "unresolved"):
            agreement_metrics([row(1, notes="unresolved")],
                              [{"item_id": "1.1.01", "reference_notes_grade": "absent"}])
        with self.assertRaises(ValueError):
            agreement_metrics([], [])
        with self.assertRaises(ValueError):
            agreement_metrics([row(1)], [{"item_id": "1.1.01"}], field="grade")


if __name__ == "__main__":
    unittest.main()
