import { drillDecks } from "@/lib/practice/drills";

export type GlossaryEntry = {
  id: string;
  term: string;
  meaning: string;
  exam: string;
};

/*
 * Glossary terms come from the term and acronym decks already in the drills.
 * An item counts as a term when it has an "acronym" or "term" field plus a
 * "meaning" field. Each entry keeps the exam of the deck it came from.
 */
function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const glossaryEntries: GlossaryEntry[] = drillDecks
  .flatMap((deck) =>
    deck.items
      .map((item) => {
        const term = item.fields.acronym ?? item.fields.term;
        const meaning = item.fields.meaning;
        if (!term || !meaning) return null;
        return { id: `${deck.id}-${slug(term)}`, term, meaning, exam: deck.exam };
      })
      .filter((entry): entry is GlossaryEntry => entry !== null),
  )
  .sort((a, b) => a.term.localeCompare(b.term, "en", { sensitivity: "base" }));
