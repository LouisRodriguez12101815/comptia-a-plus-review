"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { RoomSnapshot } from "@/lib/game/room-types";
import { createRoomClient, createRoomReconciler, RoomApiError, roomClientError, validateRoomSnapshot } from "@/lib/game/room-client";
import { NetworkDiagram } from "@/app/components/game/NetworkDiagram";

type TimedSnapshot = RoomSnapshot & { receivedAt: number };
const roomApi = createRoomClient();

export function MultiplayerRoom({ mode, onBack }: { mode: "create" | "join"; onBack: () => void }) {
  const t = useTranslations("multiplayerRoom");
  const tc = useTranslations("roomClient");
  const [snapshot, setSnapshot] = useState<TimedSnapshot | null>(null);
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState("connecting");
  const requestRefresh = useRef<(() => void) | null>(null);
  const transientActionError = useRef(false);
  const [clock, setClock] = useState(0);
  const code = snapshot?.room.code;

  // Client-side error text: translated when the error carries a messageKey; server text is shown as-is.
  function errorText(cause: unknown, fallback: string) {
    if (cause instanceof RoomApiError && cause.messageKey) return tc(cause.messageKey);
    return cause instanceof Error ? cause.message : fallback;
  }
  function httpStatusText(cause: RoomApiError) {
    return cause.httpStatus ? t("statusHttp", { code: cause.httpStatus }) : cause.status === 0 ? t("statusNetwork") : t("statusInvalid");
  }
  function syncText(state: string) {
    const labels: Record<string, string> = { connecting: t("syncConnecting"), retrying: t("syncRetrying"), connected: t("syncConnected"), subscribed: t("syncSubscribed") };
    return labels[state] ?? state;
  }
  function evidenceStateText(state: string) {
    return state === "not-required" ? t("evidenceNotRequired") : state === "disconnected" ? t("evidenceDisconnected") : state === "waived" ? t("evidenceWaived") : state;
  }

  function accept(value: RoomSnapshot) {
    validateRoomSnapshot(value);
    if (transientActionError.current) { transientActionError.current = false; setError(null); }
    const receivedAt = performance.now();
    setSnapshot((previous) => !previous || previous.viewerId !== value.viewerId || previous.room.code !== value.room.code || value.room.version > previous.room.version || (value.room.version === previous.room.version && value.serverNow >= previous.serverNow)
      ? { ...value, receivedAt } : previous);
    sessionStorage.setItem("outage-ops-room", value.room.code);
  }

  const authenticatedViewerId = snapshot?.viewerId;

  useEffect(() => {
    if (!code || !authenticatedViewerId) return;
    let stopped = false;
    let subscriptionTimer: ReturnType<typeof setTimeout>;
    let controller: AbortController | null = null;
    let client: import("twilio-sync").SyncClient | undefined;
    let document: import("twilio-sync").SyncDocument | undefined;
    let syncConnected = false;

    function failure(cause: unknown, channel: "api" | "sync" = "api") {
      if (stopped) return;
      if (cause instanceof RoomApiError && [401, 404, 410, 423].includes(cause.status)) {
        stopped = true;
        reconciler.stop();
        void client?.shutdown();
        setSnapshot(null);
        sessionStorage.removeItem("outage-ops-room");
        setError(errorText(cause, ""));
        setConnectionError(null);
        setSyncError(null);
      } else if (channel === "sync") {
        syncConnected = false;
        setSyncStatus("retrying");
        reconciler.request();
        const tokenStatus = cause instanceof RoomApiError ? t("tokenRequest", { status: httpStatusText(cause) }) : t("syncSubscriptionFailed");
        setSyncError(t("syncInterrupted", { detail: tokenStatus }));
        console.info("outage_ops_sync_status", { event: "failed", httpStatus: cause instanceof RoomApiError ? cause.httpStatus ?? null : null, reason: cause instanceof RoomApiError ? cause.reason ?? "request_rejected" : "subscription_failure" });
      } else setConnectionError(cause instanceof RoomApiError ? errorText(cause, "") : t("connectionInterrupted"));
    }

    async function refresh() {
      controller = new AbortController();
      try {
        const value = await roomApi(`/${code}`, undefined, AbortSignal.any([controller.signal, AbortSignal.timeout(7000)]));
        if (!stopped) { accept(value); setConnectionError(null); }
      } catch (cause) { if (!stopped) failure(cause); }
    }
    // Entry/resume already returned a snapshot; don't immediately duplicate that GET.
    const reconciler = createRoomReconciler(refresh, () => syncConnected ? 10_000 : 2000, { lastRequestAt: performance.now() });
    requestRefresh.current = reconciler.request;

    async function subscribe() {
      try {
        const credentials = await roomApi<{ token: string; document: string; viewerId: string; renewable: boolean }>(`/${code}/token`, {});
        if (credentials.viewerId !== authenticatedViewerId || credentials.document !== `outage-ops-room-${code}`) throw roomClientError(502, "syncIdentityMismatch", "token", "identity_mismatch");
        const { SyncClient } = await import("twilio-sync");
        if (stopped) return;
        client = new SyncClient(credentials.token);
        let tokenRefresh: Promise<void> | undefined;
        let canRenew = credentials.renewable;
        const renew = () => {
          if (!canRenew || stopped) return;
          tokenRefresh ??= roomApi<{ token: string; viewerId: string; renewable: boolean }>(`/${code}/token`, {})
            .then(async (value) => { if (value.viewerId !== authenticatedViewerId) throw roomClientError(502, "syncIdentityMismatch", "token", "identity_mismatch"); canRenew = value.renewable; if (!stopped) await client?.updateToken(value.token); })
            .catch((cause) => failure(cause, "sync")).finally(() => { tokenRefresh = undefined; });
        };
        client.on("tokenAboutToExpire", renew);
        // A final token already covers the remaining room lifetime. Don't renew
        // short tokens on every about-to-expire event near room expiry.
        client.on("tokenExpired", () => canRenew ? renew() : failure(roomClientError(410, "roomExpired")));
        client.on("connectionStateChanged", (state: string) => {
          if (stopped) return;
          syncConnected = state === "connected";
          if (syncConnected) { setSyncStatus("connected"); setSyncError(null); reconciler.request(); }
          else { setSyncStatus("retrying"); reconciler.request(); setSyncError(t("syncReconnecting")); }
        });
        document = await client.document({ id: credentials.document, mode: "open_existing" });
        if (stopped) { document.close(); return; }
        document.on("updated", reconciler.request);
        document.on("removed", () => failure(roomClientError(410, "roomExpired")));
        setSyncStatus("subscribed");
        reconciler.request();
      } catch (cause) {
        failure(cause, "sync");
        document?.close();
        void client?.shutdown();
        if (!stopped) subscriptionTimer = setTimeout(subscribe, 5000);
      }
    }
    reconciler.request();
    void subscribe();
    return () => { stopped = true; requestRefresh.current = null; reconciler.stop(); clearTimeout(subscriptionTimer); controller?.abort(); document?.close(); void client?.shutdown(); };
  }, [code, authenticatedViewerId]);

  useEffect(() => {
    if (!code) return;
    const timer = setInterval(() => setClock(performance.now()), 250);
    return () => clearInterval(timer);
  }, [code]);

  const phaseDeadline = snapshot?.room.status === "playing"
    ? snapshot.room.phase === "briefing" ? snapshot.room.startsAt : snapshot.room.endsAt : null;
  const serverNow = snapshot?.serverNow;
  useEffect(() => {
    if (!code || !phaseDeadline || !serverNow || connectionError) return;
    const timer = setTimeout(() => {
      requestRefresh.current?.();
    }, Math.max(50, phaseDeadline - serverNow + 100));
    return () => clearTimeout(timer);
  }, [code, phaseDeadline, serverNow, connectionError]);

  async function leave() {
    if (!code) return onBack();
    setBusy(true);
    try {
      await roomApi<{ left: boolean }>(`/${code}/leave`, {});
      sessionStorage.removeItem("outage-ops-room");
      setSnapshot(null);
      onBack();
    } catch (cause) { setError(errorText(cause, t("couldNotLeave"))); }
    finally { setBusy(false); }
  }

  async function enter(resume = false) {
    setBusy(true); setError(null); setSyncStatus("connecting");
    try {
      const saved = resume ? sessionStorage.getItem("outage-ops-room") : null;
      if (resume && !saved) throw new Error(t("noPreviousRoom"));
      accept(resume ? await roomApi(`/${saved}`) : mode === "create"
        ? await roomApi("", { nickname }) : await roomApi(`/${roomCode}/join`, { nickname }));
      setConnectionError(null);
      setSyncError(null);
    } catch (cause) { setError(errorText(cause, t("couldNotEnter"))); }
    finally { setBusy(false); }
  }

  async function command(action: "ready" | "start" | "actions" | "advance" | "evidence" | "hint" | "role-action" | "next" | "continue-evidence", payload: object = {}) {
    if (!code || busy || connectionError) return;
    setBusy(true); setError(null);
    try { accept(await roomApi(`/${code}/${action}`, { incidentIndex: snapshot?.room.incidentIndex, stepIndex: snapshot?.room.stepIndex, ...payload })); }
    catch (cause) {
      transientActionError.current = cause instanceof RoomApiError && (cause.status === 0 || cause.status >= 500);
      const status = cause instanceof RoomApiError ? httpStatusText(cause) : t("statusRequest");
      const detail = cause instanceof RoomApiError ? errorText(cause, "") : t("pleaseRetry");
      setError(t("actionFailed", { action: action === "evidence" ? t("evidenceDiscovery") : t("roomAction"), status, detail }));
    }
    finally { setBusy(false); }
  }

  const buttonStyle = "rounded-full bg-cyan-300 px-5 py-2.5 font-semibold text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40";

  if (!snapshot) {
    return (
      <section className="mx-auto max-w-xl rounded-[2rem] border border-cyan-300/25 bg-slate-900/90 p-6 sm:p-8">
        <button onClick={onBack} className="text-cyan-200">{t("backToMissions")}</button>
        <h1 className="mt-5 text-3xl font-semibold">{mode === "create" ? t("createHeading") : t("joinHeading")}</h1>
        <p className="mt-3 text-slate-300">{t("intro")}</p>
        {error && <p role="alert" className="mt-4 rounded-xl bg-rose-400/10 p-3 text-rose-200">{error}</p>}
        <form onSubmit={(event) => { event.preventDefault(); void enter(); }} className="mt-6 space-y-5">
          {mode === "join" && <label className="block">{t("roomCodeLabel")}<input value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase().replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, "").slice(0, 6))} maxLength={6} autoCapitalize="characters" autoComplete="off" required className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 p-3 font-mono tracking-widest" /></label>}
          <label className="block">{t("callSignLabel")}<input value={nickname} onChange={(event) => setNickname(event.target.value)} minLength={2} maxLength={16} autoComplete="nickname" required className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 p-3" /></label>
          <button disabled={busy || nickname.trim().length < 2 || (mode === "join" && roomCode.length !== 6)} className={`${buttonStyle} w-full`}>{busy ? t("connecting") : mode === "create" ? t("createRoom") : t("joinRoom")}</button>
        </form>
        <button disabled={busy} onClick={() => void enter(true)} className="mt-5 text-sm text-cyan-200">{t("resumePrevious")}</button>
      </section>
    );
  }

  const { room, viewerId, incident, step, role, debrief, evidenceGate } = snapshot;
  const self = room.players.find((player) => player.id === viewerId)!;
  const isHost = room.hostPlayerId === viewerId;
  const estimatedNow = snapshot.serverNow + Math.max(0, clock - snapshot.receivedAt);
  const countdown = room.startsAt ? Math.max(0, Math.ceil((room.startsAt - estimatedNow) / 1000)) : 0;
  const remaining = room.endsAt ? Math.max(0, Math.ceil((room.endsAt - estimatedNow) / 1000)) : room.roundSeconds;
  const actions = room.selectedActions.filter((action) => action.stepIndex === room.stepIndex);
  const ownAction = actions.findLast((action) => action.playerId === viewerId);
  const lobbyGate = snapshot.lobbyGate;
  const foundEvidence = self.evidenceStatus.assigned === self.evidenceStatus.discovered;
  const evidenceWait = evidenceGate.continueAvailableAt === null ? 0 : Math.max(0, Math.ceil((evidenceGate.continueAvailableAt - estimatedNow) / 1000));
  const outstandingEvidence = evidenceGate.continued ? [] : evidenceGate.items.filter((item) => item.required && !item.discovered);
  const ownRoleAction = room.usefulActions.find((action) => action.playerId === viewerId);
  const finalIncident = room.incidentIndex + 1 >= incident.count || room.result === "timeout" || room.result === "uptime";
  const disabled = busy || !!connectionError;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button disabled={busy} onClick={() => void leave()} className="text-cyan-200">{t("leaveRoom")}</button>
        <p className="font-mono text-xl tracking-widest" aria-label={t("roomCodeAria")}>{room.code}</p>
        <p className="text-sm text-slate-300">{t("teamScore", { score: room.score, uptime: room.uptime })}</p>
      </div>
      {error && <p role="alert" className="rounded-xl bg-rose-400/10 p-3 text-rose-200">{error}</p>}
      {connectionError && <p role="status" className="rounded-xl bg-amber-400/10 p-3 text-amber-200">{connectionError}</p>}
      <p role="status" data-room-connection-status className="text-sm text-slate-300">{t("roomStorage", { state: connectionError ? t("retryingShared") : t("responding"), sync: syncText(syncStatus) })}</p>
      {connectionError && <button onClick={() => requestRefresh.current?.()} className="text-cyan-200">{t("retryRoom")}</button>}
      {syncError && <p role="status" className="rounded-xl bg-amber-400/10 p-3 text-amber-200">{syncError}</p>}
      <details aria-label={t("scoreboardAria")} className="rounded-2xl border border-teal-300/25 bg-slate-900 p-5">
        <summary className="cursor-pointer text-xl font-semibold">{t("scoringSummary")}</summary>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <p>{t("teamPoints")} <strong className="block text-2xl text-cyan-200">{room.score}</strong></p>
          <p>{t("uptimeScore")} <strong className="block text-2xl text-emerald-200">{room.uptimeScore}/1000</strong></p>
          <p>{t("streak")} <strong className="block text-2xl text-amber-200">{room.streak} · ×{room.streakMultiplier}</strong></p>
          <p>{t("incidentTimer")} <strong className="block text-2xl">{room.status === "playing" ? t("secondsShort", { count: remaining }) : "—"}</strong></p>
        </div>
        <p className="mt-3 text-sm text-slate-300">{t("phaseLine", { phase: room.phase, penalties: room.hintPenalties, best: room.bestStreak })}</p>
        <p className="mt-2 text-sm">{t("yourRole")} <strong>{role.name}</strong> — {role.responsibility}</p>
        <p className="mt-3 text-xs text-slate-400">{t("scoringRules")}</p>
      </details>
      <section className="rounded-[2rem] border border-cyan-300/25 bg-slate-900/90 p-6">
        <h2 className="text-xl font-semibold">{t("team", { count: room.players.length })}</h2>
        <ul className="mt-4 space-y-2" aria-label={t("playersAria")}>
          {room.players.map((player) => <li key={player.id} className="flex flex-wrap justify-between gap-2 rounded-xl bg-slate-950 p-3">
            <span>{player.nickname}{player.id === viewerId ? t("youMarker") : ""}{player.isHost ? t("hostMarker") : ""}</span>
            <span className="text-sm text-cyan-100">{t("playerStatus", { role: player.excludedFromMission ? t("observer") : player.role, connection: player.connected ? t("connected") : t("disconnected"), ready: player.ready ? t("ready") : t("notReady"), score: player.score })}</span>
            <span className="w-full text-xs text-slate-300">{t("contributions", { evidence: player.contributions.evidence, answers: player.contributions.answers, actions: player.contributions.actions, resolution: player.contributions.resolution })}{room.status === "playing" && room.phase !== "briefing" ? t("evidenceDetail", { state: evidenceStateText(player.evidenceStatus.state), discovered: player.evidenceStatus.discovered, assigned: player.evidenceStatus.assigned }) : ""}</span>
          </li>)}
        </ul>
        {room.status === "lobby" && <div className="mt-5 flex flex-wrap gap-3">
          <button disabled={disabled} onClick={() => void command("ready", { ready: !self.ready })} className={buttonStyle}>{self.ready ? t("markUnready") : t("markReady")}</button>
          {isHost && <button disabled={disabled || !lobbyGate?.canStart} onClick={() => void command("start")} className={buttonStyle}>{t("startMission")}</button>}
          <p className="w-full text-sm text-slate-300">{lobbyGate?.canStart ? t("allReady") : t("notAllReady")}</p>
        </div>}
      </section>

      {room.status === "lobby" && isHost && !!lobbyGate?.excluded.length && <section aria-label={t("recoveryAria")} className="space-y-3 rounded-2xl border-2 border-amber-300 bg-amber-400/10 p-6">
        <h2 className="text-xl font-semibold">{t("recoveryTitle")}</h2>
        <p>{t("recoveryExcluded", { seconds: lobbyGate.absenceSeconds, names: lobbyGate.excluded.map((p) => p.nickname).join(", ") })}</p>
        <p className="text-sm">{t("recoveryRejoin")}</p>
        {lobbyGate.unready.length > 0 && <p role="status">{t("recoveryUnready", { names: lobbyGate.unready.map((p) => p.nickname).join(", ") })}</p>}
        <button disabled={disabled || !lobbyGate.canContinue} onClick={() => void command("start", { continueWithConnected: true })} className={buttonStyle}>{t("continueConnected")}</button>
      </section>}
      {self.excludedFromMission && <p role="status" className="rounded-xl border border-amber-300 p-4">{t("observingMission")}</p>}
      {room.status === "lobby" && <section className="rounded-2xl border border-slate-700 p-6"><h1 className="text-2xl font-semibold">{t("lobbyTitle")}</h1><p className="mt-3 text-slate-300">{t("lobbyBody", { code: room.code, count: incident.count })}</p></section>}

      {room.status === "playing" && <section className="space-y-5 rounded-[2rem] border border-cyan-300/25 bg-slate-900/90 p-6 sm:p-8">
        <div className="flex flex-wrap justify-between gap-3"><p className="text-cyan-300">{t("incidentPhase", { number: room.incidentIndex + 1, phase: room.phase })}</p><p aria-label={t("timeRemainingAria")} className="font-mono">{t("timeRemaining", { seconds: remaining })}</p></div>
        <h1 className="text-3xl font-semibold">{room.phase === "briefing" ? incident.title : step?.title}</h1>
        {room.phase === "briefing" ? <><p>{incident.ticket}</p><p className="text-cyan-100">{incident.objective}</p><p role="status" className="text-xl font-semibold">{t("missionBegins", { seconds: countdown })}</p></> : step && <>
          <p className="text-cyan-100"><strong>{t("roundObjective")}</strong> {step.learning.goal}</p>
          <p className="text-sm text-slate-300">{t("observedSymptom", { symptom: incident.ticket })}</p>
          {isHost && !evidenceGate.continued && <aside aria-label={t("hostFallbackAria")} className={`space-y-3 rounded-2xl border-2 p-5 ${evidenceWait === 0 ? "border-amber-300 bg-amber-300/15" : "border-slate-600 bg-slate-950"}`}>
            <h2 className="text-lg font-semibold">{evidenceWait === 0 ? t("continueNow") : t("evidenceTimeout")}</h2>
            <p>{evidenceWait > 0 ? t("fallbackWait", { seconds: evidenceWait }) : t("fallbackReady")}</p>
            <button data-host-evidence-continue disabled={disabled || evidenceWait > 0 || remaining === 0} onClick={() => void command("continue-evidence")} className="w-full rounded-xl border-2 border-amber-200 bg-amber-300 px-6 py-4 text-lg font-bold text-slate-950 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto">{t("continueEvidence")}</button>
          </aside>}
          <section className="space-y-3 rounded-xl border border-teal-300/25 p-4" aria-label={t("evidenceAria")}>
            <h2 className="font-semibold">{t("discoverHeading")}</h2>
            <p className="text-sm text-slate-300">{t("discoverBody")}</p>
            {step.assignedEvidence.length === 0 && <p role="status" className="text-cyan-100">{t("noEvidenceAssigned")}</p>}
            <ul className="space-y-3" aria-label={t("assignedEvidenceAria")}>{step.assignedEvidence.map((item) => <li key={item.id} className="rounded-xl bg-slate-950 p-4">
              <h3 className="font-semibold">{item.label}</h3>
              <span data-evidence-id={item.id}>{item.discovered ? <span role="status" className="text-sm text-emerald-200">{t("evidenceShared")}</span> : <button disabled={disabled || remaining === 0} onClick={() => void command("evidence", { itemId: item.id })} className={buttonStyle}>{t("discoverEvidence")}</button>}</span>
              {item.text && <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm text-cyan-100">{item.text}</pre>}
            </li>)}</ul>
            {step.assignedEvidence.length > 0 && <p className="text-xs text-slate-300">{t("discoveryPoints")}</p>}
            {foundEvidence && ownAction?.correct && !ownRoleAction && <div className="flex flex-wrap gap-3">
              <button disabled={disabled || remaining === 0} onClick={() => void command("role-action", { actionId: role.actionId })} className={buttonStyle}>{t("publishFinding")}</button>
            </div>}
            {ownRoleAction && <p role="status" className="text-sm">{ownRoleAction.useful ? t("findingPublished") : t("unsupportedChange")}</p>}
          </section>
          <section aria-label={t("sharedFindingsAria")} className="space-y-3 rounded-xl border border-cyan-300/30 p-4">
            <h2 className="font-semibold">{t("sharedFindings")}</h2>
            <p className="text-sm text-slate-300">{t("compareClue", { name: role.name, responsibility: role.responsibility })}</p>
            {snapshot.sharedFindings.length ? snapshot.sharedFindings.map((finding) => <p key={finding.id} className="whitespace-pre-wrap text-sm"><strong>{finding.label}:</strong> {finding.text}</p>) : <p>{t("noDiscoveries")}</p>}
            {room.usefulActions.filter((a) => a.useful).map((a) => <p key={a.playerId} className="text-sm text-emerald-100">{t("publishedFinding", { nickname: room.players.find((p) => p.id === a.playerId)?.nickname ?? "", explanation: actions.find((decision) => decision.playerId === a.playerId && decision.correct)?.explanation ?? "" })}</p>)}
          </section>
          <button disabled={disabled || !!self.excludedFromMission || room.hintUsed || remaining === 0} onClick={() => void command("hint")} className="rounded-full border border-amber-300/40 px-4 py-2 text-sm text-amber-200">{room.hintUsed ? t("sharedHintUsed") : t("sharedHintAsk")}</button>
          {step.hint && <p role="status" className="rounded-xl bg-amber-400/10 p-4 text-amber-100">{t("mentorHintLine", { hint: step.hint })}</p>}
          {snapshot.networkDiagram && <NetworkDiagram diagram={snapshot.networkDiagram} />}
          <h2 className="text-lg font-semibold">{step.prompt}</h2>
          <section className="space-y-2 rounded-xl bg-slate-950 p-4" aria-label={t("evidenceProgressAria")}>
            <h3 className="font-semibold">{t("requiredEvidence")}</h3>
            {outstandingEvidence.length ? <ul className="space-y-2">{outstandingEvidence.map((item) => <li key={item.id}>{t("outstandingItem", { label: item.label, owners: item.owners.filter((owner) => owner.connected).map((owner) => owner.nickname).join(", ") })}</li>)}</ul> : <p role="status" className="text-emerald-200">{t("noOutstanding")}</p>}
            {!evidenceGate.canAnswer && !ownAction && <p role="status" className="text-amber-100">{!foundEvidence ? t("discoverToAnswer") : t("evidenceOutstanding")}</p>}
            {evidenceGate.continued ? <p role="status" className="text-amber-100">{t("hostContinued")}</p> : <>
              <p role="status" className="text-sm text-cyan-100">{evidenceWait > 0 ? t("hostMayContinue", { seconds: evidenceWait }) : t("evidenceTimeoutReached")}</p>
            </>}
          </section>
          <div className="grid gap-3 sm:grid-cols-2">{step.choices.map((choice) => <button key={choice.id} data-answer-id={choice.id} disabled={disabled || !evidenceGate.canAnswer || (ownAction?.correct || actions.some((a) => a.playerId === viewerId && (a.attemptedAnswerIds ?? [a.answerId]).includes(choice.id))) || remaining === 0} aria-pressed={ownAction?.answerId === choice.id} onClick={() => void command("actions", { answerId: choice.id })} className="min-h-20 rounded-xl border border-slate-600 bg-slate-950 p-4 text-left hover:border-cyan-300 disabled:opacity-60">{choice.label}</button>)}</div>
          {ownAction && <div role="status" className={`rounded-xl p-4 ${ownAction.correct ? "bg-emerald-400/10 text-emerald-100" : "bg-rose-400/10 text-rose-100"}`}><p className="font-semibold">{ownAction.correct ? t("ownCorrectMove") : t("ownNotBest")}</p><p className="mt-2">{ownAction.explanation}</p><p className="mt-2 text-sm">{step.learning.competingExplanation}</p>{ownAction.correct ? <><p className="mt-2"><strong>{t("consequenceLabel")}</strong> {step.consequence}</p><p className="mt-2"><strong>{t("whatWeLearned")}</strong> {step.learning.learned}</p><p className="mt-2 text-sm">{t("individualPoints")}</p></> : <p className="mt-2 font-semibold">{t("penaltyRemains")}</p>}</div>}
          <p className="text-sm text-slate-300">{t("answersReceived", { answered: new Set(actions.map((a) => a.playerId)).size, connected: room.players.filter((player) => player.connected && !player.excludedFromMission).length })}</p>
          {evidenceGate.outstandingAnswers.length > 0 && <p className="text-sm text-amber-100">{t("answersOutstanding", { list: evidenceGate.outstandingAnswers.join(", "), suffix: evidenceGate.continued ? t("hostMayProceed") : "" })}</p>}
          {isHost ? <button disabled={disabled || !evidenceGate.canAdvance || remaining === 0} onClick={() => void command("advance", { stepIndex: room.stepIndex })} className={buttonStyle}>{t("continueMission")}</button> : <p className="text-sm text-cyan-200">{t("hostContinues")}</p>}
        </>}
      </section>}

      {room.status === "results" && <section className="space-y-4 rounded-[2rem] border border-teal-300/30 bg-slate-900 p-6">
        <h1 className="text-3xl font-semibold">{finalIncident ? t("finalDebrief") : t("incidentDebrief")}</h1>
        <p className="text-xl">{room.result === "resolved" ? t("resultResolved") : room.result === "timeout" ? t("resultTimeout") : room.result === "uptime" ? t("resultUptime") : t("resultNeedsInvestigation")}</p>
        <p>{t("teamOutcome", { outcome: debrief?.teamOutcome === "resolved" ? t("teamOutcomeResolved") : t("teamOutcomeReview"), score: room.score, uptime: room.uptime, uptimeScore: debrief?.uptimeScore ?? 0, best: room.bestStreak, hints: room.hintPenalties })}</p>
        <ul className="space-y-2" aria-label={t("outcomesAria")}>{room.outcomes.map((outcome) => <li key={outcome.incidentId}>{t("outcomeRow", { incidentId: outcome.incidentId, result: outcome.result, points: outcome.score, mistakes: outcome.mistakes, hints: outcome.hints })}</li>)}</ul>
        <h2 className="text-xl font-semibold">{t("reconstructionHeading")}</h2>
        <p className="text-sm">{t("reconstructionFlow")}</p>
        {snapshot.learningDebrief.map((round, index) => <article key={index} className="space-y-2 rounded-xl bg-slate-950 p-4">
          <h3 className="font-semibold">{round.title}</h3><p className="text-sm">{t("goal", { goal: round.goal })}</p>
          {round.evidence.map((text) => <p key={text} className="whitespace-pre-wrap text-sm text-cyan-100">{text}</p>)}
          {!round.evidence.length && <p>{t("noEvidenceDiscovered")}</p>}
          {round.decisions.map((decision) => <p key={decision.label} className="text-sm"><strong>{decision.correct ? t("supportedDecision") : t("misconceptionReview")}:</strong> {t("decisionLine", { label: decision.label, explanation: decision.explanation })}</p>)}
          <p className="text-sm"><strong>{t("whatWeLearned")}</strong> {round.learned}</p>
          {round.decisions.some((d) => !d.correct) && <p className="text-sm text-amber-100">{t("reviewLine", { alternative: round.alternative })}</p>}
          {(round.overridden || round.hint) && <p className="text-xs text-slate-300">{round.overridden ? t("overriddenNote") : ""}{round.hint ? t("hintNote") : ""}</p>}
        </article>)}
        <p><strong>{t("transferLabel")}</strong> {snapshot.transferQuestion}</p>
        <h2 className="text-xl font-semibold">{t("contributionHeading")}</h2>
        <ul className="space-y-2">{[...room.players, ...room.departedPlayers].map((player) => <li key={player.id}>{t("contributionRow", { name: player.nickname, leftRoom: room.departedPlayers.some((p) => p.id === player.id) ? t("leftRoom") : "", score: player.score, evidence: player.contributions.evidence, answers: player.contributions.answers, actions: player.contributions.actions, resolution: player.contributions.resolution })}</li>)}</ul>
        <h3 className="text-lg font-semibold">{t("sourcesHeading")}</h3>
        <ul className="space-y-2">{debrief?.sources.map((source) => <li key={source.href}><Link href={source.href} className="text-cyan-200 underline">{source.title}</Link><span className="block text-xs text-slate-400">{t("practicedSections", { sections: source.sections.join(", ") })}</span></li>)}</ul>
        <h2 className="text-xl font-semibold">{t("objectivesHeading")}</h2>
        <ul className="space-y-2">{debrief?.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
        <h2 className="text-xl font-semibold">{t("reviewTopicsHeading")}</h2>
        <ul className="space-y-2">{(debrief?.reviewTopics ?? []).map((topic) => <li key={topic}>{topic}</li>)}</ul>
        {!debrief?.reviewTopics.length && <p>{t("noMistakes")}</p>}
        <ul className="space-y-2">{incident.debrief.map((line) => <li key={line}>{line}</li>)}</ul>
        {!finalIncident && (isHost ? <button disabled={disabled} onClick={() => void command("next")} className={buttonStyle}>{t("nextIncident")}</button> : <p>{t("hostStartsNext")}</p>)}
        {finalIncident && <p className="text-sm text-slate-300">{t("returnToMissions")}</p>}
      </section>}
    </div>
  );
}
