import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Scorecard } from "@/app/components/Scorecard";

const exams = ["220-1202", "220-1201", "n10-009", "clf-c02", "saa-c03"] as const;

export async function generateMetadata({ params }: PageProps<"/[locale]/scorecard">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "scorecard" });
  return { title: t("metaTitle"), description: t("intro") };
}

export default async function ScorecardPage({ params, searchParams }: PageProps<"/[locale]/scorecard">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { exam } = await searchParams;
  const selected = exams.includes(exam as (typeof exams)[number]) ? (exam as string) : "220-1202";
  const t = await getTranslations({ locale, namespace: "scorecard" });
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-teal-300">{t("eyebrow")} · <span className="font-mono">{selected}</span></p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">{t("title")}</h1>
        <p className="max-w-3xl text-slate-300">{t("intro")}</p>
        <nav aria-label={t("examsLabel")} className="flex flex-wrap gap-2 pt-1">
          {exams.map((code) => (
            <Link key={code} href={`/scorecard?exam=${code}`} aria-current={code === selected ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-full border px-3 py-1.5 font-mono text-sm ${code === selected ? "border-teal-400 bg-teal-400 text-slate-950" : "border-slate-700 text-slate-200 hover:border-teal-400"}`}>{code}</Link>
          ))}
        </nav>
      </header>
      <Scorecard exam={selected} />
    </div>
  );
}
