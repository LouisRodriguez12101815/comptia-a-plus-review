import objectives from "@/content/objectives.json";
import { flashcards, labs, questions, topics } from "@/lib/content";
import { buildCoverageFromContent, buildInsightsFromCoverage } from "@/lib/objective-coverage.mjs";

/** Shared, repository-only data assembly for Insights and capstone explanations. */
export function getProjectInsights() {
  const coverage = buildCoverageFromContent({ objectives, topics, cards: flashcards, questions, labs, visuals: {} });
  const insights = buildInsightsFromCoverage({ ...coverage, topics, cards: flashcards, questions, labs });
  return { ...coverage, insights };
}
