import { useTranslations } from "next-intl";
import { cidr, dotted } from "@/lib/subnet/ipv4";
import { designGrade } from "@/lib/subnet/grading";
import type { Allocation, DesignMission } from "@/lib/subnet/types";
export function DesignVisuals({mission,allocations}:{mission:DesignMission;allocations:Record<string,Allocation>}){
  const t=useTranslations('designVisuals');
  const result=designGrade(mission,allocations),parent=cidr(mission.parent);
  return <div className="space-y-4">
    <figure aria-label={t("topologyAria")} className="rounded-2xl border border-cyan-300/40 bg-slate-950 p-4">
      <figcaption className="font-semibold">{t("caption", { title: mission.title, parent: mission.parent })}</figcaption>
      <svg viewBox="0 0 340 330" role="img" aria-label={t("diagramAria")} className="mx-auto w-full max-w-md">
        {[{id:'A',x:10,y:10,router:'R1',rx:90,ry:70,link:'L1'},{id:'B',x:10,y:145,router:'R2',rx:90,ry:180,link:'L2'},{id:'C',x:10,y:270,router:'R3',rx:90,ry:290,link:'L3'}].map(n=><g key={n.id}>
          <path d={`M70 ${n.y+25}L${n.rx} ${n.ry}L220 180`} fill="none" stroke="#67e8f9" strokeWidth="2"/><rect x={n.x} y={n.y} width="60" height="48" rx="8" fill="#152238" stroke="#5eead4"/><text x={n.x+7} y={n.y+20} fill="#f1f5f9" fontSize="13">{t("lanLabel", { id: n.id })}</text><text x={n.x+5} y={n.y+37} fill="#5eead4" fontSize="11">{t("usable", { hosts: mission.requirements.find(r=>r.id===n.id)!.hosts })}</text>
          <circle cx={n.rx} cy={n.ry} r="20" fill="#152238" stroke="#67e8f9"/><text x={n.rx-10} y={n.ry+4} fill="#f1f5f9" fontSize="13">{n.router}</text><text x="145" y={(n.ry+180)/2-5} fill="#fbbf24" fontSize="12">{t("linkLabel", { link: n.link })}</text>
        </g>)}
        <circle cx="220" cy="180" r="22" fill="#152238" stroke="#67e8f9"/><text x="210" y="184" fill="#f1f5f9" fontSize="13">R4</text><path d="M242 180H272" stroke="#67e8f9" strokeWidth="2"/><rect x="272" y="155" width="62" height="48" rx="8" fill="#152238" stroke="#5eead4"/><text x="279" y="175" fill="#f1f5f9" fontSize="13">{t("lanLabel", { id: "D" })}</text><text x="275" y="192" fill="#5eead4" fontSize="11">{t("usable", { hosts: mission.requirements.find(r=>r.id==='D')!.hosts })}</text>
      </svg>
      <p className="text-sm text-slate-300">{t("topologyNote")}</p>
    </figure>
    <figure aria-label={t("addressAria")} className="space-y-3 rounded-2xl border border-teal-300/40 bg-slate-950 p-4">
      <figcaption className="font-semibold">{t("addressCaption", { parent: mission.parent, size: parent.size })}</figcaption>
      <svg viewBox="0 0 800 75" className="w-full" role="img" aria-label={t("spaceAria")}>
        <rect x="0" y="5" width="800" height="36" rx="4" fill="#334155"/>
        {result.blocks.filter(b=>b.block.start>=parent.start&&b.block.end<=parent.end).map((b,i)=><rect key={b.id} x={800*(b.block.start-parent.start)/parent.size} y={5+i%2*5} width={Math.max(1,800*b.block.size/parent.size)} height="26" fill={result.errors.some(e=>e.id===b.id)?'#fb7185':'#5eead4'} stroke="#0f172a"/>)}
        <text x="0" y="66" fontSize="14" fill="#cbd5e1">{parent.network}</text><text x="800" y="66" textAnchor="end" fontSize="14" fill="#cbd5e1">{parent.broadcast}</text>
      </svg>
      <p className="text-sm text-slate-300">{t("spaceLegend")}</p>
      <ul className="space-y-1 text-sm">{result.blocks.map(b=><li key={b.id} className={result.errors.some(e=>e.id===b.id)?'text-rose-100':'text-teal-100'}>{t("blockRow", { id: b.id, network: b.block.network, prefix: b.block.prefix, end: dotted(b.block.end), capacity: b.block.capacity, status: result.errors.some(e=>e.id===b.id)?t("statusCheck"):t("statusProposed") })}</li>)}</ul>
      <p>{result.remaining===null?t("remainingPending"):t("allocatedRemaining", { allocated: result.allocated, remaining: result.remaining })}</p>
    </figure>
  </div>;
}
