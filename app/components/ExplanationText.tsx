import { Fragment } from "react";
import { Link } from "@/i18n/navigation";
import { parseRelatedConcept } from "@/lib/explanation";

/** Preserve plain explanations; render authored lines and local related links. */
export function ExplanationText({ text }: { text: string }) {
  return text.split("\n").map((line, index) => {
    const related = parseRelatedConcept(line);
    return (
      <Fragment key={index}>
        {index > 0 && <br />}
        {related ? (
          <>
            {"Related concept: "}
            <Link
              href={related.href}
              prefetch={false}
              className="inline-flex min-h-11 max-w-full items-center break-words text-teal-300 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {related.label}
            </Link>
          </>
        ) : line}
      </Fragment>
    );
  });
}
