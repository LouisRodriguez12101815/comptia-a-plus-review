import assert from "node:assert/strict";
import { createHash as sha256 } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));
const questions = read("content/questions.json");
const audit = read("docs/saa-c03-question-bank-audit.json");
const saa = questions.filter((question) => question.examCodes?.includes("saa-c03"));
const newQuestions = saa.filter((question) => question.id.startsWith("q-saa-bank-") || question.id.startsWith("q-saa-costbatch-"));
const auditedIds = new Set(audit.questionMappings.map((row) => row.questionId));
const auditedSaa = saa.filter((question) => auditedIds.has(question.id));

test("SAA audit maps each existing and new question to one current task and skill", () => {
  // Mappings freeze the audited inventory; later practice/guide rounds may add unmapped live items.
  assert.equal(audit.questionMappings.length, auditedSaa.length);
  assert.equal(new Set(audit.questionMappings.map((row) => row.questionId)).size, auditedSaa.length);
  assert.ok(saa.length >= auditedSaa.length);
  for (const question of auditedSaa) {
    const mapping = audit.questionMappings.find((row) => row.questionId === question.id);
    assert.ok(mapping, question.id);
    assert.ok(question.objectiveIds["saa-c03"].includes(mapping.taskId), question.id);
    assert.equal(mapping.domainId, `${mapping.taskId[0]}.0`, question.id);
    assert.ok(audit.skillCatalog[mapping.skillId], `${question.id}: ${mapping.skillId}`);
    assert.equal(audit.skillCatalog[mapping.skillId].text, mapping.skill, question.id);
  }
  assert.equal(new Set(audit.after.byTask && Object.keys(audit.after.byTask)).size, 14);
  assert.deepEqual(audit.baseline.objectiveStatuses, audit.after.objectiveStatuses);
  assert.ok(Object.values(audit.after.objectiveStatuses).every((status) => status === "partial"));
});

test("the 24 added SAA questions have unique IDs, supported formats, and a rationale for each displayed choice", () => {
  assert.equal(newQuestions.length, 24);
  assert.equal(new Set(questions.map((question) => question.id)).size, questions.length);
  const expectedIds = new Set(audit.after.newQuestionIds);
  assert.deepEqual(new Set(newQuestions.map((question) => question.id)), expectedIds);
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
  } catch (error) {
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
  // costStage freezes inventory after the cost batch. Later practice/guide rounds may grow the live bank.
  const costOnly = questions.filter((question) => {
    const id = question.id ?? "";
    return question.examCodes?.includes("saa-c03") && !id.startsWith("q-saa-practice-") && !id.startsWith("q-saa-guide-");
  });
  assert.deepEqual(costStage, { ...costStage, ...count(costOnly) });
  const live = count(questions);
  assert.ok(live.saaQuestionCount >= costStage.saaQuestionCount, live.saaQuestionCount);
  assert.equal(live.uniqueIdCount, live.saaQuestionCount);
  assert.equal(audit.baseline.commit, baseCommit);
});

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
  const currentById = new Map(saa.map((question) => [question.id, question]));
  assert.equal(audit.preservationBaseline.questionCount, 149);
  assert.equal(audit.preservationBaseline.questions.length, 149);
  const corrections = new Map((audit.questionCorrections ?? []).map((row) => [row.questionId, row]));
  for (const baseline of audit.preservationBaseline.questions) {
    const current = currentById.get(baseline.id);
    assert.ok(current, `missing existing question ${baseline.id}`);
    const digest = sha256("sha256").update(JSON.stringify(current)).digest("hex");
    const correction = corrections.get(baseline.id);
    if (correction) {
      assert.equal(correction.beforeSha256, baseline.sha256, `${baseline.id}: correction does not cite baseline`);
      assert.equal(digest, correction.afterSha256, `${baseline.id}: corrected record differs from reviewed record`);
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
