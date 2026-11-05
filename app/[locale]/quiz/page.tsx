import { getTranslations, setRequestLocale } from "next-intl/server";
import { EnsureTopicFocus } from "@/app/components/EnsureTopicFocus";
import { focusForTopic } from "@/lib/chapter";
import { getTopic } from "@/lib/content";
import { getConcept } from "@/lib/concepts";
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
  const { topic, domain: domainParam, concept: conceptParam } = (await searchParams) as { topic?: string; domain?: string; concept?: string };
  const concept = getConcept(conceptParam);
  const domain = getDomainQuiz(domainParam);
  const chapter = topic && !domain && !concept ? getTopic(topic) : undefined;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">
          {concept ? t("conceptTitle", { title: concept.title }) : domain ? t("domainTitle", { id: domain.id, title: domain.title }) : t("title")}
        </h1>
        <p className="mt-2 text-slate-400">
          {concept ? (concept.rule ?? t("conceptIntro", { objective: concept.objective })) : domain ? t("domainIntro", { weight: domain.weight }) : t("intro")}
        </p>
      </div>
      {chapter && <ChapterStrip topicId={chapter.id} current="quiz" />}
      {chapter && <EnsureTopicFocus codes={chapter.examCodes} preferred={focusForTopic(chapter)} />}
      {(domain || concept) && <EnsureTopicFocus codes={["n10-009"]} preferred="n10-009" />}
      {concept ? (
        <QuizRunner initialTopic="all" questionIds={concept.questionIds} scoped />
      ) : domain ? (
        <QuizRunner initialTopic="all" questionIds={domain.questionIds} scoped />
      ) : (
        <QuizRunner initialTopic={topic ?? "all"} />
      )}
    </div>
  );
}
