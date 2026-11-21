# Answer-cue audit

Single-answer question items only for the length rates (questions.json, the high-yield fill, and qualifier twins). Game items are in the CSV and are not in these rates. A key is longest when it is strictly longer than every other choice. Strongly length-biased means that and at least 1.3 times the mean wrong-choice length. Chance for a four-choice item to be the unique longest is 25%.

Enforced now: saa-c03. Targets for an enforced exam: key-is-longest ≤ 35.0%, strongly length-biased ≤ 10.0%, self-disqualifying 0, choices not parallel 0, true conditional distractor 0, category word only the key matches 0, odd-one-out opening 0, keyword echo ≤ 34, and key-is-shortest inside 15.0%–35.0%. CLF and CompTIA stay warn-only against the first four targets. Self-disqualifying means a wrong choice names the opposite of a stem requirement. Not parallel means a bare key beside qualified distractors, or the reverse.

| Exam | Single-answer | Key longest | Strongly biased | Key at A | Stem-word | Absolute words only on wrong choices | All/none of the above | Only complete key | Near-duplicate choices | Self-disqualifying distractor | Choices not parallel |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| saa-c03 | 344 | 43 (12.5%) | 0 (0.0%) | 112 | 61 | 77 | 0 | 5 | 0 | 0 | 0 |
| clf-c02 | 373 | 162 (43.4%) | 146 (39.1%) | 192 | 74 | 117 | 0 | 8 | 1 | 25 | 25 |
| comptia | 230 | 146 (63.5%) | 134 (58.3%) | 55 | 78 | 56 | 0 | 15 | 1 | 10 | 33 |
| 220-1201 | 39 | 35 (89.7%) | 35 (89.7%) | 9 | 16 | 14 | 0 | 4 | 0 | 3 | 2 |
| 220-1202 | 171 | 101 (59.1%) | 96 (56.1%) | 41 | 55 | 37 | 0 | 11 | 1 | 4 | 29 |
| n10-009 | 21 | 10 (47.6%) | 3 (14.3%) | 5 | 7 | 6 | 0 | 0 | 0 | 3 | 2 |

The full per-item CSV is written to ignored `tmp/answer-cue-audit.csv` when the audit runs. Authored key position is reported here and does not affect display: quiz, timed test, twin, topic, mini-mock, mistake-log retest, drills, choice games, subnet concept and reason, and the optional IPv6 review shuffle choices when the sitting is shown.

## SAA cue counts

These five checks are enforced for saa-c03 and stay warn-only for every other exam. True conditional distractor must be 0. Category word only the key matches must be 0. Odd-one-out opening must be 0. Keyword echo must stay at or under 34 (ratchet down later, never up). Key-is-shortest must stay inside 15.0%–35.0%. Keyword echo is an AWS-specific or technical question term in the key and in no distractor. Generic nouns (location, customer, average, storage, data, application, user, cost) do not count, nor do stopwords or a term that appears in every choice. A true-conditional pattern is a wrong choice that starts with the key and adds when, if, after, unless, only, or while. That pattern still needs a human truth check. A category word only the key matches is a named category such as queue, file system, certificate, load balancer, placement group, or purchase option when no distractor belongs to it. Odd-one-out opening means every distractor shares its first three words and the key does not. Key-is-shortest uses the same strict comparison as key-is-longest.

Key-is-longest: 43 (12.5%). Key-is-shortest: 71 (20.6%). Shortest target band: 15.0%–35.0%.

### Keyword echo

Count: 34.

- q-saa-core-15: subnet
- q-saa-core-20: global
- q-saa-core-32: database
- q-saa-core-37: latency
- q-saa-arch-13: restore
- q-saa-arch-24: global
- q-saa-arch-28: throughput
- q-saa-arch-39: snapshots
- q-aws-review-saa-c03-1-3: compliance
- q-aws-review-saa-c03-3-4: global

### True conditional distractor

Count: 0.


### Category word only the key matches

Count: 0.


### Odd-one-out opening

Count: 0.


### Key is shortest

Count: 71 (20.6% of 344).

- q-aws-found-02: key length 31
- q-aws-found-03: key length 13
- q-aws-found-05: key length 48
- q-aws-found-06: key length 16
- q-aws-found-07: key length 8

