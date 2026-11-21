import factsFile from "@/content/saa-service-facts.json";
import type { DrillDeck, DrillItem } from "@/lib/practice/drills";
import { servicesInCard } from "@/lib/saa-tags";
import type { Flashcard } from "@/lib/types";

export type FactScope = "global" | "Regional" | "AZ";
export type FactTier = "core" | "peripheral";

export type FactClass = {
  name: string;
  purpose: string;
  task: string;
  docsUrl: string;
};

export type FactNumber = {
  id: string;
  label: string;
  current: string;
  /** Long-standing figure that current docs no longer use. */
  changedNote?: string;
  docsUrl: string;
  task: string;
};

export type FactCost = {
  id: string;
  prompt: string;
  answer: string;
  detail: string;
  task: string;
  docsUrl: string;
};

export type FactCostProfile = {
  band: "$" | "$$" | "$$$" | "n/a";
  reason: string;
  dimension: string;
  freeTier: string;
  freeTierReason?: string;
  docsUrl: string;
  anchor?: {
    amount: string;
    asOf: "2026-11";
    region: "us-east-1";
    url: string;
  };
};

export type ServiceFact = {
  id: string;
  name: string;
  aliases?: string[];
  acronym?: string;
  expansion?: string;
  /** Extra line when the current page qualifies the expansion. */
  acronymNote?: string;
  /** Why this record has no acronym expansion. */
  acronymReason?: string;
  keywords?: string[];
  /** Why this record has no exam class list. */
  classesNote?: string;
  cost?: FactCostProfile;
  category: string;
  tier: FactTier;
  scope: FactScope;
  scopeNote?: string;
  tasks: string[];
  definition: string;
  useWhen: string[];
  notFor?: string;
  lightning?: { claim: string; answer: boolean; correction?: string };
  docsUrl: string;
  classes?: FactClass[];
  numbers?: FactNumber[];
  costs?: FactCost[];
};

const OLDER_LINE = (older: string) =>
  `Older practice material may say ${older} — answer from the scenario's constraint.`;

export const serviceFacts = factsFile.records as ServiceFact[];

function item(
  fact: ServiceFact,
  suffix: string,
  task: string,
  cue: string,
  reply: string,
  fields: Record<string, string>,
  detail: string,
  hook: string,
  extra?: Pick<DrillItem, "also">,
): DrillItem {
  return {
    id: `${fact.id}-${suffix}`,
    objective: task,
    fields: { cue, reply, board: fact.category, ...fields },
    detail,
    hook,
    docsUrl: fact.docsUrl,
    ...extra,
  };
}

function baseDetail(fact: ServiceFact): string {
  return fact.scopeNote ? `${fact.definition} ${fact.scopeNote}` : fact.definition;
}

/** Drill items generated from the service records. Core and peripheral tiers differ. */
export function serviceFactItems(facts: ServiceFact[] = serviceFacts): DrillItem[] {
  const items: DrillItem[] = [];
  for (const fact of facts) {
    const primary = fact.tasks[0];
    const detail = baseDetail(fact);
    const hook = fact.acronym ? `${fact.acronym} = ${fact.name}` : fact.category;
    items.push(item(
      fact,
      "definition",
      primary,
      `Which description matches ${fact.name}?`,
      fact.definition,
      {
        definition: fact.definition,
        name: fact.name,
        matchLeft: fact.name,
      },
      detail,
      hook,
      fact.aliases?.length ? { also: { name: fact.aliases } } : undefined,
    ));
    items.push(item(
      fact,
      "category",
      primary,
      `Which appendix category lists ${fact.name}?`,
      fact.category,
      { category: fact.category },
      `${fact.name} is listed under ${fact.category}.`,
      hook,
    ));
    fact.useWhen.forEach((use, index) => {
      const task = fact.tasks[Math.min(index, fact.tasks.length - 1)];
      items.push(item(
        fact,
        `use-${index}`,
        task,
        use,
        fact.name,
        { service: fact.name },
        detail,
        hook,
      ));
    });
    if (fact.acronym && fact.expansion) {
      items.push(item(
        fact,
        "acronym",
        primary,
        `What does ${fact.acronym} stand for on the current ${fact.name} page?`,
        fact.expansion,
        { acronym: fact.acronym, expansion: fact.expansion, matchLeft: fact.acronym },
        `${fact.acronym} expands to ${fact.expansion}.${fact.acronymNote ? ` ${fact.acronymNote}` : ""}`,
        hook,
      ));
    }
    if (fact.notFor) {
      items.push(item(
        fact,
        "not-for",
        primary,
        `Which service is the wrong fit when ${fact.notFor}?`,
        fact.name,
        { misfit: fact.name },
        `${fact.name} is not for that. ${detail}`,
        hook,
      ));
    }
    if (fact.keywords?.length) {
      items.push(item(
        fact,
        "keyword",
        primary,
        `Which service matches these cues: ${fact.keywords.join(", ")}?`,
        fact.name,
        { service: fact.name, keywords: fact.keywords.join(", ") },
        detail,
        hook,
      ));
    }
    if (fact.cost) {
      const reply = fact.cost.band === "n/a" ? "No separate service charge" : `${fact.cost.band} — ${fact.cost.dimension}`;
      const anchor = fact.cost.anchor
        ? ` ${fact.cost.anchor.region} as of ${fact.cost.anchor.asOf}: ${fact.cost.anchor.amount}.`
        : "";
      items.push({
        id: `${fact.id}-cost-band`,
        objective: primary,
        fields: { cue: `What is the billing shape for ${fact.name}?`, reply, billing: reply, board: fact.category },
        detail: `${fact.cost.reason}${anchor}`,
        hook: fact.cost.band === "n/a" ? "No separate service charge." : "Band and dimension, not a copied list price.",
        docsUrl: fact.cost.docsUrl,
      });
    }
    if (fact.tier !== "core") continue;
    items.push(item(
      fact,
      "scope",
      primary,
      `What placement scope should you use for ${fact.name}?`,
      fact.scope,
      { scope: fact.scope },
      fact.scopeNote ? `${fact.name} is ${fact.scope}. ${fact.scopeNote}` : `${fact.name} is ${fact.scope}.`,
      hook,
    ));
    const claim = fact.lightning!;
    const verdict = claim.answer ? "True" : "False";
    items.push(item(
      fact,
      "lightning",
      primary,
      claim.claim,
      verdict,
      { verdict },
      claim.answer ? detail : `False. ${claim.correction}`,
      hook,
    ));
    for (const entry of fact.classes ?? []) {
      items.push({
        id: `${fact.id}-class-${entry.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        objective: entry.task,
        fields: {
          cue: `What is ${entry.name} for?`,
          reply: entry.purpose,
          purpose: entry.purpose,
          board: fact.category,
        },
        detail: entry.purpose,
        hook,
        docsUrl: entry.docsUrl,
      });
    }
    for (const entry of fact.numbers ?? []) {
      const changed = entry.changedNote ? ` ${OLDER_LINE(entry.changedNote)}` : "";
      items.push({
        id: `${fact.id}-number-${entry.id}`,
        objective: entry.task,
        fields: {
          cue: `What is the current documented value for ${entry.label}?`,
          reply: entry.current,
          figure: entry.current,
          board: fact.category,
        },
        detail: `${entry.label}: ${entry.current}.${changed}`,
        hook: entry.changedNote ? OLDER_LINE(entry.changedNote) : entry.current,
        docsUrl: entry.docsUrl,
      });
    }
    for (const entry of fact.costs ?? []) {
      items.push({
        id: `${fact.id}-cost-${entry.id}`,
        objective: entry.task,
        fields: {
          cue: entry.prompt,
          reply: entry.answer,
          choice: entry.answer,
          board: fact.category,
        },
        detail: entry.detail,
        hook: "Relative, not a price.",
        docsUrl: entry.docsUrl,
      });
    }
  }
  return items;
}

export function serviceFactDeck(facts: ServiceFact[] = serviceFacts): DrillDeck {
  return {
    id: "aws-saa-service-facts",
    certification: "AWS Solutions Architect – Associate",
    exam: "saa-c03",
    objective: "1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4",
    topic: "Service facts",
    modes: [
      { id: "nameToDefinition", from: "cue", to: "definition" },
      { id: "answerToCue", from: "definition", to: "name" },
      { id: "useToService", from: "cue", to: "service" },
      { id: "serviceToCategory", from: "cue", to: "category" },
      { id: "serviceToScope", from: "cue", to: "scope" },
      { id: "classToPurpose", from: "cue", to: "purpose" },
      { id: "trapToService", from: "cue", to: "misfit" },
      { id: "claimToVerdict", from: "cue", to: "verdict" },
      { id: "labelToFigure", from: "cue", to: "figure" },
      { id: "keywordToService", from: "keywords", to: "service" },
      { id: "serviceToBilling", from: "cue", to: "billing" },
      { id: "acronymToExpansion", from: "cue", to: "expansion" },
      { id: "expansionToAcronym", from: "expansion", to: "acronym" },
      { id: "patternToChoice", from: "cue", to: "choice" },
    ],
    tables: [{ id: "facts", fields: ["cue", "reply"] }],
    items: serviceFactItems(facts),
  };
}

export function serviceFactCards(facts: ServiceFact[] = serviceFacts): Flashcard[] {
  const cards: Flashcard[] = [];
  for (const fact of facts) {
    for (const entry of fact.numbers ?? []) {
      if (!entry.changedNote) continue;
      const front = entry.label;
      const back = `${entry.current}. ${OLDER_LINE(entry.changedNote)}`;
      cards.push({
        id: `fc-saa-fact-${fact.id}-${entry.id}`,
        topicId: fact.category === "Serverless" ? "aws-foundation-compute-storage" : "aws-saa-storage",
        examCodes: ["saa-c03"],
        front,
        back,
        weak: false,
        taskId: entry.task,
        services: servicesInCard({ front, back }),
        docsUrl: entry.docsUrl,
      });
    }
    if (fact.aliases?.length) {
      const front = fact.name;
      const back = fact.definition;
      cards.push({
        id: `fc-saa-fact-${fact.id}`,
        topicId: "aws-saa-dns-data",
        examCodes: ["saa-c03"],
        front,
        back,
        weak: false,
        taskId: fact.tasks[0],
        services: servicesInCard({ front, back }),
        docsUrl: fact.docsUrl,
        aliases: fact.aliases,
      });
    }
  }
  return cards;
}

export function factTaskCounts(items: DrillItem[] = serviceFactItems()): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of items) {
    const task = entry.objective ?? "";
    counts[task] = (counts[task] ?? 0) + 1;
  }
  return counts;
}

export function concentrationPairs(mode: "definition" | "acronym", category: string, facts: ServiceFact[] = serviceFacts) {
  return serviceFactItems(facts).filter((entry) => {
    if (entry.fields.board !== category) return false;
    if (mode === "definition") return entry.id.endsWith("-definition");
    return entry.id.endsWith("-acronym");
  });
}
