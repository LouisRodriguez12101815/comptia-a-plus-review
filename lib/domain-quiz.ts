import objectives from "@/content/objectives.json";
import { getQuestions, questions, topics } from "@/lib/content";
import { buildExamPool } from "@/lib/exam-test.mjs";
import type { CoverageMatrix } from "@/lib/objective-coverage.mjs";
import type { ExamCode } from "@/lib/types";

export const DOMAIN_QUIZ_EXAM = "n10-009";

export type DomainQuiz = { id: string; title: string; weight: number; questionIds: string[] };

const DOMAIN_QUIZ_EXAMS = new Set<ExamCode>(["n10-009", "saa-c03"]);

/** Domain practice for Network+ by default. Pass saa-c03 for the SAA domains. */
export function domainQuizzes(exam: ExamCode = DOMAIN_QUIZ_EXAM): DomainQuiz[] {
  if (!DOMAIN_QUIZ_EXAMS.has(exam)) return [];
  if (exam === "saa-c03") {
    // Match the mock exam's objective pools, including the same eligibility rules.
    const pool = buildExamPool({ objectives: objectives as CoverageMatrix, questions, topics, examCode: exam });
    return pool.domains.map(({ id, title, weight, objectives: tasks }) => ({
      id,
      title,
      weight,
      questionIds: [...new Set(tasks.flatMap((task) => task.questionIds))],
    }));
  }
  const definition = objectives.exams.find((item) => item.code === exam);
  return (definition?.domains ?? []).map((domain) => {
    const topicIds = new Set(domain.objectives.flatMap((objective) => objective.topics));
    const ids = new Set<string>();
    for (const topicId of topicIds) {
      for (const question of getQuestions(topicId, exam)) ids.add(question.id);
    }
    return { id: domain.id, title: domain.title, weight: domain.weight, questionIds: [...ids] };
  });
}

export function getDomainQuiz(id: string | undefined, exam: ExamCode = DOMAIN_QUIZ_EXAM): DomainQuiz | undefined {
  return id ? domainQuizzes(exam).find((domain) => domain.id === id) : undefined;
}
