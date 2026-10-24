import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { examOptions } from "@/lib/exams";
import { searchSite, type SearchHit } from "@/lib/site-search";

export async function generateMetadata({ params }: PageProps<"/[locale]/search">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "siteSearch" });
  return { title: t("metaTitle"), description: t("intro") };
}

const kinds = ["topics", "flashcards", "questions", "terms"] as const;

export default async function SearchPage({ params, searchParams }: PageProps<"/[locale]/search">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const raw = await searchParams;
  const q = typeof raw.q === "string" ? raw.q : "";
  const exam = typeof raw.exam === "string" ? raw.exam : "all";
  const t = await getTranslations({ locale, namespace: "siteSearch" });
  const tExams = await getTranslations({ locale, namespace: "exams" });
  const examLabel = (id: string) => tExams(`${id}.shortLabel` as never);
  const selectedExam = examOptions.some((option) => option.id === exam) ? exam : "all";
  const results = searchSite(q, selectedExam);
  const hasQuery = q.trim().length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
        <p className="text-slate-300">{t("intro")}</p>
      </header>

      <form method="get" role="search" className="grid gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <label htmlFor="site-search-q" className="block text-sm font-medium text-slate-200">{t("label")}</label>
          <input id="site-search-q" name="q" type="search" defaultValue={q} placeholder={t("placeholder")} className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100 placeholder:text-slate-500" />
          <label htmlFor="site-search-exam" className="block text-sm font-medium text-slate-200">{t("examLabel")}</label>
          <select id="site-search-exam" name="exam" defaultValue={selectedExam} className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
            {examOptions.map((option) => (
              <option key={option.id} value={option.id}>{examLabel(option.id)}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="min-h-11 self-end rounded-xl bg-teal-400 px-5 font-semibold text-slate-950">{t("submit")}</button>
      </form>

      {hasQuery ? (
        <section className="space-y-5" aria-live="polite">
          <p className="text-slate-300">{t("count", { count: results.total })}</p>
          {results.total === 0 ? <p className="text-slate-400">{t("empty")}</p> : null}
          {kinds.map((kind) =>
            results[kind].length > 0 ? (
              <div key={kind} className="space-y-2">
                <h2 className="text-xl font-semibold">{t(`kind.${kind}`)} <span className="text-sm font-normal text-slate-400">({results[kind].length}{results[kind].length === 25 ? "+" : ""})</span></h2>
                <ul className="space-y-2">
                  {results[kind].map((hit: SearchHit) => (
                    <li key={`${hit.kind}-${hit.href}-${hit.title}`} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                      <Link href={hit.href} className="font-semibold text-cyan-100 underline">{hit.title}</Link>
                      <p className="mt-1 text-sm leading-relaxed text-slate-300">{hit.text}</p>
                      <p className="mt-1 text-xs text-slate-500">{hit.exam === "all" ? "" : examLabel(hit.exam)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </section>
      ) : (
        <p className="text-slate-400">{t("prompt")}</p>
      )}
    </div>
  );
}
