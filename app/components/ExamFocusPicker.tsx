"use client";

import { examOptions } from "@/lib/exams";
import type { StudyFocus } from "@/lib/types";

export function ExamFocusPicker({
  focus,
  onChange,
  compact = false,
}: {
  focus: StudyFocus;
  onChange: (focus: StudyFocus) => void;
  compact?: boolean;
}) {
  return (
    <fieldset className="space-y-3">
      {!compact && (
        <div>
          <legend className="text-sm font-medium text-white">What are you studying now?</legend>
          <p className="mt-1 text-sm text-slate-400">
            Your choice stays on this device. Switch anytime for class pacing or a retake.
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-2" aria-label="Certification exam focus">
        {examOptions.map((exam) => {
          const selected = exam.id === focus;
          return (
            <button
              key={exam.id}
              type="button"
              onClick={() => onChange(exam.id)}
              aria-pressed={selected}
              title={exam.description}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                selected
                  ? "border-teal-400 bg-teal-400 text-slate-950"
                  : "border-slate-700 bg-slate-900 text-slate-200 hover:border-teal-400"
              }`}
            >
              {exam.shortLabel}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
