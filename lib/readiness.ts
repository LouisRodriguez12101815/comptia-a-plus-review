export type ReadinessDomain = { id: string; title: string; correct: number; total: number };
export type ReadinessAttempt = {
  exam: string;
  full: boolean;
  percent: number;
  domains: ReadinessDomain[];
  multiCorrect: number;
  multiTotal: number;
  questionIds?: string[];
  bankVersion?: string;
  at?: number;
  correctIds?: string[];
  missedIds?: string[];
  /** Percent of this mock's questions already seen before it started. */
  seenShare?: number;
  multiQuestionIds?: string[];
};

export type ReadinessStatus = "ready" | "near" | "not-ready";

export type ReadinessResult = {
  status: ReadinessStatus;
  fullAttempts: number;
  overallScores: number[];
  domainFloor: number | null;
  multiPercent: number | null;
  exposurePercent: number | null;
  /** Pooled accuracy of the recent full mocks, from their domain totals. */
  overallPercent: number | null;
  /** First time each question was graded inside the evidence window. */
  firstAttemptPercent: number | null;
  /** One row per mock for this exam, newest first when the input is. */
  mockSeen: { at: number | null; seenShare: number | null }[];
  missingObjectives: number;
  blockers: string[];
  weakDomains: { id: string; title: string; percent: number }[];
};

export function evaluateReadiness(
  attempts: ReadinessAttempt[],
  exam: string,
  missingObjectives: number,
  bankSize: number,
  evidence?: { version: string; questionIds: string[]; multiIds: string[]; now?: number; expectedDomains: string[] },
): ReadinessResult {
  const now = evidence?.now ?? Date.now();
  const validIds = evidence ? new Set(evidence.questionIds) : null;
  const matching = attempts.filter(attempt => attempt.exam === exam && attempt.full
    && (!evidence || (attempt.bankVersion === evidence.version && typeof attempt.at === "number"
      && attempt.at <= now && attempt.at >= now - 90 * 86400000)));
  const recent = matching.slice(0, 3);
  const overallScores = recent.map((attempt) => attempt.percent);
  const domainTotals = new Map<string, { title: string; correct: number; total: number }>();
  let domainFloor: number | null = null;
  let multiCorrect = 0;
  let multiTotal = 0;
  const seenQuestions = new Set<string>();

  for (const attempt of recent) {
    multiCorrect += attempt.multiCorrect;
    multiTotal += attempt.multiTotal;
    for (const id of attempt.questionIds ?? []) if (!validIds || validIds.has(id)) seenQuestions.add(id);
    for (const domain of attempt.domains) {
      const pct = Math.round((100 * domain.correct) / domain.total);
      domainFloor = domainFloor === null ? pct : Math.min(domainFloor, pct);
      const current = domainTotals.get(domain.id) ?? { title: domain.title, correct: 0, total: 0 };
      current.correct += domain.correct;
      current.total += domain.total;
      domainTotals.set(domain.id, current);
    }
  }

  const multiPercent = multiTotal ? Math.round((100 * multiCorrect) / multiTotal) : null;
  const exposurePercent = bankSize > 0 ? Math.round((100 * seenQuestions.size) / bankSize) : null;
  let pooledCorrect = 0;
  let pooledTotal = 0;
  for (const attempt of recent) {
    for (const domain of attempt.domains) {
      pooledCorrect += domain.correct;
      pooledTotal += domain.total;
    }
  }
  const overallPercent = pooledTotal ? Math.round((100 * pooledCorrect) / pooledTotal) : null;
  const seenBefore = (attempt: ReadinessAttempt) => {
    if (typeof attempt.seenShare === "number" && Number.isInteger(attempt.seenShare)) return attempt.seenShare;
    const ids = attempt.questionIds ?? [];
    if (!ids.length || typeof attempt.at !== "number") return null;
    const prior = new Set<string>();
    for (const other of matching) {
      if (typeof other.at !== "number" || other.at >= attempt.at) continue;
      for (const id of other.questionIds ?? []) prior.add(id);
    }
    const already = ids.filter((id) => prior.has(id)).length;
    return Math.round((100 * already) / ids.length);
  };
  const mockSeen = attempts
    .filter((attempt) => attempt.exam === exam)
    .map((attempt) => ({ at: typeof attempt.at === "number" ? attempt.at : null, seenShare: seenBefore(attempt) }));
  const first = new Map<string, boolean>();
  for (const a of [...matching].reverse()) for (const id of a.questionIds ?? []) {
    if (validIds && !validIds.has(id)) continue;
    if (!first.has(id)) first.set(id, (a.correctIds ?? []).includes(id));
  }
  const firstAttemptPercent = first.size ? Math.round((100 * [...first.values()].filter(Boolean).length) / first.size) : null;
  const weakDomains = [...domainTotals.entries()]
    .map(([id, value]) => ({ id, title: value.title, percent: Math.round((100 * value.correct) / value.total) }))
    .filter((domain) => domain.percent < 80)
    .sort((a, b) => a.percent - b.percent || a.id.localeCompare(b.id));

  const blockers: string[] = [];
  if (recent.length < 3) blockers.push("Complete three full mock exams.");
  if (recent.some((attempt) => attempt.percent < 80)) blockers.push("Score at least 80% on each of the last three full mocks.");
  if (domainFloor !== null && domainFloor < 70) blockers.push("Raise every domain to at least 70% on the recent full mocks.");
  if (multiPercent === null) blockers.push("Complete enough multi-response questions to establish multi-select accuracy.");
  else if (multiPercent < 75) blockers.push("Raise multi-response accuracy to at least 75%.");
  if (exposurePercent === null || exposurePercent < 80) blockers.push("Cover at least 80% of the current question bank across recent full mocks.");
  if (missingObjectives > 0) blockers.push(`Close ${missingObjectives} incomplete objective${missingObjectives === 1 ? "" : "s"}.`);
  if (evidence) {
    if (recent.some(a => evidence.expectedDomains.some(id => !a.domains.some(d => d.id === id && d.total > 0)))) blockers.push("Include every exam domain in each full mock.");
    const testedMulti = new Set(recent.flatMap(a => a.multiQuestionIds ?? []).filter(id => evidence.multiIds.includes(id)));
    if (testedMulti.size < Math.min(8, evidence.multiIds.length) || testedMulti.size === 0) blockers.push("Build accuracy across distinct multiple-response items, not repeated copies.");
    // Oldest to newest: the same first-exposure map shown on the readiness view.
    const firstAccuracy = first.size ? 100 * [...first.values()].filter(Boolean).length / first.size : 0;
    if (first.size < Math.ceil(bankSize * 0.8) || firstAccuracy < 80) blockers.push("Reach the practice target on first exposures in this content version; repeat familiarity alone is insufficient.");
  }

  const ready = blockers.length === 0;
  const near = !ready
    && recent.length >= 2
    && overallScores.every((score) => score >= 75)
    && domainFloor !== null && domainFloor >= 70
    && (multiPercent === null || multiPercent >= 65)
    && (exposurePercent === null || exposurePercent >= 65)
    && missingObjectives === 0;

  return {
    status: ready ? "ready" : near ? "near" : "not-ready",
    fullAttempts: recent.length,
    overallScores,
    domainFloor,
    multiPercent,
    exposurePercent,
    overallPercent,
    firstAttemptPercent,
    mockSeen,
    missingObjectives,
    blockers,
    weakDomains,
  };
}
