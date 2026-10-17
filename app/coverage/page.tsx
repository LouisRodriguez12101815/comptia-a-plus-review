import type { Metadata } from "next";
import objectives from "@/content/objectives.json";
import visuals from "@/content/track-visuals.json";
import { topics, flashcards, questions, labs } from "@/lib/content";
import { buildCoverageFromContent } from "@/lib/objective-coverage.mjs";
import { CoverageDashboard } from "./CoverageDashboard";

export const metadata: Metadata = {
  title: "Exam objective coverage | CompTIA Review",
  description: "Explore the current study content, mapped objectives, and next content gaps.",
};

export default function CoveragePage() {
  // Content stays on the server. Only the compact computed rows and topic labels
  // cross the client boundary, never the CLI's filesystem loader.
  const coverage = buildCoverageFromContent({ objectives, topics, cards: flashcards, questions, labs, visuals });
  return <CoverageDashboard {...coverage} topicTitles={Object.fromEntries(topics.map((topic) => [topic.id, topic.title]))} />;
}
