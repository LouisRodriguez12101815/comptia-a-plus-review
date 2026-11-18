import type { VisualItem } from "@/lib/visuals";
import type { Lab, Question, Topic } from "@/lib/types";

type SaaExam = {
  domains: {
    id: string; title: string; weight: number;
    objectives: { id: string; title: string; topics: string[]; reviewEvidence?: { section?: string; questionId?: string } }[];
  }[];
};

/** Resolve recorded references only. Missing evidence must never create a link. */
export function resolveSaaLesson(reference: string, lookup: (id: string) => Topic | undefined) {
  const [topicId, sectionId, extra] = reference.split("#");
  if (!topicId || !sectionId || extra !== undefined) return null;
  const topic = lookup(topicId);
  const section = topic?.sections.find((item) => item.id === sectionId);
  if (!topic?.examCodes.includes("saa-c03") || !section) return null;
  return { topicId, sectionId, title: section.title, href: `/notes/${topicId}#${sectionId}` };
}

const domainDrills: Record<string, string> = {
  "1.0": "aws-saa-secure-cues",
  "2.0": "aws-saa-resilient-cues",
  "3.0": "aws-saa-performance-cues",
  "4.0": "aws-saa-cost-cues",
};

/** Navigation from the repository matrix; this does not calculate PDF coverage. */
export function saaCurriculumDomains(exam: SaaExam | undefined, resources: {
  topics: Topic[]; questions: Question[]; labs: Lab[]; visualsForTopic: (id: string) => VisualItem[];
}) {
  const byId = new Map(resources.topics.map((topic) => [topic.id, topic]));
  return (exam?.domains ?? []).map((domain) => {
    const topicIds = new Set(domain.objectives.flatMap((objective) => objective.topics));
    const topics = [...topicIds].flatMap((id) => {
      const topic = byId.get(id);
      return topic ? [topic] : [];
    });
    const visuals = [...new Map(topics.flatMap((topic) => resources.visualsForTopic(topic.id)).map((visual) => [visual.file, visual])).values()];
    return {
      id: domain.id,
      title: domain.title,
      weight: domain.weight,
      drillId: domainDrills[domain.id],
      topics,
      visuals,
      labs: resources.labs.filter((lab) => lab.relatedTopicIds.some((id) => topicIds.has(id))),
      tasks: domain.objectives.map((objective) => {
        const evidence = objective.reviewEvidence;
        const question = resources.questions.find((item) =>
          item.id === evidence?.questionId && item.objectiveIds?.["saa-c03"]?.includes(objective.id));
        return {
          id: objective.id,
          title: objective.title,
          lesson: resolveSaaLesson(evidence?.section ?? "", (id) => byId.get(id)),
          questionHref: question ? `/quiz?questions=${encodeURIComponent(question.id)}&exam=saa-c03` : null,
        };
      }),
    };
  });
}
