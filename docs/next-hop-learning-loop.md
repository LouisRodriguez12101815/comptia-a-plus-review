# Focused learning loop: next-hop troubleshooting

## Inspection before changes

Initial branch base: `10b41ef` on main, including merged Practice Games PR #20 and Chapter 9 visuals PR #21. Integrated newer main `7d16d77` (Visuals navigation PR #22) before final validation. Inspected navigation, local progress, practice transitions, notes/labs/flashcards, and the Outage Ops shared-room architecture. The Chapter 9 36-step, swimlane and receive-checklist visual registrations and the new per-track Visuals pages/navigation are preserved.

A phone-sized new-learner walkthrough confirmed that Follow the Packet could recover from a mistake and hint, but progress did not display retries, no practice reset was available, and its debrief offered review/replay rather than a fresh application linked to review. Its “Resume saved practice” control appears even without a saved record and reports that condition when selected; this release leaves the existing entry behavior alone. No game deadlock was observed in that walkthrough. These observations are local, not a claim about the deployed site.

Content inspection found two misleading existing flashcards: `fc-n6` conflated ARP caches with switch MAC tables and said ARP learns every device; `fc-n12` implied convergence requires every device to know every IP/MAC. Corrected both using the local Chapter 9 ARP/routing notes, Chapter 11 switch learning and Chapter 9 convergence explanation. There were no Chapter 9 flashcards for the focused review link, so three sourced cards were added. A saved Core 1 focus would exclude those Network+ cards; explicitly linked Chapter 9 review now uses a local Network+ focus without overwriting the saved preference.

## One complete topic, not site-wide mastery tracking

`/practice-games/next-hop-mission` uses Lab 01’s wrong-mask fault as supported practice. Three objectives each have one practice question and two different application questions. Answers include a justification, with immediate choice-specific feedback. A new application has different direction, fault, subnet or verification context; shuffling the same answers does not count as a new application.

| Objective | Practice | New applications | Achievement and evidence |
| --- | --- | --- | --- |
| Choose a distinguishing test | Compare PC-A2’s mask with its /26 plan after unexpected ARP | Reverse-direction wrong-mask case; authored /25 transfer | Evidence before repair: an unaided first answer selecting a targeted configuration test |
| Interpret next-hop addressing | Remote IP destination versus local gateway MAC | Reverse gateway interface; same-subnet host delivery | Next hop explained: an unaided first answer on different local/remote address reasoning |
| Verify and document | Test local, gateway and previously failed remote path after mask repair | Restored return gateway; repaired router interface/connected route | Repair verified: an unaided first answer choosing relevant verification and documentation |

Every question has a stable ID, answer IDs, source references, learning objective and Network+ N10-009 mapping (IPv4 addressing 1.7, routing concepts 2.1 and troubleshooting methodology 5.1). These describe practiced curriculum areas, not full coverage or official exam items. `content/next-hop-mission.json` is the structured source; `lib/practice/mission.ts` implements pure progression and derived metrics/rewards.

“Practice completed” does not imply proficiency. “Proficient in this check” requires first-answer correctness without hints on a different application. The UI explicitly limits this evidence to one check, not enduring mastery. A failed or hinted application can still be completed, but does not qualify; a second unseen variant is offered. If both variants need assistance, proficiency remains pending and review is recommended. Repeating familiar answers cannot grant it. This finite bank is intentionally not treated as an unlimited adaptive assessment.

## Review and repeat practice

Wrong choices and hints produce topic recommendations and links to the precise Chapter 9 note, Lab 01 break/fix or verification section, and Chapter 9 flashcards. Each source activity offers a return to the mission. No click, page visit or self-marked flashcard earns an achievement or proves learning. Returning resumes the recorded objective; its next application stays available without a required acknowledgment screen.

The Practice Games catalog and packet debrief offer “What should I practice next?” Recorded relevant packet mistakes/hints lead to the next-hop mission; mission mistakes/hints take priority over untouched objectives. Independent completion recommends applying the concept in the actual lab. This recommendation is intentionally scoped to one topic; it does not infer a learner’s needs across all certifications or import quiz scores as proof of proficiency.

The existing solo challenge summaries now display retries alongside first-attempt accuracy, hints and completion. For the mission, 100 points are recorded once per completed justified decision, or 75 after a priced hint. No duplicate credit, speed bonus, streak gate or extra achievement points. Three stable achievements are derived from independent applications, with a reason explaining each. Local points and rewards are practice records, not a shared competitive scoreboard.

## Sources and assumptions

No additional external factual sources were introduced in this increment:

- `content/topics-network-plus.json`: `n10-ch9` sections `routing-process`, `mac-arp`, `written-lab`, `static-dynamic`; `n10-ch11` section `mac-learning`. These support subnet/gateway selection, ARP, end-to-end IP versus local frames, and cache/forwarding distinctions.
- `content/labs.json`: `two-subnet-lan` sections `subnetting`, `addressing`, `break-fix`, `verification`. Provides Sales .0/26 and Ops .64/26, host/interface/gateway addresses, the /24-mask fault, missing gateway, administratively down interface and verification commands/results.
- `content/flashcards.json`: added `fc-next-hop-1` through `fc-next-hop-3` as concise review of those sources, corrected `fc-n6`/`fc-n12`.

The /25 network and all diagram MAC addresses are labeled authored teaching fixtures derived from the same subnet/next-hop rule, not claimed lab captures. Ethernet/IPv4, no NAT, allowed ICMP and healthy links/routes are stipulated except explicit faults. Empty/resolved ARP state is stated. Diagrams show the approved addressing plan rather than falsely animating a specific packet direction during a fault. Ping results support tested IP reachability, not proof every service works. The UI’s documentation choices are pedagogical prompts to record the configuration/tests, not claims that a real device was repaired.

## Storage, reset and preservation

The versioned `practice-mission:next-hop:v1` key stores receipts in this browser. Scores and achievements are recomputed from validated question IDs and sequential receipts; stale versions, unknown IDs, impossible application order and duplicate attempts are rejected. Browser reload resumes progress. Storage denial keeps the mission playable in memory and explicitly reports the persistence limit. Confirmed reset removes only this mission, including achievements; cancellation retains it. Other quiz/flashcard/game records and server rooms remain separate. Different browser tabs use localStorage notifications; concurrent tabs remain local last-write-wins practice, not shared authoritative play.

Outage Ops client/service/API/scoring/authorization/reconnect/duplicate/cost-guard code is unchanged. No multiplayer reward rules were added. Existing cooperation rewards and shared evidence behavior continue under server-authoritative state. These mission rewards are solo; no accounts, paid services, analytics or new tracking integrations were added.

## Validation and remaining gaps

- `npm test`: 105 passed (89 existing Outage Ops, 10 existing practice, 6 focused mission tests).
- `npm run lint`: passed; three pre-existing image warnings.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run test:e2e:learning -- --browser /usr/bin/chromium`: passed on real Next pages and real browser storage, without route/state bridges. Wrong response, hint, retry, reload, note/lab/flashcard review and return, fresh application, assisted/non-proficient outcome, independent reward, duplicate prevention, recommendation, full three-objective loop, reset cancellation/confirmation and storage denial were covered. Phone/reduced-motion layout and a vector diagram screenshot were inspected.
- `npm run test:e2e:practice -- --browser /usr/bin/chromium`: existing component/packet complete walkthroughs passed, including phone/desktop, feedback, hints, recovery, duplicate protection, resume and reduced motion.
- `npm run test:e2e -- --mock-sync --browser /usr/bin/chromium`: passed Guided Demo and both isolated responders through both incidents via real application API routes, including wrong-decision recovery, shared evidence, invalid/empty-host and undiscovered-host timeout overrides, immediate submission, duplicate protection and disconnect/reconnect. External Sync transport was explicitly mocked; application routes were not replaced.

Software checks establish reliable progression and accurate reporting of these interactions. They do not show improved learning. Learner testing is still needed for whether the choices distinguish misconceptions, independent transfer without answer options, retention, reading load and usability with real assistive technology/touch devices. Proficiency from one multiple-choice transfer can include guessing. More question variants and delayed checks should follow learner evidence, not precede it. Whole-site progress/recommendations, broader missions, adaptive scheduling and multiplayer achievements remain outside this focused increment. No configured Sync service or physical laptop/phone deployment test was available; no live multiplayer or deployment success is claimed.
