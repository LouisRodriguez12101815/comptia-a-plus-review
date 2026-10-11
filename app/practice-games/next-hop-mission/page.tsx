import type { Metadata } from "next";
import { MissionPlayer } from "@/app/components/practice/MissionPlayer";
export const metadata: Metadata = { title: "Next-hop troubleshooting mission | CompTIA Review", description: "Practice, review and apply IPv4 next-hop troubleshooting to a new scenario." };
export default function NextHopMissionPage() { return <MissionPlayer />; }
