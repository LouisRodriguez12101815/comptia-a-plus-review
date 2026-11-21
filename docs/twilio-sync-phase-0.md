# Twilio sync, phase 0

Design only. No application code in this change. The public site stays local-only for everyone except one enrolled owner, on at most 10 devices. Budget for this work is $1000. Nothing here is deployed.

Checked 21 November 2026.

## Pricing that can be quoted

`https://www.twilio.com/en-us/sync/pricing` returned **404** on 21 November 2026. The public pricing hub, current as of October 2026, does not list Sync: https://www.twilio.com/en-us/pricing

The last Twilio page that states the Sync rates in the brief is the 21 May 2017 public-beta post: https://www.twilio.com/en-us/blog/products/launches/sync-public-beta-now-open-html

- $0.0025 per connected endpoint-hour
- capped at $0.01 per endpoint per day
- $10 per 1,000,000 explicit reads or writes

Those three numbers are the last published rates, not a 2026 price page. The connection and action arithmetic below uses them and says so. The 200 free endpoint-hours per month, the 10,000 free actions per month, and "storage included" were **not** on that 2017 post and were **not** on the October 2026 hub. They stay the brief's starting facts. The budget below does not subtract them.

Fanout to subscribers is neither a read nor a write: https://www.twilio.com/docs/sync/limits

Other prices below come from pages that were live on 21 November 2026. Each section names the page and the "current as of" date printed on it.

## a. Isolation

Use a new Twilio subaccount for this study sync. Do not put it on the Civic Path account, and do not reuse the account behind the existing `TWILIO_ACCOUNT_SID` values. Those variables already serve learner progress (`lib/learner/twilio.ts`) and multiplayer rooms (`lib/game/room-store.ts`). Usage triggers on the new subaccount watch that subaccount only. The trigger API is per account SID: https://www.twilio.com/docs/usage/api/usage-trigger

Vercel environment variables, **Production only**, never `NEXT_PUBLIC_`, never sent to the browser:

| Variable | Holds |
| --- | --- |
| `STUDY_SYNC_ACCOUNT_SID` | Subaccount SID (`AC…`) |
| `STUDY_SYNC_API_KEY_SID` | API key created inside that subaccount (`SK…`) |
| `STUDY_SYNC_API_KEY_SECRET` | That key's secret |
| `STUDY_SYNC_SERVICE_SID` | This app's Sync service (`IS…`) |
| `STUDY_SYNC_VERIFY_SERVICE_SID` | Verify service used for enrollment (`VA…`) |
| `STUDY_SYNC_AUTH_TOKEN` | Subaccount auth token, webhook signature only |
| `STUDY_SYNC_OWNER_PHONE` | The one phone allowed to enroll |

The browser receives a short-lived Sync JWT and nothing else. If any of these variables is missing, the study-sync routes stay off and the site keeps using `localStorage`.

## b. Data model

One Sync service. Object names are fixed. Identity on the token is the single string `study-owner` (256-character identity limit). The phone number is not a Sync key and is not written into items.

Limits, from https://www.twilio.com/docs/sync/limits (read 21 November 2026):

- Document, List item, and Map item payloads: 16 KiB of JSON, UTF-8.
- A List or Map holds at most 1,000,000 items.
- Unique names: 320 characters. Identity: 256 characters.
- Default page size 50. `PageSize` up to 100.
- Writes and reads: up to 20 per second per object, with a 10-second burst window. Payloads of 10 KiB or more drop to 2 writes per second. The limit is on the List or Map as a whole, so a sitting must not fire dozens of parallel writes at one List.
- TTL is an integer from 0 to 31,536,000 seconds. These objects use TTL 0. They do not expire.

Paging, from https://www.twilio.com/docs/sync/api/list-resource : pass `PageSize` and follow `meta.next_page_url` (`Page` and `PageToken` are already filled in) until `next_page_url` is null. REST base in that page's examples is `https://sync.twilio.com/v1`. The same page size applies to Map items (limits page). A full scan of a million-item List is 10,000 reads at page size 100. Clients and the notebook keep a high-water item index and read only new pages.

| Object | Unique name | Key | What is stored |
| --- | --- | --- | --- |
| List | `attempts` | item index | One item per answer event. Fields: `attempt_id`, `exam`, `question_id`, `task`, `domain`, `correct`, `confidence`, `miss_reason`, `seconds`, `mode`, `sitting_id`, `answered_at`. No answer text, no selected choice, no prompt. |
| Map | `mistakes` | question id | The `MistakeRow` in `lib/saa-mistake-log.ts`: `id`, `prompt`, `task`, `domain`, `timesMissed`, `correctSinceLastMiss`, `lastResult`, `lastConfidence`, `missReason`, `lastSeen`, `status`, `kind`, `wasMisconception`, `masteredAt`. `wasMisconception` stays true after a sure-but-wrong. `masteredAt` is the local-date mastery timestamp from that module. This map is a cache. It is rewritten from attempts, not merged field by field. |
| Map | `cardSchedule` | card id | `StoredSchedule` from `lib/study/schedule.ts` (FSRS card with ISO `due` and `last_review`), plus `updated_at` and `device_id`. |
| Map | `games` | game id | Best score and streak already stored on `Progress` in `lib/progress.ts`: `memoryGames` (`lastMixDay`, `streak`, `bestMs`) and `drillPractice` (`missedIds`, `bestStreak`, per-deck `bestScore` and `bestStreak`). One small item per game id, with `updated_at` and `device_id`. |
| Document | `settings` | — | Opt-in flag, study focus, and the device high-water marks that are not per device. Must stay under 16 KiB. |
| Map | `devices` | device id | `label`, `enrolled_at`, `last_seen`, `revoked_at`. No phone number. |

`MistakeRow.prompt` is question text. Reject a write that serializes to 16 KiB or more and keep the local copy. Attempt items are a handful of fields and sit far under that cap.

At the site's published SAA-C03 length of 65 questions (`lib/saa-test-skills.ts`), two full mocks a week is about 6,760 attempt items a year. The million-item cap is not the planning limit. The 16 KiB item cap and the 20 writes/second list cap are.

## c. Local-first sync

`localStorage` key `comptia-a-plus-review-progress-v1` (`lib/progress.ts`) remains the copy that works with no network. A failed token request, a kill switch, or a full write cap leaves that copy in place. The public learner sync in `app/api/learner/sync` is a different map and is not reused.

Push after:

- a quiz or mock sitting finishes (`QuizRunner`, `ExamTest`)
- a flashcard review is graded
- a game round records a best score or streak

Push sends new attempt items and the changed schedule, game, and settings keys. It does not send the mistakes map as source data.

Merge on load:

1. Read attempt items after the device's high-water index. Dedupe by `attempt_id`. The same id is one event. A replay is a no-op. If the same id arrives with a different body, keep the item with the earlier Sync `date_created` and surface it in the conflict log.
2. For `cardSchedule`, `games`, `settings`, and `devices`, last write wins. Compare the Sync item's `date_updated`. Tie-break by `device_id` in lexicographic order so the result is stable.
3. Rebuild every `mistakes` row by running the merged attempts through the rules in `lib/saa-mistake-log.ts` (local calendar dates, sticky `wasMisconception`, a later miss reopening a mastered row). Do not merge `timesMissed`, `status`, or `masteredAt` field by field.

### Conflict test plan

1. Two devices offline each append different `attempt_id`s, then both push. The List contains both. Neither sitting is dropped.
2. The same `attempt_id` pushed twice leaves one item.
3. The same `attempt_id` pushed with two bodies keeps the earlier `date_created`.
4. Two devices update the same card schedule. The later `date_updated` is the stored card. Equal timestamps keep the lexicographic `device_id`.
5. Device A masters a question. Device B, offline, records a later miss on that question, then syncs. The rebuilt mistake row is Active, and Misconception only when that later miss was sure-but-wrong. `wasMisconception` stays true. A field-wise merge that left the row Mastered fails this test.
6. Airplane mode during a sitting still writes `localStorage`. The push retries after the network returns. A 429 or a refused token does not clear local progress.
7. Clock skew: a device whose `updated_at` is ahead does not win over Sync `date_updated`, because the winner is the server timestamp.

## d. Auth and the 10-device cap

Enrollment is Twilio Verify OTP to `STUDY_SYNC_OWNER_PHONE` only. Any other number gets the same not-enrolled response, with no signal about why.

Verify pricing, current as of October 2026: https://www.twilio.com/en-us/verify/pricing

- SMS channel: $0.05 per successful verification + $0.0083 per SMS (US).
- A failed, expired, or unfinished verification does not get the $0.05 fee. The SMS attempt can still be billed.

The Verify page says a verification-only use of 10DLC can go through Verify instead of a separate A2P campaign: https://www.twilio.com/docs/messaging/compliance/a2p-10dlc

After a successful check, the server creates a `devices` item if fewer than 10 devices have `revoked_at` null. The 11th is refused. Revoking a device on the settings page frees a slot. A revoked device cannot mint a token.

The token route mints a Sync access token only when all of these hold: study-sync env is present, the kill switch is off, the device is enrolled and not revoked, and today's write counter is under the cap. The grant is a `SyncGrant` whose `serviceSid` is `STUDY_SYNC_SERVICE_SID`. Identity is `study-owner`. TTL is 3600 seconds. Access tokens max out at 24 hours, and the SDK guidance is not to go under 30 minutes: https://www.twilio.com/docs/iam/access-tokens and https://www.twilio.com/docs/sync/sdks-best-practices

The client refreshes on `tokenAboutToExpire`. The JWT is the thing that can spend the budget, so the route that mints it is the gate.

Rate limits on our routes, per UTC hour:

- Verify start: 3 per owner phone
- Verify check: 8 per owner phone
- Token: 12 per enrolled device

Over the limit, respond 429 and leave the browser on `localStorage`.

Settings UI, owner only: list device label, last seen, and a revoke button. Also the opt-in toggle, "Delete all synced data", and the existing CSV export.

## e. Cost model against $1000

Sync figures use the 21 May 2017 rates, because the requested 2026 pricing URL 404'd. Verify figures use the October 2026 Verify page.

### Worst case: 10 devices connected all month

10 endpoints × $0.01/day × 30 days = **$3.00** per 30-day month.

10 × $0.01 × 365 = **$36.50** per year.

Without the daily cap, 10 × 24 × 30 × $0.0025 = $18.00 for a 30-day month. The cap is what binds.

The write cap below, if hit every day: 2,000 writes × 30 × ($10 / 1,000,000) = **$0.60** per 30-day month, or 2,000 × 365 × $0.00001 = **$7.30** per year. Reads are extra and small if clients page from a high-water index. A hostile full scan of 1,000,000 items at 100 per page is 10,000 reads, which is $0.10.

Verify, if all 10 devices enroll once with one successful US SMS each: 10 × ($0.05 + $0.0083) = **$0.583**. If they all re-verify every month: about **$7.00** per year.

Worst case that this design will actually allow, using the last published Sync rates plus October 2026 Verify:

| | Month (30 days) | Year |
| --- | ---: | ---: |
| 10 devices, daily connection cap | $3.00 | $36.50 |
| Writes at the 2,000/day cap | $0.60 | $7.30 |
| 10 successful SMS verifications every month | $0.58 | $7.00 |
| Total | $4.18 | $50.80 |

$1000 / $50.80 is about 19 years at that ceiling. The expected case is the connection cap plus a few cents of actions, about **$37** in a year if the 2017 cap is still the billed rate. The free-tier units in the brief are not required for that conclusion. Before 9b-1 ships, read one Usage Record on the empty subaccount and confirm Sync still bills as endpoint-hours and actions. If the 2026 bill is different, stop and reprice. Do not guess a replacement rate.

### Expected actions

$10 / 1,000,000 = $0.00001 per explicit read or write. Counts below are design counts from this repo, not Twilio prices.

| Event | Writes | Action cost |
| --- | ---: | ---: |
| Topic quiz, 15 questions (`QuizRunner` cap) plus one settings touch | 16 | $0.00016 |
| Mini mock, 20 questions (`SAA_MINI_QUESTIONS`) plus one settings touch | 21 | $0.00021 |
| Full mock, 65 questions (published SAA-C03 length) plus one settings touch | 66 | $0.00066 |
| Card session, 20 reviews (assumption) | 20 | $0.00020 |
| Game round that updates a best and a streak | 2 | $0.00002 |

One busy study month, one person: 20 topic quizzes, 4 minis, 2 full mocks, 30 card sessions, 30 game rounds, and 10 devices × 30 days × 3 page reads.

Writes: 20×16 + 4×21 + 2×66 + 30×20 + 30×2 = 1,196. Reads: 900. Total 2,096 actions = **$0.021**. Ten devices all doing that same study is still about $0.21 of actions, plus the $3.00 connection cap.

## f. Guardrails

Create three Usage Triggers on the **subaccount**, `UsageCategory=totalprice`, `TriggerBy=price`, `Recurring=monthly`, `TriggerValue` 10, 25, and 50. Each fires at most once per monthly interval, and usage data can lag the trigger check: https://www.twilio.com/docs/usage/api/usage-trigger

The callback is a signed webhook, same checks as `lib/game/usage-webhook.ts` (content type, size, Twilio signature, account SID, trigger SID, `TriggerBy=price`, `UsageCategory=totalprice`), but it uses `STUDY_SYNC_*` and rejects the Civic Path account SID. On a valid fire it latches a `kill-switch` Document and sends one email to the owner. The trigger API itself has a `CallbackUrl`, not an email field, so the email is ours: Twilio Email at $0.0013 per email (October 2026 hub). Three fires in a month cost $0.0039. The latch stays until the owner clears it. While latched, the token route mints nothing. The site keeps working from `localStorage`.

Daily write cap, enforced in the token route: 2,000 accepted item writes per UTC day. At the cap the route returns 429 and does not mint, even if the dollar triggers have not fired. The counter increments when a push is accepted and resets at the next UTC midnight.

$10 is already far above the expected ~$3 month. The trigger is there so a bug cannot spend the $1000.

## g. Optional add-ons

Not part of 9b. Each price is from a page fetched on 21 November 2026. None of these are required for sync.

### Voice drill (9c)

Hands-free only: `<Gather input="speech">`. https://www.twilio.com/docs/voice/twiml/gather points pricing at Programmable Voice.

US voice pricing, current as of October 2026: https://www.twilio.com/en-us/voice/pricing/us

- Make a US call: $0.0140 per minute
- Local number: $1.15 per month
- Gather speech recognition, default "Twilio Picks" provider: $0.02 per use
- Basic text-to-speech: Free

Design assumption, stated so the minutes are not a hidden guess: one outbound call, 5 questions, one Gather each, 4 minutes, then the call hangs up. A hard stop at 5 minutes belongs in the TwiML so a stuck call cannot run all day.

Per day: 4 × $0.0140 + 5 × $0.02 = $0.156. Per 30-day month: $4.68 plus $1.15 for the number = **$5.83**. Per year: 365 × $0.156 + 12 × $1.15 = **$70.74**.

### Daily SMS drill (9d)

Five questions, the owner replies A–D. That is 5 outbound segments and 5 inbound segments per day, one segment each if the copy stays inside 160 characters.

US SMS pricing, current as of November 2026: https://www.twilio.com/en-us/sms/pricing/us

- Long code and toll-free, outbound and inbound SMS: $0.0083 per segment
- Failed-message processing fee: $0.001, only when status is Failed
- Long-code lease: $1.15 per month. Toll-free lease: $2.15 per month
- Carrier fees are extra and depend on the carrier. Long-code outbound on that page runs from $0.0035 (AT&T) to $0.005 (Verizon and US Cellular). Long-code inbound runs up to $0.0035 (AT&T). Verizon's inbound cell on that table is blank. Toll-free carrier rows are in the same bands.

Twilio segment fees for 10 messages × 30 days × $0.0083 = **$2.49** per month. Upper published carrier add-on used here, not an average: $0.005 outbound and $0.0035 inbound × 5 × 30 = **$1.275**. Messaging high month ≈ **$3.77**, plus the number.

A2P 10DLC, from https://help.twilio.com/articles/1260803965530-A2P-10DLC-Campaign-Registration-Guide and https://help.twilio.com/articles/11587910480155-A2P-10DLC-Campaign-Vetting-FAQ (fetched 21 November 2026; the guide records the 1 August 2025 TCR fee change):

- Required for application SMS from a US 10DLC number. Toll-free is outside that system.
- Sole proprietor brand: $4.50 once. Low Volume Standard brand: $4.50 once. Standard brand: $46 once, which includes secondary vetting of $41.50.
- Campaign vetting: $15 once, non-refundable if vetting fails.
- Monthly campaign fee: Sole prop $2, low-volume mixed $1.50, standard $10.
- Lead time: up to 5 business days for standard use cases. The FAQ says to contact Twilio if vetting is still in progress after 10 days.
- Year-1 sole-prop registration: $4.50 + $15 + 12 × $2 = $43.50, plus the long-code lease 12 × $1.15 = $13.80, plus messaging. A high year-1 total is about **$103** if every month is the $3.77 messaging case.

Toll-free, from https://help.twilio.com/articles/360038172934-Best-Practices-for-Using-Toll-Free-SMS-and-MMS-in-the-US-and-Canada :

- Verification is required. Unverified toll-free numbers have been blocked since 31 January 2024.
- Twilio offers that verification at no charge. The article says about 3–5 business days.
- No brand fee and no $15 campaign fee. Number is $2.15 per month ($25.80 per year). Messaging carrier fees still apply.
- A high year-1 total is about **$71** (12 × $2.15 + 12 × $3.77).

For one person and five questions a day, toll-free is the cheaper path and the shorter registration. 10DLC is the path only if we insist on a local 10-digit number. Enrollment OTP stays on Verify and does not need either registration.

### Weekly email (9e)

One email a week: weakest tasks, misconceptions, lucky guesses, the accuracy trend, and the next 10 questions to review. No answer text.

October 2026 hub, https://www.twilio.com/en-us/pricing :

- Twilio Email: $0.0013 per email. 52 × $0.0013 = **$0.07** per year.
- Twilio SendGrid Email API: 100 emails/day free. Paid plans start at $19.95 per month.

Use Twilio Email or the SendGrid free tier. Do not buy the $19.95 plan for one weekly message.

## h. Capstone tie-in

`capstone/saa_flow.ipynb` keeps the committed synthetic CSV as the default. That file is not learner data. This design does not edit the notebook.

A later capstone change, after attempts actually sync, adds an optional path:

- Read the subaccount SID, API key, and Sync service SID from Colab secrets. Never commit them and never print them.
- `GET https://sync.twilio.com/v1/Services/{ServiceSid}/Lists/attempts/Items`, following `next_page_url`.
- Load the items into SQLite.
- Run four queries: weakest tasks, misconception rate by domain, weekly accuracy trend, lucky-guess rate (correct answers whose `confidence` is `guess`).

The synthetic fixture remains what a fresh clone runs.

## i. Privacy

- Opt-in is off until the owner turns it on. Off means no token request.
- "Delete all synced data" removes the `attempts` List, the four Maps, and the `settings` Document for this service. It does not wipe `localStorage` unless the owner also clears the browser.
- CSV export already exists on the scorecard: "Export my SAA attempts (CSV)" downloads `saa-attempts.csv` (`messages/en.json`, `app/components/Scorecard.tsx`, shipped in #246). Export reads the local copy and does not require Sync.

The public site never enrolls a visitor. There is one allowed phone.

## j. Build plan

No code in this PR. Suggested order:

### 9b-1 — sync core, device cap, kill switch

About 3 days.

- `lib/study-sync/config.ts` — read `STUDY_SYNC_*`, fail closed, refuse the Civic Path account SID if it is ever copied into these variables
- `lib/study-sync/token.ts` — SyncGrant, 3600s TTL, identity `study-owner`
- `lib/study-sync/devices.ts` — enroll, list, revoke, cap at 10
- `lib/study-sync/kill-switch.ts` — latch document and daily write counter
- `app/api/study-sync/verify/route.ts`
- `app/api/study-sync/token/route.ts`
- `app/api/study-sync/devices/route.ts`
- `app/api/study-sync/usage-trigger/route.ts`
- Owner settings section (device list, revoke, opt-in, delete)
- Tests for the cap, the 11th device, rate limits, a bad signature, and the latch

Does not sync attempts yet. A successful token is enough to prove enrollment.

### 9b-2 — mistakes, cards, games

About 4 days.

- Push and merge in `lib/progress.ts`, called from `QuizRunner`, `ExamTest`, card review, and the game-round save
- Attempts List writer, schedule Map, games Map, settings Document
- Mistake rebuild through `lib/saa-mistake-log.ts`
- The conflict tests in section c

### 9c — voice

About 2 days, plus the $1.15 number. TwiML route, `<Gather input="speech">`, 5-minute hangup. No Sync token in the voice webhook.

### 9d — SMS

About 2 days of code, plus 3–5 business days of toll-free verification before the first real message. Inbound webhook, five-question session, A–D replies. Toll-free unless we explicitly choose 10DLC and its fees.

### 9e — weekly email

About 2 days. A weekly job reads synced attempts, writes the five sections in section g, and sends one Twilio Email. It does nothing while the kill switch is latched.

## Queue after this design

Not started here: 10 study analytics dashboard, then 7c verified facts, then 8 capstone on real attempts, then the SiteHeader hydration fix.
