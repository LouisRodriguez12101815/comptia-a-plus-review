import type { Metadata } from "next";
import objectives from "@/content/objectives.json";
import { flashcards, labs, questions, topics } from "@/lib/content";
import { buildCoverageFromContent, buildInsightsFromCoverage } from "@/lib/objective-coverage.mjs";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({ params }: PageProps<"/[locale]/insights">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "insightsPage" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function InsightsPage({ params }: PageProps<"/[locale]/insights">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "insightsPage" });
  const coverage = buildCoverageFromContent({ objectives, topics, cards: flashcards, questions, labs, visuals: {} });
  const insights = buildInsightsFromCoverage({ ...coverage, topics, cards: flashcards, questions, labs });
  const number = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });

  return <article className="space-y-10">
    <header className="space-y-3">
      <p className="text-sm font-medium uppercase tracking-wide text-teal-300">{t("eyebrow")}</p>
      <h1 className="text-3xl font-semibold text-white sm:text-4xl">{t("heading")}</h1>
      <p className="max-w-3xl text-slate-300">{t("intro")}</p>
    </header>

    <aside className="rounded-xl border border-amber-400/40 bg-amber-400/5 p-4 text-sm text-slate-300" aria-labelledby="insights-caveat">
      <h2 id="insights-caveat" className="font-semibold text-amber-200">{t("caveatHeading")}</h2>
      <p className="mt-2">{objectives.note}</p>
      <p className="mt-2">{t("weightCaveat")}</p>
      <p className="mt-2">{t("outcomeCaveat")}</p>
    </aside>

    <figure className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-5" aria-labelledby="coverage-figure-title">
      <figcaption>
        <h2 id="coverage-figure-title" className="text-xl font-semibold text-white">{t("coverageTitle")}</h2>
        <p className="mt-2 text-sm text-slate-300">{t("coverageTakeaway")}</p>
        <p className="mt-2 text-xs text-slate-400">{t("coverageMethod")}</p>
        <p className="mt-1 text-xs text-slate-500">{t("coverageSource")}</p>
      </figcaption>
      <ul className="space-y-4" aria-label={t("coverageChartLabel")}>
        {insights.exams.map((exam) => <li key={exam.code} className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="font-medium text-slate-100">{exam.name} <span className="font-mono text-xs text-teal-300">{exam.code}</span></h3>
            <p className="text-sm text-slate-300">{t("weighted", { percent: percent.format(exam.weighted / 100) })}</p>
          </div>
          <div className="flex h-3 overflow-hidden rounded bg-slate-800" aria-hidden="true">
            <span className="bg-emerald-400" style={{ width: `${exam.total ? 100 * exam.covered / exam.total : 0}%` }} />
            <span className="bg-amber-400" style={{ width: `${exam.total ? 100 * exam.partial / exam.total : 0}%` }} />
            <span className="bg-slate-500" style={{ width: `${exam.total ? 100 * exam.missing / exam.total : 0}%` }} />
          </div>
          <p className="text-xs text-slate-300">{t("counts", { covered: number.format(exam.covered), partial: number.format(exam.partial), missing: number.format(exam.missing), total: number.format(exam.total) })}</p>
        </li>)}
      </ul>
      <div className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300" tabIndex={0} role="region" aria-label={t("coverageTableCaption")}>
        <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
          <caption className="sr-only">{t("coverageTableCaption")}</caption>
          <thead><tr className="border-b border-slate-700 text-slate-300"><th scope="col" className="py-2 pr-4">{t("track")}</th><th scope="col" className="py-2 px-2">{t("domain")}</th><th scope="col" className="py-2 px-2">{t("domainWeight")}</th><th scope="col" className="py-2 px-2">{t("covered")}</th><th scope="col" className="py-2 px-2">{t("partial")}</th><th scope="col" className="py-2 px-2">{t("missing")}</th></tr></thead>
          <tbody>{insights.exams.flatMap((exam) => exam.domains.map((domain) => <tr key={`${exam.code}:${domain.id}`} className="border-b border-slate-800 text-slate-200"><th scope="row" className="py-2 pr-4 font-medium">{exam.code}</th><td className="py-2 px-2">{domain.id} · {domain.title}</td><td className="py-2 px-2">{percent.format(domain.weight / 100)}</td><td className="py-2 px-2">{number.format(domain.covered)}</td><td className="py-2 px-2">{number.format(domain.partial)}</td><td className="py-2 px-2">{number.format(domain.missing)}</td></tr>))}</tbody>
        </table>
      </div>
    </figure>

    <figure className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-5" aria-labelledby="resources-figure-title">
      <figcaption>
        <h2 id="resources-figure-title" className="text-xl font-semibold text-white">{t("resourcesTitle")}</h2>
        <p className="mt-2 text-sm text-slate-300">{t("resourcesTakeaway")}</p>
        <p className="mt-2 text-xs text-slate-400">{t("resourcesMethod")}</p>
        <p className="mt-1 text-xs text-slate-500">{t("resourcesSource")}</p>
      </figcaption>
      <div className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300" tabIndex={0} role="region" aria-label={t("resourcesTableCaption")}>
        <table className="w-full min-w-[38rem] border-collapse text-left text-sm">
          <caption className="sr-only">{t("resourcesTableCaption")}</caption>
          <thead><tr className="border-b border-slate-700 text-slate-300"><th scope="col" className="py-2 pr-4">{t("track")}</th><th scope="col" className="py-2 px-2">{t("questions")}</th><th scope="col" className="py-2 px-2">{t("flashcards")}</th><th scope="col" className="py-2 px-2">{t("labs")}</th><th scope="col" className="py-2 px-2">{t("weightedCoverage")}</th></tr></thead>
          <tbody>{insights.resourceTracks.map((track) => <tr key={track.code} className="border-b border-slate-800 text-slate-200"><th scope="row" className="py-2 pr-4 font-medium">{track.name} <span className="font-mono text-xs text-teal-300">{track.code}</span></th><td className="py-2 px-2">{number.format(track.questions)}</td><td className="py-2 px-2">{number.format(track.flashcards)}</td><td className="py-2 px-2">{number.format(track.labs)}</td><td className="py-2 px-2">{track.weighted === null ? t("noMatrix") : percent.format(track.weighted / 100)}</td></tr>)}</tbody>
          <tbody>{insights.exams.flatMap((exam) => exam.domains.map((domain) => <tr key={`${exam.code}:${domain.id}`} className="border-b border-slate-800 text-slate-300"><th scope="row" className="py-2 pr-4 font-normal">{exam.code} · {domain.id}</th><td className="py-2 px-2">{number.format(domain.questions)}</td><td className="py-2 px-2">{number.format(domain.flashcards)}</td><td className="py-2 px-2">{number.format(domain.labs)}</td><td className="py-2 px-2">—</td></tr>))}</tbody>
        </table>
      </div>
      {insights.exams.filter((exam) => exam.total === 0).map((exam) => <p key={exam.code} className="text-sm text-slate-300">{t("emptyTrack", { track: exam.name, questions: number.format(exam.questions), flashcards: number.format(exam.flashcards), labs: number.format(exam.labs) })}</p>)}
      {insights.resourceTracks.filter((track) => track.weighted === null).map((track) => <p key={track.code} className="text-sm text-slate-300">{t("noMatrixTrack", { track: track.name, code: track.code, labs: number.format(track.labs) })}</p>)}
    </figure>

    <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-5" aria-labelledby="candidates-title">
      <div>
        <h2 id="candidates-title" className="text-xl font-semibold text-white">{t("candidatesTitle")}</h2>
        <p className="mt-2 text-sm text-slate-300">{t("candidatesMethod")}</p>
      </div>
      {insights.partialCandidates.length ? <ol className="list-decimal space-y-3 pl-6">{insights.partialCandidates.map((item) => <li key={`${item.exam}:${item.id}`} className="text-slate-200"><span className="font-mono text-sm text-teal-300">{item.exam} · {item.id}</span> — {item.title} <span className="text-sm text-slate-400">({item.domainTitle}, {percent.format(item.weight / 100)})</span></li>)}</ol> : <p className="text-slate-300">{t("noCandidates")}</p>}
      <p className="text-xs text-slate-500">{t("candidateSource")}</p>
    </section>
  </article>;
}
