# Know cold — Network+ 2.1: routing and route selection
**Task: explain routing technologies.** Tonight’s priority: routing, AD and metrics. This is a bounded review, not complete objective coverage. References R1–R3 are in the [single evidence ledger](n10-009-evidence-ledger.md).

## Two decisions — do not mix them [R1]
- **Build the routing table:** a protocol first selects its candidate using its own algorithm/metric. For usable candidates from different sources to the **same network and prefix length**, Cisco prefers the lower administrative distance (AD).
- **Forward a packet:** among already installed matching routes, use the **longest prefix match** (LPM). AD and protocol metrics are not compared again per packet.
- Different-length prefixes can coexist. A matching /24 can forward instead of a /16 even when the /16 source has lower AD. This assumes both are installed and usable.
- Compare metrics within the relevant protocol, not a RIP hop count against an OSPF cost.

## Cisco defaults — vendor examples, not universal constants [R1]
| Route source | AD |
|---|---:|
| Connected | 0 |
| Static | 1 |
| External BGP (eBGP) | 20 |
| Internal EIGRP | 90 |
| OSPF | 110 |
| RIP | 120 |
| External EIGRP | 170 |
| Unknown/untrusted | 255: not installed |

**Read `[AD/metric]` correctly:** `[90/130816]` is not a prefix length or hop count. AD is local to the router, not advertised to neighbors. [R1]

## EIGRP and split horizon [R2, R3]
- EIGRP = **Enhanced Interior Gateway Routing Protocol**; RFC 7868 describes distance-vector technology. Some Cisco documentation also calls it **hybrid**. Do not infer a changed quiz key or privileged knowledge of exam terminology from that naming difference. [R2]
- Classic EIGRP defaults use **bandwidth and delay**: K1=K3=1; K2=K4=K5=0. Load/reliability are not active terms with those defaults. No formula memorization needed here. [R2]
- **Simple split horizon:** omit a learned route from updates sent back toward the interface/network it was learned through. Other update policies still apply. **Poisoned reverse** instead advertises the reverse route as unreachable; do not confuse the two. [R3]

## Quick self-check [R1]
“Static always wins” is false: first ask whether you are comparing candidates for one prefix or forwarding among installed prefixes. “AD then metric for every packet” is also false.

**Still to review:** NAT/PAT, FHRP/VIP, subinterfaces, complete protocol behavior and hands-on route output. These listed 2.1 topics are deferred, not claimed covered by this sheet. [S0]
