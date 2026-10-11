"use client";

import { useMemo, useState } from "react";
import { cantReachWebsiteIncident } from "@/lib/game/incidents";
import { MultiplayerRoom } from "@/app/components/game/MultiplayerRoom";
import { shuffleAnswers } from "@/lib/game/answers";
import type { IncidentChoice } from "@/lib/game/types";

type Screen = "menu" | "guided" | "create" | "join";

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
  const [answers, setAnswers] = useState<IncidentChoice[]>([]);
  const [credited, setCredited] = useState(false);
  const [score, setScore] = useState(0);
  const [uptime, setUptime] = useState(100);
  const [hintVisible, setHintVisible] = useState(false);

  const step = incident.steps[stepIndex];
  const selectedAnswer = step?.choices.find((answer) => answer.id === selected);
  const isCorrect = selected !== null && selected === step?.correctAnswerId;
  const progress = useMemo(
    () => Math.round((stepIndex / incident.steps.length) * 100),
    [incident.steps.length, stepIndex],
  );

  function resetGuidedDemo() {
    setStepIndex(0);
    setSelected(null);
    setAnswers(shuffleAnswers(incident.steps[0].choices));
    setCredited(false);
    setScore(0);
    setUptime(100);
    setHintVisible(false);
    setScreen("guided");
  }

  function choose(choiceId: string) {
    if (selected !== null || !step || !step.choices.some((answer) => answer.id === choiceId)) return;
    setSelected(choiceId);
    if (choiceId === step.correctAnswerId) {
      if (!credited) {
        setScore((value) => value + (hintVisible ? 75 : 100));
        setCredited(true);
      }
    } else {
      setUptime((value) => Math.max(0, value - 5));
      setHintVisible(true);
    }
  }

  function tryAgain() {
    // Keep the hint, penalties, earned credit, and answer order for this question.
    setSelected(null);
  }

  function advance() {
    if (selected === null || !step) return;
    const nextStep = incident.steps[stepIndex + 1];
    setAnswers(nextStep ? shuffleAnswers(nextStep.choices) : []);
    setSelected(null);
    setCredited(false);
    setHintVisible(false);
    setStepIndex((value) => value + 1);
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
                {answers.map((choice) => {
                  const chosen = selected === choice.id;
                  const correct = selected !== null && choice.id === step.correctAnswerId;
                  return (
                    <button
                      key={choice.id}
                      onClick={() => choose(choice.id)}
                      disabled={Boolean(selected)}
                      aria-pressed={chosen}
                      data-answer-id={choice.id}
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
                <div role="status" aria-live="polite" className={`rounded-2xl border p-5 ${isCorrect ? "border-emerald-300/30 bg-emerald-400/10" : "border-rose-300/30 bg-rose-400/10"}`}>
                  <p className="font-semibold text-white">{isCorrect ? "Correct diagnostic move" : "Not the best next move"}</p>
                  <p className="mt-2 text-sm text-slate-200">{selectedAnswer?.explanation}</p>
                  <p className="mt-2 text-sm text-cyan-100"><strong>Mentor reasoning:</strong> {step.explanation}</p>
                  {!isCorrect && <p className="mt-3 text-sm text-amber-100"><strong>Mentor hint:</strong> {step.hint}</p>}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button onClick={tryAgain} className="rounded-full border border-cyan-300 px-5 py-2 font-semibold text-cyan-100 hover:bg-cyan-300/10">Try again</button>
                    <button onClick={advance} className="rounded-full bg-white px-5 py-2 font-semibold text-slate-950 hover:bg-cyan-100">Continue →</button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    );
  }

  if (screen === "create" || screen === "join") {
    return <MultiplayerRoom mode={screen} onBack={() => setScreen("menu")} />;
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
        <ModeCard eyebrow="2–8 responders" title="Create Room" description="Share a room code and lead a synchronized DNS incident with your team." action="Create a room" accent="teal" onClick={() => setScreen("create")} />
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
