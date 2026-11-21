import { getTranslations, setRequestLocale } from "next-intl/server";
import { EnsureTopicFocus } from "@/app/components/EnsureTopicFocus";
import { focusForTopic } from "@/lib/chapter";
import { getTopic, questions as allQuestions, topics as allTopics } from "@/lib/content";
import { getConcept } from "@/lib/concepts";
import { getDomainQuiz } from "@/lib/domain-quiz";
import { isStudyFocus } from "@/lib/exams";
import type { ExamCode } from "@/lib/types";
import { controlledQuestionIds, questionIdsFromParam } from "@/lib/controlled-question-pool";
import { QuizRunner } from "@/app/components/QuizRunner";
import { ChapterStrip } from "@/app/components/ChapterStrip";
import { SAA_CLUSTERS, selectTopicQuiz } from "@/lib/saa-test-skills";

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
  const { topic, domain: domainParam, concept: conceptParam, questions: questionIdsParam, exam: examParam, cluster: clusterParam, mode: modeParam } = (await searchParams) as { topic?: string; domain?: string; concept?: string; questions?: string | string[]; exam?: string; cluster?: string; mode?: string };
  const concept = getConcept(conceptParam);
  const domainExam: ExamCode | undefined = examParam === "saa-c03" ? "saa-c03" : examParam === "n10-009" || examParam === undefined ? "n10-009" : undefined;
  const domain = domainExam ? getDomainQuiz(domainParam, domainExam) : undefined;
  const cluster = SAA_CLUSTERS.some((item) => item.id === clusterParam) ? clusterParam : undefined;
  const twinMode = modeParam === "twin";
  const questionIds = twinMode
    ? undefined
    : cluster
      ? selectTopicQuiz(cluster, allQuestions)
      : questionIdsParam
        ? controlledQuestionIds(questionIdsFromParam(questionIdsParam), allQuestions, allTopics, isStudyFocus(examParam) ? examParam : "all")
        : undefined;
  const attemptMode = twinMode ? "twin" : cluster ? "topic" : "quiz";
  const chapter = topic && !domain && !concept ? getTopic(topic) : undefined;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">
          {concept ? t("conceptTitle", { title: concept.title }) : domain ? t("domainTitle", { id: domain.id, title: domain.title }) : t("title")}
        </h1>
        <p className="mt-2 text-slate-400">
          {concept ? (concept.rule ?? t("conceptIntro", { objective: concept.objective })) : domain ? t("domainIntro", { weight: domain.weight, exam: domainExam === "saa-c03" ? "SAA-C03" : "N10-009" }) : t("intro")}
        </p>
      </div>
      {chapter && <ChapterStrip topicId={chapter.id} current="quiz" />}
      {chapter && <EnsureTopicFocus codes={chapter.examCodes} preferred={focusForTopic(chapter)} />}
      {domain && domainExam ? <EnsureTopicFocus codes={[domainExam]} preferred={domainExam} /> : null}
      {concept ? <EnsureTopicFocus codes={["n10-009"]} preferred="n10-009" /> : null}
      {twinMode ? (
        <QuizRunner initialTopic="all" scoped attemptMode="twin" />
      ) : questionIds && questionIds.length > 0 ? (
        <QuizRunner initialTopic={topic ?? "all"} questionIds={questionIds} scoped attemptMode={attemptMode} />
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
