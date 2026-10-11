# Outage Ops MVP

Outage Ops is a 2–8 player cooperative CompTIA incident-response game. Players join by room code, gather evidence, choose diagnostic actions, repair a fault, and verify the fix before shared uptime reaches zero.

## Entry modes

- **Guided Demo:** one learner and a deterministic mentor bot. No account or API key.
- **Create Room:** a host creates a six-character code for a DNS and DHCP relay response session.
- **Join Room:** another player joins with the room code and a nickname.

## Visual direction

- Clearly visible low-poly facets and hard geometric edges.
- Flat navy, cyan, teal, amber, and red material blocks.
- Baked dark-to-teal gradients rather than complex lighting.
- CSS geometry and conventional accessible controls instead of a heavy 3D engine.

## Game loop

`lobby → briefing → investigate → interpret → diagnose → repair → verify → debrief → next incident/results`

The first scenario is based on Lab 03, “I Can’t Reach the Website.” The IP path works but PC1 points to a nonexistent DNS server. Players must scope the issue, test in layers, correct the setting, and repeat the failed test.

## Guided answer handling

- Each answer has a stable `id`; the question stores its separate `correctAnswerId`.
- Shuffle a copy of the answers when entering each question or restarting a mission. Determine correctness by ID, never by display position.
- Begin unanswered and wait for the player to choose. A choice submits the answer and locks the options until the player retries or continues.
- Show answer-specific feedback and mentor reasoning immediately after submission. An incorrect answer also reveals the mentor hint.
- **Try again** clears the selection without advancing or reordering the current answers. Keep hints and uptime penalties, and award points no more than once per question.
- **Continue** is available only after submission and enters the next question unanswered.

## Multiplayer contract

- Up to 8 players, no login, separate devices; a ready host may start alone.
- Six-character room codes excluding ambiguous characters.
- Server-authoritative room state with versioned conditional updates.
- All clients synchronize lobby, phase, timer, answers, uptime, and results.
- Reconnect token restores the same player without duplication.
- Explicit leave transfers hosting to the next player. A disconnected host retains hosting and can reconnect; automatic host failover is deferred.
- Joining closes when the mission starts; existing authenticated players may reconnect.
- One Twilio Sync Document per room, expiring 30 minutes after creation (activity never extends it).
- Server-issued short-lived Sync tokens with read-only document permissions; service ACL must be enabled.
- Players mark ready/unready; only the host starts after every player is ready. Shared start/end timestamps control the countdown and timer.
- Each player explicitly submits one answer per question; server-side ID checks award 100 points for correct answers and penalize shared uptime by 5 for incorrect answers. Feedback does not advance the question. The host continues after answering and receiving connected-player answers, or explicitly proceeds after the evidence timeout.
- Individual contribution: evidence discovery +10 per question, a useful assigned role action +20, a correct answer +100, and helping resolve an incident +25. These contribution totals are separate from the team score.
- Team decision score is awarded once when the host advances, independent of team size: a clean correct decision earns 100 × the new streak (capped at ×3); mixed answers or an unsupported role action earn 50 if at least one answer is correct, otherwise 0. Mistakes reset the streak and cost 5% uptime plus five seconds. Uptime score is uptime ×10, shown separately from team points.
- One optional shared hint per question costs 25 team points, even if the score becomes negative. Repeated requests never charge twice. Hints do not alter individual credit.
- Eight distinct roles rotate between incidents: coordinator, network technician, evidence analyst, recovery verifier, endpoint specialist, change steward, incident scribe, and user liaison. Each role has a responsibility and an assigned useful action; the server rejects another role's action. Roles are unique among current room members.
- Evidence fragments are returned only through the authenticated player's API snapshot after discovery, never through the shared Sync Document. All distinct required evidence items must be discovered before answering; one owner can cover an item assigned to multiple responders. Each submitter must discover their own evidence. Solo play receives both fragments and can answer immediately after discovery. The UI identifies outstanding items and owners, connection state, missing answers, and a 15-second countdown from the current question opening. After the timeout the host may choose **Continue with current evidence**, relaxing missing evidence and teammate answers for this question only. The host still must discover and answer. The override is shared, server-validated, idempotent, and never grants missing discovery or answer points. Assignment IDs stay stable across reconnects; explicit leave to a solo room makes the remaining responder self-sufficient. Voice/chat communication happens outside the app.
- The host explicitly starts the second incident after the first debrief. Roles rotate, a new timer starts, and team score, streak, uptime, and individual contributions persist. The final debrief summarizes both outcomes, contribution breakdowns, objective areas, and review topics prioritized by mistakes or hints. An incident resolves only if the team found a correct answer for every question; an all-wrong question produces an unresolved outcome. Timeout or zero uptime ends the session.
- All writes use the existing authenticated, cost-guarded Sync CAS path. Duplicate evidence/hint requests are idempotent; duplicate answers, role actions, advances, and incident transitions are rejected. Question writes include both incident and step indices to reject delayed requests from earlier incidents.
- A signed daily usage webhook latches `MULTIPLAYER_PAUSED` in shared server storage at $5 and blocks room creation, joins, token issuance, and all room/permission writes until the next UTC day. Provider errors fail closed.
- See [deployment and acceptance instructions](outage-ops-multiplayer.md). Live laptop/phone acceptance is pending.

## Submission milestones

1. Game entry and complete Guided Demo.
2. Durable room store and synchronized lobby.
3. One multiplayer incident using the Guided Demo state machine.
4. Reconnection, host transfer, timer, and scoring validation.
5. Expand to 15 polished incidents.
6. Public deployment and two-device acceptance test.

## Multiplayer scenario sources

- DNS: Lab 03 (`content/labs.json`, `cant-reach-website`, method and steps 1–6) plus DNS notes (`content/topics.json`, `networking-dns-dhcp`, `dns`). Guided Demo uses this existing scenario unchanged.
- DHCP relay: Lab 02 (`content/labs.json`, `dhcp-relay-three-site`, addressing, how-it-works, troubleshooting) plus DHCP notes (`content/topics.json`, `networking-dns-dhcp`, `dhcp`). Questions use Miami's recorded `194.168.50.0` route typo and documented correction `ip route 192.168.50.0 255.255.255.0 10.0.2.2`. Verification explicitly preserves the lab's “Miami lease test in progress” status rather than assuming success.
- Already-running DHCP/VLAN rooms retain the previous scenario and answer IDs until expiry; their review maps to DHCP notes and Chapter 11 VLAN visuals. New campaigns use the relay scenario.

Debriefs link the source notes/labs and identify the practiced sections.
