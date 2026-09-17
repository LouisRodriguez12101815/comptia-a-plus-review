import type { Block } from "@/lib/types";

export function SectionBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <p key={index} className="text-slate-200 leading-relaxed">
              {block.text}
            </p>
          );
        }
        if (block.type === "bullets") {
          return (
            <ul key={index} className="list-disc space-y-2 pl-5 text-slate-200">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "callout") {
          const colors = {
            critical: "border-amber-400 bg-amber-950/40 text-amber-100",
            warning: "border-orange-400 bg-orange-950/30 text-orange-100",
            tip: "border-teal-400 bg-teal-950/40 text-teal-100",
          };
          return (
            <p
              key={index}
              className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${colors[block.kind]}`}
            >
              {block.text}
            </p>
          );
        }
        if (block.type === "code") {
          return (
            <pre
              key={index}
              className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-teal-100"
            >
              {block.text}
            </pre>
          );
        }
        return (
          <div key={index} className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr>
                  {block.headers.map((header) => (
                    <th
                      key={header}
                      className="border-b border-slate-700 px-3 py-2 font-medium text-slate-300"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="odd:bg-slate-900/40">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-2 text-slate-200">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
