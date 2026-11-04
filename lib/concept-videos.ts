import conceptVideosJson from "@/content/concept-videos.json";
import objectives from "@/content/objectives.json";

export type ConceptVideo = {
  slug: string;
  title: string;
  description: string;
  exam: "n10-009";
  objective: string;
  topicId: string;
  questionId: string;
  duration: number;
  published: string;
  takeaway: string;
  transcript: string;
};

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://comptia-a-plus-review.vercel.app";

export const conceptVideos = conceptVideosJson as ConceptVideo[];

export function getConceptVideo(slug: string): ConceptVideo | undefined {
  return conceptVideos.find((video) => video.slug === slug);
}

/** The official objective (id, title, domain) for a video, read from content/objectives.json. */
export function objectiveFor(video: ConceptVideo) {
  const exam = objectives.exams.find((e) => e.code === video.exam);
  for (const domain of exam?.domains ?? []) {
    const objective = domain.objectives.find((o) => o.id === video.objective);
    if (objective) return { id: objective.id, title: objective.title, domain: domain.title };
  }
  return undefined;
}

/** Videos grouped by objective id, in objective order. */
export function conceptVideosByObjective() {
  const groups = new Map<string, ConceptVideo[]>();
  for (const video of conceptVideos) {
    groups.set(video.objective, [...(groups.get(video.objective) ?? []), video]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([objective, videos]) => ({ objective, videos }));
}

export function isoDuration(seconds: number): string {
  const total = Math.round(seconds);
  return `PT${Math.floor(total / 60)}M${total % 60}S`;
}

export function conceptVideoPaths(slug: string) {
  return {
    video: `/videos/concepts/${slug}.mp4`,
    captions: `/videos/concepts/${slug}.vtt`,
    poster: `/videos/concepts/${slug}.jpg`,
  };
}
