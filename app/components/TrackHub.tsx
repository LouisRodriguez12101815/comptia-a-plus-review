import Link from "next/link";
import { DeviceIcon, ToolIcon } from "@/app/components/icons";
import { ProgressDashboard } from "@/app/components/ProgressDashboard";
import { SetTrackFocus } from "@/app/components/SetTrackFocus";
import { StatusChip } from "@/app/components/StatusChip";
import { TrackLink } from "@/app/components/TrackLink";
import { labs } from "@/lib/content";
import { getTrack, networkingChapters, splitTopics, toolStatuses, type TrackId } from "@/lib/tracks";

const tileBase =
  "flex h-full flex-col gap-3 rounded-2xl border p-5 transition";

export function TrackHub({ trackId }: { trackId: TrackId }) {
  const track = getTrack(trackId);
  const tools = toolStatuses(track);
  const { own, shared } = splitTopics(track);

  return (
    <div className="space-y-10">
      <SetTrackFocus focus={track.focus} />

      <header className="space-y-4">
        <p className="text-sm text-slate-400">
          <Link href="/" className="hover:text-white">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="text-slate-100">{track.short}</span>
        </p>
        <div className="flex items-start gap-4">
          <div className="hidden shrink-0 rounded-2xl border border-slate-800 bg-slate-900 p-3 text-teal-400 sm:block">
            <DeviceIcon name={track.icon} width={56} height={56} />
          </div>
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-wide text-teal-300">
              Certification track · <span className="font-mono normal-case">{track.code}</span>
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white">{track.label}</h1>
            <p className="max-w-2xl text-slate-300">{track.description}</p>
          </div>
        </div>
      </header>

      {track.focus && track.focus !== "all" ? (
        <section aria-labelledby="test-mode-heading" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-teal-400/40 bg-teal-400/5 p-5">
          <div>
            <h2 id="test-mode-heading" className="text-lg font-medium text-white">Timed test mode</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-300">
              A practice exam weighted by the {track.code} objective domains, with a countdown on every question at real exam pace.
            </p>
          </div>
          <Link
            href={`/test?exam=${track.focus}`}
            className="inline-flex min-h-11 items-center rounded-full bg-teal-500 px-5 py-2 font-medium text-slate-950 hover:bg-teal-400"
          >
            Start a timed test
          </Link>
        </section>
      ) : null}

      <section aria-labelledby="tools-heading" className="space-y-4">
        <h2 id="tools-heading" className="text-lg font-medium text-white">
          Study tools
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const inner = (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-teal-400">
                    <ToolIcon id={tool.id} width={26} height={26} />
                  </span>
                  <StatusChip state={tool.state}>{tool.chip}</StatusChip>
                </div>
                <div>
                  <p className="text-lg font-medium text-white">{tool.label}</p>
                  <p className="mt-1 text-sm text-slate-400">{tool.blurb}</p>
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
              Chapter visuals
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Interactive diagrams and simulators for each Network+ chapter.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {networkingChapters.map((chapter) => (
              <li key={chapter.href}>
                <Link
                  href={chapter.href}
                  className="block h-full rounded-2xl border border-slate-800 bg-slate-900 p-4 hover:border-teal-400"
                >
                  <p className="text-xs uppercase tracking-wide text-teal-300">{chapter.label}</p>
                  <p className="mt-1 font-medium text-white">{chapter.title}</p>
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
              Packet Tracer labs
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Notes, flashcards, and quizzes for CCNA are not written yet. The labs are ready now.
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

          <section aria-labelledby="notes-heading" className="space-y-4">
            <h2 id="notes-heading" className="text-lg font-medium text-white">
              Chapters in this track
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {own.map((topic) => (
                <li key={topic.id}>
                  <Link
                    href={`/notes/${topic.id}`}
                    className="block h-full rounded-2xl border border-slate-800 bg-slate-900 p-4 hover:border-teal-400"
                  >
                    <p className="text-xs uppercase tracking-wide text-teal-300">
                      {topic.chapter}
                      {topic.weak ? " · Weak area" : ""}
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
                  Shared with other tracks
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  These chapters count toward more than one exam, so they appear in each track.
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
                          Also in {alsoIn.join(", ")}
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
  );
}
