# Capstone flow — quiz answers by A+ domain

`flow.ipynb` is the Python capstone flow from the Capstone Guide ("Build One Flow"),
adapted to the CompTIA A+ review site's quiz data. It runs the guide's steps in order:

1. **Save the mock table** — 8 rows in the export's column shape (`questionId`, `objective`, `correct`, `timestamp`), written to `primary_history.csv` and printed raw. Two rows are broken on purpose: one empty `correct`, one word (`none`) in `correct`.
2. **Inspect** — pandas `head`, `shape` `(8, 4)`, `info`, `describe`.
3. **Required columns** — a set difference against a `REQUIRED` set raises `ValueError: Missing columns: ['correct']`; shown on a bad file inside `try/except` so the cell stays green.
4. **Convert + clean** — `True`/`False` arrive as text after the CSV round-trip (`pd.to_numeric` alone would turn every row into NaN), so the two real values map to 1/0 and everything else counts as missing: `missing correct after conversion: 2`, then `rows: 8 -> 6 | dropped: 2`.
5. **Summarize + flag** — objective → A+ domain, average `correct` per domain, domains below 70% are flagged. The mapping was generated from the repo's `content/objectives.json` on 2026-11-19 and covers **Core 1 (220-1201)** and **Core 2 (220-1202)**; the mock rows are scoped to Core 1.
6. **Wrapper** — `analyze_answers(path, threshold=THRESHOLD)` returns a plain dict with exactly `summary`, `flagged` (a list of records) and `dropped_count`. A missing file falls back to a one-row mock with `dropped_count: 0`; a missing column still raises.
7. **Four tests** — mock CSV numbers, missing-file fallback, missing-column error, threshold 0 flags nothing — then `all tests passed`.
8. **Review pause** — the guide's Step 8 pattern: `StateGraph` with four nodes (`load`, `clean`, `summarize`, `human_review`), `MemorySaver`, `interrupt_before=["human_review"]`, `update_state`. State holds rows as a list of dicts, not a DataFrame. Thread id: `run-1`.

## How to run

- **Colab:** upload `flow.ipynb` (or open from Drive), File → Save a copy in Drive, Share → "Anyone with the link", Viewer. Run all cells top to bottom; the first run installs `langgraph`.
- **Locally:** `pip install pandas langgraph`, then `jupyter nbconvert --to notebook --execute capstone/flow.ipynb`.

## Expected output

```
saved primary_history.csv
questionId,objective,correct,timestamp
q-m01,1.1,True,2026-11-17T21:04:00.000Z
... (8 rows; q-m07 has an empty correct, q-m08 has "none")

(8, 4)

Missing columns: ['correct']

missing correct after conversion: 2
rows: 8 -> 6 | dropped: 2

1.0 Mobile devices: 0.50 over 2 rows
2.0 Networking: 1.00 over 2 rows
3.0 Hardware: 0.50 over 2 rows
flagged (< 0.70): 1.0 Mobile devices, 3.0 Hardware

test 1 ok: mock CSV
test 2 ok: missing file -> {'summary': [{'domain': '2.0 Networking', 'average': 1.0, 'rows': 1}], 'flagged': [], 'dropped_count': 0}
test 3 ok: missing column -> Missing columns: ['correct']
test 4 ok: huge threshold flags nothing
all tests passed

langgraph ready
--- run until the pause
flagged so far: 1.0 Mobile devices, 3.0 Hardware
waiting at: ('human_review',)
--- a person approves; resume
summary: 1.0 Mobile devices 0.50, 2.0 Networking 1.00, 3.0 Hardware 0.50
flagged: 1.0 Mobile devices, 3.0 Hardware
dropped: 2
final decision: approved by reviewer
```

The saved CSVs (`primary_history.csv`, `primary_history_bad.csv`) are created by the notebook itself in its working directory; nothing is committed under `data/` (`.gitignore` already excludes it).

## Limitations

- **Mock data only.** The 8-row table stands in for `scripts/export-primary-history.mjs` output. No real learner history is read, and no real export is committed.
- **Static mapping snapshot.** The objective → domain table is embedded (generated 2026-11-19 from `content/objectives.json`). If the site's coverage map changes, regenerate it.
- **Single-exam scope for the rows.** The mapping covers both A+ exams, but the mock rows are Core 1 only; the wrapper keys rows on `EXAM`, so a mixed-exam file would need an exam column first.
- **Flag rule differs from the starter.** The guide's starter flags rows with a `>=` mask; this flow flags domains whose average falls below 70%. That choice is noted in the notebook and pending instructor confirmation.
- **The reviewer decision is simulated.** `update_state` injects "approved by reviewer"; nothing is messaged, stored, or changed for any learner — the agent has no outbound side effects at all.
