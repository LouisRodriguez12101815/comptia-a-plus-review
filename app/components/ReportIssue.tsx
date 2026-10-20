"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { categories, githubIssueUrl, limits, type Category } from "@/lib/report/issue";

/** Open the report form from anywhere: reportContent("Question q-12: ...") */
export const REPORT_EVENT = "report-content";
export function reportContent(item: string, category?: Category) {
  window.dispatchEvent(new CustomEvent(REPORT_EVENT, { detail: { item, category } }));
}

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; issueUrl: string | null }
  | { kind: "error"; message: string; errors?: string[]; fallbackUrl?: string };

const field =
  "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400";

export function ReportIssue() {
  const t = useTranslations("reportIssue");
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const openedAt = useRef(0);
  const [category, setCategory] = useState<Category>("Factual error");
  const [item, setItem] = useState("");
  const [claim, setClaim] = useState("");
  const [source, setSource] = useState("");
  const [reporter, setReporter] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status.kind === "error") alertRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [status]);

  const open = useCallback((prefill?: { item?: string; category?: Category }) => {
    const selected = typeof window !== "undefined" ? window.getSelection()?.toString().trim() ?? "" : "";
    setItem((prefill?.item ?? selected).slice(0, limits.item));
    if (prefill?.category) setCategory(prefill.category);
    setStatus({ kind: "idle" });
    openedAt.current = Date.now();
    dialog.current?.showModal();
  }, []);

  useEffect(() => {
    const onEvent = (e: Event) => open((e as CustomEvent).detail ?? {});
    window.addEventListener(REPORT_EVENT, onEvent);
    return () => window.removeEventListener(REPORT_EVENT, onEvent);
  }, [open]);

  const reset = () => {
    setItem("");
    setClaim("");
    setSource("");
    setCategory("Factual error");
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus({ kind: "sending" });
    const payload = {
      category,
      page: pathname,
      pageTitle: document.title,
      item,
      claim,
      source,
      reporter,
      website,
      elapsedMs: Date.now() - openedAt.current,
    };
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { issueUrl?: string | null; error?: string; errors?: string[]; fallbackUrl?: string };
      if (res.ok) {
        setStatus({ kind: "done", issueUrl: data.issueUrl ?? null });
        reset();
      } else {
        setStatus({ kind: "error", message: data.error ?? t("genericError"), errors: Array.isArray(data.errors) ? data.errors : undefined, fallbackUrl: data.fallbackUrl });
      }
    } catch {
      setStatus({
        kind: "error",
        message: t("sendFailed"),
        fallbackUrl: githubIssueUrl({ category, page: pathname, item, claim, source }, window.location.origin),
      });
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => open()}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-amber-400/60 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-400/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
      >
        <span aria-hidden="true">⚑</span> {t("trigger")}
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="report-title"
        className="m-auto w-[min(100%-2rem,36rem)] rounded-2xl border border-slate-700 bg-slate-900 p-0 text-slate-100 backdrop:bg-slate-950/80"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
      >
        <form onSubmit={submit} className="max-h-[85vh] space-y-4 overflow-y-auto p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="report-title" className="text-lg font-semibold text-white">
                {t("title")}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {t.rich("intro", {
                  page: pathname,
                  path: (chunks) => <span className="font-mono text-slate-300">{chunks}</span>,
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="min-h-11 min-w-11 rounded-full border border-slate-700 text-slate-300 hover:border-teal-400"
              aria-label={t("close")}
            >
              ✕
            </button>
          </div>

          {status.kind === "done" ? (
            <div className="space-y-3 rounded-xl border border-teal-400/40 bg-teal-400/10 p-4 text-sm" role="status">
              <p className="font-medium text-teal-100">{t("filed")}</p>
              {status.issueUrl && (
                <a href={status.issueUrl} target="_blank" rel="noopener noreferrer" className="text-teal-300 underline">
                  {t("followIssue")}
                </a>
              )}
              <div>
                <button type="button" onClick={() => dialog.current?.close()} className="mt-2 rounded-full bg-teal-500 px-4 py-2 font-medium text-slate-950">
                  {t("done")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <label className="block text-sm">
                {t("category")}
                <select className={field} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                {t.rich("itemLabel", { hint: (chunks) => <span className="text-slate-500">{chunks}</span> })}
                <textarea required minLength={3} maxLength={limits.item} rows={2} className={field} value={item} onChange={(e) => setItem(e.target.value)} />
              </label>
              <label className="block text-sm">
                {t("claimLabel")}
                <textarea required minLength={15} maxLength={limits.claim} rows={4} className={field} value={claim} onChange={(e) => setClaim(e.target.value)} />
              </label>
              <label className="block text-sm">
                {t.rich("sourceLabel", { hint: (chunks) => <span className="text-slate-500">{chunks}</span> })}
                <input maxLength={limits.source} className={field} value={source} onChange={(e) => setSource(e.target.value)} placeholder="N10-009 objective 1.4" />
              </label>
              <label className="block text-sm">
                {t.rich("reporterLabel", { hint: (chunks) => <span className="text-slate-500">{chunks}</span> })}
                <input maxLength={limits.reporter} className={field} value={reporter} onChange={(e) => setReporter(e.target.value)} />
              </label>
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label>
                  Website
                  <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </label>
              </div>
              <p className="text-xs text-slate-500">{t("publicNotice")}</p>

              {status.kind === "error" && (
                <div ref={alertRef} className="rounded-xl border border-orange-400/40 bg-orange-400/10 p-3 text-sm text-orange-100" role="alert">
                  {status.errors && status.errors.length > 1 ? (
                    <ul className="list-disc space-y-1 pl-5">
                      {status.errors.map((e) => <li key={e}>{e}</li>)}
                    </ul>
                  ) : (
                    <p>{status.message}</p>
                  )}
                  {status.fallbackUrl && (
                    <a href={status.fallbackUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-orange-200 underline">
                      {t("openOnGithub")}
                    </a>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={status.kind === "sending"}
                  className="min-h-11 rounded-full bg-teal-500 px-5 py-2 font-medium text-slate-950 hover:bg-teal-400 disabled:opacity-50"
                >
                  {status.kind === "sending" ? t("filing") : t("fileReport")}
                </button>
                <button type="button" onClick={() => dialog.current?.close()} className="min-h-11 rounded-full border border-slate-600 px-5 py-2 text-sm">
                  {t("cancel")}
                </button>
              </div>
            </>
          )}
        </form>
      </dialog>
    </>
  );
}
