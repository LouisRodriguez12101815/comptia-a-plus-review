import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  SITE_URL,
  conceptVideoPaths,
  conceptVideos,
  getConceptVideo,
  isoDuration,
  objectiveFor,
} from "@/lib/concept-videos";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => conceptVideos.map((video) => ({ locale, slug: video.slug })));
}

function pageUrl(locale: string, slug: string) {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${SITE_URL}${prefix}/networking/videos/${slug}`;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/networking/videos/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const video = getConceptVideo(slug);
  if (!video) return {};
  const paths = conceptVideoPaths(slug);
  const url = pageUrl(locale, slug);
  const title = `${video.title} | Network+ N10-009 ${video.objective}`;
  return {
    title,
    description: video.description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(routing.locales.map((l) => [l, pageUrl(l, slug)])),
    },
    openGraph: {
      type: "video.other",
      title,
      description: video.description,
      url,
      images: [`${SITE_URL}${paths.poster}`],
      videos: [`${SITE_URL}${paths.video}`],
    },
  };
}

export default async function Page({ params }: PageProps<"/[locale]/networking/videos/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const video = getConceptVideo(slug);
  if (!video) notFound();
  const t = await getTranslations("conceptVideos");
  const tv = await getTranslations("networkPlusVideos");
  const objective = objectiveFor(video);
  const paths = conceptVideoPaths(slug);
  const related = conceptVideos.filter((v) => v.objective === video.objective && v.slug !== video.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.description,
    thumbnailUrl: [`${SITE_URL}${paths.poster}`],
    uploadDate: video.published,
    duration: isoDuration(video.duration),
    contentUrl: `${SITE_URL}${paths.video}`,
    embedUrl: pageUrl(locale, slug),
    inLanguage: "en-US",
    transcript: video.transcript,
    about: `CompTIA Network+ N10-009 objective ${video.objective}${objective ? `: ${objective.title}` : ""}`,
  };

  return (
    <article className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div>
        <p className="text-sm uppercase tracking-wide text-teal-300">
          {tv("eyebrow")} · {t("objective", { id: video.objective })}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{video.title}</h1>
        {objective && (
          <p className="mt-2 max-w-3xl text-slate-300">
            <span className="font-mono text-teal-300">{objective.id}</span> {objective.title}
            <span className="text-slate-400"> · {objective.domain}</span>
          </p>
        )}
        <p className="mt-2 max-w-3xl text-sm text-slate-400">{tv("englishNote")}</p>
      </div>

      <video
        className="aspect-video w-full rounded-xl border border-slate-800 bg-slate-950"
        controls
        preload="metadata"
        playsInline
        poster={paths.poster}
        aria-label={t("videoLabel", { title: video.title })}
      >
        <source src={paths.video} type="video/mp4" />
        <track kind="captions" src={paths.captions} srcLang="en" label="English" default />
        {tv("noVideo")}
      </video>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-white">{t("takeaway")}</h2>
        <p className="mt-1 text-slate-200">{video.takeaway}</p>
        <p className="mt-3">
          <Link
            href={`/notes/${video.topicId}`}
            className="inline-flex min-h-11 items-center text-teal-300 underline underline-offset-4 hover:text-teal-200"
          >
            {t("studyNotes")}
          </Link>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-white">{t("transcript")}</h2>
        <p className="max-w-3xl leading-relaxed text-slate-300">{video.transcript}</p>
      </section>

      {related.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">{t("more")}</h2>
          <ul className="space-y-1">
            {related.map((v) => (
              <li key={v.slug}>
                <Link
                  href={`/networking/videos/${v.slug}`}
                  className="inline-flex min-h-11 items-center text-teal-300 underline underline-offset-4 hover:text-teal-200"
                >
                  {v.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p>
        <Link href="/networking/videos" className="inline-flex min-h-11 items-center text-teal-300 underline underline-offset-4">
          {t("back")}
        </Link>
      </p>
    </article>
  );
}
