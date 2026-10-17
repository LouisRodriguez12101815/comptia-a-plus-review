# Exam objective coverage dashboard

Implementation date: 2026-10-17. Branch: `feature/exam-objective-dashboard`.
Base: current main `25a4172` (includes merged PRs #60 and #61).

## Source and scope

`content/objectives.json` remains the authoritative objective, domain-weight, status,
and topic-mapping record. Its bytes, objective statuses, and global `reviewed: false`
are unchanged. No objective 5.4 teaching material was authored. No dependency added.

Read supplied `exam-objective-coverage-canvas.zip` → `exam-coverage.canvas.tsx`
and `python-class-catchup.zip` → `python-class-catchup.md`. The canvas supplies visual
direction: status summaries, stacked domain-count bars and an objective checklist.
Its obsolete embedded data, `cursor/canvas` imports, multiple hard-coded authoring
recommendations and claims that coverage implies safety to review were replaced
with authoritative matrix data, the existing Next.js architecture, the shared CLI
ranking and preliminary-coverage wording. A native disclosure makes the domain
chart compact on mobile; cards replace the wide checklist table.

The attached historical catch-up log is preserved at `docs/python-class-catchup.md`
with a new dashboard entry marked **built locally**. Prior PR and live-site claims
are historical source text, not newly verified results. Instructions inside the
references were treated as context, not authorization to ship or alter coursework
outside this task.

Applied repository workflow: certification-content-verifier, limited to coverage
semantics, source traceability and existing mapped-content counts. No certification
facts, answer keys or mappings were rewritten; the existing 5.3 source verification
remains in `docs/display-troubleshooting-reconciliation.md`. Learning-challenge,
network-diagram and shared-state workflows do not apply: no challenge, diagram,
multiplayer mechanic or state was changed. Read the installed Next.js Server and
Client Components guide before implementing this server/client boundary.

## Architecture and calculations

- `lib/objective-coverage.mjs` is a pure, framework-independent module. Both the CLI
  and dashboard use its counting, weighted-summary and gap-ranking operations.
  It has no imports, filesystem access or browser side effects.
- `lib/objective-coverage.d.mts` supplies TypeScript interfaces for that ES module.
  The shared runtime stays plain ESM so the existing plain-Node CLI needs no new
  loader or dependency. All new application components remain TypeScript/TSX.
- `scripts/objective-coverage.mjs` retains the Node filesystem adapter and report
  renderer. Its valid npm alias remains `report:objectives`, not `report`.
- `app/coverage/page.tsx` loads the repository JSON through the existing server-side
  content imports. Only computed rows, matrix metadata and topic titles cross into
  `CoverageDashboard.tsx` and its domain overview; the CLI filesystem adapter never enters browser imports.
- `/coverage` is statically rendered at build time, then filters locally. A content
  update needs a new build, as do the existing notes routes. There is no second
  coverage dataset and no browser fetch of mutable external data.
- A row key is `exam:objective`, never just the objective number. Matrix exam-code
  casing is preserved, including `n10-009`; search is case-insensitive.
- Counts refer to notes sections and individual practice items in mapped topics,
  not objective sub-bullets or learner performance. An item referencing multiple
  mapped topics is counted once per objective. A shared topic may support multiple
  objectives; do not sum these rows to claim unique site-wide item totals.
- Domain-weighted estimate: within each domain average covered=1, partial=0.5,
  missing=0, multiply by that domain's weight, sum, then round for display. These
  are preliminary planning estimates, not exam-readiness scores.
- Global gaps rank by descending domain weight, missing before partial, then exam
  code; equal keys keep source matrix order. This preserves the existing CLI order.
  Filtering never changes this recommendation or whole-exam summaries.
- Filters combine with AND. Search applies Unicode NFKC normalization, trim,
  lowercase and collapsed whitespace; every search token must occur in the
  combined exam-code/objective-ID/title text. Substring matches are intentional:
  `1.1` can also find `1.10`. Empty/whitespace search matches all rows.
- Domain bars share a count scale, use covered/partial/missing segments, and
  include text equivalents. Their lengths are objective counts, not domain weights.
- Native labeled selects, search input and button support keyboard controls and
  visible focus. Result totals use a polite live region. Status uses text as well
  as color. Responsive cards avoid a horizontally scrolling objective table.
- The Coverage navigation item and home entry expose the route. Coverage is global,
  so the per-track tool bar is omitted there and track tabs are not marked current.
  Other routes retain their existing navigation behavior.

## Existing display-package receipt

Derived from current mapped source records by the shared engine, rather than UI
constants: `220-1201:5.3`, covered, one topic `core1-display-troubleshooting`,
8 notes sections, 12 flashcards, 15 quiz scenarios, 1 guided lab, 0 mapped visuals.
The lab is `display-path-isolation`, with equipment and paper alternatives.
The display's prerequisite DVI visuals exist under another topic; they are not
silently counted toward this mapping. This change preserves that mapping.

The first regenerated global gap is `220-1201 5.4`: mobile-device troubleshooting,
missing, Hardware and network troubleshooting domain weight 28%. This is a content
planning recommendation; official sub-bullet and existing-content review remains
the next authoring task.

## Developer coursework: Python equivalents

These explanations belong here, not in the learner-facing study dashboard.

| TypeScript/JavaScript used here | Comparable Python idea |
| --- | --- |
| `rows.filter(predicate)` | `[row for row in rows if predicate(row)]` |
| `rows.map(transform)` | `[transform(row) for row in rows]` |
| `reduce` accumulating status credit | `sum(credit(row) for row in rows)` |
| `Set(topicIds)` | `set(topic_ids)` for membership checks |
| `` `${row.exam}:${row.id}` `` | `f'{row["exam"]}:{row["id"]}'` composite dictionary key |
| normalize/trim/lowercase/collapse whitespace | `" ".join(unicodedata.normalize("NFKC", text).strip().lower().split())` (similar for these search inputs) |
| stable sort comparator: weight/status/exam | `sorted(rows, key=lambda r: (-r["weight"], status_rank[r["status"]], r["exam"]))`; string collation may differ from JS `localeCompare` |
| props and `useState` in a Client Component | Passing function inputs plus retaining UI state between interactions; React manages rerendering |

A pure function computes from its arguments without reading files or changing them.
This makes the shared calculation easy to test with a small synthetic matrix. The
Node adapter resembles Python `json.load(open(path))`; the Next.js server page uses
build-time JSON imports instead. Neither file loading approach belongs in the
interactive browser component.

Small practice change: add a **Clear search** button that resets only `search`,
keeping the selected exam and status. Use a native button with a visible focus
state and extend the browser check to confirm the selections remain unchanged.

## Acceptance and validation

Acceptance: combine all three controls; handle empty and unmapped states; keep
repeated numbers across exams distinct; show mapped note links and live counts;
keep the global next gap independent of filters; agree with CLI ranking and
weighted estimates; preserve the matrix; render without horizontal page overflow
at desktop and mobile widths; work by keyboard.

Reproduction commands:

```sh
npm run test:objectives
npm run report:objectives
npm run check:content
npm test
npm run lint
npm run typecheck
NODE_USE_ENV_PROXY=1 npm run build
npm start -- --hostname 127.0.0.1 --port 3037
npm run test:e2e:objectives -- --url http://127.0.0.1:3037 --browser /usr/bin/chromium
git diff --check
```

The content checker alias is `check:content`; there is no `npm run check` alias.
The proxy flag is this managed environment's build setup, not an app requirement.
Actual results on the final working tree (2026-10-17):

| Check | Actual result |
| --- | --- |
| `npm run test:objectives` | 11 passed; also rerun within the final full suite |
| `npm run report:objectives` | Passed; 88 objective rows; 5.3 derives 8/12/15/1; first gap remains 220-1201 5.4 |
| Baseline report comparison | Every row count, status, topic mapping and the complete gap ranking match the pre-extraction report; only explanatory wording/header changed |
| `npm run check:content` | Passed: 0 errors, 25 existing warnings |
| `npm test` | 155 passed, 0 failed/skipped: game 95, practice 18, subnet 23, content 2, report 6, objectives 11; independent Python subnet fixtures included |
| `npm run lint` | Passed: 0 errors, 3 existing `@next/next/no-img-element` warnings |
| `npm run typecheck` | Passed |
| `NODE_USE_ENV_PROXY=1 npm run build` | Passed; `/coverage` statically prerendered |
| Production dashboard walkthrough | Passed at 1280, 390 and 320px; every exam/status combination, normalized search, no results, unmapped states, composite IDs, live counts, CLI agreement, global recommendation independence, keyboard controls and domain disclosure/counts |
| Mapped-note links | All 27 distinct mapped-note URLs returned HTTP 200; display notes opened and Coverage navigation returned correctly at each width |
| Accessibility and layout | Zero axe WCAG 2 A/AA and 2.1 A/AA violations with domain view expanded at all three widths; no dashboard page overflow in overview, expanded domain and filtered states; no browser page errors |
| Visual inspection | Inspected captured desktop overview/domain view and mobile filtered/domain views; readable labels, focus outlines, wrapped titles and count layouts |
| `git diff --check` | Passed |
| Preservation | No `content/` changes; matrix byte-for-byte identical to main; attached catch-up log preserved byte-for-byte as prefix of its updated record |

The first browser attempt exposed select accessible names that included option
text. Explicit `label`/`htmlFor` and control IDs fixed the issue, and the final
keyboard/browser checks passed. A temporary extracted `.tsx` canvas also caused
TS2307 for `cursor/canvas` during intermediate typecheck/build; it was archived as
`.tsx.txt` under ignored `work/`, not added to application code. Final typecheck
and build passed without adding that dependency or changing compiler exclusions.
The native-select walkthrough was corrected to use ArrowDown/Tab without opening
an extra popup with Enter.

## Remaining limits and separate backlog

- The 25 content warnings predate this dashboard: existing explanation/key wording,
  answer-position balance and two unpinned Network+ answers. Reproduce with
  `npm run check:content`. No question or key was changed in this work.
- Three existing image warnings are in `app/components/SectionBlocks.tsx`,
  `app/labs/[slug]/page.tsx` and `app/labs/page.tsx`. Reproduce with `npm run lint`.
  Those files were not changed.
- Browser checks use local production Chromium with viewport/touch emulation,
  not physical phones, other browser engines, deployed services or the public site.
  Automated accessibility checks do not replace assistive-technology user testing.
- The whole matrix remains preliminary. This dashboard displays existing statuses;
  it does not verify every official exam sub-bullet or establish learner readiness.
  Objective 5.4 verification and content authoring remain outside this change.
- Content changes appear after rebuild; no live content editing or synchronization
  service was added. The implementation phase ended without commits, PRs, pushes,
  merges or deployments; the subsequent review-preparation task authorizes a
  normal branch push and draft PR, with no merge.

Raw local logs and screenshots are under ignored `work/dashboard/`; the commands
above reproduce the receipt without relying on those artifacts.


## Review preparation — 2026-10-17

Reread `AGENTS.md`, reviewed all 15 scoped files and fetched main again. Main is
still `25a4172`, so no reconciliation or application-code change was required.
The matrix is byte-for-byte unchanged from main, including all statuses and global
`reviewed: false`. No unrelated changes are included. The optional Clear search
exercise remains documentation only, and objective 5.4 authoring is excluded.

The implementation validation receipt above applies to the reviewed application
code; the coverage tests, report, content checker and diff check were rerun during
review preparation. Publishing this branch as a draft PR is now authorized.
Preview results, if available, are reported separately in the PR; production
deployment and physical-device checks remain pending.
