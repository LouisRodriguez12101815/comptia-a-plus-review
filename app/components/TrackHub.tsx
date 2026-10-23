import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DeviceIcon, ToolIcon } from "@/app/components/icons";
import { ProgressDashboard } from "@/app/components/ProgressDashboard";
import { SetTrackFocus } from "@/app/components/SetTrackFocus";
import { StatusChip } from "@/app/components/StatusChip";
import { TrackLink } from "@/app/components/TrackLink";
import { labs } from "@/lib/content";
import { getTrack, networkingChapters, splitTopics, toolStatuses, type TrackId } from "@/lib/tracks";

const tileBase =
  "flex h-full flex-col gap-3 rounded-2xl border p-5 transition";

export async function TrackHub({ trackId }: { trackId: TrackId }) {
  const t = await getTranslations("trackHub");
  const tTrack = await getTranslations("tracks");
  const tHeader = await getTranslations("header");
  const tCoverage = await getTranslations("coverageDashboard");
  const tMethods = await getTranslations("assessmentWorkflowPage");
  const tChapter = await getTranslations("networkChapters");
  const track = getTrack(trackId);
  const tools = toolStatuses(track);
  const { own, shared } = splitTopics(track);

  const workspaceLinks = track.focus ? [
    { label: "Overview", href: track.href },
    { label: "Topics", href: `${track.href}#topics` },
    { label: tTrack("tools.visuals.label"), href: `${track.href}/visuals` },
    { label: tTrack("tools.flashcards.label"), href: "/flashcards" },
    { label: tTrack("tools.quiz.label"), href: "/quiz" },
    { label: t("testModeTitle"), href: `/test?exam=${track.focus}` },
    { label: tHeader("final15"), href: `/final-15/${track.id}` },
  ] : [];

  const sequence = track.focus ? [
    { step: "01", label: "Learn", detail: "Read the mapped notes and objective scope.", href: `${track.href}#topics` },
    { step: "02", label: "Visualize", detail: "Use the interactive chapter visuals.", href: `${track.href}/visuals` },
    { step: "03", label: "Recall", detail: "Work the flashcards without looking back.", href: "/flashcards" },
    { step: "04", label: "Apply", detail: "Answer scenarios and timed questions.", href: `/test?exam=${track.focus}` },
    { step: "05", label: "Review", detail: "Finish with the mixed Final 15 review.", href: `/final-15/${track.id}` },
  ] : [];

  return (
    <div className={`track-shell track-${track.id}`}>
      <SetTrackFocus focus={track.focus} />
      <details className="study-sidebar mb-5 rounded-2xl p-3 lg:hidden">
        <summary className="cursor-pointer list-none font-medium text-white">
          Study Menu <span className="track-accent-text ml-2" aria-hidden="true">▾</span>
        </summary>
        <nav className="mt-3 grid gap-2" aria-label="Study workspace">
          {workspaceLinks.map((item) => (
            <Link key={item.label} href={item.href} className="rounded-xl border border-transparent px-3 py-2 text-sm text-slate-300">
              {item.label}
            </Link>
          ))}
        </nav>
      </details>
      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="study-sidebar sticky top-5 hidden h-fit rounded-2xl p-3 lg:block">
          <p className="track-accent-text px-3 pb-2 text-xs font-semibold uppercase tracking-[0.18em]">{track.code}</p>
          <nav className="grid gap-1" aria-label="Study workspace">
            {workspaceLinks.map((item) => (
              <Link key={item.label} href={item.href} className="rounded-xl border border-transparent px-3 py-2 text-sm text-slate-300">
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 space-y-10">

      <header className="track-workspace-hero rounded-3xl p-6 sm:p-8">
        <p className="text-sm text-slate-400">
          <Link href="/" className="hover:text-white">
            {tTrack("home")}
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="text-slate-100">{tTrack(`${track.id}.short`)}</span>
        </p>
        <div className="flex items-start gap-4">
          <div className="track-accent-border track-accent-surface track-accent-text hidden shrink-0 rounded-2xl border p-3 sm:block">
            <DeviceIcon name={track.icon} width={56} height={56} />
          </div>
          <div className="space-y-2">
            <p className="track-accent-text text-sm uppercase tracking-wide">
              {t.rich("certificationTrack", {
                code: track.code,
                mono: (chunks) => <span className="font-mono normal-case">{chunks}</span>,
              })}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white">{tTrack(`${track.id}.label`)}</h1>
            <p className="max-w-2xl text-slate-300">{tTrack(`${track.id}.description`)}</p>
          </div>
        </div>
      </header>

      {track.focus ? (
        <>
        <section aria-label="Study sequence" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {sequence.map((item) => (
            <Link key={item.step} href={item.href} className="study-sequence-step rounded-2xl p-4 transition hover:-translate-y-0.5">
              <span className="track-accent-text font-mono text-xs">{item.step}</span>
              <span className="mt-2 block font-semibold text-white">{item.label}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-400">{item.detail}</span>
            </Link>
          ))}
        </section>
        <section aria-label="Objective-first study workflow" className="grid gap-4 md:grid-cols-2">
          <Link href="/coverage" className="rounded-2xl border border-teal-400/40 bg-teal-400/5 p-5 hover:border-teal-400">
            <p className="text-xs font-medium uppercase tracking-wide text-teal-300">{track.code}</p>
            <h2 className="mt-2 text-lg font-semibold text-white">{tHeader("objectiveLab")}</h2>
            <p className="mt-2 text-sm text-slate-300">{tCoverage("intro")}</p>
          </Link>
          <Link href="/assessment-workflow" className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5 hover:border-teal-400">
            <p className="text-xs font-medium uppercase tracking-wide text-teal-300">{tHeader("methods")}</p>
            <h2 className="mt-2 text-lg font-semibold text-white">{tMethods("title")}</h2>
            <p className="mt-2 text-sm text-slate-300">{tMethods("metadataDescription")}</p>
          </Link>
        </section>
        </>
      ) : null}

      {track.focus && track.focus !== "all" ? (
        <section aria-labelledby="test-mode-heading" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-teal-400/40 bg-teal-400/5 p-5">
          <div>
            <h2 id="test-mode-heading" className="text-lg font-medium text-white">{t("testModeTitle")}</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-300">
              {t("testModeBody", { code: track.code })}
            </p>
          </div>
          <Link
            href={`/test?exam=${track.focus}`}
            className="track-accent-button inline-flex min-h-11 items-center rounded-full px-5 py-2 font-medium transition"
          >
            {t("startTest")}
          </Link>
        </section>
      ) : null}

      <section aria-labelledby="tools-heading" className="space-y-4">
        <h2 id="tools-heading" className="text-lg font-medium text-white">
          {t("studyTools")}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const inner = (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-teal-400">
                    <ToolIcon id={tool.id} width={26} height={26} />
                  </span>
                  <StatusChip state={tool.state}>{tTrack(`chips.${tool.chip.key}`, { count: tool.chip.count ?? 0 })}</StatusChip>
                </div>
                <div>
                  <p className="text-lg font-medium text-white">{tTrack(`tools.${tool.id}.label`)}</p>
                  <p className="mt-1 text-sm text-slate-400">{tTrack(`tools.${tool.id}.blurb`)}</p>
                </div>
              </>
            );
            return (
              <li key={tool.id}>
                {tool.state === "soon" && !tool.openable ? (
                  <div className={`${tileBase} border-dashed border-slate-700 bg-slate-900/30`}>
                    {inner}
                  </div>
                ) : (
                  <TrackLink
                    href={tool.href}
                    focus={tool.focus}
                    className={`${tileBase} ${
                      tool.state === "soon"
                        ? "border-dashed border-slate-700 bg-slate-900/30 hover:border-teal-400"
                        : "border-slate-800 bg-slate-900 hover:border-teal-400"
                    }`}
                  >
                    {inner}
                  </TrackLink>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {track.id === "networking" ? (
        <section aria-labelledby="chapters-heading" className="space-y-4">
          <div>
            <h2 id="chapters-heading" className="text-lg font-medium text-white">
              {t("chapterVisualsTitle")}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {t("chapterVisualsBody")}
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {networkingChapters.map((chapter) => (
              <li key={chapter.href}>
                <Link
                  href={chapter.href}
                  className="block h-full rounded-2xl border border-slate-800 bg-slate-900 p-4 hover:border-teal-400"
                >
                  <p className="text-xs uppercase tracking-wide text-teal-300">{tChapter(`${chapter.id}.label`)}</p>
                  <p className="mt-1 font-medium text-white">{tChapter(`${chapter.id}.title`)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {track.id === "ccna" ? (
        <section aria-labelledby="labs-heading" className="space-y-4">
          <div>
            <h2 id="labs-heading" className="text-lg font-medium text-white">
              {t("labsTitle")}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {t("labsBody")}
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {labs.map((lab) => (
              <li key={lab.slug}>
                <Link
                  href={`/labs/${lab.slug}`}
                  className="block h-full rounded-2xl border border-slate-800 bg-slate-900 p-4 hover:border-teal-400"
                >
                  <p className="text-xs uppercase tracking-wide text-teal-300">{lab.subtitle}</p>
                  <p className="mt-1 font-medium text-white">{lab.title}</p>
                  <p className="mt-2 text-sm text-slate-400">{lab.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {track.focus ? (
        <>
          <ProgressDashboard />

          <section id="topics" aria-labelledby="notes-heading" className="space-y-4">
            <h2 id="notes-heading" className="text-lg font-medium text-white">
              {t("chaptersInTrack")}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {own.map((topic) => (
                <li key={topic.id}>
                  <Link
                    href={`/notes/${topic.id}`}
                    className="block h-full rounded-2xl border border-slate-800 bg-slate-900 p-4 hover:border-teal-400"
                  >
                    <p className="text-xs uppercase tracking-wide text-teal-300">
                      {topic.weak ? t("weakArea", { chapter: topic.chapter }) : topic.chapter}
                    </p>
                    <p className="mt-1 font-medium text-white">{topic.title}</p>
                    <p className="mt-2 text-sm text-slate-400">{topic.summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {shared.length > 0 ? (
            <section aria-labelledby="shared-heading" className="space-y-4">
              <div>
                <h2 id="shared-heading" className="text-lg font-medium text-white">
                  {t("sharedTitle")}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {t("sharedBody")}
                </p>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {shared.map(({ topic, alsoIn }) => (
                  <li key={topic.id}>
                    <Link
                      href={`/notes/${topic.id}`}
                      className="block h-full rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-teal-400"
                    >
                      <p className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-teal-300">
                        {topic.chapter}
                        <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-2 py-0.5 normal-case tracking-normal text-cyan-200">
                          {t("alsoIn", { tracks: alsoIn.join(", ") })}
                        </span>
                      </p>
                      <p className="mt-1 font-medium text-white">{topic.title}</p>
                      <p className="mt-2 text-sm text-slate-400">{topic.summary}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
        </div>
      </div>
    </div>
  );
}
