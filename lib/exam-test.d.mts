import type { CoverageMatrix } from "./objective-coverage.mjs";

export interface ExamFormat { label: string; maxQuestions: number; minutes: number; passingScore: number; scaleMin: number; scaleMax: number }
export const EXAM_FORMATS: Record<string, ExamFormat>;
export const TEST_LENGTHS: { id: string; label: string }[];
export function questionsForLength(examCode: string, lengthId: string): number;
export function secondsPerQuestion(examCode: string): number;
export function approximatePassPercent(examCode: string): number | null;
export function mulberry32(seed: number): () => number;

export interface PoolObjective { id: string; title: string; topics: string[]; questionIds: string[] }
export interface PoolDomain { id: string; title: string; weight: number; objectives: PoolObjective[]; available: number }
export interface ExamPool { code: string; name: string; domains: PoolDomain[]; totalUnique: number }
export interface TestPick { questionId: string; domainId: string; objectiveId: string }
export interface PoolQuestion { objectiveIds?: Record<string, string[]>; id: string; topicId: string; examCodes?: string[]; answer: number | number[] }
export type Pick = number | number[] | undefined | null;
export interface TestResponse { answer?: number | number[]; timedOut: boolean; seconds: number }
export interface DomainScore { id: string; title: string; weight: number; total: number; correct: number }

export function buildExamPool(input: {
  objectives: CoverageMatrix;
  questions: PoolQuestion[];
  topics: { id: string; examCodes?: string[] }[];
  examCode: string;
}): ExamPool;
export function allocateByWeight(domains: PoolDomain[], total: number): Record<string, number>;
/** `history`: question ids from earlier sittings, oldest first. Unseen questions are drawn first. */
export function draftTest(pool: ExamPool, requested: number, rng?: () => number, options?: { history?: readonly string[] }): TestPick[];
export function isCorrect(question: { answer: number | number[] }, pick: Pick): boolean;
export function gradeTest(input: {
  pool: ExamPool;
  picks: TestPick[];
  questionsById: Record<string, { answer: number | number[] }>;
  responses: Record<string, TestResponse>;
}): { correct: number; total: number; percent: number; timedOut: number; domains: DomainScore[] };

export function shuffleChoiceOrder(question: { choices: string[] }, rng?: () => number): number[];
export function shuffleQuestionChoices<T extends { choices: string[]; answer: number | number[] }>(question: T, rng?: () => number): T;
export function assessmentVersion(questions: { id: string; prompt: string; choices: string[]; answer: number | number[]; explanation: string; objectiveIds?: object }[]): string;

export function sessionDurationSeconds(examCode: string, count: number): number;
