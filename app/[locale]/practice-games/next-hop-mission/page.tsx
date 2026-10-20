import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MissionPlayer } from "@/app/components/practice/MissionPlayer";

export async function generateMetadata({ params }: PageProps<"/[locale]/practice-games/next-hop-mission">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nextHopMissionPage" });
  return { title: t("title"), description: t("description") };
}

export default async function NextHopMissionPage({ params }: PageProps<"/[locale]/practice-games/next-hop-mission">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MissionPlayer />;
}
