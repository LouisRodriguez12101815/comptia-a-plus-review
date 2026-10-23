# Add the OpenAI assessment section to the study repository

This guide is for macOS Terminal using zsh. It adds one tool folder, creates a new local branch from the branch you currently have checked out, and leaves all changes uncommitted. No command below commits, pushes, publishes, stashes, resets, or edits study content.

## Files

Download `openai-assessment-repo-files.zip` to your Mac's Downloads folder. Keep it as a ZIP. If Safari expands it automatically, retain or restore the downloaded ZIP before continuing.

This archive already contains the `tools/rubric-audit-openai/` path. Extract it at the repository root, not inside `tools/`, or you will create an extra nested `tools/` directory.

The archive includes Python source, tests, README, this guide, `.gitignore`, the interactive workflow, the evaluation protocol, and synthetic report examples. It does not include API credentials, a virtual environment, the official objectives PDF, the real rubric CSV, or real model judgments.

## 1. Open the intended local repository

In Terminal, type `cd ` with a trailing space, drag your local `comptia-a-plus-review` folder from Finder into Terminal, and press Return. Then run:

```zsh
git status --short --branch
git branch --show-current
git remote -v
```

Confirm this is the intended repository and content branch. The next step creates a branch from that current snapshot; it does not switch to `main` or an old audit commit. Existing local changes are retained. If the folder is not a Git checkout, open your actual checkout before proceeding.

## 2. Create the local assessment section

Run this entire block. The parentheses isolate its stop-on-error behavior from your interactive shell. It stops if the archive is missing, the destination already exists, or the new branch name already exists.

```zsh
(
  set -e
  audit_repo="$(git rev-parse --show-toplevel)"
  cd "$audit_repo"
  test -f content/topics.json
  test -f "$HOME/Downloads/openai-assessment-repo-files.zip"
  if [ -e tools/rubric-audit-openai ]; then
    printf '%s\n' 'Stopped: tools/rubric-audit-openai already exists. Nothing was overwritten.'
    exit 1
  fi
  git switch -c feat/openai-rubric-assessment
  unzip -n "$HOME/Downloads/openai-assessment-repo-files.zip" -d "$audit_repo"
  git status --short --branch
)
```

Run later steps only if this block succeeds. The destination is `tools/rubric-audit-openai/`. The old `tools/rubric-audit/` folder remains the source for the existing rubric CSV. The new folder's `.gitignore` excludes its environment, Python caches, build output, and local `.env` files.

The new branch is local. The section will not appear on GitHub until you separately choose to commit and push it. Those commands are deliberately outside this setup.

## 3. Create the Python environment and install dependencies

Run from the repository root. Python 3.11 or newer is required. If the version check fails, install or select a compatible Python, then repeat this step.

```zsh
(
  set -e
  audit_repo="$(git rev-parse --show-toplevel)"
  audit_tool="$audit_repo/tools/rubric-audit-openai"
  python3 -c 'import sys; assert sys.version_info >= (3, 11), "Python 3.11 or newer is required"'
  python3 -m venv "$audit_tool/.venv"
  "$audit_tool/.venv/bin/python" -m pip install -e "${audit_tool}[live]"
  "$audit_tool/.venv/bin/python" -m unittest discover -s "$audit_tool/tests" -v
)
```

The `[live]` extra installs LangGraph, its SQLite checkpointer, and the OpenAI SDK. The quoted `${audit_tool}[live]` form is intentional for zsh. The commands use the virtual environment's Python directly, so activation and any existing Conda environment do not affect which Python runs the assessment.

The implementation was previously checked with **75 tests discovered, 69 passed, and 6 skipped**. Those six tests require LangGraph. After installation, confirm that they execute successfully rather than treating a skipped runtime test as a pass. The real runtime has not yet been verified on your Mac.

## 4. Run the LangGraph example twice

These commands use synthetic answers and do not call the OpenAI API. Keep the output outside the source repository. If your repository itself is inside `$HOME/Study-Audits`, choose a different output location.

```zsh
(
  set -e
  audit_repo="$(git rev-parse --show-toplevel)"
  audit_python="$audit_repo/tools/rubric-audit-openai/.venv/bin/python"
  audit_output="$HOME/Study-Audits/comptia-openai"
  "$audit_python" -m rubric_audit_openai demo --engine langgraph --out "$audit_output/demo"
  "$audit_python" -m rubric_audit_openai demo --engine langgraph --out "$audit_output/demo"
)
```

The second execution should report `fixture_calls: 0`. Both should report `live_model_calls: 0`. These are software examples, not CompTIA coverage measurements. The tests compare cached rerun CSV bytes.

To inspect the workflow page on your Mac:

```zsh
open tools/rubric-audit-openai/docs/workflow.html
```

## 5. Identify the material being assessed

The real run reads the supported schemas in `content/`, mapped static visuals, and the declared source inventory. It checks the requested exam's content. Content not represented in those supported sources may require an explicit export.

The rubric is expected at:

`tools/rubric-audit/data/rubric/220-1202.csv`

Verify the file is present before making any model calls:

```zsh
test -f tools/rubric-audit/data/rubric/220-1202.csv && printf '%s\n' 'Core 2 rubric CSV found.'
```

If it is missing, stop before step 6 and obtain the verified CSV from your authorized audit checkout or bundle. Do not substitute the old judgment cache or guess the objectives. The new package validates CSV structure; it does not repeat the official PDF wording comparison.

### Uploaded notes

Creating this folder does not automatically scan files uploaded to ChatGPT. Use either of these paths:

- Notes already ingested into the site's supported content files are assessed by `--repo`.
- Separate notes can be supplied with `--evidence` as a structured JSONL export. A raw `.txt`, `.pdf`, Word file, or image is not accepted by that option.

Each JSONL line must identify its evidence, source type, source path, locator, and complete instructional text. See the README for the schema. Add `--evidence` only after the uploaded notes have been converted faithfully. When both `--repo` and `--evidence` are supplied, the export supplements the repository evidence. IDs must remain unique. The tool does not write the notes into the site.

## 6. Run the real OpenAI assessment

Proceed after the tests and graph example succeed and the intended rubric/content are available. This step sends selected study evidence to the OpenAI API and uses API credits. Select a model available to your API project that supports the required Responses API and Structured Outputs features. The package does not assume which model you have access to.

The following is for macOS zsh. The key prompt hides what you type and keeps the key value out of the pasted command. Type the key at the prompt; do not add it to a tracked file.

```zsh
(
  set -e
  audit_repo="$(git rev-parse --show-toplevel)"
  audit_python="$audit_repo/tools/rubric-audit-openai/.venv/bin/python"
  audit_output="$HOME/Study-Audits/comptia-openai"
  test -f "$audit_repo/tools/rubric-audit/data/rubric/220-1202.csv"
  read -rs 'OPENAI_API_KEY?OpenAI API key: '
  printf '\n'
  export OPENAI_API_KEY
  read -r 'audit_model?OpenAI API model name: '
  "$audit_python" -m rubric_audit_openai run \
    --repo "$audit_repo" \
    --rubric "$audit_repo/tools/rubric-audit/data/rubric/220-1202.csv" \
    --out "$audit_output/220-1202" \
    --exam 220-1202 \
    --model "$audit_model"
)
```

The key exists only in this subshell and its child process unless you already exported it elsewhere. The command uses the real LangGraph engine by default. For an interrupted execution, repeat the same command with `--resume` added and the exact same model/settings. A completed `needs_review` report uses a fresh execution when retried; resuming a completed execution only returns its stored final state.

Exit `0` means all rows are resolved within the declared scanned scope; exit `2` means the report needs review; exit `1` means an input, configuration, dependency, or execution error. Unresolved is not the same as absent. A completed run is not itself proof of grading accuracy.

## 7. Find the reports and review the local change

Results are written below `$HOME/Study-Audits/comptia-openai/220-1202/runs/`, one directory per analysis ID. The CLI prints the exact report paths.

```zsh
open "$HOME/Study-Audits/comptia-openai/220-1202/runs"
git status --short --branch
git status --short --untracked-files=all -- tools/rubric-audit-openai
```

The report folder contains `grades.csv`, `summary.csv`, `todo.csv`, `inventory.csv`, `report.md`, `coverage.html`, and the blinded-review sample. Open the intended run's `coverage.html` for the objective heatmap. Real coverage and judge agreement remain unmeasured until the corresponding real run and reference review have been completed.

The source tree remains uncommitted and unpublished after all of these steps. No root `package.json` or site navigation edit is required to use the assessment tool.
