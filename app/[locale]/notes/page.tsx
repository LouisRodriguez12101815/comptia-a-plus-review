import { getTranslations, setRequestLocale } from "next-intl/server";
import { NotesCatalog } from "@/app/components/NotesCatalog";
import { resolveExamParam } from "@/lib/exam-route";
import { Link } from "@/i18n/navigation";

export default async function NotesIndexPage({ params, searchParams }: PageProps<"/[locale]/notes">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("notesPage");
  const errors = await getTranslations("quizPage");
  const resolution = resolveExamParam((await searchParams).exam);
  if (resolution.kind === "invalid") return <div className="space-y-4"><h1 className="text-3xl font-semibold text-white">{errors("unavailableTitle")}</h1><p className="text-slate-300">{errors("unavailableBody")}</p><Link href="/certifications" className="text-teal-300 underline">{errors("availableTracks")}</Link></div>;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">{t("title")}</h1>
        <p className="mt-2 text-slate-400">
          {t("intro")}
        </p>
      </div>
      <NotesCatalog key={resolution.kind === "valid" ? resolution.focus : "saved"} initialFocus={resolution.kind === "valid" ? resolution.focus : undefined} />
    </div>
  );
}
