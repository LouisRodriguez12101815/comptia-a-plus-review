"""Synthetic classroom example. Never reads real learner progress or sends data.

The target is a fictional future practice outcome, not a diagnosis, mastery
determination, or prediction of an official exam. Output is aggregate only.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
import sklearn
from sklearn.dummy import DummyClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, confusion_matrix, roc_auc_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

SEED = 42
FEATURES = ("prior_accuracy", "prior_attempts", "days_since_practice")
THRESHOLDS = tuple(round(value / 20, 2) for value in range(2, 19))
# Fictional teaching weights, not measured money or learner impact.
FALSE_ALARM_COST = 1
MISSED_REVIEW_COST = 3


def make_fixture(seed: int = SEED, learners: int = 240, sessions: int = 3):
    """Generate pre-decision features and fictional future outcomes per learner."""
    rng = np.random.default_rng(seed)
    rows = []
    for learner in range(learners):
        tendency = rng.normal(0, 0.75)
        for _ in range(sessions):
            accuracy = float(rng.uniform(0.25, 0.95))
            attempts = int(rng.integers(3, 31))
            days = int(rng.integers(0, 31))
            score = -1.2 + 2.4 * (0.6 - accuracy) + 0.035 * days - 0.025 * attempts + tendency
            probability = 1 / (1 + math.exp(-score))
            rows.append({"learner_id": f"synthetic-{learner:04d}", "prior_accuracy": accuracy,
                         "prior_attempts": attempts, "days_since_practice": days,
                         "needs_review": int(rng.random() < probability)})
    return rows


def split_groups(rows, seed: int = SEED):
    groups = np.asarray([row["learner_id"] for row in rows])
    indices = np.arange(len(rows))
    train_val, test = next(GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=seed).split(indices, groups=groups))
    train_sub, validation_sub = next(GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=seed + 1).split(train_val, groups=groups[train_val]))
    return train_val[train_sub], train_val[validation_sub], test


def feature_matrix(rows):
    return np.array([[row[name] for name in FEATURES] for row in rows], dtype=float)


def metrics(y, scores, threshold):
    y = np.asarray(y)
    scores = np.asarray(scores)
    if not math.isfinite(threshold) or not 0 <= threshold <= 1:
        raise ValueError("threshold must be between 0 and 1")
    if len(y) == 0 or len(scores) != len(y) or not np.isin(y, [0, 1]).all() or not np.isfinite(scores).all() or ((scores < 0) | (scores > 1)).any():
        raise ValueError("scores and labels must be nonempty, aligned, and valid")
    tn, fp, fn, tp = (int(value) for value in confusion_matrix(y, scores >= threshold, labels=[0, 1]).ravel())
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    return {"threshold": threshold, "tn": tn, "fp": fp, "fn": fn, "tp": tp,
            "flagged": tp + fp, "precision": precision, "recall": recall,
            "f1": 2 * precision * recall / (precision + recall) if precision + recall else 0.0,
            "accuracy": (tn + tp) / len(y), "illustrative_cost": fp * FALSE_ALARM_COST + fn * MISSED_REVIEW_COST}


def run_evaluation(seed: int = SEED):
    rows = make_fixture(seed)
    x = feature_matrix(rows)
    y = np.asarray([row["needs_review"] for row in rows])
    train, validation, test = split_groups(rows, seed)
    groups = np.asarray([row["learner_id"] for row in rows])
    if set(groups[train]) & set(groups[validation]) or set(groups[train]) & set(groups[test]) or set(groups[validation]) & set(groups[test]):
        raise ValueError("learner groups overlap")
    if any(len(np.unique(y[part])) < 2 for part in (train, validation, test)):
        raise ValueError("both outcomes must occur in each split")
    model = make_pipeline(SimpleImputer(strategy="median"), StandardScaler(), LogisticRegression(max_iter=1000, random_state=seed))
    baseline = DummyClassifier(strategy="prior")
    model.fit(x[train], y[train]); baseline.fit(x[train], y[train])
    validation_scores = model.predict_proba(x[validation])[:, 1]
    validation_results = [metrics(y[validation], validation_scores, threshold) for threshold in THRESHOLDS]
    selected = min(validation_results, key=lambda row: (row["illustrative_cost"], row["threshold"]))["threshold"]
    scores = model.predict_proba(x[test])[:, 1]
    baseline_scores = baseline.predict_proba(x[test])[:, 1]
    selected_result = metrics(y[test], scores, selected)
    baseline_result = metrics(y[test], baseline_scores, selected)
    return {
        "schema_version": 1, "synthetic": True, "seed": seed, "sklearn_version": sklearn.__version__,
        "features": list(FEATURES), "outcome": "fictional_future_review_signal",
        "split": {name: {"rows": len(part), "learners": len(set(groups[part])), "positive": int(y[part].sum())}
                  for name, part in (("train", train), ("validation", validation), ("test", test))},
        "selected_threshold": selected,
        "cost_weights": {"false_alarm": FALSE_ALARM_COST, "missed_review": MISSED_REVIEW_COST},
        "selection": "Minimum illustrative validation cost; ties select the lower threshold. Test results are descriptive only.",
        "validation": validation_results,
        "test": {"model_at_selected": selected_result, "dummy_at_selected": baseline_result,
                 "dummy_at_default": metrics(y[test], baseline_scores, 0.5),
                 "flag_all": metrics(y[test], np.ones(len(test)), 0.5),
                 "flag_none": metrics(y[test], np.zeros(len(test)), 0.5),
                 "roc_auc": float(roc_auc_score(y[test], scores)),
                 "average_precision": float(average_precision_score(y[test], scores)),
                 "positive_rate": float(y[test].mean())},
        "limitations": "Fictional outcomes and illustrative costs; one group split, not evidence of real learner needs, model calibration, mastery, or exam results.",
    }


def main():
    output = Path(__file__).parent / "outputs" / "review_classifier_report.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(run_evaluation(), indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print(f"Wrote aggregate synthetic report to {output}")


if __name__ == "__main__":
    main()
