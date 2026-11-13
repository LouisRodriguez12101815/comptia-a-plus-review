import objectives from "../content/objectives.json" with { type: "json" };
import trackVisuals from "../content/track-visuals.json" with { type: "json" };
import flashcardsJson from "../content/flashcards.json" with { type: "json" };
import labsJson from "../content/labs.json" with { type: "json" };
import topicsJson from "../content/topics.json" with { type: "json" };

export type ClfResource = { type: "notes" | "flashcards" | "visual" | "lab" | "practice"; title: string; href: string };

type ClfObjective = { id: string; topics?: string[] };
type Topic = { id: string; title: string };
type Lab = { slug: string; title: string; relatedTopicIds: string[] };
const flashcards = flashcardsJson as { topicId: string; examCodes?: string[] }[];
const labs = labsJson as Lab[];
const topics = topicsJson as Topic[];

function clfObjectives(): ClfObjective[] {
  const exam = (objectives as { exams: { code: string; domains: { objectives: ClfObjective[] }[] }[] }).exams.find((item) => item.code === "clf-c02");
  return exam?.domains.flatMap((domain) => domain.objectives) ?? [];
}

/** Resolve only resources attached to the objective's existing topic mappings. */
export function resourcesForAwsClfObjective(objectiveId: string): ClfResource[] {
  const objective = clfObjectives().find((item) => item.id === objectiveId);
  if (!objective) return [];
  const resources: ClfResource[] = [];
  const seen = new Set<string>();
  const add = (resource: ClfResource) => { if (!seen.has(resource.href)) { seen.add(resource.href); resources.push(resource); } };
  for (const topicId of objective.topics ?? []) {
    const topic = topics.find((item) => item.id === topicId);
    if (!topic) continue;
    add({ type: "notes", title: topic.title, href: `/notes/${topic.id}` });
    if (flashcards.some((card) => card.topicId === topic.id && (card.examCodes ?? ["clf-c02"]).includes("clf-c02"))) {
      add({ type: "flashcards", title: topic.title, href: `/flashcards?topic=${encodeURIComponent(topic.id)}` });
    }
    const visuals = (trackVisuals as Record<string, { file: string; title: string }[]>)[topic.id] ?? [];
    for (const visual of visuals) add({ type: "visual", title: visual.title, href: `/visuals/${visual.file}` });
    for (const lab of labs.filter((item) => item.relatedTopicIds.includes(topic.id))) {
      add({ type: "lab", title: lab.title, href: `/labs/${lab.slug}` });
    }
  }
  add({ type: "practice", title: objectiveId, href: `/test?exam=clf-c02&focus=${encodeURIComponent(objectiveId)}` });
  return resources;
}
