import type { ConfusionTerm } from "@/lib/confusions";

/**
 * Two look-alike answers side by side: the one that was right and the one that
 * was picked, each with its one-line rule. Text labels carry the meaning, not colour.
 */
export function LookAlike({ answer, picked, answerLabel, pickedLabel }: { answer: ConfusionTerm; picked: ConfusionTerm; answerLabel: string; pickedLabel: string }) {
  return (
    <dl className="mt-2 grid gap-2 sm:grid-cols-2">
      <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/5 p-3">
        <dt className="text-xs uppercase tracking-wide text-emerald-200">{answerLabel}</dt>
        <dd className="mt-1 font-medium text-white">{answer.label}</dd>
        <dd className="mt-1 text-sm text-slate-200">{answer.rule}</dd>
      </div>
      <div className="rounded-xl border border-rose-400/40 bg-rose-400/5 p-3">
        <dt className="text-xs uppercase tracking-wide text-rose-200">{pickedLabel}</dt>
        <dd className="mt-1 font-medium text-white">{picked.label}</dd>
        <dd className="mt-1 text-sm text-slate-200">{picked.rule}</dd>
      </div>
    </dl>
  );
}
