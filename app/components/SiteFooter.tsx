import { ReportIssue } from "@/app/components/ReportIssue";
import { FooterNotice } from "@/app/components/FooterNotice";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-slate-800 bg-slate-950/90">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <FooterNotice />
        <ReportIssue />
      </div>
    </footer>
  );
}
