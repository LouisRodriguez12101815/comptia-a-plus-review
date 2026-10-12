# Deployed Outage Ops laptop-and-phone acceptance

**Prepared manual plan; no deployed/physical-device step below is verified.** Each result is Pending until the user observes it. Local real-route/mock checks and the cleanup classification are recorded in [the validation record](outage-ops-lobby-recovery.md). Polling-only success does not prove real Twilio subscriptions; software tests do not establish improved learning.

## Setup and evidence

Use a physical laptop and phone with separate browser sessions, different call signs, and the **same authorized deployed origin** at `/game`, backed by already-configured real Twilio Sync. Use fresh pages and record the non-secret `/api/game/version` response. For lobby-fix acceptance, the deployed commit must include `c4293db` or its reviewed equivalent/descendant and protocol 4. PR #33 remains draft: this plan does not authorize merging or deployment. If the fix is absent, mark its checks Blocked: fix not deployed.

Record deployment URL, date/time/timezone, build/protocol, device OS/browser versions, and Pass/Fail/Blocked/Not run for each step. Never expose credentials, tokens, cookies, request headers, token-response bodies or network exports. Troubleshooting evidence may contain only operation names, status codes, sanitized failure reasons and request IDs; crop screenshots to the game UI and keep active room codes private.

Do not provision resources, change Twilio configuration, disable the daily guard, inject room state, or use mocked transport for this plan. An unconfigured service, access error or daily pause means Blocked, not Pass. Preserve the same browser profile for reconnect; do not explicitly Leave or clear cookies. Disconnect both Wi-Fi and cellular when testing phone absence. Rooms expire after 30 minutes.

## A. Normal cooperative campaign — fresh room

| Step/action | Expected result | Manual result |
| --- | --- | --- |
| A1 Laptop creates room | Six-character code, host designation, one lobby player; room storage responding. | Pending |
| A2 Phone joins same deployed origin/code | Both devices show two distinct players without refresh; phone has no host controls. | Pending |
| A3 Check live connection | Both show “Room storage: responding · Live updates: connected”; token operation succeeds without exposing its body; no subscription/permission error. Changes arriving solely via polling do not pass this Sync check. | Pending |
| A4 Host ready, connected phone unready; toggle phone readiness | Start stays disabled while any connected player is unready; changes appear on the other device. Both ready enables host Start mission only. | Pending |
| A5 Host starts | Same briefing, incident, question and shared deadlines on both; no automatic answers/discoveries. | Pending |
| A6 Inspect evidence before discovery | Each required item is an actionable card; ordinary two-player clues are complementary. Diagrams do not expose unopened private evidence. A legitimate empty assignment shows Complete · 0/0. Do not alter state to create this case. | Pending |
| A7 Discover one card, inspect both devices, then discover the other | Shared findings appear on both; required outstanding items identify owners. Answers unlock after required discoveries. Discoverer earns +10 once per question; teammates receive no automatic discovery points. If a shared item occurs naturally, one discovery satisfies every owner. | Pending |
| A8 Both choose justified decisions | Evidence-based feedback and consequence/test result appear. Correct answer earns +100 individual points once; team score remains separate. Host waits for applicable answers before advancing unless authorized override applies. | Pending |
| A9 Deliberate incorrect choice, read feedback, then different supported answer | Recoverable explanation; uptime −5 percentage points and deadline −5 seconds. Repeating the same wrong decision adds no penalty; correct recovery earns only one correct-answer award. | Pending |
| A10 Read hint cost, request shared hint; try repeated taps where available | Hint costs exactly 25 team points once and appears on both. Repeated answer/discovery/hint attempts are disabled/rejected without duplicate rewards or penalties. Manual taps supplement, not replace, concurrent-request unit coverage. | Pending |
| A11 Optionally publish justified role finding after correct decision | Useful role action earns +20 once per player/question and appears in shared findings. | Pending |
| A12 Host advances through all ten rounds/both incidents | Both devices advance together; roles rotate; all required cards remain actionable. Team advancement rewards stay separate from individual contributions. | Pending |
| A13 Compare final debrief | Same team outcome, score, uptime and incident results; distinct contributions, evidence/decision reconstruction, mistakes, review links and transfer question. No repeat resolution award on reconnect/reload. | Pending |

## B. Evidence timeout — separate fresh two-player room

| Step/action | Expected result | Manual result |
| --- | --- | --- |
| B1 Start; leave host card undiscovered while phone discovers its own | Required evidence blocks answers; visible timeout uses server time; host clue remains private. | Pending |
| B2 Inspect controls before timeout and on guest | Host override unavailable before the documented 15-second wait; guest has no host override; no automatic points/progression. | Pending |
| B3 After timeout, host selects Continue with current evidence without discovering own card | Successful response immediately enables answers without reload. Waived requirements award no discovery points. Host still answers before advancing, but an idle teammate cannot permanently block it. | Pending |
| B4 Submit/advance and finish | Both reach debrief; override/mistakes are represented honestly; repeated taps do not multiply scores. | Pending |

Unavailable/invalid-host evidence was fault-tested locally. Do not corrupt deployed state to manufacture it. If naturally encountered, check Complete · 0/0 and override unlock; otherwise record that specific case Not run.

## C. Normal participant reconnect — separate fresh room

| Step/action | Expected result | Manual result |
| --- | --- | --- |
| C1 After phone discovery/answer, record contribution totals; disconnect phone without Leave | Laptop shows disconnection after 30 seconds since last heartbeat. Visible host evidence fallback prevents permanent waiting. | Pending |
| C2 Restore networking/resume same browser | Same authenticated player, no duplicate roster entry; scores, submissions and discoveries preserved. Sync returns to connected; polling fallback remains clearly labeled if recovery is incomplete. | Pending |
| C3 Reconnect with an undiscovered saved item, before or after host override | Ordinary participant retains assignment. Before override the item may become required again, with timeout recovery available; an already-authorized override remains effective. No fabricated points. | Pending |
| C4 Finish both incidents | Both see final debrief; no duplicate answer or resolution rewards. | Pending |

## D. Lobby recovery and late observer — requires deployed fix

Use separate rooms for reconnect-before-recovery and reconnect-after-start.

| Step/action | Expected result | Manual result |
| --- | --- | --- |
| D1 Join, mark only host ready, disconnect phone completely without Leave | Initially blocked; after 30 seconds since last heartbeat host sees prominent Continue with connected players naming the phone for exclusion. | Pending |
| D2 Restore phone before recovery, leaving it unready | Authenticated presence restores normal participation and blocks start until ready. A stale recovery must not exclude a reconnect that committed first. Both ready then normal start gives both actionable evidence. | Pending |
| D3 Repeat D1 in new room; ready host selects recovery after threshold | Only absent players excluded; all connected players must be ready. Remaining host receives all required actionable evidence. Repeated start/recovery cannot reset incident/deadlines or award points. | Pending |
| D4 Restore phone after recovery starts | Same identity/contributions, clearly labeled observer for entire campaign; Complete · 0/0; no new evidence/answer requirements or scoring/hint/role mutations. Shared discovered findings visible. New room required to participate again. | Pending |
| D5 Host discovers/submits/advances through both incidents with connected observer | Observer never blocks new rounds/next incident. Both reach final debrief; observer contributions do not automatically increase. | Pending |

## Acceptance and interruptions

Physical-device multiplayer remains Pending until the applicable flows are actually observed on both devices with real Sync. Record partial/blocked results separately. A local PASS, successful deployment/token operation or phone-sized viewport does not close device acceptance.

On failure, record the last verified step, affected device, visible status, expected/observed result and sanitized diagnostic/request ID. Resolve the demonstrated connection problem and resume only interrupted checks; if the room expired, label a new-room replay explicitly. Do not repeat completed local checks or modify code/configuration without new evidence. Do not merge.
