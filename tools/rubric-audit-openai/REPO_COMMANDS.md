# Repository commands for OpenAI rubric assessment

This is the reusable command reference for `tools/rubric-audit-openai/` in
`LouisRodriguez12101815/comptia-a-plus-review`. Run the commands from the repository
root in macOS zsh. The assessment reads the local checkout. Its `--repo` option is
not a deployed-site crawler.

## Repository layout

| Location | Purpose |
| --- | --- |
| `tools/rubric-audit-openai/` | Independent Python implementation, LangGraph, tests and documentation. |
| `tools/rubric-audit-openai/connect-repo.mjs` | One-time, repeatable addition of npm shortcuts and a root README link. |
| `tools/rubric-audit/data/rubric/<exam>.csv` | Shared rubric inputs; filenames use the exam code. |
| `package.json` | Repository-level command shortcuts. |
| `$HOME/Study-Audits/comptia-openai/<exam>/` | Local reports, frozen evidence, caches and SQLite checkpoints. |

The assessment's code and documentation belong in Git. The tool's `.gitignore`
excludes its Python environment, caches and local environment files. Real audit
output stays outside the source repository. The original `audit:rubric` command,
if present, continues to mean the original workflow.

## Install on a fresh checkout

Python 3.11 or newer is required. Node/npm come from the website's existing
development setup. If the checkout has the tool but not its npm shortcuts,
first run this from the repository root:

```zsh
node tools/rubric-audit-openai/connect-repo.mjs
```

This preserves existing npm entries, stops on a conflicting shortcut, and appends
the documentation link once. It does not install dependencies or run Git. It
does not add any model calls to the website's build, global tests or CI.

Then install the Python environment from the repository root:

```zsh
(
  set -e
  python3 -c 'import sys; assert sys.version_info >= (3, 11), "Python 3.11 or newer is required"'
  python3 -m venv tools/rubric-audit-openai/.venv
  tools/rubric-audit-openai/.venv/bin/python -m pip install -e './tools/rubric-audit-openai[live]'
  npm run test:rubric:openai
)
```

The quotes around the editable-install argument are required in zsh. On Louis's
already-installed Mac, recreating the environment is unnecessary.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run audit:rubric:openai -- --help` | Show the available CLI subcommands. |
| `npm run audit:rubric:openai -- run --help` | Show all assessment options. |
| `npm run test:rubric:openai` | Run the Python assessment tests. |
| `npm run demo:rubric:openai -- --out "$HOME/Study-Audits/comptia-openai/demo"` | Run synthetic fixtures through the real LangGraph; no API calls. |
| `npm run audit:rubric:openai -- diagram` | Print the Mermaid graph. |
| `npm run audit:rubric:openai -- score-review --help` | Show how to calculate agreement with a completed blinded review. |

The `--` after the npm script name forwards the following arguments to Python.

The supplied terminal transcript showed all **75 Python tests
passing**, including the real LangGraph/SQLite tests, on Louis's Mac. Two real
LangGraph fixture runs completed, with fixture-call counts **2**, then **0**;
both made **0 live model calls**. Earlier development-environment records under
`docs/` reported skipped runtime tests because dependencies were unavailable
there. These are different environments. The Mac transcript did not establish
a completed assessment of the real study content or a measured grader error rate.

## Run an assessment for a selected exam

The following block prompts for an exam code, checks that its rubric exists, and
then prompts for a model and API key. For A+ Core 2, enter `220-1202` at the exam
prompt. Use a model available to your API project with the required Responses API
and Structured Outputs capabilities. The key prompt is hidden; do not type the
key into a tracked file or directly into a shell command.

```zsh
(
  set -e
  audit_repo="$(git rev-parse --show-toplevel)"
  cd "$audit_repo"
  read -r 'audit_exam?Certification exam code (Core 2: 220-1202): '
  if ! printf '%s\n' "$audit_exam" | LC_ALL=C grep -Eq '^[A-Za-z0-9][A-Za-z0-9._-]*$'; then
    printf '%s\n' 'Stopped: enter an exam code containing only letters, digits, dots, underscores or hyphens.'
    exit 1
  fi
  audit_rubric="$audit_repo/tools/rubric-audit/data/rubric/$audit_exam.csv"
  if [ ! -f "$audit_rubric" ]; then
    printf 'Stopped: rubric not found: %s\n' "$audit_rubric"
    exit 1
  fi
  read -r 'audit_model?OpenAI API model name: '
  if [ -z "$audit_model" ]; then
    printf '%s\n' 'Stopped: the API model name is required.'
    exit 1
  fi
  read -rs 'OPENAI_API_KEY?OpenAI API key: '
  printf '\n'
  if [ -z "$OPENAI_API_KEY" ]; then
    printf '%s\n' 'Stopped: the API key is empty.'
    exit 1
  fi
  export OPENAI_API_KEY
  npm run audit:rubric:openai -- run \
    --repo "$audit_repo" \
    --rubric "$audit_rubric" \
    --out "$HOME/Study-Audits/comptia-openai/$audit_exam" \
    --exam "$audit_exam" \
    --model "$audit_model"
)
```

This sends selected study evidence to the OpenAI API and uses API credits. It
uses the real LangGraph engine. These shortcuts do not schedule API calls on
commit, push, build or website visits.

The exam code selects both the rubric and supported exam-tagged site material.
Only the Core 2 (`220-1202`) rubric has been supplied for this integration. Other
certifications require their own current, verified rubric CSV in the same schema
and content mapped to that exact exam code. Changing the code alone does not
create a rubric or establish that the adapter understands a different site's
content structure. See [README.md](README.md) for the CSV/evidence schemas and
the exact scanned scope.

The output must be outside the source checkout. If your checkout itself is
inside `$HOME/Study-Audits`, select a different `--out` location. Use one running
CLI process per output directory.

## Reassess after editing content

Run the same block after updating your notes, flashcards, questions or supported
visuals. Input changes receive a new analysis identity; identical accepted
requests can use the separate OpenAI cache. Each run prints the exact report
paths. No past Claude judgments are imported as OpenAI answers.

For Core 2, open the reports parent directory with:

```zsh
open "$HOME/Study-Audits/comptia-openai/220-1202/runs"
```

Each analysis directory includes `grades.csv`, `summary.csv`, `todo.csv`,
`inventory.csv`, `report.md`, `coverage.html` and a blinded reference-review sample.
Use `inventory.csv` to understand what was scanned. The heatmap and CSVs describe
coverage of the scanned material; they do not predict an exam score.

### Interrupted or incomplete work

For an interrupted execution, rerun with the same exam, model and settings and
append `--resume` to the assessment command. Resume requires the exact same
inputs/configuration. It is not needed for a normal new run after content changes.

Exit `0` means all rows resolved within the declared scope, `2` means a report
was produced with items needing review, and `1` means an input, dependency,
configuration or execution error. Resuming an already completed `needs_review`
execution returns its stored result; a new execution revalidates cached answers
and can continue the review workflow. Inspect the report rather than interpreting
unresolved rows as absent content.

### Additional uploaded material

Notes already ingested into supported site files are assessed with `--repo`.
Separate uploads need a faithful structured JSONL evidence export passed with
`--evidence`. Raw PDF, Word, image and text uploads are not automatically scanned.
Unexported labs/PBQs and dynamic content remain explicit scope limitations.

## Put the integration on GitHub

These steps continue Louis's existing installation and feature branch. Download
`openai-assessment-github-integration.zip` into Downloads and keep the ZIP file.
It contains only this runbook and `connect-repo.mjs`, both under the correct
`tools/rubric-audit-openai/` archive path. It supplements the installed package.
If the Core 2 rubric has not yet been restored, also put the supplied
`220-1202.csv` in Downloads.

### 1. Connect the installed tool

The block stops if you are on a different branch, have staged work, or have
existing edits to the two shared files it needs to update. It does not discard
any of that work. If there are existing edits, review them first; do not use a
reset to make the check pass.

```zsh
(
  set -e
  cd "$HOME/comptia-a-plus-review"
  if [ "$(git branch --show-current)" != 'feat/openai-rubric-assessment' ]; then
    printf '%s\n' 'Stopped: switch to your existing feat/openai-rubric-assessment branch first.'
    exit 1
  fi
  if ! git diff --cached --quiet; then
    printf '%s\n' 'Stopped: the staging area already contains changes. Review them first.'
    exit 1
  fi
  if ! git diff --quiet -- package.json README.md; then
    printf '%s\n' 'Stopped: package.json or README.md has existing edits. Review them first.'
    exit 1
  fi
  audit_rubric='tools/rubric-audit/data/rubric/220-1202.csv'
  if [ ! -f "$audit_rubric" ] && [ ! -f "$HOME/Downloads/220-1202.csv" ]; then
    printf '%s\n' 'Stopped: download the supplied 220-1202.csv into Downloads first.'
    exit 1
  fi
  unzip -n "$HOME/Downloads/openai-assessment-github-integration.zip" -d .
  node tools/rubric-audit-openai/connect-repo.mjs
  if [ ! -f "$audit_rubric" ]; then
    mkdir -p tools/rubric-audit/data/rubric
    cp -n "$HOME/Downloads/220-1202.csv" "$audit_rubric"
  fi
  tools/rubric-audit-openai/.venv/bin/python -c 'from pathlib import Path; from rubric_audit_openai.inputs import load_rubric; rows = load_rubric(Path("tools/rubric-audit/data/rubric/220-1202.csv"), "220-1202"); print(f"Core 2 rubric structure valid: {len(rows)} rows")'
  npm run audit:rubric:openai -- --help
  npm run test:rubric:openai
  git diff --check -- tools/rubric-audit-openai tools/rubric-audit/data/rubric/220-1202.csv package.json README.md
  git status --short --branch
)
```

The recovered rubric should print **795 rows**. This check validates structure
and exam identity; it does not compare wording with the official PDF. Continue
only after the command block succeeds and all 75 tests pass without skips.
If this block has already completed, it does not need to be repeated.

### 2. Stage and review the intended files

Run from the repository root. The selected paths include the individual shared
rubric CSV, not the whole legacy audit directory.

```zsh
(
  set -e
  if [ "$(git branch --show-current)" != 'feat/openai-rubric-assessment' ]; then
    printf '%s\n' 'Stopped: this is not the expected assessment branch.'
    exit 1
  fi
  if ! git diff --cached --quiet; then
    printf '%s\n' 'Stopped: review the existing staging area before adding files.'
    exit 1
  fi
  git add -- \
    tools/rubric-audit-openai \
    tools/rubric-audit/data/rubric/220-1202.csv \
    package.json README.md
  git diff --cached --check
  git diff --cached --stat
  git diff --cached --name-only
  git diff --cached -- package.json README.md
)
```

The review should show the assessment package, the rubric CSV if new, the three
npm aliases and a README link. No `.venv`, `.env`, API key, generated real audit
output, or site content should be present. Unrelated unstaged work remains
unstaged. If the two shared files gained unrelated edits after step 1, stage only
the intended hunks with `git add -p` instead of staging those entire files.

### 3. Commit, inspect the branch, and push

After reviewing the staged change, run:

```zsh
git commit -m "Add OpenAI LangGraph rubric assessment workflow"
git fetch origin
git log --oneline origin/main..HEAD
```

The log shows the branch commits that are not on current `origin/main`; a branch
push publishes this history as well as the new commit. If these are the intended
commits, run:

```zsh
git push -u origin feat/openai-rubric-assessment
```

Pushing makes the tool visible on that branch. Review a pull request separately
when it should be available from `main`:

https://github.com/LouisRodriguez12101815/comptia-a-plus-review/compare/main...feat/openai-rubric-assessment

Do not force a rejected push; inspect the remote changes before deciding how to
reconcile them. The integration script itself never commits or pushes.

## What is still to be measured

Software tests and synthetic reruns do not establish model grading accuracy.
Run the real assessment, inspect its extraction inventory and a few evidence
citations, then complete the blinded reference review and calculate agreement
with `score-review`. The package retains the original flat CSV output decision,
while keeping OpenAI judgments and checkpoints separate from the Claude audit.
