# Outage Ops lobby absence recovery

Target: `fix/disconnected-lobby-recovery`, based on main `3bf1fc1`. Route `/game`, cooperative room mode. This is a focused fix for the disconnected, unready guest lobby deadlock; it does not change Guided Demo or solo practice games.

## Confirmed failure and correction

The original UI calculated readiness over every stored player, and `RoomService.start` did the same. The server already considered a player disconnected after 30 seconds without a heartbeat, but readiness ignored that status. A ready host therefore could not start after an unready guest disappeared. The new deterministic regression failed on the original code with HTTP-equivalent 409, “Every player must be ready before starting.” Existing post-start evidence recovery did not apply in the lobby.

`lib/game/lobby-model.ts` derives one server-time gate using the existing `CONNECTION_WINDOW` from `lib/game/evidence-model.ts`. Protocol 4 identifies the new lobby/observer contract so incompatible cached clients receive the existing reload-required response. Existing stored rooms retain their state; the optional participation flag defaults to normal participation. Snapshots expose the gate, and both rendered controls and the start endpoint use it. Presence is based on the last successful authenticated heartbeat, not a browser's claimed connectivity. The host's authenticated start request refreshes its own presence before validation.

- **Normal start:** all stored players are connected and ready. Any connected, unready player blocks it.
- **Recovery:** after at least 30 seconds of absence, the host sees a prominent “Continue with connected players” control and the exact disconnected players to exclude. All connected players, including the host, must be ready. No absent player is silently excluded by normal start.
- **Endpoint:** host-only `POST /api/game/rooms/[code]/start` with `continueWithConnected: true`. The server recomputes readiness and presence within the compare-and-swap transition. A stale UI cannot exclude a player whose authenticated reconnect committed first. Non-host, premature, invalid-mode and no-longer-applicable recovery requests fail.
- **Atomicity:** only one concurrent start/recovery transition commits. Subsequent starts return 409 without resetting deadlines, assignments, incident indices or scores. Recovery itself earns no points.

## Participation and late reconnect policy

Excluded players remain in the stored roster with `excludedFromMission: true`; their authentication identity, seat, score and contributions are retained. They are observers for the **entire room campaign**, including later incidents. Starting a new room is required to participate again. This deliberately avoids modifying frozen assignments or adding answer requirements to an active round.

A guest reconnecting **before** recovery is a normal participant. Their authenticated join/GET refreshes presence; if unready they block both start modes until ready. If reconnect and recovery race, shared-store compare-and-swap ordering decides: a reconnect committed first must pass readiness; recovery committed first keeps that player an observer.

A guest reconnecting **after** recovery sees an observer explanation, Complete · 0/0 evidence, shared discovered findings and incident/final debriefs. They receive no assigned evidence, never enter outstanding-answer counts, and cannot submit decisions, discover evidence, spend hints or earn role-action points. These restrictions are enforced by the service, not just disabled controls. Identity and previous contributions are not reset or automatically increased.

Remaining participants receive all required evidence through the existing deterministic assignment model. An excluded guest does not consume an evidence seat even if their role/seat remains in the roster. Regular participants' existing disconnect/reconnect behavior during an already-started game remains intact, as does the host's post-start evidence timeout override.

## Regression coverage

`tests/outage-ops-lobby.test.mjs` uses an injected server clock and independent service instances sharing a compare-and-swap store. It covers the 29,999/30,000ms boundary, ready host/absent unready guest, connected unready blocker, non-host and invalid-mode rejection, pre-start reconnect, post-start observer identity/contributions, concurrent start/recovery, reconnect races, actionable remaining evidence, duplicate answers and both incidents through final debrief.

The primary `scripts/verify-outage-ops-e2e.mjs` walkthrough uses rendered UI and real application API routes/cookies. Its new lobby trace waits the actual server absence threshold, tests a connected unready blocker and a stale recovery after reconnect, excludes the named absent guest through the visible host button, restores the guest as an observer, and has the host discover evidence/submit/advance all ten rounds to both players' final debrief. Existing Guided Demo, ordinary two-player campaign, incorrect-answer recovery, evidence override and reconnect checks remain in this walkthrough.

## Validation record

Verified locally on October 11, 2026, in the managed Linux workspace with Node 24 and Chromium. The tested application source is the fix branch working tree based on `3bf1fc1`; a base-commit build label is not an exact-source attestation for uncommitted changes. No Production running commit or successful deployment is claimed.

| Evidence level/check | Result |
| --- | --- |
| Original regression | Fails with 409 on the unchanged main implementation; ready host cannot recover the absent unready guest |
| Code inspection | Server-time gate, host authorization, CAS transition, persisted observer policy and canonical evidence projection inspected |
| `npm run lint` | Pass; three pre-existing image warnings, no errors |
| `npm run typecheck` | Pass |
| `npm test` | Pass: 95 game + 16 practice + 22 subnet tests = 133; independent Python fixture oracle included |
| `npm run build` (default Turbopack) | Attempted; blocked by this environment's native worker port bind (`Operation not permitted`). An initial external dependency symlink was also rejected; replaced by a local copy of existing dependencies |
| `npm run build -- --webpack` | Pass: supported Next production build backend; no application dependency/configuration changes |
| `npm run test:e2e -- --mock-sync --browser /usr/bin/chromium` | Pass: real rendered UI, real application routes and cookies, explicitly mocked external Sync HTTP and interrupted realtime transport |
| Deployed browser / Twilio | Not performed. Managed runtime has no configured service secrets; Vercel origins are outside the enforced destination policy |
| Physical laptop and phone | Not performed; 1366×900 and 390×844 browser contexts are emulation |

The browser walkthrough demonstrated ordinary two-player discovery, incorrect-decision recovery, role actions, submission and advancement through all ten rounds; Guided Demo; invalid/undiscovered evidence timeout overrides; shared ownership and regular reconnect; and the complete recovered lobby campaign with late observer through both players' final debrief. The new lobby trace waited the actual 30-second threshold twice rather than altering server time or replacing an application route. Unit regressions used an injected deterministic clock.

Sanitized operation/status/failure-reason/request-ID evidence is written to ignored `work/e2e-summary.json` by the existing script. No credentials, tokens, cookies or request headers are recorded.

Remaining acceptance: a configured deployed test Sync service and actual laptop/phone must independently verify presence detection, subscriptions/polling, pre-recovery reconnect rejection, late observer identity, actionable evidence, submission and advancement. Verify the standard Turbopack build in CI/deployment as well. Mocked tests do not prove provider permissions or improved learning.

## Browser shutdown finding

Classification: **consistent with intentional cleanup; the exact “Browser app server websocket closed” message/endpoint is unconfirmed**. The user observed it near the end of the Codex browser run without an exact timestamp.

The original runner saved PASS before its `finally` block closed browser contexts, closed Chromium and sent SIGTERM to the local server. The log has no earlier `browser_test` failure or copy of the exact message. Subsequent process/HTTP checks found the local server stopped. No application crash or earlier interrupted assertion is established.

All six local/mock check groups completed before shutdown: Guided Demo; ordinary two-player campaign through final debrief with incorrect-answer recovery, role actions and duplicate checks; invalid-host-assignment override; undiscovered-host-card override; shared ownership/regular reconnect; absent-unready lobby recovery and late observer through final debrief. The subsequent recovery replay completed those groups again and left the local server running with `/game` HTTP 200. Old contexts were closed and rooms expired, so that was a fresh replay, not proof an interrupted checkpoint passed.

No further local reruns or code changes are warranted without new evidence. Deployed laptop-and-phone acceptance remains pending; see [the manual checklist](outage-ops-device-acceptance.md).
