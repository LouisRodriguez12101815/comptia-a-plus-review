# Atomic learner progress persistence

`/api/learner/sync` keeps the existing authenticated, same-origin API and learner
Sync Map isolation. The `Progress` payload and merge rules are unchanged (latest
card review wins, local ties/focus win, attempt unions capped at 40 quizzes and
30 mocks). Client sync and the separate telemetry records are unchanged.

## Failure confirmed before the fix

Two requests could both read X, merge different new attempts, and acknowledge
success after replacing the same `progress-N` items; only the last writer's
attempt survived. Replacing chunk 0 and failing before chunk 1 also produced
valid JSON containing both old and new card flags, with no completeness signal.

## Commit protocol

1. Fetch `progress-head`, including its provider revision. With no head, read the
   existing `progress-N` legacy stream; recheck the head before using that stream.
   Require contiguous, correctly shaped chunks and reject parsing problems,
   including repairs, before creating any candidate chunks or publishing a head.
   Invalid legacy data returns the existing unavailable response without changing
   stored bytes; recovery must be explicit, not an automatic empty-state repair.
2. Merge the request with this snapshot using the existing merge function.
3. Create unique, immutable `progress-snapshot-<UUID>-<index>` items. Validate
   item sizes before writing. The manifest records count, UTF-8 byte length and
   SHA-256 of the complete JSON stream.
4. Publish `progress-head` only after every chunk has succeeded. Existing heads
   use Twilio Sync Map Item `update({data, ifMatch: revision})`; the first head
   uses create-if-absent. Only expected create 409 / update 409 or 412 conflicts
   cause a fresh read, merge and retry (at most five attempts). Other provider
   errors retain the API's existing unavailable response.
5. Retire only the previously committed generation after successful publication.
   Readers encountering retired chunks re-read an advanced head; missing/mixed
   chunks under an unchanged head fail closed. Unreferenced chunks are never
   considered current progress.

The pointer CAS is the commit point across Vercel instances; no local lock is
used. An identical retry needs no new generation. An ambiguous publication
timeout deliberately retains candidate chunks because the commit may have
succeeded; a later retry reconciles with the actual head. Cleanup failure does
not invalidate an acknowledged commit. The history export reads the same
validated manifest and never prefers frozen legacy data over a published head.

## Limits and operation

- Old legacy chunks are retained read-only. Validation detects malformed streams,
  but cannot retroactively prove the completeness of previously mixed chunks that
  happen to form valid progress JSON.
- Shared learner-map reads follow every provider page, without a total-item cap,
  so accumulated snapshots cannot hide telemetry after the first 1,000 items.
  Only a missing first page is treated as an empty map. A later-page failure
  fails the read rather than returning partial/empty results. Reads remain
  learner-scoped and do not write, repair, or expose map contents to the browser.
- Process termination or failed cleanup can leave unreferenced generations.
  Ordinary successful saves retire their predecessor, but this patch does not
  add an orphan sweeper, cron, TTL, or additional infrastructure. Repeated hard
  failures can increase map storage/listing volume. Ambiguous publication errors
  retain candidate chunks because they may already be committed. Operator cleanup
  should happen only with writers quiesced and the current head and its complete
  snapshot validated; account for in-flight readers before retiring other data.
  Do not delete candidates merely because they are unreferenced or old: a paused
  writer may still publish them. No age-only garbage collection is safe here.
- Provider outages or exhausted contention retries still return the existing
  non-success response; clients retain local progress and can retry. No live
  provider fault injection or deployment is part of this change.

## Migration rollout and rollback safety

Before enabling manifest-backed writes, pause/drain legacy writers, including
in-flight requests and any other deployment sharing the learner Sync Maps. Merely
switching new traffic is insufficient: an old request can finish after the first
head is published and acknowledge a legacy save that manifest readers never see.
The new readers deliberately do not mix those late legacy changes into committed
progress. This patch documents the restriction; it does not make old writers safe.

Enable writes only when all remaining writers/readers understand the manifest.
After the first manifest-backed write, rollback to an old writer is unsafe:
frozen legacy chunks are no longer current. Any rollback build must preserve
manifest-aware reading and CAS publication. Do not remove the head to force a
legacy fallback or treat retained legacy data as an up-to-date rollback snapshot.
