# Site audit — 2026-11-01

## Decision requested
Approve the inventoried scope and **Workstream 1 first**, independently of the other four workstreams. No study content, UI, skills, agents, dependencies, or deployment configuration has been changed. The only repository additions in this phase are the requested reports, on `content/n10-009-objective-review`. No commit, push, PR, merge, or deployment has occurred.

This report distinguishes source inspection, automated checks, browser observations, candidate mappings, and externally verified facts. None establishes exam readiness. CompTIA's domain weights are not a scoring rubric. Estimates below are engineering effort, not delivery guarantees.

## 1. Sync and audit inputs
- Main fast-forward safety checks passed; main already matched origin/main at `bd7ddf2167b150f14074d9eb2944ee87854a0611`.
- See [the sync report](repo-sync-state-2026-11-01.md) for all 63 pre-existing local branches, 142 origin branches, 80 origin-only branch names, latest 50 PRs, bundle refs, nine clean worktrees, and exact scoped snapshot differences.
- No open PRs. One local-branch commit absent from origin: `bc0ff89` on `chore/reduce-vercel-builds`. Existing stash preserved and not inspected/applied.
- Already merged: objective coverage batches, topic consolidation, Study menu, per-exam accents, daily plan, and five Network+ domain videos. These are audit inputs, not missing features.
- Unmerged `docs/video-build-steps` adds `docs/video-overviews.md`, `tools/video/build.py`, `publish.py`, and five scene JSON files. Read via `git show`, not copied or executed. Closed-unmerged `coverage-collab` PR #139 contains a fuzzy matching prototype; its README explicitly disclaims proof of coverage.
- `content/exam-coverage-agent` contains a branch-only coverage-reviewer skill worth selectively preserving.
- No `review/` directory or requested historical `review/n10-009-gap-audit-*`, `fact-check-*`, `rubric-audit-*`, or `build-report-*` was found in the starting tree or reachable fetched history. Used `docs/content-fact-check.md`, `docs/*verification*`, `docs/*reconciliation*`, and historical rubric results instead. There is no existing build-report format available to reproduce verbatim.

## 2. Official authority and objective-map reconciliation
### Source register
Retrieved on 2026-11-01:
- **S1:** CompTIA Network+ N10-009 V9, **Exam Objectives Document Version 6.0**, 19 pages, from the distribution URL already recorded in `docs/network-plus-ch21-verification.md`: [CompTIA PDF](https://lecbyo.files.cmp.optimizely.com/download/35a7403ab73211ef9dcda6f347fbf652?download=1). Bare URL returned HTTP 403 locally; the explicit download option with normal browser headers succeeded. SHA-256 `cb0ca59be880c5ad9ee6905373f39443d040177968d5e36c93922c8622608c52`. Scope pp4–14; acronym list pp15–18; sample hardware/software p19; non-exhaustive-list notice p2.
- **S2:** Earlier official CompTIA CDN N10-009 objectives v4.0, 18 pages: [PDF](https://comptiacdn.azureedge.net/webcontent/docs/default-source/exam-objectives/comptia-network-n10-009-exam-objectives-%284-0%29-%281%29.pdf). SHA-256 `f504a9367d1dafbb7ad9830907a5f65bcb63071c52e0a44a114899c781d6a322`. Initially retrieved before resolving S1; **S1 supersedes this audit's preliminary v4 scouting**.
- **S3:** [CompTIA's Network+ certification page](https://www.comptia.org/en-us/certifications/network/), current exam code and domain summary. Local direct request to the en-us URL returned 403, while the available web reader and `/en/certifications/network/` were accessible. The attempted `/en-us/resources/exam-objectives/` returned 404. S1 is a CompTIA-branded externally hosted download, not a comptia.org-hosted byte URL; its distribution link provenance is the existing verification report.
- **S4:** [RFC 7868](https://www.rfc-editor.org/rfc/rfc7868.html), abstract: EIGRP is based on distance-vector technology. This directly challenges the unqualified hybrid/link-state-behavior classification enforced by the current pin.
- **S5:** [RFC 3927](https://www.rfc-editor.org/rfc/rfc3927.html), link-local address selection §2.1 is a required follow-up for the current APIPA pool assertion; do not treat the present book-derived pin as verified by a passing checker.

PDFs and extracted text remain outside Git in `/var/folders/ng/vgh9wqg52ydc8cmq0htfm9j80000gn/T/comptia-audit-n8huo8aa/`. No objective PDF or third-party question wording has been put into the site. Only scope labels, audit mappings, and original analysis are included here.

### Differences versus `content/objectives.json`
1. All **25 objective IDs and five domain weights** correspond to S1: 23/20/19/14/24. Titles are paraphrased; 1.1 shortens the model name, 3.3 hyphenates disaster recovery and omits its acronym, and **3.4 omits “Given a scenario”**. The latter hides the implementation task, even though the topic itself exists.
2. The JSON has **no official sub-bullet/example-topic hierarchy, acronym list, sample-equipment list, source URL, document version, or per-claim verification ledger**. It cannot prove full objective coverage.
3. Global `reviewed: false` and the opening disclaimer explicitly say statuses came from section titles and counts, not a full read. Nevertheless, all Network+ objectives are `covered`, producing a preliminary 100% planning estimate.
4. Stale negative notes remain on 1.2, 1.5, 1.6, 1.8, 3.2, 3.3, and 3.4 despite later added topics. Example: 1.5 says SFP/QSFP were not found, while the mapped transceiver topic teaches them. Conversely, the 4.3 note admits operational implementation/validation remains incomplete.
5. Cards/questions use topic associations; **none has an explicit `objectiveIds["n10-009"]` mapping**. Whole-topic inference can attribute a question to objectives it does not actually test. Counts in the following matrix are inventory counts, not verified task coverage.
6. CLI/dashboard counts omit the 47 chapter-manifest visual mappings merged by `lib/visuals.ts`. Example: 3.2 displays zero mapped visuals even though its chapter-10 topic has 20. Do not repair this by counting every visual as teaching every mapped objective.
7. S1's acronym list is larger than v4's. Terms in that list cannot be dismissed solely because they do not appear in a main objective bullet. S1 also contains naming inconsistencies: its 1.8 body and acronym expansion differ for SASE, and its acronym list spells TACAS+ while objective 4.1 uses TACACS+. Preserve the scope reference and resolve technical expansions with authoritative terminology rather than silently propagating typos.

### Coverage interpretation
**Covered** means the mapped lesson teaches the objective's task and listed families at review depth; it does not certify every claim. **Thin** means existing material is present but depth, examples, task practice, or traceability is incomplete. **Missing** is reserved for an individually confirmed absent item. **Wrong-or-unverified** identifies a source conflict, a risky absolute, or insufficient source verification. Appendix mappings are conservative candidate evidence, not automatic status upgrades.

Key confirmed inventory gaps/candidates:
- **1.3:** NFV is taught under the SDN topic outside the mapped cloud topic; mapping/continuity gap.
- **1.5:** twinaxial terminology and Fibre Channel were not found in mapped notes during term scouting; verify variants, then fill the actual explanation gap.
- **2.4:** no explicit fiber distribution panel or port-side exhaust/intake explanation found in mapped notes; generic front-to-back airflow is not the full comparison.
- **4.1:** geofencing and time-based authentication were not found in mapped notes during scouting; check equivalent phrasing before labeling missing.
- **1.8:** singular “Dynamic inventory” is already explained. Do not mistake plural keyword mismatch for a gap.
- **4.2:** chapter 21 has the strongest existing claims/source appendix and original applied exercise. Preserve it; extend traceability rather than rewriting it.
- **Scenario objectives:** questions alone do not demonstrate selecting/configuring/troubleshooting each listed case.

### Priority accuracy queue — chapters 9, 10, 11 first
These are findings for approval, not implemented corrections:

| Surface | Objective | Finding and required verification |
|---|---|---|
| `scripts/content-facts.json`, `content/network-plus/ch10.json`, notes and related visuals | 2.1 | EIGRP's unqualified “hybrid” classification and pin's “link-state behavior” conflict with S4. Reconcile terminology, DUAL, default versus configurable metrics, and all affected questions/visuals together. |
| Chapter 9 route-selection pin and chapter-10 administrative-distance tables | 2.1, 5.3 | Separate forwarding longest-prefix match from installation preferences for identical prefixes; scope vendor-default AD values. Existing pins lack sufficient vendor/version references. NEEDS VERIFICATION. |
| Chapter 11 STP pin, timer visual, and `q-n10c11-12` | 2.2, 5.3 | A universal 50-second transition is insufficiently qualified. Verify protocol, starting state, default timers, topology and edge/rapid behavior; don't merely preserve an overbroad pin. NEEDS VERIFICATION. |
| Chapter 11 collision-domain count, SVI/ACL, port-security/trunk, native-VLAN and queue statements | 2.2, 4.3, 5.3 | Existing chapter-21 verification already flags platform-scoped review. Check actual vendor behavior and assumptions before uniquely grading answers. NEEDS VERIFICATION. |
| `q-n10c10-24`, `q-n10c10-25` | 2.1 / actual item scope | Present but no answer pins; verify item scope and exact correct-answer text, then pin only sourced conclusions. |
| Chapter 7 APIPA pin | 1.7, 3.4, 5.3 | Recheck claimed assignable pool against S5 §2.1 and platform documentation. Prefix, ordinary host range and autoconfiguration selection pool are different claims. NEEDS VERIFICATION. |
| Network-device overview visual | 1.2, 1.4, 2.1 | Broad “all devices know one another's MAC/IP”, YouTube TCP/UDP, and VPN-port assertions need scenario/protocol qualification. NEEDS VERIFICATION. |
| RAID builder versus branch-only video correction log | 1.2 NAS/SAN supporting context; detailed RAID supplemental | One visual grades RAID5 rebuild as blocked, while video docs describe correcting that claim. Confirm controller/state assumptions and synchronize all surfaces; do not introduce storage detail as a new required Network+ objective. |

User-confirmed Windows `ipconfig` and conventional Class A host count **16,777,214** must be preserved and included in the next verification ledger with objective/platform assumptions. This audit did not silently change existing pins.

## 3. Content/tool inventory and maintenance value
- **100 note topics** (66 base + 34 Network+ file), **1,062 flashcards**, **2,014 questions**, **20 labs**; eight certification hubs and four locale shells.
- **179 unique standalone visual HTML files**, 216 mappings (169 general + 47 chapter-specific). Actual folder is `public/visuals/`, not `visualizations/`.
- Five existing domain videos and English VTT files: 31,434,403 combined MP4 bytes; approximately 4m20s–5m53s each. Do not generate five replacements.
- No Network+-tagged rapid-memory deck in `lib/practice/drills.ts`; Network+ practice games and topic exercises nevertheless exist. Missing deck is not missing all practice.
- `npm run check:content`: **0 errors, 92 warnings**. Categories: 20 explanation/key mentions, 30 non-four-choice items, 1 duplicate prompt, 17 answer-length cue, 7 answer-position balance, 15 stale notes references, 2 unpinned keys. These are heuristics, not 92 confirmed factual errors.
- The checker only requires **some answer tokens**, not the exact correct-answer text in an explanation. It does not require all objective tags or all technical sources. Its header still says book/notes win; `docs/content-fact-check.md` correctly prioritizes objective scope and primary technical evidence. Reconcile only after approval.
- Pins currently protect consistency with many book-derived assertions; passing the checker cannot authenticate those assertions. Some chapter-only HTML is absent from the checker's general visual corpus; inspect registry completeness.
- Duplicate candidates: `q-n10sf-18` / `q-n10acc-22` prompt warning, overlapping topic inventories and objective introductions, and repeated generated instruction copies. Preserve stable IDs and assess downstream links before any consolidation.
- Highest maintenance-cost candidates: hand-copied visual HTML styles; two divergent grading pipelines; manually synchronized skills; duplicated search semantics; multiple progress summaries. Do not retire user-visible tools on inventory alone.
- Legacy grading risks from static inspection: request identity in `tools/rubric-audit/scripts/judge_io.py` omits prompt/provider/model; invalid evidence IDs can be stripped; `report.py` trusts item IDs without current evidence hashes; recheck can only raise a grade. Newer OpenAI-package validation has stronger atomic identity/evidence/unresolved handling. Historical percentages are not current assessments or model-comparison evidence.
- `npm test` does not include the newer `test:rubric:openai` suite. Any new offline parity check should explicitly exercise it without live API calls.

## 4. UI/UX baseline
### Information architecture
The landing page already asks for a certification. Header has **certification menu, Study menu, Search, language selector**. Hubs provide tools and study sequence; Network+ adds domain accordions and chapter-9/10/11 visual cards. Keep these conventions and the current dark navy/Inter/IBM Plex Mono design. Existing exam accent colors are already deployed, not a new build requirement.

Content is still scattered across `/networking`, `/network-plus`, `/study-path`, `/coverage`, `/scorecard`, `/weak-areas`, individual notes, chapter visual routes and the visual catalog. Some are distinct views of shared implementations, not duplicate code to delete.

Candidates for navigation review, not proven orphans: `/network-plus` duplicates hub chapter cards; `/study-path` has only the index's literal incoming app link; `/trap-answers` and `/scenario-builder` lack literal incoming app/lib links but are in the sitemap. Dynamic links/static HTML were not exhaustively proven absent.

### Measured production tasks
Headless installed Chromium, fresh isolated browser context per task, 390×900 and 1000×900, production on 2026-11-01. Counts are control activations (typing excluded); timings begin after the starting page loads and are **automated warm-navigation times, not human task times or usability-study results**. No throttling or repeated statistical benchmark. Production mutation requests were blocked; only local practice-session state was started, no answers submitted and no Twilio calls.

| Task | Path / result | Activations | Seconds 390 / 1000 |
|---|---|---|---|
| Find DHCP notes | Home → Search → enter DHCP / submit → DNS and DHCP notes | 3 | 1.55 / 1.53 |
| Start timed Network+ | Home → Network+ → visible Apply card → Start 90-question test; Network+ selected and 90:00 shown | 3 | 0.40 / 0.30 |
| Open chapter-10 visual | Home → Network+ → chapter 10; protocol-map iframe visible | 2 | 0.33 / 0.21 |
| See weak objectives | Home → Network+ → Apply → objective scorecard; correctly shows 25 not tested, no saved results | 3 to scorecard; actual weakness unavailable without results | 0.88 / 0.45 |
| Switch certification | From Network+ → certification menu → Core 2 | 2 | 0.14 / 0.16 |
| Search subnet | Home → Search → enter subnet / submit; first result is subnetting notes | 2 | 1.26 / 1.61 |
| Change language | From `/notes?exam=n10-009` → French; arrives `/fr/notes`, exam filter lost | 1 | 0.09 / 0.09 |

The objective-scorecard route is `/scorecard?exam=n10-009`, linked from timed-test setup. Separately, Home → weak areas took one activation (0.07s at each width) and showed its no-misses empty state. `/weak-areas` lists historical topic misses, not objective performance; `/coverage` is content inventory, and its missed-on-exam field is static author metadata. These labels should not imply the same measurement.

Initial automation used `networkidle` without destination assertions and read stale state; those timings were discarded. The first Mock-exam selector also hit duplicate navigation links; the final measurement used the visible main Apply card and asserted the destination/session.

Screenshots and raw corrected measurements are local, outside Git:
`/var/folders/ng/vgh9wqg52ydc8cmq0htfm9j80000gn/T/comptia-ui-audit-9a7zgg/`.
Files include `390-_en_network_plus_ch10.png`, `1000-_en.png`, task screenshots at both widths, `task-results-corrected.json`, `timed-task-results.json`, and `scorecard-task-results.json`. The latter two override the corrected file's unsuccessful timed-test selector and historical-weak-area route, respectively. Screenshots of mobile chapter 10 and desktop home were visually inspected. No claim that these are persisted hosted media artifacts.

### Accessibility and layout observations
- Six route samples (home, chapter index, chapter 10, search, timed setup, coverage) returned HTTP 200 at both widths, with no recorded page errors and no **document** horizontal overflow. This is not an iframe-wide/all-routes guarantee.
- Escape closes Study and returns focus to its button in the mobile browser check.
- Axe WCAG 2 A/AA + 2.1 AA: no violations on the 390px Network+ hub and chapter-10 shell. Not a whole-site, iframe, physical-device or screen-reader certification; contrast on all standalone diagrams remains unverified.
- Mobile chapter 10 visually switches to a light chapter wrapper and a differently styled embedded visual inside the dark application. This is observed style drift, not necessarily a defect requiring removal of light mode.
- Header Test link is unscoped (`SiteHeader.tsx:89`) and `/test` defaults Core 1 (`app/[locale]/test/ExamTest.tsx:117`). The hub's explicitly scoped test path works.
- Locale switcher uses pathname only (`LocaleSwitcher.tsx:18`), reproduced dropping the exam query. Plain visual-to-notes anchor at `VisualLibrary.tsx:509` risks losing locale.
- Source-confirmed weak-area double counting: a finished timed test writes both quiz and mock attempts (`ExamTest.tsx:220–221`); WeakAreas sums both histories. Also lacks exam scoping and does not clear old misses after later success. Runtime seeded-history regression still needed.
- Coverage links offer unsupported Security+/Azure timed tests, which the test route does not accept; source indicates silent Core 1 fallback. Audit did not complete those flows as real exam tests.
- Global search excludes games, labs, and visual destinations; card/question hits open topic roots rather than the exact item. “subnet” finds notes but does not surface Subnet Architect as a tool destination.
- Existing breadcrumbs and chapter next/previous controls should be retained. Evaluate explicit next-step links and empty states before adding more navigation buttons.

### Translation scope
All four locale message files have 2,108 flattened keys, with no missing keys. Identical-English leaves: FR 213, ES 182, PT 186; some are valid acronyms/names, so this is not a count of translation errors.

Clear gaps: Search/Glossary/Scorecard namespaces and targeted-test strings; shared English notes/cards/questions; English track descriptions and exported weak-concept reports. The current multilingual shell is **not four translated courses**. Workstream 1 must explicitly flag FR/ES/PT content gaps and obtain technical language review rather than manufacture translations. Do not block useful verified English content on an unacknowledged translation assumption.

## 5. Build/page-weight baseline and spend
No fresh build was run during this audit, and no site files changed. Before/after source page-template count is therefore unchanged: **52 localized page files**, not 52 generated URLs.

Existing `.next` is **stale**: Oct31 files predate current video's route. It has 53 page patterns + 25 route-handler entries, 684 prerender-manifest route entries and 682 physical HTML files. These are distinct historical counts, not a fresh current-build result.

Existing visual-catalog HTML references 13 scripts: 2,615,230 raw bytes / 737,414 in-memory gzip bytes for the inspected Network+/Core1 visual pages. Not equivalent to actual first-load transfer or executed JS.

Read-only production resource observations (sum of encoded script body sizes in that navigation, not a cold-cache route bundle budget):
| Sample | 390px bytes | 1000px bytes |
|---|---:|---:|
| Home | 706,736 | 709,379 |
| Network+ chapter index | 713,977 | 814,641 |
| Chapter 10 | 713,977 | 814,641 |
| Search subnet | 701,166 | 701,166 |
| Timed-test setup | 735,569 | 735,569 |
| Coverage | 705,809 | 705,809 |

Differences between widths/navigation sequences are not proof width changes the bundle. No before/after improvement is claimed. For each approved site-touching PR, run a local non-publishing build once, document provenance, generated page count and comparable cold-cache per-route JS before/after. Preserve on-demand topic rendering; do not expand static params. No new dependencies, paid TTS, external model calls, or service provisioning are authorized by this plan. Existing Twilio functionality stays untouched.

## 6. Agent-tooling inventory and parity matrix
Current state: `.agents/` has nine skills and one descriptive reviewer prompt; `.claude/` has 16 skills and nine agent prompts. Shared skills mostly differ only in workflow/reviewer links. There is no canonical `agent-kit/` or adapter drift generator. `CLAUDE.md` imports `AGENTS.md`; retain the Next-generated block and manual exam policy.

Paths below: **C** = `.claude/skills/<name>/SKILL.md`, **O** = `.agents/skills/<name>/SKILL.md`, **CA** = `.claude/agents/<name>.md`, **OA** = `.agents/agents/<name>.md`. `.agents` text is usable by Markdown-reading OpenAI/Codex hosts when explicitly loaded, not a guarantee of native registration.

| Capability | Claude path | OpenAI path | Provider-neutral path today | Action needed |
|---|---|---|---|---|
| certification-content-verifier | C | O | O, host-loading caveats | Generalize canonical + generated adapters |
| comptia-site-pm | C | O | O | Generalize; preserve document-validation wording |
| content-fact-check | C | O | O + checker | Generalize; adapter reviewer paths |
| exam-visual-designer | C | O | O | Generalize |
| hardware-diagram-designer | C | O | O | Generalize |
| learning-challenge-designer | C | O | O | Generalize |
| network-diagram-designer | C | O | O | Generalize |
| review-question-tutor | C | O | O | Generalize; preserve verified-key/one-at-a-time safeguards |
| shared-state-regression-tester | C | O | O | Generalize; preserve no-provisioning boundary |
| chapter-ingest | C | No counterpart | None | Port to OpenAI + neutral; retain stable IDs |
| question-writer | C | No counterpart | None | Port to OpenAI + neutral |
| question-quality-fixer | C | No counterpart | None | Port to OpenAI + neutral; text-key-safe edits |
| exam-drill-builder | C | No counterpart | None | Port; remove contradictory unconditional shipping |
| pbq-designer | C | No counterpart | None | Port; accessibility and fact verification |
| notes-clarity-editor | C | No counterpart | None | Port; preserve section IDs |
| rubric-audit workflow | C + legacy tools | `tools/rubric-audit-openai/` | Deterministic pieces, no canonical skill | Generalize; distinguish scope/grade semantics |
| chapter-fact-reviewer | CA | OA | OA descriptive prompt | Generalize; native metadata only in adapters |
| answer-key-verifier | CA | No counterpart | None | Port blind-answer/reveal workflow |
| objective-gap-auditor | CA | No counterpart | None | Port; reconcile heaviest-domain priority |
| learner-simulator | CA | No counterpart | None | Port; label simulation, not learner evidence |
| drill-target-auditor | CA | No counterpart | None | Port |
| rubric-grader | CA | OpenAI package provider | Package `FileGrader` / `ReplayGrader` | Generalize **offline file/session adapters only** |
| ux-a11y-reviewer | CA | No counterpart | None | Port available-browser workflow |
| visual-fact-auditor | CA | No counterpart | None | Port visible/script-claim audit |
| weak-concept-coach | CA | No counterpart | None | Port source-grounded coaching |
| exam-coverage-reviewer | None | Branch-only O | `content/exam-coverage-agent` branch | Selectively preserve, reconcile status semantics |
| Objective coverage calculation | Shared CLI | Shared CLI | `scripts/objective-coverage.mjs`, `lib/objective-coverage.mjs` | Already neutral; fix inventory and scope interpretation |
| Content consistency / math | Shared scripts | Shared scripts | `scripts/check-content.mjs`, `content-facts.json` | Already neutral; extend source/objective checks |
| Visual fact-block audit | Shared script | Shared script | `scripts/audit-visuals.mjs` | Extend beyond shape checks, keep truth distinction |
| PDF rubric preparation | Legacy extraction scripts | CSV input validation only | `tools/rubric-audit/scripts/{extract_rubric,verify_rubric}.py` | Shared deterministic preparation stage |
| Evidence ingestion/export | Legacy scans + drill dump | Separate scanner | Two incompatible corpus scopes | Generalize explicit exports; no fake parity |
| Grade acceptance/cache | Legacy judgment files | Stronger newer engine | New engine validation components | Reuse robust offline semantics; preserve historical provenance |
| Independent recheck | Legacy prior-grade-aware | Blinded recheck | No common prompt/contract | Generalize, explicitly record semantic migration |
| Reports/reference review | Legacy results/manual spot checks | New reporting/evaluation | Some reusable pure Python | Version schemas; don't blend historical percentages |
| Teaching agent demo | Session-run neutral code | Same | `agent-starter/` | Already fine as separate demo, not grading runtime |
| Video overview producer | No dedicated skill | No dedicated skill | Branch-only `tools/video/` scripts | Create neutral workflow and both adapters, reuse source |
| Content-dispute triage | General fact checker; no named dedicated skill | Same | `docs/content-disputes.md`, report implementation | Create thin canonical triage workflow and both adapters |
| Feature rollout/PR flow | PM/workflow instructions | PM/workflow instructions | `docs/feature-rollout.md`, shared contract | Merge policy duplication without deleting behavior |

Specific conflicts:
- `.claude/skills/exam-drill-builder/SKILL.md:64–66` says commit/ship unconditionally, unlike the session-authorization contract. Migration must gate each action.
- Claude README calls agents report-only, while rubric-grader requires bounded judgment-file writes. Clarify the exception, preserving inline read-only mode.
- Objective-gap-auditor ranks missing first; root `AGENTS.md` requires gap 1 under heaviest domain first. Existing global CLI gap 1 is **CLF-C02 3.1**, not a Network+ objective. Network+ priority in this mission is an explicit scoped override, not a false global-report recommendation.
- Legacy covered semantics differ between ingest/reviewer instructions; define teaching coverage independently of raw resource counts.
- `docs/assessment-workflow.md` is generated from JSON and should not be hand-edited. Preserve its generator.
- No Anthropic live API adapter exists. Existing OpenAI live adapter is **not authorized to run**. Counterparts will be Markdown/session/file adapters without adding provider dependencies or external calls.

## 7. Visual and video pain points
- **120/179** visual files have no SVG/canvas according to markup triage; this does not establish no useful visual structure, but identifies review candidates. The high-word-count overview is a better redraw candidate than a useful simulator.
- **41** files have checked fact blocks; **138** do not. Existing `audit:visuals --check` reports 41 checked / zero structural problems; nonempty sources are not source verification.
- Inline styling differs across 179 files; older examples use Georgia/blue and external Google fonts, newer videos use Inter/indigo and fixed 1280×720 output. Shared tokens/template/checklist are absent.
- Existing renderer on `docs/video-build-steps` has reusable scene types and atomic output patterns. Its Python Piper/Playwright dependencies and voice models are not installed here; installed Node Playwright, macOS local narration options and ffmpeg provide a no-service alternative. No install is proposed without asking.
- Existing branch publisher estimates sentence timing; captions need audio-aligned listening/review, not merely VTT syntax checks. Source docs disclose English-only narration and unlistened synthetic speech.
- Existing five MP4s are already in Git; avoid adding another large binary or rewriting Git history. Place the approved prototype outside Git and give an exact path.
- Prototype should be **one Network+ 60–90-second micro-lesson**, not an unrelated printer lesson and not five replacement domain videos. Suggested scope: chapter 9 local-vs-remote ARP/frame rewrite, after verifying its claims and assumptions. Reuse an actual diagram and source manifest, not text-only slides.
- Rejected by default: paid cloud narration/video generation, provider APIs, heavyweight new render frameworks, duplicate whole-domain videos, broad 179-file style rewrite, and automatic publishing. Existing optional local TTS requiring models/packages is deferred pending approval/license review.

## 8. Prioritized recommendations and effort
Estimates are single-engineer focused effort including small regression tests; technical review/translation can extend them.

| Priority / branch | Proposed bounded scope | Effort | Dependency |
|---|---|---|---|
| P0 — `content/n10-009-objective-review` | Chapters 9–11 accuracy/claims appendices first; verified subobjective ledger, scenario-tagged questions/cards/diagrams, then remaining 25-objective gaps; source-backed pins and explicit translation gaps | 1–2 days first chapter tranche; roughly 4–8 days complete English objective sweep, plus language review | Inventory/plan approval; sources available per claim |
| P1 — `ux/navigation-audit` | Preserve exam/query/hash/locale, consistent objective-scorecard path, unsupported-test empty states, weak-area double-count regression, search destinations; retain current simpler header/colors | 1–3 days | P0 PR delivered independently first |
| P2 — `chore/content-tools-optimization` | Adjudicate 92 warnings, exact answer-text/tag checks, merged visual inventory, duplicate proposals and cold build/JS profile | 2–4 days | Approved consolidation list; don't delete user-visible tools silently |
| P3 — `tooling/agent-kit` | Canonical 16-skill/nine-role migration, expected missing workflows, generated adapters/pointers and drift check; offline file/session grading parity | 1–2 days instruction tranche; 5–11 days with robust runtime/export parity | Inventory acceptance; no provider API spend |
| P4 — `tooling/visual-video-pipeline` | Shared template/scaffolder + three representative checks, source manifests and one 60–90s Network+ diagram/narration prototype | 1–2 days template; 6–10 hours prototype, plus licensing uncertainty | Verified P0 claims; selective reuse of video branch |

No wholesale rewrite, dependency addition, retirement, or adapter replacement is approved merely by this report. P0 must not wait on P1–P4 tooling/architecture.

For each later PR: small logical commits with attribution; run `npm run lint && npm run typecheck && npm run check:content && npm test`; record actual failures. Add a `review/build-report-<workstream>-<date>.md` using the requested sections (added, verified, NEEDS VERIFICATION, To do with owner), since no prior format was found. For site-touching work also report comparable before/after page count and JS. Never merge/deploy; Louis owns merge and manual prebuilt deployment.

## 9. Validation and remaining ownership
- Baseline command chain executed, then independently repeated with explicit subprocess exit codes: **lint 0, typecheck 0, check:content 0, npm test 0**. Summaries: lint 0 errors / 4 warnings (three image warnings and one existing effect-dependency warning); typecheck passed; content 0 errors / 92 warnings; **281 tests passed (265 Node + 16 Python)**; visual fact-block shape check 41 / zero problems. Full second-run logs are outside Git at `/var/folders/ng/vgh9wqg52ydc8cmq0htfm9j80000gn/T/comptia-validation-8pqrsnw3/{1,2,3,4}.log`. Existing Node module-type warnings were also emitted; no suppression or source changes.
- Browser scope and limitations are recorded above. No local production build, deployment, live grading run, live Twilio flow, real device or human learner test was run.
- **Louis:** approve the inventory/plan before implementation; decide eventual preservation/push of `bc0ff89` and the existing stash; approve specific dependency proposals if later needed; review technical translations; merge/deploy personally.
- **Agent after approval:** fresh claim-by-claim primary-source verification, independent second pass, exact objective tags, sourced pins, original practice, chapter appendices and separate PR reports. Do not treat the candidate appendix or a passing consistency check as finished fact verification.
- **NEEDS VERIFICATION:** technical queue above; full teaching-depth adjudication of every candidate subtopic/acronym/sample item; production build provenance/page weights; all-route/iframe accessibility; current grading runtime parity; complete FR/ES/PT study-content coverage.

## Appendix A — objective and subtopic evidence inventory
The generated inventory below maps all 25 objectives and listed topic families to existing assets, followed by acronym and sample-equipment leads: 481 condensed scope entries, 198 acronym tokens and 52 expanded sample families. Literal-term matches are **navigation leads only**; their absence is not proof of missing content and their presence is not proof of teaching or accuracy. A question may mention a term only as a distractor; a visual may mention it in script code or boilerplate; an acronym may have more than one expansion (for example PDU). These cases explicitly require semantic review. Original scope labels are condensed, not a reproduction of the objectives document. All individual rows remain NEEDS VERIFICATION; this is a Phase 1 inventory, not the Workstream 1 claim-verification deliverable.

### Objective-level inventory
Resource counts below use entire mapped topics, may count shared material repeatedly, and deliberately do not estimate exam mastery. V is merged visual mappings, not unique assets. All individual subtopic rows require a fresh teaching-depth/claim-source decision.

| Objective (S1 page) | Audit status | Topics | Notes sections / cards / questions / labs / V |
|---|---|---|---|
| 1.1 (p4) | Thin: evidence/depth and per-item mapping incomplete | `n10-osi-models`, `n10-l2-l3-switching` | 15 / 27 / 43 / 1 / 4 |
| 1.2 (p4) | Thin: evidence/depth and per-item mapping incomplete | `networking-storage`, `networking-fundamentals`, `networking-devices`, `n10-l2-l3-switching`, `n10-appliances-functions` | 23 / 46 / 93 / 5 / 16 |
| 1.3 (p4) | Thin: evidence/depth and per-item mapping incomplete | `n10-cloud-models-connectivity` | 2 / 14 / 31 / 0 / 0 |
| 1.4 (p5) | Wrong-or-unverified: protocol/port assumptions need fresh source trace | `networking-dns-dhcp`, `networking-devices`, `n10-tcpip`, `n10-html-http`, `n10-ports-reference` | 29 / 64 / 127 / 5 / 14 |
| 1.5 (p6) | Thin: evidence/depth and per-item mapping incomplete | `networking-cabling`, `networking-fundamentals`, `n10-osi-models`, `n10-transceivers-fiber` | 19 / 36 / 110 / 3 / 11 |
| 1.6 (p6) | Thin: evidence/depth and per-item mapping incomplete | `networking-devices`, `n10-topologies-architecture` | 12 / 27 / 53 / 2 / 6 |
| 1.7 (p6) | Wrong-or-unverified: APIPA pool pin and historical classful context | `n10-ch7`, `n10-ch8` | 22 / 38 / 65 / 1 / 9 |
| 1.8 (p7) | Thin: evidence/depth and per-item mapping incomplete | `networking-devices`, `n10-ch7`, `n10-sdn-overlay`, `n10-zerotrust-iac` | 26 / 53 / 113 / 2 / 11 |
| 2.1 (p8) | Wrong-or-unverified: EIGRP classification, route-selection/AD scoping | `n10-ch8`, `n10-ch10`, `n10-ch9` | 34 / 53 / 75 / 2 / 35 |
| 2.2 (p8) | Wrong-or-unverified: timers, domains, platform-specific claims | `n10-l2-l3-switching`, `n10-ch11` | 22 / 25 / 40 / 2 / 18 |
| 2.3 (p9) | Thin: evidence/depth and per-item mapping incomplete | `n10-wireless-standards-security` | 7 / 18 / 61 / 0 / 0 |
| 2.4 (p9) | Thin: evidence/depth and per-item mapping incomplete | `n10-physical-install-factors` | 2 / 14 / 33 / 0 / 0 |
| 3.1 (p10) | Thin: evidence/depth and per-item mapping incomplete | `n10-org-documentation`, `n10-org-change-config` | 6 / 17 / 44 / 0 / 0 |
| 3.2 (p10) | Thin: evidence/depth and per-item mapping incomplete | `n10-ch10`, `n10-security`, `n10-monitoring-technologies` | 22 / 39 / 77 / 1 / 20 |
| 3.3 (p11) | Thin: evidence/depth and per-item mapping incomplete | `networking-storage`, `n10-disaster-recovery` | 6 / 15 / 34 / 1 / 4 |
| 3.4 (p11) | Thin: evidence/depth and per-item mapping incomplete | `networking-dns-dhcp`, `n10-ch7`, `n10-dns-records-security`, `n10-dhcp-ipam-time` | 23 / 59 / 147 / 5 / 10 |
| 3.5 (p11) | Thin: evidence/depth and per-item mapping incomplete | `n10-remote-access-methods` | 3 / 12 / 33 / 0 / 0 |
| 4.1 (p12) | Thin: evidence/depth and per-item mapping incomplete | `n10-security`, `n10-risk-compliance`, `n10-ch21` | 26 / 36 / 54 / 1 / 2 |
| 4.2 (p12) | Covered in teaching families; fresh claim verification still pending | `n10-risk-compliance`, `n10-ch21` | 19 / 29 / 44 / 1 / 2 |
| 4.3 (p12) | Wrong-or-unverified: implementation scope admitted incomplete | `n10-ch11`, `n10-ch21`, `n10-security-features-43` | 30 / 45 / 68 / 2 / 18 |
| 5.1 (p13) | Thin: evidence/depth and per-item mapping incomplete | `core2-ch7`, `n10-troubleshoot-method` | 9 / 37 / 73 / 0 / 7 |
| 5.2 (p13) | Thin: evidence/depth and per-item mapping incomplete | `networking-cabling`, `n10-osi-models`, `n10-troubleshoot-physical` | 16 / 39 / 72 / 0 / 7 |
| 5.3 (p13) | Wrong-or-unverified: inherited switching/routing assertions | `n10-ch8`, `n10-ch11`, `n10-ch9`, `n10-troubleshoot-services` | 41 / 67 / 98 / 3 / 31 |
| 5.4 (p14) | Thin: evidence/depth and per-item mapping incomplete | `n10-performance-troubleshooting` | 4 / 15 / 52 / 0 / 0 |
| 5.5 (p14) | Thin: evidence/depth and per-item mapping incomplete | `core2-ch7`, `quick-reference`, `networking-cabling`, `n10-troubleshoot-tools` | 16 / 48 / 90 / 0 / 13 |

### 1.1 — evidence leads (S1 p4)
Task verb: explain/summarize. Mapped labs: `inter-vlan-l3-switch`. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| Physical | `n10-osi-models#objectives`, `n10-osi-models#osi-layers` | `fc-n10osi-02`, `q-n10osi-02` | `n10-l2l3-packet-walk.html` | NEEDS VERIFICATION |
| Data link | `n10-osi-models#osi-layers`, `n10-osi-models#mnemonics` | `fc-n10osi-02`, `q-n10osi-01` | `n10-osi-dod-stack.html` | NEEDS VERIFICATION |
| Network layer | No literal lead in mapped notes | `q-n10osi-04` | `n10-osi-dod-stack.html` | NEEDS VERIFICATION |
| Transport | `n10-osi-models#osi-layers`, `n10-osi-models#mnemonics` | `fc-n10osi-01`, `q-n10osi-01` | `n10-osi-dod-stack.html` | NEEDS VERIFICATION |
| Session | `n10-osi-models#osi-layers`, `n10-osi-models#mnemonics` | `fc-n10osi-02`, `q-n10osi-01` | `n10-osi-dod-stack.html` | NEEDS VERIFICATION |
| Presentation | `n10-osi-models#osi-layers`, `n10-osi-models#mnemonics` | `fc-n10osi-02`, `q-n10osi-02` | `n10-osi-dod-stack.html` | NEEDS VERIFICATION |
| Application | `n10-osi-models#objectives`, `n10-osi-models#osi-layers` | `fc-n10osi-02`, `q-n10osi-02` | `n10-osi-dod-stack.html` | NEEDS VERIFICATION |

### 1.2 — evidence leads (S1 p4)
Task verb: compare. Mapped labs: `two-subnet-lan`, `dhcp-relay-three-site`, `cant-reach-website`, `inter-vlan-l3-switch`, `core1-soho-configuration-practice`. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| Physical appliances | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Virtual appliances | `n10-appliances-functions#1-2-other` | No literal lead | No literal lead | NEEDS VERIFICATION |
| Router | `networking-fundamentals#network-devices`, `networking-devices#hub-switch-router` | `fc-n3`, `q-162` | `n10-l2l3-forwarding-game.html` | NEEDS VERIFICATION |
| Switch | `networking-fundamentals#network-devices`, `networking-devices#hub-switch-router` | `fc-n2`, `q-155` | `n10-l2l3-forwarding-game.html` | NEEDS VERIFICATION |
| Firewall | `networking-fundamentals#network-devices`, `networking-devices#wan-mpls-sdwan` | `fc-n11`, `q-155` | `n10-l2l3-forwarding-game.html` | NEEDS VERIFICATION |
| IDS | `n10-appliances-functions#1-2-security`, `n10-appliances-functions#1-2-other` | `fc-n10ap-01`, `q-n10ap-01` | No literal lead | NEEDS VERIFICATION |
| IPS | `n10-appliances-functions#1-2-security`, `n10-appliances-functions#1-2-other` | `fc-n10sw-06`, `q-172` | `n10-l2l3-packet-walk.html` | NEEDS VERIFICATION |
| Load balancer | `n10-appliances-functions#1-2-security` | `fc-n10ap-06`, `q-n10ap-01` | `n10-l2l3-forwarding-game.html` | NEEDS VERIFICATION |
| Proxy | `n10-appliances-functions#1-2-security` | `fc-n10ap-04`, `q-n10ap-01` | No literal lead | NEEDS VERIFICATION |
| NAS | `networking-storage#nas-san-backup` | `fc-54`, `q-48` | `networking-storage-321.html` | NEEDS VERIFICATION |
| SAN | `networking-storage#nas-san-backup`, `networking-fundamentals#san-storage` | `fc-54`, `q-48` | `networking-fundamentals-overview.html` | NEEDS VERIFICATION |
| Wireless AP | No literal lead in mapped notes | No literal lead | `n10-l2l3-forwarding-game.html` | NEEDS VERIFICATION |
| Wireless controller | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| CDN | No literal lead in mapped notes | `fc-n10ap-11` | No literal lead | NEEDS VERIFICATION |
| VPN | `n10-l2-l3-switching#three-devices`, `n10-l2-l3-switching#l3-vs-router` | `fc-n10sw-09`, `q-cls-057` | `n10-l2l3-forwarding-game.html` | NEEDS VERIFICATION |
| QoS | `networking-devices#wan-mpls-sdwan` | `fc-n10`, `q-177` | `networking-devices-overview.html` | NEEDS VERIFICATION |
| TTL | `n10-l2-l3-switching#layer2-forwarding`, `n10-l2-l3-switching#layer3-switching` | `fc-n10sw-05`, `q-178` | `n10-l2l3-forwarding-game.html` | NEEDS VERIFICATION |

### 1.3 — evidence leads (S1 p4)
Task verb: explain/summarize. Mapped labs: none. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| NFV | No literal lead in mapped notes | `fc-n10cloud-connectivity-02`, `q-n10cloud-connectivity-03` | No literal lead | NEEDS VERIFICATION |
| VPC | `n10-cloud-models-connectivity#1-3-network` | `fc-n10cl-09`, `q-n10cl-14` | No literal lead | NEEDS VERIFICATION |
| Network security groups | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Network security lists | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Internet gateway | `n10-cloud-models-connectivity#1-3-network` | `fc-n10cl-07`, `q-n10cloud-connectivity-02` | No literal lead | NEEDS VERIFICATION |
| NAT gateway | `n10-cloud-models-connectivity#1-3-network` | `fc-n10cl-07`, `q-n10cloud-connectivity-02` | No literal lead | NEEDS VERIFICATION |
| VPN | `n10-cloud-models-connectivity#1-3-network` | `fc-n10cloud-connectivity-01`, `q-n10cloud-connectivity-02` | No literal lead | NEEDS VERIFICATION |
| Direct Connect | `n10-cloud-models-connectivity#1-3-network` | `fc-n10cloud-connectivity-01`, `q-n10cloud-connectivity-02` | No literal lead | NEEDS VERIFICATION |
| Public cloud | `n10-cloud-models-connectivity#1-3-models`, `n10-cloud-models-connectivity#1-3-network` | `fc-n10cl-09`, `q-n10cl-01` | No literal lead | NEEDS VERIFICATION |
| Private cloud | No literal lead in mapped notes | `q-n10cloud-connectivity-03` | No literal lead | NEEDS VERIFICATION |
| Hybrid cloud | No literal lead in mapped notes | `fc-n10cl-10`, `q-n10cl-01` | No literal lead | NEEDS VERIFICATION |
| SaaS | `n10-cloud-models-connectivity#1-3-models` | `fc-n10cl-02`, `q-n10cl-05` | No literal lead | NEEDS VERIFICATION |
| IaaS | `n10-cloud-models-connectivity#1-3-models` | `fc-n10cl-02`, `q-n10cl-05` | No literal lead | NEEDS VERIFICATION |
| PaaS | `n10-cloud-models-connectivity#1-3-models` | `fc-n10cl-02`, `q-n10cl-05` | No literal lead | NEEDS VERIFICATION |
| Scalability | `n10-cloud-models-connectivity#1-3-models` | No literal lead | No literal lead | NEEDS VERIFICATION |
| Elasticity | `n10-cloud-models-connectivity#1-3-models` | `fc-n10cl-04`, `q-n10cl-10` | No literal lead | NEEDS VERIFICATION |
| Multitenancy | `n10-cloud-models-connectivity#1-3-models` | `fc-n10cl-05`, `q-n10cl-11` | No literal lead | NEEDS VERIFICATION |

### 1.4 — evidence leads (S1 p5)
Task verb: explain/summarize. Mapped labs: `two-subnet-lan`, `dhcp-relay-three-site`, `cant-reach-website`, `defensive-evidence-triage`, `core1-soho-configuration-practice`. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| FTP 20/21 | `networking-devices#tcp-udp-ports`, `networking-devices#email-file-ports` | `fc-n10pt-01`, `q-as1201-31` | `n10-tcpip-port-rush.html` | NEEDS VERIFICATION |
| SFTP 22 | `n10-tcpip#ports`, `n10-ports-reference#1-4-ports-core` | `fc-n10pt-01`, `q-n10pbq-18` | `n10-tcpip-port-rush.html` | NEEDS VERIFICATION |
| SSH 22 | `networking-devices#tcp-udp-ports`, `networking-devices#email-file-ports` | `fc-n10tcp-08`, `q-n10tcp-08` | `n10-tcpip-port-rush.html` | NEEDS VERIFICATION |
| Telnet 23 | `networking-devices#tcp-udp-ports`, `networking-devices#email-file-ports` | `fc-n10tcp-08`, `q-n10tcp-08` | `n10-tcpip-port-rush.html` | NEEDS VERIFICATION |
| SMTP 25 | `networking-devices#tcp-udp-ports`, `networking-devices#email-file-ports` | `fc-as1201-13`, `q-as1201-29` | `n10-tcpip-port-rush.html` | NEEDS VERIFICATION |
| DNS 53 | `networking-dns-dhcp#dhcp`, `networking-dns-dhcp#dns` | `fc-45`, `q-39` | `core1-vlan-vpn-dhcp-pbq.html` | NEEDS VERIFICATION |
| DHCP 67/68 | `networking-dns-dhcp#dhcp`, `networking-devices#tcp-udp-ports` | `fc-45`, `q-39` | `core1-vlan-vpn-dhcp-pbq.html` | NEEDS VERIFICATION |
| TFTP 69 | `n10-tcpip#tcp-vs-udp`, `n10-tcpip#ports` | `fc-n10pt-01`, `q-n10tcp-07` | `n10-tcpip-port-rush.html` | NEEDS VERIFICATION |
| HTTP 80 | `networking-devices#tcp-udp-ports`, `networking-devices#email-file-ports` | `fc-n10tcp-08`, `q-n10web-01` | `n10-html-http-lab.html` | NEEDS VERIFICATION |
| NTP 123 | `networking-dns-dhcp#network-servers`, `n10-tcpip#tcp-vs-udp` | `fc-as1201-15`, `q-n10tcp-07` | `n10-tcpip-port-rush.html` | NEEDS VERIFICATION |
| SNMP 161/162 | `networking-devices#email-file-ports`, `n10-tcpip#four-layers` | `fc-n10tcp-07`, `q-n10tcp-07` | `n10-tcpip-port-rush.html` | NEEDS VERIFICATION |
| LDAP 389 | `networking-devices#email-file-ports`, `n10-tcpip#tcp-vs-udp` | `fc-n10tcp-08`, `q-n10tcp-10` | `n10-tcpip-port-rush.html` | NEEDS VERIFICATION |
| HTTPS 443 | `networking-devices#tcp-udp-ports`, `networking-devices#email-file-ports` | `fc-n10tcp-08`, `q-43` | `n10-html-http-lab.html` | NEEDS VERIFICATION |
| SMB 445 | `networking-devices#email-file-ports`, `n10-tcpip#tcp-vs-udp` | `fc-n10tcp-10`, `q-n10pt-17` | `n10-tcpip-port-rush.html` | NEEDS VERIFICATION |
| Syslog 514 | `networking-dns-dhcp#network-servers`, `n10-tcpip#tcp-vs-udp` | `fc-n10pt-04`, `q-n10tcp-07` | `n10-tcpip-port-rush.html` | NEEDS VERIFICATION |
| SMTPS 587 | `n10-tcpip#ports` | No literal lead | `n10-tcpip-port-rush.html` | NEEDS VERIFICATION |
| LDAPS 636 | `n10-tcpip#ports`, `n10-ports-reference#1-4-ports-secure` | `fc-n10tcp-08`, `q-n10tcp-10` | `n10-tcpip-port-rush.html` | NEEDS VERIFICATION |
| SQL Server 1433 | `n10-tcpip#port-ranges` | `fc-n10tcp-10` | No literal lead | NEEDS VERIFICATION |
| RDP 3389 | `networking-devices#tcp-udp-ports`, `n10-tcpip#tcp-vs-udp` | `fc-n10tcp-10`, `q-n10tcp-16` | `n10-tcpip-port-rush.html` | NEEDS VERIFICATION |
| SIP 5060/5061 | `n10-tcpip#ports`, `n10-ports-reference#1-4-ports-infra` | `fc-n10tcp-08`, `q-n10tcp-16` | `n10-tcpip-port-rush.html` | NEEDS VERIFICATION |
| ICMP | `n10-tcpip#objectives`, `n10-tcpip#four-layers` | `fc-n10tcp-03`, `q-172` | No literal lead | NEEDS VERIFICATION |
| TCP | `networking-devices#tcp-udp-ports`, `n10-tcpip#objectives` | `fc-n8`, `q-39` | `n10-html-http-lab.html` | NEEDS VERIFICATION |
| UDP | `networking-dns-dhcp#dhcp`, `networking-devices#tcp-udp-ports` | `fc-45`, `q-39` | `n10-html-http-lab.html` | NEEDS VERIFICATION |
| GRE | `n10-tcpip#objectives`, `n10-tcpip#four-layers` | `fc-n10tcp-03`, `q-n10tcp-13` | No literal lead | NEEDS VERIFICATION |
| IPSec | `n10-tcpip#objectives`, `n10-tcpip#four-layers` | `q-n10tcp-13` | No literal lead | NEEDS VERIFICATION |
| AH | `n10-tcpip#objectives`, `n10-tcpip#ip-header` | `fc-n10tcp-03`, `q-n10tcp-13` | No literal lead | NEEDS VERIFICATION |
| ESP | `n10-tcpip#objectives`, `n10-tcpip#ip-header` | `fc-n10tcp-03`, `q-n10tcp-03` | No literal lead | NEEDS VERIFICATION |
| IKE | `n10-tcpip#objectives`, `n10-tcpip#ip-types` | `fc-n10pt-08`, `q-n10tcp-13` | No literal lead | NEEDS VERIFICATION |
| Unicast | `networking-devices#hub-switch-router`, `n10-tcpip#objectives` | `fc-n2`, `q-171` | `networking-devices-switching.html` | NEEDS VERIFICATION |
| Multicast | `n10-tcpip#objectives`, `n10-tcpip#ip-types` | `q-n10tcp-14` | No literal lead | NEEDS VERIFICATION |
| Anycast | `n10-tcpip#objectives`, `n10-tcpip#ip-types` | `q-n10tcp-14` | No literal lead | NEEDS VERIFICATION |
| Broadcast | `networking-dns-dhcp#vlan-vpn`, `networking-devices#hub-switch-router` | `fc-n3`, `q-174` | `core1-vlan-vpn-dhcp-pbq.html` | NEEDS VERIFICATION |

### 1.5 — evidence leads (S1 p6)
Task verb: compare. Mapped labs: `dhcp-relay-three-site`, `cant-reach-website`, `core1-soho-configuration-practice`. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| 802.11 | No literal lead in mapped notes | `q-cls-065` | No literal lead | NEEDS VERIFICATION |
| Cellular | No literal lead in mapped notes | `q-156` | No literal lead | NEEDS VERIFICATION |
| Satellite | `networking-cabling#fiber-coax` | No literal lead | `networking-cabling-connectors.html` | NEEDS VERIFICATION |
| 802.3 | No literal lead in mapped notes | `q-cls-065` | No literal lead | NEEDS VERIFICATION |
| Single-mode fiber | `networking-cabling#fiber-coax`, `networking-fundamentals#media-and-standards` | `fc-cls-14`, `q-153` | `networking-cabling-pick-cable.html` | NEEDS VERIFICATION |
| Multimode fiber | `networking-cabling#fiber-coax` | `fc-65`, `q-61` | `networking-cabling-pick-cable.html` | NEEDS VERIFICATION |
| DAC | `n10-transceivers-fiber#1-5-transceivers`, `n10-transceivers-fiber#1-5-dac` | `fc-n10tx-03`, `q-n10tx-10` | No literal lead | NEEDS VERIFICATION |
| Twinaxial | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Coaxial | `networking-cabling#fiber-coax`, `n10-transceivers-fiber#1-5-fiber` | `q-148` | No literal lead | NEEDS VERIFICATION |
| Cable speeds | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Plenum | `networking-cabling#plenum-and-link-lights` | `fc-as1201-12`, `q-152` | No literal lead | NEEDS VERIFICATION |
| Non-plenum | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Ethernet transceiver | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Fibre Channel | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| SFP | `n10-transceivers-fiber#1-5-transceivers`, `n10-transceivers-fiber#1-5-dac` | `fc-n10tx-01`, `q-n10tx-01` | No literal lead | NEEDS VERIFICATION |
| QSFP | `n10-transceivers-fiber#1-5-transceivers` | `fc-n10tx-02`, `q-n10tx-02` | No literal lead | NEEDS VERIFICATION |
| SC | `networking-cabling#fiber-coax`, `n10-transceivers-fiber#1-5-fiber` | `fc-cls-13`, `q-63` | `n10-osi-cable-picker.html` | NEEDS VERIFICATION |
| LC | `networking-cabling#fiber-coax`, `n10-transceivers-fiber#1-5-fiber` | `fc-n10tx-08`, `q-63` | `networking-cabling-connectors.html` | NEEDS VERIFICATION |
| ST | `networking-cabling#fiber-coax`, `n10-transceivers-fiber#1-5-fiber` | `fc-n10tx-08`, `q-63` | `n10-osi-dod-stack.html` | NEEDS VERIFICATION |
| MPO | `n10-transceivers-fiber#1-5-fiber` | `fc-n10tx-08`, `q-n10tx-22` | No literal lead | NEEDS VERIFICATION |
| RJ11 | No literal lead in mapped notes | `q-148` | No literal lead | NEEDS VERIFICATION |
| RJ45 | `n10-transceivers-fiber#1-5-transceivers`, `n10-transceivers-fiber#1-5-dac` | `q-148` | No literal lead | NEEDS VERIFICATION |
| F-type | `n10-transceivers-fiber#1-5-fiber` | `fc-cls-13`, `q-148` | No literal lead | NEEDS VERIFICATION |
| BNC | `networking-cabling#fiber-coax`, `n10-transceivers-fiber#1-5-fiber` | `fc-cls-13`, `q-63` | `networking-cabling-connectors.html` | NEEDS VERIFICATION |

### 1.6 — evidence leads (S1 p6)
Task verb: compare. Mapped labs: `dhcp-relay-three-site`, `cant-reach-website`. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| Mesh | `networking-devices#topologies`, `n10-topologies-architecture#1-6-topologies` | `fc-n10top-01`, `q-181` | `networking-devices-overview.html` | NEEDS VERIFICATION |
| Hybrid topology | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Star / hub-spoke | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Spine-leaf | `n10-topologies-architecture#1-6-architecture` | `fc-n10top-06`, `q-n10top-14` | No literal lead | NEEDS VERIFICATION |
| Point-to-point | `n10-topologies-architecture#1-6-types` | `q-n10top-27` | No literal lead | NEEDS VERIFICATION |
| Hierarchical core | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Distribution | `n10-topologies-architecture#1-6-architecture` | `fc-n10top-04`, `q-n10top-11` | No literal lead | NEEDS VERIFICATION |
| Access tier | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Collapsed core | `n10-topologies-architecture#1-6-architecture` | `fc-n10top-05`, `q-n10top-14` | No literal lead | NEEDS VERIFICATION |
| North-south | `n10-topologies-architecture#1-6-architecture` | `fc-n10top-07`, `q-n10top-19` | No literal lead | NEEDS VERIFICATION |
| East-west | `n10-topologies-architecture#1-6-architecture` | `fc-n10top-07`, `q-n10top-19` | No literal lead | NEEDS VERIFICATION |

### 1.7 — evidence leads (S1 p6)
Task verb: configure/select/troubleshoot scenarios. Mapped labs: `core1-soho-configuration-practice`. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| Public IPv4 | No literal lead in mapped notes | No literal lead | `n10-ch7-ipv6-types.html` | NEEDS VERIFICATION |
| Private IPv4 | No literal lead in mapped notes | `q-n10c7-25` | No literal lead | NEEDS VERIFICATION |
| APIPA | `n10-ch7#objectives`, `n10-ch7#public-private` | `fc-n10c7-05`, `q-n10c8-13` | `n10-ch7-address-identifier.html` | NEEDS VERIFICATION |
| RFC1918 | `n10-ch7#objectives`, `n10-ch7#public-private` | `fc-n10c7-04`, `q-n10c7-17` | `n10-ch7-address-identifier.html` | NEEDS VERIFICATION |
| Loopback / localhost | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| VLSM | `n10-ch7#objectives`, `n10-ch7#choosing-private` | `fc-n10c8-15`, `q-n10c8-12` | `n10-ch7-chapter-map.html` | NEEDS VERIFICATION |
| CIDR | `n10-ch7#objectives`, `n10-ch7#choosing-private` | `fc-n10c8-14`, `q-n10c8-11` | `n10-ch7-chapter-map.html` | NEEDS VERIFICATION |
| Class A | `n10-ch7#public-private`, `n10-ch7#choosing-private` | `fc-n10c7-01`, `q-n10c8-10` | `n10-ch7-address-identifier.html` | NEEDS VERIFICATION |
| Class B | `n10-ch7#public-private`, `n10-ch7#written-labs` | `fc-n10c7-02`, `q-n10c8-10` | `n10-ch7-address-identifier.html` | NEEDS VERIFICATION |
| Class C | `n10-ch7#public-private`, `n10-ch7#choosing-private` | `fc-n10c7-03`, `q-n10c8-06` | `n10-ch7-address-identifier.html` | NEEDS VERIFICATION |
| Class D | `n10-ch7#address-classes` | `fc-n10c7-06`, `q-n10c7-03` | `n10-ch7-address-identifier.html` | NEEDS VERIFICATION |
| Class E | No literal lead in mapped notes | `fc-n10c7-06` | `n10-ch7-address-identifier.html` | NEEDS VERIFICATION |

### 1.8 — evidence leads (S1 p7)
Task verb: explain/summarize. Mapped labs: `dhcp-relay-three-site`, `cant-reach-website`. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| SDN | `n10-sdn-overlay#1-8-sdn` | `fc-n10sdn-01`, `q-n10sdn-01` | No literal lead | NEEDS VERIFICATION |
| SD-WAN | `networking-devices#wan-mpls-sdwan`, `n10-sdn-overlay#1-8-sdn` | `fc-n11`, `q-177` | `networking-devices-overview.html` | NEEDS VERIFICATION |
| Application aware | `n10-sdn-overlay#1-8-sdn` | `fc-n10sdn-02`, `q-n10sdn-05` | No literal lead | NEEDS VERIFICATION |
| Zero-touch provisioning | `n10-sdn-overlay#1-8-sdn` | `fc-n10sdn-02`, `q-n10sdn-06` | No literal lead | NEEDS VERIFICATION |
| Transport agnostic | `n10-sdn-overlay#1-8-sdn` | `fc-n10sdn-02`, `q-n10sdn-07` | No literal lead | NEEDS VERIFICATION |
| Central policy management | `n10-sdn-overlay#1-8-sdn` | `fc-n10sdn-02`, `q-n10sdn-08` | No literal lead | NEEDS VERIFICATION |
| VXLAN | `n10-sdn-overlay#1-8-vxlan` | `fc-n10sdn-04`, `q-n10sdn-05` | No literal lead | NEEDS VERIFICATION |
| DCI | `n10-sdn-overlay#1-8-vxlan` | `fc-n10sdn-08`, `q-n10sdn-20` | No literal lead | NEEDS VERIFICATION |
| Layer 2 encapsulation | `n10-sdn-overlay#1-8-sdn`, `n10-sdn-overlay#1-8-vxlan` | `fc-n10sdn-04`, `q-n10c7-23` | No literal lead | NEEDS VERIFICATION |
| ZTA | `n10-zerotrust-iac#1-8-zta` | No literal lead | No literal lead | NEEDS VERIFICATION |
| Policy-based authentication | `n10-zerotrust-iac#1-8-zta` | No literal lead | No literal lead | NEEDS VERIFICATION |
| Authorization | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Least privilege | `n10-zerotrust-iac#1-8-zta` | `fc-n10zt-01`, `q-n10zt-02` | No literal lead | NEEDS VERIFICATION |
| SASE | `n10-zerotrust-iac#1-8-sase` | `fc-n10zt-03`, `q-n10zt-09` | No literal lead | NEEDS VERIFICATION |
| SSE | `n10-zerotrust-iac#1-8-sase` | `fc-n10zt-03`, `q-n10zt-09` | No literal lead | NEEDS VERIFICATION |
| IaC | `n10-zerotrust-iac#1-8-iac` | `fc-n10zt-01`, `q-n10zt-01` | No literal lead | NEEDS VERIFICATION |
| Playbooks | No literal lead in mapped notes | `q-n10zt-23` | No literal lead | NEEDS VERIFICATION |
| Templates | No literal lead in mapped notes | `q-n10zt-23` | No literal lead | NEEDS VERIFICATION |
| Reusable tasks | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Configuration drift | `n10-zerotrust-iac#1-8-iac` | `q-n10zt-20` | No literal lead | NEEDS VERIFICATION |
| Compliance | `n10-zerotrust-iac#1-8-iac` | `fc-n10zt-04`, `q-n10zt-08` | No literal lead | NEEDS VERIFICATION |
| Upgrades | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Dynamic inventories | `n10-zerotrust-iac#1-8-iac` | `fc-n10zt-04`, `q-n10zt-19` | No literal lead | NEEDS VERIFICATION |
| Version control | `n10-zerotrust-iac#1-8-iac` | `q-n10zt-22` | No literal lead | NEEDS VERIFICATION |
| Central repository | `n10-zerotrust-iac#1-8-iac` | `fc-n10zt-06` | No literal lead | NEEDS VERIFICATION |
| Conflict identification | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Branching | No literal lead in mapped notes | `q-n10zt-20` | No literal lead | NEEDS VERIFICATION |
| IPv6 exhaustion mitigation | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Tunneling | `n10-ch7#objectives`, `n10-ch7#ipv6-compat` | `fc-n10c7-09`, `q-n10zt-24` | `n10-ch7-chapter-map.html` | NEEDS VERIFICATION |
| Dual stack | `n10-ch7#objectives`, `n10-ch7#ipv6-compat` | `fc-n10c7-09`, `q-n10sdn-06` | `n10-ch7-chapter-map.html` | NEEDS VERIFICATION |
| NAT64 | `n10-ch7#objectives`, `n10-ch7#ipv6-compat` | `fc-n10c7-09`, `q-n10c7-02` | `n10-ch7-chapter-map.html` | NEEDS VERIFICATION |

### 2.1 — evidence leads (S1 p8)
Task verb: explain/summarize. Mapped labs: `inter-vlan-l3-switch`, `core1-soho-configuration-practice`. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| Static routing | `n10-ch10#static-default-dynamic`, `n10-ch9#static-dynamic` | `q-n10c9-07` | `ch10-dynamic-failover.html` | NEEDS VERIFICATION |
| BGP | `n10-ch10#protocol-types`, `n10-ch10#real-world-snmp-traps` | `fc-n10c9-08`, `q-n10c9-08` | `ch10-autonomous-systems.html` | NEEDS VERIFICATION |
| EIGRP | `n10-ch10#protocol-types`, `n10-ch10#administrative-distance` | `fc-n10c9-08`, `q-n10c10-07` | `ch10-admin-distance.html` | NEEDS VERIFICATION |
| OSPF | `n10-ch10#protocol-types`, `n10-ch10#administrative-distance` | `fc-n10c9-08`, `q-n10c9-08` | `ch10-admin-distance.html` | NEEDS VERIFICATION |
| Administrative distance | `n10-ch10#administrative-distance`, `n10-ch10#rip-versions` | `fc-n10c9-09`, `q-n10c9-09` | `ch10-admin-distance.html` | NEEDS VERIFICATION |
| Prefix length | `n10-ch9#route-selection` | `q-n10c9-17` | `ch9-as-route-selection.html` | NEEDS VERIFICATION |
| Metric | `n10-ch10#administrative-distance`, `n10-ch10#metrics` | `fc-n10c9-09`, `q-n10c9-17` | `ch10-admin-distance.html` | NEEDS VERIFICATION |
| NAT | `n10-ch8#objectives`, `n10-ch8#nat-intro` | `fc-n10c9-02`, `q-n10c8-16` | `ch10-protocol-map.html` | NEEDS VERIFICATION |
| PAT | `n10-ch8#objectives`, `n10-ch8#nat-intro` | `fc-n10c8-16`, `q-n10c8-13` | `n10-ch8-chapter-map.html` | NEEDS VERIFICATION |
| FHRP | `n10-ch10#fhrp-virtual-ip` | `fc-n10fl-01`, `q-n10fhrp-01` | No literal lead | NEEDS VERIFICATION |
| VIP | `n10-ch10#fhrp-virtual-ip` | No literal lead | No literal lead | NEEDS VERIFICATION |
| Subinterfaces | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |

### 2.2 — evidence leads (S1 p8)
Task verb: configure/select/troubleshoot scenarios. Mapped labs: `inter-vlan-l3-switch`, `defensive-evidence-triage`. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| VLAN | `n10-l2-l3-switching#objectives`, `n10-l2-l3-switching#three-devices` | `fc-n10c11-02`, `q-n10c11-03` | `ch11-access-trunk.html` | NEEDS VERIFICATION |
| VLAN database | `n10-l2-l3-switching#objectives`, `n10-ch11#vtp` | `fc-n10c11-10`, `q-n10c11-17` | `ch11-chapter-map.html` | NEEDS VERIFICATION |
| SVI | `n10-l2-l3-switching#objectives`, `n10-l2-l3-switching#layer3-switching` | `fc-n10c11-09`, `q-n10c11-13` | `ch11-chapter-map.html` | NEEDS VERIFICATION |
| Native VLAN | `n10-ch11#access-trunk`, `n10-ch11#802-1q` | `fc-n10c11-06`, `q-n10c11-08` | `ch11-access-trunk.html` | NEEDS VERIFICATION |
| Voice VLAN | No literal lead in mapped notes | `q-n10c11-08` | No literal lead | NEEDS VERIFICATION |
| 802.1Q | `n10-l2-l3-switching#objectives`, `n10-l2-l3-switching#layer2-forwarding` | `fc-n10c11-07`, `q-n10c11-08` | `ch11-access-trunk.html` | NEEDS VERIFICATION |
| Link aggregation | `n10-ch11#link-aggregation` | `fc-n10fl-04`, `q-n10lag-01` | No literal lead | NEEDS VERIFICATION |
| Speed | `n10-l2-l3-switching#l3-vs-router`, `n10-ch11#link-aggregation` | `q-n10c11-01` | `ch11-device-compare.html` | NEEDS VERIFICATION |
| Duplex | `n10-ch11#link-aggregation` | `q-n10lag-03` | `ch11-domain-counts.html` | NEEDS VERIFICATION |
| Spanning tree | `n10-ch11#stp`, `n10-ch11#key-terms` | `q-cls-093` | `ch11-chapter-map.html` | NEEDS VERIFICATION |
| MTU | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Jumbo frames | `n10-ch11#port-security` | `q-n10c11-14` | `ch11-chapter-map.html` | NEEDS VERIFICATION |

### 2.3 — evidence leads (S1 p9)
Task verb: configure/select/troubleshoot scenarios. Mapped labs: none. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| Channel width | No literal lead in mapped notes | `q-n10wl-02` | No literal lead | NEEDS VERIFICATION |
| Non-overlapping channels | No literal lead in mapped notes | `fc-n10wireless-devices-01`, `q-n10wireless-devices-01` | No literal lead | NEEDS VERIFICATION |
| Regulatory impacts | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| 802.11h | `n10-wireless-standards-security#2-3-bands` | `q-n10wl-07` | No literal lead | NEEDS VERIFICATION |
| 2.4GHz | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| 5GHz | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| 6GHz | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Band steering | `n10-wireless-standards-security#2-3-bands` | `q-n10wl-03` | No literal lead | NEEDS VERIFICATION |
| SSID | `n10-wireless-standards-security#2-3-ssid`, `n10-wireless-standards-security#2-3-security` | `fc-n10wl-08`, `q-n10wl-12` | No literal lead | NEEDS VERIFICATION |
| BSSID | `n10-wireless-standards-security#2-3-ssid` | `fc-n10wl-08`, `q-n10wl-24` | No literal lead | NEEDS VERIFICATION |
| ESSID | `n10-wireless-standards-security#2-3-ssid` | `fc-n10wl-08`, `q-n10wl-24` | No literal lead | NEEDS VERIFICATION |
| Mesh networks | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Ad hoc | `n10-wireless-standards-security#2-3-ssid` | `q-n10wireless-devices-03` | No literal lead | NEEDS VERIFICATION |
| Point-to-point | `n10-wireless-standards-security#2-3-ssid`, `n10-wireless-standards-security#2-3-antennas` | `fc-n10wl-14`, `q-n10wireless-devices-04` | No literal lead | NEEDS VERIFICATION |
| Infrastructure WLAN | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| WPA2 | `n10-wireless-standards-security#2-3-security`, `n10-wireless-standards-security#2-3-trouble` | `fc-n10wl-10`, `q-n10wireless-devices-02` | No literal lead | NEEDS VERIFICATION |
| WPA3 | `n10-wireless-standards-security#2-3-security`, `n10-wireless-standards-security#2-3-trouble` | `fc-n10wl-10`, `q-n10wl-28` | No literal lead | NEEDS VERIFICATION |
| Guest networks | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Captive portals | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| PSK | `n10-wireless-standards-security#2-3-security` | `fc-n10wireless-devices-02`, `q-n10wireless-devices-02` | No literal lead | NEEDS VERIFICATION |
| Enterprise authentication | `n10-wireless-standards-security#2-3-ssid` | No literal lead | No literal lead | NEEDS VERIFICATION |
| Omnidirectional | `n10-wireless-standards-security#2-3-antennas` | `q-n10wireless-devices-04` | No literal lead | NEEDS VERIFICATION |
| Directional antennas | `n10-wireless-standards-security#2-3-ssid` | `q-n10wireless-devices-04` | No literal lead | NEEDS VERIFICATION |
| Autonomous AP | `n10-wireless-standards-security#2-3-controllers` | `fc-n10wl-15`, `q-n10wireless-devices-03` | No literal lead | NEEDS VERIFICATION |
| Lightweight AP | `n10-wireless-standards-security#2-3-controllers` | `fc-n10wl-15`, `q-n10wireless-devices-03` | No literal lead | NEEDS VERIFICATION |

### 2.4 — evidence leads (S1 p9)
Task verb: explain/summarize. Mapped labs: none. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| IDF | `n10-physical-install-factors#2-4-rooms` | `fc-n10ph-02`, `q-n10physical-installation-03` | No literal lead | NEEDS VERIFICATION |
| MDF | `n10-physical-install-factors#2-4-rooms` | `fc-n10physical-installation-01`, `q-n10physical-installation-01` | No literal lead | NEEDS VERIFICATION |
| Rack size | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Port-side exhaust / intake | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Patch panel | No literal lead in mapped notes | `q-n10physical-installation-01` | No literal lead | NEEDS VERIFICATION |
| Fiber distribution panel | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Lockable | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| UPS | `n10-physical-install-factors#2-4-rooms`, `n10-physical-install-factors#2-4-power-cooling` | `fc-n10physical-installation-02`, `q-n10physical-installation-01` | No literal lead | NEEDS VERIFICATION |
| PDU | `n10-physical-install-factors#2-4-power-cooling` | `fc-n10physical-installation-02`, `q-n10physical-installation-01` | No literal lead | NEEDS VERIFICATION |
| Power load | `n10-physical-install-factors#2-4-power-cooling` | No literal lead | No literal lead | NEEDS VERIFICATION |
| Voltage | No literal lead in mapped notes | `q-n10ph-27` | No literal lead | NEEDS VERIFICATION |
| Humidity | `n10-physical-install-factors#2-4-power-cooling` | `fc-n10ph-08`, `q-n10ph-19` | No literal lead | NEEDS VERIFICATION |
| Fire suppression | `n10-physical-install-factors#2-4-power-cooling` | `fc-n10ph-09`, `q-n10physical-installation-02` | No literal lead | NEEDS VERIFICATION |
| Temperature | `n10-physical-install-factors#2-4-power-cooling` | `q-n10ph-07` | No literal lead | NEEDS VERIFICATION |

### 3.1 — evidence leads (S1 p10)
Task verb: explain/summarize. Mapped labs: none. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| Physical diagrams | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Logical diagrams | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Rack diagrams | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Cable maps | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Layer 1 diagrams | `n10-org-documentation#3-1-diagrams` | `fc-n10org-03`, `q-n10org-01` | No literal lead | NEEDS VERIFICATION |
| Layer 2 diagrams | `n10-org-documentation#3-1-diagrams` | `fc-n10org-03`, `q-n10org-01` | No literal lead | NEEDS VERIFICATION |
| Layer 3 diagrams | `n10-org-documentation#3-1-diagrams` | `fc-n10org-03`, `q-n10org-01` | No literal lead | NEEDS VERIFICATION |
| Hardware inventory | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Software inventory | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Licensing | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Warranty support | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| IPAM | `n10-org-documentation#3-1-records` | `fc-n10org-05`, `q-n10org-02` | No literal lead | NEEDS VERIFICATION |
| SLA | `n10-org-documentation#3-1-records` | `fc-n10org-06`, `q-n10org-06` | No literal lead | NEEDS VERIFICATION |
| Wireless survey / heat map | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| EOL | `n10-org-change-config#3-1-lifecycle` | `fc-n10chg-01` | No literal lead | NEEDS VERIFICATION |
| EOS | `n10-org-change-config#3-1-lifecycle` | `fc-n10chg-01` | No literal lead | NEEDS VERIFICATION |
| Patches | `n10-org-change-config#3-1-lifecycle` | `fc-n10chg-01`, `q-n10chg-01` | No literal lead | NEEDS VERIFICATION |
| Bug fixes | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| OS management | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Firmware | `n10-org-documentation#3-1-records`, `n10-org-change-config#3-1-lifecycle` | `q-n10chg-06` | No literal lead | NEEDS VERIFICATION |
| Decommissioning | `n10-org-change-config#3-1-lifecycle` | `fc-n10chg-02`, `q-n10chg-01` | No literal lead | NEEDS VERIFICATION |
| Change request tracking | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Service request | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Production configuration | No literal lead in mapped notes | `fc-n10chg-05`, `q-n10chg-16` | No literal lead | NEEDS VERIFICATION |
| Backup configuration | No literal lead in mapped notes | `fc-n10chg-06`, `q-n10chg-16` | No literal lead | NEEDS VERIFICATION |
| Baseline / golden configuration | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |

### 3.2 — evidence leads (S1 p10)
Task verb: configure/select/troubleshoot scenarios. Mapped labs: `defensive-evidence-triage`. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| SNMP traps | `n10-ch10#real-world-snmp-traps`, `n10-security#objectives` | `q-n10sec-06` | No literal lead | NEEDS VERIFICATION |
| MIB | `n10-security#objectives`, `n10-monitoring-technologies#3-2-snmp` | `fc-n10mon-02`, `q-n10mon-01` | No literal lead | NEEDS VERIFICATION |
| SNMP v2c | `n10-security#objectives` | No literal lead | No literal lead | NEEDS VERIFICATION |
| SNMP v3 | `n10-security#snmp-security` | No literal lead | No literal lead | NEEDS VERIFICATION |
| Community strings | `n10-ch10#real-world-snmp-traps`, `n10-security#objectives` | `fc-n10mon-03`, `q-n10sec-05` | No literal lead | NEEDS VERIFICATION |
| SNMP authentication | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Flow data | `n10-monitoring-technologies#3-2-traffic` | No literal lead | No literal lead | NEEDS VERIFICATION |
| Packet capture | `n10-monitoring-technologies#3-2-traffic` | `fc-n10mon-05`, `q-n10mon-07` | No literal lead | NEEDS VERIFICATION |
| Baseline metrics | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Anomaly alerts | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Syslog collector | No literal lead in mapped notes | `q-n10mon-02` | No literal lead | NEEDS VERIFICATION |
| SIEM | `n10-monitoring-technologies#3-2-logs` | `fc-n10mon-09`, `q-n10mon-29` | No literal lead | NEEDS VERIFICATION |
| API integration | `n10-monitoring-technologies#3-2-baselines` | No literal lead | No literal lead | NEEDS VERIFICATION |
| Port mirroring | `n10-monitoring-technologies#3-2-traffic` | `q-n10mon-15` | No literal lead | NEEDS VERIFICATION |
| Ad hoc discovery | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Scheduled discovery | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Traffic analysis | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Performance monitoring | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Availability monitoring | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Configuration monitoring | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |

### 3.3 — evidence leads (S1 p11)
Task verb: explain/summarize. Mapped labs: `two-subnet-lan`. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| RPO | `n10-disaster-recovery#3-3-metrics`, `n10-disaster-recovery#3-3-sites` | `fc-n10dr-01`, `q-n10dr-03` | No literal lead | NEEDS VERIFICATION |
| RTO | `n10-disaster-recovery#3-3-metrics`, `n10-disaster-recovery#3-3-sites` | `fc-n10dr-01`, `q-n10dr-15` | No literal lead | NEEDS VERIFICATION |
| MTTR | `n10-disaster-recovery#3-3-metrics` | `fc-n10dr-02`, `q-n10dr-08` | No literal lead | NEEDS VERIFICATION |
| MTBF | `n10-disaster-recovery#3-3-metrics` | `fc-n10dr-02`, `q-n10dr-07` | No literal lead | NEEDS VERIFICATION |
| Cold site | `n10-disaster-recovery#3-3-sites` | `q-n10dr-03` | No literal lead | NEEDS VERIFICATION |
| Warm site | `n10-disaster-recovery#3-3-sites` | `q-n10dr-12` | No literal lead | NEEDS VERIFICATION |
| Hot site | `n10-disaster-recovery#3-3-sites` | `fc-n10dr-04`, `q-n10dr-09` | No literal lead | NEEDS VERIFICATION |
| Active-active | `n10-disaster-recovery#3-3-ha` | `fc-n10dr-07`, `q-n10dr-15` | No literal lead | NEEDS VERIFICATION |
| Active-passive | `n10-disaster-recovery#3-3-ha` | `fc-n10dr-06`, `q-n10dr-18` | No literal lead | NEEDS VERIFICATION |
| Tabletop | `n10-disaster-recovery#3-3-testing` | `fc-n10dr-08`, `q-n10dr-18` | No literal lead | NEEDS VERIFICATION |
| Validation tests | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |

### 3.4 — evidence leads (S1 p11)
Task verb: implement scenarios. Mapped labs: `two-subnet-lan`, `dhcp-relay-three-site`, `cant-reach-website`, `defensive-evidence-triage`, `core1-soho-configuration-practice`. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| DHCP reservations | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| DHCP scope | No literal lead in mapped notes | `q-c1miss-18` | No literal lead | NEEDS VERIFICATION |
| Lease time | `networking-dns-dhcp#dhcp`, `n10-dhcp-ipam-time#3-4-dhcp` | `q-c1miss-19` | No literal lead | NEEDS VERIFICATION |
| DHCP options | No literal lead in mapped notes | `fc-n10dhcp-08`, `q-n10dhcp-15` | No literal lead | NEEDS VERIFICATION |
| Relay / IP helper | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Exclusions | `networking-dns-dhcp#dhcp` | `q-c1miss-17` | No literal lead | NEEDS VERIFICATION |
| SLAAC | `n10-ch7#objectives`, `n10-ch7#slaac-eui64` | `fc-n10dhcp-09`, `q-n10c7-02` | `n10-ch7-chapter-map.html` | NEEDS VERIFICATION |
| DNSSEC | `n10-dns-records-security#3-4-dns-security` | `fc-n10dns-12`, `q-n10dns-05` | No literal lead | NEEDS VERIFICATION |
| DoH | `n10-dns-records-security#3-4-dns-security` | `fc-n10dns-13`, `q-n10dns-22` | No literal lead | NEEDS VERIFICATION |
| DoT | `n10-dns-records-security#3-4-records`, `n10-dns-records-security#3-4-dns-security` | `fc-n10dns-13`, `q-n10dns-30` | No literal lead | NEEDS VERIFICATION |
| A record | `n10-dns-records-security#3-4-records` | `fc-cls-17`, `q-cls-079` | `networking-dns-dhcp-records.html` | NEEDS VERIFICATION |
| AAAA | `networking-dns-dhcp#dns`, `n10-dns-records-security#3-4-records` | `fc-48`, `q-42` | `networking-dns-dhcp-dora.html` | NEEDS VERIFICATION |
| CNAME | `networking-dns-dhcp#dns`, `n10-dns-records-security#3-4-records` | `fc-n10dns-03`, `q-42` | `networking-dns-dhcp-forwarder-failure.html` | NEEDS VERIFICATION |
| MX | `networking-dns-dhcp#dns`, `n10-dns-records-security#3-4-records` | `fc-n10dns-04`, `q-42` | `networking-dns-dhcp-forwarder-failure.html` | NEEDS VERIFICATION |
| TXT | `networking-dns-dhcp#dns`, `n10-dns-records-security#3-4-records` | `fc-n10dns-05`, `q-n10dns-08` | `networking-dns-dhcp-forwarder-failure.html` | NEEDS VERIFICATION |
| NS record | No literal lead in mapped notes | `q-n10dns-17` | No literal lead | NEEDS VERIFICATION |
| PTR | `networking-dns-dhcp#dns`, `n10-dns-records-security#3-4-records` | `fc-cls-17`, `q-cls-079` | `networking-dns-dhcp-forwarder-failure.html` | NEEDS VERIFICATION |
| Forward zone | `n10-dns-records-security#3-4-zones` | `q-n10dns-20` | No literal lead | NEEDS VERIFICATION |
| Reverse zone | `n10-dns-records-security#3-4-records`, `n10-dns-records-security#3-4-zones` | `fc-n10dns-07`, `q-n10dns-10` | No literal lead | NEEDS VERIFICATION |
| Authoritative | `n10-dns-records-security#3-4-records`, `n10-dns-records-security#3-4-zones` | `q-n10dns-14` | No literal lead | NEEDS VERIFICATION |
| Non-authoritative | `n10-dns-records-security#3-4-zones` | `q-n10dns-26` | No literal lead | NEEDS VERIFICATION |
| Primary DNS | No literal lead in mapped notes | `q-n10dhcp-16` | No literal lead | NEEDS VERIFICATION |
| Secondary DNS | No literal lead in mapped notes | `q-n10dns-21` | No literal lead | NEEDS VERIFICATION |
| Recursive DNS | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Hosts file | `n10-dns-records-security#3-4-zones` | `q-n10dns-20` | No literal lead | NEEDS VERIFICATION |
| NTP | `networking-dns-dhcp#network-servers`, `n10-dhcp-ipam-time#3-4-dhcp` | `fc-as1201-15`, `q-as1201-35` | No literal lead | NEEDS VERIFICATION |
| PTP | `n10-dhcp-ipam-time#3-4-time` | `fc-n10dhcp-13`, `q-n10dhcp-38` | No literal lead | NEEDS VERIFICATION |
| NTS | `n10-dhcp-ipam-time#3-4-time` | `fc-n10dhcp-13`, `q-n10dhcp-42` | No literal lead | NEEDS VERIFICATION |

### 3.5 — evidence leads (S1 p11)
Task verb: compare. Mapped labs: none. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| Site-to-site VPN | No literal lead in mapped notes | `q-n10access-management-04` | No literal lead | NEEDS VERIFICATION |
| Client-to-site VPN | No literal lead in mapped notes | `q-n10acc-06` | No literal lead | NEEDS VERIFICATION |
| Clientless | `n10-remote-access-methods#3-5-vpn` | `fc-n10acc-01`, `q-n10access-management-04` | No literal lead | NEEDS VERIFICATION |
| Split tunnel | `n10-remote-access-methods#3-5-vpn` | `fc-n10acc-02`, `q-n10access-management-04` | No literal lead | NEEDS VERIFICATION |
| Full tunnel | `n10-remote-access-methods#3-5-vpn` | `q-n10access-management-04` | No literal lead | NEEDS VERIFICATION |
| SSH | `n10-remote-access-methods#3-5-methods`, `n10-remote-access-methods#3-5-oob` | `fc-n10access-management-01`, `q-n10access-management-01` | No literal lead | NEEDS VERIFICATION |
| GUI | `n10-remote-access-methods#3-5-methods` | `fc-n10acc-04`, `q-n10acc-17` | No literal lead | NEEDS VERIFICATION |
| API | `n10-remote-access-methods#3-5-methods`, `n10-remote-access-methods#3-5-oob` | `fc-n10acc-04`, `q-n10acc-17` | No literal lead | NEEDS VERIFICATION |
| Console | `n10-remote-access-methods#3-5-methods`, `n10-remote-access-methods#3-5-oob` | `fc-n10acc-04`, `q-n10access-management-02` | No literal lead | NEEDS VERIFICATION |
| Jump host | No literal lead in mapped notes | `q-n10access-management-03` | No literal lead | NEEDS VERIFICATION |
| In-band | `n10-remote-access-methods#3-5-oob` | `fc-n10acc-06`, `q-n10acc-21` | No literal lead | NEEDS VERIFICATION |
| Out-of-band | `n10-remote-access-methods#3-5-oob` | `fc-n10access-management-02`, `q-n10access-management-02` | No literal lead | NEEDS VERIFICATION |

### 4.1 — evidence leads (S1 p12)
Task verb: explain/summarize. Mapped labs: `defensive-evidence-triage`. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| Data in transit | `n10-security#objectives`, `n10-security#keys-and-hashes` | `q-n10risk-02` | No literal lead | NEEDS VERIFICATION |
| Data at rest | `n10-security#keys-and-hashes` | `q-n10risk-02` | No literal lead | NEEDS VERIFICATION |
| PKI | `n10-security#objectives`, `n10-security#pki` | `q-n10sec-07` | No literal lead | NEEDS VERIFICATION |
| Self-signed | `n10-security#objectives`, `n10-security#pki` | `q-n10risk-11` | No literal lead | NEEDS VERIFICATION |
| IAM | `n10-security#objectives`, `n10-security#iam-terms` | `q-n10risk-15` | No literal lead | NEEDS VERIFICATION |
| MFA | `n10-security#objectives`, `n10-security#iam-terms` | No literal lead | No literal lead | NEEDS VERIFICATION |
| SSO | `n10-security#objectives`, `n10-security#iam-terms` | `q-n10sec-08` | No literal lead | NEEDS VERIFICATION |
| RADIUS | `n10-security#objectives`, `n10-security#aaa-protocols` | `fc-n10sec-04`, `q-n10risk-07` | `ch11-switch-learning.html` | NEEDS VERIFICATION |
| LDAP | `n10-security#objectives`, `n10-security#aaa-protocols` | `q-n10risk-07` | No literal lead | NEEDS VERIFICATION |
| SAML | `n10-security#objectives` | No literal lead | No literal lead | NEEDS VERIFICATION |
| TACACS+ | `n10-security#objectives`, `n10-security#aaa-protocols` | `fc-n10sec-05`, `q-n10risk-07` | No literal lead | NEEDS VERIFICATION |
| Time-based authentication | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Authorization | `n10-security#objectives`, `n10-security#iam-terms` | `fc-n10sec-02`, `q-n10sec-01` | No literal lead | NEEDS VERIFICATION |
| Least privilege | `n10-security#objectives`, `n10-security#iam-terms` | `q-n10sec-02` | No literal lead | NEEDS VERIFICATION |
| Role-based access | `n10-security#iam-terms` | `q-n10sec-08` | No literal lead | NEEDS VERIFICATION |
| Geofencing | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Camera | No literal lead in mapped notes | `q-n10c21-14` | No literal lead | NEEDS VERIFICATION |
| Locks | `n10-risk-compliance#cia`, `n10-risk-compliance#defense-in-depth` | `q-n10c21-13` | No literal lead | NEEDS VERIFICATION |
| Honeypot | `n10-ch21#deception` | `fc-n10c21-19`, `q-n10c21-19` | No literal lead | NEEDS VERIFICATION |
| Honeynet | `n10-ch21#deception` | `fc-n10c21-19`, `q-n10c21-20` | No literal lead | NEEDS VERIFICATION |
| Risk | `n10-risk-compliance#objectives`, `n10-risk-compliance#threats-and-vulnerabilities` | `fc-n10risk-01`, `q-n10risk-01` | `ch21-defensive-study-guide.html` | NEEDS VERIFICATION |
| Vulnerability | `n10-risk-compliance#objectives`, `n10-risk-compliance#threats-and-vulnerabilities` | `fc-n10risk-02`, `q-n10risk-03` | No literal lead | NEEDS VERIFICATION |
| Exploit | `n10-risk-compliance#objectives`, `n10-risk-compliance#threats-and-vulnerabilities` | `fc-n10risk-02`, `q-n10risk-03` | No literal lead | NEEDS VERIFICATION |
| Threat | `n10-risk-compliance#objectives`, `n10-risk-compliance#threats-and-vulnerabilities` | `q-n10risk-03` | No literal lead | NEEDS VERIFICATION |
| Confidentiality | `n10-security#keys-and-hashes`, `n10-risk-compliance#cia` | `fc-n10sec-07`, `q-n10sec-02` | `ch21-defensive-study-guide.html` | NEEDS VERIFICATION |
| Integrity | `n10-security#keys-and-hashes`, `n10-risk-compliance#cia` | `fc-n10sec-07`, `q-n10sec-04` | `ch21-defensive-study-guide.html` | NEEDS VERIFICATION |
| Availability | `n10-risk-compliance#cia`, `n10-ch21#scope` | `fc-n10risk-01`, `q-n10risk-01` | No literal lead | NEEDS VERIFICATION |
| Data locality | `n10-risk-compliance#objectives`, `n10-risk-compliance#compliance` | No literal lead | No literal lead | NEEDS VERIFICATION |
| PCI DSS | `n10-risk-compliance#objectives`, `n10-risk-compliance#compliance` | No literal lead | No literal lead | NEEDS VERIFICATION |
| GDPR | `n10-risk-compliance#objectives`, `n10-risk-compliance#compliance` | `fc-n10risk-07`, `q-n10risk-13` | No literal lead | NEEDS VERIFICATION |
| IoT | `n10-ch21#rules-zones` | No literal lead | No literal lead | NEEDS VERIFICATION |
| IIoT | `n10-ch21#rules-zones` | No literal lead | No literal lead | NEEDS VERIFICATION |
| SCADA | `n10-ch21#rules-zones` | No literal lead | No literal lead | NEEDS VERIFICATION |
| ICS | `n10-ch21#rules-zones` | No literal lead | No literal lead | NEEDS VERIFICATION |
| OT | `n10-ch21#rules-zones` | `fc-n10c21-20` | `ch21-defensive-study-guide.html` | NEEDS VERIFICATION |
| Guest segmentation | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| BYOD | `n10-ch21#rules-zones` | No literal lead | No literal lead | NEEDS VERIFICATION |

### 4.2 — evidence leads (S1 p12)
Task verb: explain/summarize. Mapped labs: `defensive-evidence-triage`. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| DoS | `n10-ch21#availability` | `fc-n10c21-01`, `q-cls-096` | No literal lead | NEEDS VERIFICATION |
| DDoS | `n10-ch21#availability` | `fc-cls-19`, `q-cls-096` | No literal lead | NEEDS VERIFICATION |
| VLAN hopping | `n10-ch21#switching-attacks` | `q-n10c21-02` | No literal lead | NEEDS VERIFICATION |
| MAC flooding | `n10-ch21#switching-attacks` | `fc-n10c21-04`, `q-n10c21-02` | No literal lead | NEEDS VERIFICATION |
| ARP poisoning | `n10-ch21#arp`, `n10-ch21#on-path` | `fc-n10c21-06`, `q-cls-103` | `ch21-defensive-study-guide.html` | NEEDS VERIFICATION |
| ARP spoofing | `n10-ch21#arp` | `q-cls-103` | No literal lead | NEEDS VERIFICATION |
| DNS poisoning | No literal lead in mapped notes | `q-n10c21-10` | No literal lead | NEEDS VERIFICATION |
| DNS spoofing | `n10-ch21#dns` | `fc-n10c21-07`, `q-n10c21-03` | No literal lead | NEEDS VERIFICATION |
| Rogue DHCP | `n10-ch21#rogue-services` | `q-n10c21-09` | `ch21-defensive-study-guide.html` | NEEDS VERIFICATION |
| Rogue AP | `n10-ch21#rogue-services` | `fc-cls-20`, `q-cls-099` | No literal lead | NEEDS VERIFICATION |
| Evil twin | `n10-ch21#rogue-services`, `n10-ch21#on-path` | `fc-cls-20`, `q-cls-099` | `ch21-defensive-study-guide.html` | NEEDS VERIFICATION |
| On-path | `n10-ch21#on-path` | `fc-n10c21-12`, `q-cls-096` | No literal lead | NEEDS VERIFICATION |
| Phishing | `n10-ch21#on-path`, `n10-ch21#social-engineering` | `fc-n10c21-13`, `q-n10c21-02` | `ch21-defensive-study-guide.html` | NEEDS VERIFICATION |
| Dumpster diving | `n10-ch21#social-engineering` | `fc-n10c21-13`, `q-n10c21-03` | No literal lead | NEEDS VERIFICATION |
| Shoulder surfing | `n10-ch21#social-engineering` | `fc-n10c21-13`, `q-cls-101` | No literal lead | NEEDS VERIFICATION |
| Tailgating | `n10-ch21#social-engineering` | `fc-n10c21-13`, `q-n10c21-01` | No literal lead | NEEDS VERIFICATION |
| Malware | `n10-ch21#availability`, `n10-ch21#on-path` | `fc-cls-19`, `q-cls-101` | `ch21-defensive-study-guide.html` | NEEDS VERIFICATION |

### 4.3 — evidence leads (S1 p12)
Task verb: configure/select/troubleshoot scenarios. Mapped labs: `inter-vlan-l3-switch`, `defensive-evidence-triage`. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| Disable unused ports | `n10-ch21#admission`, `n10-security-features-43#4-3-zones` | `fc-n10sf-10`, `q-n10sf-16` | No literal lead | NEEDS VERIFICATION |
| Disable unused services | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Change default passwords | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| NAC | `n10-ch21#admission`, `n10-security-features-43#4-3-controls` | `fc-n10c21-15`, `q-n10c21-02` | No literal lead | NEEDS VERIFICATION |
| Port security | `n10-ch11#access-trunk`, `n10-ch11#port-security` | `fc-n10sf-02`, `q-n10c11-14` | `ch11-chapter-map.html` | NEEDS VERIFICATION |
| 802.1X | `n10-ch11#vlans`, `n10-ch11#port-security` | `fc-n10c21-15`, `q-n10c11-05` | `ch11-chapter-map.html` | NEEDS VERIFICATION |
| MAC filtering | `n10-ch21#admission` | `fc-n10c21-16` | No literal lead | NEEDS VERIFICATION |
| Key management | `n10-ch21#admission` | No literal lead | No literal lead | NEEDS VERIFICATION |
| ACL | `n10-ch21#rules-zones`, `n10-security-features-43#4-3-controls` | `fc-n10c21-17`, `q-n10c21-18` | `ch11-chapter-map.html` | NEEDS VERIFICATION |
| URL filtering | `n10-ch21#rules-zones` | No literal lead | No literal lead | NEEDS VERIFICATION |
| Content filtering | `n10-ch21#rules-zones`, `n10-security-features-43#4-3-zones` | No literal lead | No literal lead | NEEDS VERIFICATION |
| Trusted zones | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Untrusted zones | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Screened subnet | `n10-ch21#rules-zones`, `n10-security-features-43#4-3-zones` | `fc-n10sf-11` | No literal lead | NEEDS VERIFICATION |

### 5.1 — evidence leads (S1 p13)
Task verb: explain/summarize. Mapped labs: none. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| Gather information | `n10-troubleshoot-method#5-1-steps` | `fc-n10m-02`, `q-n10me-03` | No literal lead | NEEDS VERIFICATION |
| Question users | `n10-troubleshoot-method#5-1-steps` | `fc-n10m-02`, `q-n10m-13` | No literal lead | NEEDS VERIFICATION |
| Identify symptoms | `n10-troubleshoot-method#5-1-steps` | `fc-n10m-02` | No literal lead | NEEDS VERIFICATION |
| Determine changes | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Duplicate problem | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Handle problems individually | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Probable-cause theory | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Question obvious | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Top-down OSI | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Bottom-up OSI | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Divide-and-conquer | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Test theory | `core2-ch7#method-safe` | No literal lead | `core2-ch7-overview.html` | NEEDS VERIFICATION |
| Confirmed theory next steps | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| New theory or escalation | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Action plan | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Potential effects | `n10-troubleshoot-method#5-1-steps` | `fc-n10m-08`, `q-n10m-10` | No literal lead | NEEDS VERIFICATION |
| Implement or escalate | No literal lead in mapped notes | `q-n10m-02` | No literal lead | NEEDS VERIFICATION |
| Verify full functionality | No literal lead in mapped notes | `fc-n10me-07`, `q-n10m-02` | No literal lead | NEEDS VERIFICATION |
| Preventive measures | `n10-troubleshoot-method#5-1-steps`, `n10-troubleshoot-method#5-1-finish` | `fc-n10m-09`, `q-n10m-12` | No literal lead | NEEDS VERIFICATION |
| Document findings | `n10-troubleshoot-method#5-1-steps` | `fc-n10m-01`, `q-n10m-03` | No literal lead | NEEDS VERIFICATION |
| Document actions | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Document outcomes | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Document lessons throughout | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |

### 5.2 — evidence leads (S1 p13)
Task verb: configure/select/troubleshoot scenarios. Mapped labs: none. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| Single-mode mismatch | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Multimode mismatch | `n10-troubleshoot-physical#5-2-cable` | `fc-n10p-01` | No literal lead | NEEDS VERIFICATION |
| Category 5 | `n10-troubleshoot-physical#5-2-cable` | `q-cls-043` | No literal lead | NEEDS VERIFICATION |
| Category 6 | `n10-troubleshoot-physical#5-2-cable` | `q-cls-043` | No literal lead | NEEDS VERIFICATION |
| Category 7 | `n10-troubleshoot-physical#5-2-cable` | `q-cls-043` | No literal lead | NEEDS VERIFICATION |
| Category 8 | `n10-troubleshoot-physical#5-2-cable` | `q-cls-043` | No literal lead | NEEDS VERIFICATION |
| Shielded twisted pair | `n10-troubleshoot-physical#5-2-cable` | `fc-n10p-04`, `q-n10p-03` | No literal lead | NEEDS VERIFICATION |
| Unshielded twisted pair | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Crosstalk | `networking-cabling#fiber-coax`, `networking-cabling#tools-troubleshooting` | `fc-66`, `q-61` | `networking-cabling-overview.html` | NEEDS VERIFICATION |
| Interference | `n10-troubleshoot-physical#5-2-cable`, `n10-troubleshoot-physical#5-2-interface` | `fc-n10p-04`, `q-cls-034` | No literal lead | NEEDS VERIFICATION |
| Attenuation | `networking-cabling#twisted-pair`, `n10-troubleshoot-physical#5-2-cable` | `fc-61`, `q-n10p-04` | `networking-cabling-overview.html` | NEEDS VERIFICATION |
| Improper termination | `n10-osi-models#objectives`, `n10-troubleshoot-physical#5-2-cable` | `q-n10p-06` | No literal lead | NEEDS VERIFICATION |
| TX/RX transposed | `n10-osi-models#auto-mdix`, `n10-osi-models#exam-essentials` | `fc-n10p-05`, `q-n10osi-17` | `n10-osi-cable-picker.html` | NEEDS VERIFICATION |
| CRC counters | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Runts | `n10-troubleshoot-physical#5-2-interface` | `fc-n10p-07`, `q-n10p-09` | No literal lead | NEEDS VERIFICATION |
| Giants | `n10-troubleshoot-physical#5-2-interface` | `fc-n10p-08`, `q-n10p-09` | No literal lead | NEEDS VERIFICATION |
| Drops | `networking-cabling#fiber-coax`, `n10-troubleshoot-physical#5-2-interface` | `q-n10p-09` | `networking-cabling-connectors.html` | NEEDS VERIFICATION |
| Error disabled | `n10-troubleshoot-physical#5-2-interface` | `fc-n10p-09`, `q-n10p-02` | No literal lead | NEEDS VERIFICATION |
| Administratively down | `n10-troubleshoot-physical#5-2-interface` | `fc-n10p-10`, `q-n10p-01` | No literal lead | NEEDS VERIFICATION |
| Suspended | `n10-troubleshoot-physical#5-2-interface` | `fc-n10p-11`, `q-n10p-13` | No literal lead | NEEDS VERIFICATION |
| PoE budget | No literal lead in mapped notes | `q-n10p-07` | No literal lead | NEEDS VERIFICATION |
| PoE standard | `n10-troubleshoot-physical#5-2-hardware` | `q-n10p-15` | `networking-cabling-overview.html` | NEEDS VERIFICATION |
| Transceiver mismatch | `n10-troubleshoot-physical#5-2-hardware` | `q-n10p-16` | No literal lead | NEEDS VERIFICATION |
| Signal strength | `n10-troubleshoot-physical#5-2-hardware` | `q-n10p-05` | No literal lead | NEEDS VERIFICATION |

### 5.3 — evidence leads (S1 p13)
Task verb: configure/select/troubleshoot scenarios. Mapped labs: `inter-vlan-l3-switch`, `defensive-evidence-triage`, `core1-soho-configuration-practice`. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| STP loops | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Root bridge selection | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Port roles | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Port states | `n10-troubleshoot-services#5-3-stp` | `fc-n10s-06` | `ch11-chapter-map.html` | NEEDS VERIFICATION |
| Incorrect VLAN | `n10-troubleshoot-services#5-3-vlan-acl` | `fc-n10s-07`, `q-n10svc-01` | No literal lead | NEEDS VERIFICATION |
| ACL faults | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Routing table | `n10-ch11#admin-distance-slides`, `n10-ch9#static-dynamic` | `q-n10c9-04` | `ch9-36-steps.html` | NEEDS VERIFICATION |
| Default route | `n10-ch9#route-table`, `n10-troubleshoot-services#5-3-routing-ip` | `fc-n10c9-06`, `q-n10c9-06` | `ch9-route-table.html` | NEEDS VERIFICATION |
| Address pool exhaustion | `n10-troubleshoot-services#5-3-routing-ip` | `fc-n10s-10`, `q-n10s-01` | No literal lead | NEEDS VERIFICATION |
| Incorrect gateway | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Incorrect IP | `n10-troubleshoot-services#5-3-routing-ip` | No literal lead | No literal lead | NEEDS VERIFICATION |
| Duplicate IP | `n10-troubleshoot-services#5-3-routing-ip` | `fc-n10s-12`, `q-n10s-01` | No literal lead | NEEDS VERIFICATION |
| Incorrect subnet mask | `n10-troubleshoot-services#5-3-routing-ip` | `q-n10s-01` | No literal lead | NEEDS VERIFICATION |

### 5.4 — evidence leads (S1 p14)
Task verb: configure/select/troubleshoot scenarios. Mapped labs: none. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| Congestion | `n10-performance-troubleshooting#5-4-terms`, `n10-performance-troubleshooting#5-4-symptoms` | `fc-n10pf-01`, `q-n10w-08` | No literal lead | NEEDS VERIFICATION |
| Contention | `n10-performance-troubleshooting#5-4-terms`, `n10-performance-troubleshooting#5-4-symptoms` | `fc-n10pf-01`, `q-n10performance-04` | No literal lead | NEEDS VERIFICATION |
| Bottlenecking | `n10-performance-troubleshooting#5-4-wireless-b` | `q-n10w-04` | No literal lead | NEEDS VERIFICATION |
| Bandwidth / throughput capacity | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Latency | `n10-performance-troubleshooting#5-4-terms`, `n10-performance-troubleshooting#5-4-symptoms` | `fc-n10performance-01`, `q-n10performance-01` | No literal lead | NEEDS VERIFICATION |
| Packet loss | `n10-performance-troubleshooting#5-4-terms`, `n10-performance-troubleshooting#5-4-symptoms` | `fc-n10performance-01`, `q-n10performance-01` | No literal lead | NEEDS VERIFICATION |
| Jitter | `n10-performance-troubleshooting#5-4-terms`, `n10-performance-troubleshooting#5-4-symptoms` | `fc-n10performance-01`, `q-n10performance-01` | No literal lead | NEEDS VERIFICATION |
| Wireless interference | `n10-performance-troubleshooting#5-4-terms` | No literal lead | No literal lead | NEEDS VERIFICATION |
| Channel overlap | `n10-performance-troubleshooting#5-4-symptoms`, `n10-performance-troubleshooting#5-4-wireless-b` | `q-n10w-01` | No literal lead | NEEDS VERIFICATION |
| Signal degradation | `n10-performance-troubleshooting#5-4-wireless`, `n10-performance-troubleshooting#5-4-symptoms` | `fc-n10pf-10`, `q-n10w-13` | No literal lead | NEEDS VERIFICATION |
| Signal loss | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| Insufficient coverage | `n10-performance-troubleshooting#5-4-wireless`, `n10-performance-troubleshooting#5-4-symptoms` | No literal lead | No literal lead | NEEDS VERIFICATION |
| Client disassociation | `n10-performance-troubleshooting#5-4-wireless`, `n10-performance-troubleshooting#5-4-wireless-b` | `q-n10w-03` | No literal lead | NEEDS VERIFICATION |
| Roaming misconfiguration | `n10-performance-troubleshooting#5-4-wireless`, `n10-performance-troubleshooting#5-4-wireless-b` | `q-n10w-01` | No literal lead | NEEDS VERIFICATION |

### 5.5 — evidence leads (S1 p14)
Task verb: configure/select/troubleshoot scenarios. Mapped labs: none. No N10-tagged rapid-memory deck; topic games/written exercises remain separate candidates.

| Listed scope item | Candidate note section | Candidate card / question IDs | Candidate visual | Decision |
|---|---|---|---|---|
| Protocol analyzer | `n10-troubleshoot-tools#5-5-software` | `q-n10t-02` | No literal lead | NEEDS VERIFICATION |
| ping | `core2-ch7#cli-net`, `n10-troubleshoot-tools#5-5-software` | `q-34` | `core2-ch7-cli-network.html` | NEEDS VERIFICATION |
| traceroute | `n10-troubleshoot-tools#5-5-software`, `n10-troubleshoot-tools#5-5-scenarios` | `fc-n10t-09`, `q-n10t-07` | No literal lead | NEEDS VERIFICATION |
| tracert | `core2-ch7#cli-net`, `quick-reference#net-commands` | `fc-40`, `q-33` | `core2-ch7-cli-network.html` | NEEDS VERIFICATION |
| nslookup | `core2-ch7#cli-net`, `quick-reference#net-commands` | `fc-n10t-08`, `q-34` | `core2-ch7-cli-network.html` | NEEDS VERIFICATION |
| tcpdump | `n10-troubleshoot-tools#5-5-software` | `fc-n10t-07`, `q-n10t-07` | No literal lead | NEEDS VERIFICATION |
| dig | `n10-troubleshoot-tools#5-5-software`, `n10-troubleshoot-tools#5-5-scenarios` | `fc-n10t-08`, `q-n10t-10` | No literal lead | NEEDS VERIFICATION |
| netstat | `core2-ch7#cli-net`, `quick-reference#net-commands` | `fc-n10t-10`, `q-n10t-09` | `core2-ch7-cli-network.html` | NEEDS VERIFICATION |
| ip command | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| ifconfig | `n10-troubleshoot-tools#5-5-software` | `fc-n10t-12`, `q-n10t-14` | No literal lead | NEEDS VERIFICATION |
| ipconfig | `core2-ch7#cli-net`, `quick-reference#net-commands` | `fc-59`, `q-c2x-3-1-11` | `core2-ch7-cli-network.html` | NEEDS VERIFICATION |
| arp | `core2-ch7#cli-net`, `quick-reference#net-commands` | `fc-n10t-11`, `q-33` | `core2-ch7-cli-network.html` | NEEDS VERIFICATION |
| Nmap | `n10-troubleshoot-tools#5-5-software`, `n10-troubleshoot-tools#5-5-scenarios` | `fc-n10t-06`, `q-n10t-07` | No literal lead | NEEDS VERIFICATION |
| LLDP | `n10-troubleshoot-tools#5-5-software` | `fc-n10t-13`, `q-n10t-15` | No literal lead | NEEDS VERIFICATION |
| CDP | `n10-troubleshoot-tools#5-5-software` | `fc-n10t-13`, `q-n10t-15` | No literal lead | NEEDS VERIFICATION |
| Speed tester | `n10-troubleshoot-tools#5-5-software` | `q-n10t-03` | No literal lead | NEEDS VERIFICATION |
| Toner | `n10-troubleshoot-tools#5-5-hardware`, `n10-troubleshoot-tools#5-5-scenarios` | `fc-n10t-01`, `q-cls-038` | No literal lead | NEEDS VERIFICATION |
| Cable tester | `networking-cabling#tools-troubleshooting`, `n10-troubleshoot-tools#5-5-hardware` | `fc-n10t-02`, `q-62` | `networking-cabling-overview.html` | NEEDS VERIFICATION |
| Taps | `n10-troubleshoot-tools#5-5-hardware` | `fc-n10t-04` | `core2-pbq-mobile-troubleshooting.html` | NEEDS VERIFICATION |
| Wi-Fi analyzer | `n10-troubleshoot-tools#5-5-hardware`, `n10-troubleshoot-tools#5-5-scenarios` | `fc-n10t-05`, `q-n10t-01` | No literal lead | NEEDS VERIFICATION |
| Visual fault locator | `n10-troubleshoot-tools#5-5-hardware` | `fc-n10t-03`, `q-n10t-03` | No literal lead | NEEDS VERIFICATION |
| show mac-address-table | No literal lead in mapped notes | No literal lead | No literal lead | NEEDS VERIFICATION |
| show route | `n10-troubleshoot-tools#5-5-show` | `fc-n10t-15`, `q-n10t-19` | No literal lead | NEEDS VERIFICATION |
| show interface | `n10-troubleshoot-tools#5-5-show` | `fc-n10t-16`, `q-n10t-20` | No literal lead | NEEDS VERIFICATION |
| show config | `n10-troubleshoot-tools#5-5-show` | `q-n10t-19` | No literal lead | NEEDS VERIFICATION |
| show arp | `n10-troubleshoot-tools#5-5-show` | `q-n10t-19` | No literal lead | NEEDS VERIFICATION |
| show vlan | `n10-troubleshoot-tools#5-5-show` | `fc-n10t-17`, `q-n10t-18` | No literal lead | NEEDS VERIFICATION |
| show power | `n10-troubleshoot-tools#5-5-show` | `fc-n10t-18`, `q-n10t-18` | No literal lead | NEEDS VERIFICATION |

### Acronym-list inventory — S1 pp15–18
Tokens only; expansions must be checked against the official list and authoritative technical terminology during implementation. Acronym presence is not working knowledge. The PDF itself has inconsistencies noted in section 2; no guessed expansion is supplied. Candidate objectives use existing topic mappings, not a new official allocation.

| Acronym | Candidate Network+ note | Candidate objective(s) | Decision |
|---|---|---|---|
| A | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| ACL | `networking-fundamentals#network-devices` | 1.2, 1.5 | NEEDS VERIFICATION |
| AES | `n10-wireless-standards-security#2-3-security` | 2.3 | NEEDS VERIFICATION |
| AH | `n10-tcpip#objectives` | 1.4 | NEEDS VERIFICATION |
| AP | `n10-ch21#rogue-services` | 4.1, 4.2, 4.3 | NEEDS VERIFICATION |
| API | `n10-zerotrust-iac#1-8-iac` | 1.8 | NEEDS VERIFICATION |
| APIPA | `networking-dns-dhcp#dhcp` | 1.4, 3.4 | NEEDS VERIFICATION |
| APU | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| ARP | `networking-devices#arp-mac` | 1.2, 1.4, 1.6, 1.8 | NEEDS VERIFICATION |
| AUP | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| BCP | `n10-disaster-recovery#3-3-metrics` | 3.3 | NEEDS VERIFICATION |
| BGP | `n10-l2-l3-switching#l3-vs-router` | 1.1, 1.2, 2.2 | NEEDS VERIFICATION |
| BNC | `networking-cabling#fiber-coax` | 1.5, 5.2, 5.5 | NEEDS VERIFICATION |
| BPDU | `n10-troubleshoot-physical#5-2-interface` | 5.2 | NEEDS VERIFICATION |
| BSSID | `n10-wireless-standards-security#2-3-ssid` | 2.3 | NEEDS VERIFICATION |
| BYOD | `n10-ch21#rules-zones` | 4.1, 4.2, 4.3 | NEEDS VERIFICATION |
| CAM | `networking-devices#hub-switch-router` | 1.2, 1.4, 1.6, 1.8 | NEEDS VERIFICATION |
| CDN | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| CDP | `n10-troubleshoot-tools#5-5-software` | 5.5 | NEEDS VERIFICATION |
| CIA | `n10-risk-compliance#objectives` | 4.1, 4.2 | NEEDS VERIFICATION |
| CIDR | `n10-ch7#objectives` | 1.7, 1.8, 3.4 | NEEDS VERIFICATION |
| CLI | `n10-ch10#real-world-snmp-traps` | 2.1, 3.2 | NEEDS VERIFICATION |
| CNAME | `networking-dns-dhcp#dns` | 1.4, 3.4 | NEEDS VERIFICATION |
| CPU | `n10-ch10#static-default-dynamic` | 2.1, 3.2 | NEEDS VERIFICATION |
| CRC | `n10-troubleshoot-tools#5-5-show` | 5.5 | NEEDS VERIFICATION |
| DAC | `n10-transceivers-fiber#1-5-transceivers` | 1.5 | NEEDS VERIFICATION |
| DAS | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| DCI | `n10-sdn-overlay#1-8-vxlan` | 1.8 | NEEDS VERIFICATION |
| DDoS | `n10-ch21#availability` | 4.1, 4.2, 4.3 | NEEDS VERIFICATION |
| DHCP | `networking-dns-dhcp#dhcp` | 1.4, 3.4 | NEEDS VERIFICATION |
| DLP | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| DNS | `networking-dns-dhcp#dhcp` | 1.4, 3.4 | NEEDS VERIFICATION |
| DNSSEC | `n10-ch21#dns` | 4.1, 4.2, 4.3 | NEEDS VERIFICATION |
| DoH | `n10-dns-records-security#3-4-dns-security` | 3.4 | NEEDS VERIFICATION |
| DoS | `n10-ch21#availability` | 4.1, 4.2, 4.3 | NEEDS VERIFICATION |
| DoT | `n10-dns-records-security#3-4-dns-security` | 3.4 | NEEDS VERIFICATION |
| DR | `n10-disaster-recovery#3-3-metrics` | 3.3 | NEEDS VERIFICATION |
| EAP | `n10-wireless-standards-security#2-3-security` | 2.3 | NEEDS VERIFICATION |
| EAPoL | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| EIGRP | `n10-ch10#protocol-types` | 2.1, 3.2 | NEEDS VERIFICATION |
| EOL | `n10-org-change-config#3-1-lifecycle` | 3.1 | NEEDS VERIFICATION |
| EOS | `n10-org-change-config#3-1-lifecycle` | 3.1 | NEEDS VERIFICATION |
| ESP | `n10-tcpip#objectives` | 1.4 | NEEDS VERIFICATION |
| ESSID | `n10-wireless-standards-security#2-3-ssid` | 2.3 | NEEDS VERIFICATION |
| EULA | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| FC | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| FHRP | `n10-ch10#fhrp-virtual-ip` | 2.1, 3.2 | NEEDS VERIFICATION |
| FQDN | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| FTP | `networking-devices#tcp-udp-ports` | 1.2, 1.4, 1.6, 1.8 | NEEDS VERIFICATION |
| FTPS | `n10-ports-reference#1-4-ports-secure` | 1.4 | NEEDS VERIFICATION |
| GDPR | `n10-risk-compliance#objectives` | 4.1, 4.2 | NEEDS VERIFICATION |
| GRE | `n10-tcpip#objectives` | 1.4 | NEEDS VERIFICATION |
| GUI | `n10-remote-access-methods#3-5-methods` | 3.5 | NEEDS VERIFICATION |
| HTTP | `networking-devices#tcp-udp-ports` | 1.2, 1.4, 1.6, 1.8 | NEEDS VERIFICATION |
| HTTPS | `networking-devices#tcp-udp-ports` | 1.2, 1.4, 1.6, 1.8 | NEEDS VERIFICATION |
| HSRP | `n10-ch10#fhrp-virtual-ip` | 2.1, 3.2 | NEEDS VERIFICATION |
| IaaS | `n10-sdn-overlay#1-8-sdn` | 1.8 | NEEDS VERIFICATION |
| IaC | `n10-zerotrust-iac#1-8-iac` | 1.8 | NEEDS VERIFICATION |
| IAM | `n10-security#objectives` | 3.2, 4.1 | NEEDS VERIFICATION |
| iBGP | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| ICMP | `n10-osi-models#osi-layers` | 1.1, 1.5, 5.2 | NEEDS VERIFICATION |
| ICS | `n10-ch21#rules-zones` | 4.1, 4.2, 4.3 | NEEDS VERIFICATION |
| IDF | `n10-physical-install-factors#2-4-rooms` | 2.4 | NEEDS VERIFICATION |
| IDS | `networking-dns-dhcp#network-servers` | 1.4, 3.4 | NEEDS VERIFICATION |
| IGMP | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| IGP | `n10-ch9#as-igp-egp` | 2.1, 5.3 | NEEDS VERIFICATION |
| IoT | `n10-ch21#rules-zones` | 4.1, 4.2, 4.3 | NEEDS VERIFICATION |
| IIoT | `n10-ch21#rules-zones` | 4.1, 4.2, 4.3 | NEEDS VERIFICATION |
| IIS | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| IKE | `n10-tcpip#objectives` | 1.4 | NEEDS VERIFICATION |
| IP | `networking-dns-dhcp#dhcp` | 1.4, 3.4 | NEEDS VERIFICATION |
| IPAM | `n10-org-documentation#3-1-records` | 3.1 | NEEDS VERIFICATION |
| IPS | `networking-dns-dhcp#network-servers` | 1.4, 3.4 | NEEDS VERIFICATION |
| IPSec | `n10-tcpip#objectives` | 1.4 | NEEDS VERIFICATION |
| IS-IS | `n10-ch10#protocol-types` | 2.1, 3.2 | NEEDS VERIFICATION |
| ISP | `networking-cabling#fiber-coax` | 1.5, 5.2, 5.5 | NEEDS VERIFICATION |
| LACP | `n10-ch11#link-aggregation` | 2.2, 4.3, 5.3 | NEEDS VERIFICATION |
| LAN | `networking-cabling#twisted-pair` | 1.5, 5.2, 5.5 | NEEDS VERIFICATION |
| LC | `networking-cabling#fiber-coax` | 1.5, 5.2, 5.5 | NEEDS VERIFICATION |
| LDAP | `networking-devices#email-file-ports` | 1.2, 1.4, 1.6, 1.8 | NEEDS VERIFICATION |
| LDAPS | `n10-tcpip#ports` | 1.4 | NEEDS VERIFICATION |
| LLDP | `n10-troubleshoot-tools#5-5-software` | 5.5 | NEEDS VERIFICATION |
| LTE | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| MAC | `networking-dns-dhcp#dhcp` | 1.4, 3.4 | NEEDS VERIFICATION |
| MDF | `n10-physical-install-factors#2-4-rooms` | 2.4 | NEEDS VERIFICATION |
| MDIX | `networking-cabling#twisted-pair` | 1.5, 5.2, 5.5 | NEEDS VERIFICATION |
| MFA | `n10-security#objectives` | 3.2, 4.1 | NEEDS VERIFICATION |
| MIB | `n10-security#objectives` | 3.2, 4.1 | NEEDS VERIFICATION |
| MIMO | `n10-wireless-standards-security#2-3-standards` | 2.3 | NEEDS VERIFICATION |
| MOU | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| MPLS | `networking-devices#wan-mpls-sdwan` | 1.2, 1.4, 1.6, 1.8 | NEEDS VERIFICATION |
| MPO | `n10-transceivers-fiber#1-5-fiber` | 1.5 | NEEDS VERIFICATION |
| MTBF | `n10-disaster-recovery#3-3-metrics` | 3.3 | NEEDS VERIFICATION |
| MTTR | `n10-disaster-recovery#3-3-metrics` | 3.3 | NEEDS VERIFICATION |
| MTU | `n10-troubleshoot-tools#5-5-show` | 5.5 | NEEDS VERIFICATION |
| MX | `networking-dns-dhcp#dns` | 1.4, 3.4 | NEEDS VERIFICATION |
| NaaS | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| NAC | `n10-security#objectives` | 3.2, 4.1 | NEEDS VERIFICATION |
| NAS | `networking-storage#nas-san-backup` | 1.2, 3.3 | NEEDS VERIFICATION |
| NAT | `n10-l2-l3-switching#three-devices` | 1.1, 1.2, 2.2 | NEEDS VERIFICATION |
| NDA | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| NFV | `n10-sdn-overlay#1-8-sdn` | 1.8 | NEEDS VERIFICATION |
| NIC | `networking-cabling#tools-troubleshooting` | 1.5, 5.2, 5.5 | NEEDS VERIFICATION |
| NS | `n10-dns-records-security#3-4-records` | 3.4 | NEEDS VERIFICATION |
| NTP | `networking-dns-dhcp#network-servers` | 1.4, 3.4 | NEEDS VERIFICATION |
| NTS | `n10-dhcp-ipam-time#3-4-time` | 3.4 | NEEDS VERIFICATION |
| OOB | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| OS | `networking-storage#raid` | 1.2, 3.3 | NEEDS VERIFICATION |
| OSPF | `n10-ch10#protocol-types` | 2.1, 3.2 | NEEDS VERIFICATION |
| OSI | `n10-osi-models#objectives` | 1.1, 1.5, 5.2 | NEEDS VERIFICATION |
| OT | `n10-ch21#rules-zones` | 4.1, 4.2, 4.3 | NEEDS VERIFICATION |
| PaaS | `n10-cloud-models-connectivity#1-3-models` | 1.3 | NEEDS VERIFICATION |
| PAT | `n10-ch8#objectives` | 1.7, 2.1, 5.3 | NEEDS VERIFICATION |
| PDU | `n10-osi-models#osi-layers` | 1.1, 1.5, 5.2 | NEEDS VERIFICATION |
| PKI | `n10-security#objectives` | 3.2, 4.1 | NEEDS VERIFICATION |
| PoE | `networking-cabling#poe` | 1.5, 5.2, 5.5 | NEEDS VERIFICATION |
| PPTP | `n10-ports-reference#1-4-ports-infra` | 1.4 | NEEDS VERIFICATION |
| PSK | `n10-wireless-standards-security#2-3-security` | 2.3 | NEEDS VERIFICATION |
| PSU | `weak-areas#weak-list` | Unmapped / requires allocation | NEEDS VERIFICATION |
| PTP | `n10-dhcp-ipam-time#3-4-time` | 3.4 | NEEDS VERIFICATION |
| PTR | `networking-dns-dhcp#dns` | 1.4, 3.4 | NEEDS VERIFICATION |
| QoS | `networking-devices#wan-mpls-sdwan` | 1.2, 1.4, 1.6, 1.8 | NEEDS VERIFICATION |
| QSFP | `n10-transceivers-fiber#1-5-transceivers` | 1.5 | NEEDS VERIFICATION |
| RADIUS | `networking-dns-dhcp#network-servers` | 1.4, 3.4 | NEEDS VERIFICATION |
| RDP | `networking-devices#tcp-udp-ports` | 1.2, 1.4, 1.6, 1.8 | NEEDS VERIFICATION |
| RFID | `n10-org-documentation#3-1-records` | 3.1 | NEEDS VERIFICATION |
| RIP | `n10-ch10#protocol-types` | 2.1, 3.2 | NEEDS VERIFICATION |
| RPO | `n10-disaster-recovery#3-3-metrics` | 3.3 | NEEDS VERIFICATION |
| RSSI | `n10-wireless-standards-security#2-3-antennas` | 2.3 | NEEDS VERIFICATION |
| RSTP | `n10-ch11#stp` | 2.2, 4.3, 5.3 | NEEDS VERIFICATION |
| RTO | `n10-disaster-recovery#3-3-metrics` | 3.3 | NEEDS VERIFICATION |
| RTP | `n10-ports-reference#1-4-ports-infra` | 1.4 | NEEDS VERIFICATION |
| RX | `n10-osi-models#objectives` | 1.1, 1.5, 5.2 | NEEDS VERIFICATION |
| SaaS | `n10-sdn-overlay#1-8-sdn` | 1.8 | NEEDS VERIFICATION |
| SAML | `n10-security#objectives` | 3.2, 4.1 | NEEDS VERIFICATION |
| SAN | `networking-storage#nas-san-backup` | 1.2, 3.3 | NEEDS VERIFICATION |
| SASE | `n10-zerotrust-iac#1-8-sase` | 1.8 | NEEDS VERIFICATION |
| SC | `networking-cabling#fiber-coax` | 1.5, 5.2, 5.5 | NEEDS VERIFICATION |
| SCADA | `n10-ch21#rules-zones` | 4.1, 4.2, 4.3 | NEEDS VERIFICATION |
| SCTP | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| SDN | `n10-sdn-overlay#1-8-sdn` | 1.8 | NEEDS VERIFICATION |
| SD-WAN | `networking-devices#wan-mpls-sdwan` | 1.2, 1.4, 1.6, 1.8 | NEEDS VERIFICATION |
| SFP | `n10-transceivers-fiber#1-5-transceivers` | 1.5 | NEEDS VERIFICATION |
| SFTP | `n10-tcpip#ports` | 1.4 | NEEDS VERIFICATION |
| SIP | `n10-tcpip#ports` | 1.4 | NEEDS VERIFICATION |
| SIEM | `n10-monitoring-technologies#3-2-logs` | 3.2 | NEEDS VERIFICATION |
| SLA | `n10-org-documentation#3-1-records` | 3.1 | NEEDS VERIFICATION |
| SLAAC | `n10-ch7#objectives` | 1.7, 1.8, 3.4 | NEEDS VERIFICATION |
| SMB | `networking-storage#nas-san-backup` | 1.2, 3.3 | NEEDS VERIFICATION |
| SMTP | `networking-devices#tcp-udp-ports` | 1.2, 1.4, 1.6, 1.8 | NEEDS VERIFICATION |
| SMTPS | `n10-tcpip#ports` | 1.4 | NEEDS VERIFICATION |
| SNMP | `networking-devices#email-file-ports` | 1.2, 1.4, 1.6, 1.8 | NEEDS VERIFICATION |
| SOA | `n10-dns-records-security#3-4-records` | 3.4 | NEEDS VERIFICATION |
| SPAN | `n10-troubleshoot-tools#5-5-hardware` | 5.5 | NEEDS VERIFICATION |
| SQL | `networking-devices#tcp-udp-ports` | 1.2, 1.4, 1.6, 1.8 | NEEDS VERIFICATION |
| SSE | `n10-zerotrust-iac#1-8-sase` | 1.8 | NEEDS VERIFICATION |
| SSH | `networking-devices#tcp-udp-ports` | 1.2, 1.4, 1.6, 1.8 | NEEDS VERIFICATION |
| SSID | `n10-ch21#rogue-services` | 4.1, 4.2, 4.3 | NEEDS VERIFICATION |
| SSL | `n10-security#encryption-by-layer` | 3.2, 4.1 | NEEDS VERIFICATION |
| SSO | `n10-security#objectives` | 3.2, 4.1 | NEEDS VERIFICATION |
| ST | `networking-cabling#fiber-coax` | 1.5, 5.2, 5.5 | NEEDS VERIFICATION |
| STP | `networking-cabling#twisted-pair` | 1.5, 5.2, 5.5 | NEEDS VERIFICATION |
| SVI | `n10-l2-l3-switching#objectives` | 1.1, 1.2, 2.2 | NEEDS VERIFICATION |
| TACAS+ | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| TCP | `networking-devices#tcp-udp-ports` | 1.2, 1.4, 1.6, 1.8 | NEEDS VERIFICATION |
| TFTP | `n10-tcpip#tcp-vs-udp` | 1.4 | NEEDS VERIFICATION |
| TKIP | `n10-wireless-standards-security#2-3-security` | 2.3 | NEEDS VERIFICATION |
| TLS | `networking-devices#email-file-ports` | 1.2, 1.4, 1.6, 1.8 | NEEDS VERIFICATION |
| TTL | `n10-l2-l3-switching#layer2-forwarding` | 1.1, 1.2, 2.2 | NEEDS VERIFICATION |
| TX | `n10-osi-models#objectives` | 1.1, 1.5, 5.2 | NEEDS VERIFICATION |
| TXT | `networking-dns-dhcp#dns` | 1.4, 3.4 | NEEDS VERIFICATION |
| UDP | `networking-dns-dhcp#dhcp` | 1.4, 3.4 | NEEDS VERIFICATION |
| UPS | `n10-physical-install-factors#2-4-rooms` | 2.4 | NEEDS VERIFICATION |
| URL | `n10-html-http#url-to-page` | 1.4 | NEEDS VERIFICATION |
| USB | `networking-storage#nas-san-backup` | 1.2, 3.3 | NEEDS VERIFICATION |
| UTM | `networking-dns-dhcp#network-servers` | 1.4, 3.4 | NEEDS VERIFICATION |
| UTP | `networking-cabling#twisted-pair` | 1.5, 5.2, 5.5 | NEEDS VERIFICATION |
| VIP | `n10-ch10#fhrp-virtual-ip` | 2.1, 3.2 | NEEDS VERIFICATION |
| VLAN | `networking-dns-dhcp#vlan-vpn` | 1.4, 3.4 | NEEDS VERIFICATION |
| VLSM | `n10-ch7#objectives` | 1.7, 1.8, 3.4 | NEEDS VERIFICATION |
| VM | `n10-org-change-config#3-1-config` | 3.1 | NEEDS VERIFICATION |
| VNC | `n10-remote-access-methods#3-5-methods` | 3.5 | NEEDS VERIFICATION |
| VoIP | `networking-cabling#poe` | 1.5, 5.2, 5.5 | NEEDS VERIFICATION |
| VPC | `n10-cloud-models-connectivity#1-3-network` | 1.3 | NEEDS VERIFICATION |
| VPN | `networking-dns-dhcp#vlan-vpn` | 1.4, 3.4 | NEEDS VERIFICATION |
| VRF | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| VRRP | `n10-ch10#fhrp-virtual-ip` | 2.1, 3.2 | NEEDS VERIFICATION |
| VTP | `n10-ch11#vtp` | 2.2, 4.3, 5.3 | NEEDS VERIFICATION |
| VXLAN | `n10-sdn-overlay#1-8-vxlan` | 1.8 | NEEDS VERIFICATION |
| WAN | `networking-devices#wan-mpls-sdwan` | 1.2, 1.4, 1.6, 1.8 | NEEDS VERIFICATION |
| WAF | `n10-appliances-functions#1-2-security` | 1.2 | NEEDS VERIFICATION |
| WAP | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| WEP | `n10-wireless-standards-security#2-3-security` | 2.3 | NEEDS VERIFICATION |
| WLAN | `n10-topologies-architecture#1-6-types` | 1.6 | NEEDS VERIFICATION |
| WPA | `n10-wireless-standards-security#2-3-security` | 2.3 | NEEDS VERIFICATION |
| WPS | `n10-wireless-standards-security#2-3-security` | 2.3 | NEEDS VERIFICATION |
| XML | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| ZTA | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |

### Sample hardware/software inventory — S1 p19
Suggested lab-support materials, not a separate scored objective list and not authorization to create external accounts. All sampled families below have candidate topic evidence only; practical lab coverage and technical source support still need review.

| Sample family | Candidate Network+ note | Candidate objective(s) | Decision |
|---|---|---|---|
| Equipment: Optical patch panel | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Equipment: Copper patch panel | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Equipment: Layer 3 switch | `networking-dns-dhcp#vlan-vpn` | 1.4, 3.4 | NEEDS VERIFICATION |
| Equipment: Managed switch | `networking-fundamentals#network-devices` | 1.2, 1.5 | NEEDS VERIFICATION |
| Equipment: PoE switch | `networking-devices#poe` | 1.2, 1.4, 1.6, 1.8 | NEEDS VERIFICATION |
| Equipment: Router | `networking-dns-dhcp#vlan-vpn` | 1.4, 3.4 | NEEDS VERIFICATION |
| Equipment: Firewall | `networking-dns-dhcp#network-servers` | 1.4, 3.4 | NEEDS VERIFICATION |
| Equipment: WAP | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Equipment: Virtualization-capable laptop | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Equipment: VoIP phone | `n10-appliances-functions#1-2-other` | 1.2 | NEEDS VERIFICATION |
| Spare hardware: NIC | `networking-cabling#tools-troubleshooting` | 1.5, 5.2, 5.5 | NEEDS VERIFICATION |
| Spare hardware: Power supplies | `n10-disaster-recovery#3-3-ha` | 3.3 | NEEDS VERIFICATION |
| Spare hardware: SFPs | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Spare hardware: WAP | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Spare hardware: UPS | `n10-physical-install-factors#2-4-rooms` | 2.4 | NEEDS VERIFICATION |
| Spare hardware: PoE injector | `networking-devices#poe` | 1.2, 1.4, 1.6, 1.8 | NEEDS VERIFICATION |
| Spare parts: Fiber patch cables | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Spare parts: Copper patch cables | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Spare parts: Antennas | `n10-wireless-standards-security#2-3-standards` | 2.3 | NEEDS VERIFICATION |
| Spare parts: Bluetooth adapter | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Spare parts: Wireless adapter | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Spare parts: Console cable | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Spare parts: USB to RS-232 adapter | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Spare parts: USB NIC | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Tools: Cable tester | `networking-cabling#tools-troubleshooting` | 1.5, 5.2, 5.5 | NEEDS VERIFICATION |
| Tools: Tone generator | `networking-cabling#tools-troubleshooting` | 1.5, 5.2, 5.5 | NEEDS VERIFICATION |
| Tools: Optical power meter | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Tools: PoE tester | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Software: Protocol analyzer | `n10-troubleshoot-tools#5-5-software` | 5.5 | NEEDS VERIFICATION |
| Software: Packet capture | `n10-monitoring-technologies#3-2-traffic` | 3.2 | NEEDS VERIFICATION |
| Software: Terminal emulation | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Software: Linux | `n10-ch7#exercise-7-1` | 1.7, 1.8, 3.4 | NEEDS VERIFICATION |
| Software: Windows | `weak-areas#weak-list` | Unmapped / requires allocation | NEEDS VERIFICATION |
| Software: Software firewall | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Software: Software IDS | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Software: Software IPS | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Software: Network mapper | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Software: Hypervisor | `n10-sdn-overlay#1-8-vxlan` | 1.8 | NEEDS VERIFICATION |
| Software: IaaS lab accounts | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Software: Virtual network environment | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Software: Wi-Fi analyzer | `n10-troubleshoot-tools#5-5-hardware` | 5.5 | NEEDS VERIFICATION |
| Software: Spectrum analyzer | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Software: Network monitoring | `n10-security#objectives` | 3.2, 4.1 | NEEDS VERIFICATION |
| Software: Flow data analyzer | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Software: TFTP server | `n10-dhcp-ipam-time#3-4-dhcp` | 3.4 | NEEDS VERIFICATION |
| Software: Firmware versions | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Other: Network documentation | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Other: Sample logs | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Other: Defective cables | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Other: Cloud network diagrams | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Other: Configuration playbook | No literal lead | Unmapped / requires allocation | NEEDS VERIFICATION |
| Other: Runbook | `n10-disaster-recovery#3-3-metrics` | 3.3 | NEEDS VERIFICATION |
