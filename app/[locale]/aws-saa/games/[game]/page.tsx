import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SaaMemoryGame } from "@/app/components/SaaMemoryGame";
import { SetTrackFocus } from "@/app/components/SetTrackFocus";
import { GAME_IDS, type GameId } from "@/lib/study/games";

export async function generateMetadata({ params }: PageProps<"/[locale]/aws-saa/games/[game]">): Promise<Metadata> {
  const { locale, game } = await params;
  const t = await getTranslations({ locale, namespace: "saaGames" });
  const id = GAME_IDS.find((item) => item === game);
  return { title: id ? t(`games.${id}.title`) : t("hubTitle") };
}

export default async function Page({
  params,
  searchParams,
}: PageProps<"/[locale]/aws-saa/games/[game]">) {
  const { locale, game } = await params;
  setRequestLocale(locale);
  if (!GAME_IDS.includes(game as GameId)) notFound();
  const { board } = (await searchParams) as { board?: string };
  const selected = board === "D1" || board === "D2" || board === "D3" || board === "D4" ? board : "all";
  return (
    <>
      <SetTrackFocus focus="saa-c03" />
      <SaaMemoryGame key={`${game}-${selected}`} game={game as GameId} board={selected} />
    </>
  );
}
