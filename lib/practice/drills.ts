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

export const drillDecks: DrillDeck[] = [ports, wifi, privateIps, appliances, dhcp, dns];

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
