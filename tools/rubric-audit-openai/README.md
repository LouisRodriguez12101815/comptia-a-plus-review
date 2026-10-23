# Independent OpenAI rubric assessment

A separate Python assessment tool for comparing study material with a certification rubric. It includes an OpenAI Responses API grader, a genuine LangGraph `StateGraph` implementation, deterministic CSV reporting, and a blinded review protocol. It does not edit, commit, push, or publish the source website.

For installation as a new section of the existing GitHub repository, follow [REPOSITORY_SETUP.md](REPOSITORY_SETUP.md). Its macOS commands place this package at `tools/rubric-audit-openai/` and keep generated assessment output outside the repository.

**Implementation status:** the offline reference workflow and injected-client tests run without third-party dependencies. No live model calls or real certification coverage results were produced during development. LangGraph, its SQLite checkpointer, and the OpenAI SDK could not be installed in the restricted development environment; the real runtime integration tests are present but skipped there. See [validation.md](docs/validation.md) for the exact test results and remaining gates.

Open [the interactive workflow](docs/workflow.html) in a browser. It is self-contained and its three walkthroughs are explicitly simulated. The diagram is also available as [Mermaid source](docs/workflow.mmd).

## Why a separate assessment

The prior Claude audit is preserved as historical work. Its code was inspected at commit `d8474648f1d82761f5504fba952b072c47b55b5c`, through the authorized GitHub connector. Its reported 18.9% notes coverage and 72.4% all-material coverage were not independently reproduced. The SHA supplied in the handoff, `5f14cc38772deaf7f50ea025eb23859403059b21`, identifies an earlier memory-drill commit, not that audit snapshot.

The [reassessment](docs/reassessment.md) documents verified cache, merge, completion, retrieval, and validation weaknesses. These establish possible failure paths; they do not prove that the historical percentages are wrong.

This tool starts its own judgments and cache. It never loads the legacy Claude grades or rationales as accepted answers, and the OpenAI request adapter whitelists fields so earlier decisions are not supplied to the blinded recheck. Changing providers alone would not establish a more accurate assessment. The separate reference review is how agreement will be measured.

## Try the offline example

From the extracted project directory, Python 3.11 or newer is sufficient:

```bash
python3 -m unittest discover -s tests -v
python3 -m rubric_audit_openai demo --out ../openai-demo-output
```

The example uses four original, synthetic rubric items and four evidence units. Its explicit fixture labels produce 37.5% notes coverage and 75.0% all-scanned-material coverage. **These numbers are software fixtures, not CompTIA results and not model assessments.** No API key is needed and no language model is called.

Repeat the same command. It should print `fixture_calls: 0`, keep the same analysis ID, and reproduce `grades.csv`, `summary.csv`, `todo.csv`, and `history.csv` byte for byte. `execution.json` records invocation time separately.

`--engine reference` is the default for `demo`. This is a sequential reference executor using the same ordinary stage functions. It has no checkpointing and is not a substitute for testing LangGraph.

## Install and exercise the real graph

On a machine with permitted package access:

```bash
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -e '.[live]'
python -m unittest discover -s tests -v
python -m rubric_audit_openai demo --engine langgraph --out ../openai-graph-demo
python -m rubric_audit_openai demo --engine langgraph --out ../openai-graph-demo
```

The `graph` extra installs only LangGraph and its SQLite checkpointer; `openai` installs only the OpenAI SDK; `live` installs both. Version ranges are in `pyproject.toml`. They are compatibility bounds, not an environment lockfile verified in this session. Confirm the runtime tests actually run rather than skip before relying on checkpoint recovery.

The demo with `--engine langgraph` still uses fixture labels and makes no API calls. The second run is a direct test of the real graph's cache and rerun behavior.

## Assess the local study repository

Make the existing repository and rubric CSV available through a permitted local checkout or a bundle supplied by its owner. This package does not fetch repositories or work around a proxy. The output directory must be **outside** the source repository.

Set `OPENAI_API_KEY` through your normal local credential setup. Select an explicit model identifier available to that API project, with Responses API Structured Outputs support; there is no assumed account access or default model. Then run:

```bash
python -m rubric_audit_openai run \
  --repo /path/to/comptia-a-plus-review \
  --rubric /path/to/comptia-a-plus-review/tools/rubric-audit/data/rubric/220-1202.csv \
  --out /path/to/separate-openai-audit-output \
  --exam 220-1202 \
  --model YOUR_API_MODEL
```

The default engine for `run` is `langgraph`. Its SQLite checkpoint database lives in the separate output directory. A content-derived analysis ID binds the rubric, extracted evidence, source hashes, model configuration, prompt, schema, and implementation. Each fresh execution receives a different checkpoint thread ID; `checkpoint-pointer.json` identifies the latest execution for that analysis. Older checkpoint threads are retained. Use one CLI process per output directory.

If interrupted, repeat the same command with `--resume`. A resume requires an unfinished checkpoint with the exact same input and configuration identity. A new non-resume run refuses to replace an unfinished execution. Resuming a completed execution returns its final state; starting a fresh execution revalidates cached answers and exports the results again. Checkpointing does not guarantee exactly-once API billing if a process stops after the service accepts a request but before the response is stored locally.

Exit codes: `0` means all rows resolved within the declared scanned scope; `2` means the report needs review; `1` means an input, configuration, dependency, or execution error. A complete run does not mean full site coverage, PDF wording validation, or a measured-accuracy grader.

### Main controls

| Option | Default | Meaning |
| --- | --- | --- |
| `--batch-size` | `4` | Rubric rows per request; smaller batches keep responses inspectable. |
| `--max-attempts` | `3` | Global grading rounds, including the planned recheck. This is not three extra retries per item. |
| `--recheck` | `all` | Blindly recheck positive and negative initial labels. `gaps` reduces calls but cannot check every positive; `none` removes this consistency gate. |
| `--max-context-chars` | `60000` | Approximate evidence budget in serialized characters, not model tokens. Whole evidence units are retained or omitted, never clipped. |
| `--concurrency` | `3` | Maximum concurrent LangGraph work. |
| `--max-output-tokens` | `6000` | Responses API output limit, recorded in analysis identity. |
| `--reasoning-effort` | unset | Optional setting passed to models that support it. |
| `--evidence` | unset | Structured evidence export, either the sole source or a supplement to `--repo`. |
| `--answers-dir` | unset | Import explicit response envelopes instead of calling the API. |

The default full recheck normally adds a second round of model calls. Larger prompts, more rows, and retries increase usage. The CLI never silently substitutes another model. Refusals, incomplete responses, API errors, malformed answers, and invalid citations remain unanswered work.

## What is assessed

The rubric input must contain the legacy columns: `exam`, `domain`, `domain_weight`, `objective`, `objective_title`, `item_id`, `level`, `parent_id`, `item_text`, and `path`. IDs and wording are preserved. Both legacy domain IDs such as `1.0` and consistent integer IDs such as `1` are accepted. Hierarchy, identities, weights, and objective membership are checked.

**The extract node imports an existing CSV. It does not extract a new PDF or verify the wording against the official PDF.** Keep the official rubric in tooling, outside site content. No CompTIA objective text is bundled with this package. Before treating the imported rubric as authoritative, verify its provenance and wording separately using an authorized copy of the objectives.

The repository adapter reads the existing content schemas:

| Source | Treatment |
| --- | --- |
| Topic summaries, concepts, and supported section blocks | Full text with source path and JSON locator; counts as notes. |
| Flashcards | Front and back, filtered to the requested exam. |
| Questions | Prompt, correct answer, and explanation; distractor options are excluded. Any mapped topic can establish exam membership. |
| Mapped HTML visuals | Static visible text, including SVG text; scripts are not executed. Dynamic or missing content is recorded. |
| TypeScript practice drills, labs, PBQs | Identified in the inventory where discoverable; require an explicit structured export. |

`inventory.csv` records scanned, missing, partial, and export-required sources. This is coverage of the **declared scanned corpus**, not a claim that every possible file, image, interactive state, or study experience was understood. Content outside the supported repository layout needs an export or an adapter extension.

A JSONL evidence export has one object per unit:

```json
{"exam":"220-1202","evidence_id":"lab:example-step","source_type":"lab","source_path":"content/my-lab.json","locator":"/steps/0","text":"The complete instructional text from this step.","objectives":["1.1"]}
```

Allowed types are `note`, `card`, `question`, `visual`, `drill`, `lab`, and `pbq`. IDs must be unique. Supplied exports are not independently certified as complete or faithful to the original source.

## Evidence selection and grades

Requests prioritize full note units by relevance, followed by other evidence selected through objective mappings and lexical overlap. A Python configuration can add explicit synonym aliases. Expanded rechecks consider the whole extracted corpus, within the configured context budget. There is no embedding search in this version, and synonyms can still be missed.

Grades have two views: notes alone and all scanned material, which includes notes. `taught = 1`, `mentioned = 0.5`, `absent = 0`. Every positive label requires a valid evidence ID and a verbatim quote. The validator enforces exact batch membership, current request identity, material not below notes, reason presence, and citation scope before accepting the entire batch.

Those checks establish provenance and structural validity. They do not prove that a quotation warrants the semantic grade. A model can misunderstand a real passage; the blinded reference review is still necessary.

If a judgment is below `taught` and the whole scanned corpus for that view was not presented, the final label stays `unresolved`. Required rechecks are not shown the original labels. A changed label in either direction requires review instead of taking the larger score. Missing/rejected answers retry within the global budget; semantic disagreements end in review rather than an unbounded retry loop.

Reports average leaf grades within an objective, objectives equally within a domain, and domains by their input exam weights. This is a declared reporting convention; illustrative objective bullets do not establish an official per-bullet exam weighting. Unresolved rows stay in the denominator. Their range from zero to one produces bounds; it is not a statistical confidence interval or a prediction of exam performance.

## Outputs and review

Each `runs/<analysis_id>/` directory contains:

| File | Purpose |
| --- | --- |
| `manifest.json`, `evidence.jsonl` | Frozen input identity and evidence corpus. |
| `requests/*.json`, `responses/*.json`, `rejected/*.json` | Individual request envelopes, returned answers, and rejection diagnostics. |
| `judgments.jsonl` | Both grading passes and final effective decisions. |
| `grades.csv`, `summary.csv`, `todo.csv` | Row-level results, objective coverage, and weighted gaps/review work. |
| `inventory.csv` | Source scope and extraction limitations. |
| `rollups.json`, `report.md`, `coverage.html` | Domain/overall scores and an offline objective heatmap. |
| `validation/blinded-review.csv`, `validation/sampling-manifest.json` | Frozen sample and a blank review sheet without the model's predictions. |

`history.csv` and the request-hash accepted cache are at the output root. JSON files make individual request/cache writes atomic; JSONL keeps nested evidence and final judgments easy to inspect; the comparison tables remain CSV. The legacy CSV format decision is preserved for flat results, though this version adds uncertainty columns and different analysis IDs.

The default sample is up to 40 resolved notes-grade leaf items, selected by a recorded hash permutation. Counts of excluded unresolved items and headings are explicit. An existing review sheet is preserved on rerun after its sample IDs are checked. Keeping a separate completed-review copy is still useful for independent annotation history.

After reference labels have been completed, measure agreement:

```bash
python -m rubric_audit_openai score-review \
  --grades /path/to/run/grades.csv \
  --review /path/to/completed-review.csv \
  --manifest /path/to/run/validation/sampling-manifest.json \
  --view notes \
  --reviewer-type human \
  --out /path/to/notes-agreement.json
```

This reports exact agreement, a Wilson interval, a confusion matrix, directional disagreements, and mean absolute score difference. It does not automatically certify the reference as a human gold standard. A model reviewer produces model agreement, not independently established accuracy. The notes sample can be scored for material only when every sampled material prediction and reference is resolved; no row may be silently dropped. See [evaluation-protocol.md](docs/evaluation-protocol.md).

`--answers-dir` supports a manual OpenAI workflow: run once to generate requests, then supply schema-valid envelopes named by the exact `job_id`, including the corresponding `request_hash`. Use the same configuration and a fresh execution after a completed `needs_review` run. Valid initial and later recheck requests may require separate passes. Importing files does not independently prove which provider produced them; their provenance is the operator's responsibility.

## Source map

- `inputs.py`: read-only source adapters and structural rubric verification.
- `engine.py`: ordinary Python stage functions, validation, cache, recheck, and review preparation.
- `provider.py`: OpenAI request schema, prompt, and response/error adapter.
- `graph.py`: real LangGraph topology plus a clearly separated sequential reference executor.
- `reporting.py`: deterministic tables, uncertainty bounds, and the generated heatmap.
- `evaluation.py`: sampling, blinding, and reference-agreement calculations.
- `cli.py`: entry points and SQLite execution/resume handling.

The official implementation references are the [OpenAI Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs), [LangGraph Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api), and [LangGraph persistence documentation](https://docs.langchain.com/oss/python/langgraph/persistence). The actual installed runtime and chosen model still require verification before a real assessment.
