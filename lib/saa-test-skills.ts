import { allocateByWeight, freshFirstIds } from "@/lib/exam-test.mjs";
import type { Question } from "@/lib/types";
import { qualifierTwins, type QualifierTwin } from "@/content/saa-qualifier-twins";

export const SAA_MINI_QUESTIONS = 20;
export const SAA_MINI_SECONDS = 40 * 60;
export const SAA_TOPIC_QUESTIONS = 15;
/** SAA-C03 published pace: 130 minutes / 65 questions. */
export const SAA_PACE_SECONDS = 120;
/** Review flags a question that took longer than this. */
export const SAA_SLOW_SECONDS = 180;

export type ConfidenceLevel = "sure" | "unsure" | "guess";
export type MissReason = "qualifier" | "confused" | "unknown" | "time";
export type AttemptMode = "quiz" | "mock" | "mini" | "topic" | "twin" | "contrast" | "delayed";

export const MISS_REASONS: MissReason[] = ["qualifier", "confused", "unknown", "time"];
export const ATTEMPT_MODES: AttemptMode[] = ["quiz", "mock", "mini", "topic", "twin", "contrast", "delayed"];
export const CSV_COLUMNS = [
  "learner_id", "exam", "domain", "task", "question_id", "correct", "seconds",
  "confidence", "miss_reason", "sitting_id", "mode", "date",
] as const;

export type ReasonTool = { reason: MissReason; href: string };

export function isLuckyGuess(level: ConfidenceLevel | undefined, correct: boolean): boolean {
  return correct && (level === "unsure" || level === "guess");
}

export function isSlowAnswer(seconds: number | undefined): boolean {
  return typeof seconds === "number" && seconds > SAA_SLOW_SECONDS;
}

/** Official SAA domain weights applied to a 20-question mini-mock. */
export function miniMockQuota(domains: { id: string; weight: number; available: number }[]): Record<string, number> {
  return allocateByWeight(domains as Parameters<typeof allocateByWeight>[0], SAA_MINI_QUESTIONS);
}

export function mostCommonMissReason(attempts: { missReasons?: Record<string, string> }[]): MissReason | null {
  const counts = new Map<MissReason, number>();
  for (const attempt of attempts) {
    for (const reason of Object.values(attempt.missReasons ?? {})) {
      if (!MISS_REASONS.includes(reason as MissReason)) continue;
      const key = reason as MissReason;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  let best: MissReason | null = null;
  let bestCount = 0;
  for (const reason of MISS_REASONS) {
    const count = counts.get(reason) ?? 0;
    if (count > bestCount) {
      best = reason;
      bestCount = count;
    }
  }
  return best;
}

export function reasonTools(taskId?: string): ReasonTool[] {
  const task = taskId && /^\d\.\d$/.test(taskId) ? taskId : "";
  return [
    { reason: "qualifier", href: "/aws-saa/games/keyword" },
    { reason: "confused", href: "/practice-games/drills/aws-saa-confusion-pairs" },
    { reason: "unknown", href: task ? `/flashcards?exam=saa-c03&task=${task}&mode=flip` : "/flashcards?exam=saa-c03" },
    { reason: "time", href: "/practice-games/drills/aws-saa-resilient-cues?session=speed" },
  ];
}

const CLUSTER_DEFS: { id: string; title: string; pattern: RegExp; exclude?: RegExp }[] = [
  { id: "1", title: "IAM, roles, STS, Identity Center, SCPs", pattern: /\bIAM\b|Identity Center|AWS STS|\bSTS\b|service control policy|\bSCPs?\b|permission boundary/i },
  { id: "2", title: "S3", pattern: /\bS3\b|Simple Storage Service/i },
  { id: "3", title: "VPC", pattern: /\bVPC\b|NAT gateway|security group|network ACL|Transit Gateway|VPC peering|private subnet/i },
  { id: "4", title: "ELB and Auto Scaling", pattern: /\bALB\b|\bNLB\b|\bELB\b|load balancer|Auto Scaling|launch template/i, exclude: /DynamoDB/i },
  { id: "5", title: "EC2 purchasing and families", pattern: /Reserved Instance|Savings Plan|Spot Instance|Dedicated Host|On-Demand|compute optimized|memory optimized|instance family/i },
  { id: "6", title: "EBS, EFS, FSx, instance store, Storage Gateway", pattern: /\bEBS\b|\bEFS\b|\bFSx\b|instance store|Storage Gateway/i },
  { id: "7", title: "RDS and Aurora", pattern: /\bRDS\b|\bAurora\b/i },
  { id: "8", title: "DynamoDB", pattern: /\bDynamoDB\b/i },
  { id: "9", title: "SQS, SNS, EventBridge, Kinesis", pattern: /\bSQS\b|\bSNS\b|EventBridge|\bKinesis\b/i },
  { id: "10", title: "CloudFront, Global Accelerator, Route 53", pattern: /CloudFront|Global Accelerator|Route 53/i },
  { id: "11", title: "DR, RTO/RPO, AWS Backup", pattern: /\bRTO\b|\bRPO\b|disaster recovery|AWS Backup|pilot light|warm standby/i },
  { id: "12", title: "Lambda, API Gateway, Step Functions", pattern: /\bLambda\b|API Gateway|Step Functions/i },
  { id: "13", title: "KMS, CloudHSM, secrets, ACM", pattern: /\bKMS\b|CloudHSM|Secrets Manager|Certificate Manager|\bACM\b/i },
  { id: "14", title: "DMS, Snow, DataSync, Transfer, MGN", pattern: /Database Migration Service|\bDMS\b|Snowball|Snowcone|DataSync|Transfer Family|Application Migration Service|\bMGN\b/i },
  { id: "15", title: "CloudWatch, CloudTrail, Config, orgs, Trusted Advisor", pattern: /CloudWatch|CloudTrail|AWS Config|Trusted Advisor|AWS Organizations|Control Tower/i },
  { id: "16", title: "Athena through QuickSight", pattern: /\bAthena\b|\bGlue\b|Lake Formation|QuickSight|\bEMR\b|OpenSearch|Redshift/i },
];

export const SAA_CLUSTERS = CLUSTER_DEFS.map(({ id, title }) => ({ id, title }));

function clusterText(question: Question): string {
  return [question.prompt, ...(question.choices ?? []), question.explanation ?? ""].join("\n");
}

function clusterMatches(clusterId: string, text: string): boolean {
  const cluster = CLUSTER_DEFS.find((item) => item.id === clusterId);
  if (!cluster || !cluster.pattern.test(text)) return false;
  if (cluster.exclude && cluster.exclude.test(text) && !/load balancer|Auto Scaling group|launch template|\bALB\b|\bNLB\b|\bELB\b/i.test(text)) return false;
  return true;
}

export function questionsInCluster(clusterId: string, questions: Question[]): Question[] {
  return questions.filter((question) => question.examCodes?.includes("saa-c03") && clusterMatches(clusterId, clusterText(question)));
}

/** Same cluster rules as the high-yield audit: questions, card faces, and drill cues. */
export function highYieldClusterCounts(input: {
  questions: Question[];
  cards: { front: string; back: string; examCodes?: string[] }[];
  drills: { cue: string; answer: string }[];
}): { id: string; title: string; questions: number; cards: number; drills: number }[] {
  return CLUSTER_DEFS.map((cluster) => ({
    id: cluster.id,
    title: cluster.title,
    questions: input.questions.filter((question) => question.examCodes?.includes("saa-c03") && clusterMatches(cluster.id, clusterText(question))).length,
    cards: input.cards.filter((card) => card.examCodes?.includes("saa-c03") && clusterMatches(cluster.id, `${card.front}\n${card.back}`)).length,
    drills: input.drills.filter((item) => clusterMatches(cluster.id, `${item.cue}\n${item.answer}`)).length,
  }));
}

export type RotationOptions = {
  /** Question ids from older sittings to newer ones. */
  history?: string[];
  /** Due misses in this pool. They lead the sitting. */
  dueIds?: string[];
  limit?: number;
  rng?: () => number;
};

/**
 * Due misses first, then questions never shown, then the ones shown longest ago.
 * The remainder is shuffled so two empty-history draws are not the same sequence.
 */
export function rotatePracticeIds(ids: string[], options: RotationOptions = {}): string[] {
  const unique = [...new Set(ids)];
  const allowed = new Set(unique);
  const due: string[] = [];
  for (const id of options.dueIds ?? []) {
    if (allowed.has(id) && !due.includes(id)) due.push(id);
  }
  const dueSet = new Set(due);
  const rest = freshFirstIds(
    unique.filter((id) => !dueSet.has(id)),
    options.history ?? [],
    options.rng ?? Math.random,
  );
  const ordered = [...due, ...rest];
  const limit = options.limit ?? ordered.length;
  return ordered.slice(0, limit);
}

/** Up to 15 questions from one high-yield cluster, unseen and overdue misses first. */
export function selectTopicQuiz(clusterId: string, questions: Question[], options: RotationOptions = {}): string[] {
  return rotatePracticeIds(
    questionsInCluster(clusterId, questions).map((question) => question.id),
    { ...options, limit: options.limit ?? SAA_TOPIC_QUESTIONS },
  );
}

/** Every SAA sitting, oldest first, so a question seen in any mode waits its turn. */
export function saaRotationHistory(progress: { quizAttempts?: CsvAttempt[]; mockAttempts?: CsvAttempt[] }): string[] {
  return [...(progress.quizAttempts ?? []), ...(progress.mockAttempts ?? [])]
    .filter((attempt) => attempt.exam === "saa-c03")
    .sort((a, b) => a.at - b.at)
    .flatMap((attempt) => attempt.questionIds ?? []);
}

export function orderedTwinIds(twins: QualifierTwin[]): string[] {
  return [...twins].sort((a, b) => a.pairId.localeCompare(b.pairId) || a.id.localeCompare(b.id)).map((item) => item.id);
}

export type CsvAttempt = {
  exam?: string;
  at: number;
  topicId?: string;
  questionIds?: string[];
  missedIds?: string[];
  sureIds?: string[];
  unsureIds?: string[];
  guessedIds?: string[];
  confidenceByQuestion?: Record<string, string>;
  missReasons?: Record<string, string>;
  secondsByQuestion?: Record<string, number>;
  objectiveByQuestion?: Record<string, string>;
  sittingId?: string;
  mode?: string;
};

function csvCell(value: string | number): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function confidenceFor(attempt: CsvAttempt, id: string): string {
  const direct = attempt.confidenceByQuestion?.[id];
  if (direct === "sure" || direct === "unsure" || direct === "guess") return direct;
  if (attempt.sureIds?.includes(id)) return "sure";
  if (attempt.unsureIds?.includes(id)) return "unsure";
  if (attempt.guessedIds?.includes(id)) return "guess";
  return "";
}

function taskFor(attempt: CsvAttempt, question: Question | undefined, id: string): string {
  const tagged = question?.objectiveIds?.["saa-c03"]?.[0];
  if (tagged) return tagged;
  const recorded = attempt.objectiveByQuestion?.[id];
  return recorded && /^\d\.\d+$/.test(recorded) ? recorded : "";
}

/** Client-side rows. Timed-test quiz records are omitted because the mock row already has them. */
export function saaAttemptRows(attempts: CsvAttempt[], questions: Question[], learnerId: string): string[][] {
  const byId = new Map<string, Question>();
  for (const question of [...questions, ...qualifierTwins]) byId.set(question.id, question);
  const rows: string[][] = [];
  for (const attempt of attempts) {
    if (attempt.exam !== "saa-c03") continue;
    if (attempt.topicId?.startsWith("exam-test:")) continue;
    const mode = ATTEMPT_MODES.includes(attempt.mode as AttemptMode) ? attempt.mode! : attempt.topicId ? "quiz" : "mock";
    const missed = new Set(attempt.missedIds ?? []);
    for (const id of attempt.questionIds ?? []) {
      const task = taskFor(attempt, byId.get(id), id);
      const domain = task ? `${task[0]}.0` : "";
      const seconds = attempt.secondsByQuestion?.[id];
      rows.push([
        learnerId,
        "saa-c03",
        domain,
        task,
        id,
        missed.has(id) ? "false" : "true",
        seconds === undefined ? "" : String(seconds),
        confidenceFor(attempt, id),
        attempt.missReasons?.[id] ?? "",
        attempt.sittingId || `legacy-${attempt.at}`,
        mode,
        new Date(attempt.at).toISOString(),
      ]);
    }
  }
  return rows;
}

export function saaAttemptCsv(attempts: CsvAttempt[], questions: Question[], learnerId: string): string {
  const lines = [CSV_COLUMNS.join(",")];
  for (const row of saaAttemptRows(attempts, questions, learnerId)) lines.push(row.map(csvCell).join(","));
  return `${lines.join("\n")}\n`;
}

export type DeckCardFacts = { count: number; modes: string[]; bestScore: number; bestStreak: number };

export function deckCardFacts(
  deck: { items: unknown[]; modes: { id: string }[] },
  best?: { bestScore?: number; bestStreak?: number },
): DeckCardFacts {
  return {
    count: deck.items.length,
    modes: [...deck.modes.map((mode) => mode.id), "speed", "survival", "missed"],
    bestScore: best?.bestScore ?? 0,
    bestStreak: best?.bestStreak ?? 0,
  };
}

export type ReviewMiss = { id: string; misses: number; lucky: boolean };

type ReviewAttempt = {
  exam?: string;
  at?: number;
  questionIds?: string[];
  missedIds?: string[];
  luckyIds?: string[];
  sureIds?: string[];
  confidenceByQuestion?: Record<string, string>;
};

function sureMiss(attempt: ReviewAttempt, id: string): boolean {
  return attempt.confidenceByQuestion?.[id] === "sure" || (attempt.sureIds?.includes(id) ?? false);
}

/**
 * Review items in weak-point order: sure-but-wrong, then other wrong answers,
 * then lucky guesses. A later correct answer that was marked sure drops off.
 */
export function saaReviewMisses(attempts: ReviewAttempt[], questions: Question[] = []): ReviewMiss[] {
  const saa = new Set([...questions.filter((question) => question.examCodes?.includes("saa-c03")).map((question) => question.id), ...qualifierTwins.map((question) => question.id)]);
  const rows = new Map<string, ReviewMiss & { rank: number }>();
  const ordered = attempts
    .map((attempt, index) => ({ attempt, index }))
    .sort((a, b) => (a.attempt.at ?? 0) - (b.attempt.at ?? 0) || a.index - b.index);
  for (const { attempt } of ordered) {
    if (attempt.exam !== undefined && attempt.exam !== "saa-c03") continue;
    const shown = new Set(attempt.questionIds ?? []);
    const inScope = (id: string) => saa.has(id) && (shown.size === 0 || shown.has(id));
    const missed = new Set(attempt.missedIds ?? []);
    const lucky = new Set(attempt.luckyIds ?? []);
    for (const id of missed) {
      if (!inScope(id)) continue;
      const current = rows.get(id) ?? { id, misses: 0, lucky: false, rank: 1 };
      current.misses += 1;
      current.lucky = false;
      current.rank = sureMiss(attempt, id) ? 0 : 1;
      rows.set(id, current);
    }
    for (const id of lucky) {
      if (!inScope(id)) continue;
      const current = rows.get(id) ?? { id, misses: 0, lucky: true, rank: 2 };
      current.lucky = true;
      current.rank = 2;
      rows.set(id, current);
    }
    for (const id of shown) {
      if (!inScope(id) || missed.has(id) || lucky.has(id)) continue;
      rows.delete(id);
    }
  }
  return [...rows.values()]
    .sort((a, b) => a.rank - b.rank || b.misses - a.misses || a.id.localeCompare(b.id))
    .map(({ id, misses, lucky }) => ({ id, misses, lucky }));
}
