import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getTopics } from "@/lib/content";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://comptia-a-plus-review.vercel.app";

/* Static pages and notes topics, in every locale. Search result pages are
   query-driven, so they are left out on purpose. */
const staticPaths = ["", "/glossary", "/coverage", "/study-path", "/top-5", "/final-15", "/practice-games", "/trap-answers", "/weak-areas", "/scenario-builder"];

export default function sitemap(): MetadataRoute.Sitemap {
  const topicPaths = getTopics("all").map((topic) => `/notes/${topic.id}`);
  const paths = [...staticPaths, ...topicPaths];
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of routing.locales) {
    for (const path of paths) {
      const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
      entries.push({ url: `${SITE}${prefix}${path}`, lastModified: now });
    }
  }
  return entries;
}
