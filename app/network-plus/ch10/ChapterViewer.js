"use client";

import VisualLibrary from "@/app/components/VisualLibrary";

/**
 * Visuals for a single chapter (Network+ chapters 9, 10, and 11). The picker
 * itself lives in VisualLibrary so every Visuals page looks and works the same.
 */
export default function ChapterViewer({ visuals }) {
  return <VisualLibrary chapters={[{ id: "chapter", label: "", title: "", visuals }]} />;
}
