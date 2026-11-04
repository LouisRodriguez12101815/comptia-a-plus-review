# Harbor Street Office LAN: System Architecture Document

## 1. Executive Summary & System Context

### 1.1 Purpose and source material
- Illustrative system. Built to teach Network+ N10-009 objective 5.3, "Given a scenario, troubleshoot common issues with network services".
- Objective 5 (network troubleshooting) carries the highest domain weight on the exam: 24 percent.
- Hardest idea inside it: **a switching loop never dies, because Ethernet frames carry no hop count. Spanning Tree Protocol (STP) prevents the loop by blocking a redundant link, and it pays for that with a slow recovery.**
- Not a production design. Numbers marked "assumed" are teaching values.

| Input | Value (assumed) |
|---|---|
| Core problem solved | Two-floor office LAN that survives one cable or switch uplink failure without a broadcast storm |
| Technical stack | Three Layer 2 switches in a triangle, three VLANs, one router and firewall, DHCP and DNS server, SNMP monitoring |
| Known constraints | One link may fail with no manual action; recovery within 60 seconds; no loops, ever; no budget for a fourth switch |
| Key integrations | Router and firewall uplink, DHCP and DNS server, syslog and SNMP collector, console access for the engineer |

### 1.2 System boundary
- Begins at the access ports where hosts plug in.
- Ends at the router's LAN-facing port.
- Inside: three switches, their trunk links, VLANs, MAC address tables, STP.
- Outside: the router and firewall, the internet, the DHCP and DNS server's own configuration.

### 1.3 External dependencies

| System or actor | Type | Direction | Protocol | Data | If it fails |
|---|---|---|---|---|---|
| Floor 1 and Floor 2 hosts | Client systems | In | Ethernet | Frames, ARP and DHCP broadcasts | Local users offline |
| Router and firewall | External system | Out | Ethernet trunk | Routed traffic | No internet; local LAN still works |
| DHCP and DNS server | External system | Out | DHCP, DNS | Leases, names | New hosts get no address |
| Monitoring collector | External system | Out | SNMP, syslog | Counters, traps | Blind, but service continues |
| Network engineer | Human | In | SSH or console | `show` commands | Self-healing still works |

<!--diagram:context-->

### 1.4 Quality goals
- **No loops:** a frame must never circle the topology.
- **Availability:** one link failure causes a short outage, never a storm.
- **Predictability:** the root bridge is chosen on purpose, not by luck.
- **Diagnosability:** a tired engineer can find the fault from counters and `show` output.

### 1.5 Constraints and their consequences

| Constraint | Consequence for the design |
|---|---|
| Redundant uplinks wanted | A physical loop exists, so STP is mandatory |
| Ethernet has no hop count | Nothing else stops a looping frame |
| Recovery within 60 seconds | Classic STP (about 30 to 50 seconds) just fits; Rapid STP is better |
| Small budget | Triangle of existing switches; no routed access layer |

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
| Access switch SW2 | Hosts on Floor 1, uplinks to SW1 and SW3 | Managed Layer 2 switch | Add ports |
| Access switch SW3 | Hosts on Floor 2, uplinks to SW1 and SW2 | Managed Layer 2 switch | Add ports |
| Root switch SW1 | Spanning tree root, router uplink | Managed Layer 2 or 3 switch | Replace |
| VLANs 10, 20, 99 | Users, voice, management | 802.1Q tags on trunks | Add VLANs |
| Spanning tree process | Elect root, assign port roles, block redundant links | STP on every switch | Per VLAN or per instance |

<!--diagram:containers-->

### 2.2 Components inside one switch
- **MAC learning:** records which port each source address was seen on.
- **Forwarding decision:** known destination goes out one port; unknown or broadcast floods out every other port.
- **Port state gate:** only a port in the forwarding state may send or receive user frames.
- **STP engine:** reads BPDUs from neighbors and sets port roles and states.
- **Counters:** CRC, runts, giants, drops, MAC moves.

### 2.3 Interfaces and contracts

| From to | Style | Protocol | Contract |
|---|---|---|---|
| Host to switch | Frame | Ethernet | Broadcast reaches every port in the VLAN |
| Switch to switch | Trunk | 802.1Q | Carries tagged frames for all VLANs |
| Switch to switch | Control | BPDU, multicast `01-80-C2-00-00-00` | Root sends a hello every 2 seconds (802.1D default) |
| Switch to engineer | Management | SSH, SNMP, syslog | `show spanning-tree`, `show mac address-table`, interface counters |

### 2.4 Cross-cutting concerns
- **Loop control:** STP on every switch, never disabled.
- **Root placement:** explicit priority on SW1; a lower-capacity access switch must never win the election.
- **Logging:** topology change events sent to syslog.
- **Time:** NTP on every switch so log lines line up.
- **Change control:** every cable move and STP change goes through the change process.

## 3. Runtime & Process View

### 3.1 Critical flow: one ARP broadcast
1. Host A on SW2 sends an ARP request to the broadcast address.
2. SW2 learns Host A on its access port.
3. SW2 floods the frame out every other forwarding port: toward SW1 and toward SW3.
4. SW1 receives its copy, learns Host A, and floods it toward SW3.
5. SW3 receives a copy from SW1, learns Host A, delivers it to Host B, and floods onward.
6. With STP on, SW3's port toward SW2 is blocked. It discards the copy from SW2 and never sends one back. The frame ends.
7. With STP off, SW3 floods the copy back to SW2 and SW1. Each switch receives it again and floods it again. The frame never ends.

> **Rule:** a broadcast frame lives until a port refuses it. Only a blocked port, a cut cable or a power-off refuses it.

<!--diagram:sequence-->

### 3.2 Why a loop becomes a storm
- Ethernet has no time to live. Layer 3 packets do; Layer 2 frames do not.
- A single broadcast in a triangle leaves two copies circling in opposite directions forever.
- Hosts keep sending ARP, DHCP and other broadcasts, so each new broadcast adds two more permanent copies.
- Switches learn the same source address on two ports in turn. The MAC table flaps.
- Links fill, the switch CPU saturates, and normal traffic cannot get through.
- Extra redundant links make copies multiply, so a meshed loop collapses faster than a triangle.

<!--diagram:simulator-->

### 3.3 Failure flows
- **A. Access cable unplugged:** one host offline; STP unaffected.
- **B. Link SW1 to SW3 fails (direct failure):**
  1. SW3 loses its root port.
  2. SW3's blocked port toward SW2 becomes the new root port candidate.
  3. It moves blocking, listening (15 seconds), learning (15 seconds), forwarding.
  4. Hosts behind SW3 are offline for about 30 seconds.
  5. SW3 and SW1 flush their MAC tables on the topology change notice and relearn.
- **C. Indirect failure (a switch in the path dies silently):** neighbors wait for the max age timer, 20 seconds, before reacting. Add the 30 second state walk: roughly 50 seconds.
- **D. Someone plugs in a cheap switch with a low priority:** it can win the root election and reshape every path. This is the "bad root bridge" fault.

### 3.4 Consistency, concurrency, performance
- Port state changes are local decisions made from BPDUs; every switch converges on the same tree.
- Only the forwarding state passes user traffic. Learning builds the MAC table without forwarding.
- Compare counters to a baseline. A MAC address moving between ports many times a second means a loop.
- Mismatched duplex and CRC errors slow a link without creating a storm. Do not confuse them.

## 4. Deployment View

### 4.1 Topology

| Node | Location | Count | Role |
|---|---|---|---|
| SW1 | Wiring closet, Floor 1 | 1 | Root bridge, router uplink |
| SW2 | Floor 1 | 1 | Access, hosts and phones |
| SW3 | Floor 2 | 1 | Access, hosts and phones |
| Router and firewall | Closet | 1 | Gateway |
| Trunk links | Between switches | 3 | SW1-SW2, SW1-SW3, SW2-SW3 |

<!--diagram:deployment-->

### 4.2 Environments

| Environment | Topology | Loop protection | Purpose |
|---|---|---|---|
| Lab | Three spare switches | STP on | Rehearse a link cut |
| Production | Triangle above | STP on, root fixed on SW1 | Live traffic |

### 4.3 Scaling boundaries
- Each added switch adds a loop risk; STP handles it but convergence time grows with tree depth.
- Beyond about two closets, route between them (Layer 3) so each broken link stays small.
- One broadcast domain per VLAN: too many hosts in a VLAN means too much broadcast traffic.

### 4.4 Network isolation
- VLAN 10 users, VLAN 20 voice, VLAN 99 management.
- Management VLAN reachable only from the engineer's jump host.
- Unused ports shut down and placed in an unused VLAN.

### 4.5 High availability and failover

| Failover step (direct link failure) | Classic 802.1D timer |
|---|---|
| Link down detected | Immediate |
| Blocked port to listening | 15 seconds (forward delay) |
| Listening to learning | 15 seconds (forward delay) |
| Learning to forwarding | Total about 30 seconds |
| **Indirect failure adds max age** | **20 seconds, about 50 seconds total** |

- Timers are 802.1D defaults. Rapid STP converges much faster.
- Failback: restoring the cut link triggers another topology change. Schedule it.
- Prove it with a lab cut, a documented rollback and a monitored production test.

## 5. Architecture Decision Records & Tradeoffs

#### ADR-001: Redundant triangle protected by STP
- **Status:** Accepted.
- **Context:** One uplink failure must not take a floor offline.
- **Option A, no redundancy:** no loop possible; any link failure is an outage.
- **Option B, redundant links with no loop control:** fast recovery on paper; a storm in practice.
- **Option C, redundant links plus STP:** one path active, one held in reserve.
- **Decision:** Option C.
- **Consequences (+):** survives one link failure; no loop.
- **Consequences (−):** the reserve link carries no traffic; recovery is not instant.

#### ADR-002: Fix the root bridge on SW1
- **Status:** Accepted.
- **Context:** The default election picks the lowest bridge ID, which comes down to the lowest MAC address when priorities tie.
- **Option A, accept the default:** zero effort; an old access switch may win and send traffic the long way.
- **Option B, set a low priority on SW1:** predictable paths.
- **Option C, set SW1 and a named backup root:** predictable even after SW1 dies.
- **Decision:** Option C.
- **Consequences (+):** paths are known and documented.
- **Consequences (−):** priority settings must be kept in the configuration baseline.

#### ADR-003: Protect access ports
- **Status:** Accepted. Beyond the site's current notes; verify against the objectives before relying on it for the exam.
- **Context:** Users plug in hubs, cheap switches and loops of patch cable.
- **Option A, trust users:** simple; one patch cable can start a storm.
- **Option B, port security and storm control only:** limits damage.
- **Option C, edge-port settings plus BPDU protection:** access ports that hear a BPDU shut themselves down.
- **Decision:** Option C.
- **Consequences (+):** a rogue switch cannot join the tree.
- **Consequences (−):** a legitimate switch plugged into a user port will be shut down.

#### ADR-004: Alert on topology changes
- **Status:** Accepted.
- **Context:** A flapping link causes repeated STP recalculation and repeated outages.
- **Option A, none:** nobody notices until users complain.
- **Option B, syslog and SNMP traps for topology change and MAC moves:** early warning.
- **Decision:** Option B.
- **Consequences (+):** loops and flaps show up in minutes.
- **Consequences (−):** alert tuning needed to avoid noise.

#### ADR-005: Rapid STP in production
- **Status:** Accepted.
- **Context:** Classic STP needs 30 to 50 seconds. The goal is under 60, with margin.
- **Option A, classic STP:** matches the four exam states exactly; slow.
- **Option B, Rapid STP (802.1w):** converges in seconds; uses different port states (discarding, learning, forwarding).
- **Decision:** Option B in production. The simulator shows classic timers because the exam teaches the four classic states.
- **Consequences (+):** shorter outages.
- **Consequences (−):** teaching material and production differ; engineers must know both.
