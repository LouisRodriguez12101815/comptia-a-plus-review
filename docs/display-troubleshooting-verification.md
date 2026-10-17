# Display troubleshooting content verification

Reviewed on October 17, 2026 in the managed Linux workspace, branch `work`, base commit `70fdac402a73850bd017c691c9262709e30bba78`. This record describes the content package based on that commit, not a deployed release. The initial branch was `work`; the package is prepared for review on `content/core1-display-troubleshooting-review`. The initial working tree was clean. Objective 5.3 was still `missing` with no topic mapping; no earlier implementation was duplicated.

## Scope and workflow

Read root `AGENTS.md` (no nested instructions found), `docs/skills/README.md`, the explicit Cursor exam-coverage rule, the matrix/report/test files, `package.json`, `lib/exams.ts`, and the actual certification-content-verifier and learning-challenge-designer skills. Compared source notes, both topic collections, cards, questions, labs, practice data, and existing visuals. Historical source audits remain historical; their passing counts are not current results.

Applied certification-content-verifier for primary references, numbered mapping, answer explanations, and the DVI correction. Applied learning-challenge-designer to the written lab's observable decisions, hints, recoverable retries, feedback, debrief, and changed transfer problem. This is not a new game. No networking calculations or diagrams, multiplayer/shared state, new dependencies, tracking, or account features were introduced. The networking-diagram and shared-state workflows do not apply. Existing quiz questions use numeric answer indices; new questions follow that schema rather than importing the separate practice-game answer-ID schema. No application quiz shuffling/scoring logic changed.

## Sources actually inspected

Retrieved October 17, 2026 using web access. These sources establish facts, not evidence that a learner improved. Official objective PDFs and vendor illustrations are not copied into site content. Questions and lab cases are original, not exam recollections or dumps.

| Ref | Primary document and exact section | Supported claims and limits |
| --- | --- | --- |
| C1 | [CompTIA A+ 220-1201 V15, objectives document 4.0](https://lecbyo.files.cmp.optimizely.com/download/34be017cb73211ef8985a6f347fbf652), section 5.0 / 5.3, PDF page 12; domain weights on page 3 | Confirms exam code, numbered display/projector troubleshooting scope, and 28% domain weight. Document revision 4.0 is distinct from exam V15. The URL with `?checkExpiry=false` failed on this visit; the URL without the query opened successfully. |
| M1 | [Microsoft: external monitor troubleshooting](https://support.microsoft.com/en-us/windows/hardware/display-graphics/troubleshoot-external-monitor-connections-in-windows), “Using only one external monitor,” “Roll back your display driver” | Controlled cable/system/port substitution, external output selection, and rollback when an update precedes the fault. A symptom does not uniquely identify a component. |
| M2 | [Microsoft: sound troubleshooting](https://support.microsoft.com/en-us/windows/hardware/audio/fix-sound-or-audio-problems-in-windows), Windows 11 output selection, mute, and default audio device sections | Select the intended audio output; check speaker capability and volume. Working video does not establish audio routing. |
| D1 | [Dell: video connections](https://www.dell.com/support/kbdoc/en-us/000052929/video-display-and-multiple-video-display-general-information), “Video Connection Information,” article 000052929 | Analog/digital paths, active conversion electronics, directionality, and USB-C video capability. Converter specifications, not connector fit, determine suitability. |
| D2 | [Dell: display pixel guidelines](https://www.dell.com/support/kbdoc/en-us/000126004/dell-display-pixel-guidelines), pixel types, “Can You Fix Stuck or Dead Pixels?”, screen checks and pixel policy | Dark versus bright/stuck defects, diagnostic observations, no pressure/unofficial software promises; support eligibility varies by product. No universal replacement threshold is asserted. |
| D3 | [Dell: Latitude LCD retention](https://www.dell.com/support/kbdoc/en-us/000328492/lcd-image-retention-or-burn-in-on-latitude-detachable), “Recovery” and “Prevention” | Model-specific recovery/prevention for Latitude 7320/7350 Detachable. Dell uses retention/burn-in terminology loosely in this article; its recovery interval is not generalized to other panels. |
| S1 | [Samsung: OLED burn-in](https://www.samsung.com/ae/support/tv-audio-video/what-to-do-if-you-have-burn-in-on-your-samsung-oled-tv-screen/), sections 1–3 | Distinguishes lasting wear from temporary retention; supported maintenance may improve uniformity, without guaranteeing repair of permanent wear. Exact feature/menu/model lists are not generalized or reproduced. |
| E1 | [Epson: fuzzy/blurry image](https://files.support.epson.com/docid/cpd4/cpd42080/source/troubleshooting/reference/problem_image_blurry.html), troubleshooting checklist | Focus, placement, excessive keystone, and matching native resolution are discriminating checks for projector blur. Controls depend on the model. |
| E2 | [Epson PowerLite W56S+: brightness/color](https://files.support.epson.com/docid/cpd6/cpd65395/EN/Troubleshooting/Reference/problem_image_colors.html), full checklist; model identified in the guide home | Settings, source, connection, environment, and progressive lamp darkening. Progressive dimming supports investigation, not automatic lamp diagnosis. |
| E3 | [Epson EX9270 / PowerLite 994F, 1290, FH54+: lamp replacement](https://files.support.epson.com/docid/cpd6/cpd65864/EN/Maintenance/Tasks/replacing_lamp.html), warnings and numbered procedure; model identified in the guide home | Model-specific shutdown/unplug/cooling sequence, at least one hour for this lamp, glass/mercury precautions, secured cover and post-replacement timer. No invasive lab or universal cooldown claim. |
| E4 | [Same Epson family: unexpected shutdown](https://files.support.epson.com/docid/cpd6/cpd65864/EN/Troubleshooting/Reference/problem_power.html), sleep/timers and temperature indicator guidance | Distinguish configured timers from documented thermal shutdown. Indicator meanings must come from the actual model manual. |

The official 5.3 mapping is verified, not inferred from `lib/exams.ts`. Exact part numbers, service authorization, diagnostic codes, warranty thresholds, and recovery timers for a learner's own hardware still require that hardware's documentation.

## Teaching evidence and coverage decision

New topic: `core1-display-troubleshooting`, Core 1 group, troubleshooting concept, only `220-1201`. Reviewed all eight sections in full. The table below paraphrases the official scope rather than reproducing its text.

| Official 5.3 symptom area, paraphrased | Notes section IDs | Teaching supplied |
| --- | --- | --- |
| Wrong selected input | `isolate-display-path`, `input-cables-adapters` | Compare socket with selected input; verify external output; retest |
| Connection faults | `input-cables-adapters`, `flashing-color` | Inspection and controlled substitution; signal/direction compatibility |
| Failed projector light source | `projector-lamp-thermal` | Identify lamp technology, consult fault chart, confirm service requirement |
| Blurred image | `clarity-size-distortion` | Compare menu/test image; focus, placement, native resolution |
| Persistent image wear | `dim-pixels-burn-in` | Distinguish temporary retention from lasting wear; supported care and escalation |
| Pixel failure | `dim-pixels-burn-in` | Light/dark/self-test observations, record and consult product policy |
| Intermittent image flashing | `flashing-color` | Isolate cable/mode/driver theories without claiming certainty |
| Wrong colors | `flashing-color` | Compare source with display test; inspect connections and settings |
| Missing sound | `display-audio` | Speaker capability, output/mute/volume, separate VGA audio path |
| Low brightness | `dim-pixels-burn-in`, `projector-lamp-thermal` | Settings/environment versus persistent hardware symptoms; model-specific service |
| Unexpected projector power-off | `projector-lamp-thermal` | Timers versus manual-confirmed thermal status; stop and investigate |
| Incorrect image size | `clarity-size-distortion` | Resolution/scaling/aspect/zoom checks and verification |
| Misshapen image | `clarity-size-distortion` | Placement and documented keystone controls; distinguish from blur |

`verify-document-transfer` supplies verification, a text-equivalent signal path/table, and a changed problem. Notes teach the main task across every listed symptom area, with tests, interpretations and appropriate next actions. Therefore 5.3 is `covered`, mapped only to the dedicated topic. This is a teaching-scope decision, not a claim of exhaustive exam coverage or learner mastery. Cards/questions/lab reinforce notes rather than establish coverage by themselves.

Only the `220-1201` / `5.3` objective's `topics` and `status` change. No other objective or note changes. Global `reviewed` remains its original `false`; the full matrix has not been reviewed. Domain weights apply to domains, mapped counts measure assets in topics, and weighted coverage remains a planning estimate.

## DVI correction evidence

| Content ID/path | Prior claim | Independent result and correction |
| --- | --- | --- |
| `content/topics.json`: `core1-ch3-peripherals/video-signals` | Unlike cable ends suffice for DVI-A/DVI-D | Incorrect: analog and digital need compatible active conversion, direction and supported modes/power; D1 |
| `content/questions.json`: `q-141` | Keyed a matching-ends passive cable | Preserve ID; rewrite an explicit digital-source/analog-display scenario. Key remains index 1, now the active digital-to-analog converter choice. Explain all weaker alternatives; D1 |
| `public/visuals/core1-ch3-overview.html` | Repeated passive cable statement | Replace with the same signal compatibility rule; D1 |
| `public/visuals/core1-ch3-video-signals.html` | Rewarded choosing A and D cable ends | Replace that exercise with strategy and direction choices for D→A, A→D, and D→D. Passive unlike-signal choice fails; reverse converter fails; direct compatible digital path succeeds. Goal changes clear previous selections. Feedback permits retries and states mode/power assumptions; D1 |

## Stable identities and answer review

Eight new cards: `fc-core1-display-01` through `08`. Six new questions: `q-core1-display-01` through `06`. Topic sections: `isolate-display-path`, `input-cables-adapters`, `clarity-size-distortion`, `flashing-color`, `dim-pixels-burn-in`, `projector-lamp-thermal`, `display-audio`, `verify-document-transfer`. Lab slug: `display-path-isolation`. Existing topic, section, question and card IDs remain stable.

| Question | Authored assumptions | Key (zero-based) | Why the alternatives are weaker / evidence |
| --- | --- | --- | --- |
| `q-core1-display-01` | External duplicate output already active; HDMI 1 connected, HDMI 2 selected | 1 | Input mismatch directly observed; replacement/reinstall does not address it; M1/E1 |
| `q-core1-display-02` | Only cable changes; mode/ports/source/display constant | 2 | Implicates original cable path, not panel or every driver; M1 |
| `q-core1-display-03` | Functioning projector speakers, unmuted, disconnected headset selected | 0 | Routing explains evidence; cable/lamp/focus changes do not; M2 |
| `q-core1-display-04` | Actual model manual identifies warning as thermal | 3 | Cooling/ventilation investigation; no bypass, timer reset or cable cure; E4 |
| `q-core1-display-05` | Persistent dot across second source, direct cable and display self-test | 1 | Display-level investigation; no pressure/software cure/first-PC driver claim; D2 |
| `q-core1-display-06` | Menu and source blurry; rectangular outline; model permits manual focus | 2 | Focus/placement fits both images; OS/audio/burn-in do not; E1 |

All scenario evidence and results are constructed teaching assumptions, not observations of the user's equipment. Correct choices occupy all four positions (A:1, B:2, C:2, D:1). New questions have four distinct choices and explanations for every distractor. Existing q-141 retains its identity but its choices and meaning are corrected consistently.

## Written learning loop and acceptance

Prerequisites: new notes, basic connector knowledge from `core1-ch3-peripherals`, and either authorized external-display controls or paper. Entry: read symptoms, write a test and prediction before viewing feedback. No new scored mechanics, accounts, browser persistence, or tracking. The worksheet keeps first reasoning, hint use, retries, completion, and unaided transfer separate. There is no repeat-credit farming because no rewards are issued. Paper feedback is deliberately visible in later sections; conceal it manually, not through a claimed software gate.

| Phase | Visible/actionable | Validation and progression |
| --- | --- | --- |
| Prepare | Equipment/paper choice; original-setting worksheet | Record baseline and choose route |
| Input case | Explicit symptoms and three possible actions | Write prediction; choose connected input; two hints available |
| Result/retry | Supplied restored-image result, or actual equipment observation | Explain inference; revisit case after wrong answer; preserve first attempt |
| Cable case | Held-constant setup, one changed cable | Infer cable path without overclaiming; revise with feedback |
| Transfer | Different audio fault; answer before feedback | Select intended output and justify why cable replacement is weaker |
| Debrief | Result, targeted note/card review, changed VGA/no-speaker check | Restore settings; document evidence and distinguish assisted/unaided results |

Learner acceptance: explain a discriminating test for all 13 scope areas; distinguish a working menu from a healthy source path; reason about active conversion direction; separate blur/geometry, brightness/lamp and retention/pixel faults; verify sound routing; use model-specific service boundaries; restore settings; justify a changed case without hints. Intended learning benefit is better diagnosis. No claim of measured learning improvement is made; independent learner observation remains needed.

## Navigation and validation

Existing schemas only: notes/cards/questions inherit Core 1 filtering from the new topic; lab uses `relatedTopicIds` and existing section/block fields. Notes and quiz/card chapter links are generated from topic data; lab is listed by the existing Labs index and links back to its related notes. A notes paragraph names the lab and route. The renderer does not turn paragraph paths into clickable links; the Labs catalog is the supported entry. No unsupported link/hint fields were added.

Pre-existing navigation limitation: `/labs` is titled “Networking labs,” all labs are routed under CCNA, and its index has no exam filter. The new lab is available there, but this content task does not rewrite application navigation or claim exam-filtered lab behavior. New notes/cards/questions must appear in Core 1/all and be excluded from Core 2/Network+.

### Actual automated results

| Command/check | Actual outcome |
| --- | --- |
| `npm run report:objectives` before and after | Passed. Final 5.3 row: covered, 8 notes sections, 8 cards, 6 questions, 1 lab, 0 separately mapped visuals. Corrected prerequisite visuals remain attached to their original topic. Core 1 totals: 7 covered / 14 partial / 6 missing, about 48% planning coverage. |
| `npm run check:content` | Passed, 0 errors and 25 warnings; same warning count as before this package. This checks consistency, not truth. |
| `npm run test` | First sandbox run stopped at two content-check tests: empty subprocess output led to `Unexpected end of JSON input`, matching the prior review's `spawnSync ... EPERM` restriction. Repeated with child-process access: all 148 tests passed. |
| `npm test` | With child-process access: all 148 passed (95 game, 18 practice, 23 subnet, 2 content, 6 report, 4 objectives). Independent Python subnet verification also passed within the suite; no subnet changes were made. |
| `npm run lint` | Passed, 0 errors / 3 existing `no-img-element` warnings. |
| `npm run typecheck` | Passed: route generation and TypeScript. |
| `npm run build` | Initial run failed fetching existing Google Fonts and resolving the initially missing `ts-fsrs`. After restoring the unchanged lockfile dependencies, `NODE_USE_ENV_PROXY=1 npm run build` with network/process access passed, including static notes/lab generation. No dependency manifest or lockfile changed. |
| `node work/check-display-content.mjs` | Passed: topic/card/question/lab identity uniqueness, eight unique new sections, 8 cards/6 questions, four distinct choices and valid keys, all answer positions represented, intended exam tags, paper route, original labs unchanged, and matrix semantic comparison limited to 5.3 status/topics with global reviewed preserved. |
| `git diff --check` | Passed after implementation and final documentation. |

As explicitly requested, nonexistent `npm run report` and `npm run check` aliases were not invoked or added. Their actual equivalents are `report:objectives` and `check:content`.

The initial dependency restore using `npm ci --ignore-scripts --cache /tmp/comptia-npm-cache` was denied connecting to the configured proxy (`connect EPERM ...:8080`). Repeating that same locked install with the required access succeeded. Initial Chromium launch was also blocked in the restrictive sandbox; launching with the required local process access succeeded. These environmental failures were resolved without application changes or a new dependency.

### Actual rendered verification

Ran local Playwright/Chromium against the production build on `http://127.0.0.1:3035`, at 1366×900 and 390×900. Inspected screenshots of notes, flashcard answers, quiz choices, lab and corrected converter exercise. Also used a 390×844 mobile/touch context for input checks. This is browser emulation, not physical-device testing.

- Core 1 hub → new notes link works. All eight in-page section anchors resolve; chapter links open the new flashcards and quiz. Focused search finds the new retained-image section.
- Notes/cards/questions appear under Core 1 and All; the new topic is absent from Core 2 and Network+ catalogs/deck/quiz options.
- Flipped and rated all eight new cards in each layout, verifying each displayed front/back against its ID-backed content record.
- Submitted all six new scenarios incorrectly and verified all six correct-answer explanations in the missed-question review. A fresh correct sitting scored 6/6 in each layout. Correct-answer positions cover A–D. Existing quiz order is shuffled; to ensure corrected q-141 entered the 15-question mobile sitting, a test-only fixed random value preserved the existing order. Question data and grading were not replaced or mocked.
- Corrected q-141 was rendered and answered incorrectly, then its active-conversion explanation was verified in the final review, in both layouts.
- Labs catalog → new lab → related Core 1 notes navigation works. Paper instructions, hints, result sections, retry guidance and changed audio/VGA transfer cases render. New lab content stays within the main column.
- Both corrected visuals are reachable through existing Core 1 visual-library hash navigation and full-screen asset links. Tested empty selections, wrong passive strategy, wrong converter direction, correct digital→analog, correct analog→digital and direct digital→digital. Goal changes clear stale selections; retries remain possible. No page JavaScript errors occurred.
- Keyboard activated a notes anchor, flipped a flashcard, and submitted the converter answer. Touch activated converter choices, showed incorrect feedback, and recovered with a correct answer.

Scratch scripts/logs/screenshots are in ignored `work/`; they are local validation evidence, not new shipped application tests. Selector adjustments and hash-only navigation handling in the walkthrough were test-harness changes, not product fixes. The first whole-page mobile lab overflow assertion exposed the pre-existing issue below; inspection and a second existing lab comparison separated it from the new content.

### Remaining limitations and observed existing UI behavior

1. At 390 px, the lab route document is 409 px wide because an existing screen-reader-only CCNA navigation label extends outside its scrolling row. The same 19 px overflow occurs on unchanged `/labs/two-subnet-lan`. The new lab's main content fits; this broader application CSS issue remains outside the content scope.
2. Labs remain under the existing CCNA/“Networking labs” navigation and have no exam filter. Related notes link back to Core 1; notes/cards/questions filtering is verified. Content paragraph paths are plain text with the existing renderer, not newly invented hyperlinks.
3. The existing chapter strip labels Notes “Coming soon” from quiz/flashcard pages because its notes tool has no href, even though the notes are available from Core 1 and the Notes catalog. No application routing logic was changed.
4. The existing quiz `submit()` advances immediately. Explanations are displayed for missed questions at the end, not after each correct response. The written lab provides its own immediate result/feedback sections. This package does not claim to repair the quiz's feedback timing.
5. No deployed testing, physical display fault reproduction, lamp servicing, physical phone testing, full accessibility audit, or measured learner outcomes ran. Device-specific part/policy/indicator checks remain necessary for a real repair; the authored scenarios state their assumptions explicitly.

### Next report priority

The regenerated report's gap 1 is **220-1201 objective 5.4: common mobile-device troubleshooting**, missing, in the 28% hardware/network troubleshooting domain. This is the current report result, not a hard-coded carryover recommendation.


## Review preparation and separate follow-up backlog

Review preparation on October 17, 2026 confirmed that upstream `main` remains at base `70fdac402a73850bd017c691c9262709e30bba78`. The final package contains exactly the eight reported files: five content JSON files, the two named Chapter 3 HTML visuals, and this verification document. No unrelated working-tree changes were present. Explicit comparison against the base JSON confirms the only altered existing topic is `core1-ch3-peripherals` (DVI statement), the only altered existing question is `q-141`, and no existing card or lab changed. The matrix comparison permits only 5.3's status/topics; all other objectives and global `reviewed: false` remain identical.

No package-created regression was found in the final review. Application code, schemas, dependencies, styling and navigation are unchanged. The remaining UI issues below are existing behavior, independently reproduced on old content using the same production build. The generic lab taxonomy limitation is newly exposed by adding a Core 1 lab, but its routing rule already applies to every lab; it is recorded explicitly rather than presented as newly implemented exam-aware lab navigation. Lack of physical-device/learner evidence is a validation boundary, not a product regression.

Review-preparation checks: `node work/check-display-content.mjs`, a comparison of every existing topic/question/card against the base, `npm run check:content` (0 errors, 25 existing warnings), `npm run report:objectives`, and `git diff --check` passed. `node work/review-display-baseline.mjs` reproduced the old-content UI behavior below. Earlier full test/build/browser results above remain applicable because content and application behavior were not changed during review preparation; only this documentation was extended.

The following is a separate follow-up backlog. These fixes are excluded from the 5.3 content PR.

| ID / priority | Existing issue and evidence | Reproduction steps | Expected follow-up acceptance |
| --- | --- | --- | --- |
| DISPLAY-F01 / P2 | Mobile document overflow in shared CCNA navigation. `app/components/TrackBar.tsx` is unchanged. Both old and new lab pages measure 409 px at a 390 px viewport; main content measures 390 px. | Open `/labs/two-subnet-lan` at 390×900. Compare `document.documentElement.scrollWidth` (409) with `innerWidth` (390). Inspect the screen-reader-only “coming soon” label in the scrolling tool row. Repeat on `/labs/display-path-isolation`; the same excess occurs. | Contain navigation's visually hidden labels without removing accessible names; retain horizontal tool-row navigation and no document overflow on both labs. |
| DISPLAY-F02 / P2 | Generic lab taxonomy assumes networking/CCNA. Existing `lib/tracks.ts` maps every `/labs` path to CCNA; `app/labs/page.tsx` labels the whole index “Networking labs.” Neither file changed. | Open old `/labs/two-subnet-lan` and new `/labs/display-path-isolation`; both activate CCNA. Open `/labs`; observe the fixed heading and absence of an exam filter. The new lab's own subtitle correctly identifies Core 1. | In a separately scoped navigation change, define lab exam metadata/filtering and track behavior, retaining access to existing networking labs. Do not claim the current schema already supports this. |
| DISPLAY-F03 / P2 | Chapter strip incorrectly disables Notes outside the notes page. Existing `lib/chapter.ts` supplies a null notes href and `ChapterStrip.tsx` renders it as “Coming soon.” | Open `/flashcards?topic=core1-ch2` or `/quiz?topic=core1-ch2`; observe Notes → Coming soon with no link. Open `/notes/core1-ch2`; the existing notes work. Repeat with the new display topic. | Notes tile links to the existing topic from cards/quiz and still indicates the current notes page correctly. |
| DISPLAY-F04 / P2 | Existing quiz skips per-question feedback. `QuizRunner.tsx` `submit()` advances immediately; the explanation display branch is bypassed during normal progression. | Open `/quiz?topic=core1-ch2`, start, note the prompt, select a choice, and click Check answer. Observe the next prompt immediately. Complete with a wrong answer; its explanation appears only in final missed-answer review. Reproduced on the existing topic during preparation. | A separately scoped quiz fix should show correct/incorrect reasoning before deliberate Next, preserve grading/progress identity, and verify the final-question flow. The written 5.3 lab already supplies result/feedback sections independently. |

No GitHub issues or unrelated fixes were created as part of this backlog record. Objective 5.4 implementation is excluded from this PR.


Publication note: the remote branch `content/core1-display-troubleshooting` already contained a different implementation at `8630baf` in open draft PR #60. A normal push was rejected; no force push or overwrite was attempted. That branch and PR are preserved. This reviewed package is published separately on `content/core1-display-troubleshooting-review` against `main`.
