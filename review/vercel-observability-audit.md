# Vercel observability audit

Audit baseline: `main` at `52550bf` (5 November 2026). This is a documentation-only audit. No Vercel deployment, dashboard setting, or application code was changed.

## Already useful with the current Pro plan

The existing Next.js/Vercel runtime already provides useful base signals without an add-on:

- request volume, status codes, function invocations, duration, and runtime failures for API routes and dynamic requests;
- Runtime Logs, including the existing structured `study_event` and `outage_ops_*` records;
- build logs and build duration for `next build`;
- deployment/build outcome history if deployments are enabled later;
- platform request and cache information where Vercel can observe it. The application itself currently opts out of caching for APIs and has no explicit `revalidate` or `unstable_cache` policy, so cache metrics should not be interpreted as evidence of application-level caching.

There is no `instrumentation.*` file and no third-party APM integration. The localized site has one shared `app/[locale]/layout.tsx`; pages use local content and `setRequestLocale`, so ordinary page navigation is the main request signal. `proxy.ts` excludes `/api`, `/_next`, `/_vercel`, and files with extensions from the next-intl middleware.

## Current useful signals

| Area | Expected activity and cost | Current signal quality | Review conclusion |
| --- | --- | --- | --- |
| Localized pages | Normal learner navigation; mostly static/local-content rendering | Next request/status/duration/build signals | KEEP as-is |
| `/api/learner/session` | Occasional page-load/session checks | Dynamic, no-store response; failures are status-only | KEEP; low expected volume |
| `/api/learner/start`, `/verify`, `/signout` | A few calls per sign-in attempt | Rate limits and status-only errors; Twilio Verify is the external latency/cost boundary | KEEP; monitor error rate and duration |
| `/api/learner/sync` | Save/sync after learner activity, bounded by 30 saves/minute/learner | Body-size and rate limits; provider failures log route plus status | KEEP; monitor duration and 4xx/5xx |
| `/api/learner/telemetry` | At most study-event activity from signed-in N10-009 sessions, bounded to 300/hour/learner | Validated `study_event` only; bounded to 200 stored events; serial client submission; failure is best-effort | KEEP; do not duplicate in Web Analytics |
| `/api/learner/delete` | Rare account/data deletion | Provider failure status is logged; removes progress and telemetry through the existing map | KEEP; monitor failures |
| `/api/report` | Infrequent problem reports; 5/IP/10 minutes | Error logs contain status/name, not body; GitHub API is the latency boundary and has an 8-second timeout | KEEP; low expected volume |
| `/api/game/**` | Potentially high during multiplayer rooms: room creation, polling/actions, token and Sync operations | Non-GET operations emit one terminal structured success/failure log with request ID and HTTP status; 5xx provider failures emit a separate sanitized reason | KEEP; this is the main request/log-volume watch item |
| `/api/game/usage-trigger` | External webhook-driven and expected to be low volume | Response is no-store; route has no verbose application logging | KEEP; use status/duration and webhook failures |

The learner routes require the existing authenticated learner session before sync, deletion, or telemetry is accepted. Telemetry remains in the separate Twilio learner map and does not alter progress storage. The validated `study_event` log contains only allow-listed telemetry fields, which may include `sessionId` and `questionId` where the event provides them; it does not include a phone number, token, cookie, answer text, or arbitrary request body.

## Cost/watch items

- Multiplayer room traffic is the most likely source of repeated function invocations and logs. `room-api.ts` emits one terminal request record for each non-GET operation when execution reaches `respond()`, and provider failures can add a separate record. A request that fails before `respond()` is reached may have no terminal request record, so function failures and the separate 5xx failure signal remain important. Room polling/actions should be watched for volume before adding more logging.
- Twilio Sync and Verify calls are external latency and quota boundaries. A slow provider call extends function duration; a high sign-in or multiplayer rate can increase both invocations and provider usage. Existing rate limits, timeouts, daily game usage guard, and sanitized provider errors are important controls.
- Learner sync accepts up to 400 KB and report requests up to 12 KB. These limits prevent unbounded request work, but sync payload size and duration should be checked if usage grows.
- The telemetry endpoint is intentionally bounded, authenticated, validated, and best-effort. Its 200-event retention cap and 300-events/hour/learner limit should remain in place. Do not route these events into a second analytics product.
- `vercel.json` has `git.deploymentEnabled: false`, so ordinary Git pushes do not create automatic Vercel deployments/previews. This is a strong build-cost control and should not be changed casually.
- `npm run build` runs `next build`; the localized route tree and local JSON/content imports create normal build work. The repository has a 3 MB `content` tree and an 86 MB `public` tree, so build output and build duration are worth checking, but no repeated generated-artifact step or custom build service was found. Build scripts do not run audits/tests automatically.
- `next/font/google` is used by the app and can make builds dependent on font retrieval in the build environment. Treat build failures or duration changes here as a build-health item, not a reason to add runtime instrumentation.

## Logging audit

- **KEEP:** `study_event` in `/api/learner/telemetry`; it is emitted only after schema validation and contains only the allow-listed event fields.
- **KEEP / monitor:** terminal `outage_ops_room_request` success/failure logs; request IDs and sanitized status fields make completed multiplayer requests traceable. A separate `outage_ops_room_failure` record preserves 5xx provider diagnostics; a request that never reaches `respond()` may have no terminal request record. Watch volume rather than removing the correlation fields.
- **KEEP:** learner/report errors that record route and status (and report error name) without request bodies or secrets.
- **REDUCE only if measured:** client-side multiplayer sync-status logs and other browser `console.error` diagnostics are not Vercel Runtime Logs. They should not be promoted to server logging without a demonstrated debugging need.
- **No REMOVE finding:** no server log inspected here records phone numbers, cookies, tokens, credentials, free-form answers, or arbitrary request bodies. The learner allow-list message intentionally does not reveal the submitted number.
- **No STRUCTURE change needed:** the two existing structured server signals already provide the useful correlation fields. Adding per-answer or per-remediation logs would increase volume without improving the current cost objective.

## Low-cost improvements

1. Create a small recurring dashboard/checklist review for the game route group and learner route group: invocations, p50/p95 duration, 4xx/5xx rate, and Runtime Log volume. Use existing logs and filters; add no code.
2. Compare Twilio-related route duration and failures after meaningful learner or multiplayer traffic changes. This distinguishes provider latency from application work without adding an APM vendor.
3. If measured log volume becomes material, aggregate or sample high-frequency successful multiplayer terminal records while retaining all failures and request correlation. Do this only with a measured threshold and regression tests; do not remove diagnostics preemptively.

## Do not add yet

At current scope, do not enable Observability Plus or Analytics Plus, add Log Drains, install an external APM/monitoring vendor, add a database/queue/workflow/cron, or add custom high-volume Web Analytics/performance events. Do not duplicate the authenticated `study_event` stream in general analytics. Do not enable automatic preview deployments or change build-machine settings solely for observability.

## Recommended Vercel dashboard checks

Periodically inspect:

1. Functions: invocation count, p50/p95 duration, error rate, and cold/timeout patterns for `/api/game/*`, `/api/learner/*`, and `/api/report`.
2. Runtime Logs: filter `outage_ops_room_*`, `study_event`, `learner/* failed`, and report failures; confirm no sensitive fields appear.
3. Deployments/builds: build duration, failed builds, output size, and whether deployment automation remains disabled as intended.
4. Traffic and cache: confirm page traffic versus API traffic and review cache behavior only as platform evidence, since APIs explicitly use `no-store`.
5. Usage/billing: watch function execution, log volume, and any included Pro-plan observability quota before enabling any paid add-on.
