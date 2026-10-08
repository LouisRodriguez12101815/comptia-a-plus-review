import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionBlocks } from "@/app/components/SectionBlocks";
import { getLab, getTopic, labs } from "@/lib/content";

export function generateStaticParams() {
  return labs.map((lab) => ({ slug: lab.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lab = getLab(slug);
  if (!lab) return { title: "Lab not found" };
  return {
    title: `${lab.title} | CompTIA A+ Review`,
    description: lab.summary,
  };
}

export default async function LabPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lab = getLab(slug);
  if (!lab) notFound();

  const related = lab.relatedTopicIds
    .map((id) => getTopic(id))
    .filter((topic) => topic !== undefined);

  return (
    <article className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-teal-300">{lab.subtitle}</p>
        <h1 className="mt-1 text-3xl font-semibold text-white">{lab.title}</h1>
        <p className="mt-2 text-slate-400">{lab.summary}</p>
        <p className="mt-4 flex flex-wrap gap-2">
          {lab.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
            >
              {skill}
            </span>
          ))}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={lab.pktDownload}
            download
            className="rounded-full bg-teal-500 px-5 py-2 font-medium text-slate-950 hover:bg-teal-400"
          >
            Download Packet Tracer file
          </a>
          <a
            href={lab.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-600 px-5 py-2 hover:border-teal-400"
          >
            View on GitHub
          </a>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Open{" "}
          <code className="text-slate-300">lab01.pkt</code> in Cisco Packet Tracer
          (NetAcad). The file is hosted on this site.
        </p>
      </div>

      <figure className="overflow-hidden rounded-2xl border border-slate-800 bg-white">
        <img src={lab.image} alt={lab.imageAlt} className="w-full" />
        <figcaption className="border-t border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-400">
          Packet Tracer Logical workspace: Sales (SW1) and Ops (SW2) meet at R1.
        </figcaption>
      </figure>

      {lab.sections.map((section) => (
        <section key={section.id} className="space-y-3">
          <h2 className="text-xl font-medium text-white">{section.title}</h2>
          <SectionBlocks blocks={section.blocks} />
        </section>
      ))}

      {related.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xl font-medium text-white">Related study notes</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {related.map((topic) => (
              <li key={topic.id}>
                <Link
                  href={`/notes/${topic.id}`}
                  className="block rounded-2xl border border-slate-800 bg-slate-900/50 p-4 hover:border-teal-400"
                >
                  <p className="text-xs uppercase tracking-wide text-teal-300">
                    {topic.chapter}
                  </p>
                  <p className="mt-1 font-medium text-white">{topic.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
