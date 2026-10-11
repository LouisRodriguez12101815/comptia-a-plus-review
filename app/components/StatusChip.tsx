import { StatusIcon } from "@/app/components/icons";
import type { ToolStatus } from "@/lib/tracks";

const styles: Record<ToolStatus["state"], string> = {
  ready: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  soon: "border-slate-700 bg-slate-950/40 text-slate-400",
  shared: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
  elsewhere: "border-slate-700 bg-slate-950/40 text-slate-300",
};

/** A status is always an icon plus a label, so meaning never depends on color alone. */
export function StatusChip({ state, children }: { state: ToolStatus["state"]; children: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[state]}`}
    >
      <StatusIcon kind={state} />
      {children}
    </span>
  );
}
