import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TrackHub } from "@/app/components/TrackHub";

export async function generateMetadata({ params }: PageProps<"/[locale]/core2">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tracks" });
  return {
    title: t("pageTitle", { label: t("core2.label") }),
    description: t("core2.description"),
  };
}

export default async function Core2Page({ params }: PageProps<"/[locale]/core2">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TrackHub trackId="core2" />;
}
