# Network+ Study Optimization Plan

Purpose: keep the Network+ N10-009 study-site roadmap visible while active studying, Codex prompts, telemetry work, and focused remediation PRs continue.

## Current principle

Do not optimize for raw content count or broad "coverage" alone. Optimize for the highest expected exam return per study hour.

The site should evolve from a large study library into a personal Network+ coach that can answer:

- What should I study next?
- Which objective is weakest right now?
- Which misses are misconceptions versus guesses?
- Did remediation improve my retry performance?
- Which concepts need contrast drills?
- Which high-weight domains need more PBQ/troubleshooting practice?
- Am I ready to perform cold in exam mode?

## Immediate execution order

1. **PR #196 — study-session telemetry**
   - Capture meaningful Network+ study actions.
   - Reuse existing Twilio learner-sync architecture.
   - Keep localStorage as the learner-state source.
   - Add server-side structured logging for short-term Vercel analysis.
   - Do not add a new database, accounts, dashboards, or unrelated analytics.

2. **Run a real production study session**
   - Use the deployed Network+ site normally.
   - Answer naturally.
   - Open inline remediation when useful.
   - Use similar-question retries.
   - Do not game the telemetry.

3. **Build a real readiness model**
   Replace broad objective "coverage" with a learner-readiness score using signals such as:
   - recent question accuracy
   - repeated misses
   - confidence / guess state when available
   - explanation quality
   - scenario/PBQ practice
   - remediation-to-retry improvement
   - objective/domain exam weight

   Example:

   ```text
   5.3 Network troubleshooting tools
   Readiness: 52%
   Recent accuracy: 6/14
   Repeat misses: 4
   Remediation improvement: +18%
   Priority: VERY HIGH
   ```

4. **Add "What should I study now?"**
   Generate one recommended study block from current learner evidence rather than requiring manual chapter browsing.

   Example:

   ```text
   Recommended next 25 minutes

   1. IPv4 / IPv6 addressing contrast — 7 min
   2. DHCP + APIPA scenarios — 6 min
   3. 8-question targeted quiz — 8 min
   4. Retry 3 recent misses — 4 min
   ```

5. **Build contrast drills for repeated confusions**
   Prioritize concepts where related technologies are commonly confused.

   Initial examples:
   - APIPA vs RFC1918
   - NTP vs PTP
   - DNS vs DHCP vs IPAM/DDI
   - jitter vs latency vs packet loss
   - switch vs router behavior
   - broadcast vs multicast vs unicast
   - IPv4 vs IPv6
   - RA Guard vs DHCP snooping
   - IDS vs IPS
   - port security vs 802.1X
   - STP vs link aggregation
   - NAT vs PAT
   - SNMP vs syslog vs flow data

   Design rule: use near-identical scenarios where one clue changes and therefore changes the correct answer.

6. **Increase true troubleshooting / PBQ-style practice**
   Focus especially on high-value scenario skills:
   - read `ipconfig` / `ip addr`
   - identify gateway/DNS/subnet problems
   - choose the next troubleshooting command
   - interpret `ping`, `tracert` / `traceroute`, `nslookup`, ARP, and routing-table output
   - diagnose VLAN/trunk symptoms
   - identify DHCP DORA failure stages
   - choose cable/fiber troubleshooting tools
   - diagnose Wi-Fi interference/channel issues
   - distinguish latency, jitter, packet loss, bandwidth, and congestion

   These should feel like solving incidents, not recalling definitions.

7. **Expand high-quality miss explanations**
   For important misses, aim for a five-part explanation:

   - why the correct answer wins
   - why the selected distractor is tempting
   - why that distractor is wrong in this scenario
   - the exam clue to notice
   - one short memory rule

   Do not rewrite the entire bank blindly. Prioritize weak explanations exposed by learner data and high-weight objectives.

8. **Add "miss until mastered" behavior**
   A missed concept should return after several intervening questions.

   Example:

   ```text
   miss
   → inline remediation
   → 3–5 other questions
   → concept retry
   → correct: schedule later
   → wrong again: escalate remediation
   ```

9. **Separate Study Mode from Exam Mode**

   ### Study Mode
   - immediate explanations
   - inline remediation
   - visuals / flashcards / notes / video when strongly relevant
   - retry loops
   - weak-area targeting

   ### Exam Mode
   - no explanations until completion
   - timed
   - weighted domain distribution
   - scenario-heavy
   - confidence marker
   - review flagged questions
   - final domain/objective breakdown

10. **Add confidence tracking**
    Before answer submission, allow:
    - Sure
    - 50/50
    - Guessing

    Interpret results:

    ```text
    correct + sure      = strong
    correct + guessing  = fragile
    wrong + unsure      = knowledge gap
    wrong + sure        = likely misconception
    ```

11. **Turn the Network+ landing page into a study command center**
    Keep the content library, but put actionable learner guidance first.

    Example:

    ```text
    NETWORK+ N10-009

    Exam readiness: 68%
    Questions answered: 184
    Recent accuracy: 72%

    TODAY'S PRIORITY
    5.3 Troubleshooting
    1.4 Network services
    1.7 IPv4 / IPv6

    [Start recommended study]
    [Take exam simulation]
    [Review recent misses]
    ```

12. **Re-audit at leaf-objective level**
    Broad topic membership is not enough to prove readiness.

    Reconstruct/maintain a leaf-skill inventory and evaluate whether each skill is:
    - taught
    - practiced
    - practiced as a scenario
    - supported by a verified explanation
    - demonstrated by the learner

## Priority rule

When deciding what to build next, use this order:

1. actual repeated learner misses
2. high exam-weight domains
3. scenario/PBQ value
4. weak or misleading explanations
5. missing teaching
6. convenience/UI improvements

Do not add features simply because they are easy to build.

## Current high-value domains

Keep Network+ domain weights visible when prioritizing:

- Networking Concepts — 23%
- Network Implementation — 20%
- Network Operations — 19%
- Network Security — 14%
- Network Troubleshooting — 24%

Networking Concepts + Network Troubleshooting represent 47% of the exam weighting and deserve disproportionate attention when learner evidence also shows weakness there.

## Known learner-pattern signal to preserve

Recent observed misses have often involved choosing a related technology that solves a different problem. Examples have included:

- DHCP / APIPA
- NTP / PTP
- Kerberos clock skew
- DDI / IPAM
- RA Guard
- EUI-64 U/L-bit flip
- unicast / broadcast
- private IPv4 / link-local
- IPv4 / IPv6 format differences

This is why contrast drills and scenario clues are a major roadmap item.

## Guardrails

- One focused feature per PR.
- Do not change objective mappings unless actual teaching evidence changes.
- Do not confuse broad coverage with readiness.
- Do not add another database if existing Twilio learner infrastructure can support the need.
- Keep telemetry non-sensitive and bounded.
- Do not let telemetry failure block studying.
- Prefer deterministic remediation selection.
- Avoid unrelated A+, AWS, Vercel, or infrastructure changes inside Network+ study PRs.
- Validate locally before merging.
- Use production learner evidence to determine the next content/remediation PR whenever possible.

## Working loop

```text
Study on production
→ collect telemetry
→ analyze misses / confidence / remediation effectiveness
→ rank next objective by expected exam return
→ make one focused PR
→ validate
→ deploy
→ study again
```

## Roadmap status

- [x] Inline question remediation — PR #195
- [ ] Study-session telemetry — PR #196 in progress
- [ ] Real learner-session analysis
- [ ] Readiness score
- [ ] "What should I study now?" engine
- [ ] Contrast drills from top repeated misses
- [ ] Expanded troubleshooting/PBQ practice
- [ ] Weak-explanation remediation
- [ ] Miss-until-mastered queue
- [ ] Separate exam simulation mode
- [ ] Confidence tracking
- [ ] Network+ command-center landing page
- [ ] Leaf-objective readiness audit

## Decision checkpoint

After PR #196 is deployed, do **not** automatically start the next roadmap item.

First:
1. complete a real Network+ study session,
2. inspect telemetry,
3. identify the highest-return learner weakness,
4. choose the next focused PR from this roadmap based on that evidence.
