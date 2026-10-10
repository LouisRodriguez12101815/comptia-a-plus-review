# Outage Ops MVP

Outage Ops is a 2–8 player cooperative CompTIA incident-response game. Players join by room code, gather evidence, choose diagnostic actions, repair a fault, and verify the fix before shared uptime reaches zero.

## Entry modes

- **Guided Demo:** one learner and a deterministic mentor bot. No account or API key.
- **Create Room:** a host creates a six-character code and configures a mission.
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

- 2–8 players, no login, separate devices.
- Six-character room codes excluding ambiguous characters.
- Server-authoritative room state with versioned conditional updates.
- All clients synchronize lobby, phase, timer, answers, uptime, and results.
- Reconnect token restores the same player without duplication.
- Host gets a 60-second reconnect window before automatic transfer.
- Joining closes when the mission starts.

## Submission milestones

1. Game entry and complete Guided Demo.
2. Durable room store and synchronized lobby.
3. One multiplayer incident using the Guided Demo state machine.
4. Reconnection, host transfer, timer, and scoring validation.
5. Expand to 15 polished incidents.
6. Public deployment and two-device acceptance test.
