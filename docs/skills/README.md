# Repository-local agent skills

The four gameplay skills below provide focused workflows for the CompTIA Review website. `SKILL.md` contains reusable instructions; detailed findings, source evidence, specifications and regression matrices belong in `docs/`, with the target commit, environment and date. Preserve existing audit records and distinguish historical findings from current reproductions.

Start with **content verification and shared-state regression testing**: correct answer keys and possible progression are prerequisites for new mechanics. Then design a bounded learning loop and the diagrams needed to support it.

| Skill | Responsibility and trigger |
| --- | --- |
| [certification-content-verifier](../../.agents/skills/certification-content-verifier/SKILL.md) | Verify facts, calculations, explanations and exam mappings before authoring questions or revising source-backed answers. |
| [shared-state-regression-tester](../../.agents/skills/shared-state-regression-tester/SKILL.md) | Trace real room APIs, canonical evidence, reconnects, scoring and recovery when multiplayer is stuck or needs regression coverage. |
| [learning-challenge-designer](../../.agents/skills/learning-challenge-designer/SKILL.md) | Specify a complete solo learning loop, feedback, hints, retries and a different transfer problem after facts are verified. |
| [network-diagram-designer](../../.agents/skills/network-diagram-designer/SKILL.md) | Specify source-backed, accessible topology, packet-path and VLSM allocation visuals that agree with evidence and validation. |

### Content and project workflows

These three skills are the ones used to add and maintain the site's study content. They were written for an AI assistant session where the author supplies notes and review questions; they contain no credentials or personal data.

| Skill | Responsibility and trigger |
| --- | --- |
| [review-question-tutor](../../.agents/skills/review-question-tutor/SKILL.md) | Ingest a chapter's review questions, quiz the learner one question at a time, and build visualizations for missed concepts. Source of most `public/visuals/` pages. |
| [content-fact-check](../../.agents/skills/content-fact-check/SKILL.md) | Run `npm run check:content`, review chapters against the official objectives and primary references, verify findings, fix confirmed errors and pin them in `scripts/content-facts.json`. See [content-fact-check.md](../content-fact-check.md). |
| [comptia-site-pm](../../.agents/skills/comptia-site-pm/SKILL.md) | Pick the next item to build from the UI/UX audit backlog, and score pull requests against accessibility gates and audit alignment. |

### Agents

| Agent | Used by | Responsibility |
| --- | --- | --- |
| [chapter-fact-reviewer](../../.agents/agents/chapter-fact-reviewer.md) | content-fact-check | Report-only, one-per-chapter reviewer that classifies claims as ERROR, UNSUPPORTED, CONFLICT or BACKGROUND. Never edits the repo. |

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
Use $network-diagram-designer to review the Follow the Packet diagrams against their sources and explicit IPv4/Ethernet/ARP/NAT assumptions. Propose structured data, readable mobile labels and text equivalents without revealing future answers. Do not modify code yet.
```

These examples authorize inspection and reports. When implementation is requested, a skill may implement within that scope and run appropriate checks; it must not add unnecessary approval steps. No skill authorizes merging, unrelated application changes, new tracking integrations or exposing secrets.

## Complementary workflows

A project-manager workflow, when available, coordinates scope, priorities, dependencies and delivery. A gameplay auditor traces what a learner can actually see and do from entry to debrief, identifies blockers, and ranks the next fix. These four skills supply specialist evidence for those workflows: source correctness, state invariants, challenge design and diagram accuracy.

The project-manager workflow is `comptia-site-pm` (above). No gameplay-auditor skill is installed. Use an available or user-provided workflow rather than assuming a callable integration. Existing gameplay findings are in [the audit backlog](../gameplay-audit.md); multiplayer architecture is in [the room guide](../outage-ops-multiplayer.md).

## Checks and their evidence limits

Inspect `package.json` and the relevant script before use; record actual results for the checked-out commit, not historical passing counts.

| Check | Existing command or path | Requirements and limits |
| --- | --- | --- |
| Independent IPv4 fixtures | `python3 scripts/verify-subnet-fixtures.py` | Python standard library; independent of the JavaScript engine. Does not verify unreadable original handwriting. |
| Logic regressions | `npm run test:game`, `npm run test:practice`, `npm run test:subnet`, `npm test` | Installed project dependencies; subnet suite also needs Python. Tests prove specified behavior, not improved learning. |
| Implementation checks | `npm run lint`, `npm run typecheck`, `npm run build` | Run for authorized application changes and follow `AGENTS.md`. A documentation-only skill addition does not demonstrate application behavior. |
| Local solo walkthroughs | `npm run test:e2e:practice`, `npm run test:e2e:learning`, `npm run test:e2e:subnet` | Production build and an installed Playwright-compatible browser; inspect each script's URL/browser options and server startup. |
| Local multiplayer, mocked provider | `npm run test:e2e -- --mock-sync` | Production build and browser. Real application API handlers; external Sync transport is mocked. Optional `--browser` selects an installed executable. This does not verify deployed credentials, permissions or subscriptions. |
| Deployed multiplayer | `npm run test:e2e -- --url <dedicated-test-origin>` | Authorized dedicated deployment, configured test Sync service, browser and allowed network access; omit `--mock-sync`. May create test rooms/provider resources. Never request secrets in chat or run provisioning merely to inspect. |
| Physical laptop and phone | Actual devices joining the same deployed room | Observe evidence discovery, submission and advancement on both devices. Isolated contexts or viewport emulation cannot substitute. |
| Accessibility and learning | Rendered keyboard/touch, contrast, reduced-motion/mobile checks; learner observation | Requires browser interaction; learning claims need learner evidence beyond software tests. |

For unavailable access, finish independent inspection and state exactly which checks remain pending. Never log credentials, tokens, cookies or request headers. For skill-library edits validate frontmatter, directory/name agreement, repository links, referenced commands, accidental secrets and `git diff --check`; this validates the documents, not the efficacy of the workflows.
