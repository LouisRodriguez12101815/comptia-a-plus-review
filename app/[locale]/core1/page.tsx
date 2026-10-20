import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TrackHub } from "@/app/components/TrackHub";

export async function generateMetadata({ params }: PageProps<"/[locale]/core1">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tracks" });
  return {
    title: t("pageTitle", { label: t("core1.label") }),
    description: t("core1.description"),
  };
}

export default async function Core1Page({ params }: PageProps<"/[locale]/core1">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TrackHub trackId="core1" />;
}
