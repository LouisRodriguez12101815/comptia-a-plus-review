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

const core2: TopFive = {
  id: "core2",
  certification: "A+ Core 2",
  exam: "220-1202",
  concepts: [
    {
      id: "malware",
      title: "Malware: types, removal steps and symptoms",
      domains: ["2", "3"],
      objectives: "2.4, 2.6, 3.4",
      why: "Security is tied for the largest domain, and malware runs through it and through PC security troubleshooting. The ten removal steps are a likely ordering question.",
      facts: [
        "Removal, in order: investigate and verify; quarantine; disable System Restore (Windows Home); remediate; update anti-malware; scan and remove in Safe Mode or a preinstallation environment; reimage if needed; schedule scans and updates; re-enable System Restore and create a restore point; educate the user.",
        "Ransomware encrypts and renames files. Rootkits hide in the OS core. Boot sector viruses load before Windows. Fileless malware lives in memory. Cryptominers slow the PC.",
        "Symptoms: random pop-ups and redirects (adware, hijacked browser), fake antivirus alerts (scareware), failed updates, certificate warnings.",
        "EDR protects each endpoint, MDR is a managed service, XDR correlates endpoints, network, email and cloud.",
      ],
      drills: ["c2-malware", "c2-troubleshoot-security"],
    },
    {
      id: "windows-tools",
      title: "Windows tools, commands and settings",
      domains: ["1"],
      objectives: "1.4, 1.5, 1.6, 1.7",
      why: "Operating systems is tied for the largest domain, and its scenario questions ask which tool, command or setting solves the problem.",
      facts: [
        "MMC snap-ins: eventvwr.msc (logs), diskmgmt.msc (partitions), devmgmt.msc (drivers), taskschd.msc (scheduled tasks), lusrmgr.msc (local users), gpedit.msc (local policy).",
        "msconfig (Safe boot), msinfo32 (system summary), resmon (detailed resources), cleanmgr (free space), regedit (registry).",
        "Commands: sfc /scannow (system files), chkdsk (disk errors), gpupdate /force and gpresult (policy), net use (map drive), robocopy (robust copy), pathping (route plus loss), whoami, winver.",
        "Networking: domain vs. workgroup, public vs. private profile, metered connections, proxy settings, mapped drives.",
      ],
      drills: ["c2-windows-tools", "c2-command-line", "c2-windows-settings"],
    },
    {
      id: "windows-troubleshooting",
      title: "Windows and mobile troubleshooting",
      domains: ["3"],
      objectives: "3.1, 3.2, 3.3",
      why: "Software troubleshooting is almost a quarter of the exam, and nearly every item is a symptom-to-fix scenario.",
      facts: [
        "BSOD after a driver: roll it back from Safe Mode. Won't boot: Startup Repair. No OS found: boot order, then repair boot records.",
        "Services not starting: check dependencies and startup type. USB controller resource warning: spread devices across controllers. Time drift: resync with a time server.",
        "Mobile: app won't launch (force stop, clear cache, reinstall); OS update fails (space, battery, Wi-Fi); no autorotate (rotation lock).",
        "Mobile security signs: data-usage spikes, a flood of ads, fake security warnings, leaked files; causes include sideloaded apps, root/jailbreak and developer mode.",
      ],
      drills: ["c2-troubleshoot-windows", "c2-troubleshoot-mobile"],
    },
    {
      id: "security-settings",
      title: "Security measures, Windows security and wireless authentication",
      domains: ["2"],
      objectives: "2.1, 2.2, 2.3, 2.5",
      why: "These are the core comparisons of the Security domain: which control, which encryption, which protocol, which attack.",
      facts: [
        "BitLocker encrypts a whole drive, BitLocker To Go removable drives, EFS individual files. NTFS + share permissions: the most restrictive wins.",
        "WPA3 uses SAE; WPA2 uses AES; TKIP is legacy. RADIUS = UDP, password encrypted; TACACS+ = TCP 49, everything encrypted; Kerberos = tickets in AD.",
        "Physical: bollards, access control vestibule (stops tailgating), badge readers, magnetometers. Logical: least privilege, Zero Trust, MFA, SSO, SAML, DLP, MDM.",
        "Social engineering: phishing by email, vishing by voice, smishing by text, whaling targets executives; evil twin copies a Wi-Fi name.",
      ],
      drills: ["c2-security-measures", "c2-windows-security", "c2-wireless-auth", "c2-social-engineering"],
    },
    {
      id: "operational",
      title: "Operational procedures: documentation, backup, safety, remote support and AI",
      domains: ["4"],
      objectives: "4.1–4.10",
      why: "Operational procedures is 21% of the exam and mixes recall with scenarios: documentation, change control, backup, safety, policy, professionalism, scripting, remote access and AI.",
      facts: [
        "Documentation: tickets (severity, escalation), CMDB, asset tags, SOPs, SLAs, knowledge base, onboarding and off-boarding checklists.",
        "Full copies everything; incremental copies changes since the last backup of any type; differential copies changes since the last full. 3-2-1: three copies, two media, one offsite.",
        "Change types: standard (pre-approved), normal (change board), emergency (expedited). Every change needs a rollback plan; test in a sandbox first.",
        "Safety and environment: disconnect power, control ESD, secure cables, use approved disposal, use a UPS for outages and surge protection for spikes.",
        "Policy and professionalism: preserve incident evidence, protect private data, follow licensing/AUP rules, listen actively, clarify the issue and reset expectations when timelines change.",
        "Scripting, remote access and AI: recognize script extensions, use approved secure remote methods, follow AI policy, protect sensitive data and verify generated output.",
      ],
      drills: ["c2-docs-change", "c2-backup-safety", "c2-policy-communication", "c2-scripts-remote-ai"],
    },
  ],
};


const awsClf: TopFive = {
  id: "aws-clf",
  certification: "AWS Certified Cloud Practitioner",
  exam: "clf-c02",
  concepts: [
    {
      id: "service-positioning",
      title: "Recognize the right AWS service for the job",
      domains: ["3"],
      objectives: "3.1–3.8",
      why: "Cloud Technology and Services is the largest CLF-C02 domain, and many questions are service-recognition decisions rather than implementation tasks.",
      facts: [
        "EC2 = virtual machines; Lambda = event-driven serverless functions; ECS/EKS = containers; Fargate = serverless container compute.",
        "S3 = object storage; EBS = block storage; EFS/FSx = file storage.",
        "RDS/Aurora = relational; DynamoDB = key-value/document NoSQL; ElastiCache = in-memory cache; Redshift = data warehouse.",
        "Route 53 = DNS; CloudFront = CDN; Direct Connect = dedicated private connectivity; Site-to-Site VPN = encrypted internet tunnel.",
        "CloudWatch = metrics/logs/alarms; CloudTrail = API audit; Config = resource configuration history/rules.",
      ],
      drills: ["aws-clf-service-compare", "aws-clf-domain-cues"],
    },
    {
      id: "security",
      title: "Shared responsibility, IAM, and core security services",
      domains: ["2"],
      objectives: "2.1–2.4",
      why: "Security and Compliance is 30% of scored content and combines responsibility boundaries with identity, compliance, encryption, and security-service recognition.",
      facts: [
        "AWS secures the infrastructure of the cloud; customers secure data, identities, permissions, and many workload configurations.",
        "Protect the root user, use MFA, apply least privilege, and prefer roles/temporary credentials for workloads.",
        "KMS manages encryption keys; Secrets Manager stores and rotates application secrets.",
        "Artifact = compliance reports; GuardDuty = threat detection; Inspector = vulnerability management; Shield = DDoS; WAF = web request filtering.",
      ],
      drills: ["aws-clf-service-compare", "aws-clf-domain-cues"],
    },
    {
      id: "global-cloud",
      title: "Cloud value, elasticity, Regions, AZs, and edge",
      domains: ["1", "3"],
      objectives: "1.1–1.4, 3.2",
      why: "These concepts appear directly and also act as context for availability, latency, migration, and economics questions.",
      facts: [
        "Scalability supports larger workloads; elasticity dynamically adjusts capacity as demand changes.",
        "A Region contains multiple isolated Availability Zones; edge locations are separate points of presence for supported edge services.",
        "Multi-AZ improves availability within a Region; multi-Region designs address regional DR, sovereignty, or global latency.",
        "Cloud economics favor rightsizing, automation, variable usage-based spending, and reducing overprovisioning.",
      ],
      drills: ["aws-clf-domain-cues"],
    },
    {
      id: "billing",
      title: "Pricing models, cost tools, and Organizations",
      domains: ["4"],
      objectives: "4.1, 4.2",
      why: "Billing questions are small in weight but highly learnable because each tool and purchasing option has a distinct purpose.",
      facts: [
        "Pricing Calculator estimates planned cost; Cost Explorer analyzes actual spend; Budgets alerts on thresholds.",
        "On-Demand = flexibility; commitment models can reduce steady-use cost; Spot = interruption-tolerant spare capacity.",
        "Organizations supports multi-account management and consolidated billing.",
        "Cost allocation tags help attribute spend to teams, projects, or environments.",
      ],
      drills: ["aws-clf-domain-cues"],
    },
    {
      id: "support",
      title: "AWS support and technical resources",
      domains: ["4"],
      objectives: "4.3",
      why: "Support questions reward knowing where to look: official documentation, re:Post, Knowledge Center, Prescriptive Guidance, Support Center, and the appropriate support channel.",
      facts: [
        "Use official AWS documentation and whitepapers for authoritative service guidance.",
        "AWS re:Post is a managed community knowledge/Q&A resource.",
        "Prescriptive Guidance provides patterns and implementation guidance.",
        "Support-plan details can change, so verify current AWS support offerings rather than relying on stale memorization.",
      ],
      drills: ["aws-clf-domain-cues"],
    },
  ],
};


const awsSaa: TopFive = {
  id: "aws-saa",
  certification: "AWS Certified Solutions Architect – Associate",
  exam: "saa-c03",
  concepts: [
    {
      id: "secure",
      title: "Secure access, network boundaries, and data protection",
      domains: ["1"],
      objectives: "1.1–1.3",
      why: "Secure Architectures is the largest SAA-C03 domain at 30%, and security constraints appear inside many architecture scenarios.",
      facts: [
        "Prefer roles and temporary credentials for workloads; explicit deny overrides allow; permissions boundaries limit maximum identity permissions.",
        "Security groups are stateful resource controls; network ACLs are stateless subnet controls.",
        "KMS manages keys, Secrets Manager stores/rotates secrets, ACM manages supported TLS certificates, CloudHSM provides dedicated HSMs.",
        "WAF filters web requests, Shield protects against DDoS, GuardDuty detects threats, Inspector finds supported workload vulnerabilities, Macie discovers sensitive data in S3.",
      ],
      drills: ["aws-saa-secure-cues", "aws-saa-service-compare"],
    },
    {
      id: "resilient",
      title: "Decoupling, Multi-AZ, and disaster recovery",
      domains: ["2"],
      objectives: "2.1–2.2",
      why: "Resilient design is 26% of SAA-C03 and rewards selecting the cheapest architecture that still meets availability, RTO, and RPO.",
      facts: [
        "Use SQS to buffer asynchronous work and let producers/consumers scale independently.",
        "Deploy stateless tiers across multiple AZs; use Auto Scaling and load balancing to replace failed capacity.",
        "RTO = maximum acceptable recovery time; RPO = maximum acceptable data-loss window.",
        "DR cost generally rises from backup/restore → pilot light → warm standby → active/active as recovery time falls.",
      ],
      drills: ["aws-saa-resilient-cues", "aws-saa-service-compare"],
    },
    {
      id: "performance",
      title: "Storage, compute, database, network, and ingestion performance",
      domains: ["3"],
      objectives: "3.1–3.5",
      why: "High-Performing Architectures is 24% and tests whether a service choice matches the actual bottleneck rather than simply choosing the largest resource.",
      facts: [
        "Choose storage by access model and performance need: S3 object, EBS block, EFS/FSx file, instance store ephemeral.",
        "Read replicas scale relational reads; DAX accelerates DynamoDB reads; caches reduce repeated hot work.",
        "CloudFront caches content at the edge; Global Accelerator improves network routing to regional endpoints.",
        "Kinesis Data Streams exposes stream records to consumers; Data Firehose provides managed delivery to supported destinations.",
      ],
      drills: ["aws-saa-performance-cues", "aws-saa-service-compare"],
    },
    {
      id: "cost",
      title: "Compute, storage, database, and network cost optimization",
      domains: ["4"],
      objectives: "4.1–4.4",
      why: "Cost optimization is 20% of the exam and often hides the expensive part in idle capacity, storage retention, or data-transfer paths.",
      facts: [
        "Spot for interruption-tolerant work; commitment discounts for predictable steady use; On-Demand for flexibility.",
        "Use lifecycle policies and appropriate S3 storage classes rather than retaining all data in the hottest tier.",
        "Rightsize compute and databases; use serverless for suitable sporadic workloads to avoid idle capacity.",
        "Evaluate data-transfer paths, NAT processing, cross-AZ/Region traffic, VPC endpoints, and CDN caching.",
      ],
      drills: ["aws-saa-cost-cues", "aws-saa-service-compare"],
    },
    {
      id: "service-tradeoffs",
      title: "Know the 'same-looking' AWS services apart",
      domains: ["1", "2", "3", "4"],
      objectives: "1.1–4.4",
      why: "SAA scenarios frequently give several technically valid AWS services; the winning answer is the one that best satisfies the stated constraints with the least unnecessary cost or operations.",
      facts: [
        "Multi-AZ = database availability; read replica = read scaling.",
        "SQS = durable queue; SNS = pub/sub fanout; EventBridge = event routing.",
        "CloudWatch = metrics/logs/alarms; CloudTrail = API activity; Config = configuration history/rules.",
        "CloudFront = CDN/caching; Global Accelerator = network path acceleration.",
      ],
      drills: ["aws-saa-service-compare", "aws-saa-secure-cues", "aws-saa-resilient-cues", "aws-saa-performance-cues", "aws-saa-cost-cues"],
    },
  ],
};

export const topFives: TopFive[] = [core1, core2, awsClf, awsSaa];

export function getTopFive(id: string) {
  return topFives.find((t) => t.id === id);
}
