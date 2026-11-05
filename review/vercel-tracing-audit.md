# Vercel tracing audit

Audit baseline: latest `main` at `52550bf` (5 November 2026). This is a documentation-only audit. No tracing package, instrumentation file, Vercel setting, deployment, or preview was added.

## What tracing already provides

The application runs Next.js `16.3.5` with Node.js route handlers for the learner, game, and report APIs. Vercel can already provide the useful outer boundary for these requests through its normal function/request observability: route-level request volume, status, duration, timeouts, and failures. Build and deployment history also provides build timing and outcome signals when a deployment is run.

The localized pages share `app/[locale]/layout.tsx`; there is no nested tracing wrapper, `instrumentation.*` file, `@vercel/otel` package, or direct OpenTelemetry dependency. `vercel.json` keeps automatic Git deployments disabled. This means there is no application-created trace stream or custom span volume to manage today.

The report route uses a normal `fetch` to GitHub, while Twilio access is through the Twilio SDK. Vercel/Next.js may show framework or outbound-fetch detail in a trace view where supported, but the application does not currently provide a stable provider-operation span name. Treat the outer function duration as reliable; verify any outbound-child-span detail in the Vercel UI rather than assuming it exists.

## Important blind spots

- A slow `/api/learner/telemetry` or `/api/learner/sync` function can be identified, but the current trace/log combination does not consistently separate Twilio Sync time from parsing, merge, serialization, and response work.
- `/api/learner/start` and `/api/learner/verify` identify the route and failure status, but do not expose a distinct Twilio Verify child span or provider-operation duration.
- `/api/game/**` has coarse request and sanitized failure logs, but one function can perform several Twilio Sync operations through the room service. A route trace alone may not identify which operation was slow.
- `/api/report` has an 8-second GitHub timeout and sanitized failure logs, but no durable provider-specific timing signal distinguishes GitHub latency from local validation and issue-body construction.
- `syncCall()` normalizes provider failures but does not create spans. Adding instrumentation inside it would risk broad, repeated spans for low-level document operations and could create more volume than the owner needs.

These are diagnostic gaps, not evidence that the application is currently malfunctioning. The existing status-only failure logs intentionally avoid provider response bodies, headers, URLs, and credentials.

## Candidate manual spans

| Candidate location | Purpose | Diagnostic value | Expected span volume | Privacy considerations | Recommendation |
| --- | --- | --- | --- | --- | --- |
| `app/api/learner/telemetry/route.ts` around `appendTelemetry` | Separate bounded telemetry persistence from route work | Low to moderate; the endpoint is already rate-limited and best-effort, and a route duration is usually sufficient | Low, but one per accepted study event | Use only a fixed operation name and success/status class; never event fields, question IDs, learner IDs, or session IDs | **OPTIONAL LATER** |
| `lib/learner/twilio.ts` around Verify `sendCode`/`checkCode` | Distinguish Twilio Verify latency | Moderate for sign-in troubleshooting | Low; sign-in is infrequent | Fixed provider `twilio`, operation category, and status class only; no phone, code, SID, or token | **OPTIONAL LATER** |
| `lib/learner/twilio.ts` around Sync map/document operations | Distinguish Twilio Sync latency for learner sync and deletion | Moderate, but the helper is shared and operations can multiply per request | Potentially moderate during study sync/telemetry traffic | Fixed operation categories only; no map names, learner IDs, keys, or payloads | **DO NOT ADD** at current scale |
| `lib/game/room-store.ts` around coarse room-service calls | Identify multiplayer provider latency | Moderate to high when multiplayer is actively used | Potentially high because actions and retries are frequent | Fixed route/operation category and status class only; never room codes, tokens, player IDs, or document names | **OPTIONAL LATER** |
| `app/api/report/route.ts` around the GitHub `fetch` | Separate GitHub latency from local report validation | Moderate for the rare report path | Low; route is IP-rate-limited to 5 per 10 minutes | Fixed provider and outcome class only; never report body, repo token, user text, or issue URL attributes | **OPTIONAL LATER** |
| Every quiz/remediation action, page view, or content fetch | Usage and learner behavior tracing | No need for provider-latency diagnosis; would duplicate existing telemetry and create high volume/cardinality | Potentially high | Would create pressure to include prohibited IDs or learner metadata | **DO NOT ADD** |

No candidate meets the threshold for **ADD NOW**. If a later dashboard investigation proves that coarse provider attribution is required, start with one route-level boundary, not `syncCall()` or individual content actions.

## Cost assessment

- Existing route/function tracing: **negligible** incremental application complexity and no custom span volume.
- A single coarse span around the rare GitHub report call or Twilio Verify call: likely **low** volume.
- Spans around every Sync document operation or multiplayer action: **moderate**, and potentially **high** during room activity because one user action can cause multiple provider calls and retries.
- High-cardinality spans containing question, learner, room, session, or document identifiers: **potentially high** operational and privacy cost; explicitly excluded.
- Adding `@vercel/otel` or an exporter without a demonstrated gap: unnecessary dependency/configuration and potentially **moderate** maintenance cost for uncertain diagnostic value.

No dollar savings or exact Vercel charges are estimated because this repository has no Vercel usage data in source control.

## Recommendation

**Should this project add tracing instrumentation now? No.**

Use the existing Vercel request/function traces, Runtime Logs, route status/duration, and sanitized structured events first. The outer traces already answer whether learner, game, or report requests are slow or failing. The provider-specific blind spots are real, but current traffic and the absence of a measured incident do not justify adding a tracing dependency or a potentially repeated Sync span layer.

If diagnosis later requires more detail, inspect a real trace first and add one coarse, fixed-name provider boundary only for the affected flow. Keep attributes limited to provider, operation category, outcome/status class, and perhaps a bounded route class. Preserve the existing authenticated, validated `study_event` pipeline separately; do not duplicate learner telemetry in tracing.

## Privacy findings

No existing tracing or logging code was found that writes phone numbers, email addresses, learner IDs, room tokens, cookies, auth tokens, Twilio credentials/SIDs, GitHub credentials, answer text, request bodies, arbitrary question IDs, or free-form user text. The recommendation preserves that boundary and does not add any custom attributes.
