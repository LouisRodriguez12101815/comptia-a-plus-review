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

export const finalReviews: FinalReview[] = [core1];

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
