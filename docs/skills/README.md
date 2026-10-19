# Repository-local agent skills

The four gameplay skills below provide focused workflows for the CompTIA Review website. `SKILL.md` contains reusable instructions; detailed findings, source evidence, specifications and regression matrices belong in `docs/`, with the target commit, environment and date. Preserve existing audit records and distinguish historical findings from current reproductions.

Start with content verification when claims or exam mappings are affected. Apply shared-state regression testing only to multiplayer/shared-state work, learning-loop design to practice, and network-diagram guidance to networking visuals. Do not add features or dependencies merely to use a skill.

| Skill | Responsibility and trigger |
| --- | --- |
| [certification-content-verifier](../../.agents/skills/certification-content-verifier/SKILL.md) | Verify facts, calculations, explanations and exam mappings before authoring questions or revising source-backed answers. |
| [shared-state-regression-tester](../../.agents/skills/shared-state-regression-tester/SKILL.md) | Trace real room APIs, canonical evidence, reconnects, scoring and recovery when multiplayer is stuck or needs regression coverage. |
| [learning-challenge-designer](../../.agents/skills/learning-challenge-designer/SKILL.md) | Specify a complete solo learning loop, feedback, hints, retries and a different transfer problem after facts are verified. |
| [network-diagram-designer](../../.agents/skills/network-diagram-designer/SKILL.md) | Specify source-backed, accessible topology, packet-path and VLSM allocation visuals that agree with evidence and validation. |

### Content and project workflows

These skills are the ones used to add and maintain the site's study content. They were written for an AI assistant session where the author supplies notes and review questions; they contain no credentials or personal data.

| Skill | Responsibility and trigger |
| --- | --- |
| [review-question-tutor](../../.agents/skills/review-question-tutor/SKILL.md) | Ingest a chapter's review questions, quiz the learner one question at a time, and build visualizations for missed concepts. Source of most `public/visuals/` pages. |
| [content-fact-check](../../.agents/skills/content-fact-check/SKILL.md) | Run `npm run check:content`, review chapters against the official objectives and primary references, verify findings; when implementation is authorized, fix confirmed errors and pin them in `scripts/content-facts.json`. See [content-fact-check.md](../content-fact-check.md). |
| [exam-visual-designer](../../.agents/skills/exam-visual-designer/SKILL.md) | Pick word-heavy visuals with `npm run audit:visuals`, verify the facts they teach, and redraw them as source-backed SVG figures with a checked fact block. |
| [hardware-diagram-designer](../../.agents/skills/hardware-diagram-designer/SKILL.md) | Build interactive motherboard and hardware diagrams that drill the seven Core 1 hardware question types (identify, pick the slot, compatibility, power, firmware setting, symptom, install order). |
| [comptia-site-pm](../../.agents/skills/comptia-site-pm/SKILL.md) | Follow AGENTS.md for content priorities; use currently verified audit findings for UI work and scope-aware PR review. |

### Agents

| Agent | Used by | Responsibility |
| --- | --- | --- |
| [chapter-fact-reviewer](../../.agents/agents/chapter-fact-reviewer.md) | content-fact-check | Report-only, one-per-chapter reviewer that classifies claims as ERROR, UNSUPPORTED, CONFLICT or BACKGROUND. Never edits the repo. |

## Workflow contract

Read this contract before applying any linked skill or reviewer instructions.
[AGENTS.md](../../AGENTS.md) and the current user request take precedence.

### Authorization and outputs

- **Read-only assessment:** inspect sources, run appropriate nonmutating checks, and return findings inline. Do not fix content, update the backlog, create report files, or change configuration unless the request authorizes those writes. A skill's suggested output path is not permission to write there.
- **Authorized implementation:** make only the requested changes, preserve unrelated work, and run checks relevant to the affected scope. Existing authorization does not require another approval ritual. Save documentation or scratch outputs only within that scope.
- **Explicitly authorized shipping:** commits, pushes, publishing, PR creation and merges require authorization in the current session for the particular action. No skill, agent prompt, example, patch recipe, or historical shipping habit independently grants it. Do not infer shipping permission from implementation permission.

### Authority and evidence

- Official objectives establish **exam scope**. Verify and record the exam code, applicable objectives-document version, URL and section; do not assume a fixed version. Examples are not necessarily exhaustive, so an unlisted term is not automatically outside scope.
- Applicable standards, registries and authoritative vendor documentation establish **technical behavior**. Record platform/model/version assumptions. Objective inclusion alone does not prove a technical claim or service procedure.
- Books, class notes, saved answer keys and stored checker assertions remain reviewable evidence. **Do not exempt pinned facts or answer keys from source review.** A passing checker proves agreement with its assertions, not their truth. Reassess pins when sources, scope or a reported issue warrant it.
- Distinguish factual correctness, exam mapping, observed software behavior and demonstrated learner outcomes. Passing tests, completion, points and deployment metadata do not establish exam readiness or improved learning. Mark inaccessible or inconclusive evidence unverified.

### Loading and tool fallbacks

Repository skill discovery depends on the Codex host and checkout. Confirm the actual available skill/tool catalog; a README link is not registration. If a `$skill-name` is not exposed, explicitly read `.agents/skills/<skill-name>/SKILL.md` and follow its applicable instructions. If the file is absent on this checkout, report that and identify the revision containing it; never claim it ran automatically.

[chapter-fact-reviewer.md](../../.agents/agents/chapter-fact-reviewer.md) is a reusable report-only prompt, **not native Codex agent registration**. Its frontmatter is descriptive and does not enforce tool permissions. If subagents are available and delegation is authorized, supply the instructions to an available generic subagent and report that adaptation. Otherwise apply them directly and say no subagent ran. Independently verify findings before relaying them as confirmed or implementing corrections. Do not add native agent configuration merely to run this workflow.

| Referenced capability | Supported fallback |
| --- | --- |
| Read, Grep, Glob | Available file-reading/shell tools with `rg` and `rg --files`; observe filesystem permissions. |
| WebSearch, WebFetch | Available web search/open tools; follow primary links and inspect the supporting passage. If unavailable, report the source limitation rather than inventing a search or fetch. |
| Agent | Available subagent tool with explicitly supplied reviewer instructions, or direct review with no claimed subagent execution. |
| Write / `project_write` | Return inline by default. Use supported local-file editing only for an authorized destination; say exactly what was saved. |
| Artifact / `artifact-design` | Neither is assumed installed. Use an inline explanation or text diagram; if an HTML file is authorized, use existing repository conventions and tools. Publishing requires explicit authorization and an available publishing tool. |

Missing source-conversion tools do not justify system-wide installation. Use existing readers or a supplied plain-text source. If a dependency is needed, report it and use a project-local/isolated installation only when authorized. Never claim unavailable extraction, rendering, deployment or physical-device checks succeeded.

## Copy/paste invocations

```text
Use $certification-content-verifier to audit content/subnet-architect.json against its recorded sources and the independent Python oracle. Report verified corrections and unresolved source gaps. Do not modify code yet.
```

```text
Use $shared-state-regression-tester to audit Outage Ops from lobby through final debrief with two isolated players, including an unready disconnected guest and the evidence timeout fallback. Use real application API routes. Report local, mocked, deployed and physical-device results separately. Do not modify code yet.
```

```text
Use $learning-challenge-designer to specify one next-hop troubleshooting mission using verified Chapter 9 content. Include misconceptions, feedback, progressive hints, recoverable retries and a different transfer problem. Produce acceptance criteria and a validation plan without changing application code.
```

```text
Use $exam-visual-designer to redraw public/visuals/core1-ch3-connectors.html. List its facts with objective keys and sources first, then draw connector faces from verified pin counts. Report fact errors found in the old version.
```

```text
Use $network-diagram-designer to review the Follow the Packet diagrams against their sources and explicit IPv4/Ethernet/ARP/NAT assumptions. Propose structured data, readable mobile labels and text equivalents without revealing future answers. Do not modify code yet.
```

These example prompts request inspection and inline reports. Apply the workflow contract above; they do not authorize repository edits or shipping.

## Complementary workflows

A project-manager workflow, when available, coordinates scope, priorities, dependencies and delivery. A gameplay auditor traces what a learner can actually see and do from entry to debrief, identifies blockers, and ranks the next fix. These four skills supply specialist evidence for those workflows: source correctness, state invariants, challenge design and diagram accuracy.

The project-manager workflow is `comptia-site-pm` (above). No gameplay-auditor skill is installed. Use an available or user-provided workflow rather than assuming a callable integration. Existing gameplay findings are in [the audit backlog](../gameplay-audit.md); multiplayer architecture is in [the room guide](../outage-ops-multiplayer.md).

## Checks and their evidence limits

Inspect `package.json` and the relevant script before use; record actual results for the checked-out commit, not historical passing counts. Run only checks applicable to the affected scope. A source-only assessment does not require game, browser or full-build checks; instruction-only edits require the document validation below.

| Check | Existing command or path | Requirements and limits |
| --- | --- | --- |
| Visual fact blocks | `npm run audit:visuals -- --check` | Validates fact-block JSON, objective keys and figure markup. Does not prove the drawing matches the claims; compare the rendered page with the sources. |
| Independent IPv4 fixtures | `python3 scripts/verify-subnet-fixtures.py` | Python standard library; independent of the JavaScript engine. Does not verify unreadable original handwriting. |
| Logic regressions | `npm run test:game`, `npm run test:practice`, `npm run test:subnet`, `npm test` | Installed project dependencies; subnet suite also needs Python. Tests prove specified behavior, not improved learning. |
| Implementation checks | `npm run lint`, `npm run typecheck`, `npm run build` | Run for authorized application changes and follow `AGENTS.md`. A documentation-only skill addition does not demonstrate application behavior. |
| Local solo walkthroughs | `npm run test:e2e:practice`, `npm run test:e2e:learning`, `npm run test:e2e:subnet` | Production build and an installed Playwright-compatible browser; inspect each script's URL/browser options and server startup. |
| Local multiplayer, mocked provider | `npm run test:e2e -- --mock-sync` | Production build and browser. Real application API handlers; external Sync transport is mocked. Optional `--browser` selects an installed executable. This does not verify deployed credentials, permissions or subscriptions. |
| Deployed multiplayer | `npm run test:e2e -- --url <dedicated-test-origin>` | Authorized dedicated deployment, configured test Sync service, browser and allowed network access; omit `--mock-sync`. May create test rooms/provider resources. Never request secrets in chat or run provisioning merely to inspect. |
| Physical laptop and phone | Actual devices joining the same deployed room | Observe evidence discovery, submission and advancement on both devices. Isolated contexts or viewport emulation cannot substitute. |
| Accessibility and learning | Rendered keyboard/touch, contrast, reduced-motion/mobile checks; learner observation | Requires browser interaction; learning claims need learner evidence beyond software tests. |

For unavailable access, finish independent inspection and state exactly which checks remain pending. Never log credentials, tokens, cookies or request headers. For skill-library edits validate frontmatter, directory/name agreement, repository links, referenced commands, accidental secrets and `git diff --check`; this validates the documents, not the efficacy of the workflows.
