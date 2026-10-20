import { useTranslations } from "next-intl";
import { ReportIssue } from "@/app/components/ReportIssue";

export function SiteFooter() {
  const t = useTranslations("footer");
  return (
    <footer className="mt-12 border-t border-slate-800 bg-slate-950/90">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-prose">
          {t("disputeNotice")}
        </p>
        <ReportIssue />
      </div>
    </footer>
  );
}
