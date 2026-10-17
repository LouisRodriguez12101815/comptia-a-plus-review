# Objective 5.3 reconciliation: current review record

Reviewed October 17, 2026 in the managed Linux workspace on PR #60's existing branch, `content/core1-display-troubleshooting`. Input heads: PR #60 `8630baf19b2bae41c4a24205699ff0000c93622a`; PR #61 `e1e3623fbb9091c82284ee02ed32bfa61242588b`; current main `574a21b` (the merge of #61). Exact current commit is recorded by the PR and git history; validation below applies to this merge resolution.

## Live status and actual conflicts

GitHub was queried before implementation. PR #60 was OPEN, not a draft, and reported `mergeable: CONFLICTING` / `mergeStateStatus: DIRTY`. PR #61 was already MERGED at `2026-10-17T15:33:31Z`, not an overlapping open draft. Its complete package was already on main. This task does not merge either PR or change #61's state.

These were both Git conflicts and competing editorial choices. A local merge of current main into #60 reproduced content conflicts in `content/topics.json`, `questions.json`, `flashcards.json`, `objectives.json`, the video-signal HTML, and an add/add conflict in the verification document. The lab and overview correction merged cleanly, but were still inspected. Conflict markers alone could not decide which questions teach a distinct decision or which source claims were supported.

Root AGENTS, explicit Cursor objective rule, skills README, certification-content-verifier and learning-challenge-designer were read. Source notes, loaders, schemas, both objective mappings, both implementations, and original audit receipts were compared. Network-diagram/shared-state workflows do not apply. Application/dashboard code and dependencies are unchanged.

## Reconciliation decisions

| Area | PR #60 initial version | PR #61 / current main | Reconciled decision |
| --- | --- | --- | --- |
| Notes | Same topic ID, nine sections, four worked examples, app/driver and sizing detail | Same topic ID, eight stable section anchors, model-specific cautions | Keep one `core1-display-troubleshooting` topic and all eight main anchors. Integrate supported built-in-test interpretation, Task Manager clue, sizing controls and four worked examples into those sections; no duplicate chapter or parallel symptom tables. |
| Questions | 16 `q-c1-display-*` items | Six `q-core1-display-*` items | Keep the six production items unchanged plus nine distinct #60 items, for 15 total. Preserve selected #60 IDs; retire duplicate draft IDs without reusing them. |
| Cards | 16 `fc-c1-display-*` items | Eight `fc-core1-display-*` items | Keep all eight production cards unchanged plus four distinct #60 cards, for 12 total. Do not duplicate connector, input, pixel, audio or blur recall under a second ID. |
| Practice loop/lab | Four worked cases and desk-practice paragraph | Published `display-path-isolation` lab, paper route, hints, recoverable retries and changed transfer problem | Keep main's lab byte-for-byte. Use #60's worked case table as notes teaching; omit its overlapping desk-practice paragraph. The published lab stays the only lab for this objective. |
| DVI | Active-converter correction; passive cable exercise changed to analog-capable DVI-I → DVI-A | Consistent correction in prerequisite notes, q-141 and both HTML files; active direction exercise | Keep main's notes/q-141 and both visuals' correction. Extend the direction exercise with #60's valid passive analog exception, explicitly assuming analog is supplied. No passive cable creates a missing signal; active conversion remains directional. |
| Matrix | Covered, same topic ID | Covered, same topic ID, global reviewed false | Preserve main's matrix verbatim: one mapping, no unrelated statuses, notes or review-flag changes. |
| Evidence | Additional Dell, Microsoft, Epson and StarTech references; limited HTTP validation | More detailed model limits, rendered verification and existing-issue backlog | Preserve both historical receipts and add this current receipt. Recheck additional references before using them. Do not represent old counts or HTTP-only checks as current browser tests. |

### Retained practice IDs and duplicate crosswalk

All eight main section IDs, all main topic/card/question IDs (including q-141), and the lab slug remain stable. All non-display content from main is identical. The new IDs below existed in the unmerged #60 draft; none is renamed or recycled.

Retain #60 questions `q-c1-display-03`, `05`, `07`, `08`, `12`, `13`, `14`, `15`, `16`: confirmed lamp-service procedure, retained-image response, Windows app clue, cable-dependent tint, cropping control, sharp trapezoid, dock-path isolation, separate VGA audio, and no-signal sleep timer. Their explicit `220-1201` tags and original keys/explanations are retained. Combined answer-position distribution is A=3, B=4, C=5, D=3; there is no fixed correct-position pattern.

| Retired #60 draft question | Retained main equivalent | Reason |
| --- | --- | --- |
| `q-c1-display-01` | `q-core1-display-01` | Same selected-input decision |
| `q-c1-display-02` | `q-core1-display-02` | Cable isolation already practiced; retain the separate dock transfer instead |
| `q-c1-display-04` | `q-core1-display-06` | Same blurry internal menu/focus inference |
| `q-c1-display-06` | `q-core1-display-05` | Same independent-test fixed-dot evidence; main asks for a supported next action |
| `q-c1-display-09` | `q-core1-display-03` | Same HDMI audio-output mismatch |
| `q-c1-display-11` | `q-core1-display-04` | Same documented thermal-warning action |

Question `q-c1-display-10` and card `fc-c1-display-11` (flashlight/backlight/inverter inference) are deferred, not silently accepted as verified. The HP community reply found during reconciliation is signed by an employee but carries a personal-opinion disclaimer and is not a model service manual. It supports only a qualified lead; no current primary service procedure was verified for its broader claim. The original text remains in the historical #60 receipt/history. Existing notes still teach brightness/settings/diagnostic boundaries without guessing a component.

Retain #60 cards `fc-c1-display-04` (confirmed service sequence), `09` (color-fault isolation), `14` (sizing-control distinctions), `16` (verification). Retire duplicates: `01`→main `01`; `02`→main `02`; `03`→main `03`; `05`→main `04`; `06`→main `05`; `07`→main `06`; `08`→main `02` plus expanded flashing notes; `10`→main `08`; `12` and `13`→main `07`; `15`→main `04`. Here “main” card suffixes mean `fc-core1-display-*`. Retired draft IDs are not reassigned to new meanings. Because #60 was never merged, they are not production progress IDs. Production IDs from merged #61 are all preserved.

### Notes and source reconciliation

CompTIA A+ 220-1201 V15, objectives document **4.0**, section 5.3, PDF page 12, was reopened on October 17, 2026: [official objectives](https://lecbyo.files.cmp.optimizely.com/download/34be017cb73211ef8985a6f347fbf652). Its 13 symptom areas remain taught through the same eight stable main sections. Domain 5.0's 28% is not an objective-specific weight. Coverage means the notes teach the main diagnostic task; counts and weighted estimates are not proof of exam readiness. The full matrix has not been reviewed.

The prior main receipt contains the original CompTIA, Microsoft display/audio, Dell video/pixel/retention, Samsung OLED and Epson lamp/brightness references and the symptom-to-section matrix. Those model limits remain in the lesson. Additional source checks for retained #60 teaching are below; URLs and supported claims are recorded without copying a PDF or exam questions.

| Reference inspected October 17, 2026 | Supported retained teaching | Limits |
| --- | --- | --- |
| [Dell monitor diagnostics](https://www.dell.com/support/kbdoc/en-us/000124390/how-to-run-diagnostic-test-on-a-dell-monitor), integrated self-test/BID sections | Display-generated defect versus external path; consult actual model instructions | A clean test does not rule out an intermittent fault; no universal button sequence |
| [Microsoft Windows flicker](https://support.microsoft.com/en-au/windows/hardware/display-graphics/troubleshoot-screen-flickering-in-windows), Task Manager comparison | Stable Task Manager with other flicker suggests app investigation; all-screen flicker suggests driver investigation | Probabilistic clue, not proof the GPU/panel is healthy; q-c1-display-07 supplies a clean display test and recent app change |
| [Epson EX9270 / PowerLite 994F/1290/FH54+ image shape](https://files.support.epson.com/docid/cpd6/cpd65864/EN/Troubleshooting/Reference/problem_image_shape_auto_keystone.html) | Position square to screen, then documented geometry controls | Exact controls and automatic correction depend on model |
| [Same Epson family: aspect](https://files.support.epson.com/docid/cpd6/cpd65864/EN/Basic_Use/Tasks/aspect_ratio_changing.html) and [optical zoom](https://files.support.epson.com/docid/cpd6/cpd65864/EN/Basic_Use/Tasks/image_enlarging_zoom_ring.html) | Match aspect and projected size to symptom | No generic assumption every projector has optical zoom |
| [Samsung Canada picture settings](https://www.samsung.com/ca/support/tv-audio-video/picture-settings-for-your-samsung-tv/), Picture Size Settings | Fit-to-screen preserves the full image; aspect and zoom have distinct roles | Menu names/model/region availability vary. q-c1-display-12 asks which setting to check, not a universal repair guarantee |
| [StarTech DVI2VGACON](https://www.startech.com/en-us/audio-video-products/dvi2vgacon), product signal conversion | Active digital-to-analog conversion, consistent with the main Dell connection reference | Product illustrates one direction. It does not establish that a passive unlike-signal cable works, or that every converter is reversible |
| [Epson sound](https://files.support.epson.com/docid/cpd6/cpd62535/source/troubleshooting/reference/problem_sound.html), volume/source/audio-connection checks | Distinguish image path from sound; separate supported audio connection for VGA | Capability of actual speakers and adapters must be checked |
| [Dell AW3423DW/DWF refresh](https://www.dell.com/support/kbdoc/en-us/000198595/alienware-aw3423dw-pixel-refresh-will-turn-monitor-off) | Confirms panel-care behavior is model-specific; consistent with main's qualified retention guidance | No global recovery time or cure for permanent wear is inferred |

The old Epson sizing FAQ and Sony sizing pages did not open during reconciliation; neither is claimed as inspected full text or needed to establish the retained fit-to-screen decision. Samsung and the accessible Epson guide supply that evidence. The HP support-community reply is explicitly not elevated into a service-manual authority.

## Acceptance and isolation of unrelated work

The learner can compare input, cable and independent display tests; distinguish optical blur, geometry, sizing, retained images and pixel defects; choose supported audio, driver/app, lamp and timer investigations; explain why evidence does not prove one component; and verify the original workload. The guided lab supplies written decisions, progressive hints, retry feedback and a changed audio/VGA transfer, with equipment and paper routes. No scored game, shared state or dashboard is added.

Main's entire lab JSON, objective matrix (including global `reviewed: false`), existing q-141 correction, prerequisite topic correction, and overview HTML correction are retained. All unrelated topic/card/question records, application code, dependency manifests, and styles are unchanged. Only the display topic gains selected teaching, the question/card pools gain the distinct draft items, and the existing DVI exercise gains the passive analog case. Current main is merged through normal ancestry; no force push is used.

Historical records are preserved: [merged #61 receipt](display-troubleshooting-verification.md) and [initial #60 receipt](display-troubleshooting-pr60-initial-verification.md). Their original counts and PR statuses are historical. The current receipt here takes precedence for final decisions and validation.

## Current validation results

The following checks were executed on this reconciled tree; historical receipts are not substituted for these runs. Scratch assertions, browser harnesses, logs and screenshots are in ignored `work/reconcile/`, not shipped application code.

| Check | Actual result |
| --- | --- |
| `npm run report:objectives` | Passed: one 5.3 row, covered, 8 sections / 12 cards / 15 questions / 1 lab / 0 separately mapped visuals. First gap remains 220-1201 5.4. |
| `npm run check:content` | Passed: 0 errors, 25 existing warnings. |
| `npm run check:content -- --topic core1-display-troubleshooting,core1-ch3-peripherals` | Passed: 0 errors, 3 existing five-choice warnings for q-68, q-72, q-cls-024. |
| `npm run test:objectives` / `npm run test:content` | 4/4 and 2/2 passed before the full suite. |
| `npm test` | 148 passed, 0 failed/skipped: 95 game, 18 practice, 23 subnet, 2 content, 6 report, 4 objectives. Includes the independent Python subnet fixtures. |
| `npm run lint` | Passed, 0 errors / 3 pre-existing no-img-element warnings. An initial run also picked up four unused bindings in a prior ignored scratch helper; the helper was preserved as a text archive and the normal command rerun. No lint configuration or application code was changed. |
| `npm run typecheck` | Passed: Next route generation and TypeScript. |
| `NODE_USE_ENV_PROXY=1 npm run build` | Passed: production build and static routes. Uses the configured proxy for the existing Google Fonts; no new dependency or font fixture. |
| `node work/reconcile/check.mjs` | Passed: JSON, unique IDs/prompts, valid keys/distinct choices, selected/retired IDs, production record preservation, eight stable anchors, one topic/lab, exam tags, matrix/global reviewed byte-for-byte semantic equality to main, both HTML scripts parse. |
| Local document-link assertions | Passed: both historical receipts and the reconciliation record resolve their relative Markdown links. |
| `git diff --check` / conflict-marker scan | Passed after resolution. Staging clears all unmerged entries. |

### Rendered desktop/mobile checks

Ran Playwright/Chromium against the fresh production build on localhost port 3036 at **1366×900** and **390×900**, plus a mobile/touch context at **390×844**. Both complete layout runs passed, with no page JavaScript errors. Screenshots were inspected, including the new 12-card/15-question counts and the four-goal DVI selector.

- Core 1 hub, catalog, focused search, eight section anchors, chapter quiz/card links, lab catalog and related notes links work.
- Core 1 and All include the topic/cards/questions; Core 2 and Network+ exclude them. Item tags and inherited topic filtering agree.
- Flipped and rated all **12** card fronts/backs against content records in both layouts.
- Submitted all **15** questions incorrectly and verified every keyed answer/explanation in the final missed-answer review; a fresh correct sitting scored **15/15** in each layout. Also verified unchanged q-141 in its prerequisite deck. Test-only deterministic ordering included q-141 in that deck's 15-question sitting; question data and grading were not replaced.
- Both corrected visual assets and visual-library links work. Tested empty submission, rejected passive unlike-signal connection, rejected reverse conversion, successful digital→analog and analog→digital paths, direct digital→digital, and the added explicitly analog-capable DVI-I→DVI-A passive path. Goal changes clear stale choices and retries remain possible.
- Keyboard activated a notes anchor, flipped a card and submitted a converter choice. Touch selected choices, showed incorrect feedback and recovered on retry.
- The guided lab/paper route, hint and result sections, changed audio/VGA transfer, and related notes render. Its main column fits mobile; the known document-wide 19 px CCNA navigation overflow remains classified separately below.

No software test establishes improved learning or verifies a physical repair. Existing quiz feedback timing remains unchanged; explanations are verified where the actual UI exposes them, in final missed-answer review.

## Remaining limits and dashboard dependency

The pre-existing navigation/quiz backlog in the main receipt remains excluded: lab taxonomy assumes CCNA, a 19 px mobile navigation overflow is reproducible on an old lab, Notes tiles are disabled outside Notes, and quiz explanations appear in final missed-answer review. These are unchanged application behavior, not reconciliation fixes. Physical hardware service, physical-phone, deployed-provider, full accessibility and learner-effectiveness verification are not claimed.

PR #61 is already merged and will not be closed, reopened or relabeled by this task. Its production implementation is retained and supplemented here; it is no longer a competing pending proposal. PR #60 becomes the single pending reconciliation/enrichment against main.

Dashboard implementation must use a separate branch and PR. Main already supplies the stable topic ID and covered mapping through #61; a dashboard using only those has no missing 5.3 mapping dependency. A dashboard that displays the final 12-card/15-question counts or selected new practice must wait for review/merge of #60 or explicitly declare a stacked dependency on this branch. No dashboard work is implemented here, and no assumptions about unspecified dashboard requirements are introduced.
