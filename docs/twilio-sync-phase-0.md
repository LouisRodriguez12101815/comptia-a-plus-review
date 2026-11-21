# Twilio sync, phase 0 (revised)

Design only. No application code in this change. Phase 0 starts from the learner sync that is already in production. It does not add a second Sync service or a `STUDY_SYNC_*` env set.

Checked 21 November 2026. The account and billing reads in sections b and c did not run: repository `.env.local` is absent, so no Twilio credential was loaded and no Usage Record was requested.

## Pricing that can be quoted

`https://www.twilio.com/en-us/sync/pricing` returned **404** on 21 November 2026. The public pricing hub, current as of October 2026, does not list Sync: https://www.twilio.com/en-us/pricing

The last Twilio page that states the Sync rates in the brief is the 21 May 2017 public-beta post: https://www.twilio.com/en-us/blog/products/launches/sync-public-beta-now-open-html

- $0.0025 per connected endpoint-hour
- capped at $0.01 per endpoint per day
- $10 per 1,000,000 explicit reads or writes

Those three numbers are the last published rates, not a 2026 price page. The 200 free endpoint-hours per month, the 10,000 free actions per month, and "storage included" were not on that post and were not on the October 2026 hub. Do not subtract them until a Usage Record shows a free tier. Fanout to subscribers is neither a read nor a write: https://www.twilio.com/docs/sync/limits

Verify, current as of October 2026: https://www.twilio.com/en-us/verify/pricing

- SMS: $0.05 per successful verification + $0.0083 per SMS (US).
- A failed, expired, or unfinished verification does not get the $0.05 fee. The SMS attempt can still be billed.

This revision does not reprice voice, SMS drills, or weekly email. Those stay later optional work. The connection math from the 2017 cap is unchanged: 10 devices always connected is 10 × $0.01 × 30 = $3.00 per 30-day month, and 10 × $0.01 × 365 = $36.50 per year, if those rates are still what Twilio bills. Section c is what would confirm that. It was not run.

## a. What already exists

One Sync map per allowlisted phone. The map name is `learner-` plus the first 40 hex characters of HMAC-SHA256(`learner:` + E.164, `LEARNER_SESSION_SECRET`). The phone number is not stored. The browser holds an HttpOnly `learner_session` cookie for 30 days (`lib/learner/session.ts`). The cookie carries the learner id and the last 4 digits of the phone.

`lib/learner/twilio.ts` builds the client from `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`, `TWILIO_SYNC_SERVICE_SID`, and `TWILIO_VERIFY_SERVICE_SID`. `learnerConfig` returns null unless those values match, the session secret is at least 32 characters, and `LEARNER_ALLOWED_PHONES` has at least one number. When config is null, `GET /api/learner/session` reports `configured: false` and `LearnerSync` renders nothing. The site stays on `localStorage`.

The same `TWILIO_*` account and Sync service also back Outage Ops rooms (`lib/game/room-store.ts`). `scripts/setup-twilio-sync.mjs` creates one Sync service named "Outage Ops" and one daily Usage Trigger: `totalprice`, trigger by price, value `5`, recurring daily, callback `POST /api/game/usage-trigger`.

### Routes

| Route | Role |
| --- | --- |
| `app/api/learner/start` | Verify SMS only if the number is on `LEARNER_ALLOWED_PHONES`. Any other number gets `{ ok: true }` and no SMS. Rate limits: 5 starts / 10 min per IP, 3 / 10 min per phone. |
| `app/api/learner/verify` | Checks the OTP. A number that is not allowed gets `wrong_code`. On success, sets the session cookie. |
| `app/api/learner/session` | `{ configured, signedIn, last4 }`. |
| `app/api/learner/signout` | Clears the cookie. Does not touch Sync. |
| `app/api/learner/sync` | Merges this browser's `Progress` into the learner map and returns the merged copy. |
| `app/api/learner/telemetry` | Separate study events, max 200, not the progress document. POST body cap 8,000 bytes. |
| `app/api/learner/delete` | Deletes the whole learner map, then signs out. |

`app/components/LearnerSync.tsx` syncs on sign-in, then 8 seconds after local progress stops changing. `lib/learner/sync.ts` writes the server snapshot back into `localStorage` only when the request succeeds. A failed request leaves the local copy alone.

`scripts/export-learner-activity.mjs` is the private read-only reader for that map. It is not the scorecard CSV. The scorecard button "Export my SAA attempts (CSV)" (`#246`) downloads `saa-attempts.csv` from the browser that is open.

### DailyUsageGuard

`DailyUsageGuard` in `lib/game/room-store.ts` reads the Sync document `outage-ops-usage-YYYY-MM-DD`. If `MULTIPLAYER_PAUSED` is set, it throws 423. Learner sync and Verify start both call `assertActive()` before they talk to Twilio (`app/api/learner/sync/route.ts`, `app/api/learner/start/route.ts`). The webhook in `lib/game/usage-webhook.ts` accepts only a signed `totalprice` / `price` callback and latches that document when the amount is at least $5. There is no email. The latch is for that UTC day, not a monthly study-budget switch. A $5 Outage Ops day also stops learner saves and new OTP texts.

### Progress fields that sync

`saveRemote` (`lib/learner/store.ts`) merges with `mergeProgress` (`lib/learner/merge.ts`), then stores the JSON as a `progress-head` plus chunk items.

Kept by `mergeProgress`:

| Field | Rule |
| --- | --- |
| `studyFocus` | Local wins. |
| `knownCards`, `unknownCards` | Per card, the side with the newer schedule review wins. Local wins a tie. |
| `schedules` | FSRS `StoredSchedule`. Newest `last_review` wins. Local wins a tie. |
| `quizAttempts` | Union, cap 40. Identity is `` `${at}:${topicId}` ``, not a question attempt id. |
| `mockAttempts` | Union, cap 30. Identity is `` `${at}:${exam}` ``. |
| `clfAssessmentSnapshots` | Union, cap 20, by snapshot id. |

Those quiz and mock objects are the whole sitting. When they were recorded with the `#246` fields, the union keeps them: `confidenceByQuestion`, `sureIds`, `unsureIds`, `guessedIds`, `luckyIds`, `missReasons`, `secondsByQuestion`, `sittingId`, `mode`, `wrongChoices`, `selectedChoices` (quizzes), `questionIds`, `objectiveByQuestion` (mocks). Older sittings simply lack the optional fields. `parseProgress` in `lib/progress.ts` accepts them.

Dropped by `mergeProgress`, because the returned object never copies them:

- `memoryGames` (`lastMixDay`, `streak`, `bestMs`)
- `drillPractice` (`missedIds`, `bestStreak`, per-deck bests)

A successful sync writes that stripped object back to `localStorage`. Game bests and drill streaks on the device can disappear on the next signed-in save. They are not in the remote snapshot either, so `scripts/export-learner-activity.mjs` cannot see them.

The `#252` mistake log is not a stored field. `saaMistakeLog` in `lib/saa-mistake-log.ts` rebuilds `MistakeRow` (including `wasMisconception` and local-date `masteredAt`) from quiz and mock sittings. `SaaMistakeLog.tsx` does that in the browser. The inputs that sync are the attempt fields above, and only the sittings that survive the 40/30 caps. There is no per-question `attempt_id` list.

Telemetry events (`lib/learner/telemetry.ts`) are a second stream on the same map: quiz started, question answered, remediation opened, quiz completed. They do not carry confidence, miss reason, seconds, or answer text. The exporter treats telemetry, progress, and history as separate evidence and does not invent a shared attempt id.

### Size

| Limit | Where | Value |
| --- | --- | --- |
| Sync POST body | `app/api/learner/sync/route.ts` `MAX_BYTES` | 400,000 bytes. Larger bodies return 413 `too_large` before a merge. |
| Telemetry POST body | `app/api/learner/telemetry/route.ts` | 8,000 bytes. |
| Sync item | `makeSnapshot` in `lib/learner/progress-snapshot.mjs` | Each chunk is wrapped as `{ s }` and must be at most 16 KiB, matching https://www.twilio.com/docs/sync/limits |
| Chunk string | `CHUNK` | 12,000 characters, so the JSON wrapper stays under 16 KiB unless escaping blows it up. The byte check still rejects an oversized chunk. |
| Chunk count | `MAX_CHUNKS` | 40. Past that, `saveRemote` throws `too_large`. |
| Stored progress ceiling | 40 × 12,000 characters | 480,000 characters of raw JSON, split across items. The route still refuses a single upload over 400,000 bytes. |

Paging of map items is `pageSize: 100` followed to the end (`lib/learner/twilio.ts`). The exporter does the same and refuses non-GET.

## b. Which account

Not determined.

`.env.local` is not in this workspace (`ENOENT` on 21 November 2026). `TWILIO_ACCOUNT_SID` was not read. No account fetch ran, so there is no last-4, no friendly name, no parent SID, and no statement that this is or is not the Civic Path account.

## c. Billing check

Not run. No Usage Records were requested, for the same missing `.env.local`. An empty local file is not evidence that Sync is free, unused, or still billed at the 2017 rates. The next read, once the file is present, should list the last 30 days of categories whose names contain `sync` or `verify`, with the `count` and `price` the API returns, and print only the account SID's last 4 characters plus `friendly_name`, `owner_account_sid` last 4, and whether `owner_account_sid` differs from the account SID.

## d. Gaps

| Requirement | Today |
| --- | --- |
| Max 10 devices, list and revoke | No device record. Every browser that verifies an allowlisted phone shares one map. Sign-out clears that browser's cookie only. Delete removes the entire map. An 11th browser is accepted. |
| Usage Triggers at $10, $25, and $50 per month, email, and a study kill switch | One daily $5 `totalprice` trigger exists for Outage Ops. It pauses multiplayer, learner sync, and new OTP texts for that UTC day. It does not email. It is not $10 / $25 / $50 and it is not monthly. |
| Owner-only | Yes. `LEARNER_ALLOWED_PHONES` is the allowlist. Other numbers are not texted and cannot start a session. The public site stays local when sync is unconfigured or the visitor is signed out. |
| Local-first | Yes for quiz progress: `localStorage` key `comptia-a-plus-review-progress-v1` is the offline copy, and a failed sync does not clear it. Push is "8 seconds after any local change," not a named hook on sitting / card / game. Game and drill fields are then stripped by merge, so local-first does not hold for those fields once a sync succeeds. |
| Mistake log rebuilt from merged attempts | The page already rebuilds from the attempts it has. Sync does not store `MistakeRow`. Caps of 40 quizzes and 30 mocks drop older sittings, so a rebuild after sync can forget a miss that only the dropped sitting contained. |
| Conflict tests | `mergeProgress` is tested for attempt union and schedule timestamps. There is no test that `memoryGames` or `drillPractice` survive, no 11th-device test, and no test that `saaMistakeLog` on the merged sittings reopens a mastered row after a later sure-but-wrong. |

Attempt identity is sitting time plus topic or exam. Two different quizzes in the same millisecond on the same topic collapse to one object. That is not dedupe-by-`attempt_id`.

## e. Recommendation

Extend this sync. Do not stand up a parallel subaccount, Sync service, or Verify service while the production account is still unread. The owner already has one map, Verify, the allowlist, the session cookie, the exporter, and the mistake log derived from the sittings in that map. A second stack would split the data the exporter reads from the data the site writes.

Stay on the current account only if section b shows it is the owner's account and not Civic Path. The code changes in section j are the same either way. The env-var swap is the only part that waits on that answer.

### If the account is Civic Path

This run could not show that. If the follow-up read says the friendly name or the parent is Civic Path, move the learner map and leave Outage Ops where it is.

1. Export, read-only. `scripts/export-learner-activity.mjs` is a sanitized activity report. It is not a restore file: it drops seconds, selected choices are answer indexes, and it never writes `memoryGames` or `drillPractice`. Before the swap, also copy the verified `progress-head` JSON (the raw progress string the exporter already decodes) into gitignored `tmp/`. Do not commit it.
2. Create the owner's own subaccount, one Sync service, one Verify service, and an API key. Put those in Vercel Production only. Do not point Outage Ops at them.
3. Import that one progress snapshot into `learner-<same hmac>` on the new service. Dry-run the item count and the progress SHA-256 first. One write, then a GET to confirm the hash.
4. Swap `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`, `TWILIO_SYNC_SERVICE_SID`, and `TWILIO_VERIFY_SERVICE_SID` for the learner deployment. Keep `LEARNER_SESSION_SECRET` and `LEARNER_ALLOWED_PHONES` so the map name and the cookie still match. If Outage Ops must keep the Civic Path account, learner and multiplayer can no longer share one SID. That split is part of the swap, not a later surprise.
5. Rollback is swapping those five variables back. Do not delete the Civic Path learner map until a read-only export of the new map matches the `tmp/` snapshot. The $5 daily trigger stays on the account that still hosts Outage Ops.

## f. Build plan

Still no code in this PR.

### 9b-1 — fix the merge, then cap devices

About 3 days. Files: `lib/learner/merge.ts`, `lib/learner/sync.ts`, `lib/learner/session.ts`, `app/api/learner/verify/route.ts`, `app/api/learner/signout/route.ts`, a small device list on the existing learner panel, `tests/learner-sync.test.mjs`.

- Carry `memoryGames` and `drillPractice` through `mergeProgress`. Newest write wins, using a timestamp already on the value or the progress save time. Add a regression test that a successful sync does not drop them.
- On Verify, register a device id in the learner map. Refuse the 11th non-revoked device. The panel lists devices and revokes one. Revoke frees a slot. Sign-out of one browser does not delete the map.
- Conflict tests: union of two offline sittings; collapse only when the sitting key matches; `saaMistakeLog` on the merged sittings reopens a mastered question after a later sure-but-wrong and keeps `wasMisconception`; a 429 or 502 does not clear `localStorage`.

### 9b-2 — study budget switch

About 2 days. Files: `lib/game/usage-webhook.ts` or a sibling that does not reuse the $5 Outage Ops latch, `app/api/learner/sync/route.ts`, `app/api/learner/start/route.ts`, tests.

- Three monthly `totalprice` triggers at $10, $25, and $50 on the learner account only.
- Signed webhook latches "stop learner sync and stop new OTP." Local quizzes keep saving to `localStorage`.
- The webhook sends one email to the owner. The trigger API has a callback URL, not an email field. Twilio Email is $0.0013 per email on the October 2026 hub.
- Do not let the Outage Ops $5 daily pause be the study kill switch, and do not let a study latch pause multiplayer unless both products are still on the same account after section e.

### 9b-3 — account move, only if section b says Civic Path

About 1 day plus the Twilio console setup. A read-only snapshot command, one import, the env swap, and the rollback check in section e. No second design.

Queue after this design is approved, not started here: those 9b pull requests, then the study analytics dashboard reading this same synced progress, then 7c verified facts, then 8 capstone on real attempts using the exporter's data as the source, then the SiteHeader hydration fix.
