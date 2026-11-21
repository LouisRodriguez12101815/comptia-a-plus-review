import { allocateByWeight } from "@/lib/exam-test.mjs";
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
export type AttemptMode = "quiz" | "mock" | "mini" | "topic" | "twin";

export const MISS_REASONS: MissReason[] = ["qualifier", "confused", "unknown", "time"];
export const ATTEMPT_MODES: AttemptMode[] = ["quiz", "mock", "mini", "topic", "twin"];
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
    { reason: "confused", href: "/practice-games/drills/aws-saa-confusion" },
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
  { id: "15", title: "CloudWatch, CloudTrail, Config, orgs, Trusted Advisor", pattern: /CloudWatch|CloudTrail|AWS Config|Trusted Advisor|AWS Organizations/i },
  { id: "16", title: "Athena through QuickSight", pattern: /\bAthena\b|\bGlue\b|Lake Formation|QuickSight|\bEMR\b|OpenSearch|Redshift/i },
];

export const SAA_CLUSTERS = CLUSTER_DEFS.map(({ id, title }) => ({ id, title }));

function clusterText(question: Question): string {
  return [question.prompt, ...(question.choices ?? []), question.explanation ?? ""].join("\n");
}

export function questionsInCluster(clusterId: string, questions: Question[]): Question[] {
  const cluster = CLUSTER_DEFS.find((item) => item.id === clusterId);
  if (!cluster) return [];
  return questions.filter((question) => {
    if (!question.examCodes?.includes("saa-c03")) return false;
    const text = clusterText(question);
    if (!cluster.pattern.test(text)) return false;
    if (cluster.exclude && cluster.exclude.test(text) && !/load balancer|Auto Scaling group|launch template|\bALB\b|\bNLB\b|\bELB\b/i.test(text)) return false;
    return true;
  });
}

/** Up to 15 questions from one high-yield cluster, in a stable id order. */
export function selectTopicQuiz(clusterId: string, questions: Question[], limit = SAA_TOPIC_QUESTIONS): string[] {
  return questionsInCluster(clusterId, questions)
    .map((question) => question.id)
    .sort()
    .slice(0, limit);
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

/** Wrong answers and lucky guesses, so a correct unsure or guess still shows up for review. */
export function saaReviewMisses(attempts: { exam?: string; questionIds?: string[]; missedIds?: string[]; luckyIds?: string[] }[], questions: Question[] = []): ReviewMiss[] {
  const saa = new Set([...questions.filter((question) => question.examCodes?.includes("saa-c03")).map((question) => question.id), ...qualifierTwins.map((question) => question.id)]);
  const wrong = new Map<string, number>();
  const lucky = new Map<string, number>();
  for (const attempt of attempts) {
    if (attempt.exam !== undefined && attempt.exam !== "saa-c03") continue;
    const shown = new Set(attempt.questionIds ?? []);
    for (const id of attempt.missedIds ?? []) {
      if (!saa.has(id) || (shown.size > 0 && !shown.has(id))) continue;
      wrong.set(id, (wrong.get(id) ?? 0) + 1);
    }
    for (const id of attempt.luckyIds ?? []) {
      if (!saa.has(id) || wrong.has(id)) continue;
      lucky.set(id, (lucky.get(id) ?? 0) + 1);
    }
  }
  const rows: ReviewMiss[] = [
    ...[...wrong].map(([id, misses]) => ({ id, misses, lucky: false })),
    ...[...lucky].map(([id, misses]) => ({ id, misses, lucky: true })),
  ];
  return rows.sort((a, b) => b.misses - a.misses || Number(a.lucky) - Number(b.lucky) || a.id.localeCompare(b.id));
}
