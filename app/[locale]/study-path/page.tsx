import type { Metadata } from "next";
import objectives from "@/content/objectives.json";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { topics, questions, flashcards } from "@/lib/content";

export async function generateMetadata({ params }: PageProps<"/[locale]/study-path">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "studyPath" });
  return { title: t("metaTitle"), description: t("intro") };
}

const linkClass = "inline-flex min-h-11 items-center text-sm font-medium text-teal-300 underline underline-offset-4 hover:text-teal-200";

export default async function StudyPathPage({ params }: PageProps<"/[locale]/study-path">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("studyPath");
  const exam = objectives.exams.find((e) => e.code === "n10-009");
  if (!exam) return null;
  const title = new Map(topics.map((x) => [x.id, x.title]));
  const qCount = new Map<string, number>();
  for (const q of questions) qCount.set(q.topicId, (qCount.get(q.topicId) ?? 0) + 1);
  const cCount = new Map<string, number>();
  for (const c of flashcards) cCount.set(c.topicId, (cCount.get(c.topicId) ?? 0) + 1);
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-teal-300">{t("eyebrow")}</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">{t("title")}</h1>
        <p className="max-w-3xl text-slate-300">{t("intro")}</p>
        <div className="flex flex-wrap gap-x-5">
          <Link href="/test?exam=n10-009" className={linkClass}>{t("takeTest")}</Link>
          <Link href="/weak-areas" className={linkClass}>{t("weakAreas")}</Link>
        </div>
      </header>
      {exam.domains.map((domain) => (
        <section key={domain.id} aria-labelledby={`d-${domain.id}`} className="space-y-3">
          <h2 id={`d-${domain.id}`} className="text-xl font-semibold text-white">
            {domain.id} {domain.title} <span className="text-sm font-normal text-slate-400">{t("weight", { weight: domain.weight })}</span>
          </h2>
          <ol className="space-y-3">
            {domain.objectives.map((ob) => (
              <li key={ob.id} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                <h3 className="break-words text-base font-medium text-white">{ob.id} {ob.title}</h3>
                <ul className="mt-2 divide-y divide-slate-800">
                  {ob.topics.map((id) => (
                    <li key={id} className="py-1">
                      <Link href={`/notes/${encodeURIComponent(id)}`} className="inline-flex min-h-11 items-center break-words text-sm text-slate-100 hover:text-teal-200">{title.get(id) ?? id}</Link>
                      <div className="flex flex-wrap gap-x-5">
                        <Link href={`/quiz?topic=${encodeURIComponent(id)}`} className={linkClass}>{t("quiz", { count: qCount.get(id) ?? 0 })}</Link>
                        <Link href={`/flashcards?topic=${encodeURIComponent(id)}`} className={linkClass}>{t("cards", { count: cCount.get(id) ?? 0 })}</Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
