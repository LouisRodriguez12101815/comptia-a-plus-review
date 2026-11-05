import { getTranslations } from "next-intl/server";
import objectives from "@/content/objectives.json";
import { conceptVideos } from "@/lib/concept-videos";
import { DOMAIN_QUIZ_EXAM } from "@/lib/domain-quiz";
import { lookAlikePairs, networkConcepts } from "@/lib/concepts";
import { ConceptGrid, type ConceptCard, type DomainCards } from "@/app/components/ConceptGrid";

/** Concept practice for Network+: each objective is split into named concepts with a video, a diagram and a short drill. */
export async function NetworkPlusConcepts() {
  const t = await getTranslations("networkPlusConcepts");
  const exam = objectives.exams.find((item) => item.code === DOMAIN_QUIZ_EXAM);
  const videoTitle = new Map(conceptVideos.map((video) => [video.slug, video.title]));
  const concepts = networkConcepts();
  const card = (concept: (typeof concepts)[number]): ConceptCard => ({
    id: concept.id,
    title: concept.title,
    summary: concept.summary,
    questionIds: concept.questionIds,
    videos: concept.videos.map((slug) => ({ slug, title: videoTitle.get(slug) ?? slug })),
    visuals: concept.visuals,
    named: concept.kind === "concept",
  });
  const domains: DomainCards[] = (exam?.domains ?? []).map((domain) => ({
    id: domain.id,
    title: domain.title,
    objectives: domain.objectives
      .map((objective) => ({ id: objective.id, title: objective.title, concepts: concepts.filter((concept) => concept.objective === objective.id).map(card) }))
      .filter((objective) => objective.concepts.length > 0),
  }));
  const pairs = lookAlikePairs().map(card);
  return (
    <section id="concepts" aria-labelledby="concepts-heading" className="space-y-4">
      <div>
        <h2 id="concepts-heading" className="text-lg font-medium text-white">{t("title")}</h2>
        <p className="mt-1 text-sm text-slate-400">{t("body")}</p>
      </div>
      <ConceptGrid domains={domains} pairs={pairs} />
    </section>
  );
}
