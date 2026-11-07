import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PerformanceDashboard } from "@/app/components/PerformanceDashboard";

type PerformancePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PerformancePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "performance" });
  return { title: t("metaTitle"), description: t("intro") };
}

export default async function PerformancePage({ params }: PerformancePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("performance");
  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="space-y-2">
      <p className="text-sm uppercase tracking-wide text-teal-300">{t("eyebrow")}</p>
      <h1 className="text-3xl font-semibold text-white sm:text-4xl">{t("title")}</h1>
      <p className="max-w-3xl text-slate-300">{t("intro")}</p>
    </header>
    <PerformanceDashboard />
  </div>;
}
