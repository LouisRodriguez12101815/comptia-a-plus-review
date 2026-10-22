import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { finalReviews } from "@/lib/practice/finalReview";

export async function generateMetadata({ params }: PageProps<"/[locale]/final-15">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "finalReview" });
  return { title: t("indexMetaTitle"), description: t("indexIntro") };
}

export default async function FinalReviewIndex({ params }: PageProps<"/[locale]/final-15">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "finalReview" });
  return <div className="mx-auto max-w-3xl space-y-5">
    <header className="space-y-2">
      <h1 className="text-4xl font-bold">{t("indexTitle")}</h1>
      <p className="text-slate-300">{t("indexIntro")}</p>
    </header>
    <ul className="grid gap-4 sm:grid-cols-2">{finalReviews.map((r) => <li key={r.id} className="space-y-3 rounded-2xl border border-amber-300/50 bg-slate-900 p-5">
      <h2 className="text-2xl font-semibold">{t("title", { certification: r.certification })}</h2>
      <p className="text-sm text-cyan-100">{t("eyebrow", { certification: r.certification, exam: r.exam, minutes: r.minutes })}</p>
      <p className="text-slate-300">{t("noteWeighted", { exam: r.exam })}</p>
      <Link href={`/final-15/${r.id}`} className="inline-block rounded-xl bg-cyan-300 px-4 py-2 font-semibold text-slate-950">{t("open", { certification: r.certification })}</Link>
    </li>)}</ul>
  </div>;
}
