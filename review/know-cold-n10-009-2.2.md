# Know cold — Network+ 2.2: switching
**Task: configure switching technologies and features.** Scenario troubleshooting also supports 5.3. This sheet covers the verified errata, not every listed feature. Sources are in the [single evidence ledger](n10-009-evidence-ledger.md).

## VLANs, ports and MAC learning [R4, R5]
- A switch learns the **source MAC** on the receiving port; it looks up the **destination MAC** to forward.
- Unknown-unicast flooding stays in that VLAN and excludes the ingress port, subject to forwarding state/configuration.
- Splitting one flat switched LAN into populated VLANs creates separate **broadcast domains**. Reassigning the same physical ports does **not** create additional collision domains. Full-duplex links do not experience Ethernet collisions.
- A trunk carries multiple VLANs. Inter-VLAN IP communication needs routing; a Layer 3 switch can use a switch virtual interface (SVI). A VLAN alone is not an access-control policy.

## Voice tagging is configuration-dependent [R6]
Cisco’s documented phone/access-port examples permit tagged traffic in a voice VLAN, priority-tagged traffic in the access VLAN, or untagged traffic. **CoS changes do not decide whether a tag exists.** Exact commands/support depend on switch/phone/version; these are not universal vendor-neutral defaults.

## Classic STP — identify the scenario [R7–R9]
STP = Spanning Tree Protocol; BPDU = Bridge Protocol Data Unit. Historical identifiers: classic STP **802.1D**, rapid STP **802.1w**. [S0, R7, R9]

| Default classic-STP case | Delay before forwarding |
|---|---|
| New designated host port, PortFast disabled | About **30 seconds**: listening 15 + learning 15 |
| Recovery that first waits for superior BPDU information to expire | About **50 seconds**: max age 20 + listening 15 + learning 15 |

**Not every topology change waits 50 seconds.** PortFast bypasses the normal listening/learning startup delays on suitable host-facing ports; it is not permission to disable loop prevention indiscriminately. [R7]

## Priority values are not queue numbers [R10]
CoS (class of service) uses **3 bits**, hence **eight values (0–7)**. That does not imply eight hardware queues or CoS N → queue N. Device capabilities and queue policies determine the mapping. This supports 1.2 QoS/2.2 tagging; it is not a new objective. [R10]

**Still to review:** native-VLAN handling, VLAN database, link aggregation, speed/duplex, MTU/jumbo-frame decisions and platform-specific security/ACL behavior. PoE is relevant to 5.2 hardware troubleshooting; its complete power table is deferred rather than guessed here. [S0]
