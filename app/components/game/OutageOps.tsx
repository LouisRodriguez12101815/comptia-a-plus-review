"use client";

import { useMemo, useState } from "react";
import { cantReachWebsiteIncident } from "@/lib/game/incidents";

type Screen = "menu" | "guided" | "create" | "join" | "lobby";

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeRoomCode() {
  return Array.from({ length: 6 }, () =>
    ROOM_ALPHABET.charAt(Math.floor(Math.random() * ROOM_ALPHABET.length)),
  ).join("");
}

function LowPolyNetwork() {
  return (
    <div aria-hidden="true" className="relative mx-auto h-44 w-full max-w-xl overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-gradient-to-br from-slate-950 via-cyan-950 to-teal-900">
      <div className="absolute -left-8 -top-10 h-32 w-48 rotate-12 bg-cyan-400/10 [clip-path:polygon(0_0,100%_22%,66%_100%,14%_70%)]" />
      <div className="absolute -bottom-16 right-0 h-48 w-64 -rotate-6 bg-teal-300/10 [clip-path:polygon(17%_0,100%_24%,78%_100%,0_68%)]" />
      <div className="absolute left-1/2 top-8 h-16 w-16 -translate-x-1/2 rotate-45 border-4 border-cyan-200 bg-cyan-400 shadow-[0_0_32px_rgba(34,211,238,.45)]" />
      <div className="absolute left-[17%] top-[58%] h-10 w-10 rotate-45 border-2 border-cyan-200 bg-slate-800" />
      <div className="absolute right-[17%] top-[58%] h-10 w-10 rotate-45 border-2 border-amber-200 bg-amber-500 shadow-[0_0_24px_rgba(245,158,11,.55)]" />
      <div className="absolute left-[24%] top-[51%] h-1 w-[28%] -rotate-[12deg] bg-cyan-300" />
      <div className="absolute right-[24%] top-[51%] h-1 w-[28%] rotate-[12deg] bg-amber-300" />
    </div>
  );
}

export function OutageOps() {
  const incident = cantReachWebsiteIncident;
  const [screen, setScreen] = useState<Screen>("menu");
  const [stepIndex, setStepIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [uptime, setUptime] = useState(100);
  const [hintVisible, setHintVisible] = useState(false);
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [createdRoom, setCreatedRoom] = useState("");

  const step = incident.steps[stepIndex];
  const isCorrect = selected === step?.correctChoiceId;
  const progress = useMemo(
    () => Math.round((stepIndex / incident.steps.length) * 100),
    [incident.steps.length, stepIndex],
  );

  function resetGuidedDemo() {
    setStepIndex(0);
    setSelected(null);
    setScore(0);
    setUptime(100);
    setHintVisible(false);
    setScreen("guided");
  }

  function choose(choiceId: string) {
    if (selected) return;
    setSelected(choiceId);
    if (choiceId === step.correctChoiceId) {
      setScore((value) => value + (hintVisible ? 75 : 100));
    } else {
      setUptime((value) => Math.max(0, value - 5));
    }
  }

  function advance() {
    setSelected(null);
    setHintVisible(false);
    setStepIndex((value) => value + 1);
  }

  function createRoom() {
    if (nickname.trim().length < 2) return;
    setCreatedRoom(makeRoomCode());
    setScreen("lobby");
  }

  if (screen === "guided") {
    const complete = stepIndex >= incident.steps.length;
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => setScreen("menu")} className="text-sm text-cyan-200 hover:text-white">
            ← Mission select
          </button>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-100">Score {score}</span>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-100">Uptime {uptime}%</span>
          </div>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full bg-gradient-to-r from-cyan-400 to-teal-300 transition-all" style={{ width: `${complete ? 100 : progress}%` }} />
        </div>

        {complete ? (
          <section className="overflow-hidden rounded-[2rem] border border-teal-300/30 bg-slate-900/90 p-6 shadow-2xl shadow-cyan-950/40 sm:p-9">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-300">Incident resolved</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Ticket closed. The site is back.</h1>
            <p className="mt-3 text-slate-300">Mentor debrief: the strongest technicians prove each layer and verify the exact symptom after the repair.</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {incident.debrief.map((item) => (
                <li key={item} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-200">{item}</li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={resetGuidedDemo} className="rounded-full bg-cyan-300 px-5 py-2.5 font-semibold text-slate-950 hover:bg-cyan-200">Replay guided demo</button>
              <button onClick={() => setScreen("create")} className="rounded-full border border-cyan-300/50 px-5 py-2.5 font-semibold text-cyan-100 hover:bg-cyan-300/10">Create a live room</button>
            </div>
          </section>
        ) : (
          <section className="overflow-hidden rounded-[2rem] border border-cyan-300/25 bg-slate-900/90 shadow-2xl shadow-cyan-950/40">
            <div className="border-b border-slate-700 bg-slate-950/70 p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">{step.eyebrow}</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">{step.title}</h1>
              <p className="mt-3 max-w-2xl text-slate-300">{stepIndex === 0 ? incident.ticket : step.prompt}</p>
              {stepIndex === 0 && <p className="mt-2 text-sm text-cyan-100">Objective: {incident.objective}</p>}
            </div>
            <div className="space-y-5 p-6 sm:p-8">
              {step.evidence && <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl border border-cyan-400/20 bg-slate-950 p-4 font-mono text-sm text-cyan-100">{step.evidence}</pre>}
              <h2 className="text-lg font-semibold text-white">{step.prompt}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {step.choices.map((choice) => {
                  const chosen = selected === choice.id;
                  const correct = selected && choice.id === step.correctChoiceId;
                  return (
                    <button
                      key={choice.id}
                      onClick={() => choose(choice.id)}
                      disabled={Boolean(selected)}
                      className={`min-h-20 rounded-2xl border p-4 text-left transition ${correct ? "border-emerald-300 bg-emerald-400/15 text-emerald-50" : chosen ? "border-rose-300 bg-rose-400/15 text-rose-50" : "border-slate-700 bg-slate-950/60 text-slate-200 hover:border-cyan-300 hover:bg-cyan-300/10"}`}
                    >
                      {choice.label}
                    </button>
                  );
                })}
              </div>

              {!selected && (
                <button onClick={() => setHintVisible(true)} className="text-sm font-medium text-amber-200 hover:text-amber-100">Ask Mentor for a hint</button>
              )}
              {hintVisible && !selected && <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-50"><strong>Mentor:</strong> {step.hint}</div>}
              {selected && (
                <div className={`rounded-2xl border p-5 ${isCorrect ? "border-emerald-300/30 bg-emerald-400/10" : "border-rose-300/30 bg-rose-400/10"}`}>
                  <p className="font-semibold text-white">{isCorrect ? "Correct diagnostic move" : "Not the best next move"}</p>
                  <p className="mt-2 text-sm text-slate-200">{step.explanation}</p>
                  <button onClick={advance} className="mt-4 rounded-full bg-white px-5 py-2 font-semibold text-slate-950 hover:bg-cyan-100">Continue →</button>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    );
  }

  if (screen === "create") {
    return (
      <RoomForm
        title="Create a response room"
        subtitle="Choose your call sign and mission focus. Live synchronization is the next implementation milestone."
        nickname={nickname}
        onNickname={setNickname}
        onBack={() => setScreen("menu")}
        actionLabel="Create room"
        onSubmit={createRoom}
      />
    );
  }

  if (screen === "join") {
    return (
      <RoomForm
        title="Join the incident team"
        subtitle="Enter the six-character code shown on the host’s screen."
        nickname={nickname}
        onNickname={setNickname}
        roomCode={roomCode}
        onRoomCode={(value) => setRoomCode(value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6))}
        onBack={() => setScreen("menu")}
        actionLabel="Join room"
        onSubmit={() => setScreen("lobby")}
      />
    );
  }

  if (screen === "lobby") {
    const code = createdRoom || roomCode || "N7K4PX";
    return (
      <section className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-cyan-300/25 bg-slate-900/90 shadow-2xl shadow-cyan-950/40">
        <div className="bg-gradient-to-r from-cyan-950 to-teal-900 p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">Incident room</p>
          <p className="mt-2 font-mono text-4xl font-bold tracking-[0.25em] text-white">{code}</p>
        </div>
        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex items-center justify-between rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4">
            <div><p className="font-semibold text-white">{nickname || "Responder"}</p><p className="text-sm text-emerald-100">Incident Lead · Host</p></div>
            <span className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-bold text-emerald-950">READY</span>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-600 p-5 text-center text-sm text-slate-300">Waiting for another responder to join…</div>
          <p className="text-sm text-amber-100">The lobby interface is ready. Cross-device synchronization and reconnect handling are the next submission milestone.</p>
          <button onClick={() => setScreen("menu")} className="text-sm text-cyan-200 hover:text-white">← Leave room</button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-10 pb-10">
      <section className="grid items-center gap-8 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Multiplayer CompTIA training</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-white sm:text-6xl">Outage <span className="text-amber-400">Ops</span></h1>
          <p className="mt-4 max-w-xl text-lg text-slate-300">Diagnose the incident, protect company uptime, and prove the repair. Play a guided mission now or assemble a 2–8 player response team.</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-cyan-100">No login</span>
            <span className="rounded-full border border-teal-300/30 bg-teal-300/10 px-3 py-1 text-teal-100">Phone friendly</span>
            <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-amber-100">Original scenarios</span>
          </div>
        </div>
        <LowPolyNetwork />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <ModeCard eyebrow="Start instantly" title="Guided Demo" description="Walk the DNS incident with a mentor bot and learn why each troubleshooting step matters." action="Begin training" accent="cyan" onClick={resetGuidedDemo} />
        <ModeCard eyebrow="2–8 responders" title="Create Room" description="Choose the certification focus, share a room code, and lead the incident team." action="Create a room" accent="teal" onClick={() => setScreen("create")} />
        <ModeCard eyebrow="Room code" title="Join Team" description="Enter the code from your host and join from any phone or laptop." action="Join a room" accent="amber" onClick={() => setScreen("join")} />
      </section>

      <section className="rounded-[2rem] border border-slate-700 bg-slate-900/70 p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-white">How a mission works</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-4">
          {[["01", "Scope", "Find who and what is affected."], ["02", "Test", "Choose the strongest next diagnostic."], ["03", "Repair", "Fix the root cause, not the symptom."], ["04", "Verify", "Repeat the failed test and close the ticket."]].map(([number, title, copy]) => (
            <li key={number} className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4"><span className="font-mono text-sm text-cyan-300">{number}</span><h3 className="mt-2 font-semibold text-white">{title}</h3><p className="mt-1 text-sm text-slate-400">{copy}</p></li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function ModeCard({ eyebrow, title, description, action, accent, onClick }: { eyebrow: string; title: string; description: string; action: string; accent: "cyan" | "teal" | "amber"; onClick: () => void }) {
  const color = accent === "amber" ? "text-amber-300" : accent === "teal" ? "text-teal-300" : "text-cyan-300";
  return (
    <article className="flex min-h-64 flex-col rounded-[2rem] border border-slate-700 bg-slate-900/80 p-6 transition hover:-translate-y-1 hover:border-cyan-300/50">
      <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${color}`}>{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">{description}</p>
      <button onClick={onClick} className="mt-6 rounded-full bg-white px-4 py-2.5 font-semibold text-slate-950 hover:bg-cyan-100">{action}</button>
    </article>
  );
}

function RoomForm({ title, subtitle, nickname, onNickname, roomCode, onRoomCode, onBack, actionLabel, onSubmit }: { title: string; subtitle: string; nickname: string; onNickname: (value: string) => void; roomCode?: string; onRoomCode?: (value: string) => void; onBack: () => void; actionLabel: string; onSubmit: () => void }) {
  return (
    <section className="mx-auto max-w-xl rounded-[2rem] border border-cyan-300/25 bg-slate-900/90 p-6 shadow-2xl shadow-cyan-950/40 sm:p-8">
      <button onClick={onBack} className="text-sm text-cyan-200 hover:text-white">← Mission select</button>
      <h1 className="mt-5 text-3xl font-semibold text-white">{title}</h1>
      <p className="mt-2 text-slate-300">{subtitle}</p>
      <div className="mt-7 space-y-5">
        {onRoomCode && <label className="block"><span className="text-sm font-medium text-slate-200">Room code</span><input value={roomCode} onChange={(event) => onRoomCode(event.target.value)} inputMode="text" autoCapitalize="characters" placeholder="N7K4PX" className="mt-2 w-full rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 font-mono text-xl uppercase tracking-[0.25em] text-white outline-none focus:border-cyan-300" /></label>}
        <label className="block"><span className="text-sm font-medium text-slate-200">Call sign</span><input value={nickname} onChange={(event) => onNickname(event.target.value.slice(0, 16))} placeholder="Your nickname" className="mt-2 w-full rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" /></label>
        {!onRoomCode && <label className="block"><span className="text-sm font-medium text-slate-200">Mission focus</span><select className="mt-2 w-full rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" defaultValue="mixed"><option value="mixed">Mixed CompTIA response</option><option value="core1">A+ Core 1</option><option value="core2">A+ Core 2</option><option value="network">Network+</option></select></label>}
        <button onClick={onSubmit} disabled={nickname.trim().length < 2 || Boolean(onRoomCode && roomCode?.length !== 6)} className="w-full rounded-full bg-cyan-300 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40">{actionLabel}</button>
      </div>
    </section>
  );
}
