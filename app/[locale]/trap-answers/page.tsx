import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { finalReviews } from "@/lib/practice/finalReview";

export async function generateMetadata({ params }: PageProps<"/[locale]/trap-answers">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "trapAnswers" });
  return { title: t("metaTitle"), description: t("intro") };
}

export default async function TrapAnswersPage({ params }: PageProps<"/[locale]/trap-answers">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "trapAnswers" });
  return <div className="mx-auto max-w-3xl space-y-6">
    <header className="space-y-2">
      <h1 className="text-4xl font-bold">{t("title")}</h1>
      <p className="text-slate-300">{t("intro")}</p>
    </header>
    {finalReviews.filter((r) => r.traps.length > 0).map((review) => <section key={review.id} className="space-y-3 rounded-2xl border border-slate-700 bg-slate-900 p-5">
      <h2 className="text-xl font-semibold">{review.certification} <span className="text-sm font-normal text-cyan-100">{review.exam}</span></h2>
      <ul className="space-y-2">{review.traps.map((trap) => <li key={trap.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm leading-relaxed">
        <span className="font-semibold text-white">{trap.prompt}:</span>{" "}
        <span className="text-emerald-300">{trap.answer}</span>{" "}
        <span className="text-slate-400">{t("notLabel")} {trap.wrong.join(", ")}.</span>{" "}
        <span className="text-cyan-100">{trap.hook}</span>
      </li>)}</ul>
      <Link href={`/final-15/${review.id}`} className="inline-flex min-h-11 items-center text-cyan-200 underline">{t("practiceLink", { certification: review.certification })}</Link>
    </section>)}
  </div>;
}
