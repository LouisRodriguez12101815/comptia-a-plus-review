import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DeviceIcon } from "@/app/components/icons";
import { StatusChip } from "@/app/components/StatusChip";
import { trackCounts, tracks } from "@/lib/tracks";

async function NetworkDiagram() {
  const t = await getTranslations("homePage");
  return (
    <svg
      viewBox="0 0 420 120"
      role="img"
      aria-label={t("diagramLabel")}
      className="w-full"
    >
      <path d="M72 50H348" className="stroke-slate-800" strokeWidth="3" strokeLinecap="round" />
      <path d="M72 50H348" className="stroke-slate-700" strokeWidth="1" strokeDasharray="2 8" strokeLinecap="round" />
      <g className="text-teal-400">
        <DeviceIcon name="laptop" x={24} y={26} />
        <DeviceIcon name="switch" x={124} y={26} />
        <DeviceIcon name="router" x={224} y={26} />
        <DeviceIcon name="server" x={324} y={26} />
      </g>
      <g className="fill-slate-400 font-mono text-[11px]" textAnchor="middle">
        <text x="48" y="92">{t("deviceLaptop")}</text>
        <text x="148" y="92">{t("deviceSwitch")}</text>
        <text x="248" y="92">{t("deviceRouter")}</text>
        <text x="348" y="92">{t("deviceServer")}</text>
      </g>
      <circle cx="372" cy="22" r="5" className="fill-emerald-400" />
      <text x="382" y="26" className="fill-slate-300 font-mono text-[10px]">{t("statusUp")}</text>
      <circle cx="72" cy="50" r="5" className="packet fill-teal-400" />
      <circle cx="72" cy="50" r="5" className="packet packet-late fill-teal-300" />
    </svg>
  );
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("homePage");
  return (
    <div className="space-y-12">
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-wide text-teal-300">{t("eyebrow")}</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white">CompTIA Review</h1>
          <p className="max-w-xl text-slate-300">
            {t("intro")}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <NetworkDiagram />
        </div>
      </section>

      <Link href="/coverage" className="block rounded-xl border border-teal-400/30 bg-teal-400/5 p-5 hover:border-teal-400">
        <span className="font-semibold text-teal-200">{t("coverageTitle")}</span>
        <span className="mt-2 block text-sm text-slate-300">{t("coverageText")}</span>
      </Link>

      <section aria-labelledby="tracks-heading" className="space-y-4">
        <h2 id="tracks-heading" className="text-lg font-medium text-white">
          {t("tracksHeading")}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {tracks.map((track) => {
            const counts = trackCounts(track);
            return (
              <li key={track.id}>
                <Link
                  href={track.href}
                  className="group flex h-full flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-teal-400"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-teal-400">
                      <DeviceIcon name={track.icon} width={44} height={44} />
                    </span>
                    <span className="rounded-full border border-slate-700 px-2.5 py-0.5 font-mono text-xs text-slate-300">
                      {track.code}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xl font-semibold text-white">{track.label}</p>
                    <p className="mt-2 text-sm text-slate-400">{track.description}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    {track.focus ? (
                      <>
                        <StatusChip state="ready">{t("chaptersCount", { count: counts.topics })}</StatusChip>
                        <span className="font-mono">{t("cardsCount", { count: counts.cards })}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{t("questionsCount", { count: counts.questions })}</span>
                      </>
                    ) : (
                      <>
                        <StatusChip state="ready">{t("labsCount", { count: counts.labs })}</StatusChip>
                        <StatusChip state="soon">{t("comingSoonTracks")}</StatusChip>
                      </>
                    )}
                  </div>
                  <span className="text-sm font-medium text-teal-300 group-hover:text-teal-200">
                    {t("openTrack")}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        aria-labelledby="game-heading"
        className="flex flex-col gap-4 rounded-2xl border border-amber-400/40 bg-amber-400/5 p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 id="game-heading" className="text-lg font-medium text-white">
            Outage Ops
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-300">
            {t("gameDescription")}
          </p>
        </div>
        <Link
          href="/game"
          className="shrink-0 rounded-full bg-amber-400 px-5 py-2 text-center font-semibold text-slate-950 hover:bg-amber-300"
        >
          {t("playGame")}
        </Link>
      </section>

      <p className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-400">
        {t("libraryNote")}
      </p>
    </div>
  );
}
