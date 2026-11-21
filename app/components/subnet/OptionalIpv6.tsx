"use client";
import { useState, type SyntheticEvent } from "react";
import { subnetData } from "@/lib/subnet/catalog";
import { displayChoices } from "@/lib/subnet/session";

const checks = subnetData.optionalIpv6;

export function OptionalIpv6() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [orders, setOrders] = useState<Record<string, string[]>>({});

  function reveal(event: SyntheticEvent<HTMLDetailsElement>) {
    if (!event.currentTarget.open || Object.keys(orders).length > 0) return;
    setOrders(Object.fromEntries(checks.map((question) => [question.id, displayChoices(question.choices).map((choice) => choice.id)])));
  }

  return <details className="space-y-3 rounded-xl border border-slate-700 p-4" onToggle={reveal}>
    <summary className="cursor-pointer text-cyan-200">Optional IPv6 review · separate and unscored</summary>
    <p className="mt-3 text-sm text-slate-300">No points or IPv4 mission progress are awarded here.</p>
    {checks.map((question) => {
      const order = orders[question.id] ?? question.choices.map((choice) => choice.id);
      const choices = order.map((id) => question.choices.find((choice) => choice.id === id)).filter((choice) => choice !== undefined);
      return <section key={question.id} className="mt-3 space-y-2">
        <h3 className="font-semibold">{question.prompt}</h3>
        {choices.map((choice) => <button key={choice.id} className="mr-3 rounded-xl border border-slate-600 px-4 py-3 text-cyan-100" onClick={() => setAnswers({ ...answers, [question.id]: choice.id })}>{choice.label}</button>)}
        {answers[question.id] && <p role="status">{question.choices.find((choice) => choice.id === answers[question.id])?.explanation}</p>}
      </section>;
    })}
    <p className="mt-3 text-sm"><a href="https://www.rfc-editor.org/rfc/rfc4291.html" className="text-cyan-200 underline">RFC 4291: IPv6 addressing</a> · <a href="https://www.rfc-editor.org/rfc/rfc4213.html" className="text-cyan-200 underline">RFC 4213: transition and dual stack</a></p>
  </details>;
}
