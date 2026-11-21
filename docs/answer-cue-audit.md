# Answer-cue audit

Single-answer question items only for the length rates (questions.json, the high-yield fill, and qualifier twins). Game items are in the CSV and are not in these rates. A key is longest when it is strictly longer than every other choice. Strongly length-biased means that and at least 1.3 times the mean wrong-choice length. Chance for a four-choice item to be the unique longest is 25%.

Enforced now: saa-c03. Targets for an enforced exam: key-is-longest ≤ 35.0%, strongly length-biased ≤ 10.0%, self-disqualifying 0, and choices not parallel 0. CLF and CompTIA stay warn-only against those four targets. Self-disqualifying means a wrong choice names the opposite of a stem requirement. Not parallel means a bare key beside qualified distractors, or the reverse.

| Exam | Single-answer | Key longest | Strongly biased | Key at A | Stem-word | Absolute words only on wrong choices | All/none of the above | Only complete key | Near-duplicate choices | Self-disqualifying distractor | Choices not parallel |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| saa-c03 | 344 | 43 (12.5%) | 0 (0.0%) | 112 | 61 | 77 | 0 | 5 | 0 | 0 | 0 |
| clf-c02 | 373 | 162 (43.4%) | 146 (39.1%) | 192 | 74 | 117 | 0 | 8 | 1 | 25 | 25 |
| comptia | 230 | 146 (63.5%) | 134 (58.3%) | 55 | 78 | 56 | 0 | 15 | 1 | 10 | 33 |
| 220-1201 | 39 | 35 (89.7%) | 35 (89.7%) | 9 | 16 | 14 | 0 | 4 | 0 | 3 | 2 |
| 220-1202 | 171 | 101 (59.1%) | 96 (56.1%) | 41 | 55 | 37 | 0 | 11 | 1 | 4 | 29 |
| n10-009 | 21 | 10 (47.6%) | 3 (14.3%) | 5 | 7 | 6 | 0 | 0 | 0 | 3 | 2 |

The full per-item CSV is written to ignored `tmp/answer-cue-audit.csv` when the audit runs. Authored key position is reported here and does not affect display: quiz, timed test, twin, topic, mini-mock, mistake-log retest, drills, choice games, subnet concept and reason, and the optional IPv6 review shuffle choices when the sitting is shown.

## SAA warn-only checks

These three checks are SAA only and do not fail the build. Keyword echo is a distinctive question term in the key and in no distractor, ignoring stopwords and any term that appears in every choice. Odd-one-out opening means every distractor shares its first three words and the key does not. Key-is-shortest uses the same strict comparison as key-is-longest.

Key-is-longest: 43 (12.5%). Key-is-shortest: 71 (20.6%). Shortest target band: 15.0%–35.0%.

### Keyword echo

Count: 56.

- q-aws-found-03: location
- q-aws-found-10: customer
- q-saa-core-02: average
- q-saa-core-13: storage
- q-saa-core-15: subnet

### Odd-one-out opening

Count: 0.


### Key is shortest

Count: 71 (20.6% of 344).

- q-aws-found-02: key length 31
- q-aws-found-03: key length 13
- q-aws-found-05: key length 48
- q-aws-found-06: key length 16
- q-aws-found-07: key length 8

