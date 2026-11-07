# Question telemetry V2

Question-level performance remains derived primarily from the local progress record. Quiz attempts keep question IDs and, for missed single-answer questions, the authored index of the selected wrong choice. Display shuffling is resolved before storage; multi-answer selections do not store a misleading first choice. Older progress remains valid and malformed optional answer details are discarded conservatively.

Recovery is represented in two ways: `everRecovered` means a miss was followed by a correct result, while `currentlyRecovered` is false again if a later miss occurs. This is a review signal, not a mastery or readiness claim.

The existing six authenticated study-event types are retained and support the repository’s canonical exam codes. Fresh client events keep the seven-day validation window; persisted historical events are parsed without that request-time freshness rule. The performance page reads telemetry only for the signed-in learner and uses question ID as the primary key for descriptive remediation activity and resource follow-up. It does not infer causality or join activity from unrelated questions.

Telemetry remains separate from progress storage, keeps the existing 200-event bound, and contains no answer text, phone numbers, credentials, cookies, or free-form learner content.
