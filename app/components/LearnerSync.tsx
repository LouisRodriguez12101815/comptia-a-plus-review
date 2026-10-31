"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { getProgressSnapshot, saveProgress, subscribeProgress, type Progress } from "@/lib/progress";

type Phase = "loading" | "hidden" | "out" | "code" | "in";
const input = "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400";
const button = "rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-100 hover:border-teal-400 disabled:opacity-50";

async function post(path: string, body?: unknown): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  try {
    const res = await fetch(`/api/learner/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    });
    return { ok: res.ok, status: res.status, data: (await res.json().catch(() => ({}))) as Record<string, unknown> };
  } catch {
    return { ok: false, status: 0, data: {} };
  }
}

export function LearnerSync() {
  const t = useTranslations("learnerSync");
  const [phase, setPhase] = useState<Phase>("loading");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [last4, setLast4] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const lastSynced = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const errorText = useCallback((data: Record<string, unknown>, status: number) => {
    const key = String(data.error ?? "");
    if (key === "bad_phone") return t("errBadPhone");
    if (key === "wrong_code") return t("errWrongCode");
    if (key === "rate_limited" || status === 429) return t("errRateLimited");
    if (key === "paused") return t("errPaused");
    if (key === "signed_out" || status === 401) return t("errSignedOut");
    if (key === "too_large") return t("errTooLarge");
    return t("errUnavailable");
  }, [t]);

  const sync = useCallback(async (quiet = false) => {
    const local = getProgressSnapshot();
    const res = await post("sync", JSON.stringify(local));
    if (!res.ok) {
      if (res.status === 401) setPhase("out");
      if (!quiet || res.status === 401) setError(errorText(res.data, res.status));
      return false;
    }
    const merged = res.data.progress as Progress;
    lastSynced.current = JSON.stringify(merged);
    if (JSON.stringify(local) !== lastSynced.current) saveProgress(merged);
    setError("");
    setMessage(t("saved", { time: new Date(Number(res.data.savedAt)).toLocaleTimeString() }));
    return true;
  }, [errorText, t]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/learner/session", { cache: "no-store" });
        const data = (await res.json()) as { configured?: boolean; signedIn?: boolean; last4?: string };
        if (cancelled) return;
        if (!data.configured) return setPhase("hidden");
        if (data.signedIn) { setLast4(data.last4 ?? ""); setPhase("in"); await sync(true); }
        else setPhase("out");
      } catch { if (!cancelled) setPhase("hidden"); }
    })();
    return () => { cancelled = true; };
  }, [sync]);

  // Save a few seconds after the learner stops changing things.
  useEffect(() => {
    if (phase !== "in") return;
    return subscribeProgress(() => {
      if (JSON.stringify(getProgressSnapshot()) === lastSynced.current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { void sync(true); }, 8000);
    });
  }, [phase, sync]);

  if (phase === "loading" || phase === "hidden") return null;

  const run = async (fn: () => Promise<void>) => { setBusy(true); setError(""); setMessage(""); try { await fn(); } finally { setBusy(false); } };

  return (
    <section aria-labelledby="learner-sync-title" className="mt-8 rounded-2xl border border-slate-800 p-5">
      <h2 id="learner-sync-title" className="text-lg font-semibold text-white">{t("title")}</h2>
      <p className="mt-1 text-sm text-slate-300">{phase === "in" ? t("signedIn", { last4 }) : t("intro")}</p>

      {phase === "out" && (
        <form className="mt-4 grid max-w-sm gap-3" onSubmit={(e) => { e.preventDefault(); void run(async () => {
          const res = await post("start", { phone });
          if (res.ok) setPhase("code"); else setError(errorText(res.data, res.status));
        }); }}>
          <label className="text-sm text-slate-200">{t("phoneLabel")}
            <input className={`${input} mt-1`} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="305 555 0123" required />
          </label>
          <p className="text-xs text-slate-400">{t("consent")}</p>
          <button className={button} disabled={busy}>{t("sendCode")}</button>
        </form>
      )}

      {phase === "code" && (
        <form className="mt-4 grid max-w-sm gap-3" onSubmit={(e) => { e.preventDefault(); void run(async () => {
          const res = await post("verify", { phone, code });
          if (!res.ok) return setError(errorText(res.data, res.status));
          setLast4(String(res.data.last4 ?? "")); setCode(""); setPhase("in"); await sync();
        }); }}>
          <label className="text-sm text-slate-200">{t("codeLabel")}
            <input className={`${input} mt-1`} inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} required />
          </label>
          <div className="flex gap-2">
            <button className={button} disabled={busy}>{t("verify")}</button>
            <button type="button" className={button} disabled={busy} onClick={() => { setPhase("out"); setCode(""); }}>{t("back")}</button>
          </div>
        </form>
      )}

      {phase === "in" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={button} disabled={busy} onClick={() => void run(async () => { await sync(); })}>{t("syncNow")}</button>
          <button className={button} disabled={busy} onClick={() => void run(async () => { await post("signout"); setPhase("out"); })}>{t("signOut")}</button>
          <button className={button} disabled={busy} onClick={() => { if (window.confirm(t("deleteConfirm"))) void run(async () => {
            const res = await post("delete");
            if (res.ok) { setPhase("out"); setMessage(t("deleted")); } else setError(errorText(res.data, res.status));
          }); }}>{t("deleteData")}</button>
        </div>
      )}

      <p role="status" className="mt-3 text-sm text-teal-300">{message}</p>
      {error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
    </section>
  );
}
