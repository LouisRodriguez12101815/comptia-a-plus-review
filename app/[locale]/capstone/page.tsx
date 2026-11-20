import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getProjectInsights } from "@/lib/project-insights";
import { CoverageSnapshot } from "@/app/components/CoverageSnapshot";

const repository = "https://github.com/LouisRodriguez12101815/comptia-a-plus-review";
export async function generateMetadata({ params }: PageProps<"/[locale]/capstone">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "capstonePage" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function CapstonePage({ params }: PageProps<"/[locale]/capstone">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("capstonePage");
  const { insights } = getProjectInsights();
  const total = insights.exams.reduce((sum, exam) => sum + exam.total, 0);
  const covered = insights.exams.reduce((sum, exam) => sum + exam.covered, 0);
  const partial = insights.exams.reduce((sum, exam) => sum + exam.partial, 0);
  const missing = insights.exams.reduce((sum, exam) => sum + exam.missing, 0);
  const number = new Intl.NumberFormat(locale);
  const zeroTracks = insights.exams.filter((exam) => exam.total === 0).length;

  return <article className="mx-auto max-w-5xl space-y-8">
    <header className="rounded-3xl border border-indigo-400/30 bg-slate-900 p-6 sm:p-10">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-300">{t("eyebrow")}</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{t("title")}</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">{t("intro")}</p>
      <p className="mt-4 text-sm text-slate-300">{t("author")}</p>
    </header>

    <section className="grid gap-4 md:grid-cols-2" aria-label={t("projectDetails")}>
      {(["problem", "dataset", "analysis", "tools"] as const).map((key) => <article key={key} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-xl font-semibold text-white">{t(`${key}Title`)}</h2><p className="mt-3 text-sm leading-6 text-slate-300">{t(`${key}Body`)}</p>
        {key === "dataset" && <ul className="mt-3 space-y-1 text-sm text-teal-200">{(["content/objectives.json", "content/topics.json", "content/topics-network-plus.json", "content/questions.json", "content/flashcards.json", "content/labs.json", "content/track-visuals.json", "content/concept-videos.json", "lib/objective-coverage.mjs", "scripts/objective-coverage.mjs", "lib/project-insights.ts"] as const).map((file) => <li key={file}><a className="inline-flex min-h-8 items-center underline underline-offset-4" href={`${repository}/blob/main/${file}`}>{file}</a></li>)}</ul>}
        {key === "tools" && <a className="mt-3 inline-block min-h-11 text-teal-200 underline underline-offset-4" href={repository}>{t("repositoryLink")}</a>}
      </article>)}
    </section>

    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5" aria-labelledby="python-heading">
      <h2 id="python-heading" className="text-xl font-semibold text-white">{t("pythonTitle")}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">{t("pythonBody")}</p>
      <div className="mt-3 flex flex-wrap gap-4 text-teal-200">
        <a className="inline-flex min-h-11 items-center underline underline-offset-4" href={`${repository}/blob/main/capstone/analysis_walkthrough.ipynb`}>{t("notebookLink")}</a>
        <a className="inline-flex min-h-11 items-center underline underline-offset-4" href={`${repository}/blob/main/capstone/README.md`}>{t("evidenceLink")}</a>
      </div>
    </section>

    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6" aria-labelledby="findings-heading">
      <h2 id="findings-heading" className="text-2xl font-semibold text-white">{t("findingsTitle")}</h2>
      <p className="text-sm leading-6 text-slate-300">{t("findingsSummary", { total: number.format(total), covered: number.format(covered), partial: number.format(partial), missing: number.format(missing), empty: number.format(zeroTracks) })}</p>
      <CoverageSnapshot summary={insights} locale={locale} />
      <p className="text-sm text-slate-400">{t("findingsCaveat")}</p>
    </section>

    <section className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5 sm:p-6" aria-labelledby="limits-heading">
      <h2 id="limits-heading" className="text-2xl font-semibold text-white">{t("limitsTitle")}</h2><p className="mt-3 text-sm leading-7 text-slate-300">{t("limitsBody")}</p>
    </section>

    <section className="space-y-3" aria-labelledby="examples-heading">
      <h2 id="examples-heading" className="text-2xl font-semibold text-white">{t("examplesTitle")}</h2>
      <p className="text-sm leading-6 text-slate-300">{t("examplesBody")}</p>
      <nav aria-label={t("examplesTitle")} className="flex flex-wrap gap-3">
        {([ ["/game", "outage"], ["/practice-games/subnet-architect", "subnet"], ["/labs", "labs"], ["/networking/videos", "videos"], ["/performance", "performance"], ["/weak-areas", "weakAreas"] ] as const).map(([href, key]) => <Link key={key} href={href} className="inline-flex min-h-11 items-center rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:border-teal-300 hover:text-white">{t(`exampleLinks.${key}`)}</Link>)}
      </nav>
    </section>

    <nav aria-label={t("nextSteps")} className="flex flex-wrap gap-3">
      <Link href="/insights" className="inline-flex min-h-11 items-center rounded-full bg-indigo-400 px-4 py-2 font-semibold text-slate-950">{t("insightsLink")}</Link>
      <Link href="/coverage" className="inline-flex min-h-11 items-center rounded-full border border-teal-400 px-4 py-2 font-semibold text-teal-200">{t("coverageLink")}</Link>
      <Link href="/certifications" className="inline-flex min-h-11 items-center rounded-full border border-slate-600 px-4 py-2 text-slate-200">{t("studyLink")}</Link>
    </nav>
  </article>;
}
