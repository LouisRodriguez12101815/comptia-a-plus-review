import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import report from "@/capstone/outputs/review_classifier_report.json";
import { ClassificationExplorer } from "@/app/components/ClassificationExplorer";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "classificationExample" });
  return { title: t("title") + " | GapLift", description: t("intro") };
}

export default async function ClassificationExample({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("classificationExample");
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  const rows = [
    { name: t("model"), value: report.test.model_at_selected },
    { name: t("dummy"), value: report.test.dummy_at_selected },
    { name: t("all"), value: report.test.flag_all },
    { name: t("none"), value: report.test.flag_none },
  ];
  return <article className="mx-auto max-w-5xl space-y-9 pb-12">
    <nav aria-label={t("navigation")} className="flex flex-wrap gap-x-6 text-sm"><Link className="inline-flex min-h-11 items-center text-teal-300 underline underline-offset-4" href="/methodology#checks">{t("backMethod")}</Link><Link className="inline-flex min-h-11 items-center text-teal-300 underline underline-offset-4" href="/assessment-workflow">{t("assessmentGuide")}</Link></nav>
    <header className="overflow-hidden rounded-3xl border border-teal-300/30 bg-[radial-gradient(circle_at_top_right,#24584c,transparent_55%)] bg-slate-900 p-6 sm:p-10">
      <p className="font-mono text-xs font-semibold uppercase tracking-[.16em] text-teal-300">{t("eyebrow")}</p>
      <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">{t("title")}</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">{t("intro")}</p>
      <p className="mt-5 rounded-xl border border-amber-300/40 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">{t("limits")}</p>
    </header>
    <section aria-labelledby="method-title" className="space-y-4"><h2 id="method-title" className="text-2xl font-semibold text-white">{t("methodTitle")}</h2><p className="max-w-3xl leading-7 text-slate-300">{t("methodBody")}</p>
      <dl className="grid gap-3 sm:grid-cols-3">{(["train", "validation", "test"] as const).map(key => <div key={key} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4"><dt className="font-semibold text-white">{t(`split.${key}`)}</dt><dd className="mt-2 text-sm leading-6 text-slate-300">{t("splitCounts", { rows: report.split[key].rows, learners: report.split[key].learners, positive: report.split[key].positive })}</dd></div>)}</dl>
      <p className="text-sm leading-6 text-slate-400">{t("methodDetail", { falseAlarm: report.cost_weights.false_alarm, missed: report.cost_weights.missed_review })}</p>
    </section>
    <ClassificationExplorer />
    <section aria-labelledby="test-title" className="space-y-4"><p className="font-mono text-xs uppercase tracking-widest text-teal-300">{t("fixedLabel")}</p><h2 id="test-title" className="text-2xl font-semibold text-white">{t("testTitle")}</h2><p className="max-w-3xl leading-7 text-slate-300">{t("testIntro", { rows: report.split.test.rows, learners: report.split.test.learners, threshold: number.format(report.selected_threshold) })}</p>
      <div className="overflow-x-auto rounded-xl border border-slate-700"><table className="w-full min-w-[38rem] text-left text-sm"><caption className="p-4 text-left text-slate-300">{t("tableCaption")}</caption><thead className="border-y border-slate-700 text-slate-300"><tr>{[t("policy"), t("caught"), t("falseAlarms"), t("missed"), t("cost")].map(label => <th key={label} scope="col" className="p-3">{label}</th>)}</tr></thead><tbody>{rows.map(({ name, value }) => <tr key={name} className="border-b border-slate-800 text-slate-200"><th scope="row" className="p-3 font-medium">{name}</th><td className="p-3">{value.tp}</td><td className="p-3">{value.fp}</td><td className="p-3">{value.fn}</td><td className="p-3">{value.illustrative_cost}</td></tr>)}</tbody></table></div>
      <p className="text-sm leading-6 text-slate-300">{t("ranking", { auc: number.format(report.test.roc_auc), averagePrecision: number.format(report.test.average_precision), positiveRate: percent.format(report.test.positive_rate) })}</p>
      <p className="text-sm leading-6 text-slate-400">{t("interpretation", { flagged: report.test.model_at_selected.flagged, rows: report.split.test.rows })}</p>
    </section>
    <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6" aria-labelledby="reproduce-title"><h2 id="reproduce-title" className="text-xl font-semibold text-white">{t("reproduceTitle")}</h2><p className="mt-3 leading-7 text-slate-300">{t("reproduceBody")}</p><p className="mt-3 text-sm leading-6 text-slate-400">{t("sourcePath")}</p><a className="mt-2 inline-flex min-h-11 items-center text-teal-300 underline underline-offset-4" href="https://github.com/LouisRodriguez12101815/comptia-a-plus-review">{t("repository")}</a></section>
  </article>;
}
