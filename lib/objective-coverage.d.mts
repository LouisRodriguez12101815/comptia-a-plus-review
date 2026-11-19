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
export interface InsightsDomain extends CoverageSummary { id: string; title: string; weight: number; questions: number; flashcards: number; labs: number }
export interface InsightsExam extends CoverageSummary { code: string; name: string; weighted: number; questions: number; flashcards: number; labs: number; domains: InsightsDomain[] }
export interface PartialCandidate { exam: string; id: string; title: string; domain: string; domainTitle: string; weight: number; topics: string[] }
export interface InsightsTrack { code: string; name: string; questions: number; flashcards: number; labs: number; weighted: number | null }
export interface InsightsSummary { exams: InsightsExam[]; resourceTracks: InsightsTrack[]; partialCandidates: PartialCandidate[] }
export function buildCoverageFromContent(content: CoverageContent): { objectives: CoverageMatrix; rows: CoverageRow[] };
export function objectiveKey(row: { exam: string; id: string }): string;
export function rankGaps(rows: CoverageRow[]): CoverageRow[];
export function summarizeCoverage(rows: CoverageRow[]): CoverageSummary;
export function examCoverage(exam: CoverageExam, rows: CoverageRow[]): CoverageSummary & { weighted: number };
export function buildInsightsFromCoverage(input: { objectives: CoverageMatrix; rows: CoverageRow[]; topics: { id: string; examCodes?: string[] }[]; cards: { id?: string; examCodes?: string[]; topicId: string | string[] }[]; questions: { id?: string; examCodes?: string[]; topicId: string | string[] }[]; labs: { id?: string; slug?: string; examCodes?: string[]; relatedTopicIds?: string[] }[] }): InsightsSummary;
export function renderInsightsJson(input: Parameters<typeof buildInsightsFromCoverage>[0]): string;
export function normalizeSearch(value: string): string;
export function filterCoverage(rows: CoverageRow[], filters?: { exam?: string; status?: string; search?: string; missedOnly?: boolean }): CoverageRow[];
