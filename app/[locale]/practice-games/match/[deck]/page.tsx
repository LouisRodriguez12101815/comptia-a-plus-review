import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MatchGame } from "@/app/components/practice/MatchGame";
import { drillDecks, getDeck, itemsForMode } from "@/lib/practice/drills";

// Only decks with enough items for at least one full round get a matching game.
export function generateStaticParams() {
  return drillDecks
    .filter((d) => itemsForMode(d, d.modes[0]).length >= 4)
    .map((d) => ({ deck: d.id }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/practice-games/match/[deck]">): Promise<Metadata> {
  const { locale, deck: id } = await params;
  const deck = getDeck(id);
  if (!deck) return {};
  const t = (await getTranslations({ locale, namespace: "drillDecks" })) as unknown as (key: string) => string;
  return { title: `${t(`${deck.id}.title`)} matching | Certification Review`, description: t(`${deck.id}.cardBody`) };
}

export default async function MatchPage({ params }: PageProps<"/[locale]/practice-games/match/[deck]">) {
  const { locale, deck: id } = await params;
  setRequestLocale(locale);
  const deck = getDeck(id);
  if (!deck || itemsForMode(deck, deck.modes[0]).length < 4) notFound();
  return <MatchGame deckId={id} />;
}
