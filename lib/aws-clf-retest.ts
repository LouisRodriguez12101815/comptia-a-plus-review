import type { ClfAssessmentRow } from "@/lib/aws-clf-assessment";
import type { ClfAssessmentSnapshot } from "@/lib/progress";

export type ClfRetestComparison = {
  objectiveId: string;
  baselineAccuracy: number | null;
  retestAccuracy: number | null;
  accuracyChange: number | null;
  newDistinctQuestions: number;
  repeatedQuestions: number;
  outcome: "improved" | "unchanged" | "regressed" | "insufficient";
};

function fingerprint(text: string) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(16);
}

export function snapshotFromAssessment(rows: ClfAssessmentRow[], kind: ClfAssessmentSnapshot["kind"], bankVersion: string, at: number): ClfAssessmentSnapshot {
  const objectives = Object.fromEntries(rows.map((row) => [row.objectiveId, {
    accuracy: row.accuracy,
    distinctQuestions: row.distinctQuestions,
    evidence: row.evidence,
    state: row.state,
    questionEvidence: row.questionEvidence,
  }]));
  const id = `${kind}:${bankVersion}:${fingerprint(JSON.stringify({ at, objectives }))}`;
  return { id, kind, at, bankVersion, objectives };
}

export function compareWithBaseline(baseline: ClfAssessmentSnapshot, rows: ClfAssessmentRow[]): ClfRetestComparison[] {
  return rows.map((row) => {
    const before = baseline.objectives[row.objectiveId];
    const baselineIds = new Set(before?.questionEvidence.map((item) => item.questionId) ?? []);
    const post = row.questionEvidence.filter((item) => item.at > baseline.at);
    const fresh = post.filter((item) => !baselineIds.has(item.questionId));
    const repeated = post.filter((item) => baselineIds.has(item.questionId));
    const retestAccuracy = fresh.length ? Math.round((100 * fresh.filter((item) => item.correct).length) / fresh.length) : null;
    const accuracyChange = before?.accuracy !== null && before?.accuracy !== undefined && retestAccuracy !== null ? retestAccuracy - before.accuracy : null;
    const outcome = fresh.length < 1 || accuracyChange === null ? "insufficient" : accuracyChange >= 10 ? "improved" : accuracyChange <= -10 ? "regressed" : "unchanged";
    return { objectiveId: row.objectiveId, baselineAccuracy: before?.accuracy ?? null, retestAccuracy, accuracyChange, newDistinctQuestions: fresh.length, repeatedQuestions: repeated.length, outcome };
  });
}
