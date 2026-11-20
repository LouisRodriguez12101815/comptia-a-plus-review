# GapLift practice-data capstone flow

## Purpose and limits

This package adapts the requested course sequence to synthetic GapLift-style practice records. The CSV contains `record_id`, `domain`, and `practice_score`; these are teaching examples, not real learner records, certification scores, or evidence of learning outcomes. The flow does not train a predictive model and makes no claim about exam performance or predictive validity.

A below-cutoff score is a **review signal**. Recommendations require human review before any external action or change. The example LangGraph has no action node: both approval and rejection end with `external_action: none`.

## What's included

- `analysis_walkthrough.ipynb`: executable Colab/Jupyter walkthrough with saved outputs.
- `capstone_analysis.py`: reusable pandas analysis, explicit mock fallback, validation, and actual LangGraph review graph.
- `fixtures/practice_records.csv`: deterministic eight-row teaching fixture, with one nonnumeric and one blank score.
- `fixtures/missing_column.csv`: error-path fixture.
- `tests/test_capstone.py`: the four required course checks plus explicit one-row fallback, empty/all-invalid, and strict missing-file cases.
- `tests/test_workflow.py`: actual LangGraph interrupt, checkpoint, resume, approval, and rejection integration tests.
- `requirements.txt`: pinned runtime packages; `requirements-dev.txt` adds notebook/test tooling; `requirements-lock.txt` records the full tested environment.

## Set up and run locally

Tested with Python 3.12.14. From the repository root:

```bash
python -m venv .venv-capstone
. .venv-capstone/bin/activate
python -m pip install -r capstone/requirements-dev.txt
PYTHONPATH=capstone python -m unittest discover -s capstone/tests -v
```

For the exact tested environment, use `python -m pip install -r capstone/requirements-lock.txt` instead of the dev requirements. The lock was generated from the environment that executed the notebook and tests.

To execute the notebook from a fresh kernel and save its outputs in place:

```bash
cd capstone
jupyter nbconvert --to notebook --execute --inplace analysis_walkthrough.ipynb
```

The actual execution for this review used `nbclient.NotebookClient` with `kernel_name="python3"`, a clean kernel, a 180-second timeout, and `resources.metadata.path=capstone/`. The notebook completed top to bottom and retained each cell's output.

### Tested package versions

| Package | Version |
|---|---:|
| Python | 3.12.14 |
| pandas | 3.1.1 |
| langgraph | 1.2.24 |
| langgraph-checkpoint | 4.3.2 |
| jupyter | 1.1.1 |
| nbformat | 5.11.1 |
| nbclient | 0.11.0 |
| ipykernel | 7.4.0 |

## Actual fixture result

The run read 8 records, retained 6 numeric scores, and excluded 2 rows. The audit identifies `r005` (`not-a-score`) as nonnumeric and `r008` as blank. The cleaning rule is `pd.to_numeric(..., errors="coerce")`; invalid/blank values are excluded from group means and flags, but remain visible in the audit output.

At the named cutoff `threshold = 70.0`, a score is flagged only when it is **strictly less** than 70. The result flagged `r003` (storage, 61) and `r006` (database, 58). Group means over retained records were compute 88.0 (n=1), database 69.5 (n=2), network 93.0 (n=1), and storage 66.5 (n=2). At threshold 58, no row was flagged because the comparison is `<`, not `<=`.

The direction differs from the course example described as “above threshold”: this flow asks which low observed scores deserve a second look. That pedagogical choice is explicit and configurable. It does not change or claim to reproduce the course's source-specific threshold rule.

An empty input returns `clean_status="empty_input"` with zero rows. An entirely invalid input returns `clean_status="no_valid_scores"`, an empty summary/flag list, and an audit row for each dropped score. These states are not presented as a normal no-flags result.

### Missing-file and missing-column behavior

The loader raises `FileNotFoundError` by default. When a caller explicitly sets `use_mock_fallback=True`, it uses the Capstone Guide's **one-row** mock fallback. The returned metadata contains `source_kind="mock_fallback"`, `fallback_used=true`, the missing path reason, and a visible notice; the four-check output prints the notice and reason. Mock rows are never represented as if they came from the missing file. Missing required columns still raise a clear `ValueError`.

This follows Capstone Guide Step 6 (CG p.6; notebook NB-L cell 22). The Class 15 deck separately calls for wrong-path and missing-column test evidence (PY15 p.14); the integration suite also tests empty input. The checklist records the Python capstone post as due before Class 15 on Nov. 5, 2026 (CG p.11; PY15 p.1). That date has passed; whether a late post is accepted is an instructor question. No post or sharing change was made.

## LangGraph human review

The graph has four nodes in order: `load → clean → analyze → human_review`. State contains only JSON-like dictionaries, lists, strings, numbers, and booleans; pandas DataFrames stay within node functions. It uses the current `InMemorySaver` checkpointer and `langgraph.types.interrupt` API. The integration tests exercise a real pause, inspect the checkpoint's next node, update/resume it with `Command(resume=...)`, and verify both approval and rejection. No graph transition calls an external system. The Capstone Guide's sample uses `MemorySaver`, `interrupt_before`, and `update_state` (CG p.7; NB-L cell 32). This package uses the installed `InMemorySaver` and an in-node `interrupt`, then resumes with `Command`; these are compatible API choices for the verified installed versions, exercised by integration tests. The course checklist calls for visible pause and resume evidence in one Step 8 screenshot (CG pp.11–12); the repository has a combined local browser screenshot, and still needs a Colab screenshot from the submission copy.

A real run pauses at the review node and requires a human decision to resume. The notebook's **VALIDATION/DEMO ONLY** cell supplies scripted approve and reject values solely to preserve repeatable execution evidence. Do not treat those fixed values as operational approval. For actual use, stop after the displayed pause packet, have a person inspect it, then resume with a reviewed decision and notes.

### Website rule comparison (verified in current code)

GapLift's current `lib/weakness.ts` derives objective accuracy from saved timed-test attempts. It uses the last 10 answers for recent accuracy, requires at least 3 answered items before marking an objective `weak`, treats recent accuracy below 70% as weak, and uses 85% as the `strong` boundary. Untested and fewer-than-3-answer states remain distinct. The `weakestObjectives` recommendation list ranks `weak` before `ok`, then lower recent accuracy, and defaults to five items. This notebook instead groups synthetic raw practice scores and applies one configurable `<70` cutoff. It does not implement the website's recency, minimum-sample, objective mapping, or status rules.

## Open and rerun in Google Colab

1. In Colab, choose **File → Upload notebook** and select `analysis_walkthrough.ipynb`.
2. In the Colab Files pane, upload `capstone_analysis.py` and `requirements.txt` to `/content`.
3. Create a `/content/fixtures` folder in the Files pane. Upload `practice_records.csv` and `missing_column.csv` into it.
4. Run all cells. The setup cell installs the pinned pandas/LangGraph runtime requirements. Confirm the displayed fixture path is `/content/fixtures/practice_records.csv` and that it says `Fallback used: False` for the primary run.
5. If the notebook reports a missing helper or fixture, stop and correct the upload path; do not treat the labeled fallback as the requested CSV.

To make a Viewer link, use Colab **Share**, set the intended audience and **Viewer** role, then choose **Copy link**. Sharing is not changed by this project; Louis should confirm the intended audience before changing Colab's access setting.

### Submission screenshots to capture

Chromium and Playwright were available, so I captured screenshots of the executed notebook in a local browser. The combined Step 8 image shows the notebook's actual saved pause and resume outputs. These are genuine local-run evidence, not Google Colab screenshots:

- [Step 7 course checks](evidence/step7-course-checks.png) shows all four `ok` lines, the one-row fallback notice/reason, and `all tests passed`.
- [Step 8 paused review](evidence/step8-human-review-paused.png) shows the actual review packet and `checkpoint next node: ('human_review',)`.
- [Step 8 resumed review](evidence/step8-human-review-resumed.png) shows both real demo resume results and `external action: none`.
- [Step 8 pause and resume together](evidence/step8-human-review-pause-resume.png) shows the pause packet and both resume decisions in one screenshot, as the checklist requests.

For Colab-specific evidence, open the notebook there, rerun the cells, and capture the same visible outputs with Colab/browser capture or your operating system's screenshot tool. Do not label the local Jupyter screenshots as Colab evidence.

## Three-minute demonstration outline

1. **Purpose (30 seconds):** show the synthetic CSV and say the signal is for human review, not prediction or exam outcomes.
2. **Valid run (60 seconds):** show the 8→6+2 cleaning counts, audit rows, domain means, and the `<70` flags.
3. **Failure handling (45 seconds):** show the explicit fallback metadata, missing-column error, and empty/all-invalid distinction.
4. **Human review (35 seconds):** show the checkpoint pause, inspect the packet, and demonstrate approve/reject resume in the labeled demo. Point out that no external action exists.
5. **Improvements/limits (10 seconds):** discuss a real dataset, rubric alignment, and held-out evaluation as future/instructor-confirmed work.

## Questions for the instructor

- Is late submission still accepted, and what evidence or format is required?
- Is this GapLift-style synthetic-data adaptation acceptable for the Python capstone, and should a different source dataset be used?
- What are the exact ML final-capstone requirements, dataset expectations, baseline/held-out evaluation criteria, and submission evidence?
- Are the SQL project, real-data Power BI dashboard, and stakeholder presentation required before submission or part of separate program milestones?

## Pending requirements and rubric unknowns

No published scoring rubric, points, or pass threshold was available in the supplied materials. Do not infer that this round completes every program requirement. These items remain pending verification with the instructor:

- Predictive ML model with a baseline and held-out evaluation.
- SQL project.
- Power BI dashboard using a real dataset.
- Stakeholder presentation.

No ML model, SQL package, Power BI dashboard, real-learner dataset, or new website feature was added. Whether any pending item blocks capstone submission is unknown until the official rubric/checklist is supplied.

## Requirement-to-evidence map

This map uses the provided **Capstone Requirements: Source-Only Evidence Pack**, prepared Nov. 19, 2026. Its page numbers refer to the cited course PDFs/slides. The two other supplied documents—the SWOT brief and Insights milestone prompt—are treated as historical scope/context, not as new instructions for this separate Python-flow task.

| Course requirement and source | Evidence in this package | Status / remaining action |
|---|---|---|
| Required flow sentence (CG p.1) | First Markdown cell in `analysis_walkthrough.ipynb` | Present |
| Colab notebook copy and runtime (CG p.2) | Notebook setup cell installs pinned runtime requirements; README gives upload/run steps | Code ready; Louis still must save a copy in Drive and rerun it in Colab |
| 8-row, 3-column mock dataset; inspect with `head`, `shape`, `info`, `describe` (CG p.3; NB-L cell 2) | `fixtures/practice_records.csv`, notebook Step 2 | Present; 8 rows and 2 intentionally invalid scores |
| Required-column validation, readable error (CG p.4; NB-L cell 10; PY15 p.14) | `validate_required_columns`, `fixtures/missing_column.csv`, course check 3 | Present and tested |
| `pd.to_numeric(errors="coerce")`, visible invalid-row audit, retained/dropped counts (CG p.4; NB-L cell 14; PY14 pp.8, 17, 21) | `analyze_records`, notebook Step 4, `audit_rows` | Present; invalid and blank rows have recorded reasons |
| Group summary and configurable flag rule (CG p.5; NB-L cell 18) | Domain means and `< threshold` flags at notebook Steps 5–6 | Present as a GapLift-style adaptation; uses a low-score review signal rather than the CG leads example's “above threshold” direction, as requested |
| Plain dictionary; one-row missing-file mock fallback; missing columns remain loud (CG p.6; NB-L cell 22) | `analyze_records`, explicit `use_mock_fallback`, returned metadata | Present; fallback shape and notice tested |
| Four assertions and Step 7 output (CG pp.6–7; NB-L cell 26; PY15 pp.14, 22) | `run_course_checks`, `tests/test_capstone.py`, notebook Step 7 | Four required checks pass and print four `ok` lines; explicit one-row fallback, wrong-path, empty-input, and all-invalid cases are also tested |
| Four-node human-review graph and pause/resume (CG p.7; NB-L cell 32; PY14 p.21; PY15 p.17) | `build_review_graph`, actual checkpoint tests, notebook Step 8 | Real `InMemorySaver` + `interrupt` pause, approve/reject resumes tested. API differs from CG's `interrupt_before`/`update_state` example; README documents and tests the installed API. |
| Make the flow your own (CG p.8; NB-L cell 35; PY15 p.17) | Synthetic `record_id/domain/practice_score` fixture and low-score rule | Implemented as adaptation; instructor acceptance is not established by the documents |
| Top sentence and Step 7/8 screenshots/share link (CG pp.11–12) | Sentence in first cell; local screenshots in `evidence/` | Sentence, Step 7, and combined Step 8 local evidence exist. A Colab copy/share link and screenshots from the submission copy remain Louis's actions. Ask whether late posting is accepted. |
| Safety statement and evidence-backed output (PY15 pp.17, 22) | Notebook opening, graph review packet, output from computed CSV results | Present; no external writes/actions exist in the graph |
| 3-minute demo (PY15 p.23) | Demo outline in this README | Present as a script; no live presentation has been made |
| ML final app/model evaluation (MLS pp.6–7, 11; ML3 p.19) | No ML model or API added | Pending separate scope; exact Class 13 date/format and rubric remain unspecified |
| Program deliverables: SQL, Python, real-data Power BI, predictive ML, stakeholder presentation (PO p.3) | Python flow implemented here; other project artifacts not added in this round | SQL, Power BI, ML, presentation/submission status must be verified; could exist outside this repository |

The Capstone Guide says no one has to present; it asks for the notebook link and evidence to be posted in the class Slack channel (CG p.11). I did not post or change sharing permissions. The checklist records that the stated Class 15 post window was Nov. 5, 2026; late acceptance is unknown.

The provided source pack reports no published scoring rubric, points, or passing threshold. It also says ML Class 13 date/format and program-project submission details are not specified. Those remain instructor questions; this package does not claim to satisfy every program deliverable.
