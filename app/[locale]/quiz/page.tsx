import { getTranslations, setRequestLocale } from "next-intl/server";
import { EnsureTopicFocus } from "@/app/components/EnsureTopicFocus";
import { focusForTopic } from "@/lib/chapter";
import { getTopic, questions as allQuestions, topics as allTopics } from "@/lib/content";
import { getConcept } from "@/lib/concepts";
import { getDomainQuiz } from "@/lib/domain-quiz";
import { isExamCode, isStudyFocus } from "@/lib/exams";
import { controlledQuestionIds, questionIdsFromParam } from "@/lib/controlled-question-pool";
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
  const { topic, domain: domainParam, concept: conceptParam, questions: questionIdsParam, exam: examParam } = (await searchParams) as { topic?: string; domain?: string; concept?: string; questions?: string | string[]; exam?: string };
  const concept = getConcept(conceptParam);
  const domain = getDomainQuiz(domainParam);
  const questionIds = questionIdsParam
    ? controlledQuestionIds(questionIdsFromParam(questionIdsParam), allQuestions, allTopics, isStudyFocus(examParam) ? examParam : "all")
    : undefined;
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
      {questionIds !== undefined ? (
        <QuizRunner initialTopic={topic ?? "all"} questionIds={questionIds} scoped scopedExam={isExamCode(examParam) ? examParam : undefined} />
      ) : concept ? (
        <QuizRunner initialTopic="all" questionIds={concept.questionIds} scoped />
      ) : domain ? (
        <QuizRunner initialTopic="all" questionIds={domain.questionIds} scoped />
      ) : (
        <QuizRunner initialTopic={topic ?? "all"} />
      )}
    </div>
  );
}
