import Link from "next/link";

export const metadata = { title: "Network+ · CompTIA Review" };

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
        <li>
          <Link
            href="/network-plus/ch10"
            className="block rounded-2xl border border-slate-800 bg-slate-900/50 p-4 hover:border-teal-400"
          >
            <p className="text-xs uppercase tracking-wide text-teal-300">Chapter 10</p>
            <p className="mt-1 text-lg font-medium text-white">Routing Protocols</p>
            <p className="mt-1 text-sm text-slate-400">Interactive visuals and summary</p>
          </Link>
        </li>
      </ul>
      <p>
        <Link href="/notes?exam=n10-009" className="text-teal-300 underline">
          Read the Network+ notes
        </Link>
      </p>
    </div>
  );
}
