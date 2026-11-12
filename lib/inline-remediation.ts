import type { ConceptVideo } from "@/lib/concept-videos";
import type { ExamCode, Flashcard, Question } from "@/lib/types";
import { awsClfRemediation, isClfOnlyQuestion } from "@/lib/aws-clf-remediation";
import type { VisualItem } from "@/lib/visuals";
import { remediationForQuestion } from "@/lib/weak-areas";

export type InlineRemediation = {
  whyWrongKey?: string;
  examClueKey?: string;
  memoryRuleKey?: string;
  priorMisses: number;
  flashcards: Flashcard[];
  video?: ConceptVideo;
  visual?: VisualItem;
  notesHref: string;
  retryQuestionIds: string[];
  retryExam?: ExamCode;
};

export function selectInlineRemediation(
  question: Question,
  options: {
    selectedChoice?: number;
    priorMisses?: number;
    flashcards?: Flashcard[];
    videos?: ConceptVideo[];
    visualsForTopic?: (topicId: string) => VisualItem[];
    questions?: Question[];
  } = {},
): InlineRemediation {
  const priorMisses = options.priorMisses ?? 0;
  const remediation = remediationForQuestion(
    { question, misses: priorMisses + 1, latestMissAt: 0, selectedChoice: options.selectedChoice },
    {
      videos: options.videos,
      visualsForTopic: options.visualsForTopic,
      questions: options.questions,
    },
  );
  const aws = awsClfRemediation(question);
  const flashcards = (options.flashcards ?? [])
    .filter((card) => isClfOnlyQuestion(question)
      ? aws !== undefined && card.id === aws.cardId && card.examCodes?.includes("clf-c02")
      : card.topicId === question.topicId)
    .slice(0, priorMisses > 0 ? 3 : 1);

  return {
    whyWrongKey: remediation.whyWrongKey,
    examClueKey: remediation.examClueKey,
    memoryRuleKey: remediation.memoryRuleKey,
    priorMisses,
    flashcards,
    video: remediation.video,
    visual: remediation.visual,
    notesHref: remediation.notesHref,
    retryQuestionIds: remediation.retryQuestionIds,
    retryExam: remediation.retryExam,
  };
}
