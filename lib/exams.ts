import type { ExamCode, StudyFocus } from "@/lib/types";

export const DEFAULT_STUDY_FOCUS: StudyFocus = "220-1201";

export const examOptions: {
  id: StudyFocus;
  shortLabel: string;
  label: string;
  description: string;
}[] = [
  {
    id: "220-1201",
    shortLabel: "Core 1",
    label: "A+ Core 1 · 220-1201",
    description: "Start here for mobile devices, networking, hardware, virtualization, cloud, and hardware troubleshooting.",
  },
  {
    id: "220-1202",
    shortLabel: "Core 2",
    label: "A+ Core 2 · 220-1202",
    description: "Operating systems, security, software troubleshooting, and operational procedures.",
  },
  {
    id: "n10-009",
    shortLabel: "Network+",
    label: "Network+ · N10-009",
    description: "Networking concepts, implementation, operations, security, and troubleshooting.",
  },
  {
    id: "all",
    shortLabel: "All",
    label: "All class material",
    description: "Browse everything when comparing exams, catching up, or returning for a retake.",
  },
];

export function isStudyFocus(value: unknown): value is StudyFocus {
  return examOptions.some((exam) => exam.id === value);
}

export function examLabel(focus: StudyFocus): string {
  return examOptions.find((exam) => exam.id === focus)?.label ?? focus;
}

export function examShortLabel(focus: StudyFocus): string {
  return examOptions.find((exam) => exam.id === focus)?.shortLabel ?? focus;
}

export function examMatches(codes: ExamCode[], focus: StudyFocus): boolean {
  return focus === "all" || codes.includes(focus);
}
