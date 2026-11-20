import type { Lab, Topic } from "@/lib/types";

export type SaaChapterMapSource = {
  id: string;
  examCode: string;
  guide: { title: string; authors: string[]; usage: string };
  chapters: {
    id: string;
    number: number;
    title: string;
    focus: string;
    objectiveIds: string[];
    primaryTopicIds: string[];
    drillIds: string[];
    labSlugs: string[];
    domainIds: string[];
  }[];
};

type ExamShape = {
  domains: {
    id: string;
    title: string;
    weight: number;
    objectives: { id: string; title: string; topics: string[] }[];
  }[];
};

export type ResolvedSaaChapter = {
  id: string;
  number: number;
  title: string;
  focus: string;
  domainAnchors: { id: string; title: string; weight: number; href: string }[];
  objectives: { id: string; title: string; domainId: string; href: string }[];
  topics: { id: string; title: string; href: string }[];
  drills: { id: string; title: string; href: string }[];
  labs: { slug: string; title: string; href: string }[];
  practiceHref: string;
};

/** Resolve only resources that exist. Missing drills/labs/topics never invent links. */
export function resolveSaaChapterPath(
  source: SaaChapterMapSource,
  resources: {
    exam: ExamShape | undefined;
    topics: Topic[];
    labs: Lab[];
    drills: { id: string; title?: string; topic?: string; exam: string }[];
  },
): ResolvedSaaChapter[] {
  const topicsById = new Map(resources.topics.map((topic) => [topic.id, topic]));
  const labsBySlug = new Map(resources.labs.map((lab) => [lab.slug, lab]));
  const drillsById = new Map(
    resources.drills
      .filter((drill) => drill.exam.toLowerCase() === "saa-c03")
      .map((drill) => [drill.id, drill]),
  );
  const objectives = (resources.exam?.domains ?? []).flatMap((domain) =>
    domain.objectives.map((objective) => ({
      ...objective,
      domainId: domain.id,
      domainTitle: domain.title,
      domainWeight: domain.weight,
    })),
  );
  const objectiveById = new Map(objectives.map((objective) => [objective.id, objective]));
  const domainById = new Map((resources.exam?.domains ?? []).map((domain) => [domain.id, domain]));

  return source.chapters.map((chapter) => {
    const resolvedObjectives = chapter.objectiveIds.flatMap((id) => {
      const objective = objectiveById.get(id);
      if (!objective) return [];
      return [{
        id: objective.id,
        title: objective.title,
        domainId: objective.domainId,
        href: `/aws-saa#saa-domain-${objective.domainId}`,
      }];
    });

    const topics = chapter.primaryTopicIds.flatMap((id) => {
      const topic = topicsById.get(id);
      if (!topic) return [];
      return [{ id: topic.id, title: topic.title, href: `/notes/${topic.id}` }];
    });

    const drills = chapter.drillIds.flatMap((id) => {
      const drill = drillsById.get(id);
      if (!drill) return [];
      const title = drill.title ?? drill.topic ?? drill.id;
      return [{ id: drill.id, title, href: `/practice-games/drills/${drill.id}` }];
    });

    const labs = chapter.labSlugs.flatMap((slug) => {
      const lab = labsBySlug.get(slug);
      if (!lab) return [];
      return [{ slug: lab.slug, title: lab.title, href: `/labs/${lab.slug}` }];
    });

    const domainAnchors = chapter.domainIds.flatMap((id) => {
      const domain = domainById.get(id);
      if (!domain) return [];
      return [{
        id: domain.id,
        title: domain.title,
        weight: domain.weight,
        href: `/aws-saa#saa-domain-${domain.id}`,
      }];
    });

    const focusParam = chapter.objectiveIds.join(",");
    return {
      id: chapter.id,
      number: chapter.number,
      title: chapter.title,
      focus: chapter.focus,
      domainAnchors,
      objectives: resolvedObjectives,
      topics,
      drills,
      labs,
      practiceHref: focusParam
        ? `/test?exam=saa-c03&focus=${encodeURIComponent(focusParam)}`
        : "/test?exam=saa-c03",
    };
  });
}

export function saaChapterMapMeta(source: SaaChapterMapSource) {
  return {
    id: source.id,
    examCode: source.examCode,
    guide: source.guide,
    chapterCount: source.chapters.length,
  };
}
