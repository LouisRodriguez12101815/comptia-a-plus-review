# Class concepts and the SAA study project

This is a discussion guide for the instructor, not a claim that the final capstone rubric is satisfied. Confirm the required deliverables, dataset, evaluation, presentation format, and use of AI with the instructor.

| Class idea | Evidence in this project | What it demonstrates / limitation |
| --- | --- | --- |
| Classification and logistic regression | `/classification-example`; `capstone/review_classifier.py` | An offline, synthetic example of ranking fictional records for human review. It does not evaluate real learners or predict certification outcomes. |
| False positives, false negatives, precision and recall | `/classification-example`; `capstone/review_classifier_README.md` | Shows the tradeoff at a threshold and compares simple baselines. The outcome labels and relative costs are invented. |
| Validation and held-out evaluation | `capstone/review_classifier_README.md`; `capstone/tests/test_review_classifier.py` | A learner-group split and separate validation/test roles illustrate leakage prevention. One synthetic split does not establish real-world performance. |
| Regression | `capstone/saa_readiness_model.ipynb`; `capstone/README.md` | Existing regression materials can be reviewed separately; their assumptions and data provenance must be explained rather than treated as evidence of exam readiness. |
| Explainable decision support | SAA study workspace: next-session panel and domain practice | Uses recorded practice outcomes and a transparent rule. It is not the classifier and does not estimate probability of passing. Five answers is only a display threshold; repeats are included. |
| Human interpretation | SAA domain practice and existing confusion-pair drill | Learners decide what to study; practice results and explanations support review rather than making an automated high-stakes decision. |

## Existing SAA contrast resources to demonstrate

The SAA workspace already offers a confusion-pair drill, high-yield clusters, qualifier twins, architecture pattern cards, and domain quizzes. Start with one relevant pair from the drill (for example, services with similar names or purposes), explain the scenario requirement that distinguishes them, then answer another question. These tools reuse existing authored material; this pass does not add new questions or claim that every pair has been audited for currency.

## Questions for the instructor

1. Which rubric, data source, and submission format are required?
2. Is a synthetic classification example acceptable, and is a real-data evaluation required?
3. Should the project demonstrate regression, classification, or both? What evidence and metrics are expected?
4. What documentation of AI assistance, privacy, and limitations should accompany the submission?
