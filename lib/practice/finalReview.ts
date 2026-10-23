// "Final 15": a 15-minute, exam-weighted recap built from the memory drills.
// Question counts per domain follow the exam's domain weights in
// content/objectives.json, so heavily tested domains get more questions.
import { drillDecks, itemsForMode, type DrillDeck, type DrillMode } from "@/lib/practice/drills";

export type Trap = { id: string; prompt: string; answer: string; wrong: string[]; detail: string; hook: string };
export type Sequence = { id: string; steps: string[] };

export type FinalReview = {
  /** URL segment: /final-15/<id>. */
  id: string;
  certification: string;
  exam: string;
  /** Mixed-round questions drawn from the drills, split by domain weight. */
  drillQuestions: number;
  /** Trap questions added to each mixed round. */
  trapsPerRound: number;
  minutes: number;
  traps: Trap[];
  sequences: Sequence[];
};

export type ReviewQuestion = {
  id: string;
  deckId: string;
  modeId: string;
  prompt: string;
  answer: string;
  /** Hand-picked wrong answers, used first. */
  wrong: string[];
  /** Every answer in the same mode, for the remaining wrong choices. */
  pool: string[];
  detail: string;
  hook: string;
  /** Exam domain number, e.g. "5" for troubleshooting. */
  domain: string;
};

export type DomainPlan = { domain: string; title: string; weight: number; count: number };

const core1: FinalReview = {
  id: "core1",
  certification: "A+ Core 1",
  exam: "220-1201",
  drillQuestions: 26,
  trapsPerRound: 4,
  minutes: 15,
  traps: [
    { id: "ups", prompt: "Must-have before flashing BIOS/UEFI firmware", answer: "A UPS or other stable power", wrong: ["The Windows admin password", "A second monitor", "An internet connection"], detail: "Losing power mid-flash can leave the motherboard unable to boot.", hook: "Flashing firmware = protect the power." },
    { id: "jumper", prompt: "Clears a forgotten BIOS password", answer: "The CMOS jumper (or pulling the CMOS battery)", wrong: ["Reinstalling Windows", "Updating the chipset driver", "Running chkdsk"], detail: "Resetting CMOS clears BIOS settings and passwords.", hook: "Jumper clears CMOS." },
    { id: "virt", prompt: "The two parts that must support hardware virtualization", answer: "CPU (VT-x / AMD-V) and BIOS/UEFI", wrong: ["CPU and RAM", "RAM and GPU", "NIC and BIOS/UEFI"], detail: "The CPU provides the feature and the firmware turns it on. RAM is needed, but it does not provide virtualization support.", hook: "CPU has it, BIOS enables it." },
    { id: "utm", prompt: "One appliance doing firewall, antivirus, antispam and content filtering", answer: "UTM", wrong: ["Spam gateway", "Proxy server", "SCADA"], detail: "Unified Threat Management bundles many security functions in one box.", hook: "Many threats, one box = UTM." },
    { id: "fileserver", prompt: "Where an internal-only file server belongs", answer: "Internal (secure) network", wrong: ["Screened subnet (DMZ)", "Guest Wi-Fi network", "Outside the firewall"], detail: "The screened subnet is for servers the internet must reach.", hook: "Only staff need it = internal." },
    { id: "scope", prompt: "DHCP term for all the settings for one subnet", answer: "Scope", wrong: ["Range", "Lease", "Reservation"], detail: "The scope contains the range, exclusions, reservations, lease time and options.", hook: "Scope holds the range." },
    { id: "zone", prompt: "Where a DNS server stores a domain's records", answer: "Zone file", wrong: ["Hosts file", "DHCP scope", "Registry hive"], detail: "The hosts file is the client's local file, checked before DNS.", hook: "Server = zone file. Client = hosts file." },
    { id: "aaaa", prompt: "DNS record that maps a name to an IPv6 address", answer: "AAAA", wrong: ["A", "CNAME", "MX"], detail: "A is IPv4; AAAA (quad-A) is IPv6.", hook: "Four As for the longer address." },
  ],
  sequences: [
    { id: "method", steps: ["Identify the problem", "Establish a theory of probable cause", "Test the theory", "Establish a plan of action and implement it", "Verify full functionality and implement preventive measures", "Document findings, actions and outcomes"] },
    { id: "laser", steps: ["Processing", "Charging", "Exposing", "Developing", "Transferring", "Fusing", "Cleaning"] },
    { id: "dora", steps: ["Discover", "Offer", "Request", "Acknowledge"] },
  ],
};

const core2: FinalReview = {
  id: "core2",
  certification: "A+ Core 2",
  exam: "220-1202",
  drillQuestions: 26,
  trapsPerRound: 4,
  minutes: 15,
  traps: [
    { id: "share-ntfs", prompt: "A user has NTFS Full Control but share Read on a folder, and opens it over the network. What access do they get?", answer: "Read (the most restrictive wins)", wrong: ["Full Control (NTFS wins)", "Modify (permissions add up)", "No access (they conflict)"], detail: "Over the network both sets apply, and the most restrictive combination wins.", hook: "Share + NTFS = the stricter one." },
    { id: "restore-order", prompt: "When is System Restore turned off during malware removal?", answer: "Before remediation (step 3), then back on near the end (step 9)", wrong: ["Never; restore points remove malware", "Only after reinstalling the OS", "Only on Windows Pro"], detail: "Infected restore points could bring the malware back, so restore is disabled before cleaning and re-enabled with a fresh restore point afterward.", hook: "Off before cleaning, on after." },
    { id: "incr-diff", prompt: "Which backup copies only what changed since the last backup of any type?", answer: "Incremental", wrong: ["Differential", "Synthetic full", "Full"], detail: "Differential copies changes since the last full backup; incremental copies changes since the last backup of any kind.", hook: "Incremental = since last anything." },
    { id: "tacacs", prompt: "Which authentication protocol uses TCP and encrypts the entire payload?", answer: "TACACS+", wrong: ["RADIUS", "Kerberos", "TKIP"], detail: "RADIUS uses UDP and encrypts only the password; TACACS+ uses TCP 49 and encrypts everything.", hook: "TACACS+ = TCP, all encrypted." },
    { id: "bitlocker-efs", prompt: "Which feature encrypts individual files for one user instead of the whole drive?", answer: "EFS", wrong: ["BitLocker", "BitLocker To Go", "FileVault"], detail: "BitLocker encrypts whole volumes; EFS encrypts files and folders on NTFS for a user account.", hook: "EFS = files; BitLocker = drive." },
    { id: "home-edition", prompt: "Which Windows edition cannot join a domain or use gpedit.msc?", answer: "Home", wrong: ["Pro", "Enterprise", "Pro for Workstations"], detail: "Domain join, gpedit.msc, BitLocker and hosting RDP need Pro or higher.", hook: "Home = no business features." },
    { id: "degauss", prompt: "Which destruction method does nothing to an SSD?", answer: "Degaussing", wrong: ["Shredding", "Drilling", "Incineration"], detail: "Degaussing erases magnetic media; SSDs store data in flash, so shred or physically destroy them.", hook: "Degauss = magnetic only." },
    { id: "volatility", prompt: "During an incident, what should be collected first?", answer: "The most volatile data, such as RAM", wrong: ["The hard drive image", "Printed logs", "Backup tapes"], detail: "Order of volatility: capture short-lived data like memory before it is lost.", hook: "Most volatile first." },
  ],
  sequences: [
    { id: "malware", steps: ["Investigate and verify malware symptoms", "Quarantine the infected system", "Disable System Restore in Windows Home", "Remediate the infected system", "Update the anti-malware software", "Scan and remove (Safe Mode or preinstallation environment)", "Reimage or reinstall if needed", "Schedule scans and run updates", "Enable System Restore and create a restore point", "Educate the end user"] },
    { id: "change", steps: ["Submit a change request with its purpose and scope", "Analyze the risk and plan a rollback", "Test the change in a sandbox", "Get change board approval", "Implement it in the maintenance window", "Confirm end-user acceptance"] },
    { id: "volatility", steps: ["CPU registers and cache", "RAM", "Swap and temporary files", "Hard drive", "Remote logs", "Backups and archives"] },
  ],
};


const awsClf: FinalReview = {
  id: "aws-clf",
  certification: "AWS Certified Cloud Practitioner",
  exam: "clf-c02",
  drillQuestions: 20,
  trapsPerRound: 4,
  minutes: 15,
  traps: [
    { id: "clf-watch-trail-config", prompt: "Metrics and alarms vs API audit vs configuration history", answer: "CloudWatch = metrics/logs/alarms; CloudTrail = API activity; Config = configuration history/rules", wrong: ["CloudTrail = metrics; Config = API activity; CloudWatch = DNS", "All three are interchangeable", "CloudWatch = compliance reports; CloudTrail = budgets; Config = object storage"], detail: "These three services appear together often because they observe different parts of an AWS environment.", hook: "Watch metrics. Trail API calls. Config configuration." },
    { id: "clf-storage", prompt: "Object vs block vs shared file storage", answer: "S3 = object; EBS = block; EFS/FSx = file", wrong: ["S3 = block; EBS = object; EFS = DNS", "EBS = shared file only; S3 = relational database", "All AWS storage is object storage"], detail: "Storage questions often become easy once you classify the storage model first.", hook: "Object S3. Block EBS. File EFS/FSx." },
    { id: "clf-db", prompt: "Availability vs read scaling for RDS", answer: "Multi-AZ = availability; read replica = read scaling", wrong: ["Multi-AZ = analytics; read replica = DNS", "Read replica = primary availability feature; Multi-AZ = only cheaper storage", "They are the same feature"], detail: "Multi-AZ and read replicas solve different primary problems.", hook: "AZ for availability. Replica for reads." },
    { id: "clf-cost-tools", prompt: "Estimate vs analyze vs alert on AWS costs", answer: "Pricing Calculator = estimate; Cost Explorer = analyze; Budgets = threshold/alert", wrong: ["Budgets = estimate architecture; Config = cost analysis", "CloudTrail = estimate; Cost Explorer = DNS", "All three only work before deployment"], detail: "Pricing Calculator is pre-deployment estimation; Cost Explorer analyzes usage; Budgets monitors thresholds.", hook: "Calculate first. Explore spend. Budget alerts." },
    { id: "clf-sg-nacl", prompt: "Stateful resource control vs stateless subnet control", answer: "Security group = stateful; network ACL = stateless", wrong: ["Security group = stateless; NACL = stateful", "Both are DNS policies", "Both attach only to IAM users"], detail: "Security groups and NACLs operate at different layers and have different state behavior.", hook: "SG remembers. NACL does not." },
    { id: "clf-role-user", prompt: "Application needs AWS permissions without a stored long-lived key", answer: "Use an IAM role with temporary credentials", wrong: ["Use the root user", "Embed a shared IAM user's access key", "Make the resource public"], detail: "Roles are the preferred pattern for AWS workloads that need permissions.", hook: "Workload = role." },
    { id: "clf-elastic-scale", prompt: "Dynamic demand matching vs capacity for growth", answer: "Elasticity = dynamic demand; scalability = growth capacity", wrong: ["Scalability = encryption; elasticity = billing", "They are unrelated to capacity", "Elasticity means only vertical scaling"], detail: "The words overlap in everyday speech but have distinct exam cues.", hook: "Elastic bends with demand. Scale handles size." },
    { id: "clf-region-az-edge", prompt: "Region vs Availability Zone vs edge location", answer: "Region = geographic area; AZ = isolated location in a Region; edge = point of presence for supported edge services", wrong: ["Region and AZ are synonyms", "Edge locations are AZs used only for databases", "A VPC is a physical Region"], detail: "AWS global infrastructure questions depend on keeping these scopes separate.", hook: "Region contains AZs; edge is separate." }
  ],
  sequences: [],
};


const awsSaa: FinalReview = {
  id: "aws-saa",
  certification: "AWS Certified Solutions Architect – Associate",
  exam: "saa-c03",
  drillQuestions: 26,
  trapsPerRound: 4,
  minutes: 15,
  traps: [
    { id: "saa-multiaz-replica", prompt: "RDS availability vs read scaling", answer: "Multi-AZ = availability/failover; read replica = read scaling", wrong: ["Multi-AZ = read scaling only; read replica = automatic failover", "They are the same feature", "Read replica = encryption; Multi-AZ = DNS"], detail: "The primary design goal differs even though both may involve another database instance.", hook: "AZ = availability. Replica = reads." },
    { id: "saa-sg-nacl", prompt: "Stateful resource filtering vs stateless subnet filtering", answer: "Security group = stateful resource control; NACL = stateless subnet control", wrong: ["Security group = stateless; NACL = stateful", "Both are IAM policies", "Both are DNS routing controls"], detail: "These layers are frequently paired as distractors.", hook: "SG remembers return traffic; NACL does not." },
    { id: "saa-sqs-sns-event", prompt: "Queue vs fanout vs event routing", answer: "SQS = queue; SNS = pub/sub fanout; EventBridge = event routing", wrong: ["SNS = queue; SQS = DNS; EventBridge = block storage", "All three are databases", "EventBridge = CDN; SQS = certificates"], detail: "Choose by messaging behavior rather than service name familiarity.", hook: "Queue SQS. Notify SNS. Route events EventBridge." },
    { id: "saa-cloudfront-ga", prompt: "CDN caching vs global network acceleration", answer: "CloudFront = caching/CDN; Global Accelerator = network path acceleration", wrong: ["Global Accelerator = object storage; CloudFront = VPN", "They are identical", "CloudFront = database proxy; Global Accelerator = DNS only"], detail: "CloudFront caches content; Global Accelerator optimizes network paths to regional endpoints.", hook: "Content = CloudFront. Network path = Accelerator." },
    { id: "saa-rto-rpo", prompt: "Recovery time vs data-loss window", answer: "RTO = recovery time; RPO = acceptable data-loss window", wrong: ["RTO = data loss; RPO = CPU target", "They are pricing models", "RPO = DNS TTL; RTO = IOPS"], detail: "DR answers often depend on reading RTO/RPO correctly.", hook: "T = time. P = point in time." },
    { id: "saa-storage", prompt: "Object vs block vs shared file vs ephemeral", answer: "S3 = object; EBS = persistent block; EFS/FSx = file; instance store = ephemeral block", wrong: ["S3 = block; EBS = DNS; EFS = object", "All are relational databases", "Instance store is durable object storage"], detail: "Classify the storage model before comparing performance and cost.", hook: "S3 object. EBS block. EFS/FSx file. Instance store temporary." },
    { id: "saa-watch-trail-config", prompt: "Metrics vs API audit vs configuration state", answer: "CloudWatch = metrics/logs/alarms; CloudTrail = API audit; Config = configuration history/rules", wrong: ["CloudTrail = metrics; Config = DNS; CloudWatch = IAM", "They are interchangeable", "CloudWatch = compliance contracts; CloudTrail = budgets"], detail: "These services observe different parts of the system.", hook: "Watch metrics. Trail calls. Config state." },
    { id: "saa-cost", prompt: "Interruptible vs steady committed vs flexible compute", answer: "Spot = interruptible; commitment discount = steady; On-Demand = flexible", wrong: ["Spot = dedicated hardware only", "On-Demand requires a long commitment", "All options cost the same"], detail: "The workload's tolerance for interruption and predictability drive the purchase model.", hook: "Can stop = Spot. Steady = commit. Flexible = On-Demand." }
  ],
  sequences: [
    { id: "dr-cost-order", steps: ["Read the workload requirement", "Identify RTO and RPO", "Choose the least-complex DR pattern that meets them", "Validate data replication and backup", "Test failover and recovery"] }
  ],
};

export const finalReviews: FinalReview[] = [core1, core2, awsClf, awsSaa];

export function getFinalReview(id: string) {
  return finalReviews.find((r) => r.id === id);
}

/** Troubleshooting domain for an exam: the domain whose title starts with "troubleshoot" or contains "troubleshooting". */
export function troubleshootingDomain(domains: { title: string; objectives: { id: string }[] }[]) {
  const d = domains.find((x) => /troubleshoot/i.test(x.title));
  return d ? d.objectives[0].id.split(".")[0] : undefined;
}

/**
 * Domain a drill question counts toward. Symptom → cause modes count as
 * troubleshooting; everything else counts toward the deck's first objective.
 */
export function domainForMode(deck: DrillDeck, mode: DrillMode, troubleshooting?: string) {
  if (mode.from === "symptom" && troubleshooting) return troubleshooting;
  return deck.objective.match(/\d+/)?.[0] ?? "";
}

export function reviewPool(review: FinalReview, troubleshooting?: string): ReviewQuestion[] {
  const out: ReviewQuestion[] = [];
  for (const deck of drillDecks.filter((d) => d.exam === review.exam)) {
    for (const mode of deck.modes) {
      const items = itemsForMode(deck, mode);
      const pool = [...new Set(items.map((i) => i.fields[mode.to]))];
      for (const item of items) {
        out.push({
          id: `${deck.id}/${mode.id}/${item.id}`,
          deckId: deck.id,
          modeId: mode.id,
          prompt: item.fields[mode.from],
          answer: item.fields[mode.to],
          wrong: item.wrong?.[mode.to] ?? [],
          pool,
          detail: item.detail,
          hook: item.hook,
          domain: domainForMode(deck, mode, troubleshooting),
        });
      }
    }
  }
  return out;
}

/** Largest-remainder split of `total` questions by percentage weight. */
export function allocate(domains: { domain: string; weight: number }[], total: number): Record<string, number> {
  const sum = domains.reduce((n, d) => n + d.weight, 0) || 1;
  const raw = domains.map((d) => ({ domain: d.domain, exact: (d.weight / sum) * total }));
  const counts = Object.fromEntries(raw.map((r) => [r.domain, Math.floor(r.exact)]));
  let left = total - Object.values(counts).reduce((n, c) => n + c, 0);
  for (const r of [...raw].sort((a, b) => (b.exact % 1) - (a.exact % 1))) {
    if (left <= 0) break;
    counts[r.domain] += 1;
    left -= 1;
  }
  return counts;
}

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Up to four distinct choices: the answer, hand-picked wrong answers, then others from the same mode. */
export function choicesFor(q: { answer: string; wrong: string[]; pool: string[] }, random: () => number = Math.random) {
  const picked = shuffle(q.wrong.filter((w) => w !== q.answer), random);
  const rest = shuffle(q.pool.filter((v) => v !== q.answer && !picked.includes(v)), random);
  return shuffle([q.answer, ...[...picked, ...rest].slice(0, 3)], random);
}

/** One mixed round: questions per domain from the plan, unique prompts, plus trap questions. */
export function buildRound(review: FinalReview, plan: DomainPlan[], pool: ReviewQuestion[], random: () => number = Math.random) {
  const picked: ReviewQuestion[] = [];
  for (const p of plan) {
    const seen = new Set<string>();
    for (const q of shuffle(pool.filter((x) => x.domain === p.domain), random)) {
      if (seen.size >= p.count) break;
      if (seen.has(q.prompt)) continue;
      seen.add(q.prompt);
      picked.push(q);
    }
  }
  const traps = shuffle(review.traps, random).slice(0, review.trapsPerRound).map(trapQuestion);
  return shuffle([...picked, ...traps], random);
}

export function trapQuestion(t: Trap): ReviewQuestion {
  return { id: `trap/${t.id}`, deckId: "traps", modeId: "trap", prompt: t.prompt, answer: t.answer, wrong: t.wrong, pool: [t.answer, ...t.wrong], detail: t.detail, hook: t.hook, domain: "trap" };
}
