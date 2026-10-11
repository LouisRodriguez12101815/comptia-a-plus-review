import { useId } from "react";
import type { PacketEffect, Scenario } from "@/lib/practice/types";
export function PacketDiagram({ scenario, effect, decisionId }: { scenario: Scenario; effect?: PacketEffect; decisionId: string }) {
  const id = useId();
  const current = scenario.nodes.findIndex((node) => node.id === (effect?.nodeId ?? "source"));
  function drawing(vertical: boolean) {
    const arrow = `${id}-${vertical ? "vertical" : "horizontal"}`;
    const width = vertical ? 340 : 780, height = vertical ? scenario.nodes.length * 78 + 20 : 150;
    return <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className={vertical ? "mx-auto w-full max-w-sm sm:hidden" : "hidden w-full sm:block"}>
      <defs><marker id={arrow} markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3z" fill="#67e8f9" /></marker></defs>
      {scenario.nodes.map((node, index) => {
        const x = vertical ? 30 : 8 + index * (760 / scenario.nodes.length), y = vertical ? 8 + index * 78 : 20;
        const nodeWidth = vertical ? 280 : 740 / scenario.nodes.length;
        return <g key={node.id}>
          {index < scenario.nodes.length - 1 && <path d={vertical ? `M170 ${y+59}V${y+77}` : `M${x+nodeWidth} 50h${760/scenario.nodes.length-nodeWidth-2}`} stroke="#67e8f9" strokeWidth="2" markerEnd={`url(#${arrow})`} />}
          <rect x={x} y={y} width={nodeWidth} height="58" rx="10" fill="#152238" stroke={index === current ? "#fbbf24" : "#566d8c"} strokeWidth="2" />
          <text x={x+12} y={y+24} fill="#f1f5f9" fontSize="16">{node.label}</text>
          <text x={x+12} y={y+44} fill="#b8c5d6" fontSize="12">{node.id.includes("switch") ? "Ethernet frame path" : node.id === "router" ? "Routing interfaces below" : "IPv4 host"}</text>
          {index === current && <g key={decisionId} className="practice-packet-arrival"><circle cx={x+nodeWidth-18} cy={y+15} r="7" fill="#fbbf24" /><text x={vertical ? 180 : x+12} y={vertical ? y+42 : 112} fill="#fbbf24" fontSize="12">Packet here</text></g>}
        </g>;
      })}
    </svg>;
  }
  return <figure aria-label="Packet network diagram" className="space-y-3 rounded-2xl border border-cyan-300/30 bg-slate-950 p-4">
    <figcaption className="font-semibold">{scenario.title}</figcaption>
    <p className="text-sm text-slate-300">{scenario.description}</p>
    {drawing(false)}{drawing(true)}
    <p role="status" data-packet-location className="text-sm text-amber-100">Packet at {scenario.nodes[current]?.label} · IPv4 {scenario.sourceIp} → {scenario.destinationIp} · TTL {effect?.ttl ?? 64}</p>
    <p className="break-words text-sm" data-frame-state>Ethernet frame: {effect?.frameSource ? `${effect.frameSource} → ${effect.frameDestination}` : "not constructed / removed for IP processing"}</p>
    <dl className="grid gap-3 text-sm sm:grid-cols-2">{scenario.nodes.map((node) => <div key={node.id} className="rounded-xl bg-slate-900 p-3"><dt className="font-semibold text-cyan-100">{node.label}</dt><dd className="break-words">{node.ip}<br />MAC {node.mac}<br />{node.detail}</dd></div>)}</dl>
    {scenario.context.map((line) => <p key={line} className="text-xs text-slate-300">{line}</p>)}
    <div><h3 className="font-semibold">Routing information</h3><ul className="mt-2 space-y-1 font-mono text-xs sm:text-sm">{scenario.routes.map((route) => <li key={route} className="break-words">{route}</li>)}</ul></div>
    <details><summary className="cursor-pointer text-sm text-cyan-100">Scenario assumptions and cache state</summary><p className="mt-2 text-sm text-slate-300">{scenario.assumptions}</p></details>
  </figure>;
}
