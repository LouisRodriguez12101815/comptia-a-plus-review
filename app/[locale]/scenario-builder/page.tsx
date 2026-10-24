import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ScenarioBuilder } from "@/app/components/practice/ScenarioBuilder";

export async function generateMetadata({ params }: PageProps<"/[locale]/scenario-builder">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "scenarioBuilder" });
  return { title: t("metaTitle"), description: t("intro") };
}

export default async function ScenarioBuilderPage({ params }: PageProps<"/[locale]/scenario-builder">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("scenarioBuilder");
  return <div className="mx-auto max-w-3xl space-y-6">
    <header className="space-y-2">
      <p className="text-sm uppercase tracking-wide text-teal-300">{t("eyebrow")}</p>
      <h1 className="text-3xl font-semibold text-white sm:text-4xl">{t("title")}</h1>
      <p className="text-slate-300">{t("intro")}</p>
    </header>
    <ScenarioBuilder />
  </div>;
}
