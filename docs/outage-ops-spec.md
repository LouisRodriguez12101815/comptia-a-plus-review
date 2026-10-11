# Outage Ops MVP

Outage Ops is a 2–8 player cooperative CompTIA incident-response game. Players join by room code, gather evidence, choose diagnostic actions, repair a fault, and verify the fix before shared uptime reaches zero.

## Entry modes

- **Guided Demo:** one learner and a deterministic mentor bot. No account or API key.
- **Create Room:** a host creates a six-character code for the DNS mission.
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
- Each player explicitly submits one answer per question; server-side ID checks award 100 points for correct answers and penalize shared uptime by 5 for incorrect answers. Feedback does not advance the question. The host continues after connected players answer.
- A signed daily usage webhook latches `MULTIPLAYER_PAUSED` in shared server storage at $5 and blocks room creation, joins, token issuance, and all room/permission writes until the next UTC day. Provider errors fail closed.
- See [deployment and acceptance instructions](outage-ops-multiplayer.md). Live laptop/phone acceptance is pending.

## Submission milestones

1. Game entry and complete Guided Demo.
2. Durable room store and synchronized lobby.
3. One multiplayer incident using the Guided Demo state machine.
4. Reconnection, host transfer, timer, and scoring validation.
5. Expand to 15 polished incidents.
6. Public deployment and two-device acceptance test.
