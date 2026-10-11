# Subnet Architect

Solo Network+ N10-009 (objectives version 4.0, objective 1.7) practice at `/practice-games/subnet-architect`, added to the existing filtered Practice Games catalog. Branch starts from main `0c3e205`. Outage Ops, Guided Demo, Twilio services, multiplayer scoring, reconnects and the daily guard are unchanged.

## Learning loop and observable objectives

| Activity/stage | Observable practice | Scored interaction |
| --- | --- | --- |
| Detective: mask | Convert a stated prefix to a mask and boundary increment | Submit mask and block size |
| Detective: bounds | Locate the containing aligned network and broadcast | Submit both bounds |
| Detective: usable range | Exclude network and broadcast reservations | Submit first and last usable addresses |
| Detective: capacity | Calculate conventional capacity and classify the given address | Submit capacity and usable-host decision |
| Architect: order | Prioritize largest usable requirements | Arrange requirements using tap/keyboard buttons |
| Architect: prefixes | Select sufficient blocks that together fit the parent | Submit seven prefixes |
| Architect: allocation | Allocate aligned, nonoverlapping blocks and usable interfaces | Submit networks, gateways and link peers |
| Architect: reason | Verify containment, capacity, alignment and reservations | Choose a justified verification explanation |
| Both: context | Apply an IPv4 addressing principle | Choose an explained concept decision |

Each verified stage awards 100 points, or 75 after an explicitly priced hint. Incorrect decisions give specific feedback and can be corrected; they do not award points. Repeated identical submissions are ignored; successful stages lock. First-attempt accuracy, unique retries, hint use, completion and points are separate metrics. Scores describe the current solo run, not a competitive or persistent point bank. Guided formulas support practice without claiming independent performance. A fresh, unaided, first-attempt transfer in Challenge mode earns accurately worded independent-transfer feedback, explicitly not enduring mastery.

Subnet Detective uses ten readable source headers plus a new broadcast-boundary transfer. VLSM Architect includes the requested gateway-inclusive VLAN Exercise #6 and an authored transfer with a different parent and requirements. Constraint grading accepts alternative valid layouts, including larger sufficient LAN blocks when everything fits. It does not compare against the example CSV answer. Links use /30 explicitly; /31 and /32 are unsupported with explanatory errors.

Topology and address-space vector diagrams have text descriptions, visible labels and responsive phone layouts. Typed fields and reorder buttons avoid requiring drag gestures. Binary/prefix review is optional and counts as a hint. Equal-size subnet counts require an explicit parent, without historical class inference. Source review includes corrected Chapter 7 concepts and separate, unscored IPv6 questions.

## State, architecture and source boundary

`content/subnet-architect.json` holds stable exercises/stages, requirements, expected oracle values, context decisions, explanations, references, exam mapping and unresolved source records. The arithmetic engine uses ordinary unsigned-safe Number arithmetic; grading derives boundaries and constraints from the engine rather than trusting fixture answers. Pure run reducers govern progression, deduplicated receipts, hints, restoration and debrief metrics.

Only the latest run is stored in this browser's `localStorage` key `subnet-architect:run:v1`. A new run replaces it. Resume restores typed drafts as well as receipts; restoration validates shape, IDs, ordering and duplicates and recalculates scores. The reset has confirmation/cancel and clears only this game's key. Storage failure is visible. This is user-editable solo practice state, not authenticated multiplayer scoring or an assessment record. No accounts, new services, tracking integrations or game API requests are added.

See [the source audit](subnet-source-verification.md) for preserved RTF/CSV hashes, all ten readable calculations, the invalid handwritten `.256` correction, official references and ambiguous-image limits. The pasted user request governs implementation; instructions inside the ZIP are not treated as additional authorization.

## Validation

- `npm run lint`: passes, with three existing Next image warnings outside this feature.
- `npm run typecheck`: passes.
- `npm test`: all 127 Node tests pass (105 existing and 22 new subnet tests). Node reports existing-style module-detection warnings; no failed or skipped tests.
- `python3 scripts/verify-subnet-fixtures.py`: independently checks every readable problem, the new boundary transfer, both VLSM examples and every CSV field with stdlib `ipaddress`. Python 3 is required only for this developer check, not the deployed app.
- `npm run build`: production build passes.
- `npm run test:e2e:subnet -- --browser /usr/bin/chromium`: real rendered production Next UI, phone viewport and reduced motion; both modes complete after incorrect responses and hints, duplicate submissions award nothing, typed fields survive reload, swapped /25 allocations pass, targeted debriefs lead to source review and return, separate IPv6 review is unscored, both new transfers complete independently, scoped reset preserves unrelated progress.
- Existing `test:e2e:practice` and `test:e2e:learning` browser walkthroughs pass.
- Existing `test:e2e` Outage Ops walkthrough passes Guided Demo and isolated two-player evidence, answers, recovery, advancement, timeout overrides and reconnect checks using **mocked Sync transport and real application routes**. This does not prove live Twilio/cross-device behavior. No configured test Sync service was available.

The browser scripts require a production build and Chromium; each owns a separate local server. Screenshots and structured results are written under ignored `work/` for review.

## Remaining limits

Original-resolution files for the narrow images 2, 4 and 6 are absent, so their unreadable problems are not guessed or graded. Chapter 8 full text was not supplied. Only readable headers are verified; the audit does not claim complete transcription of tiny annotations. Authored transfers are identified explicitly.

Software checks demonstrate arithmetic, progression and UI behavior, not improved learning. Learner testing is still needed for instruction clarity, reading load, usability on actual phones, independent transfer and retained understanding. A transfer can be replayed and is not a controlled assessment. The conceptual explanation choice is an observable verification decision, not an evaluation of free-form reasoning. Live deployment identity, real Twilio Sync and an actual laptop/phone shared-room acceptance remain unverified. This feature is labeled solo, not multiplayer; future cooperative variants need shared server-authoritative state and cross-device tests.
