# Protocol for measuring the rubric judge

## Status and primary question

**No judge accuracy or agreement has been measured yet.** An exported review sheet, a successful fixture run, valid JSON, and two model passes that agree are not substitutes for completed reference review.

The first study asks: **On a predeclared random sample of about 40 resolved notes-grade leaf items, how often does the final audit label agree with a blinded reference review of the frozen source material?** Notes are the primary view. Material agreement is a separately reported secondary view when every selected item has a resolved material label and a completed reference label.

The intended population is explicitly conditional on resolved notes labels. Unresolved leaves are counted and reported separately. Results from this sample must not be described as the error rate for every rubric item, every source type, the complete website, or a language model in general.

## 1. Freeze the run and the measurement plan

Before inspecting individual disagreements, preserve:

- The analysis ID and `manifest.json`, including source hashes, model configuration, prompt/schema identity, and implementation identity.
- The exact `grades.csv`, rubric input, `evidence.jsonl`, `inventory.csv`, request/response records, and accepted judgments for this run.
- A checksum of the final grade table alongside the evaluation record. The current sampling manifest hashes the eligible ID population and records the analysis ID; it does not by itself hash every grade-table byte.
- The requested sample size, fixed seed, reviewer identity/type, scope, grading instructions, and planned metrics.

Record the runtime environment separately. The current analysis fingerprint does not capture all installed dependency versions. Do not edit teaching content, prompts, retrieval settings, or accepted labels during this measurement. Correcting the pipeline later creates another assessment and requires a clearly distinguished validation run.

## 2. Select the sample without looking at its outcomes

The implementation in [evaluation.py](../rubric_audit_openai/evaluation.py) uses this eligible population:

1. A rubric row is a leaf (`is_leaf` is `true` or `"1"`).
2. Its final `notes_grade` is exactly `absent`, `mentioned`, or `taught`.
3. Its item ID is unique.

The default target is **40** items, with seed **`core2-openai-validation-v1`**. Each eligible item is ranked by SHA-256 of the seed, a NUL separator, and its unchanged item ID. Take the first 40 without replacement. If fewer than 40 eligible items exist, review the full eligible population and report that fact. Ordering is stable across source-row order and Python versions.

The generated `validation/sampling-manifest.json` records the seed, algorithm, total rows, leaf rows, eligible resolved notes leaves, excluded unresolved/invalid notes leaves, requested count, selected count, eligible-ID checksum, and selected IDs.

Do not reroll the seed because the selected cases appear difficult or inconvenient. Report sample counts by domain and original grade after review is locked. Forty randomly selected items may omit a rare grade or concept. Targeted extra checks can investigate those cases, but must remain separate from the primary sample and its agreement estimate.

## 3. Keep the reviewer blind

The generated `validation/blinded-review.csv` contains only:

| Column | Purpose |
| --- | --- |
| `item_id` | Stable join key |
| `objective` | Objective identifier |
| `path` | Outline context |
| `item_text` | Item being judged |
| `reference_notes_grade` | Reviewer label, initially blank |
| `reference_material_grade` | Optional secondary-view label, initially blank |
| `reason` | Item-specific rationale, initially blank |
| `evidence_refs` | Precise source references, initially blank |

Give the reviewer the frozen rubric and source inventory, including the full objective title for context. Do not show original grades, original reasons, original citations, coverage charts, or gap classifications until the reference review is complete. The model-generated audit reports and accepted response files should remain outside the reviewer's initial packet.

The pipeline creates the blank sheet only when it does not already exist. A rerun preserves an existing sheet after checking that its IDs still match the exact frozen sample; it does not erase entered reference labels. A separate completed-review copy remains useful for maintaining independent annotation history.

The reviewer should read the original frozen sources and full evidence units, not merely the snippets or ranked candidates that were shown to the original judge. Record file paths and JSON pointers or other stable locators. For an absence judgment, record the relevant files and alternate terms inspected. A full-text search returning no hit is not sufficient by itself to establish that a paraphrase is absent.

## 4. Apply one labeling rubric

Use the same intended item-level meaning as the grader prompt in [provider.py](../rubric_audit_openai/provider.py):

| Grade | Operational definition | Score |
| --- | --- | ---: |
| `taught` | The evidence explains what the item is, what it does, how it differs, or when to use it, sufficiently to answer a basic question about that item. An explanatory table row can qualify. | 1 |
| `mentioned` | The item appears only as a bare term, heading, unexplained list entry, answer option, or acronym expansion. | 0.5 |
| `absent` | No support for the item is found within the declared assessment scope. | 0 |

Use the objective title and full path to distinguish terms with multiple meanings. Shared keywords alone do not demonstrate teaching. Treat explanatory examples consistently; do not turn every illustrative rubric bullet into a claim about how many exam questions it represents.

The notes label may use only notes. The material label may use the entire declared scanned corpus, including notes, so a completed material reference cannot be lower than its notes reference. Resolve contradictory annotations by rereading the sources rather than silently adjusting a number.

If a reviewer cannot determine a label, preserve the uncertainty and seek adjudication. Do not remove that item from the frozen sample or invent a label to reach 40 completed rows. The current scoring function requires a complete, valid reference for the selected view and will not silently score incomplete rows.

## 5. Lock references before comparison

Save the reviewer labels and rationales before revealing the original predictions. Record reviewer type as `human` or `model`, and describe the reviewer's role or model configuration in the evaluation record. Keep initial and adjudicated annotations separate when a disagreement is later investigated.

The CLI's `score-review` command accepts the original grade table, completed review, frozen sample manifest, view, reviewer type, and output path. It requires the full selected ID set and checks the analysis ID of the original sample rows. The underlying `agreement_metrics()` function rejects missing, duplicate, extra, invalid, or unresolved labels.

Choosing `reviewer-type=human` does not prove a gold standard. The CLI records `human_reference_validated: false`; it does not automatically certify expertise or the correctness of annotations. For an accuracy claim, establish an adequately reviewed human reference with documented adjudication and the frozen scope. Otherwise report agreement with that reference, with the limitation stated.

If a second agent using the same model supplies the reference, describe the result as **blinded model re-review agreement** or **self-consistency**. A different model is still another model assessment. Neither is, by itself, a measured human-grounded error rate.

## 6. Report metrics with their denominators

For notes, report the exact agreement count and percentage first: matching labels divided by the number of completed sampled items. The current implementation also returns:

- An approximate **95% Wilson interval** for exact agreement.
- A **3 × 3 confusion matrix**, with original labels as rows and reference labels as columns.
- Counts of original grades above and below the reference.
- The mean absolute difference between original and reference scores on the 0/0.5/1 scale.

The Wilson interval uses `z = 1.959963984540054`. If `p` is the agreement proportion and `n` is the item count, its center and half-width are:

```text
denominator = 1 + z² / n
center = (p + z² / (2n)) / denominator
half_width = z × sqrt(p(1 − p)/n + z²/(4n²)) / denominator
```

Clamp the resulting endpoints to 0–1 and report them as percentages. This is an approximate sampling interval. It does not represent systematic reviewer bias, source omissions, exam readiness, or uncertainty in the coverage score. The finite-population correction is not applied by the current implementation.

### Supplemental linear-weighted kappa

Linear-weighted Cohen's kappa is a useful supplemental agreement measure for these ordered labels. Give adjacent-label differences half the penalty of an `absent` versus `taught` difference. For label indices `i,j` in `{0,1,2}`, define agreement weight `w(i,j) = 1 − |i − j|/2`. From the confusion matrix, compute observed weighted agreement `P_o` and expected weighted agreement `P_e` from the two marginal label distributions, then:

```text
kappa = (P_o − P_e) / (1 − P_e)
```

When `P_e = 1`, report kappa as undefined, not zero or perfect. A small sample concentrated in one label can make this statistic unstable. Do not substitute it for the exact-agreement count and confusion table, and do not attach the Wilson interval to kappa. A kappa confidence interval would need a separately specified method.

**Implementation boundary:** at the time of this protocol, `agreement_metrics()` computes exact agreement, Wilson bounds, confusion counts, directional disagreements, and mean absolute difference. It does not yet calculate weighted kappa. The formula above defines the supplemental metric without claiming a number has been produced.

For material, use `reference_material_grade` and report its metrics separately. The notes sample can contain unresolved material grades. If any selected item has an unresolved material grade, the current scorer will reject that material comparison; report material agreement as not measured for this sample. A separately defined material sampling study must have its own declared eligibility and manifest.

Forty items with two labels are **40 sampled items**, not 80 independent observations. Also report the size and makeup of the excluded unresolved population. Agreement on easier resolved cases must not be generalized to cases the pipeline could not resolve.

## 7. Diagnose disagreements after measuring them

Once the independent reference is locked, inspect the original request's exact model-visible evidence and classify the disagreement:

| Category | Evidence required |
| --- | --- |
| Extraction failure | Relevant teaching exists in a source intended to be scanned but was omitted or distorted by extraction. |
| Retrieval/context failure | Relevant teaching exists in the extracted corpus but was not supplied to the original judge, or necessary context was unavailable. |
| Grading failure | The supplied evidence supports the reference interpretation, but the judge selected a different label. |
| Declared scope limitation | The relevant material is in a deliberately excluded or unsupported source, such as a dynamic visual or an unexported lab/PBQ. |
| Rubric ambiguity | The intended sense or the threshold for `taught` remains unsettled. |
| Reviewer error | The reference reviewer demonstrably overlooked or misread material. |
| Snapshot mismatch | The review and original prediction used different source states. Resolve this before reporting a comparable metric. |

More than one cause can apply. Preserve supporting citations and distinguish demonstrated causes from unresolved hypotheses. The category table is a review procedure; the current code does not automatically infer these causes.

Report **end-to-end pipeline agreement** against the full declared source reference separately from **conditional grader agreement** against only the evidence the grader actually received. A retrieval miss is not automatically a model reasoning error. Evidence found only in an excluded source is not proof of an error within the narrower declared scope.

## 8. Minimum evaluation record

Keep the frozen sampling manifest, original sampled predictions, initial blinded reference annotations, any adjudication record, computed metrics, and a short report together. The report should state:

1. The run and source scope, eligible/excluded population sizes, seed, and final reviewed count.
2. Reviewer type and whether the reference was independently validated.
3. Notes agreement as a count, percentage, Wilson interval, and confusion table; material results separately if available.
4. Direction and size of disagreements, with failure categories supported by source evidence.
5. Limitations, including omitted source types, unresolved items, and the small sample.

Do not report a numerical agreement, accuracy, or error rate until the reference labels have actually been completed and the scorer has run against them. Any later comparison with the legacy Claude results must identify differences in source snapshots, extraction, retrieval, prompts, and completion rules before attributing a score difference to the model provider.
