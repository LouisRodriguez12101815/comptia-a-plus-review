// Rapid-fire memory drills for A+ Core 1 (220-1201) facts.
// Each deck is a list of items with named fields. A mode asks for one field
// given another; answer choices are the other distinct values of that field.
// Fact text stays in English (like protocol names); UI text lives in messages/.
import { corePorts } from "@/lib/practice/ports";

export type DrillItem = {
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
  objective: string;
  /** Topic shown in the Practice Games filter. */
  topic: string;
  modes: DrillMode[];
  tables: DrillTable[];
  items: DrillItem[];
};

const ports: DrillDeck = {
  id: "ports",
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
  objective: "2.3",
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
  objective: "2.4, 2.5",
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
  objective: "2.6",
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
  objective: "2.6",
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
  ],
};

const mobile: DrillDeck = {
  id: "mobile",
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

export const drillDecks: DrillDeck[] = [ports, wifi, privateIps, appliances, dhcp, dns, hardware, troubleshooting, mobile, virtualization];

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
