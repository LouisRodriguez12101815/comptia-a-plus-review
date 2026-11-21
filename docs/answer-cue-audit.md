# Answer-cue audit

Single-answer question items only for the length rates (questions.json, the high-yield fill, and qualifier twins). Game items are in the CSV and are not in these rates. A key is longest when it is strictly longer than every other choice. Strongly length-biased means that and at least 1.3 times the mean wrong-choice length. Chance for a four-choice item to be the unique longest is 25%.

Enforced now: none. Targets: key-is-longest ≤ 35.0% and strongly length-biased ≤ 10.0%. SAA and CLF stay warn-only until their rewrite batches. CompTIA stays warn-only against those targets. Self-disqualifying distractors and non-parallel choices are warn-only: a wrong choice that names the opposite of a stem requirement (Linux against Windows, single-AZ against multi-AZ, Regional against global, at rest against in transit, and the related pairs), or a bare key beside qualified distractors, or the reverse.

| Exam | Single-answer | Key longest | Strongly biased | Key at A | Stem-word | Absolute words only on wrong choices | All/none of the above | Only complete key | Near-duplicate choices | Self-disqualifying distractor | Choices not parallel |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| saa-c03 | 344 | 113 (32.8%) | 66 (19.2%) | 112 | 115 | 157 | 0 | 8 | 0 | 65 | 30 |
| clf-c02 | 373 | 168 (45.0%) | 152 (40.8%) | 192 | 74 | 119 | 0 | 11 | 1 | 25 | 25 |
| comptia | 230 | 146 (63.5%) | 134 (58.3%) | 55 | 78 | 56 | 0 | 15 | 1 | 10 | 33 |
| 220-1201 | 39 | 35 (89.7%) | 35 (89.7%) | 9 | 16 | 14 | 0 | 4 | 0 | 3 | 2 |
| 220-1202 | 171 | 101 (59.1%) | 96 (56.1%) | 41 | 55 | 37 | 0 | 11 | 1 | 4 | 29 |
| n10-009 | 21 | 10 (47.6%) | 3 (14.3%) | 5 | 7 | 6 | 0 | 0 | 0 | 3 | 2 |

The full per-item CSV is written to ignored `tmp/answer-cue-audit.csv` when the audit runs. Authored key position is reported here and does not affect display: quiz, timed test, twin, topic, mini-mock, mistake-log retest, drills, choice games, subnet concept and reason, and the optional IPv6 review shuffle choices when the sitting is shown.

