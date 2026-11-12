import type { Progress } from "@/lib/progress";
import type { ExamCode, Question } from "@/lib/types";
import { progressAttempts } from "@/lib/learner-performance";

const concepts = [
  { id: "clf21-ec2-guest-os", labelKey: "awsEc2GuestOs", cardId: "fc-clf21-ec2", questionIds: ["q-clf21-01", "q-clf21-05", "q-clf21-06"] },
  { id: "clf21-rds-data-access", labelKey: "awsRdsDataAccess", cardId: "fc-clf21-rds", questionIds: ["q-clf21-03", "q-clf21-08", "q-clf21-09", "q-aws-review-clf-c02-2-1"] },
  { id: "clf21-physical-infrastructure", labelKey: "awsPhysicalInfrastructure", cardId: "fc-clf21-physical", questionIds: ["q-clf21-02"] },
  { id: "clf21-lambda-iam", labelKey: "awsLambdaIam", cardId: "fc-clf21-lambda", questionIds: ["q-clf21-04"] },
  { id: "clf21-lambda-code", labelKey: "awsLambdaCode", cardId: "fc-clf21-lambda", questionIds: ["q-clf21-07"] },
] as const;

export function isClfOnlyQuestion(question: Question): boolean {
  return question.examCodes?.length === 1 && question.examCodes[0] === "clf-c02";
}

/** Explicit reviewed IDs only: objective membership alone is not a misconception. */
export function awsClfRemediation(question: Question) {
  if (!isClfOnlyQuestion(question) || question.objectiveIds?.["clf-c02"]?.length !== 1
    || question.objectiveIds["clf-c02"][0] !== "2.1") return undefined;
  return concepts.find(concept => (concept.questionIds as readonly string[]).includes(question.id));
}

export const AWS_RESPONSIBILITY_NOTES = "/notes/aws-clf-security-transfer#responsibility";
export const AWS_RESPONSIBILITY_TOPIC = "aws-clf-security-transfer";
export const AWS_RESPONSIBILITY_VISUAL = "aws-clf-security-transfer.html";

export function awsClfAlternatives(question: Question, questions: Question[]): string[] {
  const concept = awsClfRemediation(question);
  if (!concept) return [];
  return questions.filter(candidate => candidate.id !== question.id
    && awsClfRemediation(candidate)?.id === concept.id).map(candidate => candidate.id).sort();
}

export function remediationQuizHref(questionIds: string[], exam: ExamCode): string {
  return `/quiz?questions=${encodeURIComponent(questionIds.join(","))}&exam=${encodeURIComponent(exam)}`;
}

/** Keep new practice later than retained evidence, even when its topic changes. */
export function awsClfPracticeAt(progress: Progress, now: number): number {
  return Math.max(now, ...[...progress.quizAttempts, ...progress.mockAttempts]
    .filter(attempt => Number.isFinite(attempt.at)).map(attempt => attempt.at + 1));
}

export type AwsConceptEvidence = {
  conceptId: string;
  labelKey: string;
  incorrect: number;
  correct: number;
  repeatedCorrect: number;
  transferCorrect: number;
  currentlyRecovered: boolean;
  /** Historical successes remain visible after a subsequent miss. No mastery claim. */
  recoveryQuestionIds: string[];
};

/** Derive evidence from existing retained attempts; do not persist a second progress model. */
export function awsClfConceptEvidence(progress: Progress, questions: Question[]): AwsConceptEvidence[] {
  const bank = new Map(questions.map(question => [question.id, question]));
  const events = new Map<string, { at: number; question: Question; outcomes: Set<boolean> }>();
  for (const attempt of progressAttempts(progress)) {
    if (attempt.exam && attempt.exam !== "clf-c02") continue;
    for (const id of new Set(attempt.questionIds ?? [])) {
      const question = bank.get(id);
      if (!question || !awsClfRemediation(question)
        || (attempt.objectiveByQuestion?.[id] && attempt.objectiveByQuestion[id] !== "2.1")) continue;
      const key = `${attempt.at}:${id}`;
      const event = events.get(key) ?? { at: attempt.at, question, outcomes: new Set<boolean>() };
      event.outcomes.add(!attempt.missedIds.includes(id));
      events.set(key, event);
    }
  }
  const rows = new Map<string, AwsConceptEvidence>();
  const seen = new Map<string, number>();
  const misses = new Map<string, { questionId: string; at: number }>();
  const uncertainOrMissed = new Set([...events.values()]
    .filter(event => event.outcomes.size !== 1 || event.outcomes.has(false))
    .map(event => `${event.at}:${awsClfRemediation(event.question)!.id}`));
  for (const event of [...events.values()].sort((a, b) => a.at - b.at || a.question.id.localeCompare(b.question.id))) {
    // Tied contradictory evidence cannot establish improvement. Same-time items
    // within a sitting have no known order and cannot prove a transfer sequence.
    const concept = awsClfRemediation(event.question)!;
    if (event.outcomes.size !== 1) {
      const existing = rows.get(concept.id);
      if (existing) existing.currentlyRecovered = false;
      seen.set(event.question.id, event.at);
      continue;
    }
    const row = rows.get(concept.id) ?? {
      conceptId: concept.id, labelKey: concept.labelKey, incorrect: 0, correct: 0,
      repeatedCorrect: 0, transferCorrect: 0, currentlyRecovered: false, recoveryQuestionIds: [],
    };
    const correct = [...event.outcomes][0];
    if (!correct) {
      row.incorrect++;
      row.currentlyRecovered = false;
      misses.set(concept.id, { questionId: event.question.id, at: event.at });
    } else {
      row.correct++;
      if ((seen.get(event.question.id) ?? Infinity) < event.at) row.repeatedCorrect++;
      const miss = misses.get(concept.id);
      if (miss && miss.at < event.at && miss.questionId !== event.question.id && !seen.has(event.question.id)
        && !uncertainOrMissed.has(`${event.at}:${concept.id}`)) {
        row.transferCorrect++;
        row.currentlyRecovered = true;
        row.recoveryQuestionIds.push(event.question.id);
      }
    }
    seen.set(event.question.id, event.at);
    rows.set(concept.id, row);
  }
  return [...rows.values()].sort((a, b) => a.conceptId.localeCompare(b.conceptId));
}
