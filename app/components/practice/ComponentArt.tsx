import { useTranslations } from "next-intl";
import type { Artwork } from "@/lib/practice/types";
export function ComponentArt({ kind, small = false }: { kind: Artwork; small?: boolean }) {
  const t = useTranslations("componentArt");
  return <svg role="img" aria-label={t(kind)} viewBox="0 0 320 180" className={small ? "h-16 w-28 shrink-0" : "mx-auto h-44 w-full max-w-sm"} fill="none" stroke="#67e8f9" strokeWidth="4" strokeLinejoin="round">
    {kind === "ram" ? <><path d="M25 45h270v85H174v-12h-12v12H25z" fill="#134e4a" />{[50,105,205,260].map((x) => <rect key={x} x={x-15} y="65" width="35" height="40" rx="3" fill="#0b1220" />)}{Array.from({length:20},(_,i) => <path key={i} d={`M${35+i*13} 128v12`} stroke="#fbbf24" />)}</> :
      kind === "psu" ? <><rect x="65" y="25" width="190" height="120" rx="8" fill="#152238" /><circle cx="130" cy="85" r="43" /><path d="M95 85h70M130 50v70M102 57l56 56M102 113l56-56" /><rect x="195" y="63" width="35" height="42" fill="#0b1220" /><path d="M235 140l25 28M220 140l8 28M205 140l-4 28" stroke="#fbbf24" /></> :
      kind === "gpu" ? <><rect x="35" y="40" width="250" height="92" rx="6" fill="#134e4a" /><path d="M32 25v120M35 66H15M35 100H15" /><circle cx="118" cy="84" r="34" /><circle cx="218" cy="84" r="34" /><path d="M86 84h64M118 52v64M186 84h64M218 52v64" /><path d="M75 133h140v13H75z" fill="#fbbf24" stroke="#fbbf24" /></> :
      kind === "nic" ? <><rect x="50" y="40" width="220" height="95" fill="#134e4a" /><rect x="60" y="57" width="57" height="50" fill="#0b1220" /><path d="M72 85h32M82 94h15M48 25v120" /><rect x="169" y="65" width="43" height="40" fill="#0b1220" /><path d="M120 135h110v12H120z" fill="#fbbf24" stroke="#fbbf24" /></> :
      <><rect x="75" y="18" width="170" height="145" rx="12" fill="#152238" />{kind === "hdd" ? <><circle cx="158" cy="80" r="48" /><circle cx="158" cy="80" r="10" /><path d="M213 125l-55-45" stroke="#fbbf24" /></> : <><rect x="105" y="42" width="110" height="72" rx="5" fill="#134e4a" /><path d="M115 59h90M115 79h90M115 99h90" /></>}<path d="M105 149h45m15 0h45" stroke="#fbbf24" /></>}
  </svg>;
}
