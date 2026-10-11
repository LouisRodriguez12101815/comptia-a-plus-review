import Link from "next/link";

export const metadata = { title: "Network+ · CompTIA Review" };

const chapters = [
  {
    href: "/network-plus/ch10",
    label: "Chapter 10",
    title: "Routing Protocols",
    note: "Interactive visuals and summary",
  },
  {
    href: "/network-plus/ch11",
    label: "Chapter 11",
    title: "Switching and Virtual LANs",
    note: "Summary and key concepts",
  },
];

export default function NetworkPlusIndex() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-teal-300">CompTIA Network+ (N10-009)</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Network+ chapters</h1>
        <p className="mt-2 text-slate-400">
          Notes, interactive visuals, and review questions for each chapter.
        </p>
      </div>
      <ul className="space-y-3">
        {chapters.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="block rounded-2xl border border-slate-800 bg-slate-900/50 p-4 hover:border-teal-400"
            >
              <p className="text-xs uppercase tracking-wide text-teal-300">{c.label}</p>
              <p className="mt-1 text-lg font-medium text-white">{c.title}</p>
              <p className="mt-1 text-sm text-slate-400">{c.note}</p>
            </Link>
          </li>
        ))}
      </ul>
      <p>
        <Link href="/notes?exam=n10-009" className="text-teal-300 underline">
          Read the Network+ notes
        </Link>
      </p>
    </div>
  );
}
