import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FactDrill } from "@/app/components/practice/FactDrill";

export async function generateMetadata({ params }: PageProps<"/[locale]/practice-games/port-drill">): Promise<Metadata> {
  const { locale } = await params;
  const t = (await getTranslations({ locale, namespace: "drillDecks" })) as unknown as (key: string) => string;
  return { title: `${t("ports.title")} | Certification Review`, description: t("ports.cardBody") };
}

export default async function PortDrillPage({ params }: PageProps<"/[locale]/practice-games/port-drill">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FactDrill deckId="ports" />;
}
