import { NotesCatalog } from "@/app/components/NotesCatalog";

export default function NotesIndexPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">Notes</h1>
        <p className="mt-2 text-slate-400">
          Search the study guide or open a chapter. Amber callouts mark weak-area drills.
        </p>
      </div>
      <NotesCatalog />
    </div>
  );
}
