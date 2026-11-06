import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: PageProps<"/[locale]/methodology">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "methodologyPage" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function MethodologyPage({ params }: PageProps<"/[locale]/methodology">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("methodologyPage");

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <header className="relative overflow-hidden rounded-3xl border border-indigo-400/30 bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,.2),transparent_55%)] bg-slate-900 p-6 sm:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-300">{t("eyebrow")}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">{t("title")}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">{t("intro")}</p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link href="/assessment-workflow" className="inline-flex min-h-11 items-center rounded-full bg-indigo-400 px-4 py-2 font-semibold text-slate-950 hover:bg-indigo-300">{t("openAssessmentWorkflow")}</Link>
          <a href="https://github.com/LouisRodriguez12101815/comptia-a-plus-review" className="inline-flex min-h-11 items-center rounded-full border border-slate-600 px-4 py-2 text-slate-200 hover:border-indigo-300 hover:text-white">{t("repository")}</a>
        </div>
      </header>

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

      <section aria-labelledby="areas-heading" className="space-y-4">
        <h2 id="areas-heading" className="text-2xl font-semibold tracking-tight text-white">{t("areasHeading")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {["ingest", "map", "assess", "drill", "remediate", "measure"].map((key) => (
            <article key={key} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h3 className="font-mono text-sm font-semibold uppercase tracking-wide text-indigo-300">{t(`${key}Title`)}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{t(`${key}Body`)}</p>
            </article>
          ))}
        </div>
      </section>

      <aside className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
        <h2 className="font-semibold text-white">{t("nextHeading")}</h2>
        <p className="mt-2 leading-6">{t("nextBody")}</p>
      </aside>
    </div>
  );
}
