# Core 2 assessment and study-tool integration

The supplied 50-item assessment had been reviewed but was not in the site. Existing Core 2 chapters had uneven tool discovery, the hardening chapter had no visual set, and shared review pages lacked visual/practice links. This change adds corrected original practice and a visible learning map without marking the seven next chapter objectives complete.

## Scope and source handling

- Source: the user-supplied front-of-book RTF assessment. Original reference numbers 1–50 are retained in `content/core2-assessment.json`; source wording and book answer explanations are not republished.
- Certification scope: CompTIA 220-1202 V15 objectives document v4.0, checked October 23, 2026. The legacy global objective registry still records its previous source version; this assessment does not claim to reconcile every curriculum subskill against v4.0.
- Items 1–49 receive Core 2 question/objective tags. Item 50 is explicitly supplemental Core 1 storage (220-1201 3.6), with its own card, recall practice and parity visual. It cannot enter a Core 2 mock.
- Misleading source items were rewritten: ChromeOS offline use, source code versus compiled output, alternative Windows IP-setting paths, ext4 allocation, macOS update location, recursive name/content search, BitLocker/EFS scope, OneDrive configuration, Task Manager GPU support, RDP transports, contextual ESD/PPE, AI validation, ticket-intake assumptions and backout terminology.
- The source register distinguishes official exam scope from technical vendor references. GNU/manual fetches were intermittently unavailable; command behavior was also checked on disposable local fixtures. Windows/macOS device execution is not claimed. Hardware/safety diagrams are conceptual, not installation instructions.

## Delivered learning resources

- 50 original question variants and 50 retrieval cards: 49 Core 2 plus one supplemental Core 1 item.
- Six Core 2 assessment-note topics with corrected explanations, misconceptions and changed-condition exercises.
- Seven recall decks: six Core 2 decks and one supplemental Core 1 RAID deck. There are 51 recall items because the RAID deck includes an additional transfer prompt. These reuse the existing shuffled-choice, feedback, missed-item requeue and retry loop.
- Eight standalone interactive SVG workshops: six assessment groups, one supplemental RAID visual and one hardening/mobile/disposal workshop. Together they have 53 selectable states (including three hardening states).
- Every assessment item is traceable to a question, card, note, recall item and visual state through the manifest and `docs/core2-assessment-mapping.csv`.
- `/core2/review-tools` links the complete 50-item map and the tools for all 16 current Core 2 topics, including shared weak-area/reference material. `content/core2-learning-map.json` makes those links testable. This is **topic-level tool availability**, not proof that each legacy paragraph or official subskill has independent assessment coverage.
- Chapter strips expose recall practice and link back to available notes. The Core 2 workspace links to the assessment/tools index. New navigation/deck controls have labels in English, Spanish, French and Portuguese; source study facts follow the site's English-content convention.

## Existing contradictions corrected

Windows Home supports Microsoft accounts; eligible Home devices can support Device Encryption. Home is not categorically excluded from Insider preview participation. Retired Windows 10 update-channel labels no longer define Windows 11 servicing. Conventional RAID 5 does not universally become unusable during rebuild. Antimalware intelligence should remain current through supported automatic updates and policy rather than a universal once-daily rule. The duplicate notes/cards/questions/overview visuals directly affected by these claims were updated.

## Routing prerequisite

The local production build reproduced a self-redirect on unprefixed English pages: `/core2/review-tools` returned a 307 redirect to itself. French/Spanish routes returned 200. The installed Next.js `skipProxyUrlNormalize` guide explains that Next.js otherwise normalizes Proxy requests and rewrite destinations. Enabling this supported flag lets next-intl own the locale rewrite, resolving the loop while retaining the intended single `/en/...` → unprefixed English redirect. This change is verified by real HTTP responses and browser navigation, not a source-text assertion.

## Git integration before deployment

At inspection, main was `f6a8173` (the #92 framework merge). PRs #93–#98 were closed/merged into their feature-branch bases after #92 reached main; the complete reviewed AWS stack was therefore not on main. This branch includes validated AWS head `9230440` and merges the latest inspected main into it before adding Core 2 work. The deployment-preparation PR against main intentionally includes the previously reviewed AWS rollout as well as this new Core 2 change. No historical commits were rewritten, and no merge or deployment is authorized by the PR itself.

## Next chapter content — deliberately queued

1. 1.8 — macOS features, tools, security, updates and recovery.
2. 1.9 — Linux desktop tools, commands, permissions, packages and troubleshooting.
3. 1.10 — application installation, requirements, compatibility and validation.
4. 1.11 — cloud productivity, accounts, synchronization, sharing and recovery.
5. 2.10 — SOHO wired/wireless security configuration.
6. 2.11 — browser security, privacy, certificates and extensions.
7. 3.3 — mobile OS/application security troubleshooting.

Assessment fragments do not replace those chapters. The existing missing/partial statuses remain unchanged. Each next chapter should add mapped teaching, varied original scenarios, a recall deck, a mechanism-focused visual and a practical/PBQ-style exercise with observable validation and recovery steps.

## Validation

- `npm run lint`: passed with four pre-existing warnings in unrelated image/multiplayer code.
- `npm run typecheck`: passed after moving aside stale generated `.next` files containing duplicate declaration copies.
- `npm test`: passed using the bundled modern Python runtime on PATH; includes six new assessment/tool-mapping regressions, existing practice/game suites and AWS regressions.
- `npm run check:content`: passed with warnings; passing checks do not establish factual truth or exam readiness.
- `npm run report:objectives`: ran before and after; queued objective statuses were preserved.
- `npm run audit:visuals -- --check`: 41 fact blocks checked, zero problems.
- `npm run build`: default production compilation, TypeScript and static generation passed.
- Real local browser: expanded the 50-item map; counted 16 topic cards; opened all 53 new visual states; checked SVG/choice rendering and no captured console errors; exercised incorrect answers, hints, retry, two-answer grading and transfer reveal; navigated from notes to a topic-filtered quiz and checked shuffled answer submission; started a memory drill with Enter and verified wrong-answer explanation/requeue behavior.
- Representative viewport checks: 390 px and 1280 px, no horizontal document overflow in the inspected views. Mobile diagrams use a labeled, focusable scroll region to preserve readable diagram labels. Dark-theme screenshots were inspected. Light-theme rendering, every keyboard scroll behavior, automated axe checks, physical devices, learner outcomes and deployed execution were not verified.
- `node scripts/verify-core2-http.mjs <local-origin>` checks four localized index routes, notes/quiz/cards/drill responses, notes-return navigation and a terminating English redirect with query preservation.

No certification-passing probability, complete official objective coverage, completed PBQ simulation, or demonstrated learner mastery is asserted.
