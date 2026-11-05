import type { Progress } from "@/lib/progress";
import type { ConceptVideo } from "@/lib/concept-videos";
import type { VisualItem } from "@/lib/visuals";
import type { Question } from "@/lib/types";
import { n10ClusterQuestionIds, n10RemediationForQuestion } from "@/lib/n10-remediation";

export type MissedQuestion = {
  question: Question;
  misses: number;
  latestMissAt: number;
  selectedChoice?: number;
};

export type Remediation = MissedQuestion & {
  topicTitle: string;
  video?: ConceptVideo;
  visual?: VisualItem;
  notesHref: string;
  clusterId: string;
  clusterKey: string;
  clusterLabel?: string;
  examClueKey?: string;
  memoryRuleKey?: string;
  whyWrongKey?: string;
  selectedAnswer?: string;
  retryQuestionIds: string[];
};

type Attempt = {
  questionIds?: string[];
  missedIds?: string[];
  at?: number;
  wrongChoices?: Record<string, number>;
};

function attemptsFrom(progress: Progress): Attempt[] {
  return [...(progress.quizAttempts ?? []), ...(progress.mockAttempts ?? [])];
}
/** Rank real learner misses, preferring repeated misses and then recent misses. */
export function rankMissedQuestions(
  progress: Progress,
  questions: Question[],
): MissedQuestion[] {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const counts = new Map<string, { misses: number; latestMissAt: number; selectedChoice?: number; selectedAt?: number }>();

  for (const attempt of attemptsFrom(progress)) {
    const shown = new Set(attempt.questionIds ?? []);
    const at = Number.isFinite(attempt.at) ? attempt.at ?? 0 : 0;
    for (const id of new Set(attempt.missedIds ?? [])) {
      if (shown.size > 0 && !shown.has(id)) continue;
      if (!byId.has(id)) continue;
      const previous = counts.get(id) ?? { misses: 0, latestMissAt: 0 };
      const selectedChoice = attempt.wrongChoices?.[id];
      counts.set(id, {
        misses: previous.misses + 1,
        latestMissAt: Math.max(previous.latestMissAt, at),
        selectedChoice: Number.isInteger(selectedChoice) && (previous.selectedAt ?? -1) <= at
          ? selectedChoice
          : previous.selectedChoice,
        selectedAt: Number.isInteger(selectedChoice) && (previous.selectedAt ?? -1) <= at
          ? at
          : previous.selectedAt,
      });
    }
  }

  return [...counts.entries()]
    .map(([id, result]) => ({ question: byId.get(id)!, misses: result.misses, latestMissAt: result.latestMissAt, selectedChoice: result.selectedChoice }))
    .sort(
      (a, b) =>
        b.misses - a.misses ||
        b.latestMissAt - a.latestMissAt ||
        a.question.id.localeCompare(b.question.id),
    );
}
export function missedQuestionIds(
  progress: Progress,
  questions: Question[],
  limit?: number,
): string[] {
  const ranked = rankMissedQuestions(progress, questions);
  return (limit === undefined ? ranked : ranked.slice(0, limit)).map(
    ({ question }) => question.id,
  );
}

/** Exact question matches win; topic matches retain the authored registry order. */
export function videoForQuestion(
  question: Question,
  videos: ConceptVideo[] = [],
): ConceptVideo | undefined {
  return (
    videos.find((video) => video.questionId === question.id) ??
    videos.find((video) => video.topicId === question.topicId)
  );
}

/** Topic lookup is deliberately one visual, leaving room for future exact question mappings. */
export function visualForQuestion(
  question: Question,
  visualsForTopic: (topicId: string) => VisualItem[] = () => [],
): VisualItem | undefined {
  return visualsForTopic(question.topicId)[0];
}

export function remediationForQuestion(
  missed: MissedQuestion,
  options: {
    videos?: ConceptVideo[];
    visualsForTopic?: (topicId: string) => VisualItem[];
    topicTitleFor?: (topicId: string) => string | undefined;
    questions?: Question[];
  } = {},
): Remediation {
  const { question } = missed;
  const authored = question.examCodes?.includes("n10-009") || question.topicId.startsWith("n10-")
    ? n10RemediationForQuestion(question.id)
    : undefined;
  const clusterId = authored?.clusterId ?? `topic:${question.topicId}`;
  const clusterKey = authored?.clusterKey ?? `topic:${question.topicId}`;
  return {
    ...missed,
    topicTitle: options.topicTitleFor?.(question.topicId) ?? question.topicId,
    video: videoForQuestion(question, options.videos),
    visual: visualForQuestion(question, options.visualsForTopic),
    notesHref: `/notes/${question.topicId}`,
    clusterId,
    clusterKey,
    clusterLabel: authored ? undefined : options.topicTitleFor?.(question.topicId) ?? question.topicId,
    examClueKey: authored?.examClueKey,
    memoryRuleKey: authored?.memoryRuleKey,
    whyWrongKey: authored?.whyWrongKey,
    selectedAnswer: missed.selectedChoice === undefined ? undefined : question.choices[missed.selectedChoice],
    retryQuestionIds: authored && options.questions
      ? n10ClusterQuestionIds(authored.clusterId, options.questions, question.id)
      : [],
  };
}

export type MissedCluster = {
  clusterId: string;
  clusterKey: string;
  clusterLabel?: string;
  misses: number;
  latestMissAt: number;
};

export function rankMissedClusters(remediation: Remediation[], limit = 4): MissedCluster[] {
  const clusters = new Map<string, MissedCluster>();
  for (const item of remediation) {
    const previous = clusters.get(item.clusterId) ?? {
      clusterId: item.clusterId,
      clusterKey: item.clusterKey,
      clusterLabel: item.clusterLabel,
      misses: 0,
      latestMissAt: 0,
    };
    clusters.set(item.clusterId, {
      ...previous,
      misses: previous.misses + item.misses,
      latestMissAt: Math.max(previous.latestMissAt, item.latestMissAt),
    });
  }
  return [...clusters.values()]
    .sort((a, b) => b.misses - a.misses || b.latestMissAt - a.latestMissAt || a.clusterId.localeCompare(b.clusterId))
    .slice(0, limit);
}
