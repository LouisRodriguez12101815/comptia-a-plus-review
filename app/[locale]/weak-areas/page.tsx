import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WeakAreas } from "@/app/components/WeakAreas";

export async function generateMetadata({ params }: PageProps<"/[locale]/weak-areas">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "weakAreas" });
  return { title: t("metaTitle"), description: t("intro") };
}

export default async function WeakAreasPage({ params }: PageProps<"/[locale]/weak-areas">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("weakAreas");
  return <div className="space-y-6">
    <header className="space-y-2">
      <p className="text-sm uppercase tracking-wide text-teal-300">{t("eyebrow")}</p>
      <h1 className="text-3xl font-semibold text-white sm:text-4xl">{t("title")}</h1>
      <p className="max-w-3xl text-slate-300">{t("intro")}</p>
    </header>
    <WeakAreas />
  </div>;
}
