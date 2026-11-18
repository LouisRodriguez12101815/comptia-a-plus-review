import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { shuffleQuestionChoices, mulberry32, isCorrect } from "../lib/exam-test.mjs";

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));
const questions = readJson("content/questions.json");
const topics = readJson("content/topics.json");
const objectives = readJson("content/objectives.json");
const audit = readJson("docs/saa-c03-question-pdf-audit.json");
const batch = questions.filter((question) => question.id.startsWith("q-saa-auditbatch-"));

test("the audited PDF batch has 12 unique original SAA questions mapped to live objectives and lesson sections", () => {
  assert.equal(batch.length, 12);
  assert.equal(new Set(batch.map((question) => question.id)).size, 12);
  assert.equal(audit.selectedItems.length, 12);
  const exam = objectives.exams.find((entry) => entry.code === "saa-c03");
  const knownObjectives = new Set(exam.domains.flatMap((domain) => domain.objectives.map((objective) => objective.id)));
  for (const question of batch) {
    assert.deepEqual(question.examCodes, ["saa-c03"], question.id);
    assert.equal(question.objectiveIds["saa-c03"].length, 1, question.id);
    const objectiveId = question.objectiveIds["saa-c03"][0];
    assert.ok(knownObjectives.has(objectiveId), question.id);
    const objective = exam.domains.flatMap((domain) => domain.objectives).find((entry) => entry.id === objectiveId);
    assert.equal(objective.status, "partial", `${question.id} must not promote ${objectiveId}`);
    const topic = topics.find((entry) => entry.id === question.topicId);
    assert.ok(topic, `${question.id}: topic`);
    assert.ok(topic.sections.some((section) => section.id === `objective-saa-c03-${objectiveId.replace(".", "-")}`), `${question.id}: objective anchor`);
    assert.ok(question.sourceUrls.length >= 2, `${question.id}: technical sources`);
    assert.ok(question.sourceUrls.every((url) => url.startsWith("https://docs.aws.amazon.com/")), `${question.id}: official source URLs`);
    assert.ok(question.choices.length >= 4, `${question.id}: options`);
    for (const choice of question.choices) {
      assert.match(question.explanation, new RegExp(`${choice.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} — (Correct|Incorrect)\\.`), `${question.id}: missing choice explanation`);
    }
    const evidence = audit.selectedItems.find((entry) => entry.newQuestionId === question.id);
    assert.ok(evidence, `${question.id}: audit record`);
    assert.equal(evidence.currentObjectiveMapping.objectiveId, objectiveId);
    assert.equal(evidence.repositoryMapping.topicId, question.topicId);
    assert.ok(evidence.pdfCandidateRefs.length > 0, `${question.id}: PDF candidate reference`);
  }
});

test("the multiple-response root-security item remains correct under shuffled display order", () => {
  const question = batch.find((entry) => entry.id === "q-saa-auditbatch-01");
  assert.ok(Array.isArray(question.answer));
  assert.equal(question.choices.length, 5);
  for (let seed = 0; seed < 40; seed += 1) {
    const displayed = shuffleQuestionChoices(question, mulberry32(seed));
    const correctTexts = question.answer.map((index) => question.choices[index]);
    const displayedAnswer = correctTexts.map((text) => displayed.choices.indexOf(text));
    assert.ok(displayedAnswer.every((index) => index >= 0));
    assert.equal(isCorrect(displayed, displayedAnswer), true);
    assert.equal(isCorrect(displayed, displayedAnswer.slice(0, 1)), false);
  }
});

test("option-by-option explanations are rendered after submission and in missed-question review", () => {
  const runner = readFileSync(new URL("../app/components/QuizRunner.tsx", import.meta.url), "utf8");
  const explanation = readFileSync(new URL("../app/components/ExplanationText.tsx", import.meta.url), "utf8");
  assert.match(runner, /data-quiz-feedback[\s\S]*?<ExplanationText text=\{current\.explanation\} \/>/);
  assert.match(runner, /<ExplanationText text=\{question\.explanation\} \/>/);
  assert.match(explanation, /text\.split\("\\n"\)/);
  for (const question of batch) {
    for (const choice of question.choices) {
      assert.ok(question.explanation.includes(`${choice} — Correct.`) || question.explanation.includes(`${choice} — Incorrect.`));
    }
  }
});

test("PDF identity and heading-count discrepancy are recorded without using the question PDF as scope authority", () => {
  assert.equal(audit.sourcePdf.pageCount, 589);
  assert.equal(audit.sourcePdf.sha256, "61f0caeca9c81cdd99d24b807250cf39336a992782120c2588ca9a874e163dd1");
  assert.equal(audit.sourcePdf.questionHeadingCount, 1259);
  assert.equal(audit.sourcePdf.earlierReportedCount, 1213);
  assert.equal(audit.currentOfficialGuide.version, "1.1");
  assert.match(audit.sourcePdf.provenance, /Redistribution permission was not established/);
});
