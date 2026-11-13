import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import objectives from "@/content/objectives.json";
import { questions, topics } from "@/lib/content";
import { buildExamPool } from "@/lib/exam-test.mjs";
import { ProgressDashboard } from "@/app/components/ProgressDashboard";
import { LearnerSync } from "@/app/components/LearnerSync";
import { SetTrackFocus } from "@/app/components/SetTrackFocus";

const exam = buildExamPool({ objectives, questions, topics, examCode: "clf-c02" });

const domainStyles = [
  "border-cyan-400/40 bg-cyan-400/[0.07] hover:border-cyan-300",
  "border-violet-400/40 bg-violet-400/[0.07] hover:border-violet-300",
  "border-amber-400/40 bg-amber-400/[0.07] hover:border-amber-300",
  "border-emerald-400/40 bg-emerald-400/[0.07] hover:border-emerald-300",
];

export async function AwsClfWorkspace() {
  const t = await getTranslations("awsDomainExperience");
  return (
    <div className="aws-clf-workspace space-y-10">
      <SetTrackFocus focus="clf-c02" />
      <header className="aws-clf-hero relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-slate-950 px-6 py-10 sm:px-10">
        <svg aria-hidden="true" className="aws-network-art absolute inset-0 h-full w-full opacity-70" viewBox="0 0 900 300" preserveAspectRatio="none">
          <path className="aws-network-line" d="M-20 230 C160 40 250 270 430 110 S700 60 920 190" />
          <path className="aws-network-line aws-network-line-delay" d="M-20 75 C180 250 300 30 500 190 S720 250 920 60" />
          <circle cx="180" cy="150" r="4" className="fill-cyan-300" /><circle cx="450" cy="110" r="4" className="fill-violet-300" /><circle cx="720" cy="160" r="4" className="fill-amber-300" />
        </svg>
        <div className="relative max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">CLF-C02 · {t("eyebrow")}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">{t("title")}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">{t("intro")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/test?exam=clf-c02&practice=mixed20" className="inline-flex min-h-11 items-center rounded-full bg-cyan-300 px-5 py-2 font-semibold text-slate-950 hover:bg-cyan-200">{t("mixedPractice")}</Link>
            <Link href="/aws-clf/assessment" className="inline-flex min-h-11 items-center rounded-full border border-cyan-200/50 px-5 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-200">{t("assessment")}</Link>
            <Link href="/aws-clf/visuals" className="inline-flex min-h-11 items-center rounded-full border border-slate-600 px-5 py-2 text-sm text-slate-100 hover:border-cyan-300">{t("visuals")}</Link>
          </div>
        </div>
      </header>

      <section aria-labelledby="aws-domains-heading" className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-cyan-300">{t("domainEyebrow")}</p>
          <h2 id="aws-domains-heading" className="mt-1 text-2xl font-semibold text-white">{t("domainTitle")}</h2>
          <p className="mt-2 max-w-3xl text-slate-400">{t("domainIntro")}</p>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          {exam.domains.map((domain, index) => (
            <li key={domain.id}>
              <Link href={`/test?exam=clf-c02&practice=domain&domain=${encodeURIComponent(domain.id)}`} className={`group block h-full rounded-2xl border p-5 transition hover:-translate-y-0.5 ${domainStyles[index]}`}>
                <div className="flex items-start justify-between gap-4">
                  <span className="font-mono text-sm text-slate-300">{t("domainLabel", { id: domain.id })}</span>
                  <span className="rounded-full border border-white/15 px-3 py-1 text-sm font-semibold text-white">{domain.weight}%</span>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">{domain.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{t("domainCard", { weight: `${domain.weight}%`, count: domain.available, objectives: domain.objectives.length })}</p>
                <span className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-cyan-200 underline underline-offset-4 group-hover:text-white">{t("startDomain")}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-sm uppercase tracking-wide text-violet-300">{t("workflowEyebrow")}</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{t("workflowTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{t("workflowBody")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/notes" className="inline-flex min-h-11 items-center rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-100 hover:border-cyan-300">{t("notes")}</Link>
            <Link href="/flashcards" className="inline-flex min-h-11 items-center rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-100 hover:border-cyan-300">{t("flashcards")}</Link>
            <Link href="/coverage" className="inline-flex min-h-11 items-center rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-100 hover:border-cyan-300">{t("coverage")}</Link>
          </div>
        </div>
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.05] p-6">
          <h2 className="text-xl font-semibold text-white">{t("examTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{t("examBody")}</p>
          <Link href="/test?exam=clf-c02" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white">{t("fullExam")}</Link>
        </div>
      </section>

      <section aria-label={t("progress")} className="space-y-5">
        <ProgressDashboard />
        <LearnerSync />
      </section>
    </div>
  );
}
