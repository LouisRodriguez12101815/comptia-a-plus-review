import Link from "next/link";
export function MissionReturnLink() {
  return <p className="rounded-xl border border-teal-300/40 bg-slate-900 p-4 text-sm"><Link href="/practice-games/next-hop-mission" className="text-cyan-200 underline">Return to next-hop mission</Link><span className="ml-2 text-slate-300">Review supports the next application check; visiting this page does not earn points.</span></p>;
}
