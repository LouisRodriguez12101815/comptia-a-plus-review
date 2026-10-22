// "Top 5": the concepts most likely to earn points on an exam.
// CompTIA scores each question and does not publish points per concept, so
// the ranking uses domain weight (content/objectives.json) and how often a
// concept recurs across questions. Fact text stays in English, like the drills.

export type TopConcept = {
  id: string;
  title: string;
  /** Domain numbers this concept is tested under, e.g. ["3", "5"]. */
  domains: string[];
  /** Objective ids from the exam, e.g. "3.7, 3.8, 5.6". */
  objectives: string;
  /** Why it earns points, one or two sentences. */
  why: string;
  facts: string[];
  /** Memory drill deck ids (lib/practice/drills.ts) that practice it. */
  drills: string[];
};

export type TopFive = { id: string; certification: string; exam: string; concepts: TopConcept[] };

const core1: TopFive = {
  id: "core1",
  certification: "A+ Core 1",
  exam: "220-1201",
  concepts: [
    {
      id: "troubleshooting",
      title: "Troubleshooting methodology and symptom → cause",
      domains: ["5"],
      objectives: "5.1, 5.2, 5.3, 5.4, 5.5, 5.6",
      why: "Troubleshooting is the largest domain, and its scenario questions draw on every other domain. Knowing the method and the classic symptoms pays off across the whole exam.",
      facts: [
        "The six steps, in order: identify the problem; establish a theory of probable cause; test the theory; establish a plan of action and implement it; verify full functionality and implement preventive measures; document findings, actions and outcomes.",
        "No POST with beep codes → RAM or video card.",
        "Grinding or clicking drive → failing hard drive; back up now.",
        "Random shutdowns under load → overheating or a failing power supply.",
        "Wrong date and time after every reboot → dead CMOS battery.",
        "Dim laptop screen with a visible image → backlight; blank screen but an external monitor works → LCD panel or display cable.",
        "169.254.x.x address → DHCP server unreachable. Can ping an IP but not a name → DNS.",
      ],
      drills: ["troubleshooting", "storage-raid", "displays", "network-config"],
    },
    {
      id: "ports",
      title: "Ports and protocols",
      domains: ["2"],
      objectives: "2.1",
      why: "Port numbers are pure recall, and they appear both as direct questions and inside networking and troubleshooting scenarios.",
      facts: [
        "FTP 20/21 · SSH 22 · Telnet 23 · SMTP 25 · DNS 53 · DHCP 67/68 · HTTP 80.",
        "POP3 110 · NetBIOS 137–139 · IMAP 143 · SNMP 161/162 · LDAP 389 · HTTPS 443 · SMB 445 · RDP 3389.",
        "UDP: DHCP and SNMP. Both: DNS (UDP lookups, TCP zone transfers). The rest on the list use TCP.",
        "Secure replacements: SSH (22) replaces Telnet (23); HTTPS (443) replaces HTTP (80).",
      ],
      drills: ["ports"],
    },
    {
      id: "hardware",
      title: "Hardware components: RAM, boards, power and cables",
      domains: ["3"],
      objectives: "3.2, 3.3, 3.5, 3.6",
      why: "Hardware is the second-largest domain, and most of it is identification: which module, connector or cable fits which job.",
      facts: [
        "DIMM pins: DDR 184 · DDR2 240 · DDR3 240 · DDR4 288 · DDR5 288. Laptops use SO-DIMMs (DDR4 SO-DIMM: 260 pins).",
        "Form factors: ATX (standard) → microATX (smaller, fits ATX cases) → Mini-ITX (smallest common).",
        "The CMOS battery (CR2032) keeps the clock and settings; the CMOS jumper clears BIOS settings and passwords.",
        "Power: 24-pin ATX for the board, 4/8-pin EPS for the CPU, 6/8-pin PCIe for the graphics card, 15-pin SATA for drives.",
        "Cables: Cat 5e 1 Gbps to 100 m · Cat 6 10 Gbps to 55 m · Cat 6a 10 Gbps to 100 m. Single-mode fiber for long runs, multimode for short.",
      ],
      drills: ["hardware", "motherboard-cpu"],
    },
    {
      id: "addressing",
      title: "IP addressing, DHCP and DNS",
      domains: ["2"],
      objectives: "2.3, 2.4, 2.6",
      why: "Addressing and these two services sit under almost every networking question, and their symptoms show up again in troubleshooting.",
      facts: [
        "Private ranges: 10.0.0.0/8 · 172.16.0.0/12 (172.16–172.31 only) · 192.168.0.0/16. APIPA: 169.254.x.x. Loopback: 127.0.0.1.",
        "DHCP: the scope holds the range, exclusions, reservations, lease time and options. A reservation always gives one MAC address the same IP.",
        "DHCP order is DORA: Discover, Offer, Request, Acknowledge. Server UDP 67, client UDP 68.",
        "DNS records: A (IPv4) · AAAA (IPv6) · CNAME (alias) · MX (mail server) · TXT (SPF, DKIM, DMARC). DNS uses port 53.",
        "The default gateway is the router address for traffic leaving the subnet. Local works but internet fails → check the gateway.",
      ],
      drills: ["private-ip", "dhcp", "dns", "network-config"],
    },
    {
      id: "printers",
      title: "Printers: types, the laser process and faults",
      domains: ["3", "5"],
      objectives: "3.7, 3.8, 5.6",
      why: "Printers are tested in both the hardware and troubleshooting domains, and the laser steps and classic faults are easy points once memorized.",
      facts: [
        "Laser printing: Processing → Charging → Exposing → Developing → Transferring → Fusing → Cleaning.",
        "Ghost images → drum or cleaning problem. Smudged toner → fuser not heating. Blank page → empty toner. Jams at pickup → worn rollers.",
        "Laser uses toner, a drum and a fuser. Inkjet sprays liquid ink. Impact strikes a ribbon (multipart forms). Thermal heats special paper (receipts).",
        "Maintenance kits replace rollers and the fuser at the manufacturer's page count.",
      ],
      drills: ["hardware", "troubleshooting"],
    },
  ],
};

export const topFives: TopFive[] = [core1];

export function getTopFive(id: string) {
  return topFives.find((t) => t.id === id);
}
