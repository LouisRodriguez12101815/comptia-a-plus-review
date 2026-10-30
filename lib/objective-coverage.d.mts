export interface CoverageObjective { id: string; title: string; status: string; topics: string[]; note?: string; missedOnExam?: boolean }
export interface CoverageDomain { id: string; title: string; weight: number; objectives: CoverageObjective[] }
export interface CoverageExam { code: string; name: string; domains: CoverageDomain[] }
export interface CoverageMatrix { reviewed: boolean; note: string; exams: CoverageExam[] }
export interface CoverageRow extends CoverageObjective {
  key: string; exam: string; domain: string; domainTitle: string; weight: number;
  note: string; notes: number; cards: number; quiz: number; labs: number; visuals: number;
}
export interface CoverageContent {
  objectives: CoverageMatrix;
  topics: { id: string; sections: unknown[] }[];
  cards: { topicId: string | string[] }[];
  questions: { topicId: string | string[] }[];
  labs: { relatedTopicIds?: string[] }[];
  visuals: Record<string, unknown[]>;
}
export interface CoverageSummary { total: number; covered: number; partial: number; missing: number }
export function buildCoverageFromContent(content: CoverageContent): { objectives: CoverageMatrix; rows: CoverageRow[] };
export function objectiveKey(row: { exam: string; id: string }): string;
export function rankGaps(rows: CoverageRow[]): CoverageRow[];
export function summarizeCoverage(rows: CoverageRow[]): CoverageSummary;
export function examCoverage(exam: CoverageExam, rows: CoverageRow[]): CoverageSummary & { weighted: number };
export function normalizeSearch(value: string): string;
export function filterCoverage(rows: CoverageRow[], filters?: { exam?: string; status?: string; search?: string; missedOnly?: boolean }): CoverageRow[];
