# File formats in the rubric audit

Rule of thumb: **flat table that people or spreadsheets will compare → CSV. Nested data an agent reads once → JSONL. Prose for a human → Markdown. Never a format that hides a diff.**

## Measured on the Core 2 run

| Measure | Result |
| --- | --- |
| `grades.csv` (795 rows) | 162 KB as CSV, 387 KB as JSON or JSONL (2.4x larger) |
| Load time | about 2 ms CSV, 1 ms JSON (irrelevant at this size) |
| 300 evidence rows | 108 KB as JSONL, 69 KB as CSV, 73 KB as pipe text (JSONL repeats every key on every row, about 35% more tokens for agents) |
| Rerun determinism | `finish` twice gives byte-identical `grades.csv` and `summary.csv` |
| `history.csv` | 41 rows per run (36 objectives, 4 domains, 1 overall row); one more block per run |

## Schemas

- **rubric** `exam, domain, domain_weight, objective, objective_title, item_id, level, parent_id, item_text, path`. Tidy: one row per line of the objectives. `parent_id` and `path` carry the outline, so no nested structure is needed.
- **evidence** `evidence_id, exam, source_type, source_id, topic_id, context, objectives, depth, text`. One row per paragraph, bullet, card, question or drill item. Newlines are flattened to one line so `grep`, `wc -l` and `diff` work per row.
- **matches** `item_id, evidence_id, source_type, match_level, score, mapped`. A long join table; it is the many-to-many link between rubric and evidence.
- **batches (JSONL)** one rubric item per line with its evidence snippets nested inside. Nested, read by an agent once, so JSONL.
- **answers (JSONL)** `key, item_id, notes_grade, material_grade, reason` per line. Append-friendly; a half-written file loses one line, not the file.
- **judgments / notes-recheck (JSONL, committed)** the cache. Key = hash of item text, path, evidence ids and evidence text. Edit a note and only the items whose evidence changed are judged again.
- **grades, summary, todo, acronyms, history (CSV, committed)** the quantitative outputs. Open in a spreadsheet, filter with `awk` or pandas, diff with `git diff`.
- **report.md** prose for reading; never parsed.

## Answer to "is CSV easier for finding quantitative change?"

Yes, for results. `history.csv` appends one block per `run_id` with the same columns, so a trend is a filter and a subtract. `git diff results/<exam>/grades.csv` shows exactly which items changed grade, one line each. JSON would show the same change as a reshuffled blob.

No, for agent input. Batches have a list of evidence snippets per item, and flattening that to CSV means either repeated item columns or an embedded list in a cell. JSONL is the right shape there.

## Conventions that keep diffs clean

LF line endings, UTF-8, fixed column order from `common.py`, rows sorted by `item_id`, no timestamps inside result rows (the date lives only in `history.csv`), and the `run_id` is `date-gitsha`.
