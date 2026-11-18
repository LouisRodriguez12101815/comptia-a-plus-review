#!/usr/bin/env node

import { readFileSync } from "node:fs";

const read = (name) => JSON.parse(readFileSync(new URL(`../content/${name}.json`, import.meta.url)));
const objectives = read("objectives");
const questions = read("questions");
const topics = [...read("topics"), ...read("topics-network-plus")];
const topicById = new Map(topics.map((topic) => [topic.id, topic]));

for (const code of ["clf-c02", "saa-c03"]) {
  const exam = objectives.exams.find((item) => item.code === code);
  if (!exam) throw new Error(`Missing ${code} objective map`);
  console.log(`\n${code} — ${exam.name}`);
  for (const domain of exam.domains) {
    console.log(`${domain.id} ${domain.title} (${domain.weight}%)`);
    for (const objective of domain.objectives) {
      const qs = questions.filter((question) => question.examCodes?.includes(code) && question.objectiveIds?.[code]?.includes(objective.id));
      const missingTopics = objective.topics.filter((id) => !topicById.has(id));
      console.log(`  ${objective.id}: status=${objective.status ?? "unset"}; questions=${qs.length}; topics=${objective.topics.length}; missingTopics=${missingTopics.length ? missingTopics.join(",") : "none"}`);
    }
  }
}

for (const code of ["clf-c02", "saa-c03"]) {
  const seen = new Map();
  for (const question of questions.filter((item) => item.examCodes?.includes(code))) {
    const key = question.prompt.trim().toLowerCase().replace(/\s+/g, " ");
    seen.set(key, [...(seen.get(key) ?? []), question.id]);
  }
  const duplicates = [...seen.values()].filter((ids) => ids.length > 1);
  console.log(`${code}: exact prompt duplicate groups=${duplicates.length}${duplicates.length ? ` (${duplicates.map((ids) => ids.join(" / ")).join(", ")})` : ""}`);
}
