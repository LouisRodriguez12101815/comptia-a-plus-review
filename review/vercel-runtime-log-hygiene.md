# Vercel runtime-log hygiene audit

Audit baseline: `main` at `52550bf` (5 November 2026). The audit reviewed 13 meaningful server/runtime logging statements. One focused reduction was made in the multiplayer request wrapper; no deployment or Vercel setting was changed.

## Current server-log inventory

| File / prefix | Path and branch | Frequency / value / risk | Classification |
| --- | --- | --- | --- |
| `lib/game/room-api.ts` — `outage_ops_room_request` | Non-GET `/api/game/**`, terminal success or failure | Potentially high during multiplayer actions; request ID, operation, and HTTP status are useful; fields contain no secrets or request body. | **KEEP / STRUCTURE** terminal record |
| `lib/game/room-api.ts` — `outage_ops_room_failure` | Provider/unexpected failures with status >= 500 | Lower frequency but high diagnostic value; sanitized reason and correlation ID; no provider text, headers, cookies, or tokens. | **KEEP / STRUCTURE** |
| `app/api/learner/telemetry/route.ts` — `study_event` | Validated, authenticated N10-009 telemetry success | Bounded by the learner rate limit and schema; useful for current study analysis; allow-listed fields only. | **KEEP** |
| `app/api/learner/telemetry/route.ts` — `learner/telemetry failed` | Telemetry provider/storage failure | Low expected frequency; route and status distinguish failures without event body. | **KEEP** |
| `app/api/learner/start/route.ts` — start messages | Allow-list no-send and successful verification creation | Low sign-in frequency; useful operational context; deliberately does not identify the submitted phone. | **KEEP** |
| `app/api/learner/start/route.ts` — `learner/start failed` | Twilio/config failure | Low frequency and useful; status only. | **KEEP** |
| `app/api/learner/verify/route.ts` — `learner/verify failed` | Twilio verification failure other than expected wrong/expired code | Low frequency and useful; status only. | **KEEP** |
| `app/api/learner/sync/route.ts` — `learner/sync failed` | Twilio Sync/progress save failure | Potentially repeated during study, but bounded by the existing save limiter; route and status are useful. | **KEEP** |
| `app/api/learner/delete/route.ts` — `learner/delete failed` | Learner data deletion failure | Rare, high diagnostic value; status only. | **KEEP** |
| `app/api/report/route.ts` — GitHub failure messages | GitHub issue create rejection or transport failure | Infrequent; status or error class distinguishes upstream failure without report content. | **KEEP** |

Client-only diagnostics (`MultiplayerRoom.tsx`, `room-client.ts`, practice/session, subnet grading, and exam copy) were separated from this inventory: they are browser console output, not Vercel Runtime Logs. Local scripts and tests were also excluded.

## Logs to keep

- Keep the authenticated, schema-validated `study_event {...}` record exactly once at the telemetry endpoint. Do not duplicate it in Web Analytics or another server logger.
- Keep learner/Twilio, sync, deletion, report, and multiplayer failure logs. They expose only a route or event prefix plus status, sanitized reason, or error class.
- Keep multiplayer request correlation (`requestId`, `operation`, and terminal HTTP status). `outage_ops_room_failure` retains the same request ID and a sanitized reason for 5xx diagnosis.

## Potential volume sources

The highest-volume source is multiplayer non-GET activity: room creation, joining, readiness, answers, evidence, hints, advances, tokens, and other actions. Before this audit, each non-GET request wrote both a `started` and terminal `succeeded`/`failed` record. A normal success therefore produced two server logs before considering provider failures.

Learner sync and telemetry can repeat during study, but they have existing authentication, payload limits, and rate limits. Twilio Verify is likely lower volume but is an external latency/cost boundary. Report submissions are intentionally rate-limited and should remain low volume.

## Changes made

`lib/game/room-api.ts` no longer emits the redundant non-GET `outage_ops_room_request` `started` record. It still emits one terminal success/failure record, and 5xx provider failures still emit `outage_ops_room_failure`. The response request ID and terminal log request ID remain correlated.

`tests/outage-ops-production.test.mjs` now verifies that a successful room write emits exactly one terminal correlated server record. Existing failure tests continue to verify sanitized provider diagnostics.

Estimated effect: **low to potentially moderate** reduction in Runtime Log volume, depending on multiplayer traffic. It removes one record from each non-GET room request. No dollar savings are claimed without measured Vercel usage.

## Privacy review

No meaningful server log inspected writes a phone number, email, session cookie, auth token, API credential, Twilio credential, learner answer text, free-form request body, or arbitrary telemetry field. The structured telemetry log is emitted only after authentication and strict parsing. Provider diagnostics remove upstream messages, headers, URLs, and stack details before logging or returning them.

## Recommendations

1. Watch `outage_ops_room_request` and `outage_ops_room_failure` volume together with function duration and timeout/error rates; retain failures even if success volume grows.
2. Periodically filter `study_event`, learner failure prefixes, report failures, and `outage_ops_*` in Runtime Logs to confirm fields remain non-sensitive.
3. If measured multiplayer log volume becomes material, consider sampling or aggregating successful terminal records only, while retaining every failure and request correlation. Make that a separate, measured change.

No Observability Plus, Analytics Plus, Log Drain, external APM, database, queue, workflow, cron, request-body logging, per-page-view logging, or duplicate quiz telemetry was added.
