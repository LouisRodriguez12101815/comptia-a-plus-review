import type { Metadata } from "next";
import objectives from "@/content/objectives.json";
import visuals from "@/content/track-visuals.json";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { topics, flashcards, questions, labs } from "@/lib/content";
import { buildCoverageFromContent } from "@/lib/objective-coverage.mjs";
import { CoverageDashboard } from "./CoverageDashboard";

export async function generateMetadata({ params }: PageProps<"/[locale]/coverage">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "coveragePage" });
  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default async function CoveragePage({ params }: PageProps<"/[locale]/coverage">) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Content stays on the server. Only the compact computed rows and topic labels
  // cross the client boundary, never the CLI's filesystem loader.
  const coverage = buildCoverageFromContent({ objectives, topics, cards: flashcards, questions, labs, visuals });
  return <CoverageDashboard {...coverage} topicTitles={Object.fromEntries(topics.map((topic) => [topic.id, topic.title]))} />;
}
