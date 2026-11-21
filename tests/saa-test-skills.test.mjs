import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { qualifierTwins } from "../content/saa-qualifier-twins.ts";
import { buildExamPool, draftTest, mulberry32, questionsForLength } from "../lib/exam-test.mjs";
import { drillDecks } from "../lib/practice/drills.ts";
import { parseProgress } from "../lib/progress.ts";
import { questions, topics } from "../lib/content.ts";
import {
  CSV_COLUMNS, SAA_CLUSTERS, SAA_MINI_SECONDS, SAA_PACE_SECONDS, deckCardFacts, isLuckyGuess, isSlowAnswer,
  miniMockQuota, mostCommonMissReason, orderedTwinIds, questionsInCluster, reasonTools, rotatePracticeIds,
  saaAttemptCsv, saaReviewMisses, saaRotationHistory, selectTopicQuiz,
} from "../lib/saa-test-skills.ts";

const objectives = JSON.parse(readFileSync(new URL("../content/objectives.json", import.meta.url), "utf8"));
const tasks = new Set(objectives.exams.find((exam) => exam.code === "saa-c03").domains.flatMap((domain) => domain.objectives.map((objective) => objective.id)));

test("a correct unsure or guess is a lucky guess and still not a wrong answer", () => {
  assert.equal(isLuckyGuess("unsure", true), true);
  assert.equal(isLuckyGuess("guess", true), true);
  assert.equal(isLuckyGuess("sure", true), false);
  assert.equal(isLuckyGuess("guess", false), false);
  const rows = saaReviewMisses([{
    exam: "saa-c03",
    questionIds: ["q-saa-core-01"],
    missedIds: [],
    luckyIds: ["q-saa-core-01"],
  }], questions);
  assert.equal(rows[0].lucky, true);
  assert.equal(rows[0].id, "q-saa-core-01");
});

test("mini-mock is 20 questions and 40 minutes at the published domain weights", () => {
  assert.equal(questionsForLength("saa-c03", "mini"), 20);
  assert.throws(() => questionsForLength("clf-c02", "mini"));
  assert.equal(SAA_MINI_SECONDS, 40 * 60);
  assert.equal(SAA_PACE_SECONDS, 120);
  const weights = objectives.exams.find((exam) => exam.code === "saa-c03").domains.map((domain) => ({ id: domain.id, weight: domain.weight, available: 100 }));
  assert.deepEqual(weights.map((domain) => domain.weight), [30, 26, 24, 20]);
  assert.deepEqual(miniMockQuota(weights), { "1.0": 6, "2.0": 5, "3.0": 5, "4.0": 4 });
});

test("each high-yield cluster can supply a topic quiz of at most 15 questions", () => {
  assert.equal(SAA_CLUSTERS.length, 16);
  for (const cluster of SAA_CLUSTERS) {
    const available = questionsInCluster(cluster.id, questions);
    assert.ok(available.length > 0, cluster.id);
    const picked = selectTopicQuiz(cluster.id, questions);
    assert.ok(picked.length > 0 && picked.length <= 15, cluster.id);
    if (available.length >= 15) assert.equal(picked.length, 15, cluster.id);
    assert.equal(new Set(picked).size, picked.length);
  }
});

test("ten qualifier twins share a scenario, change the answer, and carry an audit entry", () => {
  assert.equal(qualifierTwins.length, 20);
  assert.equal(new Set(orderedTwinIds(qualifierTwins)).size, 20);
  const pairs = new Map();
  for (const question of qualifierTwins) {
    const group = pairs.get(question.pairId) ?? [];
    group.push(question);
    pairs.set(question.pairId, group);
    assert.ok(tasks.has(question.audit.taskId), question.id);
    assert.deepEqual(question.objectiveIds["saa-c03"], [question.audit.taskId]);
    assert.equal(question.audit.retrievalDate, "2026-11-20");
    assert.ok(question.audit.docsUrl.startsWith("https://docs.aws.amazon.com/"), question.id);
    assert.ok(question.sourceUrls.includes(question.audit.docsUrl));
    assert.equal(question.explanation.split("\n").length, question.choices.length, question.id);
    question.choices.forEach((choice, index) => {
      const line = question.explanation.split("\n")[index];
      const verdict = index === question.answer ? "Correct" : "Incorrect";
      assert.ok(line.startsWith(`Option: ${choice} — ${verdict}: `), question.id);
      assert.ok(line.length >= `Option: ${choice} — ${verdict}: `.length + 40, question.id);
    });
  }
  assert.equal(pairs.size, 10);
  for (const [pairId, group] of pairs) {
    assert.equal(group.length, 2, pairId);
    assert.equal(group[0].scenario, group[1].scenario);
    assert.notEqual(group[0].qualifier, group[1].qualifier);
    assert.notEqual(group[0].choices[group[0].answer], group[1].choices[group[1].answer]);
  }
});

test("miss reasons point at a tool and the most common one wins", () => {
  const reason = mostCommonMissReason([
    { missReasons: { a: "qualifier", b: "confused" } },
    { missReasons: { c: "confused" } },
  ]);
  assert.equal(reason, "confused");
  const tools = reasonTools("1.1");
  assert.deepEqual(tools.map((tool) => tool.reason), ["qualifier", "confused", "unknown", "time"]);
  assert.match(tools.find((tool) => tool.reason === "qualifier").href, /keyword/);
  assert.match(tools.find((tool) => tool.reason === "confused").href, /aws-saa-confusion/);
  assert.match(tools.find((tool) => tool.reason === "unknown").href, /task=1\.1/);
  assert.match(tools.find((tool) => tool.reason === "time").href, /session=speed/);
});

test("the review flags a question that took over 3 minutes", () => {
  assert.equal(isSlowAnswer(180), false);
  assert.equal(isSlowAnswer(181), true);
});

test("the CSV is client data with one row per answered SAA question", () => {
  const csv = saaAttemptCsv([{
    exam: "saa-c03",
    at: Date.parse("2026-11-20T15:00:00.000Z"),
    topicId: "aws-saa-storage",
    questionIds: ["q-saa-twin-01-cost"],
    missedIds: [],
    luckyIds: ["q-saa-twin-01-cost"],
    confidenceByQuestion: { "q-saa-twin-01-cost": "unsure" },
    secondsByQuestion: { "q-saa-twin-01-cost": 181 },
    sittingId: "sit-1",
    mode: "twin",
  }, {
    exam: "saa-c03",
    at: Date.parse("2026-11-20T16:00:00.000Z"),
    topicId: "exam-test:saa-c03",
    questionIds: ["q-saa-twin-01-cost"],
    missedIds: [],
    mode: "mock",
  }], questions, "learner-1");
  const lines = csv.trim().split("\n");
  assert.deepEqual(lines[0].split(","), [...CSV_COLUMNS]);
  assert.equal(lines.length, 2);
  assert.match(lines[1], /learner-1,saa-c03,4\.0,4\.1,q-saa-twin-01-cost,true,181,unsure,,sit-1,twin,/);
});

test("a topic quiz drawn twice with history returns a different set when the cluster has more than 15", () => {
  const cluster = SAA_CLUSTERS.find((item) => questionsInCluster(item.id, questions).length > 15);
  assert.ok(cluster, "expected a cluster larger than one sitting");
  const first = selectTopicQuiz(cluster.id, questions, { history: [], rng: mulberry32(1) });
  const second = selectTopicQuiz(cluster.id, questions, { history: first, rng: mulberry32(1) });
  assert.equal(first.length, 15);
  assert.equal(second.length, 15);
  assert.notDeepEqual([...first].sort(), [...second].sort());
  const due = first[0];
  const withDue = selectTopicQuiz(cluster.id, questions, { history: first, dueIds: [due], rng: mulberry32(2) });
  assert.equal(withDue[0], due);
});

test("twin and mini order follow the same fresh-first rotation", () => {
  const ids = orderedTwinIds(qualifierTwins);
  const seen = ids[0];
  const rotated = rotatePracticeIds(ids, { history: [seen], rng: mulberry32(2) });
  assert.notEqual(rotated[0], seen);
  assert.deepEqual([...rotated].sort(), [...ids].sort());
  const due = ids[5];
  assert.equal(rotatePracticeIds(ids, { history: ids, dueIds: [due], rng: mulberry32(3) })[0], due);
});

test("SAA history is every mode, oldest first, and a topic question is not first in the next mock", () => {
  const history = saaRotationHistory({
    quizAttempts: [
      { exam: "saa-c03", at: 30, questionIds: ["q-topic"], mode: "topic" },
      { exam: "saa-c03", at: 10, questionIds: ["q-quiz"], mode: "quiz" },
      { exam: "n10-009", at: 5, questionIds: ["other"] },
      { exam: "saa-c03", at: 15, questionIds: ["q-twin"], mode: "twin" },
    ],
    mockAttempts: [
      { exam: "saa-c03", at: 40, questionIds: ["q-mock"], mode: "mock" },
      { exam: "saa-c03", at: 20, questionIds: ["q-mini"], mode: "mini" },
    ],
  });
  assert.deepEqual(history, ["q-quiz", "q-twin", "q-mini", "q-topic", "q-mock"]);

  const pool = buildExamPool({ objectives, questions, topics, examCode: "saa-c03" });
  const seen = pool.domains[0].objectives.flatMap((objective) => objective.questionIds)[0];
  const draft = draftTest(pool, 20, mulberry32(4), { history: [seen] });
  assert.equal(draft.length, 20);
  assert.equal(draft.some((pick) => pick.questionId === seen), false);
  assert.notEqual(draft[0].questionId, seen);
});

test("the missed list is sure-but-wrong, then other wrong, then lucky guesses", () => {
  const ids = questions.filter((question) => question.examCodes?.includes("saa-c03")).map((question) => question.id).sort();
  const [sure, wrong, lucky, mastered] = ids;
  const rows = saaReviewMisses([{
    exam: "saa-c03",
    at: 1,
    questionIds: [sure, wrong, lucky, mastered],
    missedIds: [sure, wrong],
    luckyIds: [lucky],
    sureIds: [sure],
  }, {
    exam: "saa-c03",
    at: 2,
    questionIds: [mastered],
    missedIds: [],
    luckyIds: [],
  }], questions);
  assert.deepEqual(rows.map((row) => row.id), [sure, wrong, lucky]);
  assert.equal(rows[0].lucky, false);
  assert.equal(rows[2].lucky, true);
  assert.equal(rows.some((row) => row.id === mastered), false);
});

test("every SAA drill deck can show a count, its modes, and a saved best", () => {
  const decks = drillDecks.filter((deck) => deck.exam === "saa-c03" && deck.id.startsWith("aws-saa-"));
  assert.equal(decks.length, 17);
  for (const deck of decks) {
    const facts = deckCardFacts(deck, { bestScore: 4, bestStreak: 3 });
    assert.equal(facts.count, deck.items.length);
    assert.ok(facts.count > 0, deck.id);
    assert.ok(facts.modes.includes("speed") && facts.modes.includes("survival") && facts.modes.includes("missed"), deck.id);
    assert.equal(facts.bestScore, 4);
    assert.equal(facts.bestStreak, 3);
  }
  const saved = parseProgress(JSON.stringify({
    studyFocus: "saa-c03",
    knownCards: {},
    unknownCards: {},
    quizAttempts: [],
    mockAttempts: [],
    schedules: {},
    drillPractice: { missedIds: [], bestStreak: 3, decks: { "aws-saa-storage": { bestScore: 9, bestStreak: 4 } } },
  }));
  assert.equal(saved.problems.length, 0);
  assert.equal(saved.progress.drillPractice.decks["aws-saa-storage"].bestScore, 9);
});
