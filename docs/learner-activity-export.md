# Private recent-activity diagnostic

## Handoff / branch compatibility

Resumed from issue #207 with the existing uncommitted exporter intact, based on
main `695d3db53797ce703a442c74c63ff3cb10993289`. PR #202 is still open, but
its relevant progress, telemetry, answer-history, performance and exam-helper
files already match this main (the telemetry work also arrived through the
merged release PR #203). No dependency on merging the stale PR #202 is assumed.

The separate atomic-persistence commit
`9236651720d48ac4a0c83d0c8c9532abb114265e` was inspected, not merged or
cherry-picked. Its v1 manifest keys/count/UTF-8 length/SHA-256 contract is covered
by the exporter's compatibility fixture. Current main has no shared manifest
decoder, so the tool uses its small pure compatibility reader plus the existing
pure legacy/history decoder; no provider adapter or write helper is reused.
After atomic persistence merges, retest both suites against the resulting main.
Rebase if required before review, preserve both additions to `test:learner`, and
prefer consolidating the pure manifest decoder then. No runtime-format migration
or live-data validation is required to test that consolidation.

Run locally with Git, Node 24, the existing dependencies and `.env.local`:

```powershell
npm run export:learner-activity -- --days 7 --quiz-size 15
# Optional explicit exam; no cross-certification question mixing:
npm run export:learner-activity -- --days 30 --quiz-size 25 --exam n10-009
```

Required configuration is the same as `export-primary-history.mjs`:
`TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`,
`TWILIO_SYNC_SERVICE_SID`, `LEARNER_SESSION_SECRET`, `LEARNER_ALLOWED_PHONES`.
If the allowlist contains multiple numbers, `LEARNER_PRIMARY_PHONE` must name
one of them. Never put values in CLI arguments, bug reports or Git. The existing
pure resolver applies the application's allowlist/normalization/HMAC rules. It
never enumerates profiles, guesses a first match, or exports the learner-map ID.

## Read-safety review

- On the reviewed main, `loadRemote()` and `loadTelemetry()` call only `list()`;
  neither writes. `parsePersistedStudyEvent()` is pure, with no request-age check.
- The tool deliberately does **not** instantiate the app's `twilioLearner()`
  adapter, call `/api/learner/*`, `saveRemote`, `appendTelemetry`, merge progress,
  migrate, repair, acknowledge, send verification codes, or update provider TTLs.
- It uses one selected map's SDK item `list({pageSize:100})`, following all pages.
  The SDK request transport rejects every non-GET method. Logs are silent;
  auto-retry is disabled; failures produce fixed messages without provider text.
- Current legacy/direct progress and explicit history rows are decoded with the
  existing pure export reader. Independent/legacy telemetry is projected onto the
  strict persisted-event schema; extra fields are discarded and counted.
- It can also read the immutable `progress-head` snapshot format. Count, byte
  length and SHA-256 must match; a published head never falls back to frozen
  legacy chunks. A concurrent retirement/inconsistent listing fails closed: rerun
  the tool, do not repair the store. Legacy chunks have no checksum, so an old
  valid-JSON mixed-generation write cannot be retroactively detected here.
- No production data was accessed during implementation. Tests use synthetic
  credentials, provider objects and learner activity; no write-capable API calls.

## Five private output files

- `tmp/learner-activity-last-7-days.json`
- `tmp/learner-activity-last-7-days.csv`
- `tmp/learner-remediation-summary.json`
- `tmp/learner-remediation-summary.md`
- `tmp/learner-followup-quiz.json`

The first two names reflect `--days`. Other report names stay fixed. Existing
files are refused before provider access; move them aside yourself before a new
run. No automatic deletion or overwriting occurs. Local writes are not a five-file
transaction; disk failure may leave a partial set of **sanitized** files.

`/tmp/` is gitignored; Git must confirm every destination is ignored before a
provider read. A symlink output directory is rejected. New directories and
files request owner-only permissions (0700/0600); Windows users should retain a
private user-profile folder/ACL. Gitignore is not encryption: don't upload these
files, place them under `public/`, share them, or commit them with `git add -f`.

An explicit allowlist defines every activity column. Question/topic/exam IDs and
objectives must resolve against repository metadata. Unknown IDs are omitted and
counted. Selected answers are bounded authored indices only, never free-form
answers. Optional missing fields stay absent; malformed aggregates do not become
question evidence. Timed-out mocks export only visited IDs; unvisited scheduled
questions are counted as omitted, not manufactured attempts. `isCorrect` comes
from stored outcomes, not regrading with today's bank. `correctAnswer` is today's
authored bank key, not proof that an old sitting used the same bank version.

Raw session IDs never leave memory. A 24-hex SHA-256 source hash is locally derived
with a fixed domain separator. It identifies a retained tab/study session, **not a
physical device**, and is not authentication. No learner hash is needed/exported.
No raw SDK object, environment value, cookie, token, phone, header or credential
is serialized. CSV strings also escape spreadsheet-formula prefixes.

## Evidence and exact scoring

The time anchor is captured once before reading; the closed window is
`[anchor - days*24h, anchor]`. There is no other scoring clock or random seed.
Rows are newest first, with code-point-ordered stable secondary keys. Identical
events/migration copies collapse; conflicting copies fail closed.
Opposite latest outcomes tied at the same timestamp within the selected stream
are reported as ambiguous, not arbitrarily recovered. If one question's scored rows
have different objective contexts, its question/topic score stays available but
the combined count is not attributed to just the last objective; raw sanitized
rows retain their individual mappings.

Progress and telemetry lack a shared attempt ID. For each exam/question, use the
one stream containing the newest result (ties: telemetry, then combined quiz/mock
progress, then explicit history). Other rows remain exported as supplemental but
do not add attempts. Supplemental misses prevent a false clean/mastery claim and
give a minimum score of 2. This conservative policy can undercount real earlier
attempts; it never guesses timestamp joins or claims exact cross-stream totals.

For a question, let I = scored incorrect count, R = max(I-1,0), V = 1 if a later
miss follows a logged remediation view after an earlier miss, C = 1 if a scored
miss is within the last 72 hours, O = min(3, other distinct scored-missed questions
under its **same exam/objective**), and L = 1 if the latest result is correct after
an observed earlier miss. Score = `8I + 4R + 5V + 4C + 2O - 4L`, floored at 2
if any scored/supplemental miss exists, otherwise 0. High >=16; medium >0; low =0.
Topic/objective scores sum their question scores. Unknown objectives remain null;
the existing conservative resolver allows only explicit or safe single-objective
fallbacks (AWS still requires explicit tags). No broad-topic guessing occurs.

Recovered material stays visible but below repeated misses. No missing duration,
confidence or telemetry is counted as failure. Current server schemas provide no
answer duration, per-question review count, physical-device ID or reliable shared
quiz ID; none is invented. Existing mock sure/guess flags can be exported but do
not affect the formula. A “recently mastered candidate” needs at least three
observed correct results and no scored or supplemental miss in the window; it is
not global mastery, certification readiness, or evidence about unobserved work.

## Deterministic quiz planning

Separate plans are emitted per observed exam, or only for `--exam`. Default size
15; supported sizes 1–100. Targets are rounded 60% direct remediation, 25% related
reinforcement, remainder spaced review. Short targets can redistribute only into
other evidenced concepts/objectives/topics. Never pad with unrelated questions.

Selection uses the existing controlled-pool exam filter, objective resolver,
Network+ remediation clusters and authored concept groups. Round robin across
weak objectives/topics prevents one repeatedly missed question monopolizing the
plan. Prefer different wording in the same authored concept, then the objective,
then the topic; exact original wording is last. Reinforcement favors broader
same-objective contrasts; spaced review uses previously correct material without
selecting known-weak questions as “spaced”. Stable ID ordering resolves ties.
Normalized duplicate prompts are selected once. Exact keys/explanations are kept.

The bank has no universal per-question independently-verified flag. This tool
means **repository-authored and structurally validated**, not newly live-verified
AWS/CompTIA facts. Invalid keys/schemas are ineligible; it does not certify the
teaching quality of every bank item. Limited objective/topic contrast pools
(fewer than three distinct alternatives), missing evidence categories and final
size shortfalls are explicit. Same-topic fallback is never counted as additional
objective-specific supply. No questions, mappings or answer keys are edited.

The quiz JSON is an **internal answer-key plan**: Question-shaped `questions`
plus separate selection reasons/source IDs. Do not publish it as a pre-answer
learner view. Use `learnerQuizPaths` in the existing app, which hides answers
until Check answer and preserves Next/Finish. Its existing limit is 15 questions,
so larger plans have multiple links (a 25-question plan uses batches of 15 and 10).
The existing runner can reorder each batch by prior question history. Select the
matching study focus for telemetry when using those links; the tool does not
change browser focus/progress. Opening a quiz is not part of the export and is a
separate learner action.

## Coverage and operational limits

All synced devices use the selected learner's same authenticated map; the tool
reads their retained server union, not other learners or local browser storage.
Current progress caps are 40 quizzes/30 mocks; telemetry normally retains 200
events and requires signed-in submission. Offline, unsigned, unsynced, already
pruned or previously lost records cannot be reconstructed. `--days 30` cannot
restore deleted history. Existing cross-device persistence races remain outside
this diagnostic branch. No provider write, deployment, app behavior change,
recommendation UI, readiness model, or dependency change is introduced.
