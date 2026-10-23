# OpenAI rubric assessment: DEMO

Analysis `oa-7c0fa5270fa99ebc0a5e`. Status: **complete**.

This is an independent assessment. No Claude grades or reasons were supplied to the grader.

**Synthetic fixture replay only. These are not certification coverage results and no language model was called.**

## Coverage of the supplied material

Notes: **37.5%**.
All scanned material: **75.0%**.

Scores average leaf grades within each objective, objectives equally within each domain, and domains by their exam weights. Unresolved rows stay in the denominator; their 0–1 range produces the reported bounds. These are not confidence intervals.

| Domain | Weight | Notes | All scanned material |
| --- | ---: | --- | --- |
| 1 | 50% | 75.0% | 100.0% |
| 2 | 50% | 0.0% | 50.0% |

## Verification status

- Rubric hierarchy and weights were checked structurally. Wording was not compared with the official PDF in this workflow.
- Response validation checks request identity, exact item membership, grade ordering, citation existence, and verbatim quotes. It does not prove that the cited text warrants the grade.
- Blinded review sheet: `validation/blinded-review.csv`. **Review not performed; judge agreement and error rate remain unmeasured.**
- Initial and recheck disagreements remain unresolved. The recheck cannot silently choose the higher grade.
- Inspect `inventory.csv` for missing files and material requiring a structured export, including dynamic visuals, drills, labs, or PBQs.
- A coverage score is an estimate of teaching coverage, not a predicted exam score or proof of technical correctness.

## Reproducibility

The analysis ID binds input hashes, the complete evidence corpus, model configuration, prompt, schema, and implementation. Execution time is kept outside deterministic grade tables. Re-exporting cached judgments should reproduce grades.csv and summary.csv byte for byte; fresh model calls are not promised to return identical judgments.
