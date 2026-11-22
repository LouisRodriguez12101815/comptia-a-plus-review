<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Standing rules

`.cursor/rules/standing-rules.mdc` points here. `docs/saa-roadmap.md` is the game plan. When a PR completes a queue item, update that file's queue and Done log in the same PR.

## STANDING RULES

### 1. No new cue

When you fix one giveaway, check you did not create another: strawman, odd-one-out, keyword echo, key-shortest, more than one defensible answer, true conditional distractor, or a question that names a category only the key belongs to. Report the counts.

### 2. Nothing outside the checks

New content goes through the audits. New tests are wired into checks with a guard. List every failing test, including pre-existing failures.

### 3. No silent deferrals

Anything split off goes under Deferred with its target PR. An item may be deferred only once.

### 4. Plausibility

Every choice names a real AWS service or feature from the same category. Every wrong choice is something a real candidate might pick that misses one stated requirement. Only the key meets all requirements. Include a self-check table.

### 5. End to end

Synced data must reach the payload and `/account/report`, using local dates.

### 6. Computed, not hand-set

Report counts, ceilings, and coverage from the audit and report commands.

### 7. Sourced and current

AWS limits and prices cite a current URL. Never fill a price from memory. Use `changedNote` where older material differs.

### 8. Stop at each open PR

Stop for `accepted #N` before the next PR. Merge only when asked, with a merge commit.

### 9. SAA only

New study work is SAA-C03. For A+ Core 1 (220-1201), A+ Core 2 (220-1202), or Network+ (N10-009) coverage questions, run `npm run report:objectives` and recommend gap 1 under "Gaps, heaviest domain first".

## REPORT FORMAT

Status. What changed. Verification, with the full CI list below. Content changes. Deferred. Open questions. Next step.

## CI-equivalent checks

After `npm ci`, run the same steps as `.github/workflows/checks.yml`:

1. `npm run lint`
2. `npx next typegen`
3. `npm run typecheck`
4. `npm run test:saa-tags`
5. `npm run test:saa-curriculum`
6. `npm run test:exam`
7. `npm run check:content`
8. `npm run audit:answer-cues -- --check`
9. `npm run test:answer-cue-gates`
10. `npm run test:standing-rules`
11. `npm test`

## Secrets and history

Never change `LEARNER_SESSION_SECRET`. It names the Sync map. A new value points to empty history.

No Vercel builds or deploys. No force-push. No secrets or learner records in the repo.
