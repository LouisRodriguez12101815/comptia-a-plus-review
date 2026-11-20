/** Questions with recorded option-by-option official-source checks in the SAA audit.
 * A change to their content requires a fresh review; the regression test checks
 * the authored questions against that evidence before they enter this pool.
 */
export const SAA_DIAGNOSTIC_IDS = Object.freeze([
  ...Array.from({ length: 16 }, (_, i) => `q-saa-bank-${String(i + 1).padStart(3, '0')}`),
  ...Array.from({ length: 8 }, (_, i) => `q-saa-costbatch-${String(i + 1).padStart(3, '0')}`),
  'q-saa-arch-31',
]);

/** Keep the exam's existing mappings but recompute all availability counts. */
export function saaDiagnosticPool(pool) {
  const allowed = new Set(SAA_DIAGNOSTIC_IDS);
  const domains = pool.domains.map((domain) => {
    const objectives = domain.objectives.map((objective) => ({
      ...objective,
      questionIds: objective.questionIds.filter((id) => allowed.has(id)),
    }));
    return { ...domain, objectives, available: new Set(objectives.flatMap((item) => item.questionIds)).size };
  });
  return { ...pool, domains, totalUnique: new Set(domains.flatMap((domain) => domain.objectives.flatMap((item) => item.questionIds))).size };
}

/** Keep the existing weak-area ranking; put remaining tasks in miss-count order. */
export function rankDiagnosticMisses(entries, rankedObjectiveIds) {
  const priority = new Map(rankedObjectiveIds.map((id, index) => [id, index]));
  return [...entries].sort(([a, aPicks], [b, bPicks]) =>
    (priority.get(a) ?? Number.MAX_SAFE_INTEGER) - (priority.get(b) ?? Number.MAX_SAFE_INTEGER)
      || bPicks.length - aPicks.length || a.localeCompare(b));
}
