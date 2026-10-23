export type ReadinessDomain = { id: string; title: string; correct: number; total: number };
export type ReadinessAttempt = {
  exam: string;
  full: boolean;
  percent: number;
  domains: ReadinessDomain[];
  multiCorrect: number;
  multiTotal: number;
  questionIds?: string[];
};

export type ReadinessStatus = "ready" | "near" | "not-ready";

export type ReadinessResult = {
  status: ReadinessStatus;
  fullAttempts: number;
  overallScores: number[];
  domainFloor: number | null;
  multiPercent: number | null;
  exposurePercent: number | null;
  missingObjectives: number;
  blockers: string[];
  weakDomains: { id: string; title: string; percent: number }[];
};

export function evaluateReadiness(
  attempts: ReadinessAttempt[],
  exam: string,
  missingObjectives: number,
  bankSize: number,
): ReadinessResult {
  const recent = attempts.filter((attempt) => attempt.exam === exam && attempt.full).slice(0, 3);
  const overallScores = recent.map((attempt) => attempt.percent);
  const domainTotals = new Map<string, { title: string; correct: number; total: number }>();
  let domainFloor: number | null = null;
  let multiCorrect = 0;
  let multiTotal = 0;
  const seenQuestions = new Set<string>();

  for (const attempt of recent) {
    multiCorrect += attempt.multiCorrect;
    multiTotal += attempt.multiTotal;
    for (const id of attempt.questionIds ?? []) seenQuestions.add(id);
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
  if (missingObjectives > 0) blockers.push(`Close ${missingObjectives} missing objective${missingObjectives === 1 ? "" : "s"}.`);

  const ready = blockers.length === 0;
  const near = !ready
    && recent.length >= 2
    && overallScores.every((score) => score >= 75)
    && (domainFloor === null || domainFloor >= 65)
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
    missingObjectives,
    blockers,
    weakDomains,
  };
}
