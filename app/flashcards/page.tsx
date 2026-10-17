import { EnsureTopicFocus } from "@/app/components/EnsureTopicFocus";
import { focusForTopic } from "@/lib/chapter";
import { getTopic } from "@/lib/content";
import { MissionReturnLink } from "@/app/components/practice/MissionReturnLink";
import { FlashcardDeck } from "@/app/components/FlashcardDeck";

export const metadata = { title: "Flashcards | CompTIA Review" };

export default async function FlashcardsPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  const chapter = topic ? getTopic(topic) : undefined;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Flashcards</h1>
        <p className="mt-2 text-slate-400">
          Flip a card, then rate how well you knew it: Again, Hard, Good, or Easy. Choose
          Due for review to study only the cards scheduled for today. Your exam focus and
          progress are saved in this browser only.
        </p>
      </div>
      {topic === "n10-ch9" && <MissionReturnLink />}
      {chapter && <EnsureTopicFocus codes={chapter.examCodes} preferred={focusForTopic(chapter)} />}
      <FlashcardDeck initialTopic={topic ?? "all"} />
    </div>
  );
}
