import {
  summarizeCoverage,
  type CoverageMatrix,
  type CoverageRow,
} from "@/lib/objective-coverage.mjs";

/** Native disclosure keeps the canvas-inspired domain view compact on phones. */
export function DomainOverview({ objectives, rows }: {
  objectives: CoverageMatrix;
  rows: CoverageRow[];
}) {
  const domains = objectives.exams.flatMap((exam) => exam.domains.map((domain) => ({
    key: `${exam.code}:${domain.id}`,
    exam: exam.code,
    ...domain,
    ...summarizeCoverage(rows.filter((row) => row.exam === exam.code && row.domain === domain.id)),
  })));
  const maximum = Math.max(1, ...domains.map((domain) => domain.total));

  return (
    <details className="rounded-xl border border-slate-700 bg-slate-900/60 p-4" data-testid="domain-overview">
      <summary className="min-h-11 cursor-pointer content-center text-lg font-semibold text-white">
        Objectives by domain
      </summary>
      <p className="mt-3 text-sm text-slate-300">
        Bar length shows the number of objectives, not the domain’s exam weight.
        Each bar uses the same scale. Text gives every count; weights describe
        the whole domain. This overview is independent of filters.
      </p>
      <div className="mt-5 grid gap-x-8 gap-y-5 md:grid-cols-2">
        {domains.map((domain) => (
          <div key={domain.key} data-testid={`domain-${domain.key}`}>
            <h3 className="text-sm font-medium text-slate-100">
              <span className="font-mono text-teal-300">{domain.exam} / {domain.id}</span>
              {" · "}{domain.title}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              {domain.total} objectives · domain weight {domain.weight}%
            </p>
            <div aria-hidden="true" className="mt-2 h-3">
              <div className="flex h-full overflow-hidden rounded" style={{ width: `${100 * domain.total / maximum}%` }}>
                {([
                  [domain.covered, "bg-emerald-400"],
                  [domain.partial, "bg-amber-400"],
                  [domain.missing, "bg-slate-500"],
                ] as const).map(([count, color]) => (
                  <span key={color} className={color} style={{ width: `${domain.total ? 100 * count / domain.total : 0}%` }} />
                ))}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-300">
              <span className="text-emerald-200">{domain.covered} covered</span>
              {" · "}<span className="text-amber-200">{domain.partial} partial</span>
              {" · "}{domain.missing} missing
            </p>
          </div>
        ))}
      </div>
    </details>
  );
}
