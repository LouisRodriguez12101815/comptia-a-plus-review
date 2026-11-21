import assert from "node:assert/strict";
import { createHash as sha256 } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildExamPool } from "../lib/exam-test.mjs";
import { questions as servedQuestions, topics } from "../lib/content.ts";
import { SAA_TAG_FIELDS, withoutSaaTagFields } from "../lib/saa-tags.ts";

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));
const questions = read("content/questions.json");
const audit = read("docs/saa-c03-question-bank-audit.json");
const saa = questions.filter((question) => question.examCodes?.includes("saa-c03"));

function assertSaaAuditCoverage(bank, reviewed) {
  const selected = bank.filter((question) => question.examCodes?.includes("saa-c03"));
  const ids = reviewed.questionMappings.map((row) => row.questionId);
  const idSet = new Set(ids);
  if (idSet.size !== ids.length) throw new Error("duplicate audit mappings");
  const missing = selected.filter((question) => !idSet.has(question.id)).map((question) => question.id);
  if (reviewed.questionMappings.length !== selected.length || missing.length > 0) {
    throw new Error(`SAA questions missing an audit mapping: ${missing.join(", ") || "count mismatch"}`);
  }
  for (const question of selected) {
    const mapping = reviewed.questionMappings.find((row) => row.questionId === question.id);
    if (!question.objectiveIds?.["saa-c03"]?.includes(mapping.taskId)) throw new Error(`${question.id}: task`);
    if (mapping.domainId !== `${mapping.taskId[0]}.0`) throw new Error(`${question.id}: domain`);
    if (!reviewed.skillCatalog[mapping.skillId]) throw new Error(`${question.id}: unknown skill ${mapping.skillId}`);
    if (reviewed.skillCatalog[mapping.skillId].text !== mapping.skill) throw new Error(`${question.id}: skill text`);
  }
}
const reviewedNewIds = new Set(audit.after.newQuestionIds);
const newQuestions = saa.filter((question) => reviewedNewIds.has(question.id));

test("SAA audit maps each existing and new question to one current task and skill", () => {
  assertSaaAuditCoverage(servedQuestions, audit);
  assert.equal(new Set(audit.after.byTask && Object.keys(audit.after.byTask)).size, 14);
  assert.deepEqual(audit.baseline.objectiveStatuses, audit.after.objectiveStatuses);
  assert.ok(Object.values(audit.after.objectiveStatuses).every((status) => status === "partial"));
});

test("the 24 added SAA questions have unique IDs, supported formats, and a rationale for each displayed choice", () => {
  assert.equal(newQuestions.length, 24);
  assert.equal(audit.after.newQuestionIds.length, 24);
  assert.equal(new Set(questions.map((question) => question.id)).size, questions.length);
  const addedIds = new Set(audit.countStages.find((stage) => stage.stage === "after-explanation-rewrite").addedIds);
  const bankOrCost = saa.filter((question) => question.id.startsWith("q-saa-bank-") || question.id.startsWith("q-saa-costbatch-"));
  assert.equal(bankOrCost.length, reviewedNewIds.size + addedIds.size);
  for (const question of bankOrCost) {
    assert.ok(reviewedNewIds.has(question.id) || addedIds.has(question.id), question.id);
  }
  assert.equal(newQuestions.filter((question) => Array.isArray(question.answer)).length, 2);
  assert.equal(newQuestions.filter((question) => !Array.isArray(question.answer)).length, 22);

  for (const question of newQuestions) {
    const multiple = Array.isArray(question.answer);
    assert.equal(question.format, multiple ? "multiple" : "single", question.id);
    if (multiple) {
      assert.ok(question.answer.length >= 2, question.id);
      assert.ok(question.choices.length >= 5, question.id);
    }
    assert.ok(question.sourceUrls.every((url) => url.startsWith("https://docs.aws.amazon.com/") || url.startsWith("https://aws.amazon.com/")), question.id);
    assert.ok(question.sourceUrls.includes(audit.domains.find((domain) => domain.domainId === `${question.objectiveIds["saa-c03"][0][0]}.0`).guideUrl), question.id);
    if (question.id.startsWith("q-saa-costbatch-")) {
      const review = audit.newQuestionReview.find((row) => row.id === question.id);
      assert.ok(review?.sourceEvidence?.length, `${question.id}: missing source evidence`);
      for (const evidence of review.sourceEvidence) {
        assert.ok(question.sourceUrls.includes(evidence.sourceUrl), `${question.id}: unlinked evidence URL`);
        assert.ok(evidence.summary.length > 30, `${question.id}: thin source claim`);
      }
    }

    const lines = question.explanation.split("\n");
    assert.equal(lines.length, question.choices.length, question.id);
    question.choices.forEach((choice, index) => {
      const line = lines[index];
      const correct = multiple ? question.answer.includes(index) : question.answer === index;
      assert.match(line, new RegExp(`^Option: ${escapeRegExp(choice)} — ${correct ? "Correct" : "Incorrect"}: .{40,}$`), question.id);
    });
  }
});


test("SAA inventory stages are counted from the specified base and both explicit addition batches", () => {
  const baseCommit = "1f7bed30009be12ecbc5bd4dca97c51d207aff6e";
  let baseQuestions;
  try {
    baseQuestions = JSON.parse(execFileSync("git", ["show", `${baseCommit}:content/questions.json`], {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    }));
  } catch {
    // Shallow clones may not contain the freeze commit; fetch just that blob when possible.
    execFileSync("git", ["fetch", "--depth=1", "origin", baseCommit], { stdio: "ignore" });
    baseQuestions = JSON.parse(execFileSync("git", ["show", `${baseCommit}:content/questions.json`], {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    }));
  }
  const count = (records) => {
    const selected = records.filter((question) => question.examCodes?.includes("saa-c03"));
    const byDomain = { "1.0": 0, "2.0": 0, "3.0": 0, "4.0": 0 };
    const byTask = Object.fromEntries(["1.1", "1.2", "1.3", "2.1", "2.2", "3.1", "3.2", "3.3", "3.4", "3.5", "4.1", "4.2", "4.3", "4.4"].map((id) => [id, 0]));
    for (const question of selected) {
      const task = question.objectiveIds?.["saa-c03"]?.[0];
      assert.ok(task, `${question.id}: missing primary task`);
      byDomain[`${task[0]}.0`] += 1;
      byTask[task] += 1;
    }
    return { saaQuestionCount: selected.length, uniqueIdCount: new Set(selected.map((question) => question.id)).size, byDomain, byTask };
  };

  const baseStage = audit.countStages.find((stage) => stage.stage === "base");
  const bankStage = audit.countStages.find((stage) => stage.stage === "after-transferred-bank-batch");
  const costStage = audit.countStages.find((stage) => stage.stage === "current-after-cost-batch");
  assert.deepEqual(count(baseQuestions), { saaQuestionCount: 149, uniqueIdCount: 149, byDomain: baseStage.byDomain, byTask: baseStage.byTask });
  assert.equal(baseStage.commit, baseCommit);
  assert.equal(baseStage.saaQuestionCount, 149);
  const bankAdds = questions.filter((question) => question.id.startsWith("q-saa-bank-"));
  assert.deepEqual(count([...baseQuestions, ...bankAdds]), { saaQuestionCount: bankStage.saaQuestionCount, uniqueIdCount: bankStage.uniqueIdCount, byDomain: bankStage.byDomain, byTask: bankStage.byTask });
  assert.equal(bankStage.saaQuestionCount, 165);
  assert.deepEqual(bankStage.formats, { singleAnswer: 155, multipleResponse: 10 });
  assert.deepEqual(costStage.formats, { singleAnswer: 162, multipleResponse: 11 });
  assert.equal(bankStage.addedIds.length, 16);
  assert.ok(bankStage.addedIds.every((id) => id.startsWith("q-saa-bank-")));
  assert.equal(costStage.saaQuestionCount, 173);
  assert.equal(costStage.addedIds.length, 8);
  assert.ok(costStage.addedIds.every((id) => id.startsWith("q-saa-costbatch-")));
  assert.deepEqual(bankStage.byDomain, { "1.0": 41, "2.0": 31, "3.0": 66, "4.0": 27 });
  assert.deepEqual(costStage.byDomain, { "1.0": 41, "2.0": 31, "3.0": 66, "4.0": 35 });
  const later = [
    ["after-practice-guide-batch", "2b10f65dd88c043f7bfd1f840128c71f2249034f", 282, 109],
    ["after-chapter-batch", "6755293c5e86860340b2f44a0a2b8c978b9991b1", 308, 26],
    ["after-chapter-phase-a", "fe7179d4f2cf25aef02782a06785d2a906017d91", 314, 6],
  ];
  for (const [stageName, commit, expectedCount, addedCount] of later) {
    const stage = audit.countStages.find((item) => item.stage === stageName);
    assert.ok(stage, stageName);
    assert.equal(stage.commit, commit, stageName);
    assert.equal(stage.saaQuestionCount, expectedCount, stageName);
    assert.equal(stage.addedIds.length, addedCount, stageName);
    const snapshot = JSON.parse(execFileSync("git", ["show", `${commit}:content/questions.json`], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }));
    assert.deepEqual(count(snapshot), { saaQuestionCount: stage.saaQuestionCount, uniqueIdCount: stage.uniqueIdCount, byDomain: stage.byDomain, byTask: stage.byTask });
    assert.deepEqual(stage.formats, countFormats(snapshot));
  }
  const liveStage = audit.countStages.find((stage) => stage.stage === "after-explanation-rewrite");
  assert.equal(liveStage.commit, null);
  assert.deepEqual(count(questions), { saaQuestionCount: 319, uniqueIdCount: 319, byDomain: liveStage.byDomain, byTask: liveStage.byTask });
  assert.equal(liveStage.byTask["4.3"], 12);
  assert.equal(liveStage.byTask["4.4"], 21);
  assert.equal(audit.baseline.commit, baseCommit);
});

function countFormats(records) {
  const selected = records.filter((question) => question.examCodes?.includes("saa-c03"));
  return {
    singleAnswer: selected.filter((question) => !Array.isArray(question.answer)).length,
    multipleResponse: selected.filter((question) => Array.isArray(question.answer)).length,
  };
}

test("new and corrected question source checks include every option and retain the unresolved scope issue", () => {
  const verifications = [
    ...audit.newQuestionReview.map((row) => ({ id: row.id, verification: row.sourceVerification, choices: questions.find((question) => question.id === row.id).choices })),
    ...audit.questionCorrections.map((row) => ({ id: row.questionId, verification: row.sourceVerification, choices: questions.find((question) => question.id === row.questionId).choices })),
  ];
  assert.equal(verifications.length, 25);
  for (const { id, verification, choices } of verifications) {
    assert.ok(verification, `${id}: source verification missing`);
    assert.equal(verification.retrievalDate, "2026-11-20", id);
    assert.equal(verification.status, "verified", id);
    assert.ok(verification.officialUrls.length > 0, `${id}: no exact official URL`);
    assert.ok(verification.officialUrls.every((url) => url.startsWith("https://docs.aws.amazon.com/") || url.startsWith("https://aws.amazon.com/")), id);
    assert.equal(verification.optionExplanationsChecked.length, choices.length, id);
    choices.forEach((choice, index) => {
      const checked = verification.optionExplanationsChecked[index];
      assert.equal(checked.choice, choice, `${id}: option order`);
      assert.equal(checked.optionIndex, index, `${id}: option index`);
      assert.equal(checked.checked, true, `${id}: unchecked choice`);
      assert.ok(checked.officialSourceUrls.length > 0, `${id}: option ${index} has no official source`);
    });
  }
  assert.match(audit.officialScope.serviceListCaveat, /does not itself prove inclusion/i);
  assert.match(audit.roundTwo.sourceAccess.outOfScopeServiceDiscrepancy, /Unresolved/);
});

test("pre-existing SAA questions are unchanged from the audit baseline", () => {
  const tagStage = audit.hashStages.find((stage) => stage.id === "exclude-study-tags");
  assert.ok(tagStage, "missing exclude-study-tags hash stage");
  assert.deepEqual(tagStage.excludedFields, [...SAA_TAG_FIELDS]);
  assert.equal(tagStage.rewritesBaseline, false);
  const liveHashStage = audit.hashStages.find((stage) => stage.id === "live-314-exclude-study-tags");
  assert.equal(liveHashStage.questionCount, 314);
  assert.equal(liveHashStage.rewritesBaseline, false);
  assert.deepEqual(liveHashStage.excludedFields, [...SAA_TAG_FIELDS]);
  assert.equal(liveHashStage.questions.length, 314);
  const liveHashes = new Map(liveHashStage.questions.map((row) => [row.id, row.sha256]));
  assert.deepEqual(audit.changeStages.map((stage) => stage.id), ["explanation-rewrite", "distractor-realism", "answer-length-cue", "answer-length-cue-2", "answer-cue-2b"]);
  for (const stage of audit.changeStages) assert.deepEqual(stage.excludedFields, [...SAA_TAG_FIELDS]);
  const changeStage = audit.changeStages.find((stage) => stage.id === "explanation-rewrite");
  const changes = new Map(changeStage.items.map((row) => [row.id, row]));
  assert.equal(changes.size, changeStage.items.length);
  assert.equal(changes.size, 56);
  const chains = new Map();
  for (const stage of audit.changeStages) {
    for (const row of stage.items) {
      const chain = chains.get(row.id) ?? [];
      chain.push(row);
      chains.set(row.id, chain);
    }
  }
  for (const question of saa) {
    const digest = sha256("sha256").update(JSON.stringify(withoutSaaTagFields(question))).digest("hex");
    const chain = chains.get(question.id);
    if (chain) {
      assert.equal(digest, chain.at(-1).newHash, `${question.id}: change-stage hash`);
      if (chain[0].oldHash === null) assert.equal(liveHashes.has(question.id), false, `${question.id}: new id already in the 314 stage`);
      else assert.equal(chain[0].oldHash, liveHashes.get(question.id), `${question.id}: old hash is not the 314 stage`);
      for (let index = 1; index < chain.length; index += 1) {
        assert.equal(chain[index].oldHash, chain[index - 1].newHash, `${question.id}: stage ${index} does not cite the previous hash`);
      }
    } else {
      assert.equal(digest, liveHashes.get(question.id), `${question.id}: live preservation hash`);
    }
  }
  const currentById = new Map(saa.map((question) => [question.id, question]));
  assert.equal(audit.preservationBaseline.questionCount, 149);
  assert.equal(audit.preservationBaseline.questions.length, 149);
  const corrections = new Map((audit.questionCorrections ?? []).map((row) => [row.questionId, row]));
  for (const baseline of audit.preservationBaseline.questions) {
    const current = currentById.get(baseline.id);
    assert.ok(current, `missing existing question ${baseline.id}`);
    const digest = sha256("sha256").update(JSON.stringify(withoutSaaTagFields(current))).digest("hex");
    const correction = corrections.get(baseline.id);
    const chain = chains.get(baseline.id);
    if (correction) {
      assert.equal(correction.beforeSha256, baseline.sha256, `${baseline.id}: correction does not cite baseline`);
      assert.equal(digest, correction.afterSha256, `${baseline.id}: corrected record differs from reviewed record`);
    } else if (chain) {
      assert.equal(chain[0].oldHash, baseline.sha256, `${baseline.id}: rewrite does not cite the 149 baseline`);
      assert.equal(digest, chain.at(-1).newHash, `${baseline.id}: rewritten record differs from the change stage`);
    } else {
      assert.equal(digest, baseline.sha256, `modified existing question ${baseline.id}`);
    }
  }
  assert.deepEqual([...corrections.keys()], ["q-saa-arch-31"]);
  assert.deepEqual(audit.questionClarifications.map((row) => row.questionId), ["q-saa-bank-002", "q-saa-bank-012"]);

  const spot = currentById.get("q-saa-arch-31");
  assert.match(spot.prompt, /can provide a discounted price when spare capacity is available/);
  assert.match(spot.explanation, /availability are not guaranteed/i);
  assert.ok(spot.sourceUrls.includes("https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-best-practices.html"));
  assert.equal(spot.explanation.split("\n").length, spot.choices.length);
  spot.choices.forEach((choice, index) => {
    assert.match(spot.explanation.split("\n")[index], new RegExp(`^Option: ${escapeRegExp(choice)} — ${index === spot.answer ? "Correct" : "Incorrect"}: .{40,}$`));
  });

  const endpoint = currentById.get("q-saa-bank-002");
  assert.match(endpoint.prompt, /already has IAM permission/);
  assert.match(endpoint.explanation, /does not grant that permission/);
  const gsi = currentById.get("q-saa-bank-012");
  assert.match(gsi.prompt, /modest and comfortably within the projected GSI partition throughput/);
  assert.match(gsi.explanation, /hot-partition risk if traffic grows/);
});

test("five original task 4.3 questions are new ids with one line per choice", () => {
  const stage = audit.countStages.find((item) => item.stage === "after-explanation-rewrite");
  assert.deepEqual(stage.addedIds, [
    "q-saa-costbatch-009",
    "q-saa-costbatch-010",
    "q-saa-costbatch-011",
    "q-saa-costbatch-012",
    "q-saa-costbatch-013",
  ]);
  for (const id of stage.addedIds) {
    const question = saa.find((item) => item.id === id);
    assert.ok(question, id);
    assert.equal(question.format, "single", id);
    assert.deepEqual(question.objectiveIds["saa-c03"], ["4.3"], id);
    assert.equal(audit.newQuestionReview.find((row) => row.id === id), undefined, id);
    const lines = question.explanation.split("\n");
    assert.equal(lines.length, question.choices.length, id);
    question.choices.forEach((choice, index) => {
      const correct = question.answer === index;
      assert.match(lines[index], new RegExp(`^${escapeRegExp(choice)} — ${correct ? "Correct" : "Incorrect"}\\. .{20,}$`), id);
    });
  }
});

test("network-cost items move from task 4.3 to task 4.4 and shared CLF answers stay put", () => {
  const changeStage = audit.changeStages.find((stage) => stage.id === "explanation-rewrite");
  const changes = new Map(changeStage.items.map((row) => [row.id, row]));
  const retags = [
    ["q-saa-practice-50", "4.4-S02"],
    ["q-saa-guide-48", "4.4-S02"],
    ["q-saa-practice-51", "4.4-S05"],
    ["q-saa-guide-49", "4.4-S05"],
    ["q-saa-practice-52", "4.4-S04"],
    ["q-saa-guide-50", "4.4-S04"],
  ];
  for (const [id, skillId] of retags) {
    const row = changes.get(id);
    assert.equal(row.oldTask, "4.3", id);
    assert.equal(row.newTask, "4.4", id);
    assert.equal(row.skillId, skillId, id);
    assert.deepEqual(questions.find((question) => question.id === id).objectiveIds["saa-c03"], ["4.4"], id);
  }
  const parent = JSON.parse(execFileSync("git", ["show", "91a68b6:content/questions.json"], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  }));
  const parentById = new Map(parent.map((question) => [question.id, question]));
  const distractorIds = new Set(audit.changeStages.find((stage) => stage.id === "distractor-realism").items.map((row) => row.id));
  const lengthCueIds = new Set(audit.changeStages.filter((stage) => stage.id === "answer-length-cue" || stage.id === "answer-length-cue-2" || stage.id === "answer-cue-2b").flatMap((stage) => stage.items.map((row) => row.id)));
  assert.equal(distractorIds.size, 10);
  for (const row of changeStage.items) {
    if (!row.reason.includes("CLF objective tags are unchanged")) continue;
    const current = questions.find((question) => question.id === row.id);
    const previous = parentById.get(row.id);
    assert.deepEqual(current.answer, previous.answer, row.id);
    if (!distractorIds.has(row.id) && !lengthCueIds.has(row.id)) assert.deepEqual(current.choices, previous.choices, row.id);
    assert.deepEqual(current.examCodes, previous.examCodes, row.id);
    assert.deepEqual(current.objectiveIds["clf-c02"] ?? null, previous.objectiveIds["clf-c02"] ?? null, row.id);
  }
  const shared = questions.filter((question) => question.id.startsWith("q-aws-found-") && question.examCodes?.includes("saa-c03"));
  assert.ok(shared.length > 0);
  for (const current of shared) {
    const previous = parentById.get(current.id);
    assert.deepEqual(current.answer, previous.answer, current.id);
    assert.deepEqual(current.objectiveIds["clf-c02"], previous.objectiveIds["clf-c02"], current.id);
  }
});

test("the high-yield fill is stage 319 to 335 and every id is in the saa-c03 mock pool", () => {
  const stage = audit.countStages.find((item) => item.stage === "after-high-yield-fill");
  assert.equal(stage.commit, "98d9caec40ad7d213d924b8be01a442fda8665cb");
  assert.equal(stage.saaQuestionCount, 335);
  assert.equal(stage.addedIds.length, 16);
  const tasks = ["1.1", "1.2", "1.3", "2.1", "2.2", "3.1", "3.2", "3.3", "3.4", "3.5", "4.1", "4.2", "4.3", "4.4"];
  const byTask = Object.fromEntries(tasks.map((id) => [id, 0]));
  const byDomain = { "1.0": 0, "2.0": 0, "3.0": 0, "4.0": 0 };
  const servedSaa = servedQuestions.filter((question) => question.examCodes?.includes("saa-c03"));
  for (const question of servedSaa) {
    const task = question.objectiveIds["saa-c03"][0];
    byDomain[`${task[0]}.0`] += 1;
    byTask[task] += 1;
  }
  assert.deepEqual({
    saaQuestionCount: servedSaa.length,
    uniqueIdCount: new Set(servedSaa.map((question) => question.id)).size,
    byDomain,
    byTask,
  }, {
    saaQuestionCount: stage.saaQuestionCount,
    uniqueIdCount: stage.uniqueIdCount,
    byDomain: stage.byDomain,
    byTask: stage.byTask,
  });
  const hashStage = audit.hashStages.find((item) => item.id === "high-yield-fill-exclude-study-tags");
  assert.equal(hashStage.rewritesBaseline, false);
  assert.deepEqual(hashStage.excludedFields, [...SAA_TAG_FIELDS]);
  assert.equal(hashStage.questionCount, 16);
  const hashes = new Map(hashStage.questions.map((row) => [row.id, row.sha256]));
  assert.deepEqual([...hashes.keys()], stage.addedIds);
  const retask = audit.hashStages.find((item) => item.id === "high-yield-fill-task-check");
  assert.equal(retask.rewritesBaseline, false);
  assert.deepEqual(retask.excludedFields, [...SAA_TAG_FIELDS]);
  assert.equal(retask.questionCount, 1);
  const retaskById = new Map(retask.questions.map((row) => [row.id, row]));
  const preserved = new Set(audit.hashStages.find((item) => item.id === "live-314-exclude-study-tags").questions.map((row) => row.id));
  const cueStages = ["answer-length-cue", "answer-length-cue-2", "answer-cue-2b"].map((id) => new Map(audit.changeStages.find((item) => item.id === id).items.map((row) => [row.id, row])));
  for (const id of stage.addedIds) {
    const question = servedQuestions.find((item) => item.id === id);
    const digest = sha256("sha256").update(JSON.stringify(withoutSaaTagFields(question))).digest("hex");
    let expected = hashes.get(id);
    const moved = retaskById.get(id);
    if (moved) {
      assert.equal(moved.oldHash, expected, id);
      expected = moved.sha256;
    }
    for (const cue of cueStages) {
      const row = cue.get(id);
      if (!row) continue;
      assert.equal(row.oldHash, expected, id);
      expected = row.newHash;
    }
    assert.equal(digest, expected, id);
    assert.equal(preserved.has(id), false, id);
  }
  const objectives = read("content/objectives.json");
  const pool = buildExamPool({ objectives, questions: servedQuestions, topics, examCode: "saa-c03" });
  for (const id of stage.addedIds) {
    const question = servedQuestions.find((item) => item.id === id);
    const task = question.objectiveIds["saa-c03"][0];
    const objective = pool.domains.flatMap((domain) => domain.objectives).find((item) => item.id === task);
    assert.ok(objective.questionIds.includes(id), `${id} missing from task ${task}`);
  }
});

test("a side-file question with no audit entry fails coverage", () => {
  const fixture = read("tests/fixtures/saa-unaudited-question.json");
  assert.equal(servedQuestions.some((question) => question.id === fixture.id), false);
  assert.throws(() => assertSaaAuditCoverage([...servedQuestions, fixture], audit), /q-saa-fixture-unaudited/);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
