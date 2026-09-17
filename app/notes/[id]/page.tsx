import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionBlocks } from "@/app/components/SectionBlocks";
import { getTopic, topics } from "@/lib/content";

export function generateStaticParams() {
  return topics.map((topic) => ({ id: topic.id }));
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const topic = getTopic(id);
  if (!topic) notFound();

  return (
    <article className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-teal-300">{topic.chapter}</p>
        <h1 className="mt-1 text-3xl font-semibold text-white">{topic.title}</h1>
        <p className="mt-2 text-slate-400">{topic.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/flashcards?topic=${topic.id}`}
            className="rounded-full border border-slate-600 px-3 py-1.5 text-sm hover:border-teal-400"
          >
            Flashcards
          </Link>
          <Link
            href={`/quiz?topic=${topic.id}`}
            className="rounded-full border border-slate-600 px-3 py-1.5 text-sm hover:border-teal-400"
          >
            Quiz this chapter
          </Link>
        </div>
      </div>
      <nav className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        <p className="text-sm font-medium text-slate-300">On this page</p>
        <ul className="mt-2 space-y-1 text-sm">
          {topic.sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="text-teal-300 hover:text-teal-200">
                {section.title}
                {section.weak ? " (weak)" : ""}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {topic.sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-24 space-y-3">
          <h2 className="text-xl font-medium text-white">
            {section.title}
            {section.weak && (
              <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200">
                Weak area
              </span>
            )}
          </h2>
          <SectionBlocks blocks={section.blocks} />
        </section>
      ))}
    </article>
  );
}
