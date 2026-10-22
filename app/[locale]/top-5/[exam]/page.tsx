import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import objectives from "@/content/objectives.json";
import { drillHref } from "@/lib/practice/drills";
import { finalReviews } from "@/lib/practice/finalReview";
import { getTopFive, topFives } from "@/lib/study/topFive";

export function generateStaticParams() {
  return topFives.map((t) => ({ exam: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/top-5/[exam]">): Promise<Metadata> {
  const { locale, exam: id } = await params;
  const top = getTopFive(id);
  if (!top) return {};
  const t = await getTranslations({ locale, namespace: "topFive" });
  return { title: t("metaTitle", { certification: top.certification }), description: t("intro") };
}

export default async function TopFivePage({ params }: PageProps<"/[locale]/top-5/[exam]">) {
  const { locale, exam: id } = await params;
  setRequestLocale(locale);
  const top = getTopFive(id);
  const exam = top && objectives.exams.find((e) => e.code === top.exam);
  if (!top || !exam) notFound();
  const t = await getTranslations({ locale, namespace: "topFive" });
  // Deck keys are data-driven, so the typed key union is widened here.
  const d = (await getTranslations({ locale, namespace: "drillDecks" })) as unknown as (key: string) => string;
  const domains = new Map(exam.domains.map((dm) => [dm.objectives[0].id.split(".")[0], dm]));
  const final15 = finalReviews.find((r) => r.exam === top.exam);

  return <div className="mx-auto max-w-3xl space-y-6">
    <header className="space-y-2">
      <p className="text-sm text-cyan-100">{t("eyebrow", { certification: top.certification, exam: top.exam })}</p>
      <h1 className="text-3xl font-bold">{t("title", { certification: top.certification })}</h1>
      <p className="text-slate-300">{t("intro")}</p>
    </header>

    <aside aria-labelledby="top5-note" className="space-y-2 rounded-2xl border border-amber-300/50 bg-amber-300/10 p-5">
      <h2 id="top5-note" className="text-lg font-semibold text-amber-100">{t("noteTitle")}</h2>
      <p>{t("note", { exam: top.exam })}</p>
    </aside>

    <ol className="space-y-5">
      {top.concepts.map((c, i) => <li key={c.id} id={c.id} className="space-y-4 rounded-2xl border border-cyan-300/30 bg-slate-900 p-5">
        <div className="flex items-start gap-4">
          <span aria-hidden="true" className="font-mono text-3xl font-bold text-cyan-200">{i + 1}</span>
          <div className="min-w-0 space-y-2">
            <h2 className="text-2xl font-semibold"><span className="sr-only">{t("rank", { n: i + 1 })} </span>{c.title}</h2>
            <ul className="flex flex-wrap gap-2 text-sm">
              {c.domains.map((n) => { const dm = domains.get(n); return dm ? <li key={n} className="rounded-full border border-teal-300/50 px-3 py-1 text-teal-100">{t("domainShare", { weight: dm.weight, domain: `${n}.0 ${dm.title}` })}</li> : null; })}
              <li className="rounded-full border border-slate-600 px-3 py-1 font-mono text-slate-300">{t("objectives", { ids: c.objectives })}</li>
            </ul>
          </div>
        </div>
        <p className="text-slate-200">{c.why}</p>
        <div className="space-y-2">
          <h3 className="font-semibold text-cyan-100">{t("mustKnow")}</h3>
          <ul className="list-disc space-y-1 pl-5 text-slate-200">{c.facts.map((f) => <li key={f}>{f}</li>)}</ul>
        </div>
        <nav aria-label={t("practiceLabel", { title: c.title })} className="space-y-2">
          <h3 className="font-semibold text-cyan-100">{t("practice")}</h3>
          <ul className="flex flex-wrap gap-2">{c.drills.map((deck) => <li key={deck}><Link href={drillHref(deck)} className="inline-flex min-h-11 items-center rounded-xl border border-slate-600 px-4 text-sm text-cyan-100 hover:border-cyan-300">{d(`${deck}.title`)}</Link></li>)}</ul>
        </nav>
      </li>)}
    </ol>

    {final15 && <p className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
      {t("finalPrompt")} <Link href={`/final-15/${final15.id}`} className="inline-flex min-h-11 items-center font-semibold text-cyan-200 underline">{t("finalLink", { certification: top.certification })}</Link>
    </p>}
  </div>;
}
