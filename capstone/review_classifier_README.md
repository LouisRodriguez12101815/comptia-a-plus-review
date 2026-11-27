# Synthetic review-support classification: classroom example

## Question and scope

Can a fictional pre-review snapshot be used to rank fictional records for a
human to inspect? The generated outcome is a simulated future review signal.
The data, labels, and costs are invented. This is an offline teaching exercise,
not a feature for real learners, a determination of need or mastery, or a
prediction of certification results. It takes no learner input and performs
no outreach, denial, automated decision, or external action.

## Reproduce

The example was run with Python, NumPy 2.3.5, and scikit-learn 1.8.0. From
the repository root, using an isolated Python environment:

```bash
python -m pip install -r capstone/requirements-classification.txt
PYTHONPATH=capstone python -m unittest capstone/tests/test_review_classifier.py -v
python capstone/review_classifier.py
```

The command writes `capstone/outputs/review_classifier_report.json` with
aggregate counts and the scikit-learn version. The fixed seed creates 240
fictional learners with three rows each. Prior practice accuracy, prior
attempts, and days since practice are deliberately generated as pre-decision
features. A fictional learner tendency also contributes to the simulated label;
the generator records no real person. IDs are used only for group splitting,
never supplied to the model. The split separates learners into training,
validation, and test groups; all rows for one learner stay together.

A pipeline fits median imputation, scaling, and logistic regression using
training rows only. A `DummyClassifier(strategy="prior")` fits the same
training data. We select a model threshold on validation data using fictional
relative costs of 1 per false alarm and 3 per missed review; equal costs choose
the lower threshold. These are teaching weights, not measured harm or dollars.
The held-out group is then scored at that fixed threshold. Both model and dummy
are assessed on the same test rows and selected threshold. The report also
shows dummy at 0.5 and simple flag-all / flag-none policies, so results are not
confused with a comparison to a single arbitrary baseline.

The validation table is suitable for a future threshold explorer. It must be
clearly labeled **validation**, and choosing or moving its threshold must not
change the reported selected threshold or the fixed final test result. The
test set is not a sandbox for selecting or tuning a model. Ranking statistics
are calculated only on the fixed test result; an implementation should report
undefined metrics honestly if either class is missing.

## Recorded run (seed 42; scikit-learn 1.8.0)

The generated report is authoritative for exact counts. This run used 405
training rows (135 learners), 135 validation rows (45 learners), and 180 test
rows (60 learners). Validation selected threshold 0.20. On the fixed test set:

| Policy | True positives | False positives | False negatives | Illustrative cost |
| --- | ---: | ---: | ---: | ---: |
| Model, selected threshold | 54 | 106 | 2 | 112 |
| Dummy, same threshold | 56 | 124 | 0 | 124 |
| Flag all | 56 | 124 | 0 | 124 |
| Flag none | 0 | 0 | 56 | 168 |

The model's precision was 0.338 and recall 0.964 on this test split. Test ROC
AUC was 0.638; average precision was 0.430 against a 0.311 positive rate.
The model flags 160 of 180 rows. Those numbers describe the synthetic generator
and chosen costs—not a benefit demonstrated for people. The held-out split is
small and is one split, not a generalization guarantee. Rows per learner are
repeated; test rows and learner counts should be presented together. Logistic
scores have not been calibrated and must not be called reliable probabilities.

## Class connections and unresolved requirements

The exercise illustrates Class 4's baseline, error types, threshold tradeoff,
and human review, and Class 5's group split and separation of ranking from
threshold-dependent metrics. It does not establish that a classifier or any
specific deliverable is required by the course: confirm the professor's rubric,
data, evaluation, notebook, and submission expectations. It does not replace
the existing regression notebook or the site's rules-based review tools.
