import { getTranslations, setRequestLocale } from "next-intl/server";
import { MissionReturnLink } from "@/app/components/practice/MissionReturnLink";
import { notFound } from "next/navigation";
import { ChapterStrip } from "@/app/components/ChapterStrip";
import { EnsureTopicFocus } from "@/app/components/EnsureTopicFocus";
import { SectionBlocks } from "@/app/components/SectionBlocks";
import { focusForTopic } from "@/lib/chapter";
import { getTopic, topics } from "@/lib/content";

export function generateStaticParams() {
  return topics.map((topic) => ({ id: topic.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/notes/[id]">) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "topicPage" });
  const topic = getTopic(id);
  return topic
    ? { title: t("metaTitle", { title: topic.title, chapter: topic.chapter }) }
    : {};
}

export default async function TopicPage({
  params,
}: PageProps<"/[locale]/notes/[id]">) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("topicPage");
  const topic = getTopic(id);
  if (!topic) notFound();

  return (
    <article className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-teal-300">{topic.chapter}</p>
        <h1 className="mt-1 text-3xl font-semibold text-white">{topic.title}</h1>
        <p className="mt-2 text-slate-400">{topic.summary}</p>
      </div>
      <EnsureTopicFocus codes={topic.examCodes} preferred={focusForTopic(topic)} />
      <ChapterStrip topicId={topic.id} current="notes" />
      {topic.id === "n10-ch9" && <MissionReturnLink />}
      <nav className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        <p className="text-sm font-medium text-slate-300">{t("onThisPage")}</p>
        <ul className="mt-2 space-y-1 text-sm">
          {topic.sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="-my-2 inline-flex min-h-11 items-center py-2 text-teal-300 hover:text-teal-200">
                {section.weak ? t("tocOftenMissed", { title: section.title }) : section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {topic.sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-24 space-y-3">
          <h2 className="text-xl font-medium text-white">
            {section.title}
            {section.weak && (
              <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200">
                {t("oftenMissed")}
              </span>
            )}
          </h2>
          <SectionBlocks blocks={section.blocks} />
        </section>
      ))}
    </article>
  );
}
