import { getTranslations, setRequestLocale } from "next-intl/server";
import { EnsureTopicFocus } from "@/app/components/EnsureTopicFocus";
import { focusForTopic } from "@/lib/chapter";
import { getTopic } from "@/lib/content";
import { MissionReturnLink } from "@/app/components/practice/MissionReturnLink";
import { FlashcardDeck } from "@/app/components/FlashcardDeck";
import { ChapterStrip } from "@/app/components/ChapterStrip";
import { resolveExamParam } from "@/lib/exam-route";
import { Link } from "@/i18n/navigation";

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
  const { topic, exam, task, mode } = (await searchParams) as { topic?: string; exam?: string; task?: string; mode?: string };
  const resolution = resolveExamParam(exam);
  const errors = await getTranslations("quizPage");
  if (resolution.kind === "invalid") return <div className="space-y-4"><h1 className="text-3xl font-semibold text-white">{errors("unavailableTitle")}</h1><p className="text-slate-300">{errors("unavailableBody")}</p><Link href="/certifications" className="text-teal-300 underline">{errors("availableTracks")}</Link></div>;
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
      <FlashcardDeck key={JSON.stringify([topic, exam, task, mode])} initialTopic={topic ?? "all"} initialExam={resolution.kind === "valid" ? resolution.focus : undefined} initialTask={task} initialMode={mode} />
    </div>
  );
}
