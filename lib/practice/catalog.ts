import catalog from "../../content/practice-games.json" with { type: "json" };
import type { Challenge, Source } from "@/lib/practice/types";
export const challenges = catalog.challenges as Challenge[];
export const sources = catalog.sources as Source[];
export const getChallenge = (id: string) => challenges.find((challenge) => challenge.id === id);
