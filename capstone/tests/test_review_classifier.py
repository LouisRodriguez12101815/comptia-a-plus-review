import unittest

import numpy as np

from review_classifier import FEATURES, make_fixture, metrics, run_evaluation, split_groups


class ReviewClassifierTests(unittest.TestCase):
    def test_fixture_reproducible_and_no_identifiers_or_outcomes_in_features(self):
        self.assertEqual(make_fixture(), make_fixture())
        self.assertNotIn("learner_id", FEATURES)
        self.assertNotIn("needs_review", FEATURES)

    def test_split_has_no_shared_learners(self):
        rows = make_fixture()
        train, validation, test = split_groups(rows)
        groups = [{rows[i]["learner_id"] for i in part} for part in (train, validation, test)]
        self.assertFalse(groups[0] & groups[1])
        self.assertFalse(groups[0] & groups[2])
        self.assertFalse(groups[1] & groups[2])
        self.assertEqual(len(train) + len(validation) + len(test), len(rows))

    def test_threshold_metrics_and_empty_predictions(self):
        y, scores = [0, 0, 1, 1], [0.1, 0.4, 0.6, 0.9]
        result = metrics(y, scores, 0.5)
        self.assertEqual((result["tn"], result["fp"], result["fn"], result["tp"]), (2, 0, 0, 2))
        self.assertEqual(metrics(y, scores, 1)["precision"], 0)
        self.assertGreaterEqual(metrics(y, scores, 0.2)["flagged"], result["flagged"])
        for bad in (float("nan"), -0.1, 1.1):
            with self.assertRaises(ValueError): metrics(y, scores, bad)
        with self.assertRaises(ValueError): metrics([], [], 0.5)

    def test_selection_uses_validation_and_baselines_share_test_size(self):
        report = run_evaluation()
        best = min(report["validation"], key=lambda row: (row["illustrative_cost"], row["threshold"]))
        self.assertEqual(report["selected_threshold"], best["threshold"])
        count = report["split"]["test"]["rows"]
        for name in ("model_at_selected", "dummy_at_selected", "dummy_at_default", "flag_all", "flag_none"):
            result = report["test"][name]
            self.assertEqual(sum(result[k] for k in ("tn", "fp", "fn", "tp")), count)
        self.assertEqual(report["test"]["model_at_selected"]["threshold"], report["selected_threshold"])
        self.assertTrue(np.isfinite(report["test"]["roc_auc"]))
        self.assertEqual(report, run_evaluation())


if __name__ == "__main__":
    unittest.main()
