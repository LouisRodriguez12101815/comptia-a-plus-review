import type { Progress, QuizAttempt, MockAttempt } from "@/lib/progress";
import type { Question } from "@/lib/types";

export type ClfAssessmentState = "not-assessed" | "insufficient" | "weak" | "developing" | "strong";
export type ClfEvidenceLabel = "none" | "limited" | "provisional";

export type ClfAssessmentRow = {
  objectiveId: string;
  domainId: string;
  domainTitle: string;
  title: string;
  totalAnswers: number;
  distinctQuestions: number;
  correctAnswers: number;
  accuracy: number | null;
  recentAccuracy: number | null;
  evidence: ClfEvidenceLabel;
  state: ClfAssessmentState;
};

type Objective = { id: string; title: string; topics?: string[] };
type Domain = { id: string; title: string; objectives: Objective[] };
type Pool = { domains: { id: string; title: string; objectives: { id: string; questionIds: string[] }[] }[] };

const CLF = "clf-c02";
const MIN_DISTINCT = 3;

function objectiveForQuestion(question: Question, pool: Pool, id: string, allowShared = false): string | undefined {
  if (question.examCodes && (!question.examCodes.includes(CLF) || (!allowShared && question.examCodes.includes("saa-c03")))) return undefined;
  const explicit = question.objectiveIds?.[CLF];
  if (explicit?.length === 1) return explicit[0];
  const matches = pool.domains.flatMap((domain) => domain.objectives)
    .filter((objective) => objective.questionIds.includes(id)).map((objective) => objective.id);
  return new Set(matches).size === 1 ? matches[0] : undefined;
}

function addAnswers(target: Map<string, { at: number; sequence: number; questionId: string; correct: boolean }[]>, attempt: QuizAttempt | MockAttempt, questionsById: Map<string, Question>, pool: Pool, exam: string | undefined, sequence: { value: number }) {
  if (exam !== undefined && exam !== CLF) return;
  const ids = attempt.questionIds ?? [];
  const missed = new Set(attempt.missedIds);
  const correctIds = "correctIds" in attempt ? new Set(attempt.correctIds ?? []) : null;
  for (const questionId of ids) {
    const question = questionsById.get(questionId);
    if (!question) continue;
    const objectiveId = "objectiveByQuestion" in attempt
      ? attempt.objectiveByQuestion?.[questionId] ?? objectiveForQuestion(question, pool, questionId, exam === CLF)
      : objectiveForQuestion(question, pool, questionId, exam === CLF);
    if (!objectiveId) continue;
    const correct = correctIds ? correctIds.has(questionId) : !missed.has(questionId);
    const rows = target.get(objectiveId) ?? [];
    rows.push({ at: attempt.at, sequence: sequence.value++, questionId, correct });
    target.set(objectiveId, rows);
  }
}

/** Deterministic CLF assessment derived from existing saved quiz and mock attempts. */
export function assessAwsClf(progress: Progress, pool: Pool, questions: Question[], currentBankVersion?: string): ClfAssessmentRow[] {
  const exam = new Map<string, { domainId: string; domainTitle: string; objective: Objective }>();
  const domains = pool.domains as unknown as Domain[];
  for (const domain of domains) for (const objective of domain.objectives) {
    exam.set(objective.id, { domainId: domain.id, domainTitle: domain.title, objective });
  }
  const questionsById = new Map(questions.map((question) => [question.id, question]));
  const evidence = new Map<string, { at: number; sequence: number; questionId: string; correct: boolean }[]>();
  const sequence = { value: 0 };
  for (const attempt of progress.quizAttempts) {
    // Legacy quiz records have no reliable exam or content provenance. Keep them in
    // history, but do not let them manufacture current CLF objective evidence.
    if (attempt.exam !== CLF || !attempt.bankVersion || attempt.bankVersion !== currentBankVersion) continue;
    addAnswers(evidence, attempt, questionsById, pool, attempt.exam, sequence);
  }
  for (const attempt of progress.mockAttempts) {
    if (attempt.exam !== CLF) continue;
    if (currentBankVersion && attempt.bankVersion && attempt.bankVersion !== currentBankVersion) continue;
    addAnswers(evidence, attempt, questionsById, pool, attempt.exam, sequence);
  }
  return [...exam.entries()].map(([objectiveId, meta]) => {
    const rows = (evidence.get(objectiveId) ?? []).sort((a, b) => a.at - b.at || a.sequence - b.sequence);
    const latestByQuestion = new Map<string, (typeof rows)[number]>();
    for (const row of rows) latestByQuestion.set(row.questionId, row);
    const distinctRows = [...latestByQuestion.values()].sort((a, b) => a.at - b.at || a.sequence - b.sequence);
    const distinct = distinctRows.length;
    const correctAnswers = distinctRows.filter((row) => row.correct).length;
    const accuracy = distinctRows.length ? Math.round((100 * correctAnswers) / distinctRows.length) : null;
    const recent = distinctRows.slice(-Math.min(5, distinctRows.length));
    const recentAccuracy = recent.length ? Math.round((100 * recent.filter((row) => row.correct).length) / recent.length) : null;
    const evidenceLabel: ClfEvidenceLabel = distinct === 0 ? "none" : distinct < MIN_DISTINCT ? "limited" : "provisional";
    let state: ClfAssessmentState = "not-assessed";
    if (distinct > 0 && distinct < MIN_DISTINCT) state = "insufficient";
    else if (distinct >= MIN_DISTINCT) state = accuracy !== null && accuracy >= 85 ? "strong" : accuracy !== null && accuracy < 70 ? "weak" : "developing";
    return { objectiveId, domainId: meta.domainId, domainTitle: meta.domainTitle, title: meta.objective.title, totalAnswers: rows.length, distinctQuestions: distinct, correctAnswers, accuracy, recentAccuracy, evidence: evidenceLabel, state };
  });
}
