import type { Flashcard, Question } from "@/lib/types";

/** Official SAA-C03 task statements. The exam guide does not publish per-task weights. */
export const SAA_TASK_IDS = [
  "1.1", "1.2", "1.3",
  "2.1", "2.2",
  "3.1", "3.2", "3.3", "3.4", "3.5",
  "4.1", "4.2", "4.3", "4.4",
] as const;

export type SaaTaskId = (typeof SAA_TASK_IDS)[number];
export type SaaDomainId = "D1" | "D2" | "D3" | "D4";

/**
 * Fields added for study navigation. Preservation hashes drop these so the
 * historical audit baseline is not rewritten when tags are added.
 */
export const SAA_TAG_FIELDS = ["services", "difficulty", "domain"] as const;

const TASK_SET = new Set<string>(SAA_TASK_IDS);

/** Longer official names are listed first so a short abbreviation does not win a tie. */
const SERVICE_PATTERNS: [string, RegExp][] = [
  ["AWS IAM Identity Center", /IAM Identity Center|AWS Identity Center|AWS Single Sign-On|\bAWS SSO\b/gi],
  ["AWS Certificate Manager", /AWS Certificate Manager|\bACM\b/gi],
  ["AWS Secrets Manager", /Secrets Manager/gi],
  ["AWS Systems Manager", /Systems Manager|Parameter Store/gi],
  ["AWS Key Management Service", /\bAWS KMS\b|\bKMS\b/gi],
  ["AWS Security Token Service", /\bAWS STS\b|\bSTS\b/gi],
  ["AWS Identity and Access Management", /\bIAM\b/gi],
  ["Amazon S3 Glacier", /S3 Glacier|Glacier Deep Archive|Glacier Flexible Retrieval|\bGlacier\b/gi],
  ["Amazon S3", /\bAmazon S3\b|\bS3\b|Intelligent-Tiering|One Zone-IA|Express One Zone/gi],
  ["Amazon EBS", /\bAmazon EBS\b|\bEBS\b|Multi-Attach/gi],
  ["Amazon EFS", /\bAmazon EFS\b|\bEFS\b/gi],
  ["Amazon FSx", /\bAmazon FSx\b|\bFSx\b/gi],
  ["AWS Storage Gateway", /Storage Gateway/gi],
  ["AWS DataSync", /\bDataSync\b/gi],
  ["AWS Transfer Family", /Transfer Family/gi],
  ["AWS Snow Family", /\bSnowball\b|Snow Family|\bSnowcone\b/gi],
  ["AWS Backup", /\bAWS Backup\b/gi],
  ["Amazon EC2 Auto Scaling", /EC2 Auto Scaling/gi],
  ["AWS Auto Scaling", /AWS Auto Scaling|Application Auto Scaling|Auto Scaling/g],
  ["Amazon EC2", /\bAmazon EC2\b|\bEC2\b|\bSpot\b|Dedicated Hosts?|Reserved Instances?|placement group/gi],
  ["AWS Lambda", /\bAWS Lambda\b|\bLambda\b/gi],
  ["AWS Fargate", /\bFargate\b/gi],
  ["Amazon ECS", /\bAmazon ECS\b|\bECS\b/gi],
  ["Amazon EKS", /\bAmazon EKS\b|\bEKS\b/gi],
  ["Amazon ECR", /\bAmazon ECR\b|\bECR\b/gi],
  ["AWS Batch", /\bAWS Batch\b/gi],
  ["AWS Elastic Beanstalk", /Elastic Beanstalk|\bBeanstalk\b/gi],
  ["AWS Outposts", /\bOutposts\b/gi],
  ["Amazon EMR", /\bAmazon EMR\b|\bEMR\b/gi],
  ["Amazon RDS", /\bAmazon RDS\b|\bRDS\b/gi],
  ["Amazon Aurora", /\bAurora\b/gi],
  ["Amazon DynamoDB", /\bDynamoDB\b/gi],
  ["Amazon DynamoDB Accelerator", /\bDAX\b/gi],
  ["Amazon ElastiCache", /\bElastiCache\b/gi],
  ["Amazon DocumentDB", /\bDocumentDB\b/gi],
  ["Amazon Neptune", /\bNeptune\b/gi],
  ["Amazon Keyspaces", /\bKeyspaces\b/gi],
  ["Amazon Timestream", /\bTimestream\b/gi],
  ["Amazon Redshift", /\bRedshift\b/gi],
  ["Amazon OpenSearch Service", /OpenSearch/gi],
  ["Amazon VPC", /\bAmazon VPC\b|\bVPC\b|NAT gateway|security group|network ACL|\bNACL\b|VPC endpoint|PrivateLink/gi],
  ["AWS Direct Connect", /Direct Connect/gi],
  ["AWS Site-to-Site VPN", /Site-to-Site VPN|\bClient VPN\b|\bVPN\b/gi],
  ["AWS Transit Gateway", /Transit Gateway/gi],
  ["AWS Global Accelerator", /Global Accelerator/gi],
  ["Amazon CloudFront", /\bCloudFront\b/gi],
  ["Amazon Route 53", /Route 53/gi],
  ["Elastic Load Balancing", /\bApplication Load Balancer\b|\bNetwork Load Balancer\b|\bGateway Load Balancer\b|\bALB\b|\bNLB\b|\bELB\b|load balancer/gi],
  ["Amazon API Gateway", /API Gateway/gi],
  ["Amazon SQS", /\bAmazon SQS\b|\bSQS\b/gi],
  ["Amazon SNS", /\bAmazon SNS\b|\bSNS\b/gi],
  ["Amazon EventBridge", /\bEventBridge\b/gi],
  ["Amazon MQ", /\bAmazon MQ\b/gi],
  ["AWS Step Functions", /Step Functions/gi],
  ["Amazon Kinesis", /\bKinesis\b|Firehose/gi],
  ["Amazon MSK", /\bAmazon MSK\b|\bMSK\b/gi],
  ["Amazon Athena", /\bAthena\b/gi],
  ["AWS Glue", /\bAWS Glue\b|\bGlue\b/gi],
  ["AWS Lake Formation", /Lake Formation/gi],
  ["Amazon QuickSight", /QuickSight/gi],
  ["AWS Database Migration Service", /\bAWS DMS\b|\bDMS\b/gi],
  ["AWS CloudFormation", /\bCloudFormation\b/gi],
  ["AWS CloudTrail", /\bCloudTrail\b/gi],
  ["Amazon CloudWatch", /\bCloudWatch\b/gi],
  ["AWS Config", /\bAWS Config\b/gi],
  ["AWS Control Tower", /Control Tower/gi],
  ["AWS Organizations", /\bAWS Organizations\b|\bSCPs?\b|service control policy/gi],
  ["AWS Compute Optimizer", /Compute Optimizer/gi],
  ["AWS Cost Explorer", /Cost Explorer/gi],
  ["AWS Budgets", /\bAWS Budgets\b|\bBudgets\b/gi],
  ["AWS Cost and Usage Report", /Cost and Usage Report/gi],
  ["Savings Plans", /Savings Plans?/gi],
  ["AWS Shield", /\bAWS Shield\b|\bShield\b/gi],
  ["AWS WAF", /\bAWS WAF\b|\bWAF\b/gi],
  ["Amazon GuardDuty", /\bGuardDuty\b/gi],
  ["Amazon Macie", /\bMacie\b/gi],
  ["Amazon Inspector", /\bAmazon Inspector\b|\bInspector\b/gi],
  ["Amazon Cognito", /\bCognito\b/gi],
  ["AWS Directory Service", /Directory Service/gi],
  ["AWS Network Firewall", /Network Firewall/gi],
  ["AWS Firewall Manager", /Firewall Manager/gi],
  ["AWS Security Hub", /Security Hub/gi],
  ["Amazon Detective", /\bDetective\b/gi],
  ["AWS CloudHSM", /\bCloudHSM\b/gi],
  ["AWS Artifact", /\bAWS Artifact\b/gi],
  ["AWS Resource Access Manager", /Resource Access Manager|\bAWS RAM\b/gi],
  ["AWS X-Ray", /\bX-Ray\b/gi],
  ["AWS Health Dashboard", /AWS Health/gi],
  ["AWS Trusted Advisor", /Trusted Advisor/gi],
  ["Amazon Comprehend", /\bComprehend\b/gi],
  ["Amazon Polly", /\bPolly\b/gi],
  ["Amazon Rekognition", /\bRekognition\b/gi],
  ["Amazon SageMaker", /\bSageMaker\b/gi],
  ["Amazon Textract", /\bTextract\b/gi],
  ["Amazon Transcribe", /\bTranscribe\b/gi],
  ["Amazon Translate", /\bAmazon Translate\b/gi],
];

export function saaTaskId(question: Pick<Question, "objectiveIds">): string | undefined {
  const tasks = question.objectiveIds?.["saa-c03"];
  return Array.isArray(tasks) && tasks.length === 1 ? tasks[0] : undefined;
}

export function saaDomainFromTask(task: string): SaaDomainId | undefined {
  if (!TASK_SET.has(task)) return undefined;
  const domain = `D${task[0]}`;
  if (domain === "D1" || domain === "D2" || domain === "D3" || domain === "D4") return domain;
  return undefined;
}

/**
 * Study-navigation label from the shape of the item.
 * hard = multiple response; easy = single response with a short stem; medium = the rest.
 * This is not an AWS exam difficulty rating.
 */
export function saaDifficulty(question: Pick<Question, "answer" | "prompt">): "easy" | "medium" | "hard" {
  if (Array.isArray(question.answer)) return "hard";
  if (question.prompt.length < 120) return "easy";
  return "medium";
}

/** In-scope service names that appear in the prompt, choices, or explanation, in first-seen order. */
export function servicesInQuestion(question: Pick<Question, "prompt" | "choices" | "explanation">): string[] {
  const text = [question.prompt, ...question.choices, question.explanation].join("\n");
  const hits: { start: number; end: number; label: string }[] = [];
  for (const [label, pattern] of SERVICE_PATTERNS) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    for (const match of text.matchAll(new RegExp(pattern.source, flags))) {
      if (match.index === undefined || match[0].length === 0) continue;
      hits.push({ start: match.index, end: match.index + match[0].length, label });
    }
  }
  hits.sort((a, b) => a.start - b.start || b.end - a.end);
  const taken: { start: number; end: number }[] = [];
  const labels: string[] = [];
  for (const hit of hits) {
    if (taken.some((span) => hit.start < span.end && hit.end > span.start)) continue;
    taken.push(hit);
    if (!labels.includes(hit.label)) labels.push(hit.label);
  }
  return labels;
}

/** Undo the study-tag lines so a questions.json file hash still matches the pre-tag bytes. */
export function questionsFileWithoutStudyTags(source: string): string {
  return source.replace(/,\n    "services": \[.*?\],\n    "difficulty": "(?:easy|medium|hard)"/g, "");
}

export function withoutSaaTagFields<T extends Record<string, unknown>>(question: T): T {
  const copy = { ...question };
  for (const field of SAA_TAG_FIELDS) delete copy[field];
  return copy;
}

/** Attach the domain implied by the task. Throws if a stored domain disagrees or the task id is illegal. */
export function withDerivedSaaDomain<T extends Question>(question: T): T {
  const tasks = question.objectiveIds?.["saa-c03"];
  if (!tasks) return question;
  if (tasks.length !== 1 || !saaDomainFromTask(tasks[0])) {
    throw new Error(`${question.id}: illegal SAA task id ${JSON.stringify(tasks)}`);
  }
  const domain = saaDomainFromTask(tasks[0]) as SaaDomainId;
  if (question.domain !== undefined && question.domain !== domain) {
    throw new Error(`${question.id}: stored domain ${question.domain} disagrees with task ${tasks[0]}`);
  }
  return question.domain === domain ? question : { ...question, domain };
}

/** Throws when a SAA question is missing a legal task, disagrees on domain, or has bad study tags. */
export function assertSaaQuestionTags(question: Question): void {
  const tasks = question.objectiveIds?.["saa-c03"];
  if (!Array.isArray(tasks) || tasks.length !== 1) {
    throw new Error(`${question.id}: missing SAA task id`);
  }
  const domain = saaDomainFromTask(tasks[0]);
  if (!domain) throw new Error(`${question.id}: illegal SAA task id ${tasks[0]}`);
  if (question.domain !== undefined && question.domain !== domain) {
    throw new Error(`${question.id}: stored domain ${question.domain} disagrees with task ${tasks[0]}`);
  }
  if (!Array.isArray(question.services) || question.services.some((service) => typeof service !== "string" || service.length === 0)) {
    throw new Error(`${question.id}: services must be an array of service names`);
  }
  const expectedServices = servicesInQuestion(question);
  if (question.services.join("\n") !== expectedServices.join("\n")) {
    throw new Error(`${question.id}: services do not match the names found in the item`);
  }
  if (question.difficulty !== saaDifficulty(question)) {
    throw new Error(`${question.id}: difficulty does not match the item shape`);
  }
}

/** Service names in a card's own front and back, in first-seen order. */
export function servicesInCard(card: Pick<Flashcard, "front" | "back">): string[] {
  return servicesInQuestion({ prompt: card.front, choices: [], explanation: card.back });
}

/** Domain implied by the card's one task. Null when the card has no task. */
export function saaCardDomain(card: Pick<Flashcard, "taskId">): SaaDomainId | null {
  if (!card.taskId) return null;
  return saaDomainFromTask(card.taskId) ?? null;
}

/** Throws when an SAA card's task, services, or docs URL do not match the card text. */
export function assertSaaCardTags(card: Flashcard): void {
  if (card.taskId !== null && (typeof card.taskId !== "string" || !saaDomainFromTask(card.taskId))) {
    throw new Error(`${card.id}: taskId must be a SAA task id or null`);
  }
  if ("domain" in card && (card as { domain?: unknown }).domain !== undefined) {
    throw new Error(`${card.id}: domain must be derived from the task, not stored`);
  }
  if (card.taskId && saaCardDomain(card) !== saaDomainFromTask(card.taskId)) {
    throw new Error(`${card.id}: derived domain disagrees with task ${card.taskId}`);
  }
  if (!Array.isArray(card.services) || card.services.some((service) => typeof service !== "string" || service.length === 0)) {
    throw new Error(`${card.id}: services must be an array of service names`);
  }
  const expectedServices = servicesInCard(card);
  if (card.services.join("\n") !== expectedServices.join("\n")) {
    throw new Error(`${card.id}: services do not match the names found in the card`);
  }
  if (card.taskId) {
    if (typeof card.docsUrl !== "string" || !card.docsUrl.startsWith("https://")) {
      throw new Error(`${card.id}: tagged cards need an https docsUrl`);
    }
  } else if (card.docsUrl !== undefined) {
    throw new Error(`${card.id}: an untagged card does not carry a docsUrl`);
  }
}
