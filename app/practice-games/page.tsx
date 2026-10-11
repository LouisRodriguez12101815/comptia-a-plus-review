import type { Metadata } from "next";
import { ChallengeCatalog } from "@/app/components/practice/ChallengeCatalog";
import { challenges } from "@/lib/practice/catalog";
export const metadata: Metadata = { title: "Practice Games | CompTIA Review", description: "Solo component matching and IPv4 packet journeys, plus Outage Ops troubleshooting." };
export default function PracticeGamesPage() { return <ChallengeCatalog challenges={challenges} />; }
