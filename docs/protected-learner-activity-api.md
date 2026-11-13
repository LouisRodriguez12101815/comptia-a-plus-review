# Protected learner activity API

`GET /api/learner/activity` returns seven days of retained, synced activity for
the existing signed-in learner. It accepts no query parameters or request body.
The server validates the signed cookie against the current learner allowlist and
derives the Sync Map identity from that session. Responses, including errors, use
`Cache-Control: no-store`; supplied cross-origin requests are rejected.

The route uses runtime server configuration and a learner-scoped GET-only Twilio
transport. It follows every map-item page without migrating, repairing, or writing
records. Committed `progress-head` snapshots are authoritative; missing or corrupt
chunks fail closed. If the head advances during pagination or decoding, the read
retries up to five times. Provider errors are returned as a generic unavailable
response, with no provider body or stored record in the response or logs.
The existing shared provider pause latch is checked before learner-map access;
when paused, the endpoint returns `423` with `{ "error": "paused" }`.

The browser DTO has only `window` (`days`, `start`, `end`), `totals` (`questions`,
`attempts`, `correct`, `incorrect`), `ambiguity`, `topics`, `objectives`, and `limitations`.
Topic and objective rows contain exam/topic/objective IDs, question/attempt/correct/
incorrect counts, and a weakness score capped at 10,000. At most 100 rows of each
type are returned; `truncatedGroups` indicates truncation. `excludedEvidence`
indicates analysis gaps; retained history does not guarantee a complete time window.
When the latest outcomes for a question conflict at the same instant, the DTO
counts one ambiguous attempt and excludes those tied outcomes from definite
correct/incorrect totals. `ambiguity.count` and each applicable group row's
`ambiguous` count report this without identifying the question. Earlier scored
outcomes remain counted. `ambiguity.mixedObjectiveContexts` counts questions whose
scored evidence spans multiple objective contexts; those questions are not
attributed to an objective row. Weakness scores retain the existing analysis policy.

The endpoint does not return learner, session or map IDs, provider records, raw
progress/telemetry, question IDs, selected answers, correct answers, explanations,
credentials, phone numbers, or scheduling state. It does not return the offline
exporter's private artifacts. No answer key is sent by this endpoint.
