import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { conceptVideoPaths, conceptVideos } from "@/lib/concept-videos";
import { getTopics } from "@/lib/content";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://comptia-a-plus-review.vercel.app";

/* Static pages and notes topics, in every locale. Search result pages are
   query-driven, so they are left out on purpose. */
const staticPaths = ["", "/networking/videos", "/glossary", "/coverage", "/study-path", "/top-5", "/final-15", "/practice-games", "/trap-answers", "/weak-areas", "/scenario-builder"];

export default function sitemap(): MetadataRoute.Sitemap {
  const topicPaths = getTopics("all").map((topic) => `/notes/${topic.id}`);
  const paths = [...staticPaths, ...topicPaths];
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of routing.locales) {
    const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    for (const path of paths) {
      entries.push({ url: `${SITE}${prefix}${path}`, lastModified: now });
    }
    for (const video of conceptVideos) {
      const files = conceptVideoPaths(video.slug);
      entries.push({
        url: `${SITE}${prefix}/networking/videos/${video.slug}`,
        lastModified: video.published,
        videos: [
          {
            title: video.title,
            description: video.description,
            thumbnail_loc: `${SITE}${files.poster}`,
            content_loc: `${SITE}${files.video}`,
            duration: Math.round(video.duration),
            publication_date: video.published,
          },
        ],
      });
    }
  }
  return entries;
}
