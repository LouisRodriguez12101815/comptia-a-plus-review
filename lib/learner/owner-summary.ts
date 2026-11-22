import type { CaptureRow } from "@/lib/learner/capture";

/** Learner-facing summary. Built only from the exporter's analysis output. Never copies answer keys. */

const PROMPT_LIMIT = 140;
const SLOW_SECONDS = 180;

type ActivityRow = {
  timestamp?: string;
  eventType?: string;
  questionId?: string;
  examId?: string;
  objectiveId?: string | null;
  topicId?: string;
  isCorrect?: boolean;
  confidence?: string;
  scoringEvidence?: boolean;
  seconds?: number;
};

type ObjectiveRow = { examId: string; objectiveId: string; attempts: number; correct: number; incorrect: number };
type QuestionRow = { examId: string; questionId: string; incorrect: number; attempts: number };

export type OwnerSummary = {
  exam: string;
  days: number;
  window: { start: string; end: string };
  sittings: { at: string; correct: number; total: number; medianSeconds: number | null; slowCount: number | null; seenShare: number | null }[];
  captures: CaptureRow[];
  overall: { correct: number; total: number; accuracy: number | null };
  firstAttempt: { correct: number; total: number; accuracy: number | null };
  domains: { id: string; title: string; correct: number; total: number; accuracy: number | null }[];
  weakestTasks: { id: string; title: string; correct: number; attempts: number; accuracy: number | null }[];
  mostMissed: { questionId: string; prompt: string; incorrect: number; attempts: number }[];
  luckyGuesses: { questionId: string; prompt: string }[];
  sureButWrong: { questionId: string; prompt: string }[];
  pacing: { recorded: boolean; note: string };
  followups: string[];
  csv: string;
  markdown: string;
};

const accuracy = (correct: number, total: number) => (total > 0 ? Math.round((correct / total) * 1000) / 1000 : null);

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function shortPrompt(prompt: string | undefined) {
  const text = (prompt ?? "").replace(/\s+/g, " ").trim();
  return text.length > PROMPT_LIMIT ? `${text.slice(0, PROMPT_LIMIT - 1)}…` : text;
}

function cell(value: unknown) {
  let text = value === undefined || value === null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function ownerSummary(input: {
  exam: string;
  days: number;
  window: { start: string; end: string };
  activity: ActivityRow[];
  objectives: ObjectiveRow[];
  questions: QuestionRow[];
  prompts: Map<string, string>;
  taskTitles: Map<string, string>;
  domainsByObjective: Map<string, { id: string; title: string }>;
  followups: string[];
  firstAttempt?: { correct: number; total: number; accuracy: number | null };
  seenBySitting?: Map<string, number>;
  captures?: OwnerSummary["captures"];
}): OwnerSummary {
  const scoring = input.activity.filter((row) => row.scoringEvidence === true && row.eventType === "question_answered" && typeof row.isCorrect === "boolean");
  const sittingsMap = new Map<string, { at: string; correct: number; total: number; seconds: number[] }>();
  for (const row of scoring) {
    const at = row.timestamp ?? "";
    const sitting = sittingsMap.get(at) ?? { at, correct: 0, total: 0, seconds: [] };
    sitting.total += 1;
    if (row.isCorrect) sitting.correct += 1;
    if (typeof row.seconds === "number") sitting.seconds.push(row.seconds);
    sittingsMap.set(at, sitting);
  }
  const sittings = [...sittingsMap.values()].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)).map((sitting) => ({
    at: sitting.at,
    correct: sitting.correct,
    total: sitting.total,
    medianSeconds: sitting.seconds.length ? median(sitting.seconds) : null,
    slowCount: sitting.seconds.length ? sitting.seconds.filter((seconds) => seconds > SLOW_SECONDS).length : null,
    seenShare: input.seenBySitting?.get(sitting.at) ?? null,
  }));
  const correct = sittings.reduce((sum, sitting) => sum + sitting.correct, 0);
  const total = sittings.reduce((sum, sitting) => sum + sitting.total, 0);

  const domainMap = new Map<string, { id: string; title: string; correct: number; total: number }>();
  for (const row of scoring) {
    const domain = row.objectiveId ? input.domainsByObjective.get(`${row.examId}:${row.objectiveId}`) : undefined;
    const id = domain?.id ?? "unassigned";
    const current = domainMap.get(id) ?? { id, title: domain?.title ?? "Unassigned", correct: 0, total: 0 };
    current.total += 1;
    if (row.isCorrect) current.correct += 1;
    domainMap.set(id, current);
  }
  const domains = [...domainMap.values()]
    .map((domain) => ({ ...domain, accuracy: accuracy(domain.correct, domain.total) }))
    .sort((a, b) => (a.accuracy ?? 1) - (b.accuracy ?? 1) || a.title.localeCompare(b.title));

  const weakestTasks = input.objectives
    .filter((row) => row.examId === input.exam && row.attempts > 0)
    .map((row) => ({
      id: row.objectiveId,
      title: input.taskTitles.get(`${row.examId}:${row.objectiveId}`) ?? row.objectiveId,
      correct: row.correct,
      attempts: row.attempts,
      accuracy: accuracy(row.correct, row.attempts),
    }))
    .sort((a, b) => (a.accuracy ?? 1) - (b.accuracy ?? 1) || b.attempts - a.attempts || a.id.localeCompare(b.id))
    .slice(0, 8);

  const mostMissed = input.questions
    .filter((row) => row.examId === input.exam && row.incorrect > 0)
    .sort((a, b) => b.incorrect - a.incorrect || b.attempts - a.attempts || a.questionId.localeCompare(b.questionId))
    .slice(0, 8)
    .map((row) => ({ questionId: row.questionId, prompt: shortPrompt(input.prompts.get(row.questionId)), incorrect: row.incorrect, attempts: row.attempts }));

  const listed = (confidence: string, correctRow: boolean) => {
    const seen = new Set<string>();
    const rows = [];
    for (const row of scoring) {
      if (row.confidence !== confidence || row.isCorrect !== correctRow || !row.questionId || seen.has(row.questionId)) continue;
      seen.add(row.questionId);
      rows.push({ questionId: row.questionId, prompt: shortPrompt(input.prompts.get(row.questionId)) });
    }
    return rows;
  };

  const followups = input.followups.filter((path) => path.startsWith("/quiz?"));
  const summary: OwnerSummary = {
    exam: input.exam,
    days: input.days,
    window: input.window,
    sittings,
    captures: input.captures ?? [],
    overall: { correct, total, accuracy: accuracy(correct, total) },
    firstAttempt: input.firstAttempt ?? { correct: 0, total: 0, accuracy: null },
    domains,
    weakestTasks,
    mostMissed,
    luckyGuesses: listed("guess", true),
    sureButWrong: listed("sure", false),
    pacing: pacingOf(sittings),
    followups,
    csv: "",
    markdown: "",
  };
  summary.csv = summaryCsv(scoring);
  summary.markdown = summaryMarkdown(summary);
  return summary;
}

function pacingOf(sittings: OwnerSummary["sittings"]): OwnerSummary["pacing"] {
  const recorded = sittings.filter((sitting) => sitting.medianSeconds !== null).length;
  if (!recorded) return { recorded: false, note: "No sitting in this window recorded per-question seconds." };
  if (recorded === sittings.length) return { recorded: true, note: "Each sitting lists its median seconds and how many questions took longer than 3 minutes." };
  return { recorded: true, note: "Sittings without per-question seconds are marked not recorded. The others list a median and how many questions took longer than 3 minutes." };
}

function summaryCsv(rows: ActivityRow[]) {
  const header = ["timestamp", "examId", "questionId", "topicId", "objectiveId", "isCorrect", "confidence", "eventType"];
  const lines = rows.map((row) => header.map((key) => cell(row[key as keyof ActivityRow])).join(","));
  return `${header.join(",")}\n${lines.join("\n")}${lines.length ? "\n" : ""}`;
}

function pct(value: number | null) {
  return value === null ? "n/a" : `${Math.round(value * 100)}%`;
}

function summaryMarkdown(summary: OwnerSummary) {
  const list = (rows: string[]) => (rows.length ? rows.map((row) => `- ${row}`).join("\n") : "- None in retained evidence.");
  return `# ${summary.exam} activity\n\nWindow: ${summary.window.start} — ${summary.window.end}\n\n`
    + `## Synced tests\n\n${list(summary.captures.map((capture) => {
      const started = capture.startedAt === null ? "start not recorded" : new Date(capture.startedAt).toISOString();
      const synced = capture.sync === "before" ? "before tracking" : capture.syncedAt === null ? "not synced yet" : capture.syncedAt;
      const delay = capture.delayMs === null ? "" : ` delay ${Math.round(capture.delayMs / 1000)}s`;
      return `${capture.kind} started ${started} finished ${new Date(capture.finishedAt).toISOString()} synced ${synced}${delay}`;
    }))}\n\n`
    + `## Sittings\n\n${list(summary.sittings.map((sitting) => `${sitting.at}: ${sitting.correct}/${sitting.total}${sitting.medianSeconds === null ? " — pacing not recorded" : ` — median ${sitting.medianSeconds}s, ${sitting.slowCount} slower than 3 min`}${sitting.seenShare === null ? "" : ` — ${sitting.seenShare}% already seen`}`))}\n\n`
    + `## Overall\n\n${summary.overall.correct}/${summary.overall.total} (${pct(summary.overall.accuracy)})\n\n`
    + `## First-attempt accuracy\n\n${summary.firstAttempt.correct}/${summary.firstAttempt.total} (${pct(summary.firstAttempt.accuracy)})\n\n`
    + `## Domains\n\n${list(summary.domains.map((domain) => `${domain.title}: ${domain.correct}/${domain.total} (${pct(domain.accuracy)})`))}\n\n`
    + `## Weakest tasks\n\n${list(summary.weakestTasks.map((task) => `${task.id} ${task.title}: ${task.correct}/${task.attempts} (${pct(task.accuracy)})`))}\n\n`
    + `## Most-missed questions\n\n${list(summary.mostMissed.map((row) => `${row.questionId}: ${row.prompt} (${row.incorrect} incorrect / ${row.attempts} attempts)`))}\n\n`
    + `## Lucky guesses\n\n${list(summary.luckyGuesses.map((row) => `${row.questionId}: ${row.prompt}`))}\n\n`
    + `## Sure but wrong\n\n${list(summary.sureButWrong.map((row) => `${row.questionId}: ${row.prompt}`))}\n\n`
    + `## Pacing\n\n${summary.pacing.note}\n\n`
    + `## Follow-up quizzes\n\n${list(summary.followups)}\n`;
}

export function emptyOwnerSummary(exam: string, days: number, asOf: number): OwnerSummary {
  const end = new Date(asOf).toISOString();
  const start = new Date(asOf - days * 86_400_000).toISOString();
  return ownerSummary({
    exam, days, window: { start, end }, activity: [], objectives: [], questions: [],
    prompts: new Map(), taskTitles: new Map(), domainsByObjective: new Map(), followups: [],
  });
}
