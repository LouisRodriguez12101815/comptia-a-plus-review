import conceptData from "@/content/network-plus-concepts.json";
import objectives from "@/content/objectives.json";
import { getQuestions, getTopic } from "@/lib/content";
import { DOMAIN_QUIZ_EXAM } from "@/lib/domain-quiz";

export type ConceptVisual = { file: string; title: string };
export type Concept = {
  id: string;
  objective: string;
  title: string;
  summary: string;
  questionIds: string[];
  videos: string[];
  visuals: ConceptVisual[];
  /** "topic" concepts are the fallback for chapters that have not been split into concepts yet. */
  kind: "concept" | "topic" | "pair";
  rule?: string;
};

const explicit = conceptData.concepts as Omit<Concept, "kind">[];
const pairs = conceptData.pairs as { id: string; objective: string; title: string; rule: string; questionIds: string[] }[];

function build(): Concept[] {
  const exam = objectives.exams.find((item) => item.code === DOMAIN_QUIZ_EXAM);
  const claimed = new Set(explicit.flatMap((concept) => concept.questionIds));
  const result: Concept[] = explicit.map((concept) => ({ ...concept, kind: "concept" }));
  const seenTopics = new Set<string>();
  for (const domain of exam?.domains ?? []) {
    for (const objective of domain.objectives) {
      for (const topicId of objective.topics) {
        if (seenTopics.has(topicId)) continue;
        seenTopics.add(topicId);
        const ids = getQuestions(topicId, DOMAIN_QUIZ_EXAM).map((q) => q.id).filter((id) => !claimed.has(id));
        if (!ids.length) continue;
        ids.forEach((id) => claimed.add(id));
        const topic = getTopic(topicId);
        result.push({ id: `topic-${topicId}`, objective: objective.id, title: topic?.title ?? topicId, summary: topic?.summary ?? "", questionIds: ids, videos: [], visuals: [], kind: "topic" });
      }
    }
  }
  return result;
}

let cache: Concept[] | undefined;
/** Every N10-009 question belongs to exactly one concept (a named one or its chapter). */
export function networkConcepts(): Concept[] {
  cache ??= build();
  return cache;
}

export function lookAlikePairs(): Concept[] {
  return pairs.map((pair) => ({ ...pair, summary: pair.rule, videos: [], visuals: [], kind: "pair" as const }));
}

export function getConcept(id: string | undefined): Concept | undefined {
  if (!id) return undefined;
  return [...networkConcepts(), ...lookAlikePairs()].find((concept) => concept.id === id);
}

/** Concept title for each question id, used to label weak-concept reports. */
export function conceptTitleByQuestion(): Map<string, string> {
  const map = new Map<string, string>();
  for (const concept of networkConcepts()) for (const id of concept.questionIds) map.set(id, concept.title);
  return map;
}
