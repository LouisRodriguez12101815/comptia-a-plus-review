# Reassessment of the legacy rubric audit

## What this review establishes

The legacy audit contains useful extraction, evidence, scoring, and reporting work. Its implementation also has defects in cache identity, response validation, and completion handling that warrant a separate assessment. Those defects establish possible failure paths; they do **not** establish that every recorded judgment, or the reported aggregate percentages, is incorrect.

The reviewed legacy snapshot is commit **`d8474648f1d82761f5504fba952b072c47b55b5c`** of `LouisRodriguez12101815/comptia-a-plus-review`. The files were inspected read-only through the authorized GitHub connector. The legacy checkout was not cloned, its scripts were not executed, and its tests were not run for this reassessment.

The new package reads source material and writes its own outputs outside the source repository. Its code does not load the Claude judgment caches or supply Claude grades and reasons to the OpenAI grader. A fresh result therefore needs fresh accepted responses; it cannot be obtained by relabeling the old cache.

**Current evidentiary limits:** the official PDF wording has not been reverified; the legacy coverage percentages remain unvalidated; there have been **zero new live grading calls** during this implementation; and judge accuracy has not been measured. Synthetic fixtures demonstrate software behavior, not certification coverage or model quality.

## Verified legacy findings and the corresponding new behavior

### 1. A current item ID can conceal a stale or missing judgment

**Verified legacy behavior.** `judge_io.build_requests()` checks request hashes when deciding what needs grading. In contrast, `report.build_grades()` indexes both judgment caches by item ID and uses those entries without checking their request hashes. `run.status()` also counts answered item IDs without checking whether their evidence is current. Both merge functions determine missing answers by ID, so an old entry can conceal an unanswered replacement request.

`run.main()` ignores the Boolean failure returned by `judge_io.merge()`. The `all` path proceeds from preparation into finishing without a waiting-work gate. `report.build_grades()` labels an item without a cached judgment as `absent`, with a `fast-absent` explanation, even though that item could have evidence and be waiting for a grader.

**Consequence.** Incomplete runs can produce apparently complete scores. Changed source material can retain an old judgment. The code review establishes these paths; it does not establish that a specific recorded item followed them.

**New behavior checked in code.** `AuditPipeline._job()` binds requests to an analysis identity and a complete request hash. `grade_batch()` validates a cache hit against that hash. `finish()` uses explicit `unresolved` grades when responses are missing, a required recheck is missing, retrieval remains uncertain, or the two passes disagree. The graph retries pending work within its attempt budget and otherwise ends with `needs_review`. `reporting.summarize()` retains unresolved leaves in the denominator and reports lower/upper bounds instead of substituting absence. Those bounds describe missing labels; they are not statistical confidence intervals.

Sources: legacy [judge_io.py](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/d8474648f1d82761f5504fba952b072c47b55b5c/tools/rubric-audit/scripts/judge_io.py), [report.py](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/d8474648f1d82761f5504fba952b072c47b55b5c/tools/rubric-audit/scripts/report.py), and [run.py](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/d8474648f1d82761f5504fba952b072c47b55b5c/tools/rubric-audit/scripts/run.py); new [engine.py](../rubric_audit_openai/engine.py), [graph.py](../rubric_audit_openai/graph.py), and [reporting.py](../rubric_audit_openai/reporting.py).

### 2. A stale answer can acquire the current request's hash

**Verified legacy behavior.** `prepare()` recreates numbered batch filenames. `merge()` selects answer files by the existence of a request file with the same filename, finds the request by the answer's item ID, and copies that request's current key onto the answer. It does not require the answer to return the key. Duplicate answers overwrite earlier entries. `merge_recheck()` follows the same identity pattern. The legacy grader's documented output schema contains no request key.

**Consequence.** An old answer left under a reused batch filename can be accepted for a changed request with the same item ID and be stamped as current. This is an acceptance-path defect, not evidence that a particular batch was contaminated.

**New behavior checked in code.** Each job carries an immutable `request_hash` and an attempt-specific `job_id`. `validate_response()` requires the exact job identity, the exact item set, and no duplicate item IDs. Accepted cache files are named by request hash. The graph's fan-in reducer permits identical replay but rejects conflicting envelopes for one immutable job ID.

Sources: legacy `prepare`, `merge`, and `merge_recheck` in [judge_io.py](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/d8474648f1d82761f5504fba952b072c47b55b5c/tools/rubric-audit/scripts/judge_io.py) and the [rubric-grader output contract](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/d8474648f1d82761f5504fba952b072c47b55b5c/.claude/agents/rubric-grader.md); new `validate_response`, `grade_batch`, and `merge` in [engine.py](../rubric_audit_openai/engine.py), and `merge_batch_results` in [graph.py](../rubric_audit_openai/graph.py).

### 3. The legacy rejection gate does not keep rejected batches out of the cache

**Verified legacy behavior.** Both merge functions add answers to their in-memory caches before testing repeated reasons. A failed repeated-reason check records an error, but the cache is still written. The second quality-check pass parses every line again outside the original exception handler, so malformed JSON or a missing `reason` can raise an exception there. Unknown evidence IDs are silently removed rather than making a positive grade invalid.

**Consequence.** A batch described as rejected can still contribute grades. A positive grade can survive without a valid supporting evidence ID. The repeated-reason check also does not demonstrate that a superficially unique reason was substantively justified.

**New behavior checked in code.** `validate_response()` checks the entire batch before `merge()` writes an accepted cache entry. Rejected batches are recorded separately. Positive grades require citations to supplied evidence and exact quotation substrings; notes citations must point to notes. The provider checks response completion/refusal and strict JSON shape before the pipeline's semantic-shape validation. Network errors remain errors rather than educational absences.

**Remaining limit.** A real quotation can still be irrelevant, or support a weaker grade than the model selected. Citation validation and repeated-reason checks are structural safeguards, not a measured semantic evaluator. The blinded evaluation protocol is still needed.

Sources: legacy `merge` and `merge_recheck` in [judge_io.py](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/d8474648f1d82761f5504fba952b072c47b55b5c/tools/rubric-audit/scripts/judge_io.py); new [engine.py](../rubric_audit_openai/engine.py) and [provider.py](../rubric_audit_openai/provider.py).

### 4. Legacy cache and run identities omit important inputs

**Verified legacy behavior.** Request keys include item text/path and selected evidence IDs/text, but omit model/provider identity, the grader prompt, output schema, settings, and some model-visible metadata. `common.run_id()` combines the current date and Git HEAD. That run ID appears in `grades.csv`; `update_history()` replaces the existing history block with the same run ID.

**Consequence.** A changed model or prompt can reuse old labels. Identical content exported on another date produces different grade-table bytes. Different uncommitted source states on the same day and HEAD can share a run ID and replace a history block.

**New behavior checked in code.** `snapshot()` computes a content-derived analysis ID from source hashes, the normalized evidence corpus, configuration, prompt, schema, and implementation hashes. Execution time is written separately. Reports use deterministic ordering and serialization, and accepted cache identity is tied to the complete request. The history view is rebuilt from the separate per-analysis outputs.

**Reproducibility boundary.** Byte-identical output means replaying the same accepted judgments with the same analysis inputs and code. Fresh model calls are not promised to return identical judgments. The package records requested and returned model identifiers; it does not guarantee that a provider alias will always resolve to the same underlying model. Runtime dependency versions are not included in the current analysis fingerprint, so record the environment separately for a durable experiment.

Sources: legacy [common.py](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/d8474648f1d82761f5504fba952b072c47b55b5c/tools/rubric-audit/scripts/common.py), `report.run`, and `update_history` in [report.py](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/d8474648f1d82761f5504fba952b072c47b55b5c/tools/rubric-audit/scripts/report.py); new [engine.py](../rubric_audit_openai/engine.py), [util.py](../rubric_audit_openai/util.py), and [reporting.py](../rubric_audit_openai/reporting.py).

### 5. Retrieval and extraction do not establish whole-site absence

**Verified legacy behavior.** The initial grader receives at most seven evidence units, clipped to 260 characters. The recall fallback uses truncated-token overlap rather than a semantic synonym model. Literal-looking paths can still fall through to normalized phrase/token matching. The evidence builder omits topic-level summaries and concepts, skips SVG text, and silently skips missing visual files.

**Consequence.** These choices can miss teaching, hide an explanation outside a snippet, or offer irrelevant evidence. Item-level review is required to measure their actual effect.

**New behavior checked in code.** The input adapters retain complete note summaries, concepts, and supported section blocks. Questions check all associated topics for exam membership and include correct answers and explanations without distractor options. Static visual extraction includes SVG text. Missing visuals and unsupported sources appear in `inventory.csv`. The collector does not execute site JavaScript or infer teaching from arbitrary source-code strings. Unsafe visual paths and links escaping the repository are rejected.

The selector does not clip evidence units. It prioritizes full notes and tracks whether each view includes the complete extracted corpus. A non-`taught` observation is unresolved when that view's extracted corpus was not fully supplied. Literal identifiers use literal matching in the ranked non-note retrieval. Optional explicit synonyms can broaden retrieval.

**Remaining limits.** Context size is bounded; a large note corpus can leave notes outside the request. Static HTML parsing is not a browser rendering or image-understanding pass. Script-generated visuals, unsupported blocks, labs, PBQs, and practice source files require declared structured exports where not supported. A supplied export does not prove all-site completeness. Even a resolved `absent` result means absent within the assessed extracted scope, not necessarily absent everywhere on the website.

Sources: legacy [match.py](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/d8474648f1d82761f5504fba952b072c47b55b5c/tools/rubric-audit/scripts/match.py), [judge_io.py](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/d8474648f1d82761f5504fba952b072c47b55b5c/tools/rubric-audit/scripts/judge_io.py), and [build_evidence.py](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/d8474648f1d82761f5504fba952b072c47b55b5c/tools/rubric-audit/scripts/build_evidence.py); new [inputs.py](../rubric_audit_openai/inputs.py) and `select_evidence`/`finish` in [engine.py](../rubric_audit_openai/engine.py).

### 6. The legacy notes recheck is not an error-rate measurement

**Verified legacy behavior.** The recheck skips initial `taught` notes judgments, supplies the previous notes grade, and can only raise the final notes grade. That is a recall-improvement strategy, not an independent validation study capable of detecting errors in both directions.

**New behavior checked in code.** The default recheck policy is `all`. The OpenAI adapter whitelists rubric/evidence fields and does not supply initial grades or reasons to the recheck. Conflicting initial/recheck labels remain unresolved for adjudication rather than choosing the higher label.

**Remaining limit.** A blinded second pass using the same configured model may share the first pass's mistakes. Agreement between those passes is self-consistency, not independent accuracy. See [evaluation-protocol.md](evaluation-protocol.md) for the separate reference-review procedure.

Sources: legacy `prepare_recheck` in [judge_io.py](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/d8474648f1d82761f5504fba952b072c47b55b5c/tools/rubric-audit/scripts/judge_io.py) and `build_grades` in [report.py](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/d8474648f1d82761f5504fba952b072c47b55b5c/tools/rubric-audit/scripts/report.py); new [engine.py](../rubric_audit_openai/engine.py) and [provider.py](../rubric_audit_openai/provider.py).

## Tests and interpretations

The legacy [test_pipeline.py](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/d8474648f1d82761f5504fba952b072c47b55b5c/tools/rubric-audit/tests/test_pipeline.py) contains helper and result-invariant tests. It does not exercise the stale-request, answer-identity, rejected-cache, or incomplete-finalization paths described above. Its summary-score test checks notes scores, and its data-dependent classes skip when their input CSVs are unavailable. This review did not execute that suite.

The new tests distinguish input validation, provider behavior with injected responses, graph routing, and actual LangGraph integration. Graph integration tests explicitly require the runtime; the sequential reference executor is not presented as a LangGraph run. Consult the current test execution record for executed versus skipped tests rather than inferring execution from a test's presence.

The 28/28/23/21 domain-weight structure and legacy domain identifiers such as `1.0` are structurally supported without renumbering items. This is not a repeated comparison against the objectives PDF. Fractional coverage scores are an explicitly defined index: leaf grades within objectives, equal objective weight within each domain, and domain exam weights. They are not official weights for every rubric bullet, a percentage of questions a learner will answer correctly, or a proof that the instructional content is technically correct.

A later difference between the new and old scores must not automatically be attributed to OpenAI versus Claude. Extraction, retrieval, prompts, validation, and completion rules have also changed. A model-only comparison requires holding those inputs and procedures constant and comparing both models with the same independently reviewed reference.
