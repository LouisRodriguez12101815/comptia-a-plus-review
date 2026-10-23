import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SetTrackFocus } from "@/app/components/SetTrackFocus";
import { getFlashcards, getQuestions, getTopic } from "@/lib/content";
import assessment from "@/content/core2-assessment.json";
import learningMap from "@/content/core2-learning-map.json";
import { getDeck } from "@/lib/practice/drills";

export async function generateMetadata({ params }: PageProps<"/[locale]/core2/review-tools">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "core2Review" });
  return { title: t("title"), description: t("intro") };
}
const linkStyle = "inline-flex min-h-11 items-center rounded-xl border border-slate-600 px-3 py-2 text-sm text-teal-200 hover:border-teal-300 focus-visible:outline-2 focus-visible:outline-offset-2";
export default async function Core2Review({ params }: PageProps<"/[locale]/core2/review-tools">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("core2Review");
  const d = await getTranslations("drillDecks") as unknown as (key: string) => string;
  return <div className="space-y-8">
    <SetTrackFocus focus="220-1202" />
    <header className="space-y-3">
      <Link href="/core2" className="text-teal-200 underline">{t("back")}</Link>
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
      <p className="max-w-3xl text-slate-300">{t("intro")}</p>
      <p className="rounded-xl border border-amber-300/40 p-4 text-amber-100">{t("limits")}</p>
    </header>
    <section className="space-y-4" aria-labelledby="assessment-items">
      <h2 id="assessment-items" className="text-2xl font-semibold">{t("assessmentHeading")}</h2>
      <p className="text-slate-300">{t("howToStudy")}</p>
      <details className="rounded-2xl border border-slate-700 p-4">
        <summary className="min-h-11 cursor-pointer text-teal-200">{t("showMapping")}</summary>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {assessment.items.map(item => <li key={item.number} className="rounded-xl border border-slate-700 p-4">
            <p className="font-medium">{item.number}. {item.title}</p>
            <p className="mt-1 text-sm text-slate-400">{item.exam} · {item.objective}{item.number === 50 ? ` · ${t("supplement")}` : ""}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link className={linkStyle} href={`/notes/${item.topicId}${item.number < 50 ? `#${item.sectionId}` : ""}`}>{t("notes")}</Link>
              <Link className={linkStyle} href={`/quiz?topic=${item.topicId}`}>{t("quiz")}</Link>
              <Link className={linkStyle} href={`/flashcards?topic=${item.topicId}`}>{t("cards")}</Link>
              <Link className={linkStyle} href={`/practice-games/drills/${item.drillId}`}>{t("memory")}</Link>
              <a className={linkStyle} href={`/visuals/${item.visualFile}?item=${item.number}`} target="_blank" rel="noopener noreferrer">{t("visual")}</a>
            </div>
          </li>)}
        </ol>
      </details>
    </section>
    <section className="space-y-4" aria-labelledby="all-tools">
      <h2 id="all-tools" className="text-2xl font-semibold">{t("allTopics")}</h2>
      <p className="text-slate-300">{t("availability")}</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {learningMap.topics.map(entry => {
          const topic = getTopic(entry.topicId)!;
          return <article id={`topic-${entry.topicId}`} key={entry.topicId} className="scroll-mt-24 space-y-3 rounded-2xl border border-slate-700 p-5">
            <h3 className="text-xl font-medium">{topic.title}</h3>
            {entry.kind === "shared" && <p className="text-sm text-amber-100">{t("shared")}</p>}
            <p className="text-sm text-slate-400">{t("counts", { cards: getFlashcards(topic.id, "220-1202").length, questions: getQuestions(topic.id, "220-1202").length, visuals: entry.visualFiles.length })}</p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/notes/${topic.id}`} className={linkStyle}>{t("notes")}</Link>
              <Link href={`/flashcards?topic=${topic.id}`} className={linkStyle}>{t("cards")}</Link>
              <Link href={`/quiz?topic=${topic.id}`} className={linkStyle}>{t("quiz")}</Link>
            </div>
            <ul className="space-y-1">{entry.drillIds.map(id => <li key={id}><Link href={`/practice-games/drills/${id}`} className="inline-flex min-h-11 items-center text-teal-200 underline">{d(`${getDeck(id)!.id}.title`)}</Link></li>)}</ul>
            <ul className="space-y-1">{entry.visualFiles.map((file, i) => <li key={file}><a href={`/visuals/${file}`} className="inline-flex min-h-11 items-center text-teal-200 underline" target="_blank" rel="noopener noreferrer">{t("openVisual", { number: i + 1 })}</a></li>)}</ul>
          </article>;
        })}
      </div>
    </section>
    <section className="space-y-3 rounded-2xl border border-teal-300/40 p-5" aria-labelledby="next-content">
      <h2 id="next-content" className="text-2xl font-semibold">{t("nextHeading")}</h2>
      <p className="text-slate-300">{t("queued")}</p>
      <p className="font-mono text-teal-200">{assessment.queuedObjectives.join(" · ")}</p>
      <Link href="/coverage" className={linkStyle}>{t("coverage")}</Link>
    </section>
  </div>;
}
