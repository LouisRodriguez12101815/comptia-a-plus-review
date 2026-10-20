import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TrackHub } from "@/app/components/TrackHub";

export async function generateMetadata({ params }: PageProps<"/[locale]/networking">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tracks" });
  return {
    title: t("pageTitle", { label: t("networking.label") }),
    description: t("networking.description"),
  };
}

export default async function NetworkingPage({ params }: PageProps<"/[locale]/networking">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TrackHub trackId="networking" />;
}
