# Core 1 objective 5.3 verification

Reviewed 2026-10-17 from `main` commit `70fdac402a73850bd017c691c9262709e30bba78`, on branch `content/core1-display-troubleshooting`.

## Scope and sources

CompTIA A+ Core 1 **220-1201 V15**, Exam Objectives Document **version 4.0**, page 3 (domain weights) and page 12 (objective 5.3), was inspected on 2026-10-17:

- [CompTIA objectives PDF](https://lecbyo.files.cmp.optimizely.com/download/34be017cb73211ef8985a6f347fbf652). Objective 5.3 is the video/projector/display troubleshooting task, with 13 listed symptoms. Domain 5.0 carries 28%; no separate 5.3 weight is published. Older accessible v2.0 and v3.0 PDFs were cross-checked, but v4.0 is the version used for this review. No objective PDF is copied into the repository.
- [Dell monitor diagnostics](https://www.dell.com/support/kbdoc/en-us/000124390/how-to-run-diagnostic-test-on-a-dell-monitor), self-test/BIST sections: isolate display-generated defects from the external signal path.
- [Dell pixel guidelines](https://www.dell.com/support/kbdoc/en-us/000126004/dell-display-pixel-guidelines), pixel definitions and testing: fixed dark/bright defects and model-dependent warranty limits.
- [Dell OLED pixel refresh](https://www.dell.com/support/kbdoc/en-us/000198595/alienware-aw3423dw-pixel-refresh-will-turn-monitor-off), description: temporary retention and panel care. The older US burn-in article redirected to sign-in; it was not treated as an inspected full-text source.
- [Microsoft Windows flicker troubleshooting](https://support.microsoft.com/en-au/windows/hardware/display-graphics/troubleshoot-screen-flickering-in-windows), Task Manager comparison and driver/app sections.
- [Epson focus and blur](https://files.support.epson.com/docid/cpd5/cpd52430/source/troubleshooting/reference/problem_image_blurry.html): focus, lens, placement, keystone, tracking/sync and native resolution.
- [Epson power/shut-off](https://files.support.epson.com/docid/cpd5/cpd59005/source/troubleshooting/reference/problem_power_blue_status_light.html): no-signal sleep and temperature-related shutdown. Indicator colors are model-specific, so the lesson does not prescribe universal colors.
- [Epson lamp replacement](https://files.support.epson.com/docid/cpd5/cpd57551/source/maintenance/tasks/replacing_lamp_typeab.html): power isolation, cooling, approved module, cover seating and timer reset. Its one-hour cooling interval is an example, not a universal requirement.
- [Epson sizing/aspect](https://epson.com/faq/SPT_V11H335120~faq-150407): cropped/small image and aspect settings.
- [Epson sound](https://files.support.epson.com/docid/cpd6/cpd62535/source/troubleshooting/reference/problem_sound.html): source output, mute, volume, cable and speakers.
- [StarTech digital-to-analog converter](https://www.startech.com/en-us/audio-video-products/dvi2vgacon), signal-conversion description: DVI-D digital output requires active conversion for analog VGA. The same digital/analog incompatibility applies to an analog-only DVI-A display; matching connector ends is insufficient.

All references retrieved 2026-10-17. The objectives establish scope; the diagnostic decisions, fictional evidence, distractors, and practice exercise are independently authored teaching content. Manufacturer procedures illustrate principles rather than certify every model. Flashlight/backlight interpretation is qualified as an inference, not identification of a specific failed component. An inverter is limited to applicable older CCFL designs; OLED is not backlit.

## Existing-content audit and duplication decisions

Inspected `content/source.md`, both topic arrays, questions, flashcards, labs, track visuals, relevant `public/visuals/` files, `lib/exams.ts`, `lib/content.ts`, and `lib/chapter.ts`.

- `core1-ch3-peripherals/video-signals`, `q-68`, `q-71`, `q-140`, `q-141`, `q-144`, `q-146`, `fc-70`, `fc-77`, and `core1-ch3-video-signals.html` already teach connector identification or bandwidth. They did not teach the 5.3 symptom-driven task. A projector-cable quiz item alone did not close the gap.
- `core1-ch2/raid5-video` teaches GPU installation, not this diagnostic task. Existing OS troubleshooting remains a prerequisite rather than a duplicated chapter.
- Corrected the directly relevant contradiction in `core1-ch3-peripherals/video-signals`, `q-141`, and the DVI visual: passive matching cable ends cannot convert analog and digital. `q-141` retains its ID and now has one unambiguous active-converter answer. The visual’s passive-cable exercise now uses an analog-capable DVI-I source and DVI-A display.
- New topic ID: `core1-display-troubleshooting`. Existing JSON arrays automatically feed Notes, Core 1 navigation, search, Quiz and Flashcards; no application routing or dependencies were added. New question/card IDs use `q-c1-display-01`–`16` and `fc-c1-display-01`–`16`.

## Symptom-level evidence matrix

Paths below are sections of `content/topics.json`, topic `core1-display-troubleshooting`. Questions are in `content/questions.json`; cards in `content/flashcards.json`. All listed symptoms have explanatory notes, a diagnostic decision, and recall practice. Each question explains its keyed choice and why alternatives are weaker under the stated facts.

| Symptom/task | Lesson section | Question suffix | Card suffix | Review result |
| --- | --- | --- | --- | --- |
| Incorrect input | isolation | 01 | 01 | OSD/input mismatch; select connected input first |
| Physical cable path | isolation | 02, 14 | 02, 03 | Known-good substitution; bypass dock; direction/capability matters |
| Failed bulb | projectors | 03 | 04 | Confirm lamp evidence, then safe model-specific service |
| Fuzzy image | image-quality; scenarios | 04 | 05 | Internal-menu blur versus source-only blur; focus/native mode |
| Burn-in | panel-defects | 05 | 06 | Retention versus lasting wear; no guaranteed software repair |
| Dead pixels | panel-defects | 06 | 07 | Fixed defect in internal solid-color test, not an input fault |
| Flashing screen | image-quality | 07, 14 | 08 | Cable/mode comparison; Windows app/driver clue is probabilistic |
| Incorrect colors | image-quality | 08 | 09 | Defect follows cable versus internal-test defect |
| Audio | geometry-audio | 09, 15 | 10 | Output routing; separate audio for VGA; speaker capability |
| Dim image | panel-defects | 10 | 11, 12 | Settings versus LCD illumination or projector lamp condition |
| Intermittent shutdown | projectors; scenarios | 11, 16 | 13 | Thermal evidence versus fixed no-signal idle timer |
| Sizing | geometry-audio | 12 | 14 | Overscan/fit, aspect, scaling, distance/zoom differentiated |
| Distortion | geometry-audio | 13 | 15 | Physical alignment/keystone versus electronic signal faults |
| Verification/prevention | projectors; scenarios; exam-traps | Explanations throughout | 16 | Retest original workload and document cause/action/outcome |

Answer review: the 16 new items have four distinct choices, valid single-answer indices, and an even distribution across positions (four each). Hardware findings are deliberately limited to what the scenario can support; model-specific settings are not universalized. `q-141` was separately checked against the StarTech signal-conversion reference.

## Coverage decision and remaining gaps

Set only **220-1201 5.3** to `covered` and map it to the new notes topic. It teaches all 13 listed symptoms with confirming tests, appropriate actions, prevention and verification. This meets the repository definition of covered (the main task is taught), independently of quiz counts. Keep global `reviewed: false`: this focused review does not verify the other preliminary mappings. Objective 3.1 remains partial; this lesson is not a complete survey of panel types and display attributes.

CompTIA’s symptom list is non-exhaustive. Device manuals remain necessary for exact lamp procedures, error indicators, mode support, panel service and warranties. There is no new interactive PBQ or physical projector lab, and the desk practice is not counted as a published lab. Physical-device repair and learning effectiveness were not verified. After the change, the next report gap should be **220-1201 5.4, mobile-device troubleshooting**.

## Validation

Results recorded after implementation below. Automated tests verify repository consistency and behavior, not the truth of every hardware claim. No deployed or physical-device checks were performed.

- `npm test`: **148 passed, 0 failed, 0 skipped** across game (95), practice (18), subnet (23), content (2), report (6), objectives (4). Includes the independent Python subnet fixtures.
- `npm run lint`: exit 0, three pre-existing `no-img-element` warnings in SectionBlocks and lab pages; no errors.
- `npm run typecheck`: passed.
- `npm run build`: passed, including statically generated topic routes.
- `npm run check:content -- --topic core1-display-troubleshooting,core1-ch3-peripherals`: no errors; three pre-existing five-choice warnings (`q-68`, `q-72`, `q-cls-024`). The same run with `--strict` exits 1 because those warnings are treated as failures; they were not suppressed or changed.
- `npm run report:objectives`: 5.3 is covered with 9 notes sections, 16 cards, 16 questions; first remaining gap is 220-1201 5.4.
- Ad hoc integration assertions passed for lesson discovery, correct exam filters, chapter Quiz/Flashcards links, search, unique topic/question/card IDs, distinct choices, valid answer indices, and even answer-position distribution. The repository test loader only resolves TypeScript aliases, so the first ad hoc attempt could not import JSON aliases; rerunning with an in-memory JSON-aware loader passed. No loader/application changes were made.
- Updated visual JavaScript syntax check passed. Production HTTP smoke checks returned 200 for the new Notes route, filtered Quiz and Flashcards routes, and corrected static visual. The first server start failed on this host's network-interface enumeration; binding explicitly to `127.0.0.1` and running the server and requests in the same process lifetime allowed the smoke checks to pass.
- `git diff --check`: passed. No local browser interaction, deployed browser, physical-device, or learner-observation checks were run. HTTP and data integration checks do not establish interactive usability or learning effectiveness.
