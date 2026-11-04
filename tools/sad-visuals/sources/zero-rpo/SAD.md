# Ledgerline Payment Ledger: System Architecture Document

## 1. Executive Summary & System Context

### 1.1 Purpose and source material
- Illustrative system. Built to teach Network+ N10-009 objective 3.3, "Explain disaster-recovery concepts".
- Hardest idea in that objective: **a zero RPO forces synchronous replication, and synchronous replication costs latency and availability**.
- Not a production design. Numbers marked "assumed" are teaching values, not measurements.

| Input | Value (assumed) |
|---|---|
| Core problem solved | Payment ledger that never loses an acknowledged transaction when one site is lost |
| Technical stack | PostgreSQL, stateless API servers, DNS-based global traffic manager, 3-node consensus store, object storage for backups |
| Known constraints | RPO = 0 for acknowledged writes; RTO ≤ 15 min; inter-site RTT ≤ 5 ms; 2,000 TPS peak; encryption in transit and at rest |
| Key integrations | Card processor API, bank settlement files, OIDC identity provider, monitoring and paging |

### 1.2 System boundary
- Begins at TLS termination on the traffic manager.
- Ends at outbound calls to the card processor and the bank.
- Inside: API tier, ledger database and standbys, failover manager, outbox worker, backups, observability agents.
- Outside: merchant applications, identity provider, processor, bank, paging service.

### 1.3 External dependencies

| System or actor | Type | Direction | Protocol | Data | If it fails |
|---|---|---|---|---|---|
| Merchant application | Client system | In | HTTPS (TLS 1.2+), REST/JSON | Transfer requests | Merchant retries with same key |
| Operations engineer | Human | In | HTTPS console behind SSO | Runbooks, failover approvals | Failover still automatic |
| Identity provider | External system | Out | OIDC over HTTPS | Tokens, signing keys | New sign-ins fail; cached keys keep working until expiry |
| Card processor | External system | Out | HTTPS REST | Authorization calls | Outbox retries later |
| Bank settlement | External system | Out | SFTP batch files | Settlement files | Settlement delayed |
| Monitoring and paging | External system | Out | HTTPS push, webhook | Metrics, alerts | Blind, but service continues |

<!--diagram:context-->

### 1.4 Quality goals
- **Durability:** zero loss of acknowledged transactions after loss of one site.
- **Recovery:** service restored within 15 minutes (RTO).
- **Latency:** p99 write ≤ 50 ms (assumed).
- **Throughput:** 2,000 transactions per second at peak (assumed).

### 1.5 Constraints and their consequences

| Constraint | Consequence for the design |
|---|---|
| RPO = 0 | Commit waits for a second site (synchronous replication) |
| RTO ≤ 15 min | Hot standby and automated promotion |
| Inter-site RTT ≤ 5 ms | Sites close together, about 100 km of fiber |
| One site may be lost | Third site holds a tie-breaking vote |
| Encryption everywhere | TLS on every hop, encrypted disks and backups |

### 1.6 View map

| Document section | arc42 | Kruchten 4+1 | C4 |
|---|---|---|---|
| 1 | Sections 1 to 3 | Scenarios (the "+1") | Level 1, System Context |
| 2 | Section 5 | Logical view | Level 2 Containers, Level 3 Components |
| 3 | Section 6 | Process view | Dynamic diagram |
| 4 | Section 7 | Physical (deployment) view | Deployment diagram |
| 5 | Section 9 | Decisions across all views | Not applicable |

## 2. Logical & Building Block View

### 2.1 Containers

| Container | Responsibility | Technology (assumed) | Scales by |
|---|---|---|---|
| Traffic manager | Health-checked routing to the active site | DNS-based global load balancer | Managed service |
| API tier | Authenticate, validate, write ledger entries | Stateless service, N nodes per site | Add nodes |
| Ledger database (primary) | Single writer, durable ledger | PostgreSQL | Scale up |
| Synchronous standbys DR-A, DR-B | Second-site copy, ready to promote | PostgreSQL streaming replicas | Fixed pair |
| Failover manager and consensus store | Decide who is primary, prevent split brain | 3 nodes across 3 sites | Fixed |
| Outbox worker | Forward committed transfers to the processor | Background worker | Add workers |
| Backup store | Point-in-time recovery and ransomware defense | Object storage, versioned | Managed service |
| Observability agent | Metrics, logs, traces | Agent on every node | One per node |

<!--diagram:containers-->

### 2.2 Components inside the API tier
- **Auth middleware:** validates OIDC token.
- **Idempotency guard:** returns the stored result for a repeated key.
- **Ledger service:** writes balanced debit and credit rows in one transaction.
- **Outbox writer:** records the follow-up call in the same transaction.
- **Health endpoint:** reports "writes unavailable" when commits cannot reach a standby.

### 2.3 Interfaces and contracts

| From to | Style | Protocol | Contract |
|---|---|---|---|
| Merchant to API | Synchronous | HTTPS REST | `POST /v1/transfers` with required `Idempotency-Key`; 201 only after the commit is durable on two sites; 409 if key reused with a different body; 503 with `Retry-After` when writes are unavailable |
| API to primary | Synchronous | SQL over TLS | One transaction per transfer; `COMMIT` returns only after standby acknowledgment |
| Primary to standbys | Streaming | WAL replication over TLS | Commit waits for a flush acknowledgment from any 1 of 2 DR standbys |
| Outbox worker to processor | Asynchronous | HTTPS REST | At-least-once delivery; processor call carries the transfer id as its idempotency key |
| Failover manager to nodes | Heartbeat | TLS to consensus store | Leader lease with a 10 second time to live |

### 2.4 Cross-cutting concerns
- **Authentication and authorization:** OIDC tokens at the edge; mutual TLS between services.
- **Logging:** structured JSON; one trace id per request; no card numbers in logs.
- **Error handling:** bounded retries; exponential backoff with jitter; circuit breaker toward the processor.
- **Retries are safe:** every write carries an idempotency key.
- **Data formats:** money as integer minor units plus ISO 4217 currency; timestamps in UTC.
- **Time:** NTP on every node; alarm on clock skew.
- **Configuration:** identical immutable images at both sites.

## 3. Runtime & Process View

### 3.1 Critical flow: create a transfer
1. Merchant sends `POST /v1/transfers` with an `Idempotency-Key`.
2. Traffic manager routes to a healthy API node in the active site.
3. API validates the token and the body.
4. Idempotency guard checks for a prior result.
5. API opens a transaction and writes debit, credit, and outbox rows.
6. API issues `COMMIT`.
7. Primary flushes the log to its local disk.
8. Primary streams the log to the DR standbys.
9. One standby flushes to its disk and acknowledges.
10. Primary receives the first acknowledgment and completes the commit.
11. API returns 201.
12. Outbox worker forwards the transfer to the processor later.

> **Rule:** the merchant sees success only after step 10. That is what makes the acknowledgment a promise.

<!--diagram:sequence-->

### 3.2 Latency: why zero RPO is expensive
- Light in fiber covers about 5 µs per km one way.
- Commit latency ≈ local flush + round trip + remote flush.
- 80 km path: round trip ≥ 0.8 ms (a lower bound; real routes are longer).
- 1,000 km path: round trip ≥ 10 ms, so one session tops out near 100 commits per second.
- Concurrency recovers throughput. Latency per transaction stays.
- Asynchronous replication removes the round trip from the commit path.
- The price: RPO becomes the replication lag, never zero.

<!--diagram:simulator-->

### 3.3 Failure flows
- **A. One DR standby fails:** commits continue on the other one; alert raised; no RPO impact.
- **B. Both DR standbys unreachable:** primary stops completing commits, because RPO 0 cannot be met; API returns 503 with `Retry-After`. Switching to asynchronous mode needs human approval, because it ends the zero-RPO promise.
- **C. Primary site lost:**
  1. Leader lease expires after about 10 seconds.
  2. Site B and the witness reach quorum.
  3. Failover manager fences the old primary so it cannot accept writes.
  4. DR-A replays any remaining log and is promoted.
  5. DR-B follows the new primary.
  6. Traffic manager health checks fail Site A and route to Site B.
  7. API nodes reconnect.
  8. Merchants retry unacknowledged requests with the same key; duplicates are detected.

### 3.4 Consistency, concurrency, performance
- Single writer; no multi-master conflicts.
- Transfers use `SERIALIZABLE`; retry on SQLSTATE 40001.
- Lock rows in a fixed order to avoid deadlocks.
- Reporting reads may use a standby; lag of a few seconds is accepted.
- Backpressure: bounded connection pool; 503 when the commit queue grows.

## 4. Deployment View

### 4.1 Topology

| Node | Site | Count | Role |
|---|---|---|---|
| API server | A and B | 3 each | Serve traffic (active site only) |
| Ledger primary | A | 1 | Single writer |
| DR standby | B | 2 | Synchronous quorum members, promotion candidates |
| Consensus node | A, B, Witness | 1 each | Leader election |
| Traffic manager | Managed | 1 service | Route to active site |
| Backup bucket | Third location | 1 | Point-in-time recovery |

<!--diagram:deployment-->

### 4.2 Environments

| Environment | Topology | Replication | Purpose |
|---|---|---|---|
| Development | Single node | None | Feature work |
| Staging | Two sites, reduced size | Synchronous | Weekly failover test |
| Production | Two sites plus witness | Synchronous, quorum 1 of 2 | Live traffic |

### 4.3 Scaling boundaries
- API tier scales out by adding nodes.
- Database scales up; one primary is the write ceiling.
- Beyond the ceiling: partition the ledger by tenant (needs its own decision record).
- Synchronous commit wait grows with distance, not with CPU.

### 4.4 Network isolation and firewalls
- Four zones: public edge, application, data, management.
- Only the traffic manager faces the internet.
- Data zone accepts SQL only from the application zone.
- Replication allowed only between data zones of Site A and Site B.
- Management access through a bastion with SSO and recorded sessions.
- Site-to-site links: two diverse fiber paths, encrypted.

### 4.5 High availability and failover
- Inside a site: dual power, dual top-of-rack switches, NIC teaming, anti-affinity.
- Across sites: Site B is a hot site (continuously replicated, minutes to switch).
- Witness site prevents split brain.
- Failback is planned and manual, after the old site is rebuilt and resynchronized.

| Failover step | Design budget (assumed, not measured) |
|---|---|
| Detect failure | 10 to 30 s |
| Reach quorum and fence old primary | 30 s |
| Promote standby | 60 s |
| Shift traffic | 60 to 120 s |
| Verify and reconcile | 5 min |
| **Total (must stay under RTO)** | **under 15 min** |

- Prove it with a tabletop exercise, a parallel test, then a full failover test.

## 5. Architecture Decision Records & Tradeoffs

#### ADR-001: Synchronous replication for ledger commits
- **Status:** Accepted.
- **Context:** Ledger acknowledgments are promises; RPO must be zero for a single-site loss.
- **Option A, asynchronous streaming:** fast commits, no dependence on the link; RPO equals replication lag, never zero.
- **Option B, nightly backup or log shipping:** cheapest; RPO measured in hours.
- **Option C, synchronous replication:** zero loss of acknowledged commits; commit waits one round trip.
- **Decision:** Option C.
- **Consequences (+):** acknowledgment means durable on two sites.
- **Consequences (−):** every commit pays the round trip; writes depend on the inter-site link.

#### ADR-002: Quorum commit with two DR standbys (any 1 of 2)
- **Status:** Accepted.
- **Context:** One synchronous standby is a single point of failure for writes.
- **Option A, one remote standby:** simple; if it fails, commits stall.
- **Option B, local standby only:** fast; does not survive loss of the site.
- **Option C, any 1 of 2 remote standbys:** survives one standby failure; costs a second remote server.
- **Decision:** Option C.
- **Consequences (+):** one standby can fail without stopping writes.
- **Consequences (−):** more hardware; if both fail, writes stop by design.

#### ADR-003: Metro distance between sites
- **Status:** Accepted.
- **Context:** Distance sets the round trip; the budget is 5 ms.
- **Option A, same campus:** lowest latency; one fire or flood takes both.
- **Option B, metro (about 100 km):** about 1 ms round trip; independent buildings and power.
- **Option C, continental (1,000 km or more):** survives a regional disaster; round trip ≥ 10 ms on every commit.
- **Decision:** Option B.
- **Consequences (+):** low commit latency with site independence.
- **Consequences (−):** a regional disaster can take both sites. Residual risk accepted. Mitigation: later add an asynchronous third copy far away, with RPO above zero for regional loss, and keep versioned off-site backups.

#### ADR-004: Three-site consensus for automatic failover
- **Status:** Accepted.
- **Context:** Fast RTO needs automation; two-site automation risks split brain.
- **Option A, manual failover:** safe; misses the 15-minute RTO at night.
- **Option B, two-site automatic:** fast; a link cut can produce two primaries.
- **Option C, three voters including a witness:** majority decides; needs a third location.
- **Decision:** Option C.
- **Consequences (+):** no split brain; automatic recovery.
- **Consequences (−):** third site to run; fencing must be tested.

#### ADR-005: Idempotency keys and an outbox
- **Status:** Accepted.
- **Context:** After failover, merchants cannot tell whether an unacknowledged request committed.
- **Option A, two-phase commit with the processor:** strong guarantees; couples availability to the processor.
- **Option B, fire and forget:** simple; loses or duplicates calls.
- **Option C, idempotency key plus transactional outbox:** retries are safe; delivery is at least once.
- **Decision:** Option C.
- **Consequences (+):** safe retries; processor outages do not block commits.
- **Consequences (−):** extra table and worker; processor must honor idempotency keys.
