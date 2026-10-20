import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChallengePlayer } from "@/app/components/practice/ChallengePlayer";
import { challenges, getChallenge, sources } from "@/lib/practice/catalog";
export function generateStaticParams() { return challenges.map((challenge) => ({ challenge: challenge.id })); }
export async function generateMetadata({ params }: PageProps<"/[locale]/practice-games/[challenge]">): Promise<Metadata> {
  const { locale, challenge: id } = await params;
  const challenge = getChallenge(id);
  const t = await getTranslations({ locale, namespace: "challengePage" });
  return { title: t("title", { title: challenge?.title ?? t("notFound") }) };
}
export default async function ChallengePage({ params }: PageProps<"/[locale]/practice-games/[challenge]">) {
  const { locale, challenge: id } = await params;
  setRequestLocale(locale);
  const challenge = getChallenge(id);
  if (!challenge) notFound();
  return <ChallengePlayer challenge={challenge} sources={sources} />;
}
