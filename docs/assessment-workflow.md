<!-- Generated from assessment-workflow-guide.json. Run node scripts/render-assessment-workflow-doc.mjs. -->

# Assessment workflow

From video and seminar notes to reviewed study material—and an inspectable coverage assessment.

This contributor guide explains the tooling behind the CompTIA review site. Start with a source you can use, turn it into clear teaching, check the repository’s content, and compare the supported material with a versioned certification rubric. Each stage leaves something a person can review.

## Workflow

1. **Capture the source.** Keep notes, context, and questions together.
2. **Review the teaching.** Verify claims and write original study material.
3. **Update the knowledge base.** Use existing content files and run their checks.
4. **Assess and inspect.** Run the graph, review evidence, and measure agreement.

## Contents

- [What this workflow does](#scope)
- [Capture useful source notes](#capture-notes)
- [Review and write the teaching](#review-and-write)
- [Update the knowledge base](#knowledge-base)
- [Understand tools and access](#tools-and-access)
- [Start from a public repository](#fork-and-setup)
- [Configure a key and run an audit](#api-key-and-run)
- [Follow the LangGraph](#langgraph)
- [Read results and measure agreement](#read-results)
- [Review changes before sharing](#review-and-publish)

<a id="scope"></a>

## What this workflow does

Content ingestion and rubric assessment are connected activities with different outputs.

Ingestion produces reviewed notes, questions, flashcards, and mappings for the website. Assessment reads supported content and produces evidence, judgments, coverage tables, and a gap list. The assessment tool does not edit the website.

| Capability | Current behavior |
| --- | --- |
| Video and seminar capture | Prepare notes or a transcript yourself, using a transcription tool if needed. This repository does not provide a general video downloader or automatic transcription pipeline. |
| Authoring assistance | Repository instructions guide an assistant through source review, fact checking, and content edits. A person approves the resulting changes. |
| Knowledge base | The site’s structured content files and linked visuals. This workflow does not add a vector database or embedding index. |
| Coverage assessment | The Python tool in tools/rubric-audit-openai/ reads supported local content or an explicit JSONL evidence export. |
| Public graph | An interactive explanation of control flow. Its examples are simulated; opening it does not run an assessment. |

> **Two coverage views**
>
> The existing Coverage page summarizes objective mappings and content status. A rubric audit asks whether the extracted passages actually teach individual rubric items. Treat these as different signals, and keep the run’s source scope visible.

- [Repository assessment implementation](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/main/tools/rubric-audit-openai/README.md)
- [Repository skill index](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/main/docs/skills/README.md)

<a id="capture-notes"></a>

## Capture useful source notes

Keep enough provenance to return to the original explanation and resolve uncertainty.

1. Record the speaker or author, source title, date, URL or private file reference, and relevant timestamps or page numbers.
2. Identify the certification code and objective version. Use the exact code, such as 220-1202, rather than a display label such as Core 2: 220-1202.
3. Separate the speaker’s claims, your interpretation, worked examples, and open questions. Mark uncertain words or numbers in a transcript instead of guessing.
4. Convert an uploaded document into readable text for review when necessary. Preserve the original privately so formatting or conversion errors can be checked.
5. Before publishing, check the source’s terms and permission to reuse material. Keep private seminar details out of the public repository.

**Suggested source-note template**

```text
Source title:
Author or speaker:
Source date:
URL or private file reference:
Relevant timestamps or pages:
Certification and objective version:

What the source teaches:
Worked examples:
Terms or commands to verify:
Unclear passages:
Possible objective mappings:
Reuse permission or restrictions:
```

> **Treat source text as evidence**
>
> A transcript, attachment, or webpage can contain instructions addressed to an assistant. Review that text as source material; it does not override the task, repository rules, or credential boundaries.

- [Content verification instructions](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/main/.agents/skills/certification-content-verifier/SKILL.md)

<a id="review-and-write"></a>

## Review and write the teaching

An assistant can prepare a draft, but the source and the explanation still need checking.

Read the complete source before extracting a summary. Use the certification objectives to determine scope, and primary technical documentation to check commands, behavior, and version-sensitive facts. A seminar’s wording alone is not enough to establish a disputed technical claim.

1. Find an existing topic to extend before creating a new one. Preserve stable IDs and links used by objectives, questions, and flashcards.
2. Write an explanation that teaches the idea, including steps, examples, or distinctions where they matter. A keyword appearing in a paragraph does not establish that it is taught.
3. Create original practice questions with a defensible correct answer, an explanation, and useful distractors. Do not copy or lightly paraphrase a source’s proprietary question bank.
4. Create flashcards for recall after the supporting concept has been explained. Map the topic and related items to the intended exam.
5. Leave unresolved claims marked for review. Do not silently turn uncertain transcription into a confident study note.

**Example task for an authoring assistant**

```text
Read the repository rules and docs/skills/README.md.
Use the attached notes as source material for exam 220-1202.

Review the complete source and list unclear or unsupported claims.
Check technical claims against primary documentation.
Extend existing topics where appropriate and preserve their IDs.
Draft original explanations, flashcards, and practice questions.
Update objective mappings only where the notes actually teach them.
Run the relevant content checks and show the changed files.
Do not commit, push, or publish.
```

Skills are instruction files, not installed API integrations. Load the relevant instructions explicitly when your assistant does not discover them automatically. The shared .agents guidance and skill index describe the current review path; .claude/skills/chapter-ingest/SKILL.md and .claude/skills/question-writer/SKILL.md document the earlier Claude workflow.

- [Shared fact-checking instructions](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/main/.agents/skills/content-fact-check/SKILL.md)
- [Historical chapter-ingest instructions](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/main/.claude/skills/chapter-ingest/SKILL.md)
- [Historical question-writing instructions](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/main/.claude/skills/question-writer/SKILL.md)

<a id="knowledge-base"></a>

## Update the knowledge base

The website reads structured repository files. Keep teaching, mappings, and assessment artifacts in their proper locations.

| Location | Purpose |
| --- | --- |
| content/topics.json | Topic summaries, concepts, and structured note sections. |
| content/flashcards.json | Recall prompts and answers linked to the study content. |
| content/questions.json | Practice questions, correct answers, and explanations. |
| content/objectives.json | Objective status and links to topics. |
| content/track-visuals.json and public/visuals/ | Visual mappings and the published visual files. |
| tools/rubric-audit/data/rubric/ | Versioned rubric CSV inputs. Keep the official objectives text in tooling; do not paste the PDF into study pages. |
| tools/rubric-audit-openai/ | Assessment code, tests, and its own documentation. |
| A separate local output directory | Assessment evidence, responses, checkpoints, reports, and review sheets. |

**Content checks, from the repository root**

```sh
npm run check:content
npm run report:objectives
npm run test:content
npm run test:objectives
```

Review warnings as well as errors. The objective report helps prioritize mapped gaps; it is not a semantic assessment of every passage. Run the visual audit when changing visuals, and the application checks when changing the website.

**Visual and application checks, when relevant**

```sh
npm run audit:visuals -- --check
npm run lint
npm run typecheck
npm run build
```

- [Repository scripts and command aliases](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/main/package.json)
- [Content workflow instructions](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/main/.claude/WORKFLOW.md)

<a id="tools-and-access"></a>

## Understand tools and access

Repository access, written instructions, and model credentials serve separate purposes.

| Tool or credential | What it provides | What to check |
| --- | --- | --- |
| Git and a GitHub connection | A local checkout and, where authorized, access to repository files or changes. | Confirm the account, repository selection, and permissions. A connection does not automatically authorize publishing. |
| Repository skills | Written guidance for reviewing sources, editing content, and validating changes. | Check the skill index and load the relevant instructions. A skill file is not an API key. |
| OpenAI API key | Credentials used by the local assessment process to call the selected API model. | Keep the key private and available only where the assessment runs. |
| OpenAI Developers plugin, optional | OpenAI documentation and supported Platform setup assistance in a compatible assistant environment. | Install or connect it only if available to your account. Verify the project and where credentials are stored. |
| LangGraph | Python orchestration for stage transitions, grading batches, and checkpoints. | Install the assessment’s Python dependencies and test the graph locally. |

For a supported plugin environment, use its Plugins interface to find and install the integration, connect the requested account, and start a new conversation if required. The OpenAI Developers plugin is optional: a project API key configured directly in the local terminal is sufficient for this CLI. Installing a plugin in ChatGPT or Codex does not establish that your Mac terminal has the required environment variable.

If GitHub access is blocked because the repository is outside an integration’s allowed set, use the normal repository-access configuration or ask the account or organization owner to authorize it. A GitHub App’s installation scope and your own permissions both matter. Do not work around a sandbox’s Git proxy.

- [Plugin setup and capabilities](https://learn.chatgpt.com/docs/plugins)
- [OpenAI Developers plugin](https://developers.openai.com/learn/developers-codex-plugin)
- [Review GitHub App repository access](https://docs.github.com/en/apps/using-github-apps/reviewing-and-modifying-installed-github-apps)

<a id="fork-and-setup"></a>

## Start from a public repository

A fork gives a new contributor a separate repository. Existing maintainers can use a branch or worktree in their current checkout.

Use GitHub’s Fork action, then clone your fork, or use the GitHub CLI example below. Run it from a parent folder that does not already contain a comptia-a-plus-review directory. It assumes Git and the GitHub CLI are installed and the CLI is authenticated; sign in with gh auth login if needed.

**Optional first-time fork for a new contributor**

```sh
(
  set -e
  gh auth status
  gh repo fork LouisRodriguez12101815/comptia-a-plus-review --clone --remote
  cd comptia-a-plus-review
  git remote -v
  git switch -c content/my-study-notes
)
```

The fork block leaves your terminal in its original folder. After it succeeds, enter the newly cloned directory before running the setup commands below:

**Enter a newly cloned fork**

```sh
cd comptia-a-plus-review
```

Inspect the remotes: origin should be your fork and upstream should identify the source repository. If you already own or maintain this project, skip the fork. Work on a separate branch and review the diff before deciding whether to commit or publish.

> **Public visibility and reuse**
>
> Check the repository’s license and the permissions for third-party notes, recordings, images, and questions before redistributing them. GitHub’s ability to view and fork a public repository is not a blanket permission to reuse every included source.

For the site, follow the repository’s current Node.js setup and install its locked dependencies with npm ci. The assessment tool separately requires Python 3.11 or newer. The following commands run from the repository root and install the assessment in its own virtual environment.

**Install the assessment and run the fixture graph**

```sh
(
  set -e
  python3 -m venv tools/rubric-audit-openai/.venv
  tools/rubric-audit-openai/.venv/bin/python -m pip install -e './tools/rubric-audit-openai[live]'
  npm run test:rubric:openai
  npm run demo:rubric:openai -- --out "$HOME/Study-Audits/comptia-openai/demo"
  npm run demo:rubric:openai -- --out "$HOME/Study-Audits/comptia-openai/demo"
)
```

The demo uses a synthetic fixture and makes no model calls. Check that runtime integration tests actually ran rather than skipped. Its second execution should reuse accepted fixture answers and reproduce the deterministic CSV results. Fixture scores say nothing about CompTIA coverage.

- [Fork a repository](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/fork-a-repo)
- [GitHub CLI fork command](https://cli.github.com/manual/gh_repo_fork)
- [Repository licensing](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)
- [Assessment repository setup](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/main/tools/rubric-audit-openai/REPOSITORY_SETUP.md)

<a id="api-key-and-run"></a>

## Configure a key and run an audit

The key belongs to the local assessment process. Visitors reading this guide do not need one.

Create or select an API project key through the OpenAI Platform or supported setup tooling. Choose an explicit model available to that project that supports the Responses API and Structured Outputs. Review API usage and budget before a live run; grading, rechecks, and retries can make multiple requests.

> **Keep credentials out of the site**
>
> Never put a key in a public file, a commit, a screenshot, an uploaded transcript, or a NEXT_PUBLIC_ variable. Do not paste it into an assistant conversation. This page has no credential form. The SDK reads OPENAI_API_KEY from the environment of the process making the request.

Run this block in an interactive Bash or zsh terminal from the repository root. It fixes the exam code to 220-1202, prompts for the model, and reads the key without echoing it. If OPENAI_API_KEY is already configured, it is reused. The subshell keeps a newly entered key out of the parent shell after the command finishes. This command performs a live assessment.

**Live Core 2 audit**

```sh
(
  set -e
  audit_repo="$(pwd -P)"
  audit_exam='220-1202'
  test -f "$audit_repo/tools/rubric-audit/data/rubric/$audit_exam.csv"
  printf 'OpenAI model ID: '
  IFS= read -r audit_model
  test -n "$audit_model"
  if [ -z "${OPENAI_API_KEY:-}" ]; then
    printf 'OpenAI API key (hidden): '
    IFS= read -rs OPENAI_API_KEY
    printf '\n'
  fi
  test -n "$OPENAI_API_KEY"
  export OPENAI_API_KEY
  npm run audit:rubric:openai -- run \
    --repo "$audit_repo" \
    --rubric "$audit_repo/tools/rubric-audit/data/rubric/$audit_exam.csv" \
    --out "$HOME/Study-Audits/comptia-openai/$audit_exam" \
    --exam "$audit_exam" \
    --model "$audit_model"
)
```

Keep the output directory outside the checkout and use one assessment process per output directory. To recover an interrupted execution, repeat the same inputs, model, and settings with --resume. A resume requires the matching checkpoint; a changed corpus is a new assessment. Checkpointing cannot guarantee exactly-once billing if a process stops after an API request has been accepted.

For another certification, first supply and verify a rubric CSV in the supported schema, along with compatible evidence. Change the exam code, rubric path, and output directory together. Changing only the exam label does not adapt a new website schema or establish the rubric’s provenance.

- [OpenAI API authentication](https://developers.openai.com/api/reference/overview)
- [API quickstart](https://developers.openai.com/api/docs/quickstart)
- [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Assessment options and resume behavior](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/main/tools/rubric-audit-openai/README.md)

<a id="langgraph"></a>

## Follow the LangGraph

The graph coordinates the assessment. Deterministic Python functions still perform the data work.

| Stage | Work performed |
| --- | --- |
| Snapshot → extract → verify | Freeze supported evidence and source identity, import the rubric CSV, and check input structure. This is not PDF extraction or a word-for-word PDF comparison. |
| Prepare → grader batches | Build evidence requests, reuse valid cached answers, and send outstanding batches to the selected model. |
| Merge → recheck | Validate answer identities, grades, and quotations; plan blinded jobs for another preparation and grading pass. |
| Finish → conditional route | Return missing or rejected work to grading while attempts remain. Preserve semantic disagreements and exhausted work for review. |
| Evaluate → report | Write deterministic CSVs, a report, a scope inventory, a heatmap, and a blinded review sample. |

LangGraph supplies control flow, batch fan-out, and checkpointing. The default run engine uses the real graph and a SQLite checkpointer. The separate reference executor is a sequential implementation for testing the same stages; it does not provide graph checkpointing.

The default recheck considers both positive and negative labels. It is not shown the first pass’s labels. A disagreement stays visible for review instead of automatically choosing the higher score. Missing or rejected responses retry within the configured global attempt budget; the loop is bounded.

> **What the explorer shows**
>
> The linked graph offers normal, retry, and exhausted-budget walkthroughs. The highlighted route is simulated. It does not read the repository, call OpenAI, display your current checkpoint, or publish results.

- [Open the interactive LangGraph](../public/guides/assessment-workflow/langgraph.html)
- [Graph implementation](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/main/tools/rubric-audit-openai/rubric_audit_openai/graph.py)
- [LangGraph Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)
- [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence)

<a id="read-results"></a>

## Read results and measure agreement

A completed run establishes processed work within a stated scope. Review the evidence before treating a score as a teaching-quality claim.

| Output | How to use it |
| --- | --- |
| inventory.csv | Read first: see which sources were scanned, partial, missing, or require export. |
| grades.csv and summary.csv | Inspect item-level decisions and objective coverage, including unresolved work. |
| todo.csv | Prioritize teaching gaps and items that need review. |
| report.md and coverage.html | Read the run’s interpretation and explore its offline heatmap. |
| validation/blinded-review.csv | Independently label the frozen sample without seeing model predictions. |
| Requests, responses, rejected records, and checkpoints | Inspect provenance or diagnose problems locally; they are not public site assets. |

Grades distinguish taught (1), mentioned (0.5), and absent (0), with separate notes-only and all-scanned-material views. Unresolved rows remain in the denominator and contribute to lower and upper coverage bounds. Those bounds are not statistical confidence intervals or an estimate of your exam score.

Every positive model label needs an accepted evidence identifier and an exact quotation. Validation checks structure and traceability, but a real quotation can still be misinterpreted. Complete the blinded sample—up to 40 resolved notes-grade leaf items—against the underlying notes, then use the score-review command described in the evaluation protocol.

Report the sample size, exact agreement, uncertainty interval, and directions of disagreement. A second model’s labels measure model-to-model agreement. They do not independently establish the first model’s error rate. An unreviewed or unfinished sample is not a measured accuracy result.

- Retrieval uses mappings and lexical overlap, with optional aliases; it has no embedding search and can miss synonyms.
- Static visuals can be partially extracted. Dynamic drills, labs, and PBQs need explicit structured exports to count as evidence.
- An uploaded PDF or video is not automatically understood by the assessment CLI. The --evidence option expects schema-valid JSONL, not an arbitrary document.
- Some objective bullets are illustrative examples. The reporting weights are an explicit convention, not official per-bullet exam probabilities.
- Software tests and fixture scores do not establish the grader’s semantic accuracy or a learner’s exam readiness.

- [Blinded review and scoring protocol](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/main/tools/rubric-audit-openai/docs/evaluation-protocol.md)
- [Evidence schema and reporting rules](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/main/tools/rubric-audit-openai/README.md)

<a id="review-and-publish"></a>

## Review changes before sharing

Keep content authoring, assessment output, and publication as deliberate steps.

1. Review the source notes and verify that the edited teaching matches the intended certification version.
2. Inspect the content diff, stable IDs, objective mappings, and relevant check results.
3. Review the audit’s source inventory, unresolved items, and cited evidence. Record whether independent reference review has been completed.
4. Remove private source material and credentials from anything you intend to share. Keep raw assessment outputs outside public/.
5. Preview the website and decide explicitly whether to commit, open a pull request, merge, or publish. Running an audit does not authorize any of those actions.

A future version could add an upload queue, transcription adapters, provenance records in the content schema, or a protected page for selected audit results. Those features are not part of this guide. The current workflow uses prepared notes, reviewed repository edits, and a separately invoked local assessment.

> **Keep this guide current**
>
> The site article reads docs/assessment-workflow-guide.json. After changing the guidance, run node scripts/render-assessment-workflow-doc.mjs to regenerate the companion Markdown document. The public graph has its own self-contained HTML file.

- [Project repository](https://github.com/LouisRodriguez12101815/comptia-a-plus-review)
- [Guide content](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/main/docs/assessment-workflow-guide.json)

## Sources and implementation

- [Repository and assessment source](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/main/tools/rubric-audit-openai/README.md) — Implementation inspected at main commit 9c3547eaeb279703db40e8a7a2e69defc9ba13be. Runtime and command details should be checked against the checkout being used.
- [Repository skill index](https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/main/docs/skills/README.md) — The starting point for shared content-review and authoring instructions.
- [OpenAI API authentication](https://developers.openai.com/api/reference/overview) — API keys are private credentials. Keep them out of client-side code and public assets.
- [Plugin documentation](https://learn.chatgpt.com/docs/plugins) — Installation, connections, skills, and tool capabilities vary with the available environment.
- [OpenAI Developers plugin](https://developers.openai.com/learn/developers-codex-plugin) — Optional documentation and supported Platform setup assistance.
- [GitHub fork documentation](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/fork-a-repo) — Fork creation and the relationship between a fork and its upstream repository.
- [GitHub App repository access](https://docs.github.com/en/apps/using-github-apps/reviewing-and-modifying-installed-github-apps) — Use normal account or organization controls to review an integration’s repository access.
- [LangGraph Graph API and persistence](https://docs.langchain.com/oss/python/langgraph/persistence) — Checkpoint and state concepts; the repository implementation defines this particular workflow.
