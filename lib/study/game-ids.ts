/** The SAA memory-game registry. Hub chips and routes both read this list. */
export const GAME_IDS = [
  "sorter",
  "ladder",
  "odd",
  "builder",
  "keyword",
  "pillars",
  "concentration",
  "lightning",
  "daily",
] as const;

export type GameId = (typeof GAME_IDS)[number];
