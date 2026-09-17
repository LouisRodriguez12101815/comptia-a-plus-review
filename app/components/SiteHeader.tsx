import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/notes", label: "Notes" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/quiz", label: "Quiz" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          CompTIA A+ Review
        </Link>
        <nav className="flex flex-wrap gap-2 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200 hover:border-teal-400 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
