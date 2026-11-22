"use client";

import { useEffect, useRef } from "react";
import { LEARNER_SESSION_EVENT } from "@/lib/learner/flush";
import { bindLearnerPersistence } from "@/lib/learner/persistence";
import { syncLearnerProgress } from "@/lib/learner/sync";
import { enqueueLearnerSave } from "@/lib/learner/sync-queue";
import { getProgressSnapshot, subscribeProgress, type Progress } from "@/lib/progress";

async function postSync(local: Progress, keepalive: boolean) {
  const body = JSON.stringify(local);
  try {
    const res = await fetch("/api/learner/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: keepalive && body.length <= 60_000,
    });
    return { ok: res.ok, status: res.status, data: (await res.json().catch(() => ({}))) as Record<string, unknown> };
  } catch {
    return { ok: false, status: 0, data: {} };
  }
}

/** Signed-in save binder for every page, including quiz, mock, and memory match. */
export function LearnerPersistence() {
  const lastSynced = useRef("");
  useEffect(() => {
    let cancelled = false;
    let unbind = () => {};
    const arm = async () => {
      unbind();
      unbind = () => {};
      try {
        const res = await fetch("/api/learner/session", { cache: "no-store" });
        const data = (await res.json()) as { configured?: boolean; signedIn?: boolean };
        if (cancelled || !data.configured || !data.signedIn) return;
        const save = (mode: "debounced" | "now") => {
          void enqueueLearnerSave(() => syncLearnerProgress(
            (local) => postSync(local, mode === "now"),
            (serialized) => { lastSynced.current = serialized; },
          ).then((result) => {
            if (result.ok) window.dispatchEvent(new CustomEvent("learner-saved", { detail: result.data.savedAt }));
            return result;
          }));
        };
        unbind = bindLearnerPersistence({
          signedIn: true,
          lastSynced: () => lastSynced.current,
          snapshot: () => JSON.stringify(getProgressSnapshot()),
          save,
          subscribe: subscribeProgress,
          target: window,
        });
        save("now");
      } catch { /* session lookup failed; the next visit tries again */ }
    };
    void arm();
    window.addEventListener(LEARNER_SESSION_EVENT, arm);
    return () => {
      cancelled = true;
      unbind();
      window.removeEventListener(LEARNER_SESSION_EVENT, arm);
    };
  }, []);
  return null;
}
