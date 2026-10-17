---
name: content-fact-check
description: "Fact-check chapters of the CompTIA review site: run the repo checker, review each chapter against the official exam objectives and outside references, verify findings, fix confirmed errors, and report decisions."
---

# CompTIA Review Site: content fact-check

Use this when the author wants the site's content checked for correctness, for one chapter or several. The site is this Next.js repository. Content lives in `content/*.json` and `public/visuals/*.html`. The author ships work as patch zips: branch, `npm run dev`, commit, `git push --set-upstream`, Vercel preview, merge. Never suggest pushing to main. Give zsh-safe commands, run inside the repo, no inline `#` comments, no placeholders.

## Authority rule

Exam authority, in order:

1. The official CompTIA exam objectives for the exam the content targets. For Network+ this is N10-009 (Exam Objectives v4.0). For A+ use the 220-1201 and 220-1202 objectives. Check what the objectives require, and what they name explicitly, before judging a claim.
2. Standards and primary references the objectives point to: RFCs (for example RFC 1918, RFC 3927, RFC 2865/2866), IEEE standards, IANA registries, and vendor documentation.
3. The author's own book and class notes (supplied by the author for the session). These are source material, not the final authority. Where the book conflicts with the objectives or a primary reference, that is an ERROR in the book, and the site should follow the objectives and primary reference.

Where the site matches the book but an outside source differs, classify it as CONFLICT and ask the author to decide only when the objectives are silent. If the objectives or a primary reference settle the question, classify it as ERROR and fix it. Content the book includes that is not on the objectives (for example MAC/DAC models, Kerberos, PAP/CHAP) may stay as labeled background; it should not be presented as exam content.

## Three layers

1. Deterministic checks (no AI). `npm run check:content` (optionally `-- --topic n10-ch7,n10-ch10`). It checks quiz integrity, answer balance, visual note references, author-confirmed facts in `scripts/content-facts.json` (require, forbid, numeric), recomputed worked examples (EUI-64, IPv4 class and type, route lookups) and the verified answer-key registry (`answerKeys`, the exact text of each verified correct choice). `npm test` runs it. A pass means the site agrees with the facts file and itself. It does not prove the facts are true.
2. Objective-grounded review. Compare every claim with the official objectives first, then the author's sources (class notes and saved review-question answer keys), then primary references.
3. External verification. For checkable facts the objectives and sources do not settle, use web search and fetch official documents (CompTIA PDF, RFC text, IANA registries). Search results often return only page titles, so say "unverified" instead of guessing. Never fetch pages with curl, wget or python.

## Procedure

1. Run `npm run check:content` first and fix or report anything it finds.
2. Load the current official objectives for the exam in scope and keep a copy in the scratchpad. Do not rely on third-party summaries for objective wording.
3. Prepare inputs in the scratchpad, not the repo: convert the author's RTF sources to text (`pip install striprtf --break-system-packages`, then `rtf_to_text`), and write one site dump per chapter (notes sections with ids, flashcards with ids, quiz questions with the keyed choice marked and the explanation, and tag-stripped visual text).
4. Launch one reviewer agent per chapter in parallel (Agent tool; the brief is captured in `.agents/agents/chapter-fact-reviewer.md`, so use it as the agent definition or paste it as the prompt). Brief each with: the chapter id, the exam objective numbers for that chapter, absolute paths to the site dump, the source files and the visual HTML; the authority rule; the classification (ERROR contradicts the objectives, a primary reference, or is plainly wrong, including a wrong quiz key or an ambiguous distractor; UNSUPPORTED is not in the sources, the objectives or a primary reference, and not trivially true; CONFLICT matches the book but the objectives are silent and an outside source differs; BACKGROUND is correct but outside the objectives); an instruction to skip what the checker already pins; a cap of about 10 searches; and the output format: write the full report to a file and return only a table with severity (high means it would teach a wrong exam answer), type, where (section id, card id, question id or visual file), what the site says, evidence, and suggested action. Reviewers report only and never edit the repo.
5. Verify every ERROR yourself before relaying or fixing it. Reviewer output is model output. Read the exact site text and the exact source line, and for quiz keys print the question, the choices with the key marked, and the explanation. Confirm the key against the definition in the objectives or a primary reference, not against the book's wording alone. Reviewer counts of claims checked are estimates; say so.
6. Fix only verified ERRORs. Quiz re-keys must be checked against the objectives and primary references, not against letter positions in the source (the site's choice order differs). Keep the keyed positions balanced and avoid wording that depends on position.
7. Pin what you verified: add facts, forbidden contradictions and `answerKeys` to `scripts/content-facts.json` so the checker keeps them true, then prove the checker would have caught the bug by running it against the old content in a scratch copy.
8. Verify in a browser: lint, typecheck, build, axe on touched routes in both color schemes at 390 and 1000 px, and no horizontal overflow. For quiz changes, answer a sitting with the verified keys and expect 100 percent.
9. Ship as patches: content fixes in the first commit, tooling in the second, so each commit passes the checker. Give the author the apply commands. If the repo is not authorized for push in the session, say so and deliver `git format-patch origin/main..HEAD` files in a zip.
10. Save a decision report where the author keeps project notes (for example `review/fact-check-<date>.md`) with: Fixed, Needs your decision (CONFLICTs), Needs your confirmation (UNSUPPORTED), Background (kept but outside the objectives), Not verified. Update the author's saved copies of any changed visuals.

## Report format to the author

Lead with what was wrong and fixed, with counts. Then the few decisions that matter most, high severity first. Name the objective numbers and primary references each finding rests on. Be plain about limits: search results were title-only, a clean checker run is not proof of truth, and any objective wording was read from the version in scope (state which version).

## Cautions

- Do not run `git reset --hard` or `git clean` in a repo clone without checking `git status` first. Uncommitted work in the clone can be lost.
- The checker's explanation-versus-key heuristic is advisory and noisy. The `answerKeys` registry is the real guard.
- New questions in a pinned chapter show a warning until their answer is verified against the objectives or a primary reference and added to `answerKeys`.
- Exam versions change. Re-check objective numbers when the author changes exam codes (for example N10-007 to N10-009).
