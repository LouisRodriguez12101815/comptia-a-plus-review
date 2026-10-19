---
name: content-fact-check
description: "Fact-check chapters of the CompTIA review site: run the checker, review exam scope and technical claims against sources, independently verify findings, and report or implement only within the authorized scope."
---

# CompTIA Review Site: content fact-check

Before applying this workflow, read the [workflow contract](../../WORKFLOW.md) for authorization, source authority, explicit loading and tool fallbacks. Apply only sections relevant to the requested scope.

Use this for correctness review of one chapter or a bounded part of it. Content lives in `content/*.json` and `public/visuals/*.html`. Coordinate with `certification-content-verifier` for exam mappings, claim evidence and independent numerical checks; this workflow adds checker triage, optional reviewer delegation and regression pins rather than a competing authority policy.

## Authority and classification

Verify and record the exam code, applicable official objectives-document version, URL and section; do not assume a fixed version. Official objectives establish scope, and their examples are not necessarily exhaustive. Applicable standards, registries and authoritative vendor documentation establish technical behavior. Books, class notes, saved keys and checker assertions are reviewable evidence, not final authority. An objective's silence does not settle technical truth or exclude a related term from the exam.

Classify the claim separately from its exam mapping:

- **ERROR:** a confirmed technical contradiction under the stated conditions, wrong key, ambiguous distractor, or incorrect exam mapping. Identify which kind and cite the evidence; correction still requires implementation authorization.
- **UNSUPPORTED:** the evidence inspected does not substantiate the claim. This is not proof the claim is false; record missing or inaccessible sources.
- **CONFLICT:** relevant sources disagree and their applicability/version does not resolve the disagreement. Describe what needs checking; do not ask the author to choose technical truth when primary evidence settles it.
- **BACKGROUND:** correct material established as supplemental under the reviewed scope. Mere absence from an objectives list is insufficient for this label.
- Record missing/incomplete teaching separately as a **coverage omission**, not automatically a factual ERROR.

## Procedure

1. Establish assessment versus implementation scope. Run `npm run check:content` (optionally `-- --topic n10-ch7,n10-ch10`) and report the actual results. A pass proves agreement with assertions and internal consistency, not source truth. Do not skip pinned facts or answer keys in source review.
2. Load the applicable official objectives and primary references. Record version, URL, section and retrieval date. Use available web search/open tools, inspect supporting passages, and mark title-only or inaccessible evidence unverified. Never reproduce the official PDF or use exam dumps.
3. Read the actual notes, cards, questions with keyed choices/explanations, and relevant visual text. For visual files, the `visual-facts` block is the checkable claim list; `npm run audit:visuals -- --check` validates it, and `exam-visual-designer` or `hardware-diagram-designer` own any redraw. If needed and authorized, prepare chapter extracts in scratch storage, not application files. Use existing source readers; if RTF conversion is unavailable, request a readable source or report the limitation. Do not install packages system-wide. Project-local/isolated dependencies require authorization.
4. When useful and delegation is authorized, supply `.claude/agents/chapter-fact-reviewer.md` as instructions to an available report-only subagent. This Markdown is not native registration, and its metadata does not enforce permissions. Give the bounded scope, exam/version, absolute source/content paths, missing inputs, output mode and a search budget of about 10 or fewer. Otherwise review directly and say no subagent ran. Return inline in read-only mode; authorize any scratch report destination explicitly. Review pinned claims too.
5. Independently verify each proposed finding before presenting it as confirmed or implementing it. Read exact site text and source passages; for quiz keys print the prompt, all choices with the key marked, and explanation. Verify scope against objectives and technical behavior against applicable primary sources, not source-book letter positions. Reviewer output is model output; claim counts are estimates.
6. In an assessment, stop at findings and proposed actions. When implementation is authorized, correct only independently verified errors within scope. Preserve stable IDs and position-independent correctness; avoid fixed-position answer cues. Do not change mappings/statuses based on a quiz item alone; follow `AGENTS.md` for coverage maintenance and preserve global `reviewed` until a full review supports changing it.
7. Only when authorized, add or revise facts, forbidden contradictions and `answerKeys` in `scripts/content-facts.json` using the verified evidence. Document provenance in the decision report and demonstrate that the old error is caught using a scratch copy when relevant. Pins remain subject to future review; historical book-based labels in the data do not override primary evidence.
8. Run checks appropriate to the implementation: relevant content/logic regressions, lint, typecheck and build for application changes; rendered keyboard, contrast, overflow and axe checks for affected UI at 390 and 1000+ px in supported themes. Quiz-key changes need an actual answer/explanation walkthrough. A correct sitting shows software grading behavior, not learner mastery. Instruction-only changes need frontmatter/name/path/link/command consistency checks and `git diff --check`, not unrelated game or build checks.
9. Shipping is separate: do not commit, push, package patches, create a PR, publish, or merge unless the current session explicitly authorizes the action. Do not assume a patch-zip delivery habit or silently update the author's saved visuals.
10. Return a decision report inline, or save it only to an authorized destination. Separate Confirmed findings, Corrected (only if implemented), Unresolved conflicts, Unsupported claims, Background, Coverage omissions and Not verified. Cite the source/version and actual checks for each conclusion.

## Cautions

- Do not use destructive cleanup to prepare an assessment; inspect status and preserve unrelated work.
- Explanation-versus-key warnings are advisory. `answerKeys` guards stored choice text against regressions, not factual truth; both the key and its evidence remain reviewable.
- Check the current `package.json` and scripts before citing commands. No unavailable tool, agent, source read or test may be reported as executed.
- Report exam scope, technical correctness, software behavior and learner outcomes separately. A deployment status or passing checker does not establish readiness.
