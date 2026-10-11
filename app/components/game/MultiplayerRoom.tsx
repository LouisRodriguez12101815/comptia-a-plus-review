"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RoomSnapshot } from "@/lib/game/room-types";

type TimedSnapshot = RoomSnapshot & { receivedAt: number };

class RoomApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

async function roomApi<T = RoomSnapshot>(path: string, payload?: object, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/game/rooms${path}`, {
    method: payload ? "POST" : "GET", credentials: "same-origin", cache: "no-store",
    headers: payload ? { "Content-Type": "application/json" } : undefined,
    body: payload ? JSON.stringify(payload) : undefined, signal: signal ?? AbortSignal.timeout(7000),
  });
  const data = await response.json();
  if (!response.ok) throw new RoomApiError(response.status, data.error ?? "Could not update the room.");
  return data;
}

export function MultiplayerRoom({ mode, onBack }: { mode: "create" | "join"; onBack: () => void }) {
  const [snapshot, setSnapshot] = useState<TimedSnapshot | null>(null);
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [clock, setClock] = useState(0);
  const code = snapshot?.room.code;

  function accept(value: RoomSnapshot) {
    const receivedAt = performance.now();
    setSnapshot((previous) => !previous || previous.room.code !== value.room.code || value.room.version > previous.room.version || (value.room.version === previous.room.version && value.serverNow >= previous.serverNow)
      ? { ...value, receivedAt } : previous);
    sessionStorage.setItem("outage-ops-room", value.room.code);
  }

  useEffect(() => {
    if (!code) return;
    let stopped = false;
    let refreshing = false;
    let refreshAgain = false;
    let subscriptionTimer: ReturnType<typeof setTimeout>;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController | null = null;
    let client: import("twilio-sync").SyncClient | undefined;
    let document: import("twilio-sync").SyncDocument | undefined;

    function failure(cause: unknown) {
      if (stopped) return;
      if (cause instanceof RoomApiError && [401, 404, 410, 423].includes(cause.status)) {
        stopped = true;
        clearTimeout(timer);
        void client?.shutdown();
        setSnapshot(null);
        sessionStorage.removeItem("outage-ops-room");
        setError(cause.message);
        setConnectionError(null);
      } else setConnectionError(cause instanceof RoomApiError ? cause.message : "Connection interrupted. Retrying; room controls are paused.");
    }

    async function refresh() {
      if (stopped) return;
      if (refreshing) { refreshAgain = true; return; }
      refreshing = true;
      refreshAgain = false;
      clearTimeout(timer);
      controller = new AbortController();
      try {
        const value = await roomApi(`/${code}`, undefined, AbortSignal.any([controller.signal, AbortSignal.timeout(7000)]));
        if (!stopped) { accept(value); setConnectionError(null); }
      } catch (cause) { failure(cause); }
      finally {
        refreshing = false;
        // Heartbeats and timer reconciliation supplement real-time Sync notifications.
        if (!stopped) timer = setTimeout(refresh, refreshAgain ? 0 : 10_000);
      }
    }

    async function subscribe() {
      try {
        const credentials = await roomApi<{ token: string; document: string; renewable: boolean }>(`/${code}/token`, {});
        const { SyncClient } = await import("twilio-sync");
        if (stopped) return;
        client = new SyncClient(credentials.token);
        let tokenRefresh: Promise<void> | undefined;
        let canRenew = credentials.renewable;
        const renew = () => {
          if (!canRenew || stopped) return;
          tokenRefresh ??= roomApi<{ token: string; renewable: boolean }>(`/${code}/token`, {})
            .then(async (value) => { canRenew = value.renewable; if (!stopped) await client?.updateToken(value.token); })
            .catch(failure).finally(() => { tokenRefresh = undefined; });
        };
        client.on("tokenAboutToExpire", renew);
        // A final token already covers the remaining room lifetime. Don't renew
        // short tokens on every about-to-expire event near room expiry.
        client.on("tokenExpired", () => canRenew ? renew() : failure(new RoomApiError(410, "This room has expired. Create a new room.")));
        client.on("connectionStateChanged", (state: string) => {
          if (stopped) return;
          if (state === "connected") void refresh();
          else setConnectionError("Reconnecting to multiplayer; room controls are paused.");
        });
        document = await client.document({ id: credentials.document, mode: "open_existing" });
        if (stopped) { document.close(); return; }
        document.on("updated", () => void refresh());
        document.on("removed", () => failure(new RoomApiError(410, "This room has expired. Create a new room.")));
        void refresh();
      } catch (cause) {
        failure(cause);
        document?.close();
        void client?.shutdown();
        if (!stopped) subscriptionTimer = setTimeout(subscribe, 5000);
      }
    }
    void refresh();
    void subscribe();
    return () => { stopped = true; clearTimeout(timer); clearTimeout(subscriptionTimer); controller?.abort(); document?.close(); void client?.shutdown(); };
  }, [code]);

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
      void roomApi(`/${code}`).then(accept).catch(() => setConnectionError("Connection interrupted. Retrying; room controls are paused."));
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
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not leave the room."); }
    finally { setBusy(false); }
  }

  async function enter(resume = false) {
    setBusy(true); setError(null);
    try {
      const saved = resume ? sessionStorage.getItem("outage-ops-room") : null;
      if (resume && !saved) throw new Error("No previous room in this browser. Create or join one below.");
      accept(resume ? await roomApi(`/${saved}`) : mode === "create"
        ? await roomApi("", { nickname }) : await roomApi(`/${roomCode}/join`, { nickname }));
      setConnectionError(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not enter the room."); }
    finally { setBusy(false); }
  }

  async function command(action: "ready" | "start" | "actions" | "advance" | "evidence" | "hint" | "role-action" | "next" | "continue-evidence", payload: object = {}) {
    if (!code || busy || connectionError) return;
    setBusy(true); setError(null);
    try { accept(await roomApi(`/${code}/${action}`, { incidentIndex: snapshot?.room.incidentIndex, stepIndex: snapshot?.room.stepIndex, ...payload })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update the room."); }
    finally { setBusy(false); }
  }

  const buttonStyle = "rounded-full bg-cyan-300 px-5 py-2.5 font-semibold text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40";

  if (!snapshot) {
    return (
      <section className="mx-auto max-w-xl rounded-[2rem] border border-cyan-300/25 bg-slate-900/90 p-6 sm:p-8">
        <button onClick={onBack} className="text-cyan-200">← Mission select</button>
        <h1 className="mt-5 text-3xl font-semibold">{mode === "create" ? "Create a response room" : "Join the incident team"}</h1>
        <p className="mt-3 text-slate-300">Work through DNS and DHCP incidents together. Each responder discovers part of the evidence. Share your findings by voice or chat while you play.</p>
        {error && <p role="alert" className="mt-4 rounded-xl bg-rose-400/10 p-3 text-rose-200">{error}</p>}
        <form onSubmit={(event) => { event.preventDefault(); void enter(); }} className="mt-6 space-y-5">
          {mode === "join" && <label className="block">Room code<input value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase().replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, "").slice(0, 6))} maxLength={6} autoCapitalize="characters" autoComplete="off" required className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 p-3 font-mono tracking-widest" /></label>}
          <label className="block">Call sign<input value={nickname} onChange={(event) => setNickname(event.target.value)} minLength={2} maxLength={16} autoComplete="nickname" required className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 p-3" /></label>
          <button disabled={busy || nickname.trim().length < 2 || (mode === "join" && roomCode.length !== 6)} className={`${buttonStyle} w-full`}>{busy ? "Connecting…" : mode === "create" ? "Create room" : "Join room"}</button>
        </form>
        <button disabled={busy} onClick={() => void enter(true)} className="mt-5 text-sm text-cyan-200">Resume previous room</button>
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
  const ownAction = actions.find((action) => action.playerId === viewerId);
  const allReady = room.players.length >= 1 && room.players.every((player) => player.ready);
  const foundEvidence = self.evidenceStatus.assigned === self.evidenceStatus.discovered;
  const evidenceWait = evidenceGate.continueAvailableAt === null ? 0 : Math.max(0, Math.ceil((evidenceGate.continueAvailableAt - estimatedNow) / 1000));
  const ownRoleAction = room.usefulActions.find((action) => action.playerId === viewerId);
  const finalIncident = room.incidentIndex + 1 >= incident.count || room.result === "timeout" || room.result === "uptime";
  const disabled = busy || !!connectionError;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button disabled={busy} onClick={() => void leave()} className="text-cyan-200">Leave room</button>
        <p className="font-mono text-xl tracking-widest" aria-label="Room code">{room.code}</p>
        <p className="text-sm text-slate-300">Team score {room.score} · Uptime {room.uptime}%</p>
      </div>
      {error && <p role="alert" className="rounded-xl bg-rose-400/10 p-3 text-rose-200">{error}</p>}
      {connectionError && <p role="status" className="rounded-xl bg-amber-400/10 p-3 text-amber-200">{connectionError}</p>}
      <section aria-label="Live scoreboard" className="rounded-2xl border border-teal-300/25 bg-slate-900 p-5">
        <h2 className="text-xl font-semibold">Team scoreboard</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <p>Team points <strong className="block text-2xl text-cyan-200">{room.score}</strong></p>
          <p>Uptime score <strong className="block text-2xl text-emerald-200">{room.uptimeScore}/1000</strong></p>
          <p>Streak <strong className="block text-2xl text-amber-200">{room.streak} · ×{room.streakMultiplier}</strong></p>
          <p>Incident timer <strong className="block text-2xl">{room.status === "playing" ? `${remaining}s` : "—"}</strong></p>
        </div>
        <p className="mt-3 text-sm text-slate-300">Phase: {room.phase} · Hint penalties: −{room.hintPenalties} · Best streak: {room.bestStreak}</p>
        <p className="mt-2 text-sm">Your role: <strong>{role.name}</strong> — {role.responsibility}</p>
        <p className="mt-3 text-xs text-slate-400">Team decisions score once when the host continues: 100 × streak (maximum ×3) for a clean decision; 50 if the team finds the correct answer with mistakes. Individual contributions are separate. Each mistake costs 5% uptime and 5 seconds. A shared hint costs 25 team points.</p>
      </section>
      <section className="rounded-[2rem] border border-cyan-300/25 bg-slate-900/90 p-6">
        <h2 className="text-xl font-semibold">Incident team ({room.players.length}/8)</h2>
        <ul className="mt-4 space-y-2" aria-label="Players">
          {room.players.map((player) => <li key={player.id} className="flex flex-wrap justify-between gap-2 rounded-xl bg-slate-950 p-3">
            <span>{player.nickname}{player.id === viewerId ? " (you)" : ""}{player.isHost ? " · Host" : ""}</span>
            <span className="text-sm text-cyan-100">{player.role} · {player.connected ? "Connected" : "Disconnected"} · {player.ready ? "Ready" : "Not ready"} · Contribution {player.score}</span>
            <span className="w-full text-xs text-slate-300">Evidence {player.contributions.evidence} · Correct answers {player.contributions.answers} · Role actions {player.contributions.actions} · Resolution {player.contributions.resolution}{room.status === "playing" ? ` · Evidence: ${player.evidenceStatus.state === "not-required" ? "Complete (no assigned items)" : player.evidenceStatus.state === "disconnected" ? "Disconnected (does not block answers)" : player.evidenceStatus.state} · ${player.evidenceStatus.discovered}/${player.evidenceStatus.assigned} items` : ""}</span>
          </li>)}
        </ul>
        {room.status === "lobby" && <div className="mt-5 flex flex-wrap gap-3">
          <button disabled={disabled} onClick={() => void command("ready", { ready: !self.ready })} className={buttonStyle}>{self.ready ? "Mark unready" : "Mark ready"}</button>
          {isHost && <button disabled={disabled || !allReady} onClick={() => void command("start")} className={buttonStyle}>Start mission</button>}
          <p className="w-full text-sm text-slate-300">{allReady ? "All players are ready. The host can start." : "Every player must mark ready before the host can start."}</p>
        </div>}
      </section>

      {room.status === "lobby" && <section className="rounded-2xl border border-slate-700 p-6"><h1 className="text-2xl font-semibold">Response lobby</h1><p className="mt-3 text-slate-300">Share code {room.code}. Tackle {incident.count} incidents with a shared two-minute timer per incident. Roles rotate after each incident. A solo responder receives all evidence; teams receive complementary clues to discuss. Rooms expire 30 minutes after creation.</p></section>}

      {room.status === "playing" && <section className="space-y-5 rounded-[2rem] border border-cyan-300/25 bg-slate-900/90 p-6 sm:p-8">
        <div className="flex flex-wrap justify-between gap-3"><p className="text-cyan-300">Incident {room.incidentIndex + 1} · {room.phase}</p><p aria-label="Time remaining" className="font-mono">Time {remaining}s</p></div>
        <h1 className="text-3xl font-semibold">{room.phase === "briefing" ? incident.title : step?.title}</h1>
        {room.phase === "briefing" ? <><p>{incident.ticket}</p><p className="text-cyan-100">{incident.objective}</p><p role="status" className="text-xl font-semibold">Mission begins in {countdown}s</p></> : step && <>
          <section className="space-y-3 rounded-xl border border-teal-300/25 p-4" aria-label="Your evidence and responsibility">
            <h2 className="font-semibold">Discover and discuss your evidence</h2>
            <p className="text-sm text-slate-300">Discover and discuss each required evidence item. Teammates with the same item can cover for one another. If someone is absent or idle, the host can continue after the 15-second timeout.</p>
            {step.assignedEvidence.length === 0 && <p role="status" className="text-cyan-100">No evidence is assigned to you for this question. Your evidence requirement is complete; no discovery points are awarded.</p>}
            <ul className="space-y-3" aria-label="Your assigned evidence">{step.assignedEvidence.map((item) => <li key={item.id} className="rounded-xl bg-slate-950 p-4">
              <h3 className="font-semibold">{item.label}</h3>
              <button data-evidence-id={item.id} disabled={disabled || remaining === 0} onClick={() => void command("evidence", { itemId: item.id })} className={buttonStyle}>{item.discovered ? "Review assigned evidence" : "Discover assigned evidence"}</button>
              {item.text && <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm text-cyan-100">{item.text}</pre>}
            </li>)}</ul>
            {step.assignedEvidence.length > 0 && <p className="text-xs text-slate-300">Discovery contributes +10 once per question. Shared items already discovered by a teammate satisfy your requirement; you may still review your assigned item.</p>}
            {foundEvidence && !ownRoleAction && <div className="flex flex-wrap gap-3">
              <button disabled={disabled || remaining === 0} onClick={() => void command("role-action", { actionId: role.actionId })} className={buttonStyle}>{role.action} (+20)</button>
              <button disabled={disabled || remaining === 0} onClick={() => void command("role-action", { actionId: "restart-shared-equipment" })} className="rounded-full border border-rose-400/50 px-4 py-2 text-sm text-rose-200">Restart shared equipment without checking (risky)</button>
            </div>}
            {ownRoleAction && <p role="status" className="text-sm">{ownRoleAction.useful ? "Role contribution recorded: +20. Explain your finding to the team." : "Unsupported change: uptime −5%, timer −5s. Review the evidence before answering."}</p>}
          </section>
          <button disabled={disabled || room.hintUsed || remaining === 0} onClick={() => void command("hint")} className="rounded-full border border-amber-300/40 px-4 py-2 text-sm text-amber-200">{room.hintUsed ? "Shared hint unlocked" : "Ask for a shared hint (−25 team points)"}</button>
          {step.hint && <p role="status" className="rounded-xl bg-amber-400/10 p-4 text-amber-100">Mentor hint: {step.hint}</p>}
          <h2 className="text-lg font-semibold">{step.prompt}</h2>
          <section className="space-y-2 rounded-xl bg-slate-950 p-4" aria-label="Evidence progress">
            <h3 className="font-semibold">Required evidence</h3>
            <ul className="space-y-2">{evidenceGate.items.map((item) => <li key={item.id}>{item.label}: {item.discovered ? "Discovered" : item.required ? "Outstanding" : "Not required (no connected owner)"} — {item.owners.length ? item.owners.map((owner) => `${owner.nickname} (${owner.discovered ? "discovered" : owner.connected ? "awaiting discovery" : "disconnected"})`).join(", ") : "No assigned responder"}</li>)}</ul>
            {!evidenceGate.canAnswer && !ownAction && <p role="status" className="text-amber-100">{!foundEvidence ? "Discover your evidence to submit an answer." : "Required evidence is outstanding. The host can continue when the timeout ends."}</p>}
            {evidenceGate.continued ? <p role="status" className="text-amber-100">The host continued with current evidence. Missing responders can rejoin and discover their evidence; their points are not awarded automatically.</p> : <>
              <p role="status" className="text-sm text-cyan-100">{evidenceWait > 0 ? `Host may continue with current evidence in ${evidenceWait}s.` : "Evidence timeout reached. The host may continue with current evidence."}</p>
              {isHost && <button disabled={disabled || !foundEvidence || evidenceWait > 0 || remaining === 0} onClick={() => void command("continue-evidence")} className={buttonStyle}>Continue with current evidence</button>}
            </>}
          </section>
          <div className="grid gap-3 sm:grid-cols-2">{step.choices.map((choice) => <button key={choice.id} data-answer-id={choice.id} disabled={disabled || !evidenceGate.canAnswer || !!ownAction || remaining === 0} aria-pressed={ownAction?.answerId === choice.id} onClick={() => void command("actions", { answerId: choice.id })} className="min-h-20 rounded-xl border border-slate-600 bg-slate-950 p-4 text-left hover:border-cyan-300 disabled:opacity-60">{choice.label}</button>)}</div>
          {ownAction && <div role="status" className={`rounded-xl p-4 ${ownAction.correct ? "bg-emerald-400/10 text-emerald-100" : "bg-rose-400/10 text-rose-100"}`}><p className="font-semibold">{ownAction.correct ? "Correct diagnostic move" : "Not the best next move"}</p><p className="mt-2">{ownAction.explanation}</p></div>}
          <p className="text-sm text-slate-300">Answers received: {actions.length}/{room.players.filter((player) => player.connected).length} connected players</p>
          {evidenceGate.outstandingAnswers.length > 0 && <p className="text-sm text-amber-100">Answers outstanding: {evidenceGate.outstandingAnswers.join(", ")}{evidenceGate.continued ? " (host may proceed after answering)" : ""}</p>}
          {isHost ? <button disabled={disabled || !evidenceGate.canAdvance || remaining === 0} onClick={() => void command("advance", { stepIndex: room.stepIndex })} className={buttonStyle}>Continue mission</button> : <p className="text-sm text-cyan-200">The host continues after answering and receiving teammate answers, or after choosing to continue with current evidence.</p>}
        </>}
      </section>}

      {room.status === "results" && <section className="space-y-4 rounded-[2rem] border border-teal-300/30 bg-slate-900 p-6">
        <h1 className="text-3xl font-semibold">{finalIncident ? "Final team debrief" : "Incident debrief"}</h1>
        <p className="text-xl">{room.result === "resolved" ? "Incident resolved" : room.result === "timeout" ? "Time expired" : room.result === "uptime" ? "Uptime exhausted" : "Incident needs further investigation"}</p>
        <p>Team outcome: {debrief?.teamOutcome === "resolved" ? "All completed incidents resolved" : "Review needed"} · Team score {room.score} · Uptime {room.uptime}% ({debrief?.uptimeScore}/1000) · Best streak {room.bestStreak} · Hints −{room.hintPenalties}</p>
        <ul className="space-y-2" aria-label="Incident outcomes">{room.outcomes.map((outcome) => <li key={outcome.incidentId}>{outcome.incidentId}: {outcome.result} · {outcome.score} team points · {outcome.mistakes} mistakes · {outcome.hints} hints</li>)}</ul>
        <h2 className="text-xl font-semibold">Individual contribution breakdown</h2>
        <ul className="space-y-2">{[...room.players, ...room.departedPlayers].map((player) => <li key={player.id}>{player.nickname}{room.departedPlayers.some((p) => p.id === player.id) ? " (left room)" : ""}: {player.score} total — evidence {player.contributions.evidence}, correct answers {player.contributions.answers}, useful actions {player.contributions.actions}, resolution {player.contributions.resolution}</li>)}</ul>
        <h3 className="text-lg font-semibold">Source notes and labs practiced</h3>
        <ul className="space-y-2">{debrief?.sources.map((source) => <li key={source.href}><Link href={source.href} className="text-cyan-200 underline">{source.title}</Link><span className="block text-xs text-slate-400">Practiced sections: {source.sections.join(", ")}</span></li>)}</ul>
        <h2 className="text-xl font-semibold">CompTIA objectives practiced</h2>
        <ul className="space-y-2">{debrief?.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
        <h2 className="text-xl font-semibold">Recommended review topics</h2>
        <ul className="space-y-2">{(debrief?.reviewTopics.length ? debrief.reviewTopics : incident.reviewTopics).map((topic) => <li key={topic}>{topic}</li>)}</ul>
        <ul className="space-y-2">{incident.debrief.map((line) => <li key={line}>{line}</li>)}</ul>
        {!finalIncident && (isHost ? <button disabled={disabled} onClick={() => void command("next")} className={buttonStyle}>Next incident · Rotate roles</button> : <p>The host starts the next incident and rotates roles.</p>)}
        {finalIncident && <p className="text-sm text-slate-300">Return to mission select to create another room or play Guided Demo.</p>}
      </section>}
    </div>
  );
}
