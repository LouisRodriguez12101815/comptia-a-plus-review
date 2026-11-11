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

- Old legacy chunks are retained read-only. Their historical completeness cannot
  be retroactively proved; their existing parsing policy is unchanged.
- Process termination or failed cleanup can leave unreferenced generations.
  Ordinary successful saves retire their predecessor, but this patch does not
  add an orphan sweeper, cron, TTL, or additional infrastructure. Repeated hard
  failures can increase map storage/listing volume; do not indiscriminately
  delete generations while writers/readers are active.
- After migration, all server writers/readers must understand the manifest.
  Do not roll back to the old chunk writer: frozen legacy data is not current.
- Provider outages or exhausted contention retries still return the existing
  non-success response; clients retain local progress and can retry. No live
  provider fault injection or deployment is part of this change.
