import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  rankMissedQuestions,
  rankMissedClusters,
  remediationForQuestion,
  videoForQuestion,
  visualForQuestion,
} from "../lib/weak-areas.ts";
import { n10RemediationForQuestion } from "../lib/n10-remediation.ts";

const question = (id, topicId = "topic-a") => ({
  id,
  topicId,
  prompt: `Prompt ${id}`,
  choices: ["First", "Second"],
  answer: 0,
  explanation: `Explanation ${id}`,
});

const emptyProgress = () => ({
  studyFocus: "all",
  knownCards: {},
  unknownCards: {},
  quizAttempts: [],
  mockAttempts: [],
  schedules: {},
});

const video = (overrides = {}) => ({
  slug: "topic-video",
  title: "Topic video",
  description: "A topic video",
  exam: "n10-009",
  objective: "2.1",
  topicId: "topic-a",
  questionId: "other-question",
  duration: 60,
  published: "2026-01-01",
  takeaway: "A takeaway",
  transcript: "Transcript",
  ...overrides,
});

const visual = (overrides = {}) => ({
  file: "topic-visual.html",
  title: "Topic visual",
  description: "A topic visual",
  group: "Topic",
  ...overrides,
});

test("no progress produces an empty, valid fallback selection", () => {
  assert.deepEqual(rankMissedQuestions(emptyProgress(), [question("q1")]), []);
});

test("one missed quiz question is selected and duplicate misses are deduplicated", () => {
  const progress = emptyProgress();
  progress.quizAttempts = [
    { topicId: "topic-a", questionIds: ["q1"], missedIds: ["q1"], at: 1 },
    { topicId: "topic-a", questionIds: ["q1"], missedIds: ["q1"], at: 2 },
  ];

  const result = rankMissedQuestions(progress, [question("q1")]);
  assert.equal(result.length, 1);
  assert.equal(result[0].question.id, "q1");
  assert.equal(result[0].misses, 2);
});

test("repeated misses are prioritized, with recency breaking ties", () => {
  const progress = emptyProgress();
  progress.quizAttempts = [
    { topicId: "topic-a", questionIds: ["q1", "q2"], missedIds: ["q1", "q2"], at: 10 },
    { topicId: "topic-a", questionIds: ["q1"], missedIds: ["q1"], at: 20 },
  ];

  assert.deepEqual(
    rankMissedQuestions(progress, [question("q1"), question("q2")]).map((row) => row.question.id),
    ["q1", "q2"],
  );
});

test("missed clusters rank by count, recency, and stable id", () => {
  const rows = [
    { clusterId: "time", clusterKey: "time", clusterLabel: "Time", misses: 2, latestMissAt: 10 },
    { clusterId: "dhcp", clusterKey: "dhcp", clusterLabel: "DHCP", misses: 2, latestMissAt: 20 },
    { clusterId: "ipam", clusterKey: "ipam", clusterLabel: "IPAM", misses: 1, latestMissAt: 30 },
  ];
  assert.deepEqual(rankMissedClusters(rows), [rows[1], rows[0], rows[2]]);
});

test("missing cluster metadata falls back to the topic and remains deterministic", () => {
  const result = remediationForQuestion({ question: question("q-unknown", "topic-a"), misses: 1, latestMissAt: 5 }, { topicTitleFor: () => "Fallback topic" });
  assert.equal(result.clusterId, "topic:topic-a");
  assert.equal(result.clusterLabel, "Fallback topic");
  assert.equal(result.examClueKey, undefined);
  assert.equal(result.memoryRuleKey, undefined);
});

test("authored N10 clue and memory rule are available for the DHCP cluster", () => {
  const result = remediationForQuestion({ question: question("q-n10dhcp-06", "n10-dhcp-ipam-time"), misses: 1, latestMissAt: 5 });
  assert.equal(result.examClueKey, "dhcpT2");
  assert.equal(result.memoryRuleKey, "dhcpT2");
  assert.equal(result.whyWrongKey, "dhcpT2");
});

test("NTP-source remediation teaches consensus and outlier rejection", () => {
  const result = remediationForQuestion({ question: question("q-n10dhcp-41", "n10-dhcp-ipam-time"), misses: 1, latestMissAt: 5 });
  assert.equal(result.examClueKey, "ntpConsensus");
  assert.equal(result.memoryRuleKey, "ntpConsensus");
  assert.equal(result.whyWrongKey, "ntpConsensus");
});

test("addressing misses use the intended contrast clusters and exclude the missed question", () => {
  const cases = [
    ["q-n10c7-16", "ipv6-eui64", "eui64BitFlip"],
    ["q-n10c7-18", "ipv4-private-link-local", "apipaPrefix"],
    ["q-n10c7-23", "layer2-delivery", "ipBroadcastVsMacBroadcast"],
    ["q-n10c7-27", "ipv6-eui64", "ipv4Ipv6Representation"],
  ];
  const alternatives = cases.map(([id]) => question(id, "n10-ch7"));
  for (const [id, clusterId, guidanceKey] of cases) {
    const metadata = n10RemediationForQuestion(id);
    assert.equal(metadata?.clusterId, clusterId);
    assert.equal(metadata?.examClueKey, guidanceKey);
    const result = remediationForQuestion({ question: question(id, "n10-ch7"), misses: 1, latestMissAt: 5 }, { questions: alternatives });
    assert.equal(result.clusterId, clusterId);
    assert.equal(result.examClueKey, guidanceKey);
    assert.equal(result.retryQuestionIds.includes(id), false);
  }
});

test("all supported locales provide the authored remediation keys", () => {
  for (const locale of ["en", "es", "fr", "pt"]) {
    const messages = JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), "utf8"));
    const remediation = messages.weakAreas.remediation;
    assert.deepEqual(Object.keys(remediation.clusters).sort(), ["dhcpLifecycle", "ipamDdi", "ipv6Controls", "timeSynchronization", "awsEc2GuestOs", "awsRdsDataAccess", "awsPhysicalInfrastructure", "awsLambdaIam", "awsLambdaCode"].sort());
    assert.equal(Object.keys(remediation.examClues).length, 16);
    assert.equal(Object.keys(remediation.memoryRules).length, 16);
    assert.equal(Object.keys(remediation.whyWrong).length, 16);
  }
});

test("all supported locales provide addressing remediation keys", () => {
  const addressingKeys = ["rfc1918Ranges", "apipaVsPrivate", "rfc1918Boundary", "apipaPrefix", "privateRouting", "eui64BitFlip", "ipv4Ipv6Representation", "unicastMulticastBroadcast", "ipBroadcastVsMacBroadcast"];
  for (const locale of ["en", "es", "fr", "pt"]) {
    const messages = JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), "utf8"));
    const remediation = messages.weakAreas.addressingRemediation;
    assert.deepEqual(Object.keys(remediation.clusters).sort(), ["ipv4PrivateLinkLocal", "ipv6Eui64", "layer2Delivery"].sort());
    assert.equal(Object.keys(remediation.examClues).length, 9);
    assert.equal(Object.keys(remediation.memoryRules).length, 9);
    assert.equal(Object.keys(remediation.whyWrong).length, 9);
    for (const key of addressingKeys) {
      assert.ok(remediation.examClues[key], `${locale} is missing exam clue ${key}`);
      assert.ok(remediation.memoryRules[key], `${locale} is missing memory rule ${key}`);
      assert.ok(remediation.whyWrong[key], `${locale} is missing why-wrong guidance ${key}`);
    }
  }
});

test("APIPA content uses link-local CIDR terminology", () => {
  const questions = JSON.parse(readFileSync(new URL("../content/questions.json", import.meta.url), "utf8"));
  const topics = JSON.parse(readFileSync(new URL("../content/topics-network-plus.json", import.meta.url), "utf8"));
  const apipaQuestion = questions.find((item) => item.id === "q-n10c7-18");
  const addressingTopic = topics.find((item) => item.id === "n10-ch7");
  const topicText = JSON.stringify(addressingTopic);
  assert.match(apipaQuestion.explanation, /169\.254\.0\.0\/16/);
  assert.match(apipaQuestion.explanation, /255\.255\.0\.0/);
  assert.doesNotMatch(apipaQuestion.explanation, /Class B mask/);
  assert.match(topicText, /169\.254\.0\.0\/16 \(255\.255\.0\.0\)/);
  assert.doesNotMatch(topicText, /default Class B mask/);
});

test("saved mock wrong-choice history is shown without fabricating quiz history", () => {
  const progress = emptyProgress();
  progress.quizAttempts = [{ topicId: "topic-a", questionIds: ["q1"], missedIds: ["q1"], at: 1 }];
  progress.mockAttempts = [{ questionIds: ["q1"], missedIds: ["q1"], wrongChoices: { q1: 1 }, at: 2 }];
  const ranked = rankMissedQuestions(progress, [question("q1")]);
  assert.equal(ranked[0].selectedChoice, 1);
  const withoutMock = rankMissedQuestions({ ...progress, mockAttempts: [] }, [question("q1")]);
  assert.equal(withoutMock[0].selectedChoice, undefined);
});

test("concept retry excludes the same missed question when alternatives exist", () => {
  const missed = { question: question("q-n10dhcp-05", "n10-dhcp-ipam-time"), misses: 1, latestMissAt: 5 };
  const result = remediationForQuestion(missed, { questions: [question("q-n10dhcp-04", "n10-dhcp-ipam-time"), missed.question, question("q-n10dhcp-06", "n10-dhcp-ipam-time")] });
  assert.deepEqual(result.retryQuestionIds, ["q-n10dhcp-04", "q-n10dhcp-06"]);
});

test("mock-test misses and older attempts without questionIds remain supported", () => {
  const progress = emptyProgress();
  progress.quizAttempts = [{ topicId: "topic-a", missedIds: ["q1"], at: 1 }];
  progress.mockAttempts = [{ missedIds: ["q2"], at: 2 }];

  assert.deepEqual(
    rankMissedQuestions(progress, [question("q1"), question("q2")]).map((row) => row.question.id),
    ["q2", "q1"],
  );
});

test("exact question video matching wins over topic fallback", () => {
  const q = question("q1");
  const result = videoForQuestion(q, [
    video({ slug: "topic", questionId: "other" }),
    video({ slug: "exact", questionId: "q1" }),
  ]);
  assert.equal(result?.slug, "exact");
});

test("topic-level video fallback works and missing video is safe", () => {
  const q = question("q1");
  assert.equal(videoForQuestion(q, [video({ questionId: "other" })])?.slug, "topic-video");
  assert.equal(videoForQuestion(q, []), undefined);
});

test("topic-level visual matching works and missing visual is safe", () => {
  const q = question("q1");
  assert.equal(visualForQuestion(q, () => [visual()])?.file, "topic-visual.html");
  assert.equal(visualForQuestion(q, () => []), undefined);
});

test("remediation remains useful when either resource is missing", () => {
  const missed = { question: question("q1"), misses: 1, latestMissAt: 10 };
  const result = remediationForQuestion(missed, {
    videos: [],
    visualsForTopic: () => [],
  });

  assert.equal(result.question.id, "q1");
  assert.equal(result.notesHref, "/notes/topic-a");
  assert.equal(result.video, undefined);
  assert.equal(result.visual, undefined);
});
