import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { flashcards, topics } from "../lib/content.ts";
import { drillDecks } from "../lib/practice/drills.ts";
import { assertSaaCardTags } from "../lib/saa-tags.ts";
import { termMatches } from "../lib/study/memory.ts";
import {
  concentrationPairs,
  factTaskCounts,
  serviceFactCards,
  serviceFactItems,
  serviceFacts,
} from "../lib/study/service-facts.ts";

const TASKS = ["1.1", "1.2", "1.3", "2.1", "2.2", "3.1", "3.2", "3.3", "3.4", "3.5", "4.1", "4.2", "4.3", "4.4"];
const SCOPES = new Set(["global", "Regional", "AZ"]);
const CONFIRMED_ACRONYMS = new Map([
  ["IAM", "AWS Identity and Access Management"],
  ["S3", "Amazon Simple Storage Service"],
  ["EC2", "Amazon Elastic Compute Cloud"],
  ["EFS", "Amazon Elastic File System"],
  ["EBS", "Amazon Elastic Block Store"],
  ["SQS", "Amazon Simple Queue Service"],
  ["SNS", "Amazon Simple Notification Service"],
  ["KMS", "AWS Key Management Service"],
  ["VPC", "Amazon Virtual Private Cloud"],
  ["ACM", "AWS Certificate Manager"],
  ["DMS", "AWS Database Migration Service"],
  ["RDS", "Amazon Relational Database Service"],
  ["ECS", "Amazon Elastic Container Service"],
  ["EKS", "Amazon Elastic Kubernetes Service"],
  ["ECR", "Amazon Elastic Container Registry"],
  ["MSK", "Amazon Managed Streaming for Apache Kafka"],
  ["RAM", "AWS Resource Access Manager"],
  ["WAF", "web application firewall"],
  ["CLI", "AWS Command Line Interface"],
]);

function norm(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("118 unique in-scope records, with https docs and a scope from the enum", () => {
  assert.equal(serviceFacts.length, 118);
  assert.equal(new Set(serviceFacts.map((fact) => fact.id)).size, 118);
  assert.equal(new Set(serviceFacts.map((fact) => fact.name)).size, 118);
  const redshift = serviceFacts.filter((fact) => fact.name === "Amazon Redshift");
  assert.equal(redshift.length, 1);
  assert.equal(redshift[0].category, "Database");
  const quick = serviceFacts.find((fact) => fact.id === "quick");
  assert.equal(quick.name, "Amazon Quick");
  assert.deepEqual(quick.aliases, ["Amazon QuickSight"]);
  assert.match(quick.definition, /Amazon QuickSight/);
  assert.equal(quick.docsUrl, "https://docs.aws.amazon.com/quick/latest/userguide/what-is.html");
  for (const fact of serviceFacts) {
    assert.equal(fact.docsUrl.startsWith("https://"), true, fact.id);
    assert.equal(fact.docsUrl.includes("/cdk/"), false, fact.id);
    assert.ok(SCOPES.has(fact.scope), `${fact.id} ${fact.scope}`);
    assert.ok(fact.definition && fact.category && fact.tasks.length && fact.useWhen.length, fact.id);
  }
  const ebs = serviceFacts.find((fact) => fact.id === "ebs");
  assert.equal(ebs.scope, "AZ");
  assert.match(ebs.scopeNote, /Availability Zone/);
});

test("core records carry the full base set and peripheral records stay short", () => {
  for (const fact of serviceFacts) {
    const items = serviceFactItems([fact]);
    const kinds = items.map((item) => item.id.slice(fact.id.length + 1));
    if (fact.tier === "peripheral") {
      assert.equal(fact.tasks.length, 1, fact.id);
      assert.equal(fact.useWhen.length, 1, fact.id);
      assert.equal(fact.notFor, undefined, fact.id);
      assert.equal(fact.lightning, undefined, fact.id);
      assert.equal(fact.classes, undefined, fact.id);
      assert.equal(fact.numbers, undefined, fact.id);
      assert.equal(fact.costs, undefined, fact.id);
      const allowed = ["category", "definition", "use-0"];
      if (fact.acronym) allowed.push("acronym");
      assert.deepEqual(kinds.slice().sort(), allowed.sort(), fact.id);
      continue;
    }
    assert.equal(fact.tier, "core", fact.id);
    assert.ok(fact.useWhen.length >= 2, fact.id);
    assert.ok(fact.notFor, fact.id);
    assert.equal(typeof fact.lightning.answer, "boolean", fact.id);
    for (const kind of ["definition", "category", "scope", "not-for", "lightning"]) {
      assert.ok(kinds.includes(kind), `${fact.id} ${kind}`);
    }
    if (fact.tasks.length > 1) {
      assert.equal(fact.useWhen.length, fact.tasks.length, fact.id);
      fact.tasks.forEach((task, index) => {
        assert.equal(items.find((item) => item.id === `${fact.id}-use-${index}`).objective, task, fact.id);
      });
    }
    for (const kind of kinds) {
      assert.equal(kind.startsWith("class-") || kind.startsWith("number-") || kind.startsWith("cost-") || ["definition", "category", "scope", "not-for", "lightning", "acronym"].includes(kind) || /^use-\d+$/.test(kind), true, `${fact.id} ${kind}`);
    }
  }
});

test("acronym expansions are only the ones confirmed on the current page", () => {
  const stored = serviceFacts.filter((fact) => fact.acronym || fact.expansion);
  assert.equal(stored.length, CONFIRMED_ACRONYMS.size);
  for (const fact of stored) {
    assert.equal(CONFIRMED_ACRONYMS.get(fact.acronym), fact.expansion, fact.id);
  }
  assert.equal(new Set(stored.map((fact) => fact.expansion)).size, stored.length);
  assert.equal(serviceFacts.find((fact) => fact.id === "emr").acronym, undefined);
  assert.equal(serviceFacts.find((fact) => fact.id === "systems-manager").acronym, undefined);
  assert.equal(serviceFacts.find((fact) => fact.name === "Elastic Load Balancing").acronym, undefined);
  assert.equal(serviceFacts.find((fact) => fact.name === "Amazon FSx").acronym, undefined);
});

test("every quoted number and changed note cites a URL, and the drill shows the older line", () => {
  const required = [
    ["lambda", "timeout", "900 seconds (15 minutes)"],
    ["lambda", "memory", "a maximum of 3,008 MB"],
    ["ebs", "gp3-max", "16,000 IOPS and 1,000 MiB/s"],
    ["ebs", "io2-max", "64,000 IOPS"],
  ];
  for (const fact of serviceFacts) {
    for (const number of fact.numbers ?? []) {
      assert.equal(number.docsUrl.startsWith("https://docs.aws.amazon.com/"), true, `${fact.id} ${number.id}`);
      const item = serviceFactItems([fact]).find((entry) => entry.id === `${fact.id}-number-${number.id}`);
      assert.equal(item.docsUrl, number.docsUrl);
      if (!number.changedNote) continue;
      assert.match(item.detail, new RegExp(`Older practice material may say ${escapeRegExp(number.changedNote)} — answer from the scenario's constraint\\.`));
      const card = serviceFactCards([fact]).find((entry) => entry.id === `fc-saa-fact-${fact.id}-${number.id}`);
      assert.match(card.back, /Older practice material may say/);
      assert.equal(card.docsUrl, number.docsUrl);
    }
    for (const entry of [...(fact.classes ?? []), ...(fact.costs ?? [])]) {
      assert.equal(entry.docsUrl.startsWith("https://docs.aws.amazon.com/"), true, `${fact.id} ${entry.id ?? entry.name}`);
    }
  }
  for (const [factId, numberId, note] of required) {
    const number = serviceFacts.find((fact) => fact.id === factId).numbers.find((entry) => entry.id === numberId);
    assert.equal(number.changedNote, note);
  }
  const glacier = serviceFacts.find((fact) => fact.id === "s3-glacier").numbers.find((entry) => entry.id === "flex-times");
  assert.equal(glacier.changedNote, undefined);
  assert.match(glacier.current, /typically/);
  assert.equal(glacier.docsUrl.includes("/cdk/"), false);
});

test("every SAA task has at least 25 fact-drill items", () => {
  const counts = factTaskCounts();
  for (const task of TASKS) assert.ok(counts[task] >= 25, `${task} has ${counts[task] ?? 0}`);
});

test("new cues do not repeat an existing drill cue or a card front", () => {
  const existing = new Set();
  for (const deck of drillDecks) {
    if (deck.id === "aws-saa-service-facts") continue;
    for (const item of deck.items) {
      for (const key of ["cue", "scenario", "prompt"]) {
        if (item.fields[key]) existing.add(norm(item.fields[key]));
      }
    }
  }
  const cards = JSON.parse(readFileSync(new URL("../content/flashcards.json", import.meta.url), "utf8"));
  const fill = JSON.parse(readFileSync(new URL("../content/saa-high-yield-fill.json", import.meta.url), "utf8"));
  for (const card of [...cards, ...fill.cards]) existing.add(norm(card.front));
  const items = serviceFactItems();
  const cues = items.map((item) => norm(item.fields.cue));
  assert.equal(new Set(items.map((item) => item.id)).size, items.length);
  for (const cue of cues) assert.equal(existing.has(cue), false, cue);
  for (const card of serviceFactCards()) {
    assert.equal(existing.has(norm(card.front)), false, card.id);
    assert.equal(cues.includes(norm(card.front)), false, card.id);
    assertSaaCardTags(card);
    assert.ok(topics.some((topic) => topic.id === card.topicId), card.topicId);
  }
});

test("Amazon QuickSight is accepted on the reverse drill and on type-the-term", () => {
  const item = serviceFactItems().find((entry) => entry.id === "quick-definition");
  assert.deepEqual(item.also.name, ["Amazon QuickSight"]);
  assert.equal(item.fields.name, "Amazon Quick");
  const card = flashcards.find((entry) => entry.id === "fc-saa-fact-quick");
  assert.equal(termMatches("Amazon Quick", card), true);
  assert.equal(termMatches("Amazon QuickSight", card), true);
  assert.deepEqual(card.services, ["Amazon QuickSight"]);
});

test("concentration boards exist for every appendix category", () => {
  const categories = [...new Set(serviceFacts.map((fact) => fact.category))];
  assert.ok(categories.length >= 10);
  for (const category of categories) {
    const definitions = concentrationPairs("definition", category);
    const expected = serviceFacts.filter((fact) => fact.category === category);
    assert.equal(definitions.length, expected.length, category);
    assert.ok(definitions.every((item) => item.fields.matchLeft && item.fields.definition), category);
    const acronyms = concentrationPairs("acronym", category);
    assert.equal(acronyms.length, expected.filter((fact) => fact.acronym && fact.expansion).length, category);
    assert.ok(acronyms.every((item) => item.fields.matchLeft === item.fields.acronym), category);
  }
  const verdicts = new Set(serviceFactItems().filter((item) => item.fields.verdict).map((item) => item.fields.verdict));
  assert.ok(verdicts.has("True") && verdicts.has("False"));
});
