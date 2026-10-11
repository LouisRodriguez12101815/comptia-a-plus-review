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
| `POST /api/game/rooms/CODE/actions` | `{ "stepIndex": 0, "answerId": "stable-id" }` |
| `POST /api/game/rooms/CODE/advance` | Host continues with current `stepIndex` after connected players answer |
| `POST /api/game/rooms/CODE/leave` | Leave, revoke membership/read permission, transfer hosting if needed |
| `POST /api/game/rooms/CODE/token` | Short-lived access token with Sync grant for an authenticated member |

Member authentication uses a random token in an HttpOnly, same-site, room-scoped cookie. Its hash is stored server-side. Browser Sync tokens expire within five minutes or the remaining room lifetime, whichever is shorter. Only that member's room gets read permission, with write/manage permission disabled. Token refresh rechecks membership, expiration, and the daily guard. Browser tokens are transient and are not persisted in localStorage.

Sync notifications cause an authorized snapshot refresh. A 10-second heartbeat/reconciliation loop supplements notifications, with deadline requests for briefing/timer transitions. Visible timers use shared server timestamps and a monotonic local clock. Presence becomes disconnected after 30 seconds without a heartbeat. Browser sessionStorage retains only the last room code; **Resume previous room** uses the existing cookie to restore the same player, readiness, score, and submission. Closing a tab does not leave immediately. Explicit Leave room transfers host to the next player; disconnected hosts retain ownership and may reconnect. Automatic host failover and new-incident selection are outside this first implementation.

The first shared mission is the five-question DNS incident. Answers are shuffled once per question on the server; correctness uses `correctAnswerId`, never an array index. No answer is selected automatically. Correct submissions award 100 points once; incorrect submissions reduce shared uptime by 5 and show immediate feedback. The host explicitly continues after all connected players answer. Guided Demo retains its local mentor, hint, Try again, and scoring behavior.

## Required laptop/phone acceptance test

Do this on a configured Vercel deployment, using an actual laptop and phone. Automated tests or two browser contexts cannot certify this acceptance requirement.

1. On the laptop, open `/game`, choose Create Room, enter a call sign, and copy the six-character code.
2. On the phone, open the **same deployment URL**, choose Join Team, enter that code and a different name. Without refreshing, both screens must show both players, their host designation, and readiness.
3. Mark each ready and unready in turn. The other device must update. Start must stay disabled until all players are ready; the phone must not have the host start control.
4. Mark both ready and start on the laptop. Without refreshing, both screens must display the same briefing countdown and DNS question. Compare timer, phase, answer order, uptime, and team/player scores.
5. Answer correctly on one device and incorrectly on the other. Both screens must update scores/uptime. Each shows feedback, and the question waits for the host's Continue. Finish all questions and compare results.
6. Disconnect/reconnect the phone. Resume the previous room with the same browser; verify no duplicate player and preserved score/submission. Verify explicit leave and host transfer.
7. Test invalid codes and duplicate names. After 30 minutes, verify the old code expires and cannot be joined or renewed.
8. On a dedicated test deployment/account, deliver a genuinely signed Twilio daily price callback with `CurrentValue >= 5` (keep credentials in secure configuration). Verify the shared daily document is paused, both clients show the pause response, and create/join/ready/start/actions/advance/leave/token operations perform no room or permission writes. Verify an unsigned or altered callback is rejected and Guided Demo still works. Don't spend $5 solely to exercise this check.

Record deployment URL, date, devices/browser versions, and results. Cross-device multiplayer acceptance is **pending** until this checklist succeeds.

## Local validation

Use Node.js 22.18+ (24 recommended): `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Automated tests inject a revision-aware document store and synthetic signature fixtures; they do not emulate a live Twilio connection or claim physical-device validation. No test-mode memory store is exposed in the application. Without Vercel credentials, local room APIs must return the explicit unconfigured response, while Guided Demo remains usable.
