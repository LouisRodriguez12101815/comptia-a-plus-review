import type { ExamCode, StudyFocus } from "@/lib/types";

export const DEFAULT_STUDY_FOCUS: StudyFocus = "220-1201";

// Labels and descriptions live in messages under `exams.<id>`.
export const examOptions: { id: StudyFocus }[] = [{ id: "220-1201" }, { id: "220-1202" }, { id: "n10-009" }, { id: "clf-c02" }, { id: "saa-c03" }, { id: "sy0-701" }, { id: "az-900" }, { id: "az-104" }, { id: "all" }];

export function isStudyFocus(value: unknown): value is StudyFocus {
  return examOptions.some((exam) => exam.id === value);
}

export function examMatches(codes: ExamCode[], focus: StudyFocus): boolean {
  return focus === "all" || codes.includes(focus);
}
