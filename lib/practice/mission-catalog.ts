import data from "../../content/next-hop-mission.json" with { type: "json" };
import type { Mission } from "@/lib/practice/mission";
export const nextHopMission = data as Mission;
