"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DeviceIcon } from "@/app/components/icons";

const devices = [
  { id: "laptop", x: 24, label: "deviceLaptop", hint: "deviceLaptopHint" },
  { id: "switch", x: 124, label: "deviceSwitch", hint: "deviceSwitchHint" },
  { id: "router", x: 224, label: "deviceRouter", hint: "deviceRouterHint" },
  { id: "server", x: 324, label: "deviceServer", hint: "deviceServerHint" },
] as const;

export function InteractiveLabDiagram() {
  const t = useTranslations("homePage");
  const [active, setActive] = useState("router");
  const selected = devices.find((device) => device.id === active) ?? devices[2];
  return (
    <div className={`interactive-lab-diagram active-${active}`}>
      <svg viewBox="0 0 420 120" role="img" aria-label={t("diagramLabel")} className="w-full">
        <path d="M72 50H348" className="stroke-slate-800" strokeWidth="3" strokeLinecap="round" />
        <path d="M72 50H348" className="stroke-slate-700" strokeWidth="1" strokeDasharray="2 8" strokeLinecap="round" />
        <g className="track-accent-text">
          {devices.map((device) => (
            <g key={device.id} role="button" tabIndex={0} aria-label={t(device.label)} onMouseEnter={() => setActive(device.id)} onFocus={() => setActive(device.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setActive(device.id); }} className={`lab-device ${active === device.id ? "is-active" : ""}`}>
              <DeviceIcon name={device.id} x={device.x} y={26} />
              <title>{t(device.label)}</title>
            </g>
          ))}
        </g>
        <g className="fill-slate-400 font-mono text-[11px]" textAnchor="middle">
          {devices.map((device) => <text key={device.id} x={device.x + 24} y="92">{t(device.label)}</text>)}
        </g>
        <circle cx="372" cy="22" r="5" className="fill-emerald-400" />
        <text x="382" y="26" className="fill-slate-300 font-mono text-[10px]">{t("statusUp")}</text>
        <circle cx="72" cy="50" r="5" className="packet fill-teal-400" />
      </svg>
      <p className="mt-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-center text-xs text-slate-400">{t(selected.hint)}</p>
    </div>
  );
}
