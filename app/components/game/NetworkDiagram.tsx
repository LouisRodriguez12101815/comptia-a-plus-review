import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { NetworkDiagram as Diagram } from "@/lib/game/network-diagram";

export function NetworkDiagram({ diagram }: { diagram: Diagram }) {
  const t = useTranslations("networkDiagram");
  return <figure aria-label={t("figureAria")} className="space-y-4 rounded-2xl border border-cyan-300/30 bg-slate-950 p-4">
    <figcaption className="text-lg font-semibold">{diagram.title}</figcaption>
    <p className="text-sm text-slate-300">{diagram.description}</p>
    <p className="rounded-xl border-l-4 border-cyan-300 bg-cyan-300/10 p-3 text-sm text-cyan-100">{t("investigating", { path: diagram.path })}</p>
    <ol aria-label={t("pathAria")} className="flex flex-col gap-2 md:flex-row md:items-stretch">
      {diagram.nodes.map((node, index) => <li key={node.id} className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row">
        <div className="min-w-0 flex-1 rounded-xl border-2 border-cyan-400/60 bg-slate-900 p-3">
          <p className="text-xs uppercase tracking-wide text-cyan-200">{node.kind}</p>
          <h3 className="mt-1 font-semibold">{node.label}</h3>
          {node.details.map((detail) => <p key={detail} className="mt-2 break-words text-xs leading-relaxed text-slate-200">{detail}</p>)}
        </div>
        {index < diagram.nodes.length - 1 && <span aria-hidden="true" className="self-center text-xl font-bold text-cyan-300"><span className="md:hidden">↕</span><span className="hidden md:inline">↔</span></span>}
      </li>)}
    </ol>
    <details className="text-sm text-slate-300"><summary className="cursor-pointer text-cyan-200">{t("branches")}</summary>
      <ul className="mt-3 space-y-2">{[...diagram.links, ...diagram.context].map((line) => <li key={line}>{line}</li>)}</ul>
    </details>
    <section aria-label={t("annotationsAria")} className="space-y-2 border-t border-slate-700 pt-3">
      <h3 className="font-semibold">{t("cluesHeading")}</h3>
      {diagram.annotations.length ? diagram.annotations.map((a) => <p key={a.id} className="rounded-xl border-l-4 border-amber-300 bg-amber-300/10 p-3 text-sm"><strong>{a.label}: </strong>{a.text}</p>) : <p className="text-sm text-slate-400">{t("cluesEmpty")}</p>}
    </section>
    <details className="text-xs text-slate-400"><summary className="cursor-pointer">{t("sources")}</summary>
      <ul className="mt-2 space-y-2">{diagram.sources.map((s) => <li key={s.href}><Link className="text-cyan-200 underline" href={s.href}>{s.title}</Link> · {s.path} · {s.sections.join(", ")}</li>)}</ul>
    </details>
  </figure>;
}
