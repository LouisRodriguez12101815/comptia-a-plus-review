/**
 * Resolve question objective scope without turning a broad topic into evidence
 * for every objective attached to that topic. Explicit question metadata wins;
 * an explicit empty list opts a question out; legacy questions retain the
 * single-objective topic fallback.
 */
export function objectiveTopicMap(exam) {
  const map = new Map();
  for (const domain of exam.domains ?? []) {
    for (const objective of domain.objectives ?? []) {
      for (const topicId of objective.topics ?? []) {
        const ids = map.get(topicId) ?? [];
        if (!ids.includes(objective.id)) ids.push(objective.id);
        map.set(topicId, ids);
      }
    }
  }
  return map;
}

export function questionObjectiveIds(question, examCode, topicObjectives) {
  const explicit = question.objectiveIds?.[examCode];
  if (Array.isArray(explicit)) return [...explicit];
  const inferred = topicObjectives.get(question.topicId) ?? [];
  return inferred.length === 1 ? [...inferred] : [];
}
