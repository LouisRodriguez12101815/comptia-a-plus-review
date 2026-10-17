# Content fact-checking

Use the [workflow contract](skills/README.md#workflow-contract) for authorization, source authority and tool fallbacks. Read-only assessment returns findings without fixes or report-file writes; implementation and shipping each require the applicable user authorization. The three layers below complement independent source review.

## Layer 1: deterministic checks (this repo)

```
npm run check:content
npm run check:content -- --topic n10-ch7,n10-ch10
npm run check:content -- --json
npm run check:content -- --strict
```

`npm test` also runs `tests/content-check.test.mjs`, which fails on any error and checks that the checker still catches seeded mistakes.

What it checks:

- Quiz integrity: valid answer index, non-empty explanation, no repeated choices, known topic ids, duplicate ids and prompts, and a warning when an explanation never mentions the keyed answer.
- Answer-position balance per topic and minimum coverage (15 questions, 10 cards) for Network+ chapters.
- Visual files listed in `content/track-visuals.json` exist, and each "(Notes: ...)" description names a real section title.
- Author-confirmed facts in `scripts/content-facts.json`: `require` patterns the notes must still state, `forbid` patterns that must not appear in notes, cards, explanations or visuals (distractor choices are ignored), and `numeric` patterns whose captured numbers must be in an allowed list (for example every RIP administrative distance must be 120).
- Worked examples recomputed by the script: EUI-64 interface IDs, IPv4 class and private/public/APIPA type, route lookups with longest-prefix match, and subnet math (subnets, hosts per subnet, block size, subnet and broadcast addresses).

Errors fail the command. Warnings are advice on older content and do not fail unless `--strict` is passed.

The existing pinned/computed checks include Network+ chapters 7, 9, 10, and 11; inspect the current registry for exact scope. Extending it requires authorized implementation and source verification, not merely adding assertions.

## Layer 2: source-grounded review (skill)

The `content-fact-check` skill compares each claim on the site with the author's own source material (class notes, chapter highlights, available review-question answer keys). It reports claims the sources do not support, claims that contradict them, and site claims that exist only in a visual or card.

## Layer 3: external verification (skill, with web search)

Official objectives establish exam scope; verify and record the exam code, applicable objectives-document version, URL and section. Their examples are not necessarily exhaustive: an unlisted term is not automatically outside scope. Applicable standards, registries and authoritative vendor documentation establish technical behavior, with model/platform/version assumptions stated.

Books, class notes and saved answer keys remain reviewable evidence. A confirmed contradiction under the same conditions is an error; unresolved differences in source applicability are conflicts requiring further checking. Objective silence does not make technical truth a matter of author preference. Report findings in read-only mode; correct them only when implementation is authorized. Follow the [classification guidance](../.agents/skills/content-fact-check/SKILL.md#authority-and-classification).

## Keeping the facts file honest

- Do not exempt pinned facts or answer keys from source review. A passing run means the site agrees with stored assertions and is internally consistent; it does not prove those assertions true.
- When an authorized implementation verifies or corrects a claim, update the corresponding pin when relevant and record its source, section, date and assumptions in the decision report. Do not change pins merely to make checks pass.
- Book-based labels and historical source descriptions in `scripts/content-facts.json` describe provenance, not an authority rule that prevents reassessment against primary evidence.
- Separately report exam scope, technical correctness, observed software behavior and demonstrated learner outcomes. Passing checks do not establish exam readiness.

## Scope and compatibility

Use `certification-content-verifier` for exam/source verification and `content-fact-check` for checker triage, optional report-only delegation and regression protection. Explicitly load their actual instruction files if the host does not expose them as skills. The reviewer Markdown is a prompt, not native registration or a permission boundary; use an available generic subagent only when delegation is authorized, or review directly and say none ran. Independently verify its findings.

Use available readers/search tools and report inaccessible sources. Do not install conversion dependencies system-wide; use existing readers, supplied text or an authorized isolated environment. In assessment mode, return decisions inline. Save reports, update visuals, package patches, commit, push, publish or merge only when the current request authorizes the corresponding action.

Run checks for affected surfaces only: numerical or game checks for relevant logic, UI/browser checks for rendered changes, and frontmatter/name/path/link/command validation plus `git diff --check` for instruction-only edits. Do not report software, deployment or learner checks that did not run.
