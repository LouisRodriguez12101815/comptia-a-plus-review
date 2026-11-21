# Perfect Capstone Submission Checklist

Source: the course `Capstone_Guide.pdf` (posted in Google Classroom, "Capstone Guide",
Nov 4, 2026) plus the alignment work already done in this repo. Every "exact line"
below is a line the guide checks verbatim — a grader can search the notebook output
for these strings.

## Deliverables

- [ ] **Notebook** — `capstone/flow.ipynb`, runs top to bottom in Colab with no
      manual fixes (no `pip install` surprises beyond the Colab preinstalled set).
- [ ] **Shared Colab link** — File > Save a copy in Drive, share as
      *Anyone with the link — Viewer*.
- [ ] **README** — this folder's `README.md`: how to run, the expected outputs,
      and the limitations.
- [ ] **Repo commit** — notebook + README committed to the repo
      (`capstone-flow` branch / pull request).

## Step-by-step checks (the guide's own checked lines)

| Step | What the grader sees | Exact line / value |
|------|----------------------|--------------------|
| 1 | A CSV is actually saved, not just a DataFrame | `saved primary_history.csv` + raw file printed |
| 2 | Inspection with pandas | `head`, `shape` prints `(8, 4)`, `info`, `describe` |
| 3 | Real validation error, shown without crashing the cell | `ValueError: Missing columns: ['correct']` inside try/except (set difference against a REQUIRED set) |
| 4 | Cleanup is honest and counted | `missing correct after conversion: 2` and `rows: 8 -> 6 \| dropped: 2` |
| 5 | Domain averages from the objective→domain mapping | averages per domain; flagged = domains below 70% |
| 6 | One wrapper function | `analyze_answers(path, threshold=THRESHOLD)` returns exactly `summary`, `flagged`, `dropped_count`; missing file → one-row fallback (dropped_count 0); missing column still raises |
| 7 | Four tests + closing line | `test 1 ok: mock CSV` · `test 2 ok: missing file -> {fallback summary}` · `test 3 ok: missing column -> Missing columns: [...]` · `test 4 ok: huge threshold flags nothing` · `all tests passed` |
| 8 | LangGraph pause pattern | `install cell: langgraph ready` · `--- run until the pause` · `flagged so far: ...` · `waiting at: ('human_review',)` · `--- a person approves; resume` · three REVIEW lines · `final decision: approved by reviewer` |

## Step 8 specifics (the pattern the grader checks for)

- Four nodes: validate → score → `human_review` → finalize.
- `MemorySaver` checkpointer, compiled with `interrupt_before=["human_review"]`.
- Resume via `app.update_state` / `app.invoke(None, ...)` on `thread_id="run-1"`.
- State carries `rows` as a **list of dicts**, not a DataFrame.
- Node functions may be rewritten; the compile/pause/resume pattern must match
  the guide's Step 8 cell.

## Data rules

- The 8-row mock is committed; the real `primary-history.json` is an optional
  extra run only.
- `data/` stays out of Git (already in `.gitignore`).
- The flow + safety statement lives in a markdown cell at the top of the notebook.

## Known deviation (flag for the instructor, not a silent choice)

- The guide flags rows with a `>=` mask; this notebook flags **domains that fall
  below 70%** (domain-level flagging, matching the "average from several rows"
  mock design). One markdown line in Step 5 explains this. Ask the instructor to
  confirm it's acceptable.
