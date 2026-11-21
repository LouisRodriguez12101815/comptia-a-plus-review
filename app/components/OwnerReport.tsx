"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LearnerSync } from "@/app/components/LearnerSync";
import type { PublicDiagnostics } from "@/lib/learner/diagnostics";
import type { OwnerSummary } from "@/lib/learner/owner-summary";

const exams = ["saa-c03", "clf-c02"] as const;
const button = "inline-flex min-h-11 items-center rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-100 hover:border-teal-400 disabled:opacity-50";

function pct(value: number | null) {
  return value === null ? "n/a" : `${Math.round(value * 100)}%`;
}

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function OwnerReport() {
  const t = useTranslations("ownerReport");
  const [exam, setExam] = useState<(typeof exams)[number]>("saa-c03");
  const [days, setDays] = useState(30);
  const [phase, setPhase] = useState<"loading" | "off" | "out" | "in">("loading");
  const [report, setReport] = useState<OwnerSummary | null>(null);
  const [diagnostics, setDiagnostics] = useState<PublicDiagnostics | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const [reportRes, diagnosticsRes] = await Promise.all([
        fetch(`/api/learner/report?exam=${exam}&days=${days}`, { cache: "no-store" }),
        fetch("/api/learner/diagnostics", { cache: "no-store" }),
      ]);
      if (reportRes.status === 401 || diagnosticsRes.status === 401) { setPhase("out"); setReport(null); return; }
      if (reportRes.status === 423 || diagnosticsRes.status === 423) { setError(t("paused")); return; }
      if (!reportRes.ok || !diagnosticsRes.ok) { setError(t("unavailable")); return; }
      setReport((await reportRes.json()) as OwnerSummary);
      setDiagnostics((await diagnosticsRes.json()) as PublicDiagnostics);
    } catch {
      setError(t("unavailable"));
    } finally {
      setBusy(false);
    }
  }, [days, exam, t]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/learner/session", { cache: "no-store" });
        const data = (await res.json()) as { configured?: boolean; signedIn?: boolean };
        if (cancelled) return;
        if (!data.configured) { setPhase("off"); return; }
        if (!data.signedIn) { setPhase("out"); return; }
        setPhase("in");
        await load();
      } catch {
        if (!cancelled) setPhase("off");
      }
    })();
    return () => { cancelled = true; };
  }, [load]);

  return (
    <div className="space-y-8">
      {phase === "off" && <p className="text-slate-300">{t("notConfigured")}</p>}
      {phase === "out" && (
        <div className="space-y-4">
          <p className="text-slate-300">{t("signedOut")}</p>
          <LearnerSync />
        </div>
      )}
      {phase === "in" && (
        <>
          <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); void load(); }}>
            <label className="text-sm text-slate-200">{t("examLabel")}
              <select className="mt-1 block min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-3 text-slate-100" value={exam} onChange={(event) => setExam(event.target.value as (typeof exams)[number])}>
                {exams.map((code) => <option key={code} value={code}>{code}</option>)}
              </select>
            </label>
            <label className="text-sm text-slate-200">{t("daysLabel")}
              <input className="mt-1 block min-h-11 w-24 rounded-lg border border-slate-700 bg-slate-950 px-3 text-slate-100" type="number" min={7} max={365} value={days} onChange={(event) => setDays(Number(event.target.value))} />
            </label>
            <button className={button} type="submit" disabled={busy}>{t("refresh")}</button>
            <button className={button} type="button" disabled={!report} onClick={() => report && download(`${exam}-activity.csv`, report.csv, "text/csv")}>{t("downloadCsv")}</button>
            <button className={button} type="button" disabled={!report} onClick={() => report && download(`${exam}-summary.md`, report.markdown, "text/markdown")}>{t("downloadMarkdown")}</button>
          </form>
          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
          {report && (
            <div className="space-y-6">
              {report.overall.total === 0 && <p className="text-slate-300">{t("empty")}</p>}
              <section>
                <h2 className="text-lg font-semibold text-white">{t("overall")}</h2>
                <p className="mt-1 text-slate-200">{report.overall.correct}/{report.overall.total} ({pct(report.overall.accuracy)})</p>
                <p className="text-sm text-slate-400">{report.window.start} — {report.window.end}</p>
              </section>
              <section>
                <h2 className="text-lg font-semibold text-white">{t("sittings")}</h2>
                <ul className="mt-2 space-y-1 text-sm text-slate-200">
                  {report.sittings.map((sitting) => (
                    <li key={sitting.at}>
                      {sitting.at}: {sitting.correct}/{sitting.total}
                      {sitting.medianSeconds === null
                        ? ` — ${t("notRecorded")}`
                        : ` — ${t("medianSlow", { seconds: sitting.medianSeconds, slow: sitting.slowCount ?? 0 })}`}
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h2 className="text-lg font-semibold text-white">{t("domains")}</h2>
                <ul className="mt-2 space-y-1 text-sm text-slate-200">
                  {report.domains.map((domain) => <li key={domain.id}>{domain.title}: {domain.correct}/{domain.total} ({pct(domain.accuracy)})</li>)}
                </ul>
              </section>
              <section>
                <h2 className="text-lg font-semibold text-white">{t("weakest")}</h2>
                <ul className="mt-2 space-y-1 text-sm text-slate-200">
                  {report.weakestTasks.map((task) => <li key={task.id}>{task.id} {task.title}: {task.correct}/{task.attempts} ({pct(task.accuracy)})</li>)}
                </ul>
              </section>
              <section>
                <h2 className="text-lg font-semibold text-white">{t("missed")}</h2>
                <ul className="mt-2 space-y-1 text-sm text-slate-200">
                  {report.mostMissed.map((row) => <li key={row.questionId}><span className="font-mono">{row.questionId}</span>: {row.prompt}</li>)}
                </ul>
              </section>
              <section>
                <h2 className="text-lg font-semibold text-white">{t("lucky")}</h2>
                <ul className="mt-2 space-y-1 text-sm text-slate-200">
                  {report.luckyGuesses.map((row) => <li key={row.questionId}><span className="font-mono">{row.questionId}</span>: {row.prompt}</li>)}
                </ul>
              </section>
              <section>
                <h2 className="text-lg font-semibold text-white">{t("sureWrong")}</h2>
                <ul className="mt-2 space-y-1 text-sm text-slate-200">
                  {report.sureButWrong.map((row) => <li key={row.questionId}><span className="font-mono">{row.questionId}</span>: {row.prompt}</li>)}
                </ul>
              </section>
              <section>
                <h2 className="text-lg font-semibold text-white">{t("pacing")}</h2>
                <p className="mt-1 text-sm text-slate-300">{report.pacing.note}</p>
              </section>
              <section>
                <h2 className="text-lg font-semibold text-white">{t("followups")}</h2>
                <ul className="mt-2 space-y-1 text-sm">
                  {report.followups.map((path) => <li key={path}><a className="text-teal-300 underline" href={path}>{path}</a></li>)}
                </ul>
              </section>
            </div>
          )}
          {diagnostics && (
            <section className="space-y-3 border-t border-slate-800 pt-6">
              <h2 className="text-lg font-semibold text-white">{t("diagnostics")}</h2>
              <dl className="grid gap-2 text-sm text-slate-200 sm:grid-cols-2">
                <div><dt className="text-slate-400">{t("account")}</dt><dd>{diagnostics.accountFriendlyName}</dd></div>
                <div><dt className="text-slate-400">{t("sidLast4")}</dt><dd className="font-mono">{diagnostics.accountSidLast4}</dd></div>
                <div><dt className="text-slate-400">{t("subaccount")}</dt><dd>{diagnostics.subaccount ? t("yes") : t("no")}</dd></div>
                <div><dt className="text-slate-400">{t("parent")}</dt><dd>{diagnostics.parentFriendlyName ?? t("no")}</dd></div>
                <div><dt className="text-slate-400">{t("service")}</dt><dd>{diagnostics.syncServiceFriendlyName}</dd></div>
              </dl>
              <p>{t("civicAccount")}: {diagnostics.accountMatchesCivicPath ? t("yes") : t("no")}</p>
              {diagnostics.subaccount && <p>{t("civicParent")}: {diagnostics.parentMatchesCivicPath ? t("yes") : t("no")}</p>}
              <h3 className="text-sm font-semibold text-white">{t("usage")}</h3>
              {diagnostics.usage.length === 0 ? <p className="text-sm text-slate-300">{t("usageEmpty")}</p> : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-slate-400">
                      <th className="py-1 pr-3">{t("category")}</th>
                      <th className="py-1 pr-3">{t("count")}</th>
                      <th className="py-1 pr-3">{t("usageAmount")}</th>
                      <th className="py-1">{t("price")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diagnostics.usage.map((row) => (
                      <tr key={row.category} className="border-t border-slate-800">
                        <td className="py-1 pr-3 font-mono">{row.category}</td>
                        <td className="py-1 pr-3">{row.count}</td>
                        <td className="py-1 pr-3">{row.usage}</td>
                        <td className="py-1">{row.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
