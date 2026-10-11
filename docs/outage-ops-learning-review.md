# Outage Ops cooperative troubleshooting review

## Scope and confirmed observations

Review date: 2026-10-11. Main was `b8211223f776039c8f760ddc813a5b14f741a7eb` (PR #18 certification navigation, incorporating PR #15 Chapter 9). The prior multiplayer hotfix PR #17 (`2fda6b147a74fea98afab7023a8c491e1954c6fb`) is not on main. This branch includes its canonical evidence model, source-supported diagrams, version diagnostics, and real-route browser harness as prerequisites. Baseline browser review used `e41c478`, main plus that prerequisite, before the learning changes.

Observed through the rendered production build, isolated 1366×900 desktop and 390×844 phone contexts, real application routes/cookies, and **mocked external Sync HTTP/realtime transport**:

- Guided Demo completed all five DNS decisions and debrief. An incorrect router restart reduced uptime; Try again worked. There was no diagram. Continue was also offered after an incorrect answer, permitting an unsupported “resolved” ending.
- Both room players received and discovered complementary cards. Both submitted correct decisions and advanced through ten questions across the DNS and relay incidents.
- A wrong multiplayer decision disabled every choice; a corrected submission returned 409. There was no diagnostic recovery opportunity.
- Neither viewer had a shared findings panel. Reading another player's evidence required out-of-game communication despite shared discovery state.
- The entire five-decision incident had a 120-second deadline. The DNS source lab estimates about ten minutes. This is a design mismatch; learner stress or comprehension effects were not measured.
- Generic role buttons awarded +20 after discovery without requiring a justified decision. Discovered cards continued offering an unnecessary Review request.
- Scoreboard/rules, repeated timeout messages, and card/role controls competed with the diagnostic task. This is a usability judgment, not a measured user-study result.
- Existing debriefs summarized scores and broad topics rather than the actual diagnostic decisions or misconceptions.
- Baseline host timeout, malformed-host assignment, shared ownership, disconnected owner, and reconnect checks passed on the prerequisite build. These are local test results, not Production evidence.

## Deployment evidence and limits

GitHub deployment `6997030129`, labeled `Production`, records SHA `b8211223f776039c8f760ddc813a5b14f741a7eb` and success at `2026-10-11T14:36:15Z`. Its `production_environment` field is false, so the label/status should not be overinterpreted. The immutable URL is `https://comptia-a-plus-review-najoixtw5-louis-projects-b5c89c35.vercel.app`. Both that URL and `https://comptia-a-plus-review.vercel.app/api/game/version` returned proxy CONNECT 403, with no application HTTP response.

This confirms deployment metadata, not the exact bytes served by the public alias. Running asset hashes, client/API compatibility on Production, two-player Production traces, actual Sync transport, and physical laptop/phone play remain unverified. No configured test Sync credentials are available in the managed environment. Do not request secrets in chat; configure a dedicated test service through the environment's secret configuration.

## Focused changes

- Each round states an observable objective and original symptom. DNS Guided Demo also renders the source-based diagram.
- Discoveries are shared as readable findings. Unopened cards stay private; sharing does not automatically award another owner contribution points. Discovered cards require no review click.
- Incorrect room decisions retain feedback and enable different choices. Repeating the same choice, submitting after a correct decision, stale-question submissions, and concurrent duplicate correct requests remain rejected server-side. Compact attempt receipts preserve penalties and prevents a recovered round from becoming a clean streak bonus.
- Role publication requires a server-validated correct decision, and publishes its evidence-based rationale to teammates. It is optional and cannot block progress. This remains a constrained choice-based justification, not proof of an independently authored explanation.
- Correct feedback includes a consequence/next test, weaker alternative, and “What we learned” before advancement. Guided Demo requires a supported decision before proceeding; it no longer labels skipped wrong decisions as a resolved incident.
- New rooms provide a ten-minute discussion window per incident. Existing room deadlines are preserved. The visible 15-second host fallback, server deadlines/penalties, 30-minute room lifetime and $5 daily guard remain intact. There is no speed bonus.
- The scoring/rules panel is collapsible. Team points and individual contributions remain distinct.
- Compact shared history retains discovered evidence and distinct decisions across role rotation. The debrief reconstructs the sequence, identifies supported decisions and actual misconceptions, notes hints/fallbacks, links objectives/sources, and asks a transfer question. Points explicitly do not establish mastery.
- Room protocol advances to 3 so older assets are rejected with refresh guidance rather than interpreting incompatible snapshots. New goal/result metadata does not reveal results or conclusions before a supported decision.
- A pre-existing Chapter 9 raw internal link was converted to Next Link to allow the repository-wide lint check to pass.

## Observable goals and factual mapping

Every row below maps evidence discovery, a justified choice, optional role publication, and team advancement to the stated goal. Source sections are in `content/labs.json`; linked notes are in `content/topics.json` (`networking-dns-dhcp`). These are original practice tasks based on the sources, not official exam items.

| Incident / round | Observable goal and scored decision | Factual source |
| --- | --- | --- |
| DNS 1: scope | Compare working and failing clients; distinguish local from shared scope | [Lab 03](https://comptia-a-plus-review.vercel.app/labs/cant-reach-website), ticket, step-1 |
| DNS 2: inspection | Select link/IP inspection before disruptive changes | Lab 03, step-2 |
| DNS 3: interpretation | Use successful IP tests and failed hostname lookup to isolate name resolution | Lab 03, step-3, step-4, step-5 |
| DNS 4: probable cause | Compare the configured resolver with the approved baseline | Lab 03, quickstart, step-5 |
| DNS 5: repair/verification | Select the targeted DNS correction and repeat the original tests | Lab 03, step-6 |
| Relay 1: scope/path | Explain why server location requires a relay | [Lab 02](https://comptia-a-plus-review.vercel.app/labs/dhcp-relay-three-site), scenario, addressing, how-it-works |
| Relay 2: probable cause | Compare the recorded static route's octets with the DC network | Lab 02, troubleshooting |
| Relay 3: discriminating test | Choose outbound reachability plus return-route inspection when an Offer is absent | Lab 02, how-it-works, troubleshooting |
| Relay 4: targeted repair | Choose the documented destination, mask and next hop rather than restarting services | Lab 02, terminal-commands, troubleshooting |
| Relay 5: verification/documentation | Distinguish a recorded route fix from a lease test that remains pending | Lab 02, verification, troubleshooting; lab status field |

### Scored interactions

| Interaction | Authoritative award/cost | Learning goal relationship |
| --- | --- | --- |
| Explicit evidence discovery | +10 individual, once per player/question | Gather the observations needed for that round's goal; shared completion awards no automatic points |
| Supported diagnostic/test/repair/verification choice | +100 individual, once per player/question | Perform the round's observable decision; retry does not multiply credit |
| Publish justified role finding | +20 individual, once per player/question, after a supported choice | Communicate the round's evidence-based rationale with a named role responsibility |
| Team advancement | 100 × clean streak, capped ×3; 50 with errors but at least one supported choice; otherwise 0 | Recognize evidence-based team decisions; prior errors remain in history and prevent clean credit |
| Incident resolution | +25 individual for a contributor with a supported decision | Recognize participation in a sequence reaching a supported decision for each round |
| Shared hint | −25 team, once per question; cost visible before use | Scaffold interpretation while recording assisted practice |
| Distinct incorrect choice / unsupported shared restart | −5% uptime, −5 seconds; duplicate receipts cannot repeat the penalty | Make unsupported changes consequential while preserving a diagnostic recovery opportunity |

Scoring and recovery are enforced against persisted shared state with revision retries. No speed-based reward is added. Role publication and team streaks are practice incentives; they do not demonstrate independent troubleshooting mastery.

## Verification

- `npm test`: 89 passing tests, including six new learning regressions; eight-player/two-incident Sync-adapter and multi-retry tests enforce the 16KiB shared-document limit.
- `npm run typecheck`: passed.
- `npm run lint`: passed, zero errors and three existing image warnings.
- `npm run build`: default Turbopack production build passed in the current managed environment.
- `npm run test:e2e -- --mock-sync --browser /usr/bin/chromium`: passed, including complete Guided Demo and both room incidents with recovery. This uses actual rendered UI and API routes, not a game-route test bridge. Only external Sync HTTP and realtime transports are mocked. State faults in shared ownership/assignment/disconnection tests are explicitly fixture-injected.
- Baseline and final harness reports contain sanitized operation names/statuses/request IDs, never tokens, cookies, credentials or request headers. Scratch reports are under ignored `work/`.

The walkthrough covers Guided Demo wrong-answer retry and completion, both room players' evidence and shared findings, wrong-answer recovery with no duplicate penalty/credit, justified role publication, every decision and advancement in both incidents, history/debrief, host timeout without evidence, malformed assignments, shared ownership, disconnection and reconnect.

## What automated checks establish, and what remains

The implementation supports observable scope selection, evidence comparison, probable-cause recognition, discriminating-test selection, result interpretation, targeted-repair selection, verification-plan selection, and source-based outcome documentation review. Automation establishes functional progression, feedback availability, privacy and scoring invariants. It does not establish improved learning.

Learner testing must still evaluate comprehension, discussion quality, mobile reading load, role usefulness, appropriate time allowance, and transfer to a new symptom. Most tasks are constrained choices; learners do not execute commands or author a full ticket in this game. A selected verification plan does not prove a real repair. The DNS debrief directs execution to Packet Tracer; the relay debrief explicitly preserves the source's pending Miami lease test.

Before claiming deployed multiplayer works, use an actual laptop and phone on the same deployed room with configured Sync: discover both clues, discuss findings, submit an incorrect decision and recover, submit supported decisions, read feedback, and advance through an incident. Repeat with a missing/idle teammate and no host discovery until the visible timeout; confirm the override immediately unlocks submission. Inspect the served version/commit and assets. Those live checks remain pending. The PR remains draft; no merge or Production deployment was performed.
