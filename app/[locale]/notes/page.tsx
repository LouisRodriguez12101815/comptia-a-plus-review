import { getTranslations, setRequestLocale } from "next-intl/server";
import { NotesCatalog } from "@/app/components/NotesCatalog";

export default async function NotesIndexPage({ params }: PageProps<"/[locale]/notes">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("notesPage");
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">{t("title")}</h1>
        <p className="mt-2 text-slate-400">
          {t("intro")}
        </p>
      </div>
      <NotesCatalog />
    </div>
  );
}
