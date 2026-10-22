import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { topFives } from "@/lib/study/topFive";

export async function generateMetadata({ params }: PageProps<"/[locale]/top-5">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "topFive" });
  return { title: t("indexMetaTitle"), description: t("indexIntro") };
}

export default async function TopFiveIndex({ params }: PageProps<"/[locale]/top-5">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "topFive" });
  return <div className="mx-auto max-w-3xl space-y-5">
    <header className="space-y-2">
      <h1 className="text-4xl font-bold">{t("indexTitle")}</h1>
      <p className="text-slate-300">{t("indexIntro")}</p>
    </header>
    <ul className="grid gap-4 sm:grid-cols-2">{topFives.map((top) => <li key={top.id} className="space-y-3 rounded-2xl border border-cyan-300/30 bg-slate-900 p-5">
      <h2 className="text-2xl font-semibold">{t("title", { certification: top.certification })}</h2>
      <p className="text-sm text-cyan-100">{t("eyebrow", { certification: top.certification, exam: top.exam })}</p>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-300">{top.concepts.map((c) => <li key={c.id}>{c.title}</li>)}</ol>
      <Link href={`/top-5/${top.id}`} className="inline-block rounded-xl bg-cyan-300 px-4 py-2 font-semibold text-slate-950">{t("open", { certification: top.certification })}</Link>
    </li>)}</ul>
  </div>;
}
