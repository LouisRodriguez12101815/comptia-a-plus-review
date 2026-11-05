import { getTranslations, setRequestLocale } from "next-intl/server";
import { EnsureTopicFocus } from "@/app/components/EnsureTopicFocus";
import { focusForTopic } from "@/lib/chapter";
import { getTopic } from "@/lib/content";
import { getDomainQuiz } from "@/lib/domain-quiz";
import { QuizRunner } from "@/app/components/QuizRunner";
import { ChapterStrip } from "@/app/components/ChapterStrip";

export async function generateMetadata({ params }: PageProps<"/[locale]/quiz">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "quizPage" });
  return { title: t("metaTitle") };
}

export default async function QuizPage({
  params,
  searchParams,
}: PageProps<"/[locale]/quiz">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("quizPage");
  const { topic, domain: domainParam } = (await searchParams) as { topic?: string; domain?: string };
  const domain = getDomainQuiz(domainParam);
  const chapter = topic && !domain ? getTopic(topic) : undefined;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">
          {domain ? t("domainTitle", { id: domain.id, title: domain.title }) : t("title")}
        </h1>
        <p className="mt-2 text-slate-400">
          {domain ? t("domainIntro", { weight: domain.weight }) : t("intro")}
        </p>
      </div>
      {chapter && <ChapterStrip topicId={chapter.id} current="quiz" />}
      {chapter && <EnsureTopicFocus codes={chapter.examCodes} preferred={focusForTopic(chapter)} />}
      {domain && <EnsureTopicFocus codes={["n10-009"]} preferred="n10-009" />}
      {domain ? (
        <QuizRunner initialTopic="all" questionIds={domain.questionIds} scoped />
      ) : (
        <QuizRunner initialTopic={topic ?? "all"} />
      )}
    </div>
  );
}
