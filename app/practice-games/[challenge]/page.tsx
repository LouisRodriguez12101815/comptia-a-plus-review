import { notFound } from "next/navigation";
import { ChallengePlayer } from "@/app/components/practice/ChallengePlayer";
import { challenges, getChallenge, sources } from "@/lib/practice/catalog";
export function generateStaticParams() { return challenges.map((challenge) => ({ challenge: challenge.id })); }
export async function generateMetadata({ params }: { params: Promise<{ challenge: string }> }) {
  const challenge = getChallenge((await params).challenge);
  return { title: `${challenge?.title ?? "Challenge not found"} | CompTIA Review` };
}
export default async function ChallengePage({ params }: { params: Promise<{ challenge: string }> }) {
  const challenge = getChallenge((await params).challenge);
  if (!challenge) notFound();
  return <ChallengePlayer challenge={challenge} sources={sources} />;
}
