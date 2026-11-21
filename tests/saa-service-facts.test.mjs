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
  ["EMR", "Amazon Elastic MapReduce"],
  ["VPN", "virtual private network"],
  ["HSM", "hardware security module"],
  ["CUR", "AWS Cost and Usage Reports"],
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
  assert.deepEqual(quick.aliases, ["Amazon QuickSight", "AWS Quick"]);
  const s3 = serviceFacts.find((fact) => fact.id === "s3");
  assert.equal(s3.scope, "Regional");
  assert.equal(s3.scopeNote, "Bucket names are globally unique, but each bucket and its data live in one Region.");
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
      assert.equal(fact.lightning, undefined, fact.id);
      assert.equal(fact.numbers, undefined, fact.id);
      assert.equal(fact.costs, undefined, fact.id);
      const allowed = ["category", "definition", "use-0", "not-for", "keyword", "cost-band"];
      if (fact.acronym) allowed.push("acronym");
      for (const entry of fact.classes ?? []) {
        allowed.push(`class-${entry.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`);
      }
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
      assert.equal(kind.startsWith("class-") || kind.startsWith("number-") || kind.startsWith("cost-") || ["definition", "category", "scope", "not-for", "lightning", "acronym", "keyword"].includes(kind) || /^use-\d+$/.test(kind), true, `${fact.id} ${kind}`);
    }
  }
});

test("acronym expansions are only the ones confirmed on the current page", () => {
  const stored = serviceFacts.filter((fact) => fact.acronym || fact.expansion);
  assert.equal(new Set(stored.map((fact) => fact.acronym)).size, CONFIRMED_ACRONYMS.size);
  const expansionOwners = new Map();
  for (const fact of stored) {
    assert.equal(CONFIRMED_ACRONYMS.get(fact.acronym), fact.expansion, fact.id);
    const owner = expansionOwners.get(fact.expansion);
    if (owner) assert.equal(owner, fact.acronym, fact.id);
    expansionOwners.set(fact.expansion, fact.acronym);
  }
  assert.equal(serviceFacts.find((fact) => fact.id === "emr").acronym, "EMR");
  assert.match(serviceFacts.find((fact) => fact.id === "emr").acronymNote, /previously called/i);
  assert.equal(serviceFacts.find((fact) => fact.id === "ec2").expansion, "Amazon Elastic Compute Cloud");
  assert.equal(serviceFacts.find((fact) => fact.id === "s3").expansion, "Amazon Simple Storage Service");
  for (const id of ["site-to-site-vpn", "client-vpn"]) {
    const fact = serviceFacts.find((entry) => entry.id === id);
    assert.equal(fact.acronym, "VPN");
    assert.match(fact.acronymNote, /Virtual Private Network/);
  }
  assert.equal(serviceFacts.find((fact) => fact.id === "cloudhsm").acronym, "HSM");
  assert.equal(serviceFacts.find((fact) => fact.id === "cur").acronym, "CUR");
  assert.match(serviceFacts.find((fact) => fact.id === "identity-center").acronymReason, /Single Sign-On/);
  assert.equal(serviceFacts.find((fact) => fact.id === "api-gateway").acronym, undefined);
  assert.equal(serviceFacts.find((fact) => fact.id === "systems-manager").acronym, undefined);
  assert.match(serviceFacts.find((fact) => fact.id === "systems-manager").acronymReason, /SSM/);
  assert.equal(serviceFacts.find((fact) => fact.name === "Elastic Load Balancing").acronym, undefined);
  assert.match(serviceFacts.find((fact) => fact.name === "Elastic Load Balancing").acronymReason, /ELB/);
  assert.equal(serviceFacts.find((fact) => fact.name === "Amazon FSx").acronym, undefined);
  assert.match(serviceFacts.find((fact) => fact.name === "Amazon FSx").acronymReason, /FSx/);
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
    if (fact.cost) {
      assert.equal(fact.cost.docsUrl.startsWith("https://"), true, fact.id);
      if (fact.cost.anchor) assert.equal(fact.cost.anchor.url.startsWith("https://"), true, fact.id);
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
  assert.deepEqual(item.also.name, ["Amazon QuickSight", "AWS Quick"]);
  assert.equal(item.fields.name, "Amazon Quick");
  const card = flashcards.find((entry) => entry.id === "fc-saa-fact-quick");
  assert.equal(termMatches("Amazon Quick", card), true);
  assert.equal(termMatches("Amazon QuickSight", card), true);
  assert.equal(termMatches("AWS Quick", card), true);
  assert.deepEqual(card.services, ["Amazon QuickSight"]);
});

const ACRONYM_TOKEN = /^(?:[A-Z0-9]{2,}|FSx)$/;

test("every record has the memory-match fields, or n/a with a reason", () => {
  const bands = new Set(["$", "$$", "$$$", "n/a"]);
  for (const fact of serviceFacts) {
    assert.equal(typeof fact.notFor, "string", fact.id);
    assert.ok(fact.notFor.length > 12, fact.id);
    assert.ok(fact.keywords.length >= 3 && fact.keywords.length <= 6, fact.id);
    assert.ok(fact.keywords.every((keyword) => keyword.trim().length > 2), fact.id);
    assert.ok(bands.has(fact.cost.band), fact.id);
    assert.equal(fact.cost.docsUrl.startsWith("https://"), true, fact.id);
    assert.ok(fact.cost.reason.length > 20, fact.id);
    if (fact.cost.band === "n/a") assert.equal(fact.cost.dimension, "n/a", fact.id);
    else assert.ok(fact.cost.dimension.length > 2 && fact.cost.dimension !== "n/a", fact.id);
    assert.equal(typeof fact.cost.freeTier, "string", fact.id);
    if (fact.cost.anchor) {
      assert.equal(fact.cost.anchor.asOf, "2026-11", fact.id);
      assert.equal(fact.cost.anchor.region, "us-east-1", fact.id);
      assert.equal(fact.cost.anchor.url.startsWith("https://"), true, fact.id);
    }
    const tokens = fact.name.split(/[^A-Za-z0-9]+/).filter((token) => token !== "AWS" && token !== "Amazon" && ACRONYM_TOKEN.test(token));
    if (fact.acronym) {
      assert.ok(fact.expansion && fact.definition, fact.id);
    } else {
      assert.ok(fact.acronymReason && fact.acronymReason.length > 20, `${fact.id} ${tokens.join(",")}`);
    }
    if (fact.classes?.length) {
      for (const entry of fact.classes) assert.equal(entry.docsUrl.startsWith("https://docs.aws.amazon.com/"), true, `${fact.id} ${entry.name}`);
    } else {
      assert.ok(fact.classesNote && fact.classesNote.length > 20, fact.id);
    }
  }
  const named = new Map([
    ["ec2", ["EC2 On-Demand", "EC2 Reserved Instances", "EC2 Spot", "EC2 Dedicated Hosts"]],
    ["s3-glacier", ["Glacier Expedited retrieval", "Glacier Standard retrieval", "Glacier Bulk retrieval"]],
    ["efs", ["EFS Elastic throughput", "EFS Provisioned throughput", "EFS Bursting throughput"]],
    ["rds", ["RDS Multi-AZ DB instance", "RDS read replica"]],
    ["aurora", ["Aurora Replica"]],
    ["elasticache", ["ElastiCache for Valkey", "ElastiCache for Redis OSS", "ElastiCache for Memcached"]],
    ["fsx", ["FSx for Windows File Server", "FSx for Lustre", "FSx for NetApp ONTAP", "FSx for OpenZFS"]],
    ["lambda", ["Lambda function memory", "Lambda function timeout"]],
    ["snow", ["Snowball Edge", "Snowcone"]],
    ["cloudfront", ["Price Class All", "Price Class 200", "Price Class 100"]],
    ["route53", ["Simple routing", "Weighted routing", "Latency routing", "Failover routing", "Geolocation routing", "Geoproximity routing", "Multivalue answer routing", "IP-based routing"]],
    ["storage-gateway", ["S3 File Gateway", "FSx File Gateway", "Volume Gateway cached", "Volume Gateway stored", "Tape Gateway"]],
    ["savings-plans", ["Compute Savings Plans", "EC2 Instance Savings Plans", "SageMaker AI Savings Plans"]],
    ["kms", ["Customer managed key", "AWS managed key", "AWS owned key", "Symmetric encryption KMS key", "Asymmetric KMS key"]],
    ["shield", ["Shield Standard", "Shield Advanced"]],
    ["kinesis", ["Kinesis Data Streams on-demand", "Kinesis Data Streams provisioned", "Amazon Data Firehose"]],
    ["api-gateway", ["REST API", "HTTP API", "WebSocket API", "Edge-optimized endpoint", "Regional endpoint", "Private endpoint"]],
    ["direct-connect", ["Direct Connect dedicated connection", "Direct Connect hosted connection"]],
    ["ecs", ["ECS on EC2", "ECS on Fargate", "ECS on External"]],
    ["redshift", ["Redshift provisioned RA3", "Redshift Serverless"]],
  ]);
  for (const [id, names] of named) {
    const have = new Set(serviceFacts.find((fact) => fact.id === id).classes.map((entry) => entry.name));
    for (const name of names) assert.equal(have.has(name), true, `${id} ${name}`);
  }
  const anchors = new Map([
    ["s3", "0.023"],
    ["vpc", "0.045"],
    ["ec2", "0.0104"],
    ["lambda", "0.0000166667"],
    ["ebs", "0.08"],
    ["efs", "0.30"],
    ["dynamodb", "0.6250"],
    ["sqs", "0.40"],
    ["cloudfront", "0.085"],
    ["s3-glacier", "0.00099"],
    ["privatelink", "0.01"],
    ["secrets", "0.40"],
    ["kms", "$1"],
  ]);
  for (const [id, needle] of anchors) {
    const amount = serviceFacts.find((fact) => fact.id === id).cost.anchor.amount;
    assert.equal(amount.includes(needle), true, `${id} ${amount}`);
  }
  for (const name of ["S3 Standard", "gp3", "io2 Block Express", "st1", "sc1", "DynamoDB on-demand", "DynamoDB provisioned", "SQS standard", "SQS FIFO"]) {
    assert.equal(serviceFacts.some((fact) => fact.classes?.some((entry) => entry.name === name)), true, name);
  }
});

test("the service-fact checks stay on the checks workflow", () => {
  const workflow = readFileSync(new URL("../.github/workflows/checks.yml", import.meta.url), "utf8");
  assert.match(workflow, /npm run test:saa-tags/);
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
