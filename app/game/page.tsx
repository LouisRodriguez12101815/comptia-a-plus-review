import type { Metadata } from "next";
import { OutageOps } from "@/app/components/game/OutageOps";

export const metadata: Metadata = {
  title: "Outage Ops | CompTIA Review",
  description:
    "Practice CompTIA troubleshooting in a guided incident or a live multiplayer room.",
};

export default function GamePage() {
  return <OutageOps />;
}
