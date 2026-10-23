import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FactDrill } from "@/app/components/practice/FactDrill";
import { drillDecks, getDeck } from "@/lib/practice/drills";

// Ports keeps its original /practice-games/port-drill URL.
export function generateStaticParams() {
  return drillDecks.filter((d) => d.id !== "ports").map((d) => ({ deck: d.id }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/practice-games/drills/[deck]">): Promise<Metadata> {
  const { locale, deck: id } = await params;
  const deck = getDeck(id);
  if (!deck) return {};
  const t = (await getTranslations({ locale, namespace: "drillDecks" })) as unknown as (key: string) => string;
  return { title: `${t(`${deck.id}.title`)} | Certification Review`, description: t(`${deck.id}.cardBody`) };
}

export default async function DrillPage({ params }: PageProps<"/[locale]/practice-games/drills/[deck]">) {
  const { locale, deck: id } = await params;
  setRequestLocale(locale);
  if (!getDeck(id)) notFound();
  return <FactDrill deckId={id} />;
}
