import Link from "next/link";
import type { Metadata } from "next";
import { OutageOps } from "@/app/components/game/OutageOps";

export const metadata: Metadata = {
  title: "Outage Ops | CompTIA Review",
  description:
    "Practice CompTIA troubleshooting in a guided incident or a live multiplayer room.",
};

export default function GamePage() {
  return <><p className="mb-5"><Link href="/practice-games" className="text-cyan-200 underline">← Practice Games</Link></p><OutageOps /></>;
}
