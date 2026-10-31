import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import objectives from "@/content/objectives.json";
import { getFlashcards, getQuestions, getTopic } from "@/lib/content";
import type { Topic } from "@/lib/types";

const EXAM = "n10-009";

type DomainView = {
  id: string;
  title: string;
  weight: number;
  objectives: { id: string; title: string; topics: Topic[] }[];
};

/** The official domains with each objective's study topics, from content/objectives.json. */
function domainViews(): DomainView[] {
  const exam = objectives.exams.find((item) => item.code === EXAM);
  return (exam?.domains ?? []).map((domain) => ({
    id: domain.id,
    title: domain.title,
    weight: domain.weight,
    objectives: domain.objectives.map((objective) => ({
      id: objective.id,
      title: objective.title,
      topics: [...new Set(objective.topics)].flatMap((id) => {
        const topic = getTopic(id);
        return topic ? [topic] : [];
      }),
    })),
  }));
}

/**
 * Network+ study topics grouped the way the exam is: five domains, each with its objectives and the
 * notes, flashcards and quiz for every topic in one place. Topics no objective points to are listed last.
 */
export async function NetworkPlusDomains({ own }: { own: Topic[] }) {
  const t = await getTranslations("networkPlusDomains");
  const tv = await getTranslations("networkPlusVideos");
  const domains = domainViews();
  const mapped = new Set(domains.flatMap((domain) => domain.objectives.flatMap((objective) => objective.topics.map((topic) => topic.id))));
  const unmapped = own.filter((topic) => !mapped.has(topic.id));

  const topicRow = (topic: Topic) => {
    const cards = getFlashcards(topic.id, EXAM).length;
    const questions = getQuestions(topic.id, EXAM).length;
    return (
      <li key={topic.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <Link href={`/notes/${topic.id}`} className="inline-flex min-h-11 items-center text-teal-300 underline underline-offset-4 hover:text-teal-200">
          {topic.title}
        </Link>
        <span className="flex items-center gap-4 text-xs text-slate-400">
          {cards > 0 ? (
            <Link href={`/flashcards?topic=${encodeURIComponent(topic.id)}`} className="inline-flex min-h-11 items-center hover:text-white">
              {t("cards", { count: cards })}
            </Link>
          ) : null}
          {questions > 0 ? (
            <Link href={`/quiz?topic=${encodeURIComponent(topic.id)}`} className="inline-flex min-h-11 items-center hover:text-white">
              {t("questions", { count: questions })}
            </Link>
          ) : null}
        </span>
      </li>
    );
  };

  return (
    <section id="topics" aria-labelledby="domains-heading" className="space-y-4">
      <div>
        <h2 id="domains-heading" className="text-lg font-medium text-white">{t("title")}</h2>
        <p className="mt-1 text-sm text-slate-400">{t("body")}</p>
        <Link href="/networking/videos" className="mt-2 inline-flex min-h-11 items-center text-sm text-teal-300 underline underline-offset-4 hover:text-teal-200">
          {tv("watchAll")}
        </Link>
      </div>
      <div className="space-y-3">
        {domains.map((domain, index) => {
          const topicCount = new Set(domain.objectives.flatMap((objective) => objective.topics.map((topic) => topic.id))).size;
          return (
            <details key={domain.id} className="track-accent-border group rounded-2xl border bg-slate-900/70 p-4">
              <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                <span>
                  <span className="track-accent-text font-mono text-sm">{domain.id}</span>{" "}
                  <span className="text-lg font-medium text-white">{domain.title}</span>
                </span>
                <span className="text-xs text-slate-400">
                  {t("domainMeta", { weight: domain.weight, count: topicCount })} <span aria-hidden="true">▾</span>
                </span>
              </summary>
              <p className="mt-3">
                <Link href={`/networking/videos#domain-${index + 1}`} className="inline-flex min-h-11 items-center text-sm font-medium text-teal-300 underline underline-offset-4 hover:text-teal-200">
                  {tv("watch")}
                </Link>
              </p>
              <ol className="mt-1 space-y-4">
                {domain.objectives.map((objective) => (
                  <li key={objective.id}>
                    <p className="text-sm font-medium text-slate-100">
                      <span className="track-accent-text font-mono">{objective.id}</span> {objective.title}
                    </p>
                    {objective.topics.length > 0 ? (
                      <ul className="mt-1 divide-y divide-slate-800/70 border-l border-slate-800 pl-3 text-sm">
                        {objective.topics.map(topicRow)}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ol>
            </details>
          );
        })}
        {unmapped.length > 0 ? (
          <details className="track-accent-border rounded-2xl border bg-slate-900/70 p-4">
            <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center justify-between gap-2">
              <span className="text-lg font-medium text-white">{t("otherTitle")}</span>
              <span className="text-xs text-slate-400">{t("otherMeta", { count: unmapped.length })} <span aria-hidden="true">▾</span></span>
            </summary>
            <ul className="mt-3 divide-y divide-slate-800/70 border-l border-slate-800 pl-3 text-sm">{unmapped.map(topicRow)}</ul>
          </details>
        ) : null}
      </div>
    </section>
  );
}
