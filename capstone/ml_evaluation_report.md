# SAA readiness evaluation

## 1. Run metadata

- Seed: 7 for the row generator, the train/test split, and the optional tree.
- Generated rows: 80. Dropped after `to_numeric(..., errors="coerce")`: 2. Kept: 78.
- Split: 58 train, 20 test. `test_size` was the integer 20.
- Target: `mock_percent`. Features: study_hours, practice_questions_answered, flashcards_known, mock_count, course_level, weakest_domain.
- Formula: `35 + 0.8*study_hours + 0.05*practice_questions_answered + 0.04*flashcards_known + 2.0*mock_count + level bonus (0/4/8) + domain shift (0/1/-1/2) + Normal(0, 3.5)`, clipped to 0–100.
- Data: synthetic rows written by this notebook. No learner records and no `saa_attempts.csv`.
- scikit-learn 1.9.1. pandas, sqlite3, and matplotlib were already in the environment.

## 2. Metrics vs dummy

The dummy predicts the training-set mean for every held-out row. The tree is one extra model with `max_depth=3` and the same seed. It was not tuned.

| Model | n_train | n_test | seed | MAE | RMSE | R2 |
|---|---:|---:|---:|---:|---:|---:|
| dummy_mean | 58 | 20 | 7 | 12.631 | 14.936 | -0.047 |
| linear_regression | 58 | 20 | 7 | 4.072 | 4.705 | 0.896 |
| tree_depth_3 | 58 | 20 | 7 | 6.939 | 8.543 | 0.658 |

## 3. Takeaway

On the same 20 held-out synthetic rows, linear regression beat the dummy on MAE (4.07 vs 12.63). RMSE was 4.71 against the dummy's 14.94. That is expected: the table was built from an additive formula plus modest noise, and a line can recover that formula. The fit was not tuned after seeing this score. The number is a study-focus signal for these made-up rows. It does not accept or reject a learner, and it says nothing about a real exam.

## 4. Limits and leakage checklist

- `mock_percent` is the target. It is not a feature.
- Scaling and one-hot encoding are inside a pipeline fit on the training rows only.
- The split is made before any model is fit.
- The only signal is the documented formula plus noise. The model cannot know anything else.
- The two non-numeric rows are dropped and printed. They are not imputed into the fit.
- No hyperparameter search was run after seeing the held-out score.
- These scores suggest where synthetic study effort sits. They never accept or reject a learner.
