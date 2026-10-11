import type { Round, Receipt, Scenario } from "@/lib/practice/types";
export type MissionQuestion = Round & { objectiveId: string; stage: "practice" | "application" };
export type Mission = {
  id: string; version: number; title: string; description: string; exam: string;
  objectives: { id: string; label: string; practiceId: string; applicationIds: string[]; review: { label: string; href: string }[]; achievement: { title: string; reason: string } }[];
  questions: MissionQuestion[]; scenarios: Scenario[];
};
export type MissionRecord = { missionId: string; version: number; receipts: Record<string, Receipt> };
export const emptyMission = (mission: Mission): MissionRecord => ({ missionId: mission.id, version: mission.version, receipts: {} });
const matches = (record: MissionRecord, mission: Mission) => record.missionId === mission.id && record.version === mission.version;
export const completed = (record: MissionRecord, question: MissionQuestion) => !!record.receipts[question.id]?.attemptedIds.includes(question.correctAnswerId);
export const independent = (record: MissionRecord, question: MissionQuestion) => record.receipts[question.id]?.attemptedIds[0] === question.correctAnswerId && !record.receipts[question.id]?.hintUsed;
export function nextQuestion(record: MissionRecord, mission: Mission, objectiveId: string) {
  const objective = mission.objectives.find((o) => o.id === objectiveId);
  if (!matches(record, mission) || !objective) return undefined;
  const practice = mission.questions.find((q) => q.id === objective.practiceId)!;
  if (!completed(record, practice)) return practice;
  const applications = objective.applicationIds.map((id) => mission.questions.find((q) => q.id === id)!);
  if (applications.some((q) => independent(record, q))) return undefined;
  return applications.find((q) => !completed(record, q));
}
export function missionAnswer(record: MissionRecord, mission: Mission, questionId: string, answerId: string) {
  const question = mission.questions.find((q) => q.id === questionId);
  if (!question || nextQuestion(record, mission, question.objectiveId)?.id !== questionId || !question.choices.some((c) => c.id === answerId)) return record;
  const receipt = record.receipts[questionId] ?? { attemptedIds: [], hintUsed: false };
  if (receipt.attemptedIds.includes(answerId)) return record;
  return { ...record, receipts: { ...record.receipts, [questionId]: { ...receipt, attemptedIds: [...receipt.attemptedIds, answerId] } } };
}
export function missionHint(record: MissionRecord, mission: Mission, questionId: string) {
  const question = mission.questions.find((q) => q.id === questionId);
  if (!question || nextQuestion(record, mission, question.objectiveId)?.id !== questionId) return record;
  const receipt = record.receipts[questionId] ?? { attemptedIds: [], hintUsed: false };
  return receipt.hintUsed ? record : { ...record, receipts: { ...record.receipts, [questionId]: { ...receipt, hintUsed: true } } };
}
export function missionSummary(record: MissionRecord, mission: Mission) {
  const rows = mission.questions.map((question) => {
    const receipt = record.receipts[question.id];
    return { question, complete: completed(record, question), firstCorrect: receipt?.attemptedIds[0] === question.correctAnswerId,
      attempted: !!receipt?.attemptedIds.length, hintUsed: !!receipt?.hintUsed, retries: Math.max(0, (receipt?.attemptedIds.length ?? 0) - 1),
      mistakes: question.choices.filter((c) => receipt?.attemptedIds.includes(c.id) && c.id !== question.correctAnswerId) };
  });
  const objectives = mission.objectives.map((objective) => {
    const practice = mission.questions.find((q) => q.id === objective.practiceId)!;
    const proof = mission.questions.find((q) => objective.applicationIds.includes(q.id) && independent(record, q));
    const mistakes = rows.filter((r) => r.question.objectiveId === objective.id && (r.mistakes.length || r.hintUsed));
    return { ...objective, proof, mistakes, practiced: completed(record, practice), next: nextQuestion(record, mission, objective.id) };
  });
  const attempted = rows.filter((r) => r.attempted).length;
  const firstCorrect = rows.filter((r) => r.firstCorrect).length;
  const recommendation = objectives.find((o) => !o.proof && o.mistakes.length) ?? objectives.find((o) => !o.proof);
  return { rows, objectives, recommendation, attempted, firstCorrect, accuracy: attempted ? Math.round(100 * firstCorrect / attempted) : null,
    completed: rows.filter((r) => r.complete).length, hints: rows.filter((r) => r.hintUsed).length, retries: rows.reduce((n,r) => n+r.retries,0),
    points: rows.reduce((n,r) => n+(r.complete ? r.hintUsed ? 75 : 100 : 0),0),
    achievements: objectives.filter((o) => o.proof).map((o) => ({ id: `${mission.id}:${o.id}`, ...o.achievement, questionId: o.proof!.id })) };
}
export function restoreMission(raw: string | null, mission: Mission): MissionRecord | null {
  if (!raw) return null;
  try {
    const record = JSON.parse(raw) as MissionRecord;
    if (!record || !matches(record, mission) || !record.receipts || typeof record.receipts !== "object" || Array.isArray(record.receipts)) return null;
    for (const [id, receipt] of Object.entries(record.receipts)) {
      const q = mission.questions.find((q) => q.id === id);
      if (!q || !receipt || typeof receipt.hintUsed !== "boolean" || !Array.isArray(receipt.attemptedIds) || new Set(receipt.attemptedIds).size !== receipt.attemptedIds.length || receipt.attemptedIds.some((id) => !q.choices.some((c) => c.id === id))) return null;
      const correctAt = receipt.attemptedIds.indexOf(q.correctAnswerId);
      if (correctAt >= 0 && correctAt !== receipt.attemptedIds.length - 1) return null;
      const objective = mission.objectives.find((o) => o.id === q.objectiveId)!;
      if (q.stage === "application") {
        const previous = [objective.practiceId, ...objective.applicationIds.slice(0, objective.applicationIds.indexOf(id))];
        if (previous.some((id) => !completed(record, mission.questions.find((q) => q.id === id)!))) return null;
        if (previous.some((id) => { const q = mission.questions.find((q) => q.id === id)!; return q.stage === "application" && independent(record,q); })) return null;
      }
    }
    return record;
  } catch { return null; }
}
