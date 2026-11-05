import objectives from "@/content/objectives.json";
import { getQuestions } from "@/lib/content";

export const DOMAIN_QUIZ_EXAM = "n10-009";

export type DomainQuiz = { id: string; title: string; weight: number; questionIds: string[] };

/** The five N10-009 domains, each with the ids of every N10-009 question under its objectives' topics. */
export function domainQuizzes(): DomainQuiz[] {
  const exam = objectives.exams.find((item) => item.code === DOMAIN_QUIZ_EXAM);
  return (exam?.domains ?? []).map((domain) => {
    const topicIds = new Set(domain.objectives.flatMap((objective) => objective.topics));
    const ids = new Set<string>();
    for (const topicId of topicIds) {
      for (const question of getQuestions(topicId, DOMAIN_QUIZ_EXAM)) ids.add(question.id);
    }
    return { id: domain.id, title: domain.title, weight: domain.weight, questionIds: [...ids] };
  });
}

export function getDomainQuiz(id: string | undefined): DomainQuiz | undefined {
  return id ? domainQuizzes().find((domain) => domain.id === id) : undefined;
}
