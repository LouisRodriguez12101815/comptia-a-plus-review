"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useStudyFocus } from "@/app/components/useStudyFocus";

/**
 * The three things to do each day for the exam the learner is studying: a timed test, then the weak
 * areas it exposes, then a short review. Everything else on the site is reachable from the menus.
 */
export function TodayPlan() {
  const t = useTranslations("todayPlan");
  const tExams = useTranslations("exams");
  const [focus] = useStudyFocus();
  const exam = focus === "all" ? t("allExams") : tExams(`${focus}.label`);
  const testHref = focus === "all" ? "/test" : `/test?exam=${focus}`;
  const steps = [
    { href: testHref, title: t("testTitle"), body: t("testBody") },
    { href: "/weak-areas", title: t("weakTitle"), body: t("weakBody") },
    { href: "/final-15", title: t("reviewTitle"), body: t("reviewBody") },
  ];
  return (
    <section aria-labelledby="today-heading" className="space-y-4 rounded-2xl border border-teal-400/40 bg-teal-400/5 p-5">
      <div>
        <p className="text-sm uppercase tracking-wide text-teal-300">{t("eyebrow")}</p>
        <h2 id="today-heading" className="mt-1 text-2xl font-semibold text-white">{t("heading", { exam })}</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">{t("intro")}</p>
      </div>
      <ol className="grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.href}>
            <Link href={step.href} className="block h-full rounded-2xl border border-slate-700 bg-slate-900/70 p-4 hover:border-teal-400">
              <span className="font-mono text-xs text-teal-300">{index + 1}</span>
              <span className="mt-1 block text-lg font-semibold text-white">{step.title}</span>
              <span className="mt-1 block text-sm text-slate-300">{step.body}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
