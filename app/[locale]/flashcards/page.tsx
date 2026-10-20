import { getTranslations, setRequestLocale } from "next-intl/server";
import { EnsureTopicFocus } from "@/app/components/EnsureTopicFocus";
import { focusForTopic } from "@/lib/chapter";
import { getTopic } from "@/lib/content";
import { MissionReturnLink } from "@/app/components/practice/MissionReturnLink";
import { FlashcardDeck } from "@/app/components/FlashcardDeck";
import { ChapterStrip } from "@/app/components/ChapterStrip";

export async function generateMetadata({ params }: PageProps<"/[locale]/flashcards">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "flashcardsPage" });
  return { title: t("metaTitle") };
}

export default async function FlashcardsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/flashcards">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("flashcardsPage");
  const { topic } = (await searchParams) as { topic?: string };
  const chapter = topic ? getTopic(topic) : undefined;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">{t("title")}</h1>
        <p className="mt-2 text-slate-400">
          {t("intro")}
        </p>
      </div>
      {chapter && <ChapterStrip topicId={chapter.id} current="flashcards" />}
      {topic === "n10-ch9" && <MissionReturnLink />}
      {chapter && <EnsureTopicFocus codes={chapter.examCodes} preferred={focusForTopic(chapter)} />}
      <FlashcardDeck initialTopic={topic ?? "all"} />
    </div>
  );
}
