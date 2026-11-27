import { answeredOutcomes, type AnsweredAttempt } from "@/lib/saa-study-loop";
import type { Question } from "@/lib/types";

export const SAA_CONTRAST_GROUPS = {
  database: {
    failover: ["q-saa-practice-19", "q-saa-chapter-08"],
    readScale: ["q-saa-costbatch-013", "q-saa-core-23"],
  },
  messaging: {
    queue: ["q-saa-practice-25", "q-saa-chapter-17", "q-aws-found-26"],
    fanout: ["q-saa-chapter-19", "q-saa-guide-20"],
    routing: ["q-saa-core-35", "q-saa-guide-24"],
  },
  egress: {
    privateS3: ["q-aws-review-saa-c03-4-4", "q-aws-review-saa-c03-1-2", "q-saa-guide-06"],
    publicEgress: ["q-aws-found-19", "q-saa-bank-016"],
  },
} as const;

type Group = keyof typeof SAA_CONTRAST_GROUPS;
type Entry = { group: Group; decision: string };
const byQuestion = new Map<string, Entry>();
for (const group of Object.keys(SAA_CONTRAST_GROUPS) as Group[]) {
  for (const [decision, ids] of Object.entries(SAA_CONTRAST_GROUPS[group])) {
    for (const id of ids) byQuestion.set(id, { group, decision });
  }
}

type ContrastAttempt = AnsweredAttempt & { mode?: string; topicId?: string };
export const SAA_CONTRAST_DELAY = 3 * 24 * 60 * 60 * 1000;

export function saaContrastGroup(id: string) {
  return byQuestion.get(id)?.group;
}

export function saaContrastHref(id: string, mode: "contrast" | "delayed") {
  return `/quiz?exam=saa-c03&questions=${encodeURIComponent(id)}&review=${mode}`;
}

export function saaContrastTarget(
  source: string, bank: readonly Question[], excluded: ReadonlySet<string>, seen: ReadonlySet<string>,
  freshOnly = false,
) {
  const entry = byQuestion.get(source);
  if (!entry) return undefined;
  const eligible = new Set(bank.filter((q) => q.examCodes?.includes("saa-c03")).map((q) => q.id));
  const decisions: Record<string, readonly string[]> = SAA_CONTRAST_GROUPS[entry.group];
  const candidates = Object.entries(decisions).flatMap(([decision, ids]) =>
    ids.filter((id) => id !== source && eligible.has(id) && !excluded.has(id) && (!freshOnly || !seen.has(id)))
      .map((id) => ({ id, sameDecision: Number(decision === entry.decision), seen: Number(seen.has(id)) })),
  );
  candidates.sort((a, b) => a.seen - b.seen || a.sameDecision - b.sameDecision);
  return candidates[0]?.id;
}

export function saaContrastHistory(attempts: ContrastAttempt[], now: number, bank: readonly Question[]) {
  const pending = new Map<Group, { source: string; at: number }>();
  const seen = new Set<string>();
  const counts = { first: { correct: 0, answered: 0 }, contrast: { correct: 0, answered: 0 }, delayed: { correct: 0, answered: 0 } };
  const ordered = attempts.filter((a) => a.exam === "saa-c03" && !a.topicId?.startsWith("exam-test:") && typeof a.at === "number" && a.at <= now)
    .sort((a, b) => a.at! - b.at!);

  for (const attempt of ordered) {
    const at = attempt.at!;
    const outcomes = new Map(answeredOutcomes(attempt).map(({ id, correct }) => [id, correct]));
    for (const [id, correct] of outcomes) {
      const group = saaContrastGroup(id);
      if (!group) continue;
      const fresh = !seen.has(id);
      const previous = pending.get(group);
      const dueFresh = previous && fresh && id !== previous.source && at - previous.at >= SAA_CONTRAST_DELAY;
      const bucket = attempt.mode === "contrast" ? counts.contrast
        : attempt.mode === "delayed" ? (dueFresh ? counts.delayed : undefined)
          : fresh ? counts.first : undefined;
      if (bucket) {
        bucket.answered += 1;
        if (correct) bucket.correct += 1;
      }
      if (!correct) {
        // A new miss starts the review window, including a miss on a delayed check.
        pending.set(group, { source: id, at });
      } else if (dueFresh && attempt.mode !== "contrast") {
        pending.delete(group);
      }
    }
    for (const id of attempt.questionIds ?? []) seen.add(id);
    for (const id of outcomes.keys()) seen.add(id);
  }

  const due = [...pending].flatMap(([group, { source, at }]) => {
    if (now - at < SAA_CONTRAST_DELAY) return [];
    const id = saaContrastTarget(source, bank, seen, seen, true);
    return id ? [{ group, id }] : [];
  });
  return { due, counts };
}

export type SaaDebriefRow = {
  id: string;
  objectiveId: string;
  answered: boolean;
  correct: boolean;
  confidence?: string;
};

export function saaMockDebrief(rows: SaaDebriefRow[], seenAtStart: ReadonlySet<string>) {
  const incorrect = rows.filter((row) => row.answered && !row.correct);
  const byObjective = new Map<string, number>();
  for (const row of incorrect) byObjective.set(row.objectiveId, (byObjective.get(row.objectiveId) ?? 0) + 1);
  return {
    fresh: rows.filter((row) => !seenAtStart.has(row.id)).length,
    unanswered: rows.filter((row) => !row.answered).length,
    confidentMisses: incorrect.filter((row) => row.confidence === "sure").length,
    uncertainCorrect: rows.filter((row) => row.correct && (row.confidence === "guess" || row.confidence === "unsure")).length,
    priorities: [...byObjective].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
  };
}
