// Rapid-fire memory drills for A+ Core 1 (220-1201) facts.
// Each deck is a list of items with named fields. A mode asks for one field
// given another; answer choices are the other distinct values of that field.
// Fact text stays in English (like protocol names); UI text lives in messages/.
import { corePorts } from "@/lib/practice/ports";

export type DrillItem = {
  /** Explicit primary objective for cross-domain AWS decks. */
  objective?: string;
  id: string;
  fields: Record<string, string>;
  /** Shown after every answer about this item. */
  detail: string;
  hook: string;
  /** Hand-picked wrong answers per target field, used before random ones. */
  wrong?: Record<string, string[]>;
};

export type DrillMode = { id: string; from: string; to: string };
export type DrillTable = { id: string; fields: string[] };

export type DrillDeck = {
  id: string;
  /** Certification name shown in the Practice Games filter, e.g. "A+ Core 1". */
  certification: string;
  /** Exam code that must exist in content/objectives.json, e.g. "220-1201". */
  exam: string;
  /** Objective ids from that exam, e.g. "2.4, 2.6" or "3.1–3.8". */
  objective: string;
  /** Topic shown in the Practice Games filter. */
  topic: string;
  modes: DrillMode[];
  tables: DrillTable[];
  items: DrillItem[];
};

const ports: DrillDeck = {
  id: "ports",
  certification: "A+ Core 1",
  exam: "220-1201",
  objective: "2.1",
  topic: "Ports and protocols",
  modes: [
    { id: "portToProtocol", from: "port", to: "protocol" },
    { id: "protocolToPort", from: "protocol", to: "port" },
    { id: "purposeToProtocol", from: "purpose", to: "protocol" },
  ],
  tables: [{ id: "ports", fields: ["port", "protocol", "transport", "purpose"] }],
  items: corePorts.map((p) => ({
    id: p.id,
    fields: { port: p.port, protocol: p.protocol, transport: p.transport, purpose: p.purpose },
    detail: `${p.protocol} · ${p.port} · ${p.transport} — ${p.purpose}`,
    hook: p.hook,
  })),
};

const wifi: DrillDeck = {
  id: "wifi",
  certification: "A+ Core 1",
  exam: "220-1201",
  objective: "2.2",
  topic: "Wireless standards",
  modes: [
    { id: "standardToBand", from: "standard", to: "band" },
    { id: "standardToSpeed", from: "standard", to: "speed" },
    { id: "genToStandard", from: "generation", to: "standard" },
    { id: "facts", from: "question", to: "answer" },
  ],
  tables: [
    { id: "standards", fields: ["standard", "generation", "band", "speed"] },
    { id: "facts", fields: ["question", "answer"] },
  ],
  items: [
    { id: "a", fields: { standard: "802.11a", band: "5 GHz", speed: "54 Mbps" }, detail: "802.11a · 5 GHz · 54 Mbps", hook: "a came out alongside b but used 5 GHz: same 54 Mbps as g, different band." },
    { id: "b", fields: { standard: "802.11b", band: "2.4 GHz", speed: "11 Mbps" }, detail: "802.11b · 2.4 GHz · 11 Mbps", hook: "b is the slowest on the list: 11 Mbps at 2.4 GHz." },
    { id: "g", fields: { standard: "802.11g", band: "2.4 GHz", speed: "54 Mbps" }, detail: "802.11g · 2.4 GHz · 54 Mbps", hook: "g gave 2.4 GHz the 54 Mbps that a had at 5 GHz, and stayed compatible with b." },
    { id: "n", fields: { standard: "802.11n", generation: "Wi-Fi 4", band: "2.4 and 5 GHz", speed: "600 Mbps" }, detail: "802.11n (Wi-Fi 4) · 2.4 and 5 GHz · up to 600 Mbps · added MIMO", hook: "n is the first dual-band standard and introduced MIMO (multiple antennas)." },
    { id: "ac", fields: { standard: "802.11ac", generation: "Wi-Fi 5", band: "5 GHz", speed: "6.9 Gbps" }, detail: "802.11ac (Wi-Fi 5) · 5 GHz only · up to ~6.9 Gbps · MU-MIMO", hook: "ac is 5 GHz only. Think 'ac = 5 GHz access'." },
    { id: "ax", fields: { standard: "802.11ax", generation: "Wi-Fi 6", band: "2.4 and 5 GHz", speed: "9.6 Gbps" }, detail: "802.11ax (Wi-Fi 6) · 2.4 and 5 GHz · up to 9.6 Gbps · OFDMA", hook: "ax is Wi-Fi 6, built for crowded places with many devices." },
    { id: "ax6e", fields: { standard: "802.11ax (6E)", generation: "Wi-Fi 6E", band: "2.4, 5 and 6 GHz", speed: "9.6 Gbps" }, detail: "Wi-Fi 6E · 802.11ax extended into the 6 GHz band", hook: "The E means Extended: same ax standard, plus the new 6 GHz band." },
    { id: "channels", fields: { question: "Non-overlapping 2.4 GHz channels (US)", answer: "1, 6 and 11" }, detail: "Only channels 1, 6 and 11 avoid overlapping in 2.4 GHz.", hook: "Space access points on 1, 6 and 11 so neighbors don't interfere.", wrong: { answer: ["1, 5 and 9", "2, 7 and 12", "1, 4, 8 and 11"] } },
    { id: "range", fields: { question: "Band with the longest range but most interference", answer: "2.4 GHz" }, detail: "2.4 GHz travels farther and through walls better, but is crowded (microwaves, Bluetooth).", hook: "Lower frequency = longer reach, more noise.", wrong: { answer: ["5 GHz", "6 GHz", "60 GHz"] } },
    { id: "fast", fields: { question: "Band with the shortest range but least congestion", answer: "6 GHz" }, detail: "6 GHz (Wi-Fi 6E) has lots of clean channels but short range.", hook: "Higher frequency = faster and cleaner, but shorter reach.", wrong: { answer: ["2.4 GHz", "5 GHz", "900 MHz"] } },
    { id: "bonding", fields: { question: "Combining channels for more bandwidth", answer: "Channel bonding" }, detail: "Channel bonding joins adjacent channels (40/80/160 MHz wide) for more throughput.", hook: "Bond two lanes into one wider road.", wrong: { answer: ["Channel hopping", "Beamforming", "Band steering"] } },
    { id: "bt", fields: { question: "Short-range wireless PAN for headsets and keyboards", answer: "Bluetooth" }, detail: "Bluetooth: 2.4 GHz personal area network, pair with a PIN or code.", hook: "PAN = personal devices around you.", wrong: { answer: ["NFC", "RFID", "Zigbee"] } },
    { id: "nfc", fields: { question: "Tap-to-pay radio that works within a few centimeters", answer: "NFC" }, detail: "NFC (near-field communication) works at about 4 cm: payments, badges, pairing.", hook: "Near-field means you have to nearly touch.", wrong: { answer: ["Bluetooth", "RFID", "Infrared"] } },
    { id: "rfid", fields: { question: "Radio tags used for inventory and asset tracking", answer: "RFID" }, detail: "RFID tags are read by a scanner; passive tags need no battery.", hook: "Radio Frequency IDentification = radio barcodes.", wrong: { answer: ["NFC", "Bluetooth", "Wi-Fi Direct"] } },
    { id: "fixed", fields: { question: "Point-to-point wireless link between two buildings", answer: "Long-range fixed wireless" }, detail: "Directional antennas link sites miles apart; may need licensed spectrum and line of sight.", hook: "Two dishes aimed at each other.", wrong: { answer: ["Mesh Wi-Fi", "Wi-Fi Direct", "Cellular hotspot"] } },
  ],
};

const privateIps: DrillDeck = {
  id: "private-ip",
  certification: "A+ Core 1",
  exam: "220-1201",
  objective: "2.6",
  topic: "IP addressing",
  modes: [
    { id: "classify", from: "address", to: "kind" },
    { id: "rangeToCidr", from: "range", to: "cidr" },
    { id: "cidrToUse", from: "cidr", to: "use" },
  ],
  tables: [{ id: "ranges", fields: ["range", "cidr", "use"] }],
  items: [
    { id: "r10", fields: { range: "10.0.0.0 – 10.255.255.255", cidr: "10.0.0.0/8", use: "Private (Class A)" }, detail: "10.0.0.0/8 · the whole 10.x.x.x block is private.", hook: "Anything starting with 10 is private." },
    { id: "r172", fields: { range: "172.16.0.0 – 172.31.255.255", cidr: "172.16.0.0/12", use: "Private (Class B)" }, detail: "172.16.0.0/12 · only 172.16 through 172.31 is private.", hook: "172 is private only from 16 to 31. 172.15 and 172.32 are public." },
    { id: "r192", fields: { range: "192.168.0.0 – 192.168.255.255", cidr: "192.168.0.0/16", use: "Private (Class C)" }, detail: "192.168.0.0/16 · the home-router block.", hook: "192.168 is private; 192.169 is not." },
    { id: "r169", fields: { range: "169.254.0.0 – 169.254.255.255", cidr: "169.254.0.0/16", use: "APIPA (link-local)" }, detail: "169.254.x.x means the computer couldn't reach a DHCP server and gave itself an address.", hook: "See 169.254? Check DHCP." },
    { id: "r127", fields: { range: "127.0.0.0 – 127.255.255.255", cidr: "127.0.0.0/8", use: "Loopback" }, detail: "127.0.0.1 tests the computer's own TCP/IP stack.", hook: "127.0.0.1 is 'myself' (localhost)." },
    ...([
      ["10.200.4.9", "Private", "In 10.0.0.0/8."],
      ["172.20.1.1", "Private", "172.20 is between 172.16 and 172.31."],
      ["172.31.255.254", "Private", "172.31 is the last private /12 block."],
      ["172.32.0.5", "Public", "172.32 is just past the private range (16–31)."],
      ["172.15.8.1", "Public", "172.15 is just below the private range (16–31)."],
      ["192.168.100.50", "Private", "In 192.168.0.0/16."],
      ["192.169.1.1", "Public", "Only 192.168 is private; 192.169 is public."],
      ["169.254.10.3", "APIPA", "169.254.x.x = APIPA; DHCP failed."],
      ["127.0.0.1", "Loopback", "127.x.x.x is loopback."],
      ["8.8.8.8", "Public", "A public DNS server address."],
      ["11.0.0.1", "Public", "Only 10.x is private; 11.x is public."],
      ["100.64.0.1", "Public", "Not in an RFC 1918 private range (it's carrier-grade NAT space, not on the A+ list)."],
    ] as const).map(([address, kind, why], i) => ({
      id: `addr${i}`,
      fields: { address, kind },
      detail: `${address} → ${kind}. ${why}`,
      hook: "Private = 10.x, 172.16–31.x, 192.168.x. APIPA = 169.254.x. Loopback = 127.x.",
    })),
  ],
};

const appliances: DrillDeck = {
  id: "appliances",
  certification: "A+ Core 1",
  exam: "220-1201",
  objective: "2.3, 2.5",
  topic: "Network appliances and services",
  modes: [
    { id: "jobToName", from: "job", to: "name" },
    { id: "nameToJob", from: "name", to: "job" },
    { id: "placement", from: "server", to: "zone" },
  ],
  tables: [
    { id: "devices", fields: ["name", "job"] },
    { id: "placement", fields: ["server", "zone"] },
  ],
  items: [
    { id: "utm", fields: { name: "UTM", job: "One box doing firewall, antivirus, antispam, content filtering and IDS/IPS" }, detail: "Unified Threat Management combines many security functions in one appliance.", hook: "Many threats, one box = UTM." },
    { id: "fw", fields: { name: "Firewall", job: "Allows or blocks traffic based on rules (IP, port, protocol)" }, detail: "A firewall filters traffic with access rules.", hook: "Firewall = rules about what gets in and out." },
    { id: "proxy", fields: { name: "Proxy server", job: "Makes web requests for clients, caching pages and filtering content" }, detail: "A proxy sits between users and the web: caching, filtering, hiding client IPs.", hook: "A proxy goes to the web on your behalf." },
    { id: "spam", fields: { name: "Spam gateway", job: "Filters unwanted email before it reaches the mail server" }, detail: "Only handles email; a UTM can do this and much more.", hook: "Spam gateway = email only." },
    { id: "lb", fields: { name: "Load balancer", job: "Spreads incoming requests across several servers" }, detail: "Keeps any one server from being overloaded and adds redundancy.", hook: "Balance the load across a server farm." },
    { id: "ids", fields: { name: "IDS", job: "Detects suspicious traffic and alerts, but doesn't block it" }, detail: "Intrusion Detection System: watches and alerts.", hook: "IDS = Detect (alarm only)." },
    { id: "ips", fields: { name: "IPS", job: "Detects suspicious traffic and actively blocks it" }, detail: "Intrusion Prevention System: sits inline and stops attacks.", hook: "IPS = Prevent (alarm and block)." },
    { id: "aaa", fields: { name: "AAA server", job: "Authentication, authorization and accounting for network logins (RADIUS/TACACS+)" }, detail: "AAA: who are you, what can you do, and what did you do.", hook: "AAA = prove it, permit it, log it." },
    { id: "syslog", fields: { name: "Syslog server", job: "Collects log messages from many network devices in one place" }, detail: "Centralized logging for routers, switches and servers.", hook: "Sys-log = system logs collected centrally." },
    { id: "router", fields: { name: "Router", job: "Forwards packets between different networks using IP addresses" }, detail: "Layer 3 device that connects networks.", hook: "Routers route between networks." },
    { id: "switch", fields: { name: "Managed switch", job: "Connects devices on a LAN by MAC address and supports VLANs" }, detail: "Layer 2; managed switches add VLANs, port settings and monitoring.", hook: "Managed = configurable (VLANs)." },
    { id: "poe", fields: { name: "PoE injector", job: "Adds power to an Ethernet cable for a device when the switch can't" }, detail: "Powers APs, cameras and phones over the data cable.", hook: "Inject power into a non-PoE run." },
    { id: "patch", fields: { name: "Patch panel", job: "Termination point where wall cable runs connect in the network closet" }, detail: "Passive: no power, no logic. Punch down on the back, patch cables on the front.", hook: "Patch panel = organized cable endpoints." },
    { id: "ont", fields: { name: "ONT", job: "Converts a fiber-to-the-premises signal to Ethernet" }, detail: "Optical Network Terminal: the fiber 'modem'.", hook: "O for Optical." },
    { id: "sdn", fields: { name: "SDN", job: "Manages the network centrally in software, separating control from data forwarding" }, detail: "Software-Defined Networking.", hook: "The network's brain moves into software." },
    { id: "scada", fields: { name: "SCADA", job: "Monitors and controls industrial equipment like power grids and factories" }, detail: "Supervisory Control and Data Acquisition: an industrial control system, not a security appliance.", hook: "SCADA = factories and utilities." },
    ...([
      ["Public web server", "Screened subnet (DMZ)"],
      ["Public mail server", "Screened subnet (DMZ)"],
      ["Internal file server", "Internal network"],
      ["Database server", "Internal network"],
      ["Domain controller", "Internal network"],
      ["Print server", "Internal network"],
    ] as const).map(([server, zone], i) => ({
      id: `place${i}`,
      fields: { server, zone },
      detail: `${server} → ${zone}.`,
      hook: "Internet users need it? Screened subnet. Only staff need it? Internal network.",
    })),
  ],
};

const dhcp: DrillDeck = {
  id: "dhcp",
  certification: "A+ Core 1",
  exam: "220-1201",
  objective: "2.3, 2.4",
  topic: "DHCP",
  modes: [
    { id: "termToMeaning", from: "term", to: "meaning" },
    { id: "meaningToTerm", from: "meaning", to: "term" },
    { id: "dora", from: "step", to: "message" },
  ],
  tables: [
    { id: "terms", fields: ["term", "meaning"] },
    { id: "dora", fields: ["step", "message"] },
  ],
  items: [
    { id: "scope", fields: { term: "Scope", meaning: "The full set of DHCP settings for one subnet: address pool plus options" }, detail: "A scope contains the range, exclusions, reservations, lease time and options.", hook: "Scope holds everything; range is just the pool inside it." },
    { id: "exclusion", fields: { term: "Exclusion", meaning: "Addresses inside the range that DHCP must never hand out" }, detail: "Exclude addresses used by static devices like printers or servers.", hook: "Exclusion = keep these out of the pool." },
    { id: "reservation", fields: { term: "Reservation", meaning: "Always gives the same IP address to one device's MAC address" }, detail: "Static-like address that's still managed by DHCP.", hook: "Reserved table: same seat (IP) for the same guest (MAC)." },
    { id: "lease", fields: { term: "Lease", meaning: "How long a client may keep its assigned address before renewing" }, detail: "Clients try to renew at 50% of the lease time.", hook: "Like renting: the lease runs out unless you renew." },
    { id: "options", fields: { term: "Scope options", meaning: "Extra settings sent to clients, like default gateway and DNS server" }, detail: "Common options: router (gateway), DNS servers, domain name.", hook: "The address plus the directions to get out (gateway) and look things up (DNS)." },
    { id: "relay", fields: { term: "DHCP relay (IP helper)", meaning: "Forwards DHCP broadcasts to a server on another subnet" }, detail: "Broadcasts don't cross routers, so a relay passes them along.", hook: "Relay the request across the router." },
    { id: "apipa", fields: { term: "APIPA", meaning: "Self-assigned 169.254.x.x address when no DHCP server answers" }, detail: "Automatic Private IP Addressing: a sign DHCP failed.", hook: "169.254 = DHCP didn't answer." },
    { id: "ports", fields: { term: "DHCP ports", meaning: "UDP 67 (server) and UDP 68 (client)" }, detail: "UDP because the client has no IP yet.", hook: "Server 67, client 68." },
    { id: "d", fields: { step: "Step 1", message: "Discover" }, detail: "Client broadcasts: is there a DHCP server?", hook: "D-O-R-A: Discover, Offer, Request, Acknowledge." },
    { id: "o", fields: { step: "Step 2", message: "Offer" }, detail: "Server offers an address.", hook: "D-O-R-A: Discover, Offer, Request, Acknowledge." },
    { id: "r", fields: { step: "Step 3", message: "Request" }, detail: "Client requests the offered address.", hook: "D-O-R-A: Discover, Offer, Request, Acknowledge." },
    { id: "ack", fields: { step: "Step 4", message: "Acknowledge" }, detail: "Server confirms; the lease starts.", hook: "D-O-R-A: Discover, Offer, Request, Acknowledge." },
  ],
};

const dns: DrillDeck = {
  id: "dns",
  certification: "A+ Core 1",
  exam: "220-1201",
  objective: "2.3, 2.4",
  topic: "DNS",
  modes: [
    { id: "recordToPurpose", from: "record", to: "purpose" },
    { id: "purposeToRecord", from: "purpose", to: "record" },
    { id: "facts", from: "question", to: "answer" },
  ],
  tables: [
    { id: "records", fields: ["record", "purpose"] },
    { id: "facts", fields: ["question", "answer"] },
  ],
  items: [
    { id: "a", fields: { record: "A", purpose: "Maps a hostname to an IPv4 address" }, detail: "A record: www.example.com → 93.184.216.34", hook: "One A = IPv4 (shorter address)." },
    { id: "aaaa", fields: { record: "AAAA", purpose: "Maps a hostname to an IPv6 address" }, detail: "AAAA (quad-A): www.example.com → 2001:db8::1", hook: "Four As for the longer IPv6 address (128 bits = 4 × 32)." },
    { id: "cname", fields: { record: "CNAME", purpose: "Points one name to another name (an alias)" }, detail: "CNAME: shop.example.com → example.myshopify.com", hook: "C for Canonical name = nickname to real name." },
    { id: "mx", fields: { record: "MX", purpose: "Names the mail server that receives email for the domain" }, detail: "MX records have a priority; the lowest number is tried first.", hook: "MX = Mail eXchange." },
    { id: "txt", fields: { record: "TXT", purpose: "Holds free text, used for SPF, DKIM, DMARC and domain verification" }, detail: "TXT records carry the email anti-spoofing policies.", hook: "TXT = text notes about the domain." },
    { id: "spf", fields: { record: "SPF", purpose: "Lists which servers are allowed to send email for the domain" }, detail: "Sender Policy Framework, stored in a TXT record.", hook: "SPF = approved Senders." },
    { id: "dkim", fields: { record: "DKIM", purpose: "Digitally signs outgoing email so receivers can verify it wasn't altered" }, detail: "DomainKeys Identified Mail: public key published in DNS.", hook: "DKIM = Keys and signatures." },
    { id: "dmarc", fields: { record: "DMARC", purpose: "Tells receivers what to do when SPF or DKIM checks fail, and where to send reports" }, detail: "Domain-based Message Authentication, Reporting and Conformance.", hook: "DMARC = the policy and reports on top of SPF and DKIM." },
    { id: "port", fields: { question: "DNS port", answer: "53 (UDP lookups, TCP zone transfers)" }, detail: "DNS uses port 53 on both UDP and TCP.", hook: "Lookups are small (UDP); zone transfers are big (TCP).", wrong: { answer: ["67/68 (UDP)", "389 (TCP)", "443 (TCP)"] } },
    { id: "zone", fields: { question: "Where a DNS server stores a domain's records", answer: "Zone file" }, detail: "The zone file on the server holds the A, MX, CNAME and other records.", hook: "Server side = zone file.", wrong: { answer: ["Hosts file", "DHCP scope", "Registry hive"] } },
    { id: "hosts", fields: { question: "Local file on a computer that maps names to IPs, checked before DNS", answer: "Hosts file" }, detail: "Windows: C:\\Windows\\System32\\drivers\\etc\\hosts", hook: "Client side = hosts file.", wrong: { answer: ["Zone file", "ARP cache", "DHCP lease"] } },
    { id: "symptom", fields: { question: "You can ping 8.8.8.8 but can't open google.com", answer: "DNS problem" }, detail: "IP connectivity works, so name resolution is the issue.", hook: "IP works, name fails = DNS.", wrong: { answer: ["DHCP problem", "Bad cable", "Wrong subnet mask"] } },
  ],
};

const hardware: DrillDeck = {
  id: "hardware",
  certification: "A+ Core 1",
  exam: "220-1201",
  objective: "3.1–3.8",
  topic: "Hardware components",
  modes: [
    { id: "partToUse", from: "part", to: "use" },
    { id: "connectorToUse", from: "connector", to: "use" },
    { id: "ramPins", from: "ram", to: "pins" },
    { id: "cableLimit", from: "cable", to: "limit" },
  ],
  tables: [
    { id: "parts", fields: ["part", "use"] },
    { id: "connectors", fields: ["connector", "use"] },
    { id: "memory", fields: ["ram", "pins"] },
    { id: "cables", fields: ["cable", "limit"] },
  ],
  items: [
    { id: "sodimm", fields: { part: "SO-DIMM", use: "Memory module for laptops and small PCs" }, detail: "SO-DIMM is the small-outline memory module used in laptops and compact systems.", hook: "Small outline = laptops." },
    { id: "m2", fields: { part: "M.2 NVMe SSD", use: "Fast SSD that plugs directly into the motherboard" }, detail: "M.2 NVMe uses PCIe lanes, so it is much faster than SATA and needs no data cable.", hook: "M.2 = card on the board, no SATA cable." },
    { id: "sata", fields: { part: "SATA HDD or SSD", use: "Drive connected with a SATA data cable and power cable" }, detail: "SATA drives need a SATA data cable and a separate SATA power connector.", hook: "SATA = data cable plus power cable." },
    { id: "atx", fields: { part: "ATX motherboard", use: "Standard full-size desktop board" }, detail: "ATX is the standard full-size desktop motherboard form factor.", hook: "ATX = the standard full-size desktop board." },
    { id: "microatx", fields: { part: "microATX motherboard", use: "Smaller board that fits ATX cases" }, detail: "microATX is smaller than ATX, fits most ATX cases, and has fewer expansion slots.", hook: "micro = smaller, still fits ATX cases." },
    { id: "miniitx", fields: { part: "Mini-ITX motherboard", use: "Smallest common form factor for compact builds" }, detail: "Mini-ITX is the smallest common motherboard size, usually with one expansion slot.", hook: "Mini-ITX = small builds." },
    { id: "paste", fields: { part: "Thermal paste", use: "Fills tiny gaps between CPU and heatsink" }, detail: "Thermal paste improves heat transfer from the CPU to the heatsink.", hook: "Paste = heat path." },
    { id: "cmos", fields: { part: "CMOS battery", use: "Keeps BIOS/UEFI clock and settings when power is off" }, detail: "The CMOS battery is usually a CR2032 coin cell.", hook: "CR2032 = the clock battery." },
    { id: "jumper", fields: { part: "CMOS jumper", use: "Clears BIOS passwords and resets settings" }, detail: "Moving the CMOS jumper (or removing the battery) resets BIOS settings and passwords.", hook: "Jumper clears CMOS." },
    { id: "80plus", fields: { part: "80 PLUS rating", use: "Measures how efficiently a power supply converts AC to DC" }, detail: "A higher 80 PLUS rating wastes less power as heat.", hook: "Higher rating = less waste heat." },
    { id: "laser", fields: { part: "Laser printer", use: "Uses toner, a drum and a fuser to make prints" }, detail: "Laser printers use static charge to place toner on paper, then fuse it with heat.", hook: "Toner + drum + fuser." },
    { id: "inkjet", fields: { part: "Inkjet printer", use: "Sprays liquid ink from cartridges through nozzles" }, detail: "Inkjets spray liquid ink through printhead nozzles.", hook: "Inkjet = liquid ink." },
    { id: "impact", fields: { part: "Impact (dot-matrix) printer", use: "Strikes a ribbon with pins; prints carbon copies" }, detail: "Impact printers strike an inked ribbon, so they can print multipart forms.", hook: "Impact = strikes the ribbon." },
    { id: "thermal", fields: { part: "Thermal printer", use: "Heats special paper; no ink or toner needed" }, detail: "Thermal printers are used for receipts and labels.", hook: "Thermal = heat, no ink." },
    { id: "mfd", fields: { part: "Multifunction device", use: "Prints, scans, copies and faxes in one unit" }, detail: "An MFD combines several functions in one printer.", hook: "MFD = all-in-one." },
    { id: "rollers", fields: { part: "Roller kit (maintenance)", use: "Replaces worn pickup and feed rollers to fix jams" }, detail: "Worn rollers cause pickup and feed failures.", hook: "Feed problems = rollers." },
    { id: "rj45", fields: { connector: "RJ-45", use: "Ethernet network cable" }, detail: "RJ-45 is the 8-pin connector for Ethernet.", hook: "45 = Ethernet." },
    { id: "rj11", fields: { connector: "RJ-11", use: "Telephone and DSL line" }, detail: "RJ-11 is the smaller 6-pin phone connector.", hook: "11 = phone line." },
    { id: "db9", fields: { connector: "DB-9 serial", use: "Legacy serial port for console access" }, detail: "DB-9 is a 9-pin serial connector used for management consoles.", hook: "9 pins, serial." },
    { id: "db25", fields: { connector: "DB-25 parallel", use: "Legacy parallel port for printers" }, detail: "DB-25 is the 25-pin parallel port on older PCs.", hook: "25 pins, parallel." },
    { id: "vga", fields: { connector: "VGA (DB-15)", use: "Analog video only" }, detail: "VGA is analog video on a 15-pin connector and carries no audio.", hook: "Old analog video." },
    { id: "dvi", fields: { connector: "DVI-D", use: "Digital video only" }, detail: "DVI-D carries digital video without audio.", hook: "DVI = video only." },
    { id: "hdmi", fields: { connector: "HDMI", use: "Digital video and audio in one cable" }, detail: "HDMI carries video and audio on one cable.", hook: "HDMI = audio plus video." },
    { id: "dp", fields: { connector: "DisplayPort", use: "High refresh rates and multiple monitors" }, detail: "DisplayPort supports high refresh rates and daisy-chained monitors.", hook: "DP = many monitors, high refresh." },
    { id: "usbc", fields: { connector: "USB-C", use: "Reversible connector that can carry video and Thunderbolt" }, detail: "USB-C is reversible and can carry USB, DisplayPort and Thunderbolt signals.", hook: "C = reversible." },
    { id: "lightning", fields: { connector: "Lightning", use: "Apple's phone and tablet connector" }, detail: "Lightning is Apple's proprietary connector.", hook: "Apple's own port." },
    { id: "ddr", fields: { ram: "DDR", pins: "184" }, detail: "Original DDR SDRAM DIMMs have 184 pins.", hook: "DDR = 184." },
    { id: "ddr2", fields: { ram: "DDR2", pins: "240" }, detail: "DDR2 DIMMs have 240 pins.", hook: "DDR2 and DDR3 both use 240." },
    { id: "ddr3", fields: { ram: "DDR3", pins: "240" }, detail: "DDR3 DIMMs have 240 pins, with a different key notch than DDR2.", hook: "Same pin count, different notch." },
    { id: "ddr4", fields: { ram: "DDR4", pins: "288" }, detail: "DDR4 DIMMs have 288 pins.", hook: "DDR4 = 288." },
    { id: "ddr5", fields: { ram: "DDR5", pins: "288" }, detail: "DDR5 DIMMs have 288 pins with a different key position than DDR4.", hook: "DDR5 = 288 too, but keyed differently." },
    { id: "sodimm4", fields: { ram: "SO-DIMM DDR4", pins: "260" }, detail: "DDR4 SO-DIMMs have 260 pins.", hook: "Laptop DDR4 = 260." },
    { id: "cat5e", fields: { cable: "Cat 5e", limit: "1 Gbps up to 100 m" }, detail: "Cat 5e supports 1 Gbps up to 100 m.", hook: "5e = 1 Gbps." },
    { id: "cat6", fields: { cable: "Cat 6", limit: "10 Gbps up to 55 m" }, detail: "Cat 6 supports 10 Gbps only up to 55 m.", hook: "Cat 6 = 10 Gbps, but only 55 m." },
    { id: "cat6a", fields: { cable: "Cat 6a", limit: "10 Gbps up to 100 m" }, detail: "Cat 6a supports 10 Gbps up to the full 100 m.", hook: "The a = full 100 m at 10 Gbps." },
    { id: "sm", fields: { cable: "Single-mode fiber", limit: "Long runs, many kilometers" }, detail: "Single-mode fiber carries light over long distances.", hook: "Single = long runs." },
    { id: "mm", fields: { cable: "Multimode fiber", limit: "Shorter runs within a building or campus" }, detail: "Multimode fiber is used for shorter distances.", hook: "Multi = shorter runs." },
    { id: "coax", fields: { cable: "Coaxial (RG-6)", limit: "Cable TV and cable internet" }, detail: "RG-6 coaxial carries cable TV and cable modem signals.", hook: "Coax = cable TV line." },
  ],
};

const troubleshooting: DrillDeck = {
  id: "troubleshooting",
  certification: "A+ Core 1",
  exam: "220-1201",
  objective: "5.1–5.6",
  topic: "Hardware and network troubleshooting",
  modes: [
    { id: "symptomToCause", from: "symptom", to: "cause" },
    { id: "commandToPurpose", from: "command", to: "purpose" },
    { id: "toolToUse", from: "tool", to: "use" },
  ],
  tables: [
    { id: "symptoms", fields: ["symptom", "cause"] },
    { id: "commands", fields: ["command", "purpose"] },
    { id: "tools", fields: ["tool", "use"] },
  ],
  items: [
    { id: "s-post", fields: { symptom: "No POST, with beep codes", cause: "Bad RAM or video card: reseat, then test" }, detail: "Beep codes point to memory or video at power-on.", hook: "Beeps at boot = RAM or video." },
    { id: "s-hdd", fields: { symptom: "Grinding or clicking hard drive", cause: "Failing hard drive: back up now" }, detail: "Mechanical noise means the drive is failing.", hook: "Clicks = mechanical failure." },
    { id: "s-shutdown", fields: { symptom: "Random shutdowns under load", cause: "Overheating or failing power supply" }, detail: "Heat or an unstable power supply cause shutdowns under load.", hook: "Under load = heat or power." },
    { id: "s-dim", fields: { symptom: "Dim laptop screen, image still visible", cause: "Backlight or inverter" }, detail: "A dim image that is still visible means the backlight, not the panel.", hook: "Dim but visible = backlight." },
    { id: "s-blank", fields: { symptom: "Blank laptop screen, external monitor works", cause: "LCD panel or display cable" }, detail: "If the external display works, the laptop's video card is fine.", hook: "External works = LCD or cable." },
    { id: "s-cmos", fields: { symptom: "Wrong date and time after every reboot", cause: "Dead CMOS battery" }, detail: "The CMOS battery keeps the clock running when power is off.", hook: "Clock resets = CMOS battery." },
    { id: "s-ghost", fields: { symptom: "Laser printout has ghost images", cause: "Drum or cleaning system problem" }, detail: "Residual charge from the last page means the drum is not being cleaned.", hook: "Ghosts = drum." },
    { id: "s-jam", fields: { symptom: "Paper jams at pickup", cause: "Worn or dirty pickup rollers" }, detail: "Pickup failures usually come from worn or dirty rollers.", hook: "Feed trouble = rollers." },
    { id: "s-smudge", fields: { symptom: "Smudged toner after printing", cause: "Fuser not heating properly" }, detail: "Toner that isn't fused to the page smudges.", hook: "Smudge = fuser." },
    { id: "s-blankpage", fields: { symptom: "Blank laser printout", cause: "Empty toner cartridge" }, detail: "A blank page usually means no toner is reaching the drum.", hook: "Blank = no toner." },
    { id: "s-apipa", fields: { symptom: "Computer shows a 169.254.x.x address", cause: "DHCP server unreachable" }, detail: "APIPA means the computer could not get an address from DHCP.", hook: "169.254 = DHCP failed." },
    { id: "s-dns", fields: { symptom: "Can ping an IP address but not a hostname", cause: "DNS problem" }, detail: "IP connectivity works, so name resolution is failing.", hook: "IP works, name fails = DNS." },
    { id: "s-touch", fields: { symptom: "Phone touchscreen unresponsive in spots", cause: "Damaged digitizer" }, detail: "The digitizer is the touch layer on the glass.", hook: "Touch problem = digitizer." },
    { id: "s-swell", fields: { symptom: "Swollen laptop battery", cause: "Battery failure: replace immediately" }, detail: "A swollen lithium battery is a fire hazard. Stop using it and replace it.", hook: "Swollen = stop and replace." },
    { id: "c-ipconfig", fields: { command: "ipconfig /all", purpose: "Shows IP, subnet, gateway, DNS and DHCP details" }, detail: "ipconfig /all lists the full network configuration.", hook: "/all = everything." },
    { id: "c-renew", fields: { command: "ipconfig /release and /renew", purpose: "Requests a new address from the DHCP server" }, detail: "Releasing and renewing asks DHCP for a fresh lease.", hook: "Release, then renew." },
    { id: "c-ping", fields: { command: "ping 127.0.0.1", purpose: "Tests the local TCP/IP stack" }, detail: "127.0.0.1 is loopback, so it tests the computer's own network stack.", hook: "127.0.0.1 = myself." },
    { id: "c-tracert", fields: { command: "tracert", purpose: "Shows each hop on the route to a destination" }, detail: "tracert lists each router a packet crosses.", hook: "Trace the route." },
    { id: "c-nslookup", fields: { command: "nslookup", purpose: "Tests DNS name resolution" }, detail: "nslookup queries a DNS server directly.", hook: "Lookup = DNS." },
    { id: "c-netstat", fields: { command: "netstat -a", purpose: "Lists open connections and listening ports" }, detail: "netstat -a shows every connection and listening port.", hook: "Netstat = connections." },
    { id: "c-arp", fields: { command: "arp -a", purpose: "Shows IP-to-MAC mappings in the ARP cache" }, detail: "arp -a shows which MAC address each IP maps to.", hook: "ARP = IP to MAC." },
    { id: "c-chkdsk", fields: { command: "chkdsk", purpose: "Checks a drive for errors" }, detail: "chkdsk scans a drive's file system for errors.", hook: "Check disk." },
    { id: "t-multi", fields: { tool: "Multimeter", use: "Measures voltage, continuity and resistance" }, detail: "A multimeter tests electrical values on power and cables.", hook: "Multi = many measurements." },
    { id: "t-cable", fields: { tool: "Cable tester", use: "Checks network cable wiring and continuity" }, detail: "A cable tester verifies each wire of a network cable.", hook: "Cable tester = network wires." },
    { id: "t-loop", fields: { tool: "Loopback plug", use: "Tests a serial or network port by sending data back to itself" }, detail: "A loopback plug sends transmitted data back to the port.", hook: "Loop back to the port." },
    { id: "t-toner", fields: { tool: "Toner probe", use: "Traces a cable run to its far end" }, detail: "A toner probe finds the matching end of a cable.", hook: "Probe = trace a run." },
    { id: "t-esd", fields: { tool: "Anti-static wrist strap", use: "Prevents electrostatic discharge damage" }, detail: "Wear the strap grounded to the case when handling components.", hook: "ESD = static." },
    { id: "t-punch", fields: { tool: "Punch-down tool", use: "Seats wires into a 110 or Krone block" }, detail: "A punch-down tool terminates wires on a patch panel or wall jack.", hook: "Punch down the wires." },
    { id: "t-crimp", fields: { tool: "Crimper", use: "Attaches RJ-45 connectors to a cable" }, detail: "A crimper locks RJ-45 connectors onto the cable.", hook: "Crimp = RJ-45." },
    { id: "t-wifi", fields: { tool: "Wi-Fi analyzer", use: "Shows channel use and signal strength" }, detail: "A Wi-Fi analyzer maps channel congestion and signal levels.", hook: "Analyze the channels." },
    { id: "s-fans", fields: { symptom: "Fans spin, but no POST and no display", cause: "Power supply voltages or a failed core part: test PSU outputs with a multimeter" }, detail: "Spinning fans do not prove the PSU is good.", hook: "Fans spinning is not proof." },
    { id: "s-burn", fields: { symptom: "Burning smell or smoke from the PC", cause: "Failed component: remove power immediately" }, detail: "Cut power first, then find and replace the damaged part.", hook: "Smoke = power off first." },
    { id: "s-caps", fields: { symptom: "Bulging or leaking capacitors on the motherboard", cause: "Failing motherboard: replace it" }, detail: "Physical damage is not fixed by reseating or settings.", hook: "Bulging caps = new board." },
    { id: "s-usb", fields: { symptom: "PC starts a USB installer instead of Windows", cause: "Boot order lists USB first" }, detail: "Move the internal drive to the top of the boot order.", hook: "Wrong device boots = boot order." },
    { id: "s-blackwin", fields: { symptom: "Screen goes black right after the Windows logo", cause: "Video driver: start in Safe Mode and fix the driver" }, detail: "The display works until the driver loads.", hook: "Black after logo = driver." },
    { id: "s-rattle", fields: { symptom: "Rattling inside the case", cause: "A loose part, often the heatsink: secure it" }, detail: "Reinstall the heatsink with fresh thermal paste if it is loose.", hook: "Rattle = something loose." },
    { id: "s-slow", fields: { symptom: "Sluggish performance on an older PC", cause: "Heavy processes, low disk space, power saving or malware" }, detail: "Check Task Manager, free space, the power plan and malware scans.", hook: "Slow = check resources first." },
  ],
};

const mobile: DrillDeck = {
  id: "mobile",
  certification: "A+ Core 1",
  exam: "220-1201",
  objective: "1.1–1.3, 5.4",
  topic: "Mobile devices",
  modes: [
    { id: "symptomToFix", from: "symptom", to: "fix" },
    { id: "connectivity", from: "tech", to: "use" },
    { id: "accessory", from: "accessory", to: "use" },
  ],
  tables: [
    { id: "symptoms", fields: ["symptom", "fix"] },
    { id: "connectivity", fields: ["tech", "use"] },
    { id: "accessories", fields: ["accessory", "use"] },
  ],
  items: [
    { id: "m-touch", fields: { symptom: "Touchscreen unresponsive", fix: "Replace the digitizer" }, detail: "Unresponsive touch with a working display points to the digitizer.", hook: "Touch = digitizer." },
    { id: "m-crack", fields: { symptom: "Cracked screen, image still shows", fix: "Replace the screen assembly" }, detail: "A cracked screen with a working image usually means the glass is broken.", hook: "Cracked glass = screen assembly." },
    { id: "m-batt", fields: { symptom: "Battery drains quickly and gets hot", fix: "Replace the battery" }, detail: "Fast drain and heat point to a worn battery.", hook: "Hot and draining = battery." },
    { id: "m-charge", fields: { symptom: "Won't charge, but the cable works on other devices", fix: "Clean or replace the charging port" }, detail: "If the cable works elsewhere, the problem is the port.", hook: "Good cable = bad port." },
    { id: "m-bt", fields: { symptom: "Bluetooth headset won't pair", fix: "Put headset in pairing mode and make phone discoverable" }, detail: "Both devices must be in discovery mode to pair.", hook: "Pairing needs discovery mode." },
    { id: "m-wifi", fields: { symptom: "Wi-Fi won't connect after an update", fix: "Forget the network and re-enter the password" }, detail: "Forgetting and re-adding the network clears stale settings.", hook: "Forget and re-add." },
    { id: "k-bt", fields: { tech: "Bluetooth", use: "Short-range pairing for headsets and keyboards (about 10 m)" }, detail: "Bluetooth pairs personal devices over short range.", hook: "Bluetooth = personal, short range." },
    { id: "k-nfc", fields: { tech: "NFC", use: "Tap-to-pay and badges within a few centimeters" }, detail: "NFC works only when devices are nearly touching.", hook: "Near-field = touch range." },
    { id: "k-cell", fields: { tech: "Cellular (LTE/5G)", use: "Wide-area mobile data" }, detail: "Cellular provides data across a carrier network.", hook: "Carrier = cellular." },
    { id: "k-hotspot", fields: { tech: "Hotspot (tethering)", use: "Shares the phone's cellular data with other devices" }, detail: "A hotspot turns the phone into a Wi-Fi access point.", hook: "Hotspot = share the data." },
    { id: "k-ir", fields: { tech: "Infrared", use: "Line-of-sight remote control at short range" }, detail: "Infrared needs a clear line of sight.", hook: "IR needs line of sight." },
    { id: "k-gps", fields: { tech: "GPS", use: "Location from satellites, no Wi-Fi or cellular needed" }, detail: "GPS works from satellite signals alone.", hook: "GPS = satellites." },
    { id: "k-wfd", fields: { tech: "Wi-Fi Direct", use: "Device-to-device connection without an access point" }, detail: "Wi-Fi Direct connects two devices directly.", hook: "Direct = no access point." },
    { id: "a-stylus", fields: { accessory: "Stylus", use: "Pen input for drawing and notes" }, detail: "A stylus gives precise pen input on a touchscreen.", hook: "Stylus = pen input." },
    { id: "a-dock", fields: { accessory: "Docking station", use: "One connection to monitors, keyboard, network and power" }, detail: "A docking station connects a laptop to many peripherals with one connection.", hook: "Dock = one cable to everything." },
    { id: "a-replicator", fields: { accessory: "Port replicator", use: "Adds ports to a laptop through a proprietary connector" }, detail: "A port replicator adds ports through a vendor-specific connector.", hook: "Replicate ports." },
    { id: "a-watch", fields: { accessory: "Smartwatch", use: "Shows notifications and tracks activity over Bluetooth" }, detail: "A smartwatch pairs with a phone over Bluetooth.", hook: "Watch = Bluetooth pairing." },
    { id: "a-wireless", fields: { accessory: "Wireless charging pad", use: "Charges by induction across a short gap" }, detail: "Wireless chargers transfer power by induction.", hook: "Induction = no cable." },
  ],
};

const virtualization: DrillDeck = {
  id: "virtualization-cloud",
  certification: "A+ Core 1",
  exam: "220-1201",
  objective: "4.1–4.2",
  topic: "Virtualization and cloud computing",
  modes: [
    { id: "hypervisor", from: "product", to: "type" },
    { id: "vmNetwork", from: "mode", to: "behavior" },
    { id: "cloudService", from: "service", to: "model" },
    { id: "deployment", from: "scenario", to: "deployment" },
    { id: "characteristic", from: "feature", to: "concept" },
  ],
  tables: [
    { id: "hypervisors", fields: ["product", "type"] },
    { id: "vmNetwork", fields: ["mode", "behavior"] },
    { id: "cloud", fields: ["service", "model"] },
    { id: "deployment", fields: ["scenario", "deployment"] },
    { id: "characteristics", fields: ["feature", "concept"] },
  ],
  items: [
    { id: "v-hyperv", fields: { product: "Hyper-V", type: "Type 1 (bare metal)" }, detail: "Hyper-V runs directly on the hardware.", hook: "Hyper-V = Type 1." },
    { id: "v-esxi", fields: { product: "VMware ESXi", type: "Type 1 (bare metal)" }, detail: "ESXi is a bare-metal hypervisor.", hook: "ESXi = bare metal." },
    { id: "v-vbox", fields: { product: "VirtualBox", type: "Type 2 (hosted)" }, detail: "VirtualBox runs on top of a host operating system.", hook: "Hosted = on top of an OS." },
    { id: "v-vmw", fields: { product: "VMware Workstation", type: "Type 2 (hosted)" }, detail: "VMware Workstation runs on a desktop OS.", hook: "Workstation = desktop, Type 2." },
    { id: "v-parallels", fields: { product: "Parallels Desktop", type: "Type 2 (hosted)" }, detail: "Parallels runs on a host OS.", hook: "Desktop app = Type 2." },
    { id: "n-bridged", fields: { mode: "Bridged", behavior: "VM gets its own IP on the physical network" }, detail: "A bridged VM appears as its own device on the LAN.", hook: "Bridged = its own address." },
    { id: "n-nat", fields: { mode: "NAT", behavior: "VM shares the host's IP address" }, detail: "NAT hides the VM behind the host's address.", hook: "NAT = shared address." },
    { id: "n-host", fields: { mode: "Host-only", behavior: "VM talks only to the host and other VMs" }, detail: "Host-only networks have no route to the outside network.", hook: "Host-only = isolated." },
    { id: "c-ec2", fields: { service: "Amazon EC2 virtual machines", model: "IaaS" }, detail: "IaaS provides virtual machines you manage.", hook: "IaaS = you manage the VM." },
    { id: "c-app", fields: { service: "Azure App Service", model: "PaaS" }, detail: "PaaS gives you a platform to deploy code on.", hook: "PaaS = platform for code." },
    { id: "c-m365", fields: { service: "Microsoft 365", model: "SaaS" }, detail: "SaaS delivers a finished application.", hook: "SaaS = finished app." },
    { id: "c-gdocs", fields: { service: "Google Docs", model: "SaaS" }, detail: "Google Docs is a finished web application.", hook: "Ready-to-use = SaaS." },
    { id: "c-dbaas", fields: { service: "Managed database service", model: "PaaS" }, detail: "The provider runs the database platform for you.", hook: "Managed platform = PaaS." },
    { id: "d-private", fields: { scenario: "One company's own data center", deployment: "Private cloud" }, detail: "A private cloud serves one organization.", hook: "Private = one org." },
    { id: "d-public", fields: { scenario: "Provider's shared infrastructure, pay as you go", deployment: "Public cloud" }, detail: "A public cloud is shared infrastructure from a provider.", hook: "Public = shared, pay as you go." },
    { id: "d-hybrid", fields: { scenario: "On-premises servers plus cloud", deployment: "Hybrid cloud" }, detail: "Hybrid combines private and public cloud.", hook: "Hybrid = both." },
    { id: "d-community", fields: { scenario: "Several organizations with the same requirements", deployment: "Community cloud" }, detail: "A community cloud is shared by organizations with common needs.", hook: "Community = shared needs." },
    { id: "f-metering", fields: { feature: "Pay only for what you use", concept: "Metering (measured service)" }, detail: "Cloud usage is measured and billed.", hook: "Metered = pay for use." },
    { id: "f-elastic", fields: { feature: "Scale up and down automatically with demand", concept: "Rapid elasticity" }, detail: "Resources grow and shrink with demand.", hook: "Elastic = stretches." },
    { id: "f-self", fields: { feature: "Provision resources through a portal without calling staff", concept: "On-demand self-service" }, detail: "Users provision resources themselves.", hook: "Self-service = no ticket." },
    { id: "f-pool", fields: { feature: "One shared pool of resources serving many customers", concept: "Resource pooling" }, detail: "The provider pools resources across tenants.", hook: "Pool = shared resources." },
    { id: "f-broad", fields: { feature: "Access from any standard device over the network", concept: "Broad network access" }, detail: "Cloud services are reachable from many device types.", hook: "Broad = any device." },
  ],
};

const networkConfig: DrillDeck = {
  id: "network-config",
  certification: "A+ Core 1",
  exam: "220-1201",
  objective: "2.4, 2.6, 5.5",
  topic: "Network configuration",
  modes: [
    { id: "termToMeaning", from: "term", to: "meaning" },
    { id: "meaningToTerm", from: "meaning", to: "term" },
    { id: "symptomToCause", from: "symptom", to: "cause" },
  ],
  tables: [
    { id: "terms", fields: ["term", "meaning"] },
    { id: "symptoms", fields: ["symptom", "cause"] },
  ],
  items: [
    { id: "nat", fields: { term: "NAT", meaning: "Router translates private addresses to a public address" }, detail: "Network Address Translation lets private (RFC 1918) addresses reach the internet through the router's public address.", hook: "NAT = private in, public out." },
    { id: "pat", fields: { term: "PAT (NAT overload)", meaning: "Many private hosts share one public IP, told apart by port numbers" }, detail: "Port Address Translation tracks each connection by port, so a whole home or office shares one public IP.", hook: "PAT = Ports let many share one address." },
    { id: "gateway", fields: { term: "Default gateway", meaning: "Router address a host sends traffic to for other networks" }, detail: "Without a correct default gateway a host can reach its own subnet but not the internet.", hook: "Gateway = the way out of the subnet." },
    { id: "mask", fields: { term: "Subnet mask", meaning: "Marks which part of an IP address is network and which is host" }, detail: "255.255.255.0 (/24) means the first three octets are the network.", hook: "The mask hides the host part." },
    { id: "vlan", fields: { term: "VLAN", meaning: "Splits one physical switch into separate broadcast domains" }, detail: "A VLAN groups ports logically; traffic between VLANs needs a router or layer 3 switch.", hook: "Virtual LAN = separate networks on one switch." },
    { id: "vpn", fields: { term: "VPN", meaning: "Encrypted tunnel across an untrusted network" }, detail: "A VPN lets remote users reach a private network securely over the internet.", hook: "VPN = private tunnel over a public network." },
    { id: "pf", fields: { term: "Port forwarding", meaning: "Sends inbound traffic on one port to one internal host" }, detail: "Example: forward TCP 3389 to one PC for Remote Desktop.", hook: "Forward one port to one host." },
    { id: "dmzhost", fields: { term: "DMZ host (SOHO router)", meaning: "Sends all unsolicited inbound traffic to one internal host" }, detail: "A SOHO DMZ host is fully exposed; port forwarding is the safer choice.", hook: "DMZ host = every port to one machine." },
    { id: "static", fields: { term: "Static IP address", meaning: "Address set manually that does not change" }, detail: "Servers and printers often use static addresses or DHCP reservations.", hook: "Static = set by hand." },
    { id: "ssid", fields: { term: "SSID", meaning: "Name a wireless network broadcasts" }, detail: "Clients pick the network by its SSID.", hook: "SSID = Wi-Fi name." },
    { id: "s-gw", fields: { symptom: "Reaches local devices but not the internet", cause: "Wrong or missing default gateway" }, detail: "Local traffic works, so the problem is the route off the subnet.", hook: "Local yes, internet no = gateway." },
    { id: "s-dup", fields: { symptom: "Duplicate IP address warning", cause: "Static IP conflicts with a DHCP-assigned address" }, detail: "Exclude static addresses from the DHCP range or use reservations.", hook: "Two devices, one address." },
    { id: "s-link", fields: { symptom: "No link light on the network port", cause: "Unplugged or bad cable, or disabled NIC" }, detail: "No link light means no physical connection at layer 1.", hook: "No light = physical problem." },
    { id: "s-flap", fields: { symptom: "Port flapping (link keeps going up and down)", cause: "Bad cable or failing switch port" }, detail: "A link that bounces usually has a physical fault.", hook: "Flapping = flaky physical link." },
    { id: "s-voip", fields: { symptom: "Choppy VoIP calls", cause: "Jitter or latency: prioritize voice with QoS" }, detail: "Voice needs steady, low delay; QoS gives it priority.", hook: "Choppy voice = jitter, fix with QoS." },
    { id: "s-wifi", fields: { symptom: "Intermittent wireless connectivity", cause: "Interference or weak signal: check channel and AP placement" }, detail: "Overlapping channels, distance and obstacles cause drops.", hook: "Wi-Fi drops = interference or distance." },
    { id: "s-slow", fields: { symptom: "One PC has slow network speeds", cause: "Bad cable or duplex mismatch" }, detail: "Check the cable and that both ends agree on speed and duplex.", hook: "One slow PC = its cable or NIC settings." },
    { id: "concentrator", fields: { term: "VPN concentrator", meaning: "Device or software that encrypts and decrypts VPN traffic" }, detail: "Often built into a firewall or a dedicated appliance.", hook: "Concentrator = the VPN endpoint." },
    { id: "c2s", fields: { term: "Client-to-site VPN", meaning: "One user's device connects securely to the company network" }, detail: "Remote access, for example from home.", hook: "Client = one user." },
    { id: "s2s", fields: { term: "Site-to-site VPN", meaning: "Two offices' firewalls link whole networks over the internet" }, detail: "Users run no VPN software; the firewalls build the tunnel.", hook: "Site = whole office." },
    { id: "alwayson", fields: { term: "Always-on VPN", meaning: "Connects automatically at startup and sign-in" }, detail: "The user never starts it by hand.", hook: "Always on = automatic." },
    { id: "intervlan", fields: { term: "Inter-VLAN routing", meaning: "A router or layer 3 switch passing traffic between VLANs" }, detail: "Devices in different VLANs cannot talk directly.", hook: "VLANs need a router to talk." },
    { id: "s-latency", fields: { symptom: "High latency to remote sites", cause: "Congestion or a long path: find the slow hop with tracert" }, detail: "ping shows the delay; tracert shows where it starts.", hook: "Delay = find the hop." },
    { id: "s-auth", fields: { symptom: "\"Access denied\" when joining Wi-Fi or opening a share", cause: "Authentication failure: wrong password, locked account or wrong security type" }, detail: "Check credentials and the account before permissions.", hook: "Denied = credentials." },
    { id: "s-apipa2", fields: { symptom: "Limited connectivity with a 169.254.x.x address", cause: "No DHCP response (APIPA)" }, detail: "Check the DHCP server and cabling, then release and renew.", hook: "169.254 = no DHCP." },
    { id: "s-name", fields: { symptom: "Sites fail by name but load by IP address", cause: "DNS problem: check the DNS server settings" }, detail: "Use nslookup to test name resolution.", hook: "Names fail, IPs work = DNS." },
    { id: "s-allslow", fields: { symptom: "Network slow for everyone at once", cause: "Congestion on a shared link: apply QoS or move large transfers" }, detail: "One busy link slows every user behind it.", hook: "Everyone slow = shared link." },
  ],
};

const connectionTypes: DrillDeck = {
  id: "connection-types",
  certification: "A+ Core 1",
  exam: "220-1201",
  objective: "2.7",
  topic: "Internet connection and network types",
  modes: [
    { id: "connectionToFact", from: "connection", to: "fact" },
    { id: "scenarioToConnection", from: "scenario", to: "connection" },
    { id: "scopeToNetwork", from: "scope", to: "network" },
  ],
  tables: [
    { id: "connections", fields: ["connection", "fact", "scenario"] },
    { id: "networks", fields: ["network", "scope"] },
  ],
  items: [
    { id: "fiber", fields: { connection: "Fiber", fact: "Light over glass; the highest bandwidth", scenario: "Office needs the highest possible bandwidth" }, detail: "Fiber to the premises offers the fastest consumer service.", hook: "Fiber = fastest." },
    { id: "cable", fields: { connection: "Cable", fact: "Coaxial line from the TV provider, shared with neighbors", scenario: "Service arrives on the TV company's coax" }, detail: "Cable bandwidth is shared within a neighborhood.", hook: "Cable = coax, shared." },
    { id: "dsl", fields: { connection: "DSL", fact: "Runs over phone lines; slows with distance from the provider", scenario: "Service uses the existing telephone line" }, detail: "DSL speed drops as the line gets longer.", hook: "DSL = phone line." },
    { id: "sat", fields: { connection: "Satellite", fact: "Needs a dish with a clear view of the sky; traditionally high latency", scenario: "Remote cabin with no wired service" }, detail: "Satellite reaches places with no wired service; geostationary links have high latency.", hook: "Satellite = remote, delay." },
    { id: "cell", fields: { connection: "Cellular", fact: "4G/5G data from carrier towers", scenario: "Internet for a food truck that moves around" }, detail: "Cellular works anywhere there's carrier coverage.", hook: "Mobile = cellular." },
    { id: "wisp", fields: { connection: "Wireless ISP (WISP)", fact: "Fixed antenna aimed at a provider's tower", scenario: "Rooftop antenna pointed at a tower a few miles away" }, detail: "A WISP delivers fixed wireless service by line of sight.", hook: "WISP = antenna to tower." },
    { id: "lan", fields: { network: "LAN", scope: "One home, office or building" }, detail: "Local area network.", hook: "Local = one site." },
    { id: "wan", fields: { network: "WAN", scope: "Connects sites across cities or countries" }, detail: "Wide area network; the internet is the largest WAN.", hook: "Wide = far apart." },
    { id: "man", fields: { network: "MAN", scope: "Spans a city" }, detail: "Metropolitan area network.", hook: "Metro = city." },
    { id: "pan", fields: { network: "PAN", scope: "Devices around one person, like Bluetooth" }, detail: "Personal area network.", hook: "Personal = you." },
    { id: "wlan", fields: { network: "WLAN", scope: "Wireless local network" }, detail: "Wireless LAN, usually Wi-Fi.", hook: "W + LAN = wireless LAN." },
    { id: "san", fields: { network: "SAN", scope: "Dedicated network for block storage" }, detail: "Storage area network connects servers to shared storage.", hook: "Storage = SAN." },
  ],
};

const motherboardCpu: DrillDeck = {
  id: "motherboard-cpu",
  certification: "A+ Core 1",
  exam: "220-1201",
  objective: "3.5, 3.6",
  topic: "Motherboards, CPUs and power",
  modes: [
    { id: "slotToUse", from: "slot", to: "use" },
    { id: "socketToCpu", from: "socket", to: "cpu" },
    { id: "featureToMeaning", from: "feature", to: "meaning" },
    { id: "powerToRole", from: "power", to: "role" },
  ],
  tables: [
    { id: "slots", fields: ["slot", "use"] },
    { id: "sockets", fields: ["socket", "cpu"] },
    { id: "features", fields: ["feature", "meaning"] },
    { id: "power", fields: ["power", "role"] },
  ],
  items: [
    { id: "x16", fields: { slot: "PCIe x16", use: "Graphics card" }, detail: "The longest PCIe slot, usually nearest the CPU.", hook: "x16 = video." },
    { id: "x1", fields: { slot: "PCIe x1", use: "Small add-on cards like sound, Wi-Fi or a network card" }, detail: "x1 slots are short and carry one lane.", hook: "x1 = small cards." },
    { id: "m2slot", fields: { slot: "M.2 slot (M key)", use: "NVMe SSDs" }, detail: "M-keyed M.2 slots take NVMe (and some SATA) SSDs.", hook: "M key = SSD." },
    { id: "dimm", fields: { slot: "DIMM slot", use: "Desktop memory modules" }, detail: "Fill matching slots for dual channel.", hook: "DIMM = desktop RAM." },
    { id: "sataport", fields: { slot: "SATA port", use: "Hard drives, SSDs and optical drives" }, detail: "Each SATA port connects one drive.", hook: "SATA = drives." },
    { id: "front", fields: { slot: "Front-panel header", use: "Power button, reset button and case LEDs" }, detail: "Small pins that wire the case buttons to the board.", hook: "Front panel = buttons and LEDs." },
    { id: "fanh", fields: { slot: "Fan header", use: "CPU and case fans" }, detail: "3-pin or 4-pin (PWM) fan connectors.", hook: "Fan header = fans." },
    { id: "lga1700", fields: { socket: "LGA 1700", cpu: "Intel 12th–14th gen Core" }, detail: "LGA puts the pins in the socket, not on the CPU.", hook: "LGA = Intel, pins in the socket." },
    { id: "lga1200", fields: { socket: "LGA 1200", cpu: "Intel 10th–11th gen Core" }, detail: "The socket before LGA 1700.", hook: "1200 = older Intel." },
    { id: "am5", fields: { socket: "AM5", cpu: "AMD Ryzen 7000 and newer" }, detail: "AM5 moved AMD to LGA and DDR5.", hook: "AM5 = newest AMD, DDR5." },
    { id: "am4", fields: { socket: "AM4", cpu: "AMD Ryzen 1000–5000" }, detail: "AM4 is PGA: pins on the CPU.", hook: "AM4 = older AMD, pins on the chip." },
    { id: "smt", fields: { feature: "Hyper-threading (SMT)", meaning: "Each core runs two threads at once" }, detail: "Simultaneous multithreading presents two logical processors per core.", hook: "Hyper = two threads per core." },
    { id: "multicore", fields: { feature: "Multicore", meaning: "Several processing cores on one chip" }, detail: "More cores run more tasks in parallel.", hook: "Multi = many cores." },
    { id: "vtx", fields: { feature: "VT-x / AMD-V", meaning: "CPU virtualization support, enabled in UEFI" }, detail: "Required to run 64-bit virtual machines well.", hook: "V = virtualization." },
    { id: "arm", fields: { feature: "ARM", meaning: "Power-efficient architecture in phones, tablets and Apple silicon" }, detail: "ARM uses less power than x64.", hook: "ARM = battery-friendly." },
    { id: "x64", fields: { feature: "x64", meaning: "64-bit instruction set for most desktops and laptops" }, detail: "x64 runs 64-bit operating systems and more than 4 GB of RAM.", hook: "x64 = 64-bit PCs." },
    { id: "tpm", fields: { feature: "TPM", meaning: "Chip that stores encryption keys; required by Windows 11" }, detail: "Trusted Platform Module 2.0 is a Windows 11 requirement.", hook: "TPM = keys, Windows 11." },
    { id: "secureboot", fields: { feature: "Secure Boot", meaning: "UEFI loads only signed boot loaders" }, detail: "Blocks boot-level malware.", hook: "Secure Boot = signed only." },
    { id: "atx24", fields: { power: "24-pin ATX connector", role: "Main motherboard power" }, detail: "The widest power connector on the board.", hook: "24-pin = motherboard." },
    { id: "eps", fields: { power: "4/8-pin EPS (ATX12V)", role: "CPU power" }, detail: "Near the CPU socket at the top of the board.", hook: "EPS = CPU." },
    { id: "pcie8", fields: { power: "6/8-pin PCIe connector", role: "Graphics card power" }, detail: "Plugs into the graphics card itself.", hook: "PCIe power = GPU." },
    { id: "satapw", fields: { power: "15-pin SATA power", role: "SATA drive power" }, detail: "Flat L-shaped connector.", hook: "15 pins = SATA drives." },
    { id: "molex", fields: { power: "4-pin Molex", role: "Older drives and fans" }, detail: "Legacy peripheral connector.", hook: "Molex = old peripherals." },
    { id: "modular", fields: { power: "Modular power supply", role: "Cables detach so only needed ones are installed" }, detail: "Better airflow and less clutter.", hook: "Modular = detachable cables." },
    { id: "redundant", fields: { power: "Redundant power supply", role: "Second unit keeps a server running if one fails" }, detail: "Common in servers; often hot-swappable.", hook: "Redundant = backup supply." },
  ],
};

const storageRaid: DrillDeck = {
  id: "storage-raid",
  certification: "A+ Core 1",
  exam: "220-1201",
  objective: "3.4, 5.2",
  topic: "Storage and RAID",
  modes: [
    { id: "driveToFact", from: "drive", to: "fact" },
    { id: "levelToDescription", from: "level", to: "description" },
    { id: "descriptionToLevel", from: "description", to: "level" },
    { id: "symptomToCause", from: "symptom", to: "cause" },
  ],
  tables: [
    { id: "drives", fields: ["drive", "fact"] },
    { id: "raid", fields: ["level", "description"] },
    { id: "symptoms", fields: ["symptom", "cause"] },
  ],
  items: [
    { id: "hdd", fields: { drive: "HDD", fact: "Spinning platters; cheapest per GB, slowest, sensitive to shock" }, detail: "Common speeds are 5,400 and 7,200 rpm; servers use 10,000 or 15,000 rpm.", hook: "Spinning = slow and fragile." },
    { id: "satassd", fields: { drive: "SATA SSD", fact: "Flash with no moving parts, capped near 600 MB/s by SATA" }, detail: "SATA III is 6 Gb/s, which limits SSDs to roughly 550 MB/s.", hook: "SATA caps the SSD." },
    { id: "nvme", fields: { drive: "NVMe SSD", fact: "Flash on PCIe lanes; several GB/s" }, detail: "NVMe skips the SATA bottleneck.", hook: "NVMe = PCIe speed." },
    { id: "sshd", fields: { drive: "Hybrid drive (SSHD)", fact: "Hard drive with a small flash cache" }, detail: "Frequently used data is cached in flash.", hook: "Hybrid = HDD plus a little flash." },
    { id: "sd", fields: { drive: "SD card", fact: "Removable flash for cameras and phones" }, detail: "Comes in SD, microSD and other sizes.", hook: "SD = camera card." },
    { id: "optical", fields: { drive: "Blu-ray", fact: "Optical disc holding 25 GB per layer" }, detail: "DVD holds 4.7 GB per layer; Blu-ray holds 25 GB.", hook: "Blu-ray = 25 GB." },
    { id: "r0", fields: { level: "RAID 0", description: "Striping only: fastest, no fault tolerance, 2+ drives" }, detail: "Lose one drive and you lose the whole array.", hook: "0 = zero redundancy." },
    { id: "r1", fields: { level: "RAID 1", description: "Mirroring: exact copy on a second drive, 2 drives" }, detail: "Survives one drive failure; half the capacity is used for the copy.", hook: "1 = one copy." },
    { id: "r5", fields: { level: "RAID 5", description: "Striping with parity: 3+ drives, survives 1 failure" }, detail: "One drive's worth of space holds parity.", hook: "5 = parity, 3 drives minimum." },
    { id: "r6", fields: { level: "RAID 6", description: "Striping with double parity: 4+ drives, survives 2 failures" }, detail: "Two drives' worth of space holds parity.", hook: "6 = two parities." },
    { id: "r10", fields: { level: "RAID 10", description: "Mirrored pairs that are striped: 4+ drives" }, detail: "Combines RAID 1 safety with RAID 0 speed.", hook: "10 = 1 + 0." },
    { id: "s-degraded", fields: { symptom: "RAID array reports degraded", cause: "One drive failed: replace it and rebuild" }, detail: "The array still works but has lost its fault tolerance.", hook: "Degraded = replace and rebuild." },
    { id: "s-boot", fields: { symptom: "\"Bootable device not found\"", cause: "Wrong boot order, failed drive or loose cable" }, detail: "Check the UEFI boot order and the drive's cables first.", hook: "No boot device = order, cable, drive." },
    { id: "s-smart", fields: { symptom: "S.M.A.R.T. failure warning", cause: "Drive predicts its own failure: back up and replace" }, detail: "S.M.A.R.T. tracks drive health counters.", hook: "S.M.A.R.T. warning = back up now." },
    { id: "s-raid0", fields: { symptom: "Whole array lost after one drive failed", cause: "It was RAID 0, which has no redundancy" }, detail: "Only RAID 0 loses everything on a single failure.", hook: "One failure, all gone = RAID 0." },
    { id: "s-newdrive", fields: { symptom: "New drive appears in UEFI but not in File Explorer", cause: "Initialize and partition it in Disk Management" }, detail: "A blank drive needs a partition and file system.", hook: "Seen by firmware, not Windows = initialize it." },
    { id: "s-uefi", fields: { symptom: "Drive not detected in UEFI", cause: "Loose data or power cable, or a dead drive" }, detail: "Firmware detection fails before any OS is involved.", hook: "Not in UEFI = cable or dead drive." },
    { id: "s-ssdro", fields: { symptom: "SSD reads files but will not write", cause: "SSD at end of life (read-only): copy data off and replace" }, detail: "Worn SSDs often go read-only before failing.", hook: "Read-only SSD = replace." },
    { id: "s-osnf", fields: { symptom: "\"Operating system not found\" with the drive listed in UEFI", cause: "Boot order or boot media: check the boot order and remove USB drives" }, detail: "The firmware sees the drive, so the cable is fine.", hook: "Seen but won't boot = boot order." },
    { id: "s-psu", fields: { symptom: "Drives drop out after new parts were added", cause: "Not enough power supply wattage" }, detail: "Add up the load and compare it with the PSU rating.", hook: "New parts, drives drop = power." },
    { id: "s-mapped", fields: { symptom: "Mapped network drive missing after sign-in", cause: "Mapping not restored: remap with Reconnect at sign-in" }, detail: "The share is fine; the mapping did not reconnect.", hook: "Mapped drive gone = reconnect at sign-in." },
    { id: "s-inactive", fields: { symptom: "RAID controller reports an inactive volume", cause: "Controller, cable or power fault: open the RAID controller utility" }, detail: "The controller's own utility shows which member failed.", hook: "Ask the controller first." },
    { id: "s-rw", fields: { symptom: "Very slow reads and writes with read errors", cause: "Drive retrying bad sectors: back up, then run the maker's diagnostics" }, detail: "Retries on bad areas slow everything down.", hook: "Slow plus errors = failing drive." },
  ],
};

const displays: DrillDeck = {
  id: "displays",
  certification: "A+ Core 1",
  exam: "220-1201",
  objective: "3.1, 5.3",
  topic: "Displays and projectors",
  modes: [
    { id: "techToFact", from: "tech", to: "fact" },
    { id: "attributeToMeaning", from: "attribute", to: "meaning" },
    { id: "symptomToCause", from: "symptom", to: "cause" },
  ],
  tables: [
    { id: "tech", fields: ["tech", "fact"] },
    { id: "attributes", fields: ["attribute", "meaning"] },
    { id: "symptoms", fields: ["symptom", "cause"] },
  ],
  items: [
    { id: "ips", fields: { tech: "IPS (LCD)", fact: "Wide viewing angles and accurate color" }, detail: "In-plane switching LCDs are common for design work.", hook: "IPS = color and angles." },
    { id: "tn", fields: { tech: "TN (LCD)", fact: "Fast response and low cost, poor viewing angles" }, detail: "Twisted nematic panels were popular for gaming.", hook: "TN = fast and cheap." },
    { id: "va", fields: { tech: "VA (LCD)", fact: "High contrast, deep blacks for an LCD" }, detail: "Vertical alignment sits between TN and IPS.", hook: "VA = contrast." },
    { id: "oled", fields: { tech: "OLED", fact: "Each pixel makes its own light; true black, burn-in risk" }, detail: "No backlight is needed.", hook: "OLED = self-lit pixels." },
    { id: "miniled", fields: { tech: "Mini-LED", fact: "LCD with thousands of small backlight zones" }, detail: "Local dimming zones improve contrast.", hook: "Mini-LED = better backlight." },
    { id: "digitizer", fields: { tech: "Digitizer", fact: "Touch layer that turns touches into input" }, detail: "Replace the digitizer when touch fails but the image is fine.", hook: "Digitizer = touch." },
    { id: "backlight", fields: { tech: "Backlight", fact: "Lights an LCD from behind; failure gives a very dim image" }, detail: "Older laptops used a CCFL backlight powered by an inverter.", hook: "LCDs need a backlight." },
    { id: "res", fields: { attribute: "Resolution", meaning: "Pixels across and down, such as 1920 × 1080" }, detail: "Run LCDs at their native resolution for a sharp image.", hook: "Resolution = pixel count." },
    { id: "refresh", fields: { attribute: "Refresh rate", meaning: "How many times per second the image redraws (Hz)" }, detail: "60 Hz is standard; gaming monitors run 144 Hz or more.", hook: "Hz = redraws per second." },
    { id: "aspect", fields: { attribute: "Aspect ratio", meaning: "Width compared to height, such as 16:9" }, detail: "16:9 is widescreen; 4:3 is the older shape.", hook: "Aspect = shape." },
    { id: "ppi", fields: { attribute: "Pixel density (PPI)", meaning: "Pixels per inch; higher looks sharper" }, detail: "The same resolution on a smaller screen gives higher PPI.", hook: "PPI = sharpness." },
    { id: "nits", fields: { attribute: "Brightness (nits)", meaning: "How much light the screen puts out" }, detail: "Higher nits help in bright rooms and for HDR.", hook: "Nits = brightness." },
    { id: "response", fields: { attribute: "Response time", meaning: "How fast a pixel changes color, in milliseconds" }, detail: "Lower response time means less motion blur.", hook: "Lower ms = less blur." },
    { id: "s-nosignal", fields: { symptom: "Projector shows \"No signal\"", cause: "Wrong input source selected" }, detail: "Pick the input the laptop is actually connected to.", hook: "No signal = wrong input." },
    { id: "s-projoff", fields: { symptom: "Projector shuts off after a few minutes", cause: "Overheating: clean the filter and fans" }, detail: "Projectors shut down to protect the lamp.", hook: "Shuts off = heat." },
    { id: "s-projdim", fields: { symptom: "Projector image dim and discolored", cause: "Lamp near end of life" }, detail: "Lamps dim with age; check the lamp hours.", hook: "Dim projector = old bulb." },
    { id: "s-fuzzy", fields: { symptom: "Fuzzy or blurry image on an LCD", cause: "Not set to native resolution" }, detail: "Non-native resolutions are scaled and look soft.", hook: "Fuzzy = wrong resolution." },
    { id: "s-burn", fields: { symptom: "Faint image stays on an OLED screen", cause: "Burn-in" }, detail: "Static elements shown for a long time leave a permanent ghost.", hook: "Stuck ghost = burn-in." },
    { id: "s-pixel", fields: { symptom: "One pixel always black or always lit", cause: "Dead or stuck pixel" }, detail: "A pixel that never changes is dead or stuck.", hook: "One bad dot = pixel." },
    { id: "s-flicker", fields: { symptom: "Screen flickers or flashes", cause: "Loose video cable or wrong refresh rate" }, detail: "Reseat the cable, then check the refresh rate setting.", hook: "Flicker = cable or Hz." },
    { id: "s-tint", fields: { symptom: "Whole picture tinted one color", cause: "Loose or damaged video cable" }, detail: "A missing color channel often means a bad cable or bent pin.", hook: "Color cast = cable." },
    { id: "s-audio", fields: { symptom: "No sound through an HDMI monitor", cause: "Wrong audio output device selected" }, detail: "Pick the HDMI device as the default audio output.", hook: "HDMI silent = output device." },
  ],
};

const printers: DrillDeck = {
  id: "printers",
  certification: "A+ Core 1",
  exam: "220-1201",
  objective: "3.7, 3.8, 5.6",
  topic: "Printers",
  modes: [
    { id: "taskToPrinter", from: "task", to: "printer" },
    { id: "symptomToFix", from: "symptom", to: "fix" },
  ],
  tables: [
    { id: "tasks", fields: ["task", "printer"] },
    { id: "symptoms", fields: ["symptom", "fix"] },
  ],
  items: [
    { id: "t-kit", fields: { task: "Install a maintenance kit (fuser and rollers)", printer: "Laser" }, detail: "Kits are model-specific and due at the maker's page count.", hook: "Kit = laser." },
    { id: "t-counter", fields: { task: "Reset the page counter after maintenance", printer: "Laser" }, detail: "The counter tracks the next maintenance interval.", hook: "Page counter = laser kit." },
    { id: "t-toner", fields: { task: "Replace the toner cartridge and remove packing strips", printer: "Laser" }, detail: "Keep the cartridge or drum in its light-blocking bag until installing.", hook: "Toner = laser." },
    { id: "t-heads", fields: { task: "Run a printhead cleaning cycle", printer: "Inkjet" }, detail: "Clears ink buildup that causes color streaks.", hook: "Printheads + ink = inkjet." },
    { id: "t-align", fields: { task: "Align after installing new cartridges", printer: "Inkjet" }, detail: "The alignment page lines the colors up.", hook: "New cartridges = calibrate." },
    { id: "t-heat", fields: { task: "Clean the heating element with isopropyl alcohol", printer: "Thermal" }, detail: "A cleaning pen or cleaning card works too.", hook: "Heating element = thermal." },
    { id: "t-paper", fields: { task: "Load heat-sensitive paper made for the model", printer: "Thermal" }, detail: "Ordinary paper will not print in a thermal printer.", hook: "Special paper = thermal." },
    { id: "t-ribbon", fields: { task: "Replace the ink ribbon", printer: "Impact" }, detail: "A worn ribbon makes print fade evenly.", hook: "Ribbon = impact." },
    { id: "t-tractor", fields: { task: "Line up tractor-feed paper holes", printer: "Impact" }, detail: "Continuous multipart paper feeds on tractor holes.", hook: "Tractor feed = impact." },
    { id: "p-kit", fields: { symptom: "Laser printer reached its maintenance page count", fix: "Install the maintenance kit, then reset the page counter" }, detail: "Replaces worn fuser and rollers on schedule.", hook: "Count reached = kit + reset." },
    { id: "p-spill", fields: { symptom: "Toner spilled inside a laser printer", fix: "Clean it with a toner-rated vacuum" }, detail: "Compressed air spreads toner; use cold water on skin.", hook: "Toner mess = toner vacuum." },
    { id: "p-streak", fields: { symptom: "Inkjet prints streaks of color", fix: "Run printhead cleaning" }, detail: "Ink has built up on the printheads.", hook: "Streaks = clean heads." },
    { id: "p-offset", fields: { symptom: "Colors print offset after new cartridges", fix: "Run the calibration (alignment) utility" }, detail: "Calibration lines up the colors again.", hook: "Offset = calibrate." },
    { id: "p-thermal", fields: { symptom: "Faded thermal receipts on the correct paper", fix: "Clean the heating element" }, detail: "Debris on the element blocks the heat.", hook: "Faded thermal = clean element." },
    { id: "p-faint", fields: { symptom: "Dot-matrix print is evenly faint", fix: "Replace the ribbon" }, detail: "The ribbon has run out of ink.", hook: "Faint impact = ribbon." },
    { id: "p-dots", fields: { symptom: "Every dot-matrix character misses the same row of dots", fix: "Replace the printhead" }, detail: "One printhead pin has failed.", hook: "Missing dots = printhead pin." },
    { id: "p-garbled", fields: { symptom: "Printouts full of garbled characters", fix: "Install the correct printer driver" }, detail: "Garbled output is a driver problem, not worn hardware.", hook: "Garbage text = driver." },
    { id: "p-smudge", fields: { symptom: "Laser toner smudges and rubs off the page", fix: "Replace the fuser" }, detail: "The fuser is not melting toner onto the paper.", hook: "Smudge = fuser." },
    { id: "p-ghost", fields: { symptom: "Faint repeats of earlier images on laser pages", fix: "Replace the drum or check the cleaning blade" }, detail: "The drum is not being cleared between pages.", hook: "Ghosting = drum." },
    { id: "p-jam", fields: { symptom: "Paper jams at pickup", fix: "Clean or replace the pickup rollers" }, detail: "Worn rollers fail to grab the paper.", hook: "Pickup jams = rollers." },
  ],
};

// A+ Core 2 (220-1202 V15) decks, scoped to CompTIA exam objectives document v3.0.
const c2OsBasics: DrillDeck = {
  id: "c2-os-basics",
  certification: "A+ Core 2",
  exam: "220-1202",
  objective: "1.1, 1.2, 1.3",
  topic: "OS types, installs and Windows editions",
  modes: [
    { id: "termToMeaning", from: "term", to: "meaning" },
    { id: "meaningToTerm", from: "meaning", to: "term" },
    { id: "scenarioToAnswer", from: "scenario", to: "answer" },
  ],
  tables: [
    { id: "terms", fields: ["term", "meaning"] },
    { id: "scenarios", fields: ["scenario", "answer"] },
  ],
  items: [
    { id: "ntfs", fields: { term: "NTFS", meaning: "Windows default filesystem with permissions and encryption support" }, detail: "Default Windows filesystem with permissions, encryption (EFS) and large files.", hook: "NTFS = Windows default." },
    { id: "refs", fields: { term: "ReFS", meaning: "Resilient filesystem for large storage volumes; not bootable" }, detail: "Built for data integrity on large storage volumes; Windows cannot boot from it.", hook: "ReFS = Resilient storage volumes." },
    { id: "fat32", fields: { term: "FAT32", meaning: "Widely compatible filesystem limited to 4 GB per file" }, detail: "Works almost everywhere but cannot hold a file larger than 4 GB.", hook: "FAT32 = 4 GB file limit." },
    { id: "exfat", fields: { term: "exFAT", meaning: "Flash-drive filesystem for large files across Windows and macOS" }, detail: "Removable flash drives that move between Windows and macOS and hold large files.", hook: "exFAT = big files on flash drives." },
    { id: "ext4", fields: { term: "ext4", meaning: "Common default Linux filesystem" }, detail: "The common default for Linux distributions.", hook: "ext4 = Linux." },
    { id: "xfs", fields: { term: "XFS", meaning: "High-performance Linux filesystem common on enterprise distributions" }, detail: "High-performance journaling filesystem used by many enterprise Linux distributions.", hook: "XFS = enterprise Linux." },
    { id: "apfs", fields: { term: "APFS", meaning: "Apple's filesystem for macOS and iOS devices" }, detail: "Apple's filesystem for macOS and iOS, optimized for SSDs.", hook: "APFS = Apple." },
    { id: "gpt", fields: { term: "GPT", meaning: "Partition table for large disks and many partitions, used with UEFI" }, detail: "Supports large disks and many partitions; needed for UEFI booting such as Windows 11.", hook: "GPT = modern, UEFI." },
    { id: "mbr", fields: { term: "MBR", meaning: "Legacy partition table limited to four primary partitions and 2 TB" }, detail: "Legacy partition table: up to 4 primary partitions and 2 TB disks.", hook: "MBR = 4 primaries, 2 TB." },
    { id: "clean", fields: { term: "Clean install", meaning: "Fresh OS install that replaces everything on the target partition" }, detail: "Wipes the target partition and installs fresh; apps and data must be restored.", hook: "Clean = start from zero." },
    { id: "inplace", fields: { term: "In-place upgrade", meaning: "Upgrade that keeps existing apps, settings and files" }, detail: "Keeps apps, settings and files while moving to the new version.", hook: "In-place = keep everything." },
    { id: "image", fields: { term: "Image deployment", meaning: "Copying a prepared standard system image to many computers" }, detail: "A prepared system image is copied to many PCs.", hook: "Image = clone a standard build." },
    { id: "zerotouch", fields: { term: "Zero-touch deployment", meaning: "Devices set themselves up from management services at first boot" }, detail: "New devices configure themselves from a management service (cloud or on-premises) at first boot with no technician.", hook: "Zero-touch = no hands." },
    { id: "recovery", fields: { term: "Recovery partition", meaning: "Hidden partition used to restore the factory OS image" }, detail: "A hidden partition holding the factory image used to restore the OS.", hook: "Recovery partition = factory reset." },
    { id: "repair", fields: { term: "Repair installation", meaning: "Reinstall that fixes system files but keeps data and apps" }, detail: "Reinstalls system files while keeping user data and apps.", hook: "Repair = fix in place." },
    { id: "eol", fields: { term: "End-of-life (EOL)", meaning: "Vendor no longer provides updates or security patches" }, detail: "The vendor stops patches, so security risk grows.", hook: "EOL = no more updates." },
    { id: "bitlocker-ed", fields: { scenario: "A user needs BitLocker and to join the company domain", answer: "Windows 11 Pro" }, detail: "BitLocker, gpedit.msc, domain join and hosting Remote Desktop need Pro or higher.", hook: "Home lacks business features.", wrong: { answer: ["Windows 11 Home", "Windows 10 Home", "Windows 11 Home N"] } },
    { id: "home-ed", fields: { scenario: "A family PC that joins no domain and needs no business features", answer: "Windows 11 Home" }, detail: "Home suits a personal PC that only needs a workgroup and no business features.", hook: "Home = personal, workgroup.", wrong: { answer: ["Windows 11 Enterprise", "Windows 10 Pro for Workstations", "Windows 11 Pro"] } },
    { id: "ent-ed", fields: { scenario: "A large organization licensing thousands of PCs through a volume agreement", answer: "Windows 11 Enterprise" }, detail: "Enterprise is licensed through volume agreements for large organizations.", hook: "Enterprise = volume licensing.", wrong: { answer: ["Windows 11 Home", "Windows 10 Home", "Windows 11 Home N"] } },
    { id: "win11-req", fields: { scenario: "An older PC fails the Windows 11 upgrade check", answer: "It lacks TPM 2.0 or UEFI support" }, detail: "Windows 11 requires TPM 2.0 and UEFI with Secure Boot capability.", hook: "Windows 11 = TPM 2.0 + UEFI.", wrong: { answer: ["It has less than 64 GB of RAM", "It uses an NTFS drive", "It is joined to a workgroup"] } },
    { id: "n-ed", fields: { scenario: "A Windows edition sold without the built-in media player apps", answer: "An N edition" }, detail: "N editions ship without the built-in media apps, for European regulations.", hook: "N = no media apps.", wrong: { answer: ["A Pro for Workstations edition", "An Enterprise edition", "A Home edition"] } },
    { id: "rdp-host", fields: { scenario: "A user wants other PCs to connect to their PC with Remote Desktop", answer: "Upgrade from Home to Pro" }, detail: "Home can connect out to Remote Desktop but cannot be the remote host.", hook: "Home can't host RDP.", wrong: { answer: ["Install a second NIC", "Switch from NTFS to exFAT", "Enable a recovery partition"] } },
  ],
};

const c2WindowsTools: DrillDeck = {
  id: "c2-windows-tools",
  certification: "A+ Core 2",
  exam: "220-1202",
  objective: "1.4",
  topic: "Windows tools",
  modes: [
    { id: "toolToPurpose", from: "tool", to: "purpose" },
    { id: "purposeToTool", from: "purpose", to: "tool" },
  ],
  tables: [
    { id: "tools", fields: ["tool", "purpose"] },
  ],
  items: [
    { id: "tm-startup", fields: { tool: "Task Manager › Startup", purpose: "Enable or disable apps that launch at sign-in" }, detail: "Disable apps that launch at sign-in to speed up boot.", hook: "Startup tab = boot slowness." },
    { id: "tm-proc", fields: { tool: "Task Manager › Processes", purpose: "Task Manager tab to end a frozen app and see per-app CPU and memory" }, detail: "End a frozen program or see what is using CPU and memory.", hook: "Processes = end task." },
    { id: "tm-perf", fields: { tool: "Task Manager › Performance", purpose: "Task Manager tab with live CPU, memory, disk, network and GPU graphs" }, detail: "Live graphs of CPU, memory, disk, network and GPU.", hook: "Performance = live graphs." },
    { id: "tm-users", fields: { tool: "Task Manager › Users", purpose: "See signed-in users and their resource use" }, detail: "Shows who is signed in and lets you sign a user out.", hook: "Users tab = who's on." },
    { id: "eventvwr", fields: { tool: "eventvwr.msc", purpose: "Event Viewer: system, application and security logs" }, detail: "Logs of errors, warnings and events from Windows and apps.", hook: "Event Viewer = the logs." },
    { id: "diskmgmt", fields: { tool: "diskmgmt.msc", purpose: "Disk Management: partitions, volumes and drive letters" }, detail: "Create, delete, format and resize partitions and assign drive letters.", hook: "Disk Management = partitions." },
    { id: "taskschd", fields: { tool: "taskschd.msc", purpose: "Task Scheduler: run tasks at set times or events" }, detail: "Run a program or script at a set time or event.", hook: "Task Scheduler = automate." },
    { id: "devmgmt", fields: { tool: "devmgmt.msc", purpose: "Device Manager: hardware and driver status" }, detail: "Update, roll back or disable drivers and see hardware errors.", hook: "Device Manager = drivers." },
    { id: "certmgr", fields: { tool: "certmgr.msc", purpose: "Certificate Manager: the user's certificates" }, detail: "View and manage the current user's digital certificates.", hook: "certmgr = certificates." },
    { id: "lusrmgr", fields: { tool: "lusrmgr.msc", purpose: "Local Users and Groups: local accounts and group membership" }, detail: "Create local accounts and manage local groups (Pro and higher).", hook: "lusrmgr = local users." },
    { id: "perfmon", fields: { tool: "perfmon.msc", purpose: "Performance Monitor: log counters over time" }, detail: "Log performance counters over time and build reports.", hook: "perfmon = long-term counters." },
    { id: "gpedit", fields: { tool: "gpedit.msc", purpose: "Group Policy Editor: local policy settings" }, detail: "Edit local Group Policy settings (Pro and higher).", hook: "gpedit = local policy." },
    { id: "msinfo32", fields: { tool: "msinfo32.exe", purpose: "System Information: hardware and software summary" }, detail: "Full summary of hardware, components and software environment.", hook: "msinfo32 = system summary." },
    { id: "resmon", fields: { tool: "resmon.exe", purpose: "Resource Monitor: detailed per-process resource activity" }, detail: "Detailed per-process CPU, memory, disk and network activity.", hook: "resmon = detailed resources." },
    { id: "msconfig", fields: { tool: "msconfig.exe", purpose: "System Configuration: boot options such as Safe boot" }, detail: "Choose boot options such as Safe boot and manage services at startup.", hook: "msconfig = boot options." },
    { id: "cleanmgr", fields: { tool: "cleanmgr.exe", purpose: "Disk Cleanup: remove temporary and unneeded files" }, detail: "Remove temporary files and other unneeded data to free space.", hook: "cleanmgr = free space." },
    { id: "dfrgui", fields: { tool: "dfrgui.exe", purpose: "Defragment and Optimize Drives" }, detail: "Defragment hard drives and optimize (TRIM) SSDs.", hook: "dfrgui = optimize drives." },
    { id: "regedit", fields: { tool: "regedit.exe", purpose: "Registry Editor: edit registry keys and values" }, detail: "Directly edit registry keys and values; back up first.", hook: "regedit = registry." },
  ],
};

const c2CommandLine: DrillDeck = {
  id: "c2-command-line",
  certification: "A+ Core 2",
  exam: "220-1202",
  objective: "1.5",
  topic: "Windows command line",
  modes: [
    { id: "commandToPurpose", from: "command", to: "purpose" },
    { id: "purposeToCommand", from: "purpose", to: "command" },
  ],
  tables: [
    { id: "commands", fields: ["command", "purpose"] },
  ],
  items: [
    { id: "cd", fields: { command: "cd", purpose: "Change the current directory" }, detail: "Moves between folders.", hook: "cd = change directory." },
    { id: "dir", fields: { command: "dir", purpose: "List the contents of a directory" }, detail: "Shows the files and folders in a directory.", hook: "dir = directory listing." },
    { id: "ipconfig", fields: { command: "ipconfig", purpose: "Show and renew IP address settings" }, detail: "Shows IP, mask, gateway and DNS; /release and /renew get a new DHCP lease.", hook: "ipconfig = IP settings." },
    { id: "ping", fields: { command: "ping", purpose: "Test whether a host is reachable" }, detail: "Sends ICMP echo requests to test reachability.", hook: "ping = can I reach it?" },
    { id: "netstat", fields: { command: "netstat", purpose: "Show active connections and listening ports" }, detail: "Lists active connections and listening ports.", hook: "netstat = connections." },
    { id: "nslookup", fields: { command: "nslookup", purpose: "Query DNS to resolve names" }, detail: "Queries DNS to test name resolution.", hook: "nslookup = DNS." },
    { id: "netuse", fields: { command: "net use", purpose: "Map a drive letter to a network share" }, detail: "Connects a drive letter to a network share.", hook: "net use = map a drive." },
    { id: "tracert", fields: { command: "tracert", purpose: "Show each hop on the route to a host, without per-hop loss statistics" }, detail: "Lists each router hop to a destination.", hook: "tracert = the route." },
    { id: "pathping", fields: { command: "pathping", purpose: "Trace the route and measure packet loss per hop" }, detail: "Combines ping and tracert and measures loss at each hop.", hook: "pathping = route plus loss." },
    { id: "chkdsk", fields: { command: "chkdsk", purpose: "Check a disk's file system for errors" }, detail: "Checks the file system and disk for errors; /f fixes, /r finds bad sectors.", hook: "chkdsk = check disk." },
    { id: "format", fields: { command: "format", purpose: "Format a volume with a file system" }, detail: "Creates a file system on a volume, erasing its contents.", hook: "format = new file system." },
    { id: "diskpart", fields: { command: "diskpart", purpose: "Manage disks, partitions and volumes from the command line" }, detail: "Command-line partition and volume management.", hook: "diskpart = partitions by command." },
    { id: "md", fields: { command: "md", purpose: "Create a directory" }, detail: "Creates a new directory.", hook: "md = make directory." },
    { id: "rmdir", fields: { command: "rmdir", purpose: "Remove a directory" }, detail: "Deletes a directory; it must be empty unless /s is used.", hook: "rmdir = remove directory." },
    { id: "robocopy", fields: { command: "robocopy", purpose: "Robust copy and mirroring of folders" }, detail: "Robust copy that can mirror folders and resume after interruptions.", hook: "robocopy = robust copy." },
    { id: "hostname", fields: { command: "hostname", purpose: "Display the computer's name" }, detail: "Prints the computer's name.", hook: "hostname = my name." },
    { id: "netuser", fields: { command: "net user", purpose: "Manage or list user accounts" }, detail: "Lists, adds or changes user accounts.", hook: "net user = accounts." },
    { id: "winver", fields: { command: "winver", purpose: "Show the Windows version and build" }, detail: "Opens a window showing the Windows version and build.", hook: "winver = Windows version." },
    { id: "whoami", fields: { command: "whoami", purpose: "Show the current signed-in user" }, detail: "Shows the signed-in user name (and groups with /groups).", hook: "whoami = who am I." },
    { id: "help", fields: { command: "[command] /?", purpose: "Show help and options for a command" }, detail: "Adding /? to a command shows its help and switches.", hook: "/? = help." },
    { id: "gpupdate", fields: { command: "gpupdate", purpose: "Refresh Group Policy settings now" }, detail: "Applies Group Policy changes now; /force reapplies all.", hook: "gpupdate = refresh policy." },
    { id: "gpresult", fields: { command: "gpresult", purpose: "Show the Group Policy settings that apply" }, detail: "Shows which Group Policy settings apply to a user or computer.", hook: "gpresult = policy results." },
    { id: "sfc", fields: { command: "sfc", purpose: "Scan and repair protected Windows system files" }, detail: "System File Checker: sfc /scannow repairs protected system files.", hook: "sfc = system files." },
  ],
};

const c2WindowsSettings: DrillDeck = {
  id: "c2-windows-settings",
  certification: "A+ Core 2",
  exam: "220-1202",
  objective: "1.6, 1.7",
  topic: "Windows settings and networking",
  modes: [
    { id: "scenarioToAnswer", from: "scenario", to: "answer" },
    { id: "termToMeaning", from: "term", to: "meaning" },
  ],
  tables: [
    { id: "scenarios", fields: ["scenario", "answer"] },
    { id: "terms", fields: ["term", "meaning"] },
  ],
  items: [
    { id: "s-hidden", fields: { scenario: "Show hidden files and file extensions", answer: "File Explorer Options" }, detail: "View hidden files and file extensions in File Explorer Options.", hook: "Hidden files = File Explorer Options." },
    { id: "s-power", fields: { scenario: "Change what closing the laptop lid does", answer: "Power Options" }, detail: "Sleep, hibernate, lid action and fast startup live in Power Options.", hook: "Lid and sleep = Power Options." },
    { id: "s-index", fields: { scenario: "Add a folder so Windows Search finds its files quickly", answer: "Indexing Options" }, detail: "Indexing Options controls which locations Windows Search indexes.", hook: "Search speed = Indexing Options." },
    { id: "s-firewall", fields: { scenario: "Allow one app through the firewall", answer: "Windows Defender Firewall" }, detail: "Allow or block an app through the firewall.", hook: "App exceptions = Firewall." },
    { id: "s-programs", fields: { scenario: "Uninstall a desktop program or turn on a Windows feature", answer: "Programs and Features" }, detail: "Uninstall or repair desktop programs and turn Windows features on or off.", hook: "Uninstall = Programs and Features." },
    { id: "s-ease", fields: { scenario: "Turn on the magnifier and high-contrast mode", answer: "Ease of Access" }, detail: "Accessibility options such as magnifier, narrator and high contrast.", hook: "Accessibility = Ease of Access." },
    { id: "s-time", fields: { scenario: "Change the time zone and display language", answer: "Time and Language" }, detail: "Time zone, date format and display language.", hook: "Clock and language = Time and Language." },
    { id: "s-update", fields: { scenario: "Pause Windows updates or open recovery options", answer: "Update and Security" }, detail: "Windows Update and recovery options live under Update and Security.", hook: "Updates = Update and Security." },
    { id: "s-internet", fields: { scenario: "Configure legacy internet security zones", answer: "Internet Options" }, detail: "Legacy browser and proxy options, security zones and certificates.", hook: "Internet Options = legacy browser settings." },
    { id: "s-usb", fields: { scenario: "A USB device keeps disconnecting to save power", answer: "USB selective suspend in Power Options" }, detail: "Stops Windows from powering down USB ports to save energy.", hook: "USB drops = selective suspend.", wrong: { answer: ["Indexing Options", "File Explorer Options", "Time and Language"] } },
    { id: "t-domain", fields: { term: "Domain", meaning: "Centrally managed network where a server controls accounts and policy" }, detail: "Central accounts and policy managed by a domain controller.", hook: "Domain = central control." },
    { id: "t-workgroup", fields: { term: "Workgroup", meaning: "Peer network where each computer manages its own accounts" }, detail: "Each PC keeps its own accounts; no central server.", hook: "Workgroup = every PC on its own." },
    { id: "t-public", fields: { term: "Public network profile", meaning: "Untrusted network: discovery and sharing turned off" }, detail: "Network discovery is off; use on untrusted networks such as cafés.", hook: "Public = hide the PC." },
    { id: "t-private", fields: { term: "Private network profile", meaning: "Trusted network: discovery and file sharing allowed" }, detail: "Discovery and sharing allowed on a trusted home or office network.", hook: "Private = trusted." },
    { id: "t-metered", fields: { term: "Metered connection", meaning: "Connection marked to limit background data use" }, detail: "Limits background data such as updates on capped connections.", hook: "Metered = save data." },
    { id: "t-proxy", fields: { term: "Proxy settings", meaning: "Send web traffic through an intermediary server" }, detail: "Sends web traffic through an intermediary server.", hook: "Proxy = go through a middleman." },
    { id: "t-mapped", fields: { term: "Mapped drive", meaning: "Drive letter connected to a shared network folder" }, detail: "A drive letter that points to a network share.", hook: "Mapped drive = letter to a share." },
    { id: "t-static", fields: { term: "Static IP address", meaning: "Address, mask, gateway and DNS entered manually" }, detail: "Address entered by hand instead of from DHCP.", hook: "Static = typed in." },
    { id: "t-wwan", fields: { term: "WWAN connection", meaning: "Network connection over a cellular data service" }, detail: "Connects through a cellular data network.", hook: "WWAN = cellular." },
  ],
};

const c2Macos: DrillDeck = {
  id: "c2-macos",
  certification: "A+ Core 2",
  exam: "220-1202",
  objective: "1.8",
  topic: "macOS",
  modes: [
    { id: "toolToPurpose", from: "tool", to: "purpose" },
    { id: "purposeToTool", from: "purpose", to: "tool" },
  ],
  tables: [
    { id: "tools", fields: ["tool", "purpose"] },
  ],
  items: [
    { id: "timemachine", fields: { tool: "Time Machine", purpose: "Automatic versioned backups" }, detail: "Automatic, versioned backups to an external or network drive.", hook: "Time Machine = backups." },
    { id: "filevault", fields: { tool: "FileVault", purpose: "Full-disk encryption" }, detail: "Encrypts the whole startup disk.", hook: "FileVault = disk encryption." },
    { id: "keychain", fields: { tool: "Keychain", purpose: "Stores passwords and certificates" }, detail: "Stores passwords, keys and certificates.", hook: "Keychain = passwords." },
    { id: "spotlight", fields: { tool: "Spotlight", purpose: "Search for files, apps and settings" }, detail: "Searches files, apps and settings (Command+Space).", hook: "Spotlight = search." },
    { id: "mission", fields: { tool: "Mission Control", purpose: "View all open windows and desktops" }, detail: "Shows every open window and desktop at once.", hook: "Mission Control = all windows." },
    { id: "diskutil", fields: { tool: "Disk Utility", purpose: "Repair, erase and partition drives" }, detail: "Repairs (First Aid), erases and partitions drives.", hook: "Disk Utility = drive repair." },
    { id: "forcequit", fields: { tool: "Force Quit", purpose: "Close an unresponsive app" }, detail: "Closes a frozen app (Command+Option+Esc).", hook: "Force Quit = end a frozen app." },
    { id: "terminal", fields: { tool: "Terminal", purpose: "Command-line access to macOS" }, detail: "Command-line shell for macOS.", hook: "Terminal = command line." },
    { id: "continuity", fields: { tool: "Continuity", purpose: "Continue work across Apple devices" }, detail: "Moves work between a Mac and an iPhone or iPad (Handoff, shared clipboard).", hook: "Continuity = across Apple devices." },
    { id: "finder", fields: { tool: "Finder", purpose: "Browse and manage files" }, detail: "The macOS file manager.", hook: "Finder = File Explorer." },
    { id: "dock", fields: { tool: "Dock", purpose: "Launch and switch between apps" }, detail: "Bar for launching and switching apps.", hook: "Dock = taskbar." },
    { id: "dmg", fields: { tool: ".dmg file", purpose: "Mountable disk image used to distribute apps" }, detail: "A mountable disk image that usually contains an app to drag to /Applications.", hook: "dmg = disk image." },
    { id: "pkg", fields: { tool: ".pkg file", purpose: "Installer package that runs an install wizard" }, detail: "An installer package that runs install steps.", hook: "pkg = installer." },
    { id: "app", fields: { tool: ".app bundle", purpose: "The application itself, stored in /Applications" }, detail: "The application bundle itself; delete it from /Applications to uninstall.", hook: "app = the app." },
    { id: "rsr", fields: { tool: "Rapid Security Response", purpose: "Quick security fixes between full updates" }, detail: "Small security fixes delivered between full updates.", hook: "RSR = quick security patch." },
    { id: "icloud", fields: { tool: "iCloud", purpose: "Apple cloud sync for messages, files and settings" }, detail: "Apple's cloud for iMessage, FaceTime and iCloud Drive syncing.", hook: "iCloud = Apple cloud sync." },
  ],
};

const c2Linux: DrillDeck = {
  id: "c2-linux",
  certification: "A+ Core 2",
  exam: "220-1202",
  objective: "1.9",
  topic: "Linux",
  modes: [
    { id: "commandToPurpose", from: "command", to: "purpose" },
    { id: "purposeToCommand", from: "purpose", to: "command" },
  ],
  tables: [
    { id: "commands", fields: ["command", "purpose"] },
  ],
  items: [
    { id: "ls", fields: { command: "ls", purpose: "List directory contents" }, detail: "Lists the files in a directory.", hook: "ls = list." },
    { id: "pwd", fields: { command: "pwd", purpose: "Show the current directory path" }, detail: "Prints the full path of the current directory.", hook: "pwd = where am I." },
    { id: "mv", fields: { command: "mv", purpose: "Move or rename a file" }, detail: "Moves or renames files.", hook: "mv = move or rename." },
    { id: "cp", fields: { command: "cp", purpose: "Copy a file" }, detail: "Copies files.", hook: "cp = copy." },
    { id: "rm", fields: { command: "rm", purpose: "Delete a file" }, detail: "Deletes files.", hook: "rm = remove." },
    { id: "chmod", fields: { command: "chmod", purpose: "Change file permissions" }, detail: "Changes read, write and execute permissions.", hook: "chmod = change mode." },
    { id: "chown", fields: { command: "chown", purpose: "Change a file's owner" }, detail: "Changes the owner of a file.", hook: "chown = change owner." },
    { id: "grep", fields: { command: "grep", purpose: "Search text for a pattern" }, detail: "Searches text for a pattern.", hook: "grep = find text." },
    { id: "find", fields: { command: "find", purpose: "Search for files by name or attributes" }, detail: "Searches the filesystem for files by name or other attributes.", hook: "find = find files." },
    { id: "fsck", fields: { command: "fsck", purpose: "Check and repair a filesystem" }, detail: "Checks and repairs a Linux filesystem.", hook: "fsck = filesystem check." },
    { id: "mount", fields: { command: "mount", purpose: "Attach a filesystem to the directory tree" }, detail: "Attaches a filesystem to a directory.", hook: "mount = attach a drive." },
    { id: "su", fields: { command: "su", purpose: "Switch to another user account" }, detail: "Switches to another user account, root by default.", hook: "su = switch user." },
    { id: "sudo", fields: { command: "sudo", purpose: "Run a single command as root" }, detail: "Runs one command with root privileges.", hook: "sudo = one command as root." },
    { id: "apt", fields: { command: "apt", purpose: "Install packages on Debian or Ubuntu" }, detail: "Package manager on Debian and Ubuntu.", hook: "apt = Debian/Ubuntu." },
    { id: "dnf", fields: { command: "dnf", purpose: "Install packages on Fedora or Red Hat" }, detail: "Package manager on Fedora and Red Hat.", hook: "dnf = Fedora/Red Hat." },
    { id: "ip", fields: { command: "ip", purpose: "Show and configure network interfaces" }, detail: "Shows and configures network interfaces and addresses.", hook: "ip = interfaces." },
    { id: "curl", fields: { command: "curl", purpose: "Transfer data from or to a URL" }, detail: "Transfers data to or from a URL.", hook: "curl = fetch a URL." },
    { id: "dig", fields: { command: "dig", purpose: "Query DNS records" }, detail: "Queries DNS servers.", hook: "dig = DNS lookup." },
    { id: "traceroute", fields: { command: "traceroute", purpose: "Show each hop to a destination" }, detail: "Lists each hop to a host.", hook: "traceroute = Linux tracert." },
    { id: "man", fields: { command: "man", purpose: "Show a command's manual page" }, detail: "Shows the manual page for a command.", hook: "man = manual." },
    { id: "cat", fields: { command: "cat", purpose: "Display a file's contents" }, detail: "Prints a file's contents.", hook: "cat = show a file." },
    { id: "top", fields: { command: "top", purpose: "Live view of running processes and load" }, detail: "Live view of processes and resource use.", hook: "top = live processes." },
    { id: "ps", fields: { command: "ps", purpose: "List running processes" }, detail: "Snapshot list of running processes.", hook: "ps = process list." },
    { id: "du", fields: { command: "du", purpose: "Show space used by files and directories" }, detail: "Shows how much space files and directories use.", hook: "du = disk usage." },
    { id: "df", fields: { command: "df", purpose: "Show free space on filesystems" }, detail: "Shows free space on mounted filesystems.", hook: "df = disk free." },
    { id: "nano", fields: { command: "nano", purpose: "Edit a text file in the terminal" }, detail: "A simple terminal text editor.", hook: "nano = text editor." },
    { id: "passwd", fields: { command: "/etc/passwd", purpose: "File listing user accounts" }, detail: "User account list.", hook: "passwd = accounts." },
    { id: "shadow", fields: { command: "/etc/shadow", purpose: "File holding hashed passwords" }, detail: "Hashed passwords, readable only by root.", hook: "shadow = password hashes." },
    { id: "hosts", fields: { command: "/etc/hosts", purpose: "File with local hostname-to-IP mappings" }, detail: "Local name-to-IP mappings checked before DNS.", hook: "hosts = local names." },
    { id: "fstab", fields: { command: "/etc/fstab", purpose: "File listing filesystems to mount at boot" }, detail: "Filesystems to mount at boot.", hook: "fstab = mounts at boot." },
    { id: "resolv", fields: { command: "/etc/resolv.conf", purpose: "File listing the DNS servers to use" }, detail: "DNS servers the system uses.", hook: "resolv.conf = DNS servers." },
  ],
};

const c2AppsCloud: DrillDeck = {
  id: "c2-apps-cloud",
  certification: "A+ Core 2",
  exam: "220-1202",
  objective: "1.10, 1.11",
  topic: "Installing apps and cloud productivity",
  modes: [
    { id: "scenarioToAnswer", from: "scenario", to: "answer" },
    { id: "termToMeaning", from: "term", to: "meaning" },
  ],
  tables: [
    { id: "scenarios", fields: ["scenario", "answer"] },
    { id: "terms", fields: ["term", "meaning"] },
  ],
  items: [
    { id: "a-64", fields: { scenario: "A 64-bit application will not install on a PC", answer: "The PC runs a 32-bit operating system" }, detail: "A 64-bit app cannot run on a 32-bit OS; 32-bit apps usually run on 64-bit Windows.", hook: "64-bit app needs a 64-bit OS.", wrong: { answer: ["The PC has a dedicated graphics card", "The installer is an ISO file", "The PC is joined to a domain"] } },
    { id: "a-vram", fields: { scenario: "A video-editing app requires 4 GB of VRAM", answer: "Check the graphics card's dedicated memory" }, detail: "Graphics-heavy apps list VRAM needs; integrated graphics share system RAM.", hook: "Graphics apps check VRAM.", wrong: { answer: ["Add a second hard drive", "Increase the virtual memory size", "Switch the filesystem to exFAT"] } },
    { id: "a-iso", fields: { scenario: "Install software from a downloaded disc image without a DVD drive", answer: "Mount the ISO file" }, detail: "An ISO can be mounted as a virtual drive, with no physical disc needed.", hook: "ISO = mountable image.", wrong: { answer: ["Burn the ISO to a USB hub", "Rename the ISO to .exe", "Extract it with Disk Cleanup"] } },
    { id: "a-token", fields: { scenario: "Licensed engineering software only runs when a USB key is plugged in", answer: "It requires an external hardware token" }, detail: "Some licensed apps need a physical security key or dongle to run.", hook: "Dongle = hardware token.", wrong: { answer: ["It requires a dedicated graphics card", "It requires an image deployment", "It requires a metered connection"] } },
    { id: "a-impact", fields: { scenario: "Before rolling out a new app to every PC, what should be reviewed?", answer: "Its impact on devices, network, operations and the business" }, detail: "Check effects on the device, network, operations and business before rolling out.", hook: "Think about impact first.", wrong: { answer: ["Only the app's file size", "Only the user's wallpaper settings", "Only the screen resolution"] } },
    { id: "c-sync", fields: { scenario: "A user wants only one OneDrive folder stored offline on a laptop", answer: "Adjust the storage sync/folder settings" }, detail: "Controls which cloud folders are kept offline on each device.", hook: "Sync settings = what's offline.", wrong: { answer: ["Change the email system", "Assign a new license", "Turn off identity synchronization"] } },
    { id: "c-license", fields: { scenario: "A new hire can sign in but the cloud office apps will not activate", answer: "Assign the user a license" }, detail: "Each user needs a license assigned before the cloud apps activate.", hook: "No license, no apps.", wrong: { answer: ["Enable identity synchronization for printers", "Install a .dmg file", "Turn on a metered connection"] } },
    { id: "c-identity", fields: { scenario: "Users want the same sign-in for on-premises PCs and cloud apps", answer: "Identity synchronization" }, detail: "Keeps on-premises directory accounts and cloud accounts in sync, so one password works.", hook: "Identity sync = same account everywhere.", wrong: { answer: ["Licensing assignment", "Image deployment", "A recovery partition"] } },
    { id: "t-collab", fields: { term: "Collaboration tools", meaning: "Shared documents, video meetings and instant messaging" }, detail: "Shared spreadsheets, documents, presentations, video calls and chat.", hook: "Collaboration = work together live." },
    { id: "t-email", fields: { term: "Cloud email system", meaning: "Hosted mailboxes, calendars and contacts" }, detail: "Hosted mailboxes, calendars and contacts.", hook: "Email system = hosted mail." },
    { id: "t-image", fields: { term: "Image deployment (apps)", meaning: "Installing apps as part of a standard system image" }, detail: "A prepared install image pushed to many devices.", hook: "Image = same build everywhere." },
    { id: "t-download", fields: { term: "Downloadable package", meaning: "Installer file downloaded from the vendor" }, detail: "A downloadable installer package from the vendor.", hook: "Download = installer file." },
    { id: "t-compat", fields: { term: "Application to OS compatibility", meaning: "Whether the app supports the installed OS version" }, detail: "The app must support the installed OS version.", hook: "Check OS support first." },
  ],
};

const c2SecurityMeasures: DrillDeck = {
  id: "c2-security-measures",
  certification: "A+ Core 2",
  exam: "220-1202",
  objective: "2.1",
  topic: "Security measures",
  modes: [
    { id: "termToMeaning", from: "term", to: "meaning" },
    { id: "meaningToTerm", from: "meaning", to: "term" },
  ],
  tables: [
    { id: "terms", fields: ["term", "meaning"] },
  ],
  items: [
    { id: "bollards", fields: { term: "Bollards", meaning: "Posts that block vehicles from reaching a building" }, detail: "Short posts that stop vehicles from reaching a building.", hook: "Bollards = stop cars." },
    { id: "vestibule", fields: { term: "Access control vestibule", meaning: "Two-door entry where only one door opens at a time" }, detail: "Two doors where only one opens at a time, stopping tailgating.", hook: "Vestibule = one door at a time." },
    { id: "badge", fields: { term: "Badge reader", meaning: "Reads ID badges to grant and log entry" }, detail: "Reads an ID badge to unlock a door and log entry.", hook: "Badge reader = swipe in." },
    { id: "magnetometer", fields: { term: "Magnetometer", meaning: "Metal detector at an entry checkpoint" }, detail: "Detects metal objects, such as at a security checkpoint.", hook: "Magnetometer = metal detector." },
    { id: "fob", fields: { term: "Key fob", meaning: "Small proximity token that unlocks doors" }, detail: "A small key-ring token that unlocks doors by proximity.", hook: "Fob = tap to open." },
    { id: "smartcard", fields: { term: "Smart card", meaning: "Chip card that stores sign-in credentials" }, detail: "A card with a chip that stores credentials for sign-in.", hook: "Smart card = chip credential." },
    { id: "mobilekey", fields: { term: "Mobile digital key", meaning: "Smartphone used as a door or car key" }, detail: "A phone acts as the door key.", hook: "Phone = key." },
    { id: "leastpriv", fields: { term: "Principle of least privilege", meaning: "Users get only the access their job requires" }, detail: "Give users only the access their job needs.", hook: "Least privilege = only what you need." },
    { id: "zerotrust", fields: { term: "Zero Trust", meaning: "Never trust by location; verify every request" }, detail: "Never trust by default; verify every user and device every time.", hook: "Zero trust = always verify." },
    { id: "acl", fields: { term: "Access control list (ACL)", meaning: "Rules that permit or deny access to a resource" }, detail: "Rules that permit or deny access to a resource.", hook: "ACL = allow/deny list." },
    { id: "mfa", fields: { term: "Multifactor authentication (MFA)", meaning: "Sign-in with two or more different factor types" }, detail: "Two or more different factor types, such as a password plus a phone code.", hook: "MFA = more than one factor type." },
    { id: "totp", fields: { term: "TOTP", meaning: "One-time code that changes with the time" }, detail: "A code that changes every 30 seconds or so, generated from the time.", hook: "TOTP = time-based code." },
    { id: "otp", fields: { term: "One-time password (OTP)", meaning: "Single-use code sent by SMS, email or voice call" }, detail: "A code that works only once.", hook: "OTP = one use." },
    { id: "saml", fields: { term: "SAML", meaning: "Standard for passing sign-in between an identity provider and web apps" }, detail: "Passes authentication between an identity provider and a web service.", hook: "SAML = web SSO standard." },
    { id: "sso", fields: { term: "Single sign-on (SSO)", meaning: "One sign-in grants access to many systems" }, detail: "One sign-in gives access to many systems.", hook: "SSO = sign in once." },
    { id: "jit", fields: { term: "Just-in-time access / PAM", meaning: "Temporary elevated access granted only when needed" }, detail: "Elevated rights granted only when needed and only for a short time.", hook: "JIT = temporary admin." },
    { id: "mdm", fields: { term: "Mobile device management (MDM)", meaning: "Central control of policies and apps on mobile devices" }, detail: "Centrally enforces policies and apps on phones and tablets.", hook: "MDM = manage mobiles." },
    { id: "dlp", fields: { term: "Data loss prevention (DLP)", meaning: "Blocks sensitive data from leaving the organization" }, detail: "Detects and blocks sensitive data leaving the organization.", hook: "DLP = stop data leaks." },
    { id: "iam", fields: { term: "Identity access management (IAM)", meaning: "Manages user identities and their access rights" }, detail: "Manages identities and what each one can access.", hook: "IAM = who and what." },
    { id: "directory", fields: { term: "Directory services", meaning: "Central database of users, groups and computers" }, detail: "A central database of users and computers, such as Active Directory.", hook: "Directory = central accounts." },
    { id: "biometric", fields: { term: "Biometrics", meaning: "Sign-in using a physical trait such as a fingerprint" }, detail: "Retina, fingerprint, palm, face or voice used to sign in.", hook: "Biometrics = something you are." },
  ],
};

const c2WindowsSecurity: DrillDeck = {
  id: "c2-windows-security",
  certification: "A+ Core 2",
  exam: "220-1202",
  objective: "2.2",
  topic: "Windows security settings",
  modes: [
    { id: "scenarioToAnswer", from: "scenario", to: "answer" },
    { id: "termToMeaning", from: "term", to: "meaning" },
  ],
  tables: [
    { id: "scenarios", fields: ["scenario", "answer"] },
    { id: "terms", fields: ["term", "meaning"] },
  ],
  items: [
    { id: "s-bitlocker", fields: { scenario: "Encrypt the entire internal drive of a stolen-prone laptop", answer: "BitLocker" }, detail: "BitLocker encrypts an entire internal volume.", hook: "Whole drive = BitLocker." },
    { id: "s-togo", fields: { scenario: "Encrypt a USB flash drive", answer: "BitLocker To Go" }, detail: "BitLocker To Go encrypts removable drives.", hook: "USB drive = BitLocker To Go." },
    { id: "s-efs", fields: { scenario: "Encrypt one folder so only one user account can open it", answer: "Encrypting File System (EFS)" }, detail: "EFS encrypts individual files and folders on NTFS for one user.", hook: "Single files = EFS." },
    { id: "s-hello", fields: { scenario: "Sign in with face recognition instead of a password", answer: "Windows Hello" }, detail: "Windows Hello signs in with a PIN, face or fingerprint instead of a password.", hook: "Passwordless = Windows Hello." },
    { id: "s-uac", fields: { scenario: "Prompt for approval before a program makes system-wide changes", answer: "User Account Control (UAC)" }, detail: "UAC asks for approval before changes that need admin rights.", hook: "Admin prompt = UAC." },
    { id: "s-runas", fields: { scenario: "A standard user needs to run one installer with admin rights", answer: "Run as administrator" }, detail: "Run as administrator elevates only that one program.", hook: "One elevated app = Run as administrator." },
    { id: "s-defs", fields: { scenario: "Defender is enabled but misses new threats", answer: "Update the Defender definitions" }, detail: "Keep Defender definitions current so it recognizes new threats.", hook: "New threats = update definitions." },
    { id: "s-port", fields: { scenario: "Allow inbound traffic for one service only", answer: "Create a firewall port or application rule" }, detail: "Allow only the port a service needs through the firewall.", hook: "Firewall = port and app rules." },
    { id: "s-gpo", fields: { scenario: "Apply the same password rules to every domain computer", answer: "Apply a Group Policy" }, detail: "Group Policy pushes the same settings to many domain users or computers.", hook: "Many PCs, same setting = Group Policy." },
    { id: "s-redirect", fields: { scenario: "Store each user's Documents folder on a file server automatically", answer: "Configure folder redirection" }, detail: "Folder redirection stores a user's Documents on a server.", hook: "Docs on the server = folder redirection." },
    { id: "s-logon", fields: { scenario: "Map department drives automatically when users sign in", answer: "Assign a log-in script" }, detail: "A log-in script runs at sign-in, for example to map drives.", hook: "Map at sign-in = log-in script." },
    { id: "s-ou", fields: { scenario: "Group the accounting computers in Active Directory so one policy can target only them", answer: "Move them into an organizational unit" }, detail: "Organizational units group objects so policies apply to them.", hook: "Group objects = OUs." },
    { id: "t-ntfsshare", fields: { term: "NTFS vs. share permissions", meaning: "When both apply over the network, the most restrictive wins" }, detail: "Share permissions apply only over the network; the most restrictive combination wins.", hook: "Share + NTFS = most restrictive." },
    { id: "t-inherit", fields: { term: "Permission inheritance", meaning: "Files and subfolders receive the parent folder's permissions" }, detail: "Child folders take permissions from their parent by default.", hook: "Inheritance = from the parent." },
    { id: "t-standard", fields: { term: "Standard account", meaning: "Everyday account without system-wide admin rights" }, detail: "Can use apps and change their own settings but not system-wide settings.", hook: "Standard = everyday use." },
    { id: "t-admin", fields: { term: "Administrator account", meaning: "Account with full control of the computer" }, detail: "Full control of the computer.", hook: "Administrator = full control." },
    { id: "t-guest", fields: { term: "Guest account", meaning: "Limited temporary account that should be disabled" }, detail: "Temporary, limited access; disable it on business PCs.", hook: "Guest = limited, disable it." },
    { id: "t-msacct", fields: { term: "Microsoft account", meaning: "Online account that syncs settings across devices" }, detail: "Signs in with an online Microsoft account that syncs settings.", hook: "Microsoft account = cloud sync." },
    { id: "t-local", fields: { term: "Local account", meaning: "Account that exists only on one computer" }, detail: "Exists only on that one computer.", hook: "Local = this PC only." },
  ],
};

const c2WirelessAuth: DrillDeck = {
  id: "c2-wireless-auth",
  certification: "A+ Core 2",
  exam: "220-1202",
  objective: "2.3",
  topic: "Wireless security and authentication",
  modes: [
    { id: "termToMeaning", from: "term", to: "meaning" },
    { id: "meaningToTerm", from: "meaning", to: "term" },
  ],
  tables: [
    { id: "terms", fields: ["term", "meaning"] },
  ],
  items: [
    { id: "wpa2", fields: { term: "WPA2", meaning: "AES-based Wi-Fi security using a pre-shared key or 802.1X" }, detail: "AES-based encryption; Personal uses a pre-shared key, Enterprise uses 802.1X.", hook: "WPA2 = AES." },
    { id: "wpa3", fields: { term: "WPA3", meaning: "Newest Wi-Fi security; Personal mode protects the passphrase exchange with SAE" }, detail: "WPA3-Personal replaces the PSK handshake with SAE (still a shared passphrase); WPA3-Enterprise adds an optional 192-bit mode.", hook: "WPA3 = SAE, newest." },
    { id: "tkip", fields: { term: "TKIP", meaning: "Legacy WPA encryption that is now insecure" }, detail: "Legacy WPA encryption; insecure and deprecated.", hook: "TKIP = old, avoid." },
    { id: "aes", fields: { term: "AES", meaning: "Strong encryption cipher used by WPA2 and WPA3" }, detail: "The strong cipher used by WPA2 and WPA3.", hook: "AES = the strong cipher." },
    { id: "radius", fields: { term: "RADIUS", meaning: "Central authentication over UDP that encrypts only the password" }, detail: "Centralized authentication over UDP; encrypts only the password.", hook: "RADIUS = UDP, password only." },
    { id: "tacacs", fields: { term: "TACACS+", meaning: "Central authentication over TCP that encrypts the entire payload" }, detail: "Cisco-designed, uses TCP 49 and encrypts the whole payload, separating AAA.", hook: "TACACS+ = TCP, all encrypted." },
    { id: "kerberos", fields: { term: "Kerberos", meaning: "Ticket-based authentication used in Windows domains" }, detail: "Ticket-based authentication used by Active Directory domains.", hook: "Kerberos = tickets." },
    { id: "mfa-w", fields: { term: "Multifactor (wireless)", meaning: "Combining two different factor types to join the network" }, detail: "Combines factors, for example a password plus a certificate or code.", hook: "Multifactor = two kinds." },
    { id: "enterprise", fields: { term: "WPA2/WPA3-Enterprise", meaning: "Wi-Fi mode where each user joins with their own 802.1X credentials" }, detail: "Each user signs in with their own credentials through a RADIUS server.", hook: "Enterprise = per-user logins." },
    { id: "personal", fields: { term: "WPA2/WPA3-Personal", meaning: "Everyone uses the same shared passphrase" }, detail: "Everyone shares one passphrase.", hook: "Personal = shared passphrase." },
  ],
};

const c2Malware: DrillDeck = {
  id: "c2-malware",
  certification: "A+ Core 2",
  exam: "220-1202",
  objective: "2.4, 2.6",
  topic: "Malware and malware removal",
  modes: [
    { id: "termToMeaning", from: "term", to: "meaning" },
    { id: "meaningToTerm", from: "meaning", to: "term" },
    { id: "stepToAction", from: "step", to: "action" },
  ],
  tables: [
    { id: "terms", fields: ["term", "meaning"] },
    { id: "steps", fields: ["step", "action"] },
  ],
  items: [
    { id: "trojan", fields: { term: "Trojan", meaning: "Malware disguised as legitimate software" }, detail: "Looks like legitimate software but carries malware.", hook: "Trojan = disguised." },
    { id: "rootkit", fields: { term: "Rootkit", meaning: "Malware hiding deep in the OS to avoid detection" }, detail: "Hides deep in the OS or firmware and conceals itself from tools.", hook: "Rootkit = hides at the core." },
    { id: "virus", fields: { term: "Virus", meaning: "Malware that attaches to files and spreads when they run" }, detail: "Attaches to files and spreads when the host file runs.", hook: "Virus = needs a host file." },
    { id: "spyware", fields: { term: "Spyware", meaning: "Secretly collects information about the user" }, detail: "Secretly gathers information about the user.", hook: "Spyware = watches you.", wrong: { term: ["Ransomware", "Cryptominer", "Boot sector virus"], meaning: ["Encrypts files and demands payment", "Uses system resources to mine cryptocurrency", "Infects the boot sector and runs before the OS"] } },
    { id: "ransomware", fields: { term: "Ransomware", meaning: "Encrypts files and demands payment" }, detail: "Encrypts files and demands payment for the key.", hook: "Ransomware = pay to unlock." },
    { id: "keylogger", fields: { term: "Keylogger", meaning: "Records keystrokes to steal passwords" }, detail: "Records keystrokes to capture passwords.", hook: "Keylogger = records typing.", wrong: { term: ["Ransomware", "Cryptominer", "Boot sector virus"], meaning: ["Encrypts files and demands payment", "Uses system resources to mine cryptocurrency", "Infects the boot sector and runs before the OS"] } },
    { id: "bootsector", fields: { term: "Boot sector virus", meaning: "Infects the boot sector and runs before the OS" }, detail: "Infects the boot sector so it loads before the OS.", hook: "Boot sector = loads before Windows." },
    { id: "crypto", fields: { term: "Cryptominer", meaning: "Uses system resources to mine cryptocurrency" }, detail: "Uses the computer's CPU or GPU to mine cryptocurrency.", hook: "Cryptominer = slow and hot." },
    { id: "stalker", fields: { term: "Stalkerware", meaning: "Secretly monitors a person's location and messages" }, detail: "Secretly tracks a person's location, messages and activity.", hook: "Stalkerware = tracks a person.", wrong: { term: ["Ransomware", "Cryptominer", "Boot sector virus"], meaning: ["Encrypts files and demands payment", "Uses system resources to mine cryptocurrency", "Infects the boot sector and runs before the OS"] } },
    { id: "fileless", fields: { term: "Fileless malware", meaning: "Runs in memory with built-in tools and leaves few files" }, detail: "Runs in memory using built-in tools such as PowerShell, leaving few files.", hook: "Fileless = lives in memory." },
    { id: "adware", fields: { term: "Adware / PUP", meaning: "Unwanted software that shows ads" }, detail: "Shows unwanted ads; often bundled as a potentially unwanted program.", hook: "Adware = pop-up ads." },
    { id: "edr", fields: { term: "EDR", meaning: "Endpoint monitoring and response on each device" }, detail: "Monitors endpoints and responds to threats on each device.", hook: "EDR = endpoint." },
    { id: "mdr", fields: { term: "MDR", meaning: "Detection and response run by a managed service provider" }, detail: "An outside provider runs detection and response for you.", hook: "MDR = managed service." },
    { id: "xdr", fields: { term: "XDR", meaning: "Detection that correlates endpoints, network, email and cloud" }, detail: "Correlates detection across endpoints, network, email and cloud.", hook: "XDR = extended, everywhere." },
    { id: "gateway", fields: { term: "Email security gateway", meaning: "Filters malicious email before delivery" }, detail: "Filters malicious email before it reaches inboxes.", hook: "Email gateway = filter mail." },
    { id: "recovery", fields: { term: "Recovery console", meaning: "Repair environment used when the OS won't start" }, detail: "Boot environment for repairs when Windows will not start normally.", hook: "Recovery console = repair boot." },
    { id: "step1", fields: { step: "Step 1", action: "Investigate and verify malware symptoms" }, detail: "Confirm it is malware before acting.", hook: "Step 1: verify." },
    { id: "step2", fields: { step: "Step 2", action: "Quarantine the infected system" }, detail: "Disconnect the system so the malware cannot spread.", hook: "Step 2: isolate." },
    { id: "step3", fields: { step: "Step 3", action: "Disable System Restore in Windows Home" }, detail: "Infected restore points could bring the malware back.", hook: "Step 3: restore off." },
    { id: "step4", fields: { step: "Step 4", action: "Remediate the infected system" }, detail: "Begin cleaning the infected system.", hook: "Step 4: remediate." },
    { id: "step5", fields: { step: "Step 5", action: "Update the anti-malware software" }, detail: "Get the latest definitions before scanning.", hook: "Step 5: update." },
    { id: "step6", fields: { step: "Step 6", action: "Scan and remove (Safe Mode or preinstallation environment)" }, detail: "Scan from Safe Mode or a preinstallation environment.", hook: "Step 6: scan." },
    { id: "step7", fields: { step: "Step 7", action: "Reimage or reinstall if needed" }, detail: "If cleaning fails, reimage or reinstall.", hook: "Step 7: reimage." },
    { id: "step8", fields: { step: "Step 8", action: "Schedule scans and run updates" }, detail: "Set regular scans and apply updates.", hook: "Step 8: schedule." },
    { id: "step9", fields: { step: "Step 9", action: "Enable System Restore and create a restore point" }, detail: "Turn restore back on and create a clean restore point.", hook: "Step 9: restore on." },
    { id: "step10", fields: { step: "Step 10", action: "Educate the end user" }, detail: "Teach the user how it happened and how to avoid it.", hook: "Step 10: educate." },
  ],
};

const c2SocialEngineering: DrillDeck = {
  id: "c2-social-engineering",
  certification: "A+ Core 2",
  exam: "220-1202",
  objective: "2.5",
  topic: "Social engineering, threats and vulnerabilities",
  modes: [
    { id: "termToMeaning", from: "term", to: "meaning" },
    { id: "meaningToTerm", from: "meaning", to: "term" },
  ],
  tables: [
    { id: "terms", fields: ["term", "meaning"] },
  ],
  items: [
    { id: "phishing", fields: { term: "Phishing", meaning: "Untargeted mass email that tricks people into revealing information" }, detail: "Fraudulent email that tricks people into giving information or clicking links.", hook: "Phishing = fake email." },
    { id: "vishing", fields: { term: "Vishing", meaning: "Phishing by phone call" }, detail: "Phishing over a voice call.", hook: "Vishing = voice." },
    { id: "smishing", fields: { term: "Smishing", meaning: "Phishing by text message" }, detail: "Phishing by text message.", hook: "Smishing = SMS." },
    { id: "qr", fields: { term: "QR code phishing", meaning: "Malicious QR code that leads to a fake site" }, detail: "A malicious QR code leads to a fake site.", hook: "QR phishing = bad code." },
    { id: "spear", fields: { term: "Spear phishing", meaning: "Phishing aimed at a specific person or group" }, detail: "Targets a specific person or group with tailored details.", hook: "Spear = targeted.", wrong: { term: ["Vishing", "Smishing", "Dumpster diving"], meaning: ["Phishing by phone call", "Phishing by text message", "Searching discarded trash for information"] } },
    { id: "whaling", fields: { term: "Whaling", meaning: "Phishing aimed at senior executives" }, detail: "Targets executives.", hook: "Whaling = big fish.", wrong: { term: ["Vishing", "Smishing", "Dumpster diving"], meaning: ["Phishing by phone call", "Phishing by text message", "Searching discarded trash for information"] } },
    { id: "shoulder", fields: { term: "Shoulder surfing", meaning: "Watching someone's screen or keypad" }, detail: "Watching someone's screen or keyboard to steal information.", hook: "Shoulder surfing = looking over." },
    { id: "tailgating", fields: { term: "Tailgating", meaning: "Following an authorized person through a secured door" }, detail: "Following an authorized person through a secure door.", hook: "Tailgating = follow in." },
    { id: "impersonation", fields: { term: "Impersonation", meaning: "Pretending to be a trusted person to gain access" }, detail: "Pretending to be someone trusted, such as IT support.", hook: "Impersonation = pretend." },
    { id: "dumpster", fields: { term: "Dumpster diving", meaning: "Searching discarded trash for information" }, detail: "Searching trash for useful information.", hook: "Dumpster diving = trash." },
    { id: "dos", fields: { term: "Denial of service (DoS)", meaning: "One source floods a service until it fails" }, detail: "One source overwhelms a service so it stops responding.", hook: "DoS = one attacker floods." },
    { id: "ddos", fields: { term: "DDoS", meaning: "Many systems flood a target at once" }, detail: "Many compromised systems flood a target at once.", hook: "DDoS = many attackers." },
    { id: "eviltwin", fields: { term: "Evil twin", meaning: "Rogue access point that mimics a real network name" }, detail: "A rogue access point copies a legitimate network's name.", hook: "Evil twin = fake Wi-Fi." },
    { id: "zeroday", fields: { term: "Zero-day attack", meaning: "Exploits a flaw before a fix is available" }, detail: "Attacks a flaw before a patch exists.", hook: "Zero-day = no patch yet." },
    { id: "spoofing", fields: { term: "Spoofing", meaning: "Faking a technical identifier such as a sender address, IP or MAC address" }, detail: "Faking an address or identity, such as a sender or MAC address.", hook: "Spoofing = fake identity." },
    { id: "onpath", fields: { term: "On-path attack", meaning: "Attacker intercepts traffic between two parties" }, detail: "Secretly sits between two parties to read or change traffic.", hook: "On-path = in the middle." },
    { id: "brute", fields: { term: "Brute-force attack", meaning: "Tries every possible password combination" }, detail: "Tries every possible password combination.", hook: "Brute force = try everything." },
    { id: "dictionary", fields: { term: "Dictionary attack", meaning: "Tries passwords from a list of common words" }, detail: "Tries common words and known passwords from a list.", hook: "Dictionary = word list." },
    { id: "insider", fields: { term: "Insider threat", meaning: "Threat from an employee or trusted person" }, detail: "A threat from an employee or trusted person.", hook: "Insider = from inside." },
    { id: "sqli", fields: { term: "SQL injection", meaning: "Malicious database commands entered through an input" }, detail: "Malicious database commands entered through an input field.", hook: "SQL injection = database." },
    { id: "xss", fields: { term: "Cross-site scripting (XSS)", meaning: "Malicious script injected into a site runs in users' browsers" }, detail: "Malicious script injected into a website runs in visitors' browsers.", hook: "XSS = script in the page." },
    { id: "bec", fields: { term: "Business email compromise (BEC)", meaning: "Hijacked or spoofed business email used to request payments" }, detail: "Fake or hijacked executive email requests payments or data.", hook: "BEC = fake boss email." },
    { id: "supply", fields: { term: "Supply chain attack", meaning: "Attacks targets through a trusted vendor's product" }, detail: "Compromises a vendor's product or update to reach its customers.", hook: "Supply chain = through the vendor." },
    { id: "byod", fields: { term: "BYOD vulnerability", meaning: "Risk from personal devices that lack company controls" }, detail: "Personal devices may lack company security controls.", hook: "BYOD = unmanaged risk." },
    { id: "unpatched", fields: { term: "Unpatched system", meaning: "System missing updates for known flaws" }, detail: "Missing updates leave known flaws open.", hook: "Unpatched = known holes." },
  ],
};

const c2Hardening: DrillDeck = {
  id: "c2-hardening",
  certification: "A+ Core 2",
  exam: "220-1202",
  objective: "2.7, 2.8, 2.9, 2.10, 2.11",
  topic: "Hardening, mobile, disposal, SOHO and browser security",
  modes: [
    { id: "scenarioToAnswer", from: "scenario", to: "answer" },
    { id: "termToMeaning", from: "term", to: "meaning" },
  ],
  tables: [
    { id: "scenarios", fields: ["scenario", "answer"] },
    { id: "terms", fields: ["term", "meaning"] },
  ],
  items: [
    { id: "h-autorun", fields: { scenario: "Stop USB drives from launching programs automatically", answer: "Disable AutoRun" }, detail: "Disabling AutoRun stops media from launching programs automatically.", hook: "AutoRun off." },
    { id: "h-lockout", fields: { scenario: "Slow down password-guessing attacks on a workstation", answer: "Set a failed-attempts lockout" }, detail: "Lock the account after repeated wrong passwords.", hook: "Lockout = stop guessing." },
    { id: "h-guest", fields: { scenario: "Remove an account that allows sign-in without a password", answer: "Disable the guest account" }, detail: "Turn off the built-in guest account.", hook: "Guest off." },
    { id: "h-bios", fields: { scenario: "Stop users from changing the boot order", answer: "Set a BIOS/UEFI password" }, detail: "A BIOS/UEFI password blocks changes to firmware settings and boot order.", hook: "Protect the firmware." },
    { id: "h-screen", fields: { scenario: "Protect an unattended desk PC", answer: "Use a screensaver lock / screen timeout" }, detail: "Lock the screen automatically when idle.", hook: "Idle = lock." },
    { id: "m-wipe", fields: { scenario: "A stolen company phone with client data cannot be recovered", answer: "Remote wipe" }, detail: "Erase a lost phone's data from afar.", hook: "Lost phone = remote wipe." },
    { id: "m-locate", fields: { scenario: "A user misplaced a tablet somewhere in the building", answer: "Use a locator application" }, detail: "Find the device's location.", hook: "Where is it = locator app." },
    { id: "m-profile", fields: { scenario: "Require a PIN and encryption on every employee phone", answer: "Apply a configuration profile through MDM" }, detail: "Pushes required security settings to mobile devices.", hook: "Settings to phones = profiles." },
    { id: "d-degauss", fields: { scenario: "Destroy data on old magnetic hard drives so they can never be read", answer: "Degauss or shred the drives" }, detail: "Degaussing erases magnetic media only; it does not work on SSDs.", hook: "Degauss = magnetic only." },
    { id: "d-wipe", fields: { scenario: "Donate old drives in working condition", answer: "Erase/wipe them with overwriting" }, detail: "Overwriting lets the drive be reused safely.", hook: "Reuse = wipe." },
    { id: "d-cert", fields: { scenario: "A disposal vendor must prove the drives were destroyed", answer: "Request a certificate of destruction" }, detail: "Proof from a vendor that drives were destroyed or recycled properly.", hook: "Proof = certificate." },
    { id: "n-default", fields: { scenario: "First step when installing a new SOHO router", answer: "Change the default admin password" }, detail: "Default router passwords are publicly known.", hook: "First: change defaults." },
    { id: "n-upnp", fields: { scenario: "Stop devices from opening router ports on their own", answer: "Disable UPnP" }, detail: "UPnP lets devices open ports automatically, which malware can abuse.", hook: "UPnP off." },
    { id: "n-guest", fields: { scenario: "Give visitors internet access without access to company devices", answer: "Configure guest access" }, detail: "Guest Wi-Fi keeps visitors off the internal network.", hook: "Visitors = guest network." },
    { id: "n-ports", fields: { scenario: "Stop someone plugging into an unused wall jack", answer: "Disable unused ports" }, detail: "Unused switch or router ports can be disabled to stop rogue connections.", hook: "Unused = off." },
    { id: "n-forward", fields: { scenario: "Allow outside access to one internal camera server", answer: "Configure port forwarding" }, detail: "Sends inbound traffic on one port to one internal device.", hook: "Forward one port." },
    { id: "n-firmware", fields: { scenario: "A router vendor publishes a security fix", answer: "Update the router firmware" }, detail: "Router firmware updates fix security flaws.", hook: "Patch the router too." },
    { id: "b-hash", fields: { scenario: "Confirm a downloaded installer was not tampered with", answer: "Compare its hash with the vendor's" }, detail: "Comparing the file's hash with the vendor's shows it was not altered.", hook: "Hash = verify download." },
    { id: "b-cert", fields: { scenario: "A banking site shows a certificate warning", answer: "Stop and verify the certificate before continuing" }, detail: "An invalid certificate warning may mean the site is not genuine.", hook: "Check the certificate." },
    { id: "b-private", fields: { scenario: "Browse on a shared PC without saving history", answer: "Use private-browsing mode" }, detail: "Private browsing does not keep history or cookies after the window closes.", hook: "Private mode = no history kept." },
    { id: "b-ext", fields: { scenario: "Pop-ups started after a new browser extension was installed", answer: "Remove the untrusted extension" }, detail: "Only install extensions from trusted sources; remove unknown ones.", hook: "Untrusted extension = remove." },
    { id: "t-securedns", fields: { term: "Secure DNS", meaning: "Encrypts the browser's DNS lookups" }, detail: "Encrypts DNS lookups, for example DNS over HTTPS.", hook: "Secure DNS = encrypted lookups." },
    { id: "t-ssid", fields: { term: "Disabling SSID broadcast", meaning: "Hides the network name from casual discovery only" }, detail: "Hiding the SSID only stops casual discovery; scanners still find it.", hook: "Hidden SSID is not security." },
    { id: "t-screened", fields: { term: "Screened subnet", meaning: "Separate zone for devices the internet must reach" }, detail: "A separate network zone for internet-facing devices.", hook: "Screened subnet = DMZ." },
    { id: "t-content", fields: { term: "Content filtering", meaning: "Blocks websites or content by category" }, detail: "Blocks categories of websites or content.", hook: "Content filter = block sites." },
    { id: "t-lowlevel", fields: { term: "Low-level formatting", meaning: "Thorough rewrite of a drive before reuse" }, detail: "True low-level formatting is done at the factory; today's low-level format tools overwrite (zero-fill) the whole drive, more thorough than a standard format.", hook: "Low-level > standard." },
    { id: "t-standardfmt", fields: { term: "Standard formatting", meaning: "Creates a new file system; data may still be recoverable" }, detail: "A quick format only rebuilds the file system, so data is often recoverable; a Windows full format (Vista and later) also overwrites the volume with zeros.", hook: "Standard format leaves data." },
  ],
};

const c2TroubleshootWindows: DrillDeck = {
  id: "c2-troubleshoot-windows",
  certification: "A+ Core 2",
  exam: "220-1202",
  objective: "3.1",
  topic: "Windows troubleshooting",
  modes: [
    { id: "symptomToFix", from: "symptom", to: "fix" },
  ],
  tables: [
    { id: "fixes", fields: ["symptom", "fix"] },
  ],
  items: [
    { id: "bsod", fields: { symptom: "Blue screen (BSOD) right after a new driver was installed", fix: "Roll back the driver from Safe Mode" }, detail: "Note the stop code, then undo the recent change: roll back the driver or update, or use Safe Mode or System Restore.", hook: "BSOD = stop code, undo last change." },
    { id: "perf", fields: { symptom: "Degraded performance on an older PC", fix: "Check Task Manager and disable startup apps" }, detail: "Check Task Manager for heavy processes, disable startup apps and free disk space.", hook: "Slow = find the hog." },
    { id: "boot", fields: { symptom: "Windows fails to start after an update", fix: "Run Startup Repair from the recovery environment" }, detail: "Startup Repair in the Windows Recovery Environment fixes many boot problems.", hook: "Won't boot = Startup Repair." },
    { id: "shutdowns", fields: { symptom: "Frequent unexpected shutdowns", fix: "Check temperatures, fans and power" }, detail: "Frequent shutdowns often mean overheating or power problems.", hook: "Shutdowns = heat or power." },
    { id: "services", fields: { symptom: "A Windows service will not start", fix: "Check its dependencies and startup type in Services" }, detail: "Check the service's startup type, dependencies and account in services.msc.", hook: "Service won't start = check dependencies." },
    { id: "crash", fields: { symptom: "One application keeps crashing", fix: "Update, repair or reinstall the application" }, detail: "Update, repair or reinstall the app; check Event Viewer for the error.", hook: "App crashes = repair or reinstall." },
    { id: "lowmem", fields: { symptom: "Low memory warnings", fix: "Close apps, add RAM or raise virtual memory" }, detail: "Close unneeded apps, add RAM or increase virtual memory.", hook: "Low memory = less load or more RAM." },
    { id: "usbres", fields: { symptom: "USB controller resource warning", fix: "Move devices to another USB controller or port" }, detail: "Too many devices on one USB controller; spread them across controllers.", hook: "USB resource warning = spread devices." },
    { id: "instability", fields: { symptom: "Random freezes and instability; temperatures and power test normal", fix: "Test memory, update drivers and run sfc" }, detail: "Test RAM, update drivers and run sfc /scannow.", hook: "Unstable = RAM, drivers, system files." },
    { id: "noos", fields: { symptom: "\"No operating system found\"", fix: "Check boot order, then repair boot records" }, detail: "Check the boot order and remove USB media, then repair the boot configuration.", hook: "No OS = boot order." },
    { id: "profile", fields: { symptom: "Slow profile load at sign-in", fix: "Reduce or rebuild the user profile; check the network" }, detail: "Large or corrupt roaming profiles, or network delays, slow sign-in.", hook: "Slow sign-in = profile." },
    { id: "time", fields: { symptom: "System clock keeps drifting", fix: "Resync with a time server (Windows Time)" }, detail: "Resynchronize with a time server; check the CMOS battery if drift returns.", hook: "Clock drift = resync time." },
  ],
};

const c2TroubleshootMobile: DrillDeck = {
  id: "c2-troubleshoot-mobile",
  certification: "A+ Core 2",
  exam: "220-1202",
  objective: "3.2, 3.3",
  topic: "Mobile troubleshooting and security",
  modes: [
    { id: "symptomToFix", from: "symptom", to: "fix" },
    { id: "symptomToCause", from: "symptom", to: "cause" },
  ],
  tables: [
    { id: "fixes", fields: ["symptom", "fix"] },
    { id: "causes", fields: ["symptom", "cause"] },
  ],
  items: [
    { id: "launch", fields: { symptom: "An app fails to launch", fix: "Force stop it, clear its cache, then update or reinstall" }, detail: "Force stop, clear the cache, update or reinstall the app.", hook: "Won't open = force stop, reinstall." },
    { id: "install", fields: { symptom: "An app fails to install", fix: "Free up storage and check OS compatibility" }, detail: "Check free storage and that the OS version is supported.", hook: "Won't install = space or OS." },
    { id: "osupdate", fields: { symptom: "The OS update fails to install", fix: "Free space, charge the battery, connect to Wi-Fi" }, detail: "Updates need free space, battery charge and Wi-Fi.", hook: "Update fails = space, power, Wi-Fi." },
    { id: "battery", fields: { symptom: "Battery drains quickly", fix: "Check battery usage by app and disable unused radios" }, detail: "Check battery usage by app, lower brightness, turn off unused radios.", hook: "Drain = check battery usage." },
    { id: "reboot", fields: { symptom: "Random reboots", fix: "Check for overheating, recent apps and battery health" }, detail: "Overheating, a faulty app or a failing battery can cause restarts.", hook: "Random reboots = heat, app, battery." },
    { id: "bt", fields: { symptom: "Bluetooth device will not connect", fix: "Toggle Bluetooth, forget and re-pair the device" }, detail: "Toggle Bluetooth, forget the device and pair again.", hook: "Bluetooth = re-pair." },
    { id: "rotate", fields: { symptom: "Screen does not autorotate", fix: "Turn off rotation lock" }, detail: "Rotation lock is on, or the app does not support rotation.", hook: "No autorotate = rotation lock." },
    { id: "slow", fields: { symptom: "Phone is slow to respond", fix: "Close background apps, restart and free storage" }, detail: "Close background apps and restart; check storage space.", hook: "Slow phone = restart, free space." },
    { id: "sec-traffic", fields: { symptom: "High network traffic and a data-usage limit warning", cause: "A malicious or unauthorized app" }, detail: "Unexpected network traffic and data use point to a malicious app.", hook: "Data spike = malicious app.", wrong: { cause: ["Rotation lock is on", "Low free storage", "A failing battery"] } },
    { id: "sec-ads", fields: { symptom: "A high number of ads appears across apps", cause: "Adware from an untrusted app" }, detail: "A sudden flood of ads points to adware from an untrusted app.", hook: "Ads everywhere = adware." },
    { id: "sec-fake", fields: { symptom: "Fake security warnings pop up", cause: "Scareware from a malicious app or site" }, detail: "Fake security warnings try to scare users into installing malware.", hook: "Fake warning = scareware.", wrong: { cause: ["Root access or jailbreak", "Developer mode lowering security", "Rotation lock is on"] } },
    { id: "sec-leak", fields: { symptom: "Personal files or data were leaked", cause: "A malicious app with excessive permissions" }, detail: "Leaked files suggest a malicious app with excess permissions.", hook: "Leaked data = malicious app.", wrong: { cause: ["Rotation lock is on", "Low free storage", "A failing battery"] } },
    { id: "sec-store", fields: { symptom: "Unexpected app behavior after sideloading an app", cause: "An app from an unofficial application store" }, detail: "Apps from unofficial stores skip security review.", hook: "Sideloading = unreviewed apps." },
    { id: "sec-root", fields: { symptom: "A device fails company security checks after being modified", cause: "Root access or jailbreak" }, detail: "Root or jailbreak removes built-in protections.", hook: "Rooted = protections off." },
    { id: "sec-dev", fields: { symptom: "Developer options were turned on by a user", cause: "Developer mode lowering security" }, detail: "Developer mode loosens security settings.", hook: "Developer mode = looser security." },
  ],
};

const c2TroubleshootSecurity: DrillDeck = {
  id: "c2-troubleshoot-security",
  certification: "A+ Core 2",
  exam: "220-1202",
  objective: "3.4",
  topic: "PC security troubleshooting",
  modes: [
    { id: "symptomToCause", from: "symptom", to: "cause" },
  ],
  tables: [
    { id: "causes", fields: ["symptom", "cause"] },
  ],
  items: [
    { id: "network", fields: { symptom: "Cannot reach the network after a suspicious download", cause: "Malware changed proxy, DNS or firewall settings" }, detail: "Malware may change proxy, DNS or firewall settings.", hook: "No network = check proxy and DNS." },
    { id: "falseav", fields: { symptom: "Pop-up antivirus alerts from software nobody installed", cause: "Rogue antivirus (scareware)" }, detail: "Rogue antivirus shows fake infections to sell a fix.", hook: "Fake AV = scareware.", wrong: { cause: ["Ransomware", "Malware blocking updates", "Wrong system date and time or an on-path attack"] } },
    { id: "renamed", fields: { symptom: "Files renamed with odd extensions and cannot be opened", cause: "Ransomware" }, detail: "Ransomware encrypts and renames files.", hook: "Renamed files = ransomware." },
    { id: "updates", fields: { symptom: "Windows updates keep failing on an infected PC", cause: "Malware blocking updates" }, detail: "Malware often blocks OS and antivirus updates.", hook: "Updates blocked = malware." },
    { id: "notify", fields: { symptom: "Unwanted notifications appear in the OS", cause: "A malicious app or allowed site notifications" }, detail: "Unwanted OS notifications often come from malicious apps or browser permissions.", hook: "Pushy notifications = malicious permissions." },
    { id: "popups", fields: { symptom: "Random, frequent browser pop-ups", cause: "Adware or a malicious browser extension" }, detail: "Adware or a malicious extension creates random pop-ups.", hook: "Pop-ups = adware.", wrong: { cause: ["Ransomware", "Malware blocking updates", "Wrong system date and time or an on-path attack"] } },
    { id: "redirect", fields: { symptom: "Searches redirect to unfamiliar websites", cause: "Browser hijacker or altered DNS/hosts settings" }, detail: "Browser hijackers or changed DNS/hosts send users to other sites.", hook: "Redirects = hijacked browser or DNS.", wrong: { cause: ["Ransomware", "Malware blocking updates", "Wrong system date and time or an on-path attack"] } },
    { id: "certwarn", fields: { symptom: "Certificate warnings on well-known sites", cause: "Wrong system date and time or an on-path attack" }, detail: "Wrong system time or an on-path attack can cause certificate warnings.", hook: "Cert warnings = time or interception." },
    { id: "browserslow", fields: { symptom: "Degraded browser performance", cause: "Malicious or excessive browser extensions" }, detail: "Too many or malicious extensions slow the browser.", hook: "Slow browser = extensions.", wrong: { cause: ["Ransomware", "Malware blocking updates", "Wrong system date and time or an on-path attack"] } },
    { id: "desktop", fields: { symptom: "Unexpected desktop alerts asking to call a number", cause: "Scam malware or a malicious website" }, detail: "Unexpected desktop alerts can come from malware.", hook: "Desktop alerts = check for malware.", wrong: { cause: ["Ransomware", "Malware blocking updates", "Wrong system date and time or an on-path attack"] } },
  ],
};

const c2DocsChange: DrillDeck = {
  id: "c2-docs-change",
  certification: "A+ Core 2",
  exam: "220-1202",
  objective: "4.1, 4.2",
  topic: "Documentation and change management",
  modes: [
    { id: "termToMeaning", from: "term", to: "meaning" },
    { id: "meaningToTerm", from: "meaning", to: "term" },
  ],
  tables: [
    { id: "terms", fields: ["term", "meaning"] },
  ],
  items: [
    { id: "ticket", fields: { term: "Ticketing system", meaning: "Tracks each support request from start to resolution" }, detail: "Tracks each request with user, device, description, category and severity.", hook: "Ticket = track it." },
    { id: "escalation", fields: { term: "Escalation level", meaning: "Support tier an issue moves to when it needs more expertise" }, detail: "Moves an issue to a higher support tier when needed.", hook: "Escalate = next tier." },
    { id: "severity", fields: { term: "Severity", meaning: "How serious an issue's impact is" }, detail: "How serious the impact is, used to prioritize.", hook: "Severity = how bad." },
    { id: "cmdb", fields: { term: "CMDB", meaning: "Database of configuration items and their relationships" }, detail: "Database of configuration items and how they relate.", hook: "CMDB = config database." },
    { id: "assettag", fields: { term: "Asset tag", meaning: "Label that identifies a device in inventory" }, detail: "Labels each device for inventory tracking.", hook: "Asset tag = label." },
    { id: "sop", fields: { term: "Standard operating procedure (SOP)", meaning: "Step-by-step instructions for a routine task" }, detail: "Step-by-step instructions for a routine task.", hook: "SOP = how we do it." },
    { id: "sla", fields: { term: "Service-level agreement (SLA)", meaning: "Agreed service levels such as response time" }, detail: "Agreed service level, such as response time.", hook: "SLA = promised service." },
    { id: "kb", fields: { term: "Knowledge base", meaning: "Library of articles with known fixes" }, detail: "Articles with known fixes and how-tos.", hook: "KB = known answers." },
    { id: "incident", fields: { term: "Incident report", meaning: "Document describing an incident and the response" }, detail: "Records what happened, when and what was done.", hook: "Incident report = what happened." },
    { id: "onboard", fields: { term: "Onboarding checklist", meaning: "Steps to set up a new user's accounts and equipment" }, detail: "Checklist to set up accounts and equipment for a new user.", hook: "Onboarding = new user setup." },
    { id: "offboard", fields: { term: "Off-boarding checklist", meaning: "Steps to remove a departing user's access and equipment" }, detail: "Checklist to remove access and recover equipment when a user leaves.", hook: "Off-boarding = revoke access." },
    { id: "standard", fields: { term: "Standard change", meaning: "Pre-approved, low-risk routine change" }, detail: "Pre-approved, low-risk, routine change.", hook: "Standard = pre-approved." },
    { id: "normal", fields: { term: "Normal change", meaning: "Change that needs review and board approval" }, detail: "Needs review and change board approval.", hook: "Normal = goes to the board." },
    { id: "emergency", fields: { term: "Emergency change", meaning: "Urgent change with expedited approval" }, detail: "Urgent fix with expedited approval.", hook: "Emergency = fix now." },
    { id: "rollback", fields: { term: "Rollback plan", meaning: "Steps to undo a change if it fails" }, detail: "How to undo the change if it fails.", hook: "Rollback = undo plan." },
    { id: "sandbox", fields: { term: "Sandbox testing", meaning: "Testing a change in an isolated environment" }, detail: "Test the change in an isolated environment first.", hook: "Sandbox = safe test." },
    { id: "freeze", fields: { term: "Change freeze", meaning: "Period when no changes are allowed" }, detail: "A period when no changes are allowed.", hook: "Freeze = no changes." },
    { id: "window", fields: { term: "Maintenance window", meaning: "Scheduled time set aside for changes" }, detail: "Scheduled time set aside for changes.", hook: "Window = scheduled slot." },
    { id: "cab", fields: { term: "Change board approval", meaning: "The CAB's formal sign-off step before a change is implemented" }, detail: "Group that reviews and approves changes.", hook: "Change board = approval." },
    { id: "risk", fields: { term: "Risk analysis", meaning: "Assessing what could go wrong and how badly" }, detail: "Weighs the likelihood and impact of problems.", hook: "Risk analysis = what could go wrong." },
    { id: "acceptance", fields: { term: "End-user acceptance", meaning: "Users confirm the change works as needed" }, detail: "Users confirm the change works for them.", hook: "Acceptance = users sign off." },
  ],
};

const c2BackupSafety: DrillDeck = {
  id: "c2-backup-safety",
  certification: "A+ Core 2",
  exam: "220-1202",
  objective: "4.3, 4.4, 4.5",
  topic: "Backups, safety and environment",
  modes: [
    { id: "termToMeaning", from: "term", to: "meaning" },
    { id: "scenarioToAnswer", from: "scenario", to: "answer" },
  ],
  tables: [
    { id: "terms", fields: ["term", "meaning"] },
    { id: "scenarios", fields: ["scenario", "answer"] },
  ],
  items: [
    { id: "full", fields: { term: "Full backup", meaning: "Copies all selected data every time" }, detail: "Copies everything; slowest backup, simplest restore.", hook: "Full = everything." },
    { id: "incremental", fields: { term: "Incremental backup", meaning: "Copies changes since the last backup of any type" }, detail: "Copies changes since the last backup of any type; restore needs the full plus every incremental.", hook: "Incremental = since last backup." },
    { id: "differential", fields: { term: "Differential backup", meaning: "Copies changes since the last full backup" }, detail: "Copies changes since the last full backup; restore needs the full plus the latest differential.", hook: "Differential = since last full." },
    { id: "synthetic", fields: { term: "Synthetic full backup", meaning: "Full backup assembled from earlier backups" }, detail: "Builds a new full backup from the last full and later incrementals without re-reading the source.", hook: "Synthetic = built, not re-copied." },
    { id: "gfs", fields: { term: "Grandfather-father-son (GFS)", meaning: "Rotation of daily, weekly and monthly backups" }, detail: "Daily (son), weekly (father) and monthly (grandfather) backup sets.", hook: "GFS = daily, weekly, monthly." },
    { id: "321", fields: { term: "3-2-1 backup rule", meaning: "Three copies, two media types, one offsite" }, detail: "Three copies, two media types, one copy offsite.", hook: "3-2-1." },
    { id: "altloc", fields: { term: "Restore to an alternative location", meaning: "Recovering data to a different place than the original" }, detail: "Restores to a different place so the original stays untouched.", hook: "Alternative location = safe restore." },
    { id: "msds", fields: { term: "Material safety data sheet (MSDS)", meaning: "Safe handling and disposal instructions for a product" }, detail: "Explains safe handling and disposal of a product, such as toner or batteries.", hook: "MSDS/SDS = handling and disposal." },
    { id: "ups", fields: { term: "Uninterruptible power supply (UPS)", meaning: "Battery backup during blackouts and brownouts" }, detail: "Battery backup that keeps equipment running through outages and brownouts.", hook: "UPS = battery backup." },
    { id: "surge", fields: { term: "Surge suppressor", meaning: "Protects against spikes, not power loss" }, detail: "Protects against voltage spikes but not outages.", hook: "Surge suppressor = spikes only." },
    { id: "brownout", fields: { term: "Brownout", meaning: "Temporary drop in voltage" }, detail: "A temporary drop in voltage.", hook: "Brownout = low voltage." },
    { id: "esd", fields: { scenario: "Replacing RAM in a desktop", answer: "Wear an ESD strap and use an ESD mat" }, detail: "Wear a grounded ESD strap when handling components.", hook: "ESD strap = ground yourself." },
    { id: "lift", fields: { scenario: "Moving a heavy server", answer: "Lift with your legs or get help" }, detail: "Bend at the knees and lift with your legs.", hook: "Lift with legs." },
    { id: "power", fields: { scenario: "About to open a desktop case", answer: "Disconnect power first" }, detail: "Unplug the PC before opening it.", hook: "Power off first." },
    { id: "toner", fields: { scenario: "Cleaning a large toner spill", answer: "Wear an air filter mask and use a toner vacuum" }, detail: "Wear a mask and use a toner vacuum when cleaning toner.", hook: "Toner = mask and vacuum." },
    { id: "battery", fields: { scenario: "Disposing of swollen laptop batteries", answer: "Recycle them per local regulations" }, detail: "Recycle batteries according to local regulations and the MSDS.", hook: "Batteries = recycle." },
    { id: "humidity", fields: { scenario: "A server room is very dry in winter", answer: "Raise humidity to reduce ESD risk" }, detail: "Low humidity raises ESD risk; high humidity causes condensation.", hook: "Humidity matters." },
    { id: "bags", fields: { scenario: "Storing a spare motherboard", answer: "Keep it in an antistatic bag" }, detail: "Store components in antistatic bags.", hook: "Antistatic bag = storage." },
    { id: "cables", fields: { scenario: "Cables run across a walkway", answer: "Use cable management to route them safely" }, detail: "Route and secure cables to prevent trip hazards.", hook: "Cable management = no trips." },
    { id: "dust", fields: { scenario: "Dust buildup in a PC's fans", answer: "Clean with compressed air or an electronics vacuum" }, detail: "Use compressed air or an electronics vacuum to clear dust.", hook: "Dust = clean it out." },
  ],
};

const c2PolicyCommunication: DrillDeck = {
  id: "c2-policy-communication",
  certification: "A+ Core 2",
  exam: "220-1202",
  objective: "4.6, 4.7",
  topic: "Privacy, licensing, policy and professionalism",
  modes: [
    { id: "termToMeaning", from: "term", to: "meaning" },
    { id: "scenarioToAnswer", from: "scenario", to: "answer" },
  ],
  tables: [
    { id: "terms", fields: ["term", "meaning"] },
    { id: "scenarios", fields: ["scenario", "answer"] },
  ],
  items: [
    { id: "chain", fields: { term: "Chain of custody", meaning: "Record of everyone who handled evidence" }, detail: "Records everyone who handled the evidence and when.", hook: "Chain of custody = who touched it." },
    { id: "volatility", fields: { term: "Order of volatility", meaning: "Collect the most short-lived data first" }, detail: "Collect the most volatile data, such as RAM, before it disappears.", hook: "Most volatile first." },
    { id: "copy", fields: { term: "Copy of drive", meaning: "Forensic copy that preserves the original evidence" }, detail: "Work from a copy so the original drive stays unchanged.", hook: "Copy the drive." },
    { id: "perpetual", fields: { term: "Perpetual license", meaning: "One-time purchase to use software indefinitely" }, detail: "Pay once and use the software indefinitely.", hook: "Perpetual = forever." },
    { id: "opensource", fields: { term: "Open-source license", meaning: "License that makes source code available to modify" }, detail: "Source code is available and can be modified under its license terms.", hook: "Open source = code available." },
    { id: "eula", fields: { term: "EULA", meaning: "Terms a user accepts to install software" }, detail: "The terms the user agrees to when installing software.", hook: "EULA = the user agreement." },
    { id: "drm", fields: { term: "Digital rights management (DRM)", meaning: "Technology that restricts copying of digital content" }, detail: "Technology that restricts copying and use of digital content.", hook: "DRM = copy protection." },
    { id: "pii", fields: { term: "PII", meaning: "Information that identifies a specific person" }, detail: "Information that identifies a person.", hook: "PII = identifies someone." },
    { id: "health", fields: { term: "Healthcare data", meaning: "Medical information protected by regulation" }, detail: "Protected health information, regulated by laws such as HIPAA.", hook: "Health data = regulated." },
    { id: "card", fields: { term: "Credit card payment information", meaning: "Card data protected under PCI DSS" }, detail: "Payment card data must be protected under PCI DSS.", hook: "Card data = PCI DSS." },
    { id: "retention", fields: { term: "Data retention requirements", meaning: "Rules for how long data must be kept" }, detail: "How long data must be kept before deletion.", hook: "Retention = how long to keep." },
    { id: "aup", fields: { term: "Acceptable use policy (AUP)", meaning: "Rules for acceptable use of company systems" }, detail: "Rules for what users may do with company systems.", hook: "AUP = acceptable use." },
    { id: "nda", fields: { term: "Non-disclosure agreement (NDA)", meaning: "Agreement to keep information confidential" }, detail: "Legal agreement to keep information confidential.", hook: "NDA = keep it secret." },
    { id: "splash", fields: { term: "Splash screen", meaning: "Sign-in notice stating policy and monitoring" }, detail: "A sign-in notice that states policy and consent.", hook: "Splash screen = legal notice." },
    { id: "c-late", fields: { scenario: "You will arrive 20 minutes late to a customer site", answer: "Contact the customer before the appointment time" }, detail: "Call the customer before the appointment if you will be late.", hook: "Late = call ahead." },
    { id: "c-angry", fields: { scenario: "A customer is angry and blames you for the outage", answer: "Listen calmly and avoid arguing" }, detail: "Stay calm, listen and do not argue or get defensive.", hook: "Don't argue.", wrong: { answer: ["Ignore it until the job is done", "Contact the customer before the appointment time", "Leave it alone and keep it confidential"] } },
    { id: "c-clarify", fields: { scenario: "A user's description of the problem is vague", answer: "Ask open-ended questions and restate the issue" }, detail: "Ask open-ended questions and restate the issue to confirm understanding.", hook: "Restate to confirm." },
    { id: "c-phone", fields: { scenario: "Your phone buzzes with a personal call during a repair", answer: "Ignore it until the job is done" }, detail: "Avoid personal calls and texting while working with a customer.", hook: "No distractions." },
    { id: "c-jargon", fields: { scenario: "Explaining a fix to a non-technical manager", answer: "Use plain language without jargon" }, detail: "Avoid jargon and acronyms with non-technical users.", hook: "Plain language." },
    { id: "c-private", fields: { scenario: "A customer's payroll printout is on the desk you're working at", answer: "Leave it alone and keep it confidential" }, detail: "Do not read or touch a customer's confidential materials.", hook: "Respect privacy." },
    { id: "c-follow", fields: { scenario: "A repair is finished", answer: "Document it and follow up to verify satisfaction" }, detail: "Follow up later to confirm the customer is satisfied.", hook: "Follow up." },
  ],
};

const c2ScriptsRemoteAi: DrillDeck = {
  id: "c2-scripts-remote-ai",
  certification: "A+ Core 2",
  exam: "220-1202",
  objective: "4.8, 4.9, 4.10",
  topic: "Scripting, remote access and AI",
  modes: [
    { id: "termToMeaning", from: "term", to: "meaning" },
    { id: "meaningToTerm", from: "meaning", to: "term" },
  ],
  tables: [
    { id: "terms", fields: ["term", "meaning"] },
  ],
  items: [
    { id: "bat", fields: { term: ".bat", meaning: "Windows batch file of command prompt commands" }, detail: ".bat files run Windows command prompt commands.", hook: ".bat = batch." },
    { id: "ps1", fields: { term: ".ps1", meaning: "PowerShell script" }, detail: ".ps1 files run PowerShell scripts.", hook: ".ps1 = PowerShell." },
    { id: "vbs", fields: { term: ".vbs", meaning: "VBScript file for Windows automation" }, detail: ".vbs files run VBScript on Windows.", hook: ".vbs = VBScript." },
    { id: "sh", fields: { term: ".sh", meaning: "Linux or macOS shell script" }, detail: ".sh files run shell scripts on Linux and macOS.", hook: ".sh = shell." },
    { id: "js", fields: { term: ".js", meaning: "JavaScript file" }, detail: ".js files run JavaScript.", hook: ".js = JavaScript." },
    { id: "py", fields: { term: ".py", meaning: "Python script" }, detail: ".py files run Python.", hook: ".py = Python." },
    { id: "rdp", fields: { term: "RDP", meaning: "Remote Windows desktop over TCP 3389" }, detail: "Full Windows desktop remotely over TCP 3389.", hook: "RDP = Windows desktop, 3389." },
    { id: "vnc", fields: { term: "VNC", meaning: "Cross-platform remote screen sharing" }, detail: "Cross-platform screen sharing, commonly TCP 5900.", hook: "VNC = any OS screen." },
    { id: "ssh", fields: { term: "SSH", meaning: "Encrypted remote command line over TCP 22" }, detail: "Encrypted command-line access over TCP 22.", hook: "SSH = secure shell, 22." },
    { id: "vpn", fields: { term: "VPN (remote access)", meaning: "Encrypted tunnel into a private network" }, detail: "Encrypted tunnel into the private network.", hook: "VPN = tunnel in." },
    { id: "rmm", fields: { term: "RMM", meaning: "Remote monitoring and management of many endpoints" }, detail: "Lets support teams monitor and manage many endpoints remotely.", hook: "RMM = manage many devices." },
    { id: "spice", fields: { term: "SPICE", meaning: "Remote display protocol for virtual machines" }, detail: "Remote display protocol for virtual machine desktops.", hook: "SPICE = VM desktops." },
    { id: "winrm", fields: { term: "WinRM", meaning: "Remote management of Windows through PowerShell" }, detail: "Runs PowerShell commands on remote Windows machines.", hook: "WinRM = remote PowerShell." },
    { id: "hallucination", fields: { term: "AI hallucination", meaning: "Confident AI output that is false" }, detail: "AI output that sounds confident but is false.", hook: "Hallucination = made up." },
    { id: "bias", fields: { term: "AI bias", meaning: "Unfair or skewed results from training data" }, detail: "Skewed results learned from skewed training data.", hook: "Bias = skewed data." },
    { id: "publicai", fields: { term: "Public AI", meaning: "Hosted AI that may retain what users submit" }, detail: "Public AI services may keep or learn from what users enter.", hook: "Public AI = don't paste secrets." },
    { id: "privateai", fields: { term: "Private AI", meaning: "AI kept under the organization's control" }, detail: "Runs within the organization's control, keeping data private.", hook: "Private AI = data stays in." },
    { id: "plagiarism", fields: { term: "AI plagiarism", meaning: "Presenting AI-generated work as one's own" }, detail: "Passing off AI output as original work.", hook: "Credit your sources." },
  ],
};


const awsClfServiceCompare: DrillDeck = {
  "id": "aws-clf-service-compare",
  "certification": "AWS Cloud Practitioner",
  "exam": "clf-c02",
  "objective": "2.1–4.3",
  "topic": "AWS service positioning",
  "modes": [
    {
      "id": "scenarioToAnswer",
      "from": "scenario",
      "to": "answer"
    }
  ],
  "tables": [
    {
      "id": "scenarios",
      "fields": [
        "scenario",
        "answer"
      ]
    }
  ],
  "items": [
    {
      "id": "metrics",
      "fields": {
        "scenario": "Metrics, logs, alarms, and dashboards",
        "answer": "Amazon CloudWatch"
      },
      "detail": "CloudWatch is the monitoring and observability choice.",
      "hook": "Watch = metrics and alarms.",
      "objective": "2.4"
    },
    {
      "id": "audit",
      "fields": {
        "scenario": "Record AWS account and API activity",
        "answer": "AWS CloudTrail"
      },
      "detail": "CloudTrail records API activity for auditing.",
      "hook": "Trail = who did what.",
      "objective": "2.2"
    },
    {
      "id": "config",
      "fields": {
        "scenario": "Track configuration history and evaluate configuration rules",
        "answer": "AWS Config"
      },
      "detail": "Config records resource configuration state and compliance.",
      "hook": "Config = configuration history.",
      "objective": "2.2"
    },
    {
      "id": "queue",
      "fields": {
        "scenario": "Durable asynchronous queue between application components",
        "answer": "Amazon SQS"
      },
      "detail": "SQS decouples producers and consumers with a queue.",
      "hook": "Q = queue.",
      "objective": "3.8"
    },
    {
      "id": "fanout",
      "fields": {
        "scenario": "Publish one message to multiple subscribers",
        "answer": "Amazon SNS"
      },
      "detail": "SNS is publish/subscribe fanout.",
      "hook": "Notify many = SNS.",
      "objective": "3.8"
    },
    {
      "id": "object",
      "fields": {
        "scenario": "Object storage in buckets",
        "answer": "Amazon S3"
      },
      "detail": "S3 is object storage.",
      "hook": "S3 = objects in buckets.",
      "objective": "3.6"
    },
    {
      "id": "block",
      "fields": {
        "scenario": "Persistent block volume for EC2",
        "answer": "Amazon EBS"
      },
      "detail": "EBS is persistent block storage.",
      "hook": "B = block.",
      "objective": "3.6"
    },
    {
      "id": "dns",
      "fields": {
        "scenario": "Managed DNS and routing policies",
        "answer": "Amazon Route 53"
      },
      "detail": "Route 53 provides DNS and routing policies.",
      "hook": "Route names with Route 53.",
      "objective": "3.5"
    },
    {
      "id": "relational",
      "fields": {
        "scenario": "Managed relational database",
        "answer": "Amazon RDS"
      },
      "detail": "RDS manages relational database engines.",
      "hook": "RDS = relational.",
      "objective": "3.4"
    },
    {
      "id": "nosql",
      "fields": {
        "scenario": "Managed key-value/document database",
        "answer": "Amazon DynamoDB"
      },
      "detail": "DynamoDB is managed NoSQL.",
      "hook": "DynamoDB = NoSQL.",
      "objective": "3.4"
    }
  ]
};

const awsSaaServiceCompare: DrillDeck = {
  "id": "aws-saa-service-compare",
  "certification": "AWS Solutions Architect – Associate",
  "exam": "saa-c03",
  "objective": "1.1–4.4",
  "topic": "AWS architecture tradeoffs",
  "modes": [
    {
      "id": "scenarioToAnswer",
      "from": "scenario",
      "to": "answer"
    }
  ],
  "tables": [
    {
      "id": "scenarios",
      "fields": [
        "scenario",
        "answer"
      ]
    }
  ],
  "items": [
    {
      "id": "sg-nacl",
      "fields": {
        "scenario": "Stateful resource-level network filtering",
        "answer": "Security group"
      },
      "detail": "Security groups are stateful.",
      "hook": "Security group remembers return traffic.",
      "objective": "1.2"
    },
    {
      "id": "nacl",
      "fields": {
        "scenario": "Stateless subnet-level allow and deny rules",
        "answer": "Network ACL"
      },
      "detail": "NACLs are stateless subnet controls.",
      "hook": "NACL = subnet edge.",
      "objective": "1.2"
    },
    {
      "id": "multiaz",
      "fields": {
        "scenario": "Automatic failover for a single-standby RDS DB instance",
        "answer": "RDS Multi-AZ"
      },
      "detail": "The single standby is not readable. A Multi-AZ DB cluster has readable standbys, so qualify the deployment type.",
      "hook": "Multi-AZ = survive AZ failure.",
      "objective": "2.2"
    },
    {
      "id": "readreplica",
      "fields": {
        "scenario": "Scale reads on a relational database",
        "answer": "RDS read replica"
      },
      "detail": "Read replicas add read capacity.",
      "hook": "Replica = reads.",
      "objective": "3.3"
    },
    {
      "id": "nat",
      "fields": {
        "scenario": "Private IPv4 subnet needs internet egress through an IGW",
        "answer": "Public NAT gateway with an EIP and IGW route"
      },
      "detail": "Private NAT cannot supply internet egress through an IGW. Native IPv6 outbound-only access uses an egress-only IGW. Zonal and regional NAT have different availability designs.",
      "hook": "Private out = NAT.",
      "objective": "3.4"
    },
    {
      "id": "directconnect",
      "fields": {
        "scenario": "Dedicated private connectivity from on-premises to AWS",
        "answer": "AWS Direct Connect"
      },
      "detail": "Direct Connect is dedicated private connectivity.",
      "hook": "Dedicated circuit = Direct Connect.",
      "objective": "3.4"
    },
    {
      "id": "cloudfront",
      "fields": {
        "scenario": "Cache and deliver content near global users",
        "answer": "Amazon CloudFront"
      },
      "detail": "CloudFront is AWS CDN.",
      "hook": "Front = content near users.",
      "objective": "3.4"
    },
    {
      "id": "lambda",
      "fields": {
        "scenario": "Event-driven compute without server management",
        "answer": "AWS Lambda"
      },
      "detail": "Lambda runs serverless functions.",
      "hook": "Event arrives, function runs.",
      "objective": "3.2"
    },
    {
      "id": "spot",
      "fields": {
        "scenario": "Discounted spare EC2 capacity for interruption-tolerant batch work",
        "answer": "EC2 Spot Instances"
      },
      "detail": "Compare restart overhead, spare capacity and total cost; Spot is not an unconditional lowest-cost guarantee.",
      "hook": "Cheap if interruption is okay.",
      "objective": "4.2"
    },
    {
      "id": "role",
      "fields": {
        "scenario": "Temporary AWS permissions for an application",
        "answer": "IAM role"
      },
      "detail": "Roles provide temporary credentials.",
      "hook": "Applications assume roles.",
      "objective": "1.1"
    }
  ]
};


const awsClfDomainCues: DrillDeck = {
  "id": "aws-clf-domain-cues",
  "certification": "AWS Cloud Practitioner",
  "exam": "clf-c02",
  "objective": "1.1–4.3",
  "topic": "CLF-C02 exam language and service cues",
  "modes": [
    {
      "id": "cueToAnswer",
      "from": "cue",
      "to": "answer"
    }
  ],
  "tables": [
    {
      "id": "cues",
      "fields": [
        "cue",
        "answer"
      ]
    }
  ],
  "items": [
{
    "id": "well-architected",
    "objective": "1.2",
    "fields": {
        "cue": "Evaluate a workload using six architectural pillars",
        "answer": "AWS Well-Architected Framework"
    },
    "detail": "The six pillars are operational excellence, security, reliability, performance efficiency, cost optimization and sustainability.",
    "hook": "Framework for workload design."
},
{
    "id": "caf-perspectives",
    "objective": "1.3",
    "fields": {
        "cue": "Organize cloud transformation across business, people, governance, platform, security and operations",
        "answer": "AWS Cloud Adoption Framework"
    },
    "detail": "CAF groups capabilities into six perspectives to plan organizational cloud adoption.",
    "hook": "Adoption is broader than moving servers."
},
{
    "id": "economies",
    "objective": "1.4",
    "fields": {
        "cue": "Provider purchasing scale can lower variable unit infrastructure cost",
        "answer": "Economies of scale"
    },
    "detail": "Shared aggregate demand can lower unit cost; cloud migration does not guarantee the lowest total cost for every workload.",
    "hook": "Aggregate scale can improve unit economics."
},
    {
      "id": "elastic",
      "fields": {
        "cue": "Unpredictable demand; capacity should rise and fall automatically",
        "answer": "Elasticity"
      },
      "detail": "Elasticity matches capacity to changing demand.",
      "hook": "Unpredictable = elastic.",
      "objective": "1.1"
    },
    {
      "id": "scale",
      "fields": {
        "cue": "Workload will grow over time and needs more capacity",
        "answer": "Scalability"
      },
      "detail": "Scalability is capacity to support growth.",
      "hook": "Growth = scale.",
      "objective": "1.1"
    },
    {
      "id": "az",
      "fields": {
        "cue": "Survive failure of one data-center location inside a Region",
        "answer": "Multi-AZ design"
      },
      "detail": "Multiple AZs reduce a single-AZ failure dependency.",
      "hook": "One AZ fails; another stays.",
      "objective": "3.2"
    },
    {
      "id": "region",
      "fields": {
        "cue": "Recover from a complete AWS Region outage",
        "answer": "Multiple Regions"
      },
      "detail": "Regional disaster recovery may require another Region. Data residency instead constrains permitted locations; it does not itself require multiple Regions.",
      "hook": "Region failure needs another Region.",
      "objective": "3.2"
    },
    {
      "id": "audit",
      "fields": {
        "cue": "Who called an AWS API and when?",
        "answer": "AWS CloudTrail"
      },
      "detail": "CloudTrail records account and API activity.",
      "hook": "Trail of API calls.",
      "objective": "2.2"
    },
    {
      "id": "metrics",
      "fields": {
        "cue": "CPU metric crosses a threshold and should raise an alarm",
        "answer": "Amazon CloudWatch"
      },
      "detail": "CloudWatch handles metrics and alarms.",
      "hook": "Watch metrics.",
      "objective": "2.4"
    },
    {
      "id": "compliance",
      "fields": {
        "cue": "Download AWS compliance reports",
        "answer": "AWS Artifact"
      },
      "detail": "Artifact provides compliance documents.",
      "hook": "Compliance artifact.",
      "objective": "2.2"
    },
    {
      "id": "root",
      "fields": {
        "cue": "Protect the most privileged account identity",
        "answer": "Root user protection + MFA"
      },
      "detail": "The root user needs strong protection and minimal routine use.",
      "hook": "Root is exceptional.",
      "objective": "2.3"
    },
    {
      "id": "objects",
      "fields": {
        "cue": "Store web assets as objects in buckets",
        "answer": "Amazon S3"
      },
      "detail": "S3 is object storage.",
      "hook": "Buckets = S3.",
      "objective": "3.6"
    },
    {
      "id": "block",
      "fields": {
        "cue": "Persistent block volume for EC2",
        "answer": "Amazon EBS"
      },
      "detail": "EBS provides block volumes.",
      "hook": "EBS = block.",
      "objective": "3.6"
    },
    {
      "id": "sql",
      "fields": {
        "cue": "Managed relational database",
        "answer": "Amazon RDS"
      },
      "detail": "RDS is managed relational database service.",
      "hook": "RDS = relational.",
      "objective": "3.4"
    },
    {
      "id": "nosql",
      "fields": {
        "cue": "Managed key-value/document database",
        "answer": "Amazon DynamoDB"
      },
      "detail": "DynamoDB is managed NoSQL.",
      "hook": "Dynamo = NoSQL.",
      "objective": "3.4"
    },
    {
      "id": "dns",
      "fields": {
        "cue": "Managed DNS",
        "answer": "Amazon Route 53"
      },
      "detail": "Route 53 provides DNS.",
      "hook": "Names route with Route 53.",
      "objective": "3.5"
    },
    {
      "id": "cdn",
      "fields": {
        "cue": "Cache content near global users",
        "answer": "Amazon CloudFront"
      },
      "detail": "CloudFront is AWS CDN.",
      "hook": "Front = edge content.",
      "objective": "3.5"
    },
    {
      "id": "estimate",
      "fields": {
        "cue": "Estimate cost before deployment",
        "answer": "AWS Pricing Calculator"
      },
      "detail": "Pricing Calculator estimates planned workloads.",
      "hook": "Plan first = calculator.",
      "objective": "4.2"
    },
    {
      "id": "analyze",
      "fields": {
        "cue": "Analyze historical AWS spend",
        "answer": "AWS Cost Explorer"
      },
      "detail": "Cost Explorer analyzes spend and usage.",
      "hook": "Explore past/current cost.",
      "objective": "4.2"
    },
    {
      "id": "alert",
      "fields": {
        "cue": "Alert when spend exceeds a threshold",
        "answer": "AWS Budgets"
      },
      "detail": "Budgets tracks thresholds.",
      "hook": "Budget threshold = Budgets.",
      "objective": "4.2"
    },
    {
      "id": "queue",
      "fields": {
        "cue": "Durable queue to decouple producers and consumers",
        "answer": "Amazon SQS"
      },
      "detail": "SQS provides queues.",
      "hook": "Q = queue.",
      "objective": "3.8"
    },
    {
      "id": "fanout",
      "fields": {
        "cue": "Publish one message to many subscribers",
        "answer": "Amazon SNS"
      },
      "detail": "SNS is pub/sub.",
      "hook": "Notify subscribers.",
      "objective": "3.8"
    },
    {
      "id": "iac",
      "fields": {
        "cue": "Repeatable declarative infrastructure deployment",
        "answer": "AWS CloudFormation"
      },
      "detail": "CloudFormation is AWS infrastructure as code.",
      "hook": "Template the cloud.",
      "objective": "3.1"
    }
  ]
};

export const drillDecks: DrillDeck[] = [awsClfServiceCompare, awsSaaServiceCompare, awsClfDomainCues, ports, wifi, privateIps, appliances, dhcp, dns, networkConfig, connectionTypes, hardware, motherboardCpu, storageRaid, displays, printers, troubleshooting, mobile, virtualization, c2OsBasics, c2WindowsTools, c2CommandLine, c2WindowsSettings, c2Macos, c2Linux, c2AppsCloud, c2SecurityMeasures, c2WindowsSecurity, c2WirelessAuth, c2Malware, c2SocialEngineering, c2Hardening, c2TroubleshootWindows, c2TroubleshootMobile, c2TroubleshootSecurity, c2DocsChange, c2BackupSafety, c2PolicyCommunication, c2ScriptsRemoteAi];

export function drillHref(deckId: string) {
  return deckId === "ports" ? "/practice-games/port-drill" : `/practice-games/drills/${deckId}`;
}

export function getDeck(id: string) {
  return drillDecks.find((d) => d.id === id);
}

/** Items that have both fields a mode needs. */
export function itemsForMode(deck: DrillDeck, mode: DrillMode) {
  return deck.items.filter((i) => i.fields[mode.from] && i.fields[mode.to]);
}

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Up to four distinct answer strings: the right one plus wrong ones. */
export function choicesFor(deck: DrillDeck, mode: DrillMode, item: DrillItem, random: () => number = Math.random): string[] {
  const answer = item.fields[mode.to];
  const picked = (item.wrong?.[mode.to] ?? []).filter((w) => w !== answer);
  const pool = shuffle([...new Set(itemsForMode(deck, mode).map((i) => i.fields[mode.to]))].filter((v) => v !== answer && !picked.includes(v)), random);
  const wrong = [...shuffle(picked, random), ...pool].slice(0, 3);
  return shuffle([answer, ...wrong], random);
}
