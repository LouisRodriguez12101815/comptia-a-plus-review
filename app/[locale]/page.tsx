import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DeviceIcon } from "@/app/components/icons";
import { InteractiveLabDiagram } from "@/app/components/InteractiveLabDiagram";
import { StatusChip } from "@/app/components/StatusChip";
import { trackCounts, tracks } from "@/lib/tracks";
import { NetworkEnvironment } from "@/app/components/NetworkEnvironment";
import styles from "@/app/components/NetworkEnvironment.module.css";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("homePage");
  return (
    <div className={styles.home}>
      <NetworkEnvironment />
      <section className={styles.hero}>
        <div className={styles.copy}>
          <p className={styles.kicker}>{t("eyebrow")}</p>
          <h1 className={styles.title}>{t("productName")}</h1>
          <p className={styles.intent}>{t("motionIntent")}</p>
          <p className={styles.loop}>{t("motionLoop")}</p>
          <p className={styles.intro}>{t("intro")}</p>
          <div className={styles.actions}>
            <a href="#tracks-heading">{t("tracksHeading")}</a>
            <Link href="/performance">{t("motionPerformance")}</Link>
            <Link href="/methodology">{t("methodologyLink")}</Link>
          </div>
        </div>
      </section>
      <div className={`${styles.content} space-y-12`}>
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
                  className={`track-shell track-${track.id} group flex h-full flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-[var(--track-accent-line)] hover:shadow-[0_18px_50px_var(--track-glow)]`}
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
                  <span className="track-accent-text text-sm font-medium">
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
      <div className="max-w-xl rounded-2xl border border-slate-800 bg-slate-950 p-4"><InteractiveLabDiagram /></div>
      </div>
    </div>
  );
}
