---
name: rubric-audit
description: Compare the official CompTIA exam objectives (the PDF rubric) with the site's notes and study material, and grade how completely each objective item is taught. Use before an exam, after adding notes, or when asked what is still missing from the review material.
---

# Rubric audit

Read [the workflow contract](../../WORKFLOW.md) first. The tool lives in `tools/rubric-audit/` (see its [README](../../../tools/rubric-audit/README.md) and [format guide](../../../tools/rubric-audit/docs/formats.md)). Scripts do everything that can be decided by rule; the `rubric-grader` agent does the one step that needs reading comprehension.

## Run it

All commands: `python3 tools/rubric-audit/scripts/run.py <stage> --exam 220-1202` (or `npm run audit:rubric -- <stage>`).

1. **First time for an exam only.** `extract --pdf <objectives.pdf>` writes `data/rubric/<exam>.csv` (needs `pip install pdfplumber`). Then `verify --pdf <objectives.pdf>` must print `0 with differences`. Fix the extractor, never the CSV by hand, if it does not.
2. `prepare` builds the evidence table, finds candidate matches, and writes JSONL batches of items that still need a judgment. Items already judged and unchanged are skipped (cache), so a rerun after small edits is cheap. It prints how many batches are waiting.
3. For each waiting batch, run a `rubric-grader` agent with the batch path and the answer path it names. Run batches in parallel, four or five at a time. Agents are report-only: each writes one answer file under `out/<exam>/judged/`.
4. `finish` merges answers into `results/<exam>/judgments.jsonl`, rejects any answer with a templated or missing reason, and tells you which items to resend. Repeat 3 and 4 until it reports 0 unanswered.
5. `recheck` prepares a second look at notes-only gaps (the keyword pass can miss a paraphrase); send those batches to `rubric-grader` in recheck mode, then `finish` again.
6. `status` shows where a run stands at any point.

## Verify before you report

- Read ten graded rows yourself: five `taught`, five `absent`, against the notes they cite. If two or more are wrong, stop and fix the grader instructions or evidence, not the grades.
- Run `python3 -m unittest discover -s tools/rubric-audit/tests`; it checks the invariants (every item graded once, material never below notes, no templated reasons, summary equals grades).
- Rerun `finish`: `grades.csv` and `summary.csv` must be byte-identical.

## Report

Lead with `summary.csv`: notes score and all-material score per domain and objective. Then the top rows of `todo.csv` (ranked by domain weight and gap type: `absent-everywhere` before `notes-only-gap`). Say what the tool cannot see: labs are not scanned, synonyms the keyword pass missed, and rubric bullets that are examples rather than requirements. Compare with the previous run using `history.csv` (filter by `run_id`).

## Rules

- Never paste the objectives PDF into the site (see AGENTS.md); the rubric CSV stays in `tools/`.
- Never edit `grades.csv`, `summary.csv`, `todo.csv` by hand. They are outputs; change the judgment cache or the evidence and rerun.
- Do not change site content from this skill. Hand `todo.csv` items to `chapter-ingest`, `question-writer`, or `exam-drill-builder`.
