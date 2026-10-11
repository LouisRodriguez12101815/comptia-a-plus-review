# Twilio Sync multiplayer deployment

The study app and Guided Demo work without Twilio. Only Create Room, Join Team, and shared-room APIs use Sync. There is no local multiplayer fallback and no SMS, voice, video, or Conversations integration.

## Vercel configuration

Use a dedicated Twilio account/subaccount for this game so the daily account cost trigger measures its usage. Create a dedicated Sync Service and enable **ACL enforcement (`aclEnabled: true`)**. The token endpoint refuses to issue tokens if ACL enforcement is disabled. Generate an API key with permission to access this account's Sync Service. Add these variables securely in Vercel project settings, for the deployment environments that will use multiplayer:

| Variable | Purpose |
| --- | --- |
| `TWILIO_ACCOUNT_SID` | Account/subaccount owning the Sync Service and usage trigger |
| `TWILIO_API_KEY_SID` | Server API authentication and access-token signing key |
| `TWILIO_API_KEY_SECRET` | Server API authentication and token signing secret |
| `TWILIO_SYNC_SERVICE_SID` | Dedicated, ACL-enabled Sync Service |
| `TWILIO_AUTH_TOKEN` | **Server only:** validates Twilio's usage-webhook signature |
| `TWILIO_USAGE_WEBHOOK_URL` | Exact public HTTPS callback URL, e.g. `https://YOUR_DEPLOYMENT/api/game/usage-trigger` |
| `TWILIO_DAILY_USAGE_TRIGGER_SID` | SID of the configured daily $5 price trigger |

The Auth Token is required in addition to the four Sync variables to authenticate the cost callback. It is never sent to the browser. Do not prefix these variables with `NEXT_PUBLIC_`, commit `.env` files, enter secrets in chat, or log values. Redeploy after adding variables. Preview deployments require their own exact callback URL/trigger configuration or a dedicated testing account; do not reuse a callback URL for a different deployment.

Configure a Twilio Usage Trigger on this account with **UsageCategory `totalprice`, TriggerBy `price`, TriggerValue `5`, Recurring `daily`, CallbackMethod `POST`**, and CallbackUrl equal to `TWILIO_USAGE_WEBHOOK_URL`. Configure Twilio retries/monitor failed callbacks. The recurring period is GMT/UTC. Confirm the trigger is active, points at the intended deployment, and is not restricted by Vercel deployment protection. Monitor callback failures and costs in Twilio. No outbound communications products are needed.

The server uses `sync.twilio.com`; browsers need Twilio Sync's HTTPS/WebSocket endpoints. The normal app uses no restrictive custom CSP. If adding a CSP/network filter, allow the endpoints required by the installed Twilio Sync SDK. The production build also needs Google font HTTPS access as documented in README.

## Local provisioning script

After dependencies are installed, use `scripts/setup-twilio-sync.mjs`. It reads `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` from the local process environment for provisioning only. Enter those securely using your local environment/secret manager; the deployed application still keeps credentials in Vercel settings. The script does not load or create environment files, print credentials, or create API keys.

Preview without any network calls or credentials:

```bash
node scripts/setup-twilio-sync.mjs --dry-run --webhook-url https://YOUR_DEPLOYMENT/api/game/usage-trigger
```

With the two credentials already present in your local environment, create the resources:

```bash
node scripts/setup-twilio-sync.mjs --apply --webhook-url https://YOUR_DEPLOYMENT/api/game/usage-trigger
```

You can supply `TWILIO_USAGE_WEBHOOK_URL` through the environment instead of the flag. The default mode, when neither mode flag is supplied, is dry-run.

An initial apply creates exactly **one Sync Service** named Outage Ops with ACL enforcement enabled and **one daily account-wide price Usage Trigger** with the settings above. It does not create an account, API key, room, test player, phone number, or messaging resource. Runtime room Documents, member permissions, and daily pause Documents are created by the app.

The script prints only the two resulting non-secret resource SIDs and status messages. Save those SIDs in Vercel. On subsequent runs, set `TWILIO_SYNC_SERVICE_SID` and `TWILIO_DAILY_USAGE_TRIGGER_SID` in your local environment to reuse and validate those resources; reused resources are never modified. Without reuse SIDs, another apply creates another pair. Creation is not transactional: if a request fails, inspect Console and reuse any resource that was already created before retrying. Provider errors are redacted, and creates are not automatically retried.

Create the application API key separately in Twilio Console and save its one-time secret directly to Vercel. Add the remaining required variables and redeploy. Provisioning success does not certify webhook delivery or laptop/phone multiplayer; run the acceptance checklist below.

## Daily cost guard

`POST /api/game/usage-trigger` accepts Twilio's form-encoded usage callback. It checks `X-Twilio-Signature` against the configured exact public URL and Auth Token, plus the configured account and trigger SID. It validates `CurrentValue`, `DateFired`, `TriggerBy`, and `UsageCategory`.

At a daily price of $5 or above, it creates an idempotent, server-only Sync Document named `outage-ops-usage-YYYY-MM-DD`, with **`MULTIPLAYER_PAUSED: true`**. All Vercel instances consult that daily document. A repeated webhook cannot undo the pause; a delayed prior-day callback cannot pause the new day. At the next UTC day, a new daily key is used automatically. Guard records expire after the retention window.

Room creation, joins (including reconnect joins), state reads, token issuance, and all room/permission writes check the guard. Mutations check again immediately before their Sync write. HTTP **423** returns **“Multiplayer paused for today. Guided Demo is still available.”** The browser closes its Sync client and offers mission selection after seeing this response. The pause document itself is the only intentional write that bypasses the guard. An unavailable guard fails closed with HTTP 503; missing variables report “Multiplayer service not configured.” Browser tokens cannot write room documents or the guard document.

**This is a callback-driven pause, not a guaranteed $5 billing cap.** Twilio accounting, callback delivery/retries, already-running requests, and existing subscriptions can create charges after the threshold. Reads, webhook processing, and token/presence traffic also consume resources. Use Twilio billing alerts and monitor usage; don't rely on this mechanism to guarantee a maximum invoice. In-flight checks cannot atomically transact across the guard and room documents.

## Room and API behavior

Each room is a Sync Document named `outage-ops-room-CODE`. A randomly generated six-character code excludes ambiguous characters. Room creation handles code collisions. Each room has an absolute 30-minute expiration, enforced by both the server and Twilio TTL; updates reduce remaining TTL instead of extending it.

The server stores host, players, ready state, phase, incident/step index, shared start/end timestamps, scores, uptime, selected answer IDs, last-seen times, last activity, revision/version, and expiry. Conditional `If-Match` updates retry conflicts, preventing lost concurrent joins, readiness changes, and answers. The document stays below Sync's 16 KiB limit by deriving feedback from incident definitions instead of storing repeated explanations.

| Endpoint | Operation |
| --- | --- |
| `POST /api/game/rooms` | Create with `{ "nickname": "Laptop" }` |
| `POST /api/game/rooms/CODE/join` | Join with `{ "nickname": "Phone" }` |
| `GET /api/game/rooms/CODE` | Authorized snapshot, heartbeat, timer reconciliation |
| `POST /api/game/rooms/CODE/ready` | `{ "ready": true }` or `false` |
| `POST /api/game/rooms/CODE/start` | Host starts when every player is ready |
| `POST /api/game/rooms/CODE/actions` | `{ "incidentIndex": 0, "stepIndex": 0, "answerId": "stable-id" }` |
| `POST /api/game/rooms/CODE/advance` | Host continues with current `incidentIndex` and `stepIndex` after the host and connected players answer, or after the host explicitly overrides missing responders |
| `POST /api/game/rooms/CODE/evidence` | Current `incidentIndex` and `stepIndex`; optional `itemId` must belong to the authenticated player; without it, discover only their assigned items for old-client compatibility; credit discovery once per player/question |
| `POST /api/game/rooms/CODE/continue-evidence` | Current indices; host-only after 15 seconds; own discovery is not required, opens current-question evidence/answer gates without awarding points; retries are idempotent |
| `POST /api/game/rooms/CODE/hint` | Current `incidentIndex` and `stepIndex`; shared hint costs 25 team points once |
| `POST /api/game/rooms/CODE/role-action` | Current indices and `actionId`; role-checked contribution or a penalty for unsupported shared-equipment restart |
| `POST /api/game/rooms/CODE/next` | Host starts the next incident with current `incidentIndex`; roles rotate |
| `POST /api/game/rooms/CODE/leave` | Leave, revoke membership/read permission, transfer hosting if needed |
| `GET` or `POST /api/game/rooms/CODE/token` | Short-lived access token with Sync grant for an authenticated member |

Member authentication uses a random token in an HttpOnly, same-site, room-scoped cookie. Its hash is stored server-side. Browser Sync tokens expire within five minutes or the remaining room lifetime, whichever is shorter. Only that member's room gets read permission, with write/manage permission disabled. Token refresh rechecks membership, expiration, and the daily guard. Browser tokens are transient and are not persisted in localStorage.

Sync notifications cause an authorized snapshot refresh. A 10-second heartbeat/reconciliation loop supplements notifications; when Sync is unavailable, authorized room snapshots are polled every two seconds and API-backed evidence/answer controls remain available. A Sync-only error displays a warning instead of disabling those controls. Deadline requests reconcile briefing/timer transitions. Visible timers use shared server timestamps and a monotonic local clock. Presence becomes disconnected after 30 seconds without a heartbeat. Browser sessionStorage retains only the last room code; **Resume previous room** uses the existing cookie to restore the same player, readiness, score, role, evidence discovery, hint state, and submission. Closing a tab does not leave immediately. Explicit Leave room transfers host to the next player; disconnected hosts retain ownership and may reconnect. Contributions from members who explicitly leave remain in the debrief. Automatic host failover and choosing arbitrary incidents remain deferred; the host advances through the fixed two-incident sequence.

The shared session contains two five-question incidents: Lab 03 DNS, then Lab 02 DHCP relay routing troubleshooting. Answers are shuffled once per question on the server; correctness uses `correctAnswerId`, never an array index. No answer is selected automatically. Evidence discovery awards 10 contribution points, a useful assigned role action awards 20, a correct answer awards 100, and helping resolve an incident awards 25. The team score is separate: each clean decision awards 100 × the new streak (maximum ×3) once when the host advances; mixed answers or a risky role action award 50 if somebody answered correctly, otherwise 0. Incorrect answers and unsupported actions each cost 5% shared uptime and five seconds, and reset the streak. A shared hint costs 25 team points once per question; scores may be negative. Uptime score is uptime ×10. All scoring, deadlines, roles, and duplicate protection are server-authoritative.

Players have distinct responsibilities and complementary evidence. Discovery is required before answering: all valid evidence items assigned to connected responders must be discovered, not every owner of a duplicate item. Each submitter must have their valid assigned items complete; a shared item discovered by one owner completes that item for every owner, without automatically awarding discovery points to other players. Empty/missing assignments are marked complete without points. New assignments distribute valid items deterministically by sorted player seat (including seat gaps), and are stored in the Sync Document. Invalid IDs from older state are removed without assigning a replacement clue mid-question; a player with no remaining valid items becomes complete with 0/0. Legacy receipts cannot grant discovery points for a missing item. The server freezes item assignments when a question opens and the snapshot reports discovered/outstanding items and their owners without exposing private evidence text. Solo players receive all items and can answer immediately after discovery. Every question has a visible 15-second timeout from its server opening timestamp; thereafter the host may select the prominent **Continue with current evidence** control even if their own card is missing or their own evidence is undiscovered. The host still must submit an answer before advancing. Disconnected owners' missing evidence stops blocking when the 30-second presence window expires; the 15-second host override also covers idle browsers still sending heartbeats. Reconnecting restores the saved assignment and item receipts; an undiscovered item becomes required again when its owner reconnects unless the host already continued. The override waives all evidence prerequisites, including the submitting player’s own items, and teammate answers only for the current question, persists across reconnects, and never grants absent players points. Repeated override/discovery requests are idempotent; repeated answers and advances cannot score twice. Explicit leave to a one-player room gives the remaining responder all current evidence. Each private snapshot includes every valid assigned item ID, label, discovery status, and text after discovery. The UI always renders an actionable discover/review control for each assigned item, regardless of old player-level receipts. The shared scoreboard shows complete, pending, no-assignment, waived, or disconnected evidence status and item counts. No automatic answer is selected. Communicate findings using your own voice/chat channel. Evidence text is derived server-side only for the authenticated viewer, not stored in the Sync Document or shown to teammates. Solo play covers all clues. Roles rotate for the second incident, preserving accumulated score, uptime, and contributions. Current-question discovery and action receipts reset on advance; completed-incident answer logs compact into outcome summaries, keeping even eight-player sessions below Sync's 16 KiB limit. Failed questions, hints, and outcomes feed the final review recommendations. Guided Demo retains its local mentor, hint, Try again, and scoring behavior.

## Required laptop/phone acceptance test

Do this on a configured Vercel deployment, using an actual laptop and phone. Automated tests or two browser contexts cannot certify this acceptance requirement.

1. On the laptop, open `/game`, choose Create Room, enter a call sign, and copy the six-character code.
2. On the phone, open the **same deployment URL**, choose Join Team, enter that code and a different name. Without refreshing, both screens must show both players, their host designation, and readiness.
3. Mark each ready and unready in turn. The other device must update. Start must stay disabled until all players are ready; the phone must not have the host start control.
4. Mark both ready and start on the laptop. Without refreshing, both screens must display the same briefing countdown and DNS question. Compare timer, phase, answer order, uptime, and team/player scores.
   Discover evidence on both devices and confirm the fragments differ. In a two-player room with complementary items, answering must stay disabled until both items are discovered, unless the host explicitly continues after the timeout. Discuss the clues, submit each assigned role action, and compare individual contribution breakdowns. Request the shared hint concurrently: both should see it, with exactly one 25-point team penalty. Incorrect answers must subtract five seconds and 5% uptime without advancing. Complete questions together to see the streak and team score update once per decision. After the first debrief, start the DHCP relay incident and confirm roles rotate on both screens. Finish both incidents and compare final outcomes, objectives, review topics, source notes/labs, and contribution totals.
5. Answer correctly on one device and incorrectly on the other. Both screens must update scores/uptime. Each shows feedback, and the question waits for the host's Continue. Finish all questions and compare results.
6. In a fresh question, discover only on the laptop. Keep the phone open without clicking to simulate an idle connected teammate. Verify the outstanding evidence item and player name, the 15-second countdown, and the disabled host override before expiry. Select **Continue with current evidence** after expiry, submit on the laptop, and advance despite the missing phone answer; verify no automatic points on the phone and a fresh timeout on the next question. Repeat with the phone disconnected; verify presence eventually shows disconnected, the item no longer appears among outstanding requirements, and answers unlock without a host override. Confirm that a player with an empty assignment sees an explicit completed requirement and no unusable discovery button. In a one-item test scenario, one owner discovery must unlock the shared item for both players. In an older room with a stale assignment/receipt, verify invalid IDs disappear, valid items remain rendered and discoverable, and an empty result reports Complete (no assigned items) with 0/0 and no repeated discovery points. After the timeout, continue without discovering the host’s own card and confirm answers immediately unlock. Test a one-player room: discovery immediately unlocks all answers without waiting. Disconnect/reconnect the phone. Resume the previous room with the same browser; verify no duplicate player and preserved score/submission. Verify explicit leave and host transfer.
7. Test invalid codes and duplicate names. After 30 minutes, verify the old code expires and cannot be joined or renewed.
8. On a dedicated test deployment/account, deliver a genuinely signed Twilio daily price callback with `CurrentValue >= 5` (keep credentials in secure configuration). Verify the shared daily document is paused, both clients show the pause response, and create/join/ready/start/actions/advance/leave/token operations perform no room or permission writes. Verify an unsigned or altered callback is rejected and Guided Demo still works. Don't spend $5 solely to exercise this check.

Record deployment URL, date, devices/browser versions, and results. Cross-device multiplayer acceptance is **pending** until this checklist succeeds.

## Local validation

Use Node.js 22.18+ (24 recommended): `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Automated tests inject a revision-aware document store and synthetic signature fixtures; they do not emulate a live Twilio connection or claim physical-device validation. No test-mode memory store is exposed in the application. Without Vercel credentials, local room APIs must return the explicit unconfigured response, while Guided Demo remains usable.

## Scenario provenance

Both debriefs link directly to their practiced content: DNS to `/labs/cant-reach-website` (method and steps 1–6), DHCP relay to `/labs/dhcp-relay-three-site` (addressing, how-it-works, troubleshooting), and both to `/notes/networking-dns-dhcp` (DNS or DHCP). Source paths and section IDs are returned in authenticated snapshots. The relay scenario uses the exact Miami static-route typo and correction in `content/labs.json`; the lab still marks its Miami lease test in progress, and the verification question preserves that limitation. Previously running DHCP/VLAN rooms retain their scenario and IDs through their 30-minute lifetime, with DHCP and Chapter 11 VLAN review links. Guided Demo is unchanged.


## Sanitized production diagnosis

Do not paste environment values, access tokens, cookies, provider response bodies, or raw SDK errors into reports. In Vercel, confirm that all seven required variables listed above exist in **Production**, then redeploy if configuration changed. Missing configuration returns HTTP 503 with `configuration_missing` and variable **names only**; malformed resource IDs return `configuration_invalid` without values.

The server fetches the configured Sync Service using the configured API key before reading any documents. It compares the returned account to the configured account internally. A missing or inaccessible Service is no longer mistaken for an absent daily-pause document. A normal missing daily document still means the day has not been paused. Failure responses and runtime logs report only an operation stage, sanitized reason, numeric upstream status/code, and a random request ID:

| Upstream result | Application response | Diagnostic reason |
| --- | --- | --- |
| 401 / Twilio 20003 | 503 | `authentication_rejected` |
| 403 | 503 | `permission_denied` |
| 404 while fetching Service | 503 | `service_not_found` |
| Service account differs | 503 | `account_mismatch` |
| Service ACL disabled | 503 | `configuration_invalid` |
| 429 | 503 | `rate_limited` |
| 5xx | 503 | `provider_unavailable` |
| Recognized connection failure | 503 | `network_failure` |
| Other unexpected failure | 503 | `unexpected_failure` |

Use the `X-Outage-Ops-Request-Id` response header to locate `outage_ops_room_failure` in Vercel runtime logs. A successful creation emits `outage_ops_room_storage_verified`: seven variables present, account comparison passed, API-key Service read and room document create succeeded. A successful member token request emits `outage_ops_room_token_permissions_verified`: ACL enabled and API-key read-only member permission write succeeded. These entries contain no identifier values or credentials. They verify the permissions exercised by those requests; inspect any subsequent document-update failure separately. Cross-site GET token requests are rejected; authenticated same-site GET and POST token requests both work.

From a machine that can reach the deployment, run:

```sh
node scripts/probe-outage-ops.mjs --url https://comptia-a-plus-review.vercel.app
```

This script creates a temporary two-player lobby when possible and probes create, join, state, GET/POST token, and evidence endpoints. It retains membership cookies only in memory and prints only sanitized statuses/diagnostics. In a lobby, evidence discovery correctly returns 409 because no question is active. If creation fails, it probes an intentionally invalid code and never joins another person's room. The temporary lobby expires after 30 minutes. Use the laptop/phone checklist above to exercise discovery in an active incident, including the visible host timeout fallback.

During cloud diagnosis, both the public and immutable deployment hosts were blocked by the cloud outbound proxy with HTTP 403 (CONNECT tunnel failed). This is **not** an application or Twilio response. Production runtime logs, variable presence, account ownership, API-key permissions, and physical-device acceptance remain unverified until checked on an accessible deployment. Tests use injected provider failures and shared-document fixtures; they cannot establish the live production cause.


## Client flow and GET-only production logs

A successful authorized `GET /api/game/rooms/CODE` proves that the room API read shared state for that cookie-authenticated player. It does not prove that a Sync token was issued or a subscription opened. Snapshots now carry `storageAvailable: true` only after a successful store operation; this is transport metadata, not a field persisted in the room document. The browser displays storage response status separately from `connecting`, `retrying`, `connected`, or `subscribed` live-update status. Missing legacy transport metadata is not treated as storage failure.

Creating calls POST rooms; joining calls POST join. **Resume previous room** uses the room GET and existing HttpOnly cookie, without creating or joining again. After a valid snapshot is accepted, the subscription effect calls **POST token** for that room and authenticated `viewerId`. It runs again if room or viewer identity changes. Token responses identify their authenticated member; mismatches stop subscription setup while authorized polling continues. The browser never supplies or guesses a player ID for scoring or evidence actions: the server derives it from the membership cookie. Client sessionStorage holds only a room code.

A token HTTP/network failure is shown explicitly as a live-update warning and logged with operation/status/reason; it cannot disable reachable room actions or silently become a subscription success. An evidence click sends POST evidence with incident/step indices and the rendered assigned `itemId`. Its failure is labeled as an evidence action failure, not a global storage failure. A subsequent valid snapshot clears a transient action/storage message; discovery must still be retried, and the server retains duplicate protection. Missing or inconsistent assigned items fail snapshot validation with an evidence-unavailable message and a retry control, rather than displaying an empty completed requirement. Legitimate zero-item assignments remain complete without points. Existing assignment repair, disconnected-player exemptions and the visible host timeout are unchanged.

Create/join/token/actions have browser `outage_ops_client_request` and server `outage_ops_room_request` lifecycle events (`started`, `succeeded`, `failed`). These include fixed operation names, numeric HTTP status, a validated request ID when available, and allowlisted failure reasons. Sync setup failures emit `outage_ops_sync_status`. They do not contain room codes, player names/IDs, request bodies/headers, cookies, credentials or tokens. Successful recurring state reads are not logged again by the application.

When investigating a GET-only log window, include all HTTP methods and verify the deployed commit first. Creation/join may precede that window, and Resume intentionally uses GET. If no POST token appears after a valid snapshot, inspect the browser's sanitized lifecycle events and JavaScript errors: the subscription effect is not completing on that client/build. If evidence has no `started` event, confirm its assigned item is rendered and enabled; a failed token alone must not disable it. If `started` exists without a server event, inspect the browser's reported network/HTTP status. A server `failed` event can be correlated with the sanitized provider diagnostics using its request ID. Repeated GET 200 by itself cannot identify the absent request's cause.

All state reads triggered by Sync, retries, countdown deadlines and polling share one reconciler: at most one in flight, with at least two seconds between starts. Initial create/join/resume already provides a snapshot, so the reconciler waits before its first GET. Sync-connected reconciliation normally runs every ten seconds; degraded transport uses two seconds. This is real shared-room polling, never a local multiplayer fallback.

For the optional two-browser regression, install Playwright outside the repository, run `npm run build` and `npm run start -- --port 3023`, then in another shell:

```sh
npm install --prefix /tmp/outage-ops-browser --no-save playwright
node --import ./tests/register.mjs scripts/verify-outage-ops-client.mjs --url http://127.0.0.1:3023 --playwright /tmp/outage-ops-browser/node_modules/playwright/index.mjs --browser /usr/bin/chromium
```

Use an installed Chromium executable for `--browser`, or omit it to use Playwright's installed browser. This test exercises real rendered controls in two isolated contexts against a local production build, with a shared API fixture and intentionally failed token transport. It verifies create/join call token, visible token failure, unavailable assignment recovery, Player B stale-assignment repair, evidence POST failure/retry, both answers and host advancement without duplicate credit, reconnect identity, and disconnected-owner completion. It is separate from `npm test` and does not certify live Twilio or laptop/phone acceptance.


## Missing host evidence regression

The server derives assignment counts, discoverable cards, and answer gates from the same valid current-question evidence catalog. Invalid saved IDs are dropped and persisted through the existing revision-checked room store; they never become replacement requirements during an active question. Empty assignments are complete with 0/0. Shared discoveries satisfy every owner of that item without awarding other players discovery points. Missing owners are pruned, and disconnected owners do not make a clue required.

After the visible 15-second timeout, the host fallback is displayed prominently above the evidence section. It does not require the host's own discovery. The authoritative `continue-evidence` response immediately sets `canAnswer: true` for the active question, including players whose own evidence is missing or undiscovered. Undiscovered valid items display **Waived by host (no discovery points)**; actual discovery counts and contribution points are unchanged. The progress panel lists only outstanding required clues and connected owners, or **No outstanding evidence requirements**. Normal questions still require valid evidence, and the override resets on advance. Membership, host ownership, question indices, room expiry, phase and timeout remain validated server-side. Answers and team progression retain duplicate protection.

The optional host-specific browser regression covers the reported two-player case (`sl` complete 1/1, `Idj` with no valid card), a pending teammate with no host card, and a valid undiscovered host card. Start a local production build on port 3025 and run:

```sh
node --import ./tests/register.mjs scripts/verify-outage-ops-host-evidence.mjs --url http://127.0.0.1:3025 --playwright /tmp/outage-ops-browser/node_modules/playwright/index.mjs --browser /usr/bin/chromium
```

Use the optional Playwright installation described above. Two isolated Chromium contexts exercise the real UI with a shared authoritative room-service fixture and controlled server clock; Sync token transport is intentionally unavailable. The test checks 0/0 and no card, the exact outstanding item/owner or no requirement, the enabled host control after timeout, POST continue/answer, immediate submission and advancement, and zero fabricated discovery credit. It does not inspect or modify a Production room, or certify live Twilio/device acceptance.
