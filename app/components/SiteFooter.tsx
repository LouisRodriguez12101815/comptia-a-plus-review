import { ReportIssue } from "@/app/components/ReportIssue";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-slate-800 bg-slate-950/90">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-prose">
          See something wrong? Every page can be disputed. Reports are filed as GitHub issues and checked against the current CompTIA exam objectives.
        </p>
        <ReportIssue />
      </div>
    </footer>
  );
}
