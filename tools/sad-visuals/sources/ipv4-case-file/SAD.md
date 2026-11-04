# Case File 1.7: The Address Space That Ran Out of Room

Reconstruction for N10-009 objective 1.7, "Given a scenario, use appropriate IPv4 network addressing." The company, hosts and counts are invented. The history and the RFC numbers are real.

## 1. The Post-Mortem Case Study (The Smoking Gun)

### 1.1 The page
- 02:47, Saturday. Meridian Freight (invented) opens a new branch.
- The site-to-site VPN reports "tunnel up". Green light. Nothing else works.
- Branch staff cannot open files from the headquarters file server at `192.168.1.20`.

### 1.2 What the engineer sees on the ground
- `ping 192.168.1.20` from the branch **replies**. Fast. 1 ms. Too fast for a WAN.
- The SMB connection is refused.
- The branch's own label printer is at `192.168.1.20`.
- The routing table on the branch router shows `192.168.1.0/24` as directly connected. The route learned over the VPN for the same prefix is ignored.
- Same prefix on both sides of the tunnel. The branch is talking to itself and calling it headquarters.
- Side wound: the guest Wi-Fi VLAN shows clients with `169.254.x.x`. The DHCP scope has bled dry.

### 1.3 The evidence summary

| Exhibit | Reading | What it means |
|---|---|---|
| Ping latency 1 ms | Answer came from the local LAN | Traffic never entered the tunnel |
| `192.168.1.0/24` connected on both routers | Overlapping prefixes | A router sends the packet out the connected interface, not the VPN |
| Client address `169.254.x.x` | APIPA | The client asked for DHCP and nobody answered |
| Guest scope 100% used | Pool exhausted | No free lease to hand out |

> **Cause of death:** two networks were given the same private prefix, and one pool was cut too small. Both are address-planning failures. The cables were never the problem.

## 2. Excavating the Strata (The Historical Context)

### 2.1 The naive first design
- IPv4 uses a 32-bit address. That is about 4.3 billion addresses.
- RFC 791 (1981) split that space by the first bits into classes. The class fixed the mask. Nobody chose a size.
- Class A: 1 through 126, a /8, about 16.7 million hosts.
- Class B: 128 through 191, a /16, 65,534 hosts.
- Class C: 192 through 223, a /24, 254 hosts.
- Class D is multicast. Class E is experimental. 127 is loopback.
- It worked while the Internet was a few hundred networks.

### 2.2 The pressure that broke it
- An organization with 400 hosts did not fit in a Class C (254). It asked for a Class B (65,534) and wasted more than 65,000 addresses.
- Class B space drained fast. Meanwhile every network handed out became another entry in the Internet's routing tables, and those tables grew faster than routers could carry them.
- Two pressures at once: running out of addresses, and running out of router memory.

### 2.3 The strata, oldest to newest

| Layer | Year | Patch | What the patch fixed | What broke next |
|---|---|---|---|---|
| Classful addressing (RFC 791) | 1981 | None, the original | Simple | Waste: Class B for 400 hosts |
| Subnetting (RFC 950) | 1985 | Split one network into pieces with a mask | Internal organization | One fixed mask per network wasted space inside |
| CIDR and VLSM (RFC 1519, later RFC 4632) | 1993 | Prefix of any length, blocks of any size, routes that aggregate | Waste and routing-table growth | The pool was still finite |
| Private ranges and NAT (RFC 1918 in 1996; NAT in RFC 1631, later RFC 3022) | 1994 to 1996 | Reuse private space inside, share a public address outside | Delayed exhaustion by years | End-to-end addressing |
| Pool exhausted, IPv6 | 2011 | The central pool of free IPv4 blocks ran out in February 2011 | Address count | Dual-stack complexity |

<!--diagram:strata-->

## 3. The Structural Scar Tissue (The Concept Revealed)

### 3.1 CIDR and VLSM: give every segment the block it needs
- A prefix like `/23` says 23 bits are network and 9 bits are host.
- Usable hosts in a block: **2 to the power of the host bits, minus 2**. The two removed are the network address and the broadcast address.
- Blocks must start on a multiple of their own size. That is what makes them aggregate.
- Allocate the **largest block first**. Small blocks packed in afterward stay aligned.
- A WAN link between two routers needs 2 hosts. A `/30` gives exactly 2. A `/24` there wastes 252.
- Beyond the notes: RFC 3021 allows a `/31` on point-to-point links.

| Segment | Hosts needed | Smallest block (hosts + 2 must fit) | Prefix |
|---|---|---|---|
| Warehouse | 400 | 512 | `/23` |
| Office | 90 | 128 | `/25` |
| Guest Wi-Fi | 28 | 32 | `/27` |
| Phones | 12 | 16 | `/28` |
| WAN link A | 2 | 4 | `/30` |
| WAN link B | 2 | 4 | `/30` |

Stress it yourself. Change the host counts and compare the three methods.

<!--diagram:allocation-->

### 3.2 Private ranges and NAT: share what you cannot grow
- RFC 1918 reserves three ranges that are never routed on the Internet: `10.0.0.0/8`, `172.16.0.0/12` and `192.168.0.0/16`.
- Every company can reuse them. That is the trick, and also the trap in section 1.
- Static NAT: fixed one-to-one mapping. Dynamic NAT: addresses taken from a pool as needed.
- **PAT** (NAT overload): many inside hosts share one public address. The device tells conversations apart by port number.
- It keeps a translation table. One row per active conversation.
- A packet from outside with no matching row has nowhere to go. It is dropped.

Starve it. Push the connection count until the table chokes.

<!--diagram:nat-->

### 3.3 APIPA: the fallback that tells on you
- A client that cannot reach DHCP picks `169.254.x.x` with mask `255.255.0.0` (APIPA, RFC 3927).
- It can talk to other APIPA hosts on the same segment. It cannot leave.
- It is a symptom, not an address to keep.

## 4. The Forensic Tradeoff (The Collateral Damage)

### 4.1 Who paid for the patches
- **CIDR and VLSM:** planning discipline. Allocate wrong or out of order and you get gaps that cannot be reclaimed. Subnet math is the scar tissue, and that is why it feels arbitrary.
- **Private ranges:** overlap. Two companies that merge, or a branch and a headquarters, collide on `192.168.1.0/24`. The case in section 1.
- **NAT and PAT:**
  - Inbound connections need a forwarding rule. Without one, the packet dies.
  - Logs at the far end show the shared address, not the real host.
  - Some protocols embed addresses inside the payload and need extra help.
  - A device that stacks a second NAT behind the first needs forwarding on both.
  - The table has a ceiling.
- **APIPA:** a silent half-working state that looks like connectivity.

### 4.2 Vital signs of a healthy addressing plan

| Cue on a live system | Healthy | Failing | Check |
|---|---|---|---|
| Client address | In the scope's range | `169.254.x.x` | `ipconfig /all`, `ip addr`; is DHCP reachable? |
| DHCP scope usage | Well under 100% | Near 100%, many short-lived guests | Scope statistics; lease time |
| Duplicate address warning | None | OS reports a conflict | `arp -a`; find the second MAC |
| Remote ping answers in 1 ms | Never for a WAN target | Reply is too fast | Overlapping prefix, check the route table |
| Mask on a client | Matches the gateway's | Local works, remote fails | Mask and gateway in `ipconfig /all` |
| Routing table | One owner per prefix | The same prefix connected on two sides | `route print`, `ip route` |
| NAT translation count | Far below the table limit | Climbing, new connections time out | Vendor `show` command for translations |
| Inbound service reachable | Forwarding rule present | Works inside, dead from outside | Port forward on every NAT in the path |

### 4.3 Closing the file
- Plan allocation on paper first, largest block first, with room to grow.
- Keep a register of which site owns which private prefix, before the first VPN.
- Treat every `169.254.x.x` as an outage report.
- Treat NAT as a deliberate compromise: it bought time and it took end-to-end addressing in payment.
