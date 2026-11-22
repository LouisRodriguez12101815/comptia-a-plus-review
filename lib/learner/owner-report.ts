import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { firstAttemptSummary, mockSeenByTimestamp } from "@/lib/attempt-metrics";
import { collectActivity, storedProgress } from "../../scripts/lib/learner-activity-data.mjs";
import { analyzeActivity, buildFollowup } from "../../scripts/lib/learner-activity-plan.mjs";
import { emptyOwnerSummary, ownerSummary } from "@/lib/learner/owner-summary";

type ExamFile = {
  exams?: { code: string; domains?: { id: string; title: string; objectives?: { id: string; title?: string }[] }[] }[];
};

type StudyContent = {
  questions: { id: string; prompt?: string }[];
  topics: unknown[];
  objectives: ExamFile;
  concepts: unknown;
};

export async function loadStudyContent(root = process.cwd()): Promise<StudyContent> {
  const read = async (name: string) => JSON.parse(await readFile(resolve(root, "content", `${name}.json`), "utf8")) as unknown;
  const [questions, topics, networkTopics, objectives, concepts] = await Promise.all(
    ["questions", "topics", "topics-network-plus", "objectives", "network-plus-concepts"].map(read),
  );
  return {
    questions: questions as StudyContent["questions"],
    topics: [...(topics as unknown[]), ...(networkTopics as unknown[])],
    objectives: objectives as ExamFile,
    concepts,
  };
}

/** Runs the existing exporter analysis and returns only the learner-facing summary. */
export function summarizeItems(items: { key: string; data?: unknown }[], content: StudyContent, opts: { exam: string; days: number; asOf: number }) {
  if (!items.length) return emptyOwnerSummary(opts.exam, opts.days, opts.asOf);
  const activity = collectActivity(items, content, opts);
  const analysis = analyzeActivity(activity);
  const quiz = buildFollowup(analysis, content, { quizSize: 25, exam: opts.exam } as { quizSize: number });
  const prompts = new Map(content.questions.map((question) => [question.id, question.prompt ?? ""]));
  const taskTitles = new Map<string, string>();
  const domainsByObjective = new Map<string, { id: string; title: string }>();
  for (const exam of content.objectives.exams ?? []) {
    for (const domain of exam.domains ?? []) {
      for (const objective of domain.objectives ?? []) {
        taskTitles.set(`${exam.code}:${objective.id}`, objective.title ?? objective.id);
        domainsByObjective.set(`${exam.code}:${objective.id}`, { id: domain.id, title: domain.title });
      }
    }
  }
  const followups = (quiz.plans ?? []).flatMap((plan: { learnerQuizPaths?: string[] }) => plan.learnerQuizPaths ?? []);
  const progress = storedProgress(items);
  const start = Date.parse(activity.window.start);
  const end = Date.parse(activity.window.end);
  return ownerSummary({
    exam: opts.exam,
    days: opts.days,
    window: activity.window,
    activity: activity.activity,
    objectives: analysis.objectives,
    questions: analysis.questions,
    prompts,
    taskTitles,
    domainsByObjective,
    followups,
    firstAttempt: firstAttemptSummary(progress, opts.exam, start, end),
    seenBySitting: mockSeenByTimestamp(progress, opts.exam, start, end),
  });
}
