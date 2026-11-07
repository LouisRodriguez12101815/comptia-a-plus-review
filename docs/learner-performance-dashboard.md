# Learner performance dashboard

`/[locale]/performance` is a read-only view over the existing local `Progress` record. It derives quiz and mock-exam summaries, time-window totals, question history, topic/objective aggregates, repeated misses, recovered/improved questions, and deterministic review suggestions from saved attempts.

The dashboard does not create a second progress store, write while rendering, or add learner telemetry. Attempts without question IDs remain in aggregate totals but are not attributed to individual questions. A recovered question means it was missed earlier and answered correctly later; it is not a mastery claim.

The current view is intentionally limited to saved on-device progress. A future phase could use authenticated telemetry as an additional evidence source, but that is not part of this dashboard and must preserve the existing privacy and learner-sync boundaries.
