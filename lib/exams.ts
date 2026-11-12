import type { ExamCode, StudyFocus } from "@/lib/types";
import { DEFAULT_STUDY_FOCUS as defaultStudyFocus, examOptions as sharedExamOptions, isStudyFocus as sharedIsStudyFocus } from "./exam-options.mjs";

export const DEFAULT_STUDY_FOCUS: StudyFocus = defaultStudyFocus as StudyFocus;

// Labels and descriptions live in messages under `exams.<id>`.
export const examOptions: { id: StudyFocus }[] = sharedExamOptions as { id: StudyFocus }[];

export function isStudyFocus(value: unknown): value is StudyFocus {
  return sharedIsStudyFocus(value);
}

export function isExamCode(value: unknown): value is ExamCode {
  return examOptions.some((exam) => exam.id === value && exam.id !== "all");
}

export function examMatches(codes: ExamCode[], focus: StudyFocus): boolean {
  return focus === "all" || codes.includes(focus);
}
