import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MethodologyWorkflow } from "@/app/components/MethodologyWorkflow";
import { getProjectInsights } from "@/lib/project-insights";
import { CoverageSnapshot } from "@/app/components/CoverageSnapshot";

const workflowAreas = ["ingest", "map", "assess", "drill", "remediate", "measure"] as const;
const forkSteps = ["rubric", "sources", "map", "coverage", "gaps", "assets", "validate", "deploy"] as const;

export async function generateMetadata({ params }: PageProps<"/[locale]/methodology">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "methodologyPage" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function MethodologyPage({ params }: PageProps<"/[locale]/methodology">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("methodologyPage");
  const journey = await getTranslations("navigationJourney");
  const paths = await getTranslations("projectPaths");
  const { insights } = getProjectInsights();
  const totals = insights.exams.reduce((sum, exam) => ({ total: sum.total + exam.total, covered: sum.covered + exam.covered, partial: sum.partial + exam.partial, missing: sum.missing + exam.missing }), { total: 0, covered: 0, partial: 0, missing: 0 });
  const number = new Intl.NumberFormat(locale);

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <header className="relative overflow-hidden rounded-3xl border border-indigo-400/30 bg-[radial-gradient(circle_at_top_right,var(--track-accent-soft),transparent_55%)] bg-slate-900 p-6 sm:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-300">{t("eyebrow")}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">{t("title")}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">{t("intro")}</p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link href="/certifications" className="inline-flex min-h-11 items-center rounded-full border border-teal-400 px-4 py-2 font-semibold text-teal-200 hover:bg-teal-400/10">{journey("example")}</Link>
          <a href="#build" className="inline-flex min-h-11 items-center rounded-full bg-indigo-400 px-4 py-2 font-semibold text-slate-950 hover:bg-indigo-300">{paths("buildLink")}</a>
          <a href="#checks" className="inline-flex min-h-11 items-center rounded-full border border-indigo-300 px-4 py-2 font-semibold text-indigo-100">{paths("checksLink")}</a>
          <a href="https://github.com/LouisRodriguez12101815/comptia-a-plus-review" className="inline-flex min-h-11 items-center rounded-full border border-slate-600 px-4 py-2 text-slate-200 hover:border-indigo-300 hover:text-white">{t("repository")}</a>
        </div>
      </header>

      <section id="build" className="scroll-mt-6 rounded-3xl border border-teal-400/30 bg-slate-900 p-6 sm:p-8" aria-labelledby="build-heading">
        <p className="font-mono text-xs uppercase tracking-widest text-teal-300">{paths("buildEyebrow")}</p>
        <h2 id="build-heading" className="mt-3 text-3xl font-semibold text-white">{paths("buildTitle")}</h2>
        <p className="mt-3 max-w-3xl leading-7 text-slate-300">{paths("buildIntro")}</p>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(["source", "objectives", "prepare", "review"] as const).map((key, index) => <li key={key} className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 transition duration-300 hover:-translate-y-1 hover:border-teal-300 motion-reduce:transform-none motion-reduce:transition-none"><span className="font-mono text-sm text-teal-300">0{index + 1}</span><p className="mt-3 text-sm leading-6 text-slate-200">{paths(`steps.${key}`)}</p></li>)}
        </ol>
        <p className="mt-5 text-sm leading-6 text-slate-400">{paths("buildLimits")}</p>
        <nav aria-label={paths("resources")} className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <a className="inline-flex min-h-11 items-center text-teal-300 underline underline-offset-4" href="https://github.com/LouisRodriguez12101815/comptia-a-plus-review/blob/47a4b95ad3293742afee3263c6b77f9cb18800ba/docs/skills/README.md">{paths("skillsLink")}</a>
          <Link className="inline-flex min-h-11 items-center text-teal-300 underline underline-offset-4" href="/workplace-demo">{paths("pilotLink")}</Link>
        </nav>
      </section>
      <section id="checks" className="scroll-mt-6 rounded-3xl border border-indigo-400/30 bg-slate-900 p-6 sm:p-8" aria-labelledby="checks-heading">
        <p className="font-mono text-xs uppercase tracking-widest text-indigo-300">{paths("checksEyebrow")}</p>
        <h2 id="checks-heading" className="mt-3 text-3xl font-semibold text-white">{paths("checksTitle")}</h2>
        <p className="mt-3 max-w-3xl leading-7 text-slate-300">{paths("checksIntro")}</p>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{paths("checksLimits")}</p>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">{paths("guideOverview")}</p>
        <Link href="/assessment-workflow" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-indigo-400 px-5 py-2 font-semibold text-slate-950 hover:bg-indigo-300">{paths("assessmentLink")} →</Link>
        {locale !== "en" && <p className="text-sm text-slate-400">{paths("englishNotice")}</p>}
      </section>

      <section aria-labelledby="loops-heading" className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-teal-400/30 bg-teal-400/5 p-5">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-teal-300">{t("learnerLoopLabel")}</p>
          <h2 id="loops-heading" className="mt-2 text-2xl font-semibold tracking-tight text-white">{t("learnerLoop")}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{t("learnerLoopBody")}</p>
        </div>
        <div className="rounded-2xl border border-indigo-400/30 bg-indigo-400/5 p-5">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-indigo-300">{t("systemLoopLabel")}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{t("systemLoop")}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{t("systemLoopBody")}</p>
        </div>
      </section>

      <MethodologyWorkflow />

      <details className="rounded-2xl border border-slate-700 p-5">
        <summary className="cursor-pointer font-semibold text-white">{t("areasHeading")}</summary>
        <div className="mt-4 divide-y divide-slate-800 sm:grid sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
          {workflowAreas.map((key) => <article key={key} className="p-4"><h3 className="font-mono text-sm font-semibold uppercase text-indigo-300">{t(`${key}Title`)}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{t(`${key}Body`)}</p></article>)}
        </div>
      </details>

      <section aria-labelledby="mapping-heading" className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 id="mapping-heading" className="text-xl font-semibold tracking-tight text-white">{t("mappingHeading")}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">{t("mappingBody")}</p>
          <p className="mt-4 rounded-xl border border-indigo-400/30 bg-indigo-400/5 p-3 font-mono text-sm text-indigo-200">{t("mappingFormula")}</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-xl font-semibold tracking-tight text-white">{t("syncHeading")}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">{t("syncBody")}</p>
        </article>
      </section>

      <section aria-labelledby="repository-heading" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
        <h2 id="repository-heading" className="text-xl font-semibold tracking-tight text-white">{t("repositoryHeading")}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{t("repositoryBody")}</p>
        <ol className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
          {forkSteps.map((key, index) => (
            <li key={key} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3"><span className="font-mono text-indigo-300">{index + 1}. </span>{t(`fork.${key}`)}</li>
          ))}
        </ol>
        <p className="mt-5 text-sm text-slate-400">{t("forkTelemetry")}</p>
      </section>

      <details className="rounded-2xl border border-slate-700 p-5">
        <summary className="cursor-pointer font-semibold text-white">{paths("coverageDetails")}</summary>
        <div className="mt-4">
      <section aria-labelledby="current-method-heading" className="space-y-4 rounded-2xl border border-teal-400/30 bg-teal-400/5 p-5 sm:p-6">
        <h2 id="current-method-heading" className="text-2xl font-semibold text-white">{t("currentMethodHeading")}</h2>
        <p className="text-sm leading-6 text-slate-300">{t("currentMethodBody", { total: number.format(totals.total), covered: number.format(totals.covered), partial: number.format(totals.partial), missing: number.format(totals.missing) })}</p>
        <p className="text-sm leading-6 text-slate-300">{t("currentMethodRules")}</p>
        <p className="text-sm leading-6 text-slate-300">{t("currentMethodWeak")}</p>
        <p className="text-sm leading-6 text-slate-400">{t("currentMethodTools")}</p>
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="p-3 text-left text-slate-300">{t("currentMethodWeights")}</caption>
            <thead><tr className="border-y border-slate-700 text-slate-300"><th scope="col" className="p-3">{t("weightDomain")}</th><th scope="col" className="p-3">{t("weightValue")}</th></tr></thead>
            <tbody>{insights.exams.flatMap((exam) => exam.domains.map((domain) => <tr key={`${exam.code}:${domain.id}`} className="border-b border-slate-800 text-slate-200"><th scope="row" className="p-3 font-medium">{exam.name} · {domain.id} {domain.title}</th><td className="p-3">{new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(domain.weight / 100)}</td></tr>))}</tbody>
          </table>
        </div>
        <CoverageSnapshot summary={insights} locale={locale} />
        <nav aria-label={t("currentMethodLinks")} className="flex flex-wrap gap-3 text-sm">
          <Link href="/insights" className="inline-flex min-h-11 items-center rounded-full bg-teal-300 px-4 py-2 font-semibold text-slate-950">{t("currentMethodInsights")}</Link>
          <Link href="/coverage" className="inline-flex min-h-11 items-center rounded-full border border-teal-300 px-4 py-2 font-semibold text-teal-100">{t("currentMethodCoverage")}</Link>
        </nav>
      </section>

        </div>
      </details>

      <section aria-labelledby="validation-heading" className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
        <h2 id="validation-heading" className="text-xl font-semibold text-white">{t("validationHeading")}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">{t("validationBody")}</p>
        <p className="mt-3 text-sm leading-7 text-slate-300">{t("futureBody")}</p>
      </section>

      <aside className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
        <h2 className="font-semibold text-white">{t("nextHeading")}</h2>
        <p className="mt-2 leading-6">{t("nextBody")}</p>
      </aside>
    </div>
  );
}
