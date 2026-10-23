import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const input = fileURLToPath(new URL("../docs/assessment-workflow-guide.json", import.meta.url));
const output = fileURLToPath(new URL("../docs/assessment-workflow.md", import.meta.url));
const guide = JSON.parse(readFileSync(input, "utf8"));
const cell = (value) => value.replaceAll("|", "\\|").replaceAll("\n", " ");
const link = (url) => url.startsWith("/guides/") ? "../public" + url : url;
const lines = [
  "<!-- Generated from assessment-workflow-guide.json. Run node scripts/render-assessment-workflow-doc.mjs. -->",
  "",
  "# " + guide.title,
  "",
  guide.subtitle,
  "",
  guide.intro,
  "",
  "## Workflow",
  "",
  ...guide.flow.map((step, index) => (index + 1) + ". **" + step.title + ".** " + step.detail),
  "",
  "## Contents",
  "",
  ...guide.sections.map((section) => "- [" + section.title + "](#" + section.id + ")"),
  "",
];
for (const section of guide.sections) {
  lines.push('<a id="' + section.id + '"></a>', "", "## " + section.title, "", section.summary, "");
  for (const block of section.blocks) {
    switch (block.type) {
      case "paragraph": lines.push(block.text, ""); break;
      case "list":
        lines.push(...block.items.map((item, index) => (block.ordered ? (index + 1) + ". " : "- ") + item), "");
        break;
      case "callout":
        lines.push("> **" + block.title + "**", ">", "> " + block.text, "");
        break;
      case "code":
        lines.push("**" + block.title + "**", "", "```" + block.language, block.text, "```", "");
        break;
      case "table":
        lines.push("| " + block.headers.map(cell).join(" | ") + " |",
          "| " + block.headers.map(() => "---").join(" | ") + " |",
          ...block.rows.map((row) => "| " + row.map(cell).join(" | ") + " |"), "");
        break;
      case "links":
        lines.push(...block.items.map((item) => "- [" + item.label + "](" + link(item.url) + ")"), "");
        break;
      default: throw new Error("Unknown guide block: " + block.type);
    }
  }
}
lines.push("## Sources and implementation", "");
for (const source of guide.sources) {
  lines.push("- [" + source.title + "](" + source.url + ") — " + source.note);
}
writeFileSync(output, lines.join("\n") + "\n", "utf8");
console.log("Updated docs/assessment-workflow.md");
