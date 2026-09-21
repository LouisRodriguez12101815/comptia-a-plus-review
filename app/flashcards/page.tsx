import { FlashcardDeck } from "@/app/components/FlashcardDeck";

export default async function FlashcardsPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Flashcards</h1>
        <p className="mt-2 text-slate-400">
          Flip a card, then mark known or still learning. Your exam focus and status are
          saved in this browser only.
        </p>
      </div>
      <FlashcardDeck initialTopic={topic ?? "all"} />
    </div>
  );
}
