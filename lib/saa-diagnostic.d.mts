import type { ExamPool, TestPick } from './exam-test.mjs';
export const SAA_DIAGNOSTIC_IDS: readonly string[];
export function saaDiagnosticPool(pool: ExamPool): ExamPool;
export function rankDiagnosticMisses(entries: [string, TestPick[]][], rankedObjectiveIds: string[]): [string, TestPick[]][];
