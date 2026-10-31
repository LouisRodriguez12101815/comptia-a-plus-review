# Python class catch-up

Living record for Classes 2–7, Class 9 and Class 10. The app is the CompTIA practice games at https://comptia-a-plus-review.vercel.app. The course site is TypeScript, so each item stays in that language and the Python idea is named beside it.

Update this file in the same turn as any class change: planned, built, verified, or shipped. Status values are `not started`, `planned`, `built locally`, and `on the live site`.

## Pull requests

| Class | Pull request | Repo |
| --- | --- | --- |
| 2 | https://github.com/LouisRodriguez12101815/comptia-a-plus-review/pull/49 | Merged to main |
| 3 | https://github.com/LouisRodriguez12101815/comptia-a-plus-review/pull/50 | Merged to main |
| 4 | https://github.com/LouisRodriguez12101815/comptia-a-plus-review/pull/51 | Merged to main |
| 5 | https://github.com/LouisRodriguez12101815/comptia-a-plus-review/pull/53 | Merged to main |
| 6 | https://github.com/LouisRodriguez12101815/comptia-a-plus-review/pull/55 | Merged to main |
| 7 | https://github.com/LouisRodriguez12101815/comptia-a-plus-review/pull/56 | Merged to main |
| 9 | https://github.com/LouisRodriguez12101815/comptia-a-plus-review/pull/54 | Merged to main |

| Class | Topic | Status | Game surface | What the player gets |
| --- | --- | --- | --- | --- |
| 2 | Operators, comparisons | Merged to main | Computer Component Match and Follow the Packet debrief | Score math: clean rounds × 100 + hinted rounds × 75 |
| 3 | Strings | Merged to main | Subnet Architect typed answers | Typed text beside the trimmed, split address |
| 4 | Lists and tuples | Merged to main | VLSM Architect sort step | Index starting at 0, plus the first two items |
| 5 | Sets and dictionaries | Merged to main | VLSM Architect sort step | Unique usable counts, and A looked up by letter |
| 6 | Conditionals | Merged to main | Component Match and Follow the Packet | Readiness: clean finish, hinted finish, or not finished |
| 7 | Loops | Merged to main | Component Match and Follow the Packet debrief | A short walk of unaided rounds that skips hints and stops after 3 |
| 9 | Comprehensions and lambda | Merged to main | VLSM Architect sort step | Ranked requirements, and links only |
| 10 | Error handling and reliability | Built locally | Practice resume, practice progress line, VLSM Architect typed answers | Clear messages for unreadable saved progress and bad typed addresses, with no crashes |

The separate Python practice app from the slide decks (Days 2–7) still has no URL in the PDFs. This log covers the features inside the CompTIA games only.

## Class 2 — Operators and comparisons

Status: merged to main. https://github.com/LouisRodriguez12101815/comptia-a-plus-review/pull/49.

Branch `class-2-practice-score-math`. The score line is on main.

Requirement from the slides: one feature a player notices, using at least two Class 2 concepts, with a normal case, a boundary, and an unexpected input.

Where: `lib/practice/session.ts` counts finished rounds. `app/components/practice/ChallengePlayer.tsx` prints the line on the debrief. Both solo games share that debrief.

How:

- Comparison: a finished round with no hint is 100. A finished round with a hint is 75. An unfinished round is 0 and is not part of either count.
- Arithmetic: `fullAwards × 100 + hintedAwards × 75`. That sum is the score already shown.

What the player sees, only after the last round:

- One hint on Component Match: `Score math: 7 × 100 + 1 × 75 = 775`
- No hints: `Score math: 8 × 100 + 0 × 75 = 800`

Checked: practice session tests passed. A local play-through of Component Match confirmed both lines, on a wide window and a phone-width window. The line does not appear on the progress bar during a round. Follow the Packet uses the same debrief component and was not played end to end.

The pull request is merged. The public site was not rechecked after that merge. Say out loud what the comparison returns and what the expression adds up to.

## Class 3 — Strings

Status: merged to main. https://github.com/LouisRodriguez12101815/comptia-a-plus-review/pull/50.

Branch `class-3-typed-address-cleaning`. Main has this cleaning note and the Class 2 score line.

Requirement from the slides: one text feature using at least two string concepts. Tests: a normal value, a messy value, and an empty or very short value.

Where: Subnet Architect, Subnet Detective mask and address fields, and VLSM network, gateway, and peer fields. `lib/subnet/ipv4.ts` function `cleanedTypedText`. `app/components/subnet/SubnetGame.tsx` prints the note under those fields.

How:

- `trim()` removes spaces around the typed text. That is Python `strip()`.
- The cleaned text is split on `/` when a slash is present, otherwise on `.`. That is Python `split()`.
- The note is the formatted sentence. Grading still trims and parses on its own. A padded correct network address still passes.

What the player sees while typing a subnet mask:

- Messy: `You typed "  255.255.255.0 ". Compared as "255.255.255.0", split into 255 · 255 · 255 · 0.`
- Normal: the same split, with no extra spaces in the typed text.
- Short: `AB` stays `AB` as one piece.
- Empty: the note is hidden.

Checked: subnet engine tests passed, including a padded network address that still grades as correct. A local Subnet Detective run showed the messy, normal, short, and empty cases.

## Class 4 — Lists and tuples

Status: merged to main. https://github.com/LouisRodriguez12101815/comptia-a-plus-review/pull/51.

Branch `class-4-order-positions` in `/Users/louisrodriguez/comptia-a-plus-review-class4`, based on main after Classes 2 and 3 merged.

Requirement from the slides: one ordered-collection feature using at least two concepts. Tests: a normal collection, an empty collection, a one-item collection, and a short collection when slicing.

Where: VLSM Architect, “Sort requirements largest first.” `orderView` in `lib/subnet/grading.ts`. The line is under the list in `app/components/subnet/SubnetGame.tsx`.

How:

- Each requirement gets an index starting at 0. That is list indexing.
- First two is `slice(0, 2)`. In Python that is `[0:2]`, start included and end excluded.
- Up and Down swap two items in the list. The index line and the first two both change. `orderGrade` is untouched, so a largest-first order still passes and a reversed order still fails.

What the player sees:

- Before a move: `Indexes start at 0: 0 A, 1 B, 2 D, 3 C, 4 L2, 5 L3, 6 L1. First two: A, B.`
- After moving A down: `Indexes start at 0: 0 B, 1 A, 2 D, 3 C, 4 L2, 5 L3, 6 L1. First two: B, A.`

Checked: subnet engine tests passed for a full list, an empty list, a one-item list, and a swapped first pair. A local Architect Guided Practice run showed the line change after Move down. The numbered rows on screen still start at 1; the class line is the zero-based index.

## Class 5 — Sets and dictionaries

Status: merged to main. https://github.com/LouisRodriguez12101815/comptia-a-plus-review/pull/53.

Branch `class-5-unique-host-counts` in `/Users/louisrodriguez/comptia-a-plus-review-class5`. Main already had the Class 4 index line and the Class 9 ranked line. The merge keeps those and adds the unique-count line under them.

Requirement from the slides: one feature using at least two collection concepts. Tests: a key that exists, a missing key, a duplicate added to a set, membership true and false, and an empty collection.

Where: VLSM Architect, “Sort requirements largest first.” `requirementFacts` in `lib/subnet/grading.ts`. The line is under the list in `app/components/subnet/SubnetGame.tsx`.

How:

- Host counts go into a set. VLAN Exercise 6 has seven requirements and three links that each need 2 hosts, so the set keeps a single 2. That is set uniqueness.
- Requirements are stored by letter. `A` looks up 210. `Z` is absent. `L1` is a member. That is dictionary lookup and membership.
- Moving an item does not change the set or the lookup. `orderGrade` is untouched.

What the player sees, before and after a move:

`Unique usable counts: 210, 125, 95, 52, 2. A → 210 usable.`

Checked: subnet engine tests passed for the duplicate 2s, the A lookup, a missing letter, membership of L1, an empty plan, and a one-requirement plan. A local Architect Guided Practice run showed the line, then stayed the same after moving B down.

## Class 6 — Conditionals

Status: merged to main. https://github.com/LouisRodriguez12101815/comptia-a-plus-review/pull/55.

Branch `class-6-readiness` in `/Users/louisrodriguez/comptia-a-plus-review-class6`, based on main after Class 5 merged.

Requirement from the slides: one decision a player notices, using at least two concepts. Every branch is tested: true, false, a boundary, an empty or missing value, and a wrong type.

Where: Computer Component Match and Follow the Packet. `readinessLine` in `lib/practice/session.ts`. The sentence is on the progress card and again on the debrief, under the Class 2 score math, in `app/components/practice/ChallengePlayer.tsx`.

How:

- User action: finish rounds, or leave some unfinished.
- First true branch wins. That is Python `if` / `elif` / `else`.
- The clean branch is finished and the hint count is 0. That is `and`. Zero is a real count. `null`, `""`, and a number typed as text do not take that branch.
- Points stay `fullAwards × 100 + hintedAwards × 75`.

What the player sees:

- During the rounds: `Readiness: this run is not finished.`
- Debrief after one hint: `Readiness: finished with a hint.` Score math stays `7 × 100 + 1 × 75 = 775`.
- Debrief with no hints: `Readiness: finished with no hints.`

Checked: practice session tests passed, including one round short of the end, an exact finish, a count past the end, a missing count, an empty string, and a numeric string. A local play-through of Component Match showed the unfinished line, the hinted debrief on a wide window and a phone-width window, then a clean debrief. Follow the Packet showed the unfinished line and a clean debrief. Outage Ops was not changed.

One change to make yourself: in the hinted branch, include the hint count in the sentence.

## Class 7 — Loops

Status: merged to main. https://github.com/LouisRodriguez12101815/comptia-a-plus-review/pull/56.

Branch `class-7-short-walk` in `/Users/louisrodriguez/comptia-a-plus-review-class7`, based on main after Class 6 merged.

Requirement from the slides: a learning version of an existing list, using two loop ideas. Tests: empty, one item, many items, a skipped item, an early stop, and a loop that ends because its condition fails.

Where: Computer Component Match and Follow the Packet debrief, under the readiness sentence. `shortWalk` in `lib/practice/session.ts`. The full “Matched on first attempt without hints” list stays below it.

How:

- A `while` walks the finished rounds. The index increases every pass, so the condition that keeps it going eventually fails.
- A hinted round is skipped. That is `continue`.
- The walk stops after 3 unaided matches. That is `break`.
- Points, readiness, and the full match list are unchanged.

What the player sees after a hinted Component Match run:

`Short walk: 1 Identification · power, 2 Identification · storage, 3 Compatibility · memory. Skipped 1 hinted round. Stopped after 3 unaided matches.`

The working-memory round used the hint, so it is not in the walk. Compatibility · expansion and the later rounds remain in the full list.

A clean run lists the first three rounds and says `Skipped 0 hinted rounds.`

Checked: practice session tests passed for an empty list, one round, four rounds that stop after three, two skipped hints, and a walk that reaches the end. A local Component Match run showed the hinted walk on a wide window and a phone-width window, then the clean walk. Follow the Packet showed its own three unaided titles after one hint. Outage Ops was not changed.

One change to make yourself: stop the walk after 4 unaided matches instead of 3.

## Class 10 — Error handling and reliability

Status: built locally. Branch `class-10-error-handling`, based on main `094650a`. Not pushed, no pull request, not deployed.

Source: the recording named `Python Class 9.mp4`, which is actually Class 10. Best practices taken from it: validate expected problems with an `if`; use `try`/`except` only for the unpredictable and catch the specific error; never write a bare `except`; give the user a clear message and keep details for developers; return a normal result instead of crashing; test with one good baseline and change one thing at a time.

Where and how:

- **Saved practice progress.** `restoreSessionChecked` in `lib/practice/session.ts`. Nothing saved is an `if` case. Unreadable text is the one expected error (`SyntaxError`, caught by name). Anything else is logged with `console.error` and shown as a safe message. `restoreSession` still exists and returns the session or null. The player now says whether saved progress was unreadable (`savedUnreadable`), the browser would not let the site read storage (`storageUnavailable`), or there was simply nothing valid to resume (`noValidSession`).
- **Zero is normal.** `safePercent` replaces the inline accuracy line. Zero first attempts is checked with an `if` and shows “—”, never NaN and never an exception.
- **Typed addresses.** `validateTypedAddress` in `lib/subnet/grading.ts` returns `{ ok, value, errors }` and never throws. `addressProblem` in `lib/subnet/ipv4.ts` checks the expected problems (empty, wrong shape, octet above 255, leading zero, not text) without an exception. `address()` now throws `AddressFormatError`, a specific class. Unexpected errors are logged and shown as `fieldUnexpected`. The Subnet Detective steps use the validator, and the feedback text for bad input is the same as before.
- **Messages.** `savedUnreadable`, `storageUnavailable` and `fieldUnexpected` are in English, Spanish, French and Portuguese.

Checked: `tests/practice-error-handling.test.mjs` runs a baseline and then one change at a time (28 cases). Practice tests 84 of 84, subnet tests 24 of 24, content tests 2 of 2, TypeScript clean, lint 0 errors. The browser behaviour was not walked through, and the production build was not run.

One change to make yourself: add the same check to the Outage Ops saved-room load.

## Class 9 — Comprehensions and lambda

Status: merged to main. https://github.com/LouisRodriguez12101815/comptia-a-plus-review/pull/54.

Source notebook: https://colab.research.google.com/drive/1HjHBdH_KSoRAtdgVADwiDVsCZ31QQodE?usp=sharing

Branch `class-9-ranked-requirements`. On main, the sort step shows this ranked line with the Class 4 index line and the Class 5 unique-count line.

Where: VLSM Architect, “Sort requirements largest first.” `rankedRequirements` in `lib/subnet/grading.ts`. The line is under the index line in `app/components/subnet/SubnetGame.tsx`.

How:

- Requirements are copied, then sorted by usable count from high to low. A tie uses the letter, A to Z. That is `sorted` with a `lambda` key, and the original list stays in place.
- Links are the filtered kind. That is a list comprehension with a condition.
- Moving an item changes the index line and leaves this line alone. `orderGrade` is untouched.

What the player sees, before and after a move:

`Ranked by usable count: A 210, B 125, C 95, D 52, L1 2, L2 2, L3 2. Links only: L1, L2, L3.`

Checked: subnet engine tests passed for the VLAN 6 plan, an empty plan, a single LAN, and a score tie that sorts A before Z. A local Architect Guided Practice run showed the line, then kept it after a move while the index line changed.


## Dashboard integration — Classes 2–7 and 9

Status: **built locally**. Date: 17 Oct 2026. Branch:
`feature/exam-objective-dashboard`, based on main `25a4172` after PRs #60 and #61.
The implementation phase ended without a commit, new PR, merge, deployment or
live-site verification. Subsequent review preparation authorizes committing and
pushing this branch and opening a draft PR; status remains **built locally** until
any deployment has actually been verified. Production deployment and physical-device
checks remain pending.
The historical entries above were supplied in `python-class-catchup.zip` and
preserved; their earlier live-site and PR claims were not newly reverified.

Where: `/coverage`, linked from the site header and home. Interactive components
remain TypeScript/TSX in `app/coverage/`. The pure ESM module
`lib/objective-coverage.mjs` and its TypeScript declarations are shared with the
plain-Node CLI so the browser never imports the filesystem adapter.

What the user gets: combined exam/status/title-or-objective filters, current mapped
note links and practice counts, whole-exam summaries, a domain-count overview,
and the global next-content recommendation kept separate from filtered results.
`content/objectives.json` is authoritative; the supplied canvas is visual direction
only. Its old data, unsupported certainty about missing pages and `cursor/canvas`
imports were not copied. Every matrix status and global `reviewed: false` stays
unchanged. Objective 5.4 is the next gap; its teaching material was not authored.

Coursework connections (developer documentation only):

| Class | Dashboard operation | Python equivalent |
| --- | --- | --- |
| 2, operators | Domain-weighted status credit and count comparisons | Arithmetic and comparisons |
| 3, strings | NFKC normalization, trim, lowercase, collapsed whitespace, token search | `unicodedata.normalize`, `strip`, `lower`, `split`, `join` |
| 4, lists | Ordered objective rows, nonmutating ranked gaps | Lists and stable `sorted` |
| 5, sets/dictionaries | Unique mapped-topic membership and exam-plus-objective identity | `set` membership and composite dictionary keys |
| 6, conditionals | Combined filters, empty states, status credit | `and`, `if` / `elif` / `else` |
| 7, loops | Walk exams, domains and objectives to count mapped records | Nested `for` loops |
| 9, comprehensions/lambda | Filter/map, status summaries, multi-field ranking comparator | List comprehensions and `sorted(..., key=lambda ...)` |

Checked locally: all 11 coverage tests and all 155 full-suite tests passed, including
the independent Python subnet fixtures. Content checker: 0 errors, 25 existing
warnings. Lint: 0 errors, 3 existing image warnings. Typecheck and production build
passed. Production Chromium walkthrough at 1280, 390 and 320px passed combined
filters, whitespace/mixed-case searches, no results, unmapped rows, repeated
objective numbers, counts, CLI agreement, keyboard navigation, all 27 mapped-topic
URLs, zero axe violations and no dashboard overflow. The final rerun also passed
the canvas-inspired domain counts, its keyboard disclosure and expanded-view
accessibility at all three widths. Final details are in the developer guide below.
This is local viewport/touch emulation, not a physical-device or live-site claim.

Details and the final validation receipt:
[exam-objective-dashboard.md](exam-objective-dashboard.md).

One change to make yourself: add a **Clear search** button that clears only the
search input and keeps the selected exam and status. Extend the browser test to
assert that both selections remain unchanged. This practices Class 3 strings and
Class 6 decisions without changing objective data.
