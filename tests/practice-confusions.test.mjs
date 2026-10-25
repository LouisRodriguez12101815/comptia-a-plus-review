import { test } from "node:test";
import assert from "node:assert/strict";
import { confusionGroups, confusionFor, confusionPairs, drillQuestionIds, pairFromKey, termFor } from "../lib/confusions.ts";

const q = (id, choices, answer) => ({ id, topicId: "t", prompt: id, choices, answer, explanation: "x" });

test("every look-alike term compiles, has a rule, and its own label names only that term", () => {
  for (const group of confusionGroups) {
    const ids = group.terms.map((term) => term.id);
    assert.equal(new Set(ids).size, ids.length, `${group.id} has duplicate term ids`);
    assert.ok(group.terms.length >= 2, `${group.id} needs at least two terms`);
    for (const term of group.terms) {
      assert.ok(term.rule.length > 10, `${term.id} needs a rule`);
      const ref = termFor(term.label);
      assert.equal(ref?.term.id, term.id, `label "${term.label}" should match only ${term.id}, got ${ref?.term.id}`);
    }
  }
});

test("a choice that names no term or two terms is not counted", () => {
  assert.equal(termFor("Install antivirus software"), undefined);
  assert.equal(termFor("Use SSH instead of Telnet"), undefined);
  assert.equal(termFor("Reboot the router"), undefined);
  assert.equal(termFor("A spear phishing email")?.term.id, "spear-phishing");
});

test("picking one look-alike for another is a confusion; other wrong picks are not", () => {
  const question = q("q1", ["Telnet", "SSH", "Reboot", "RDP"], 1);
  const c = confusionFor(question, 0);
  assert.equal(c?.groupId, "remote-access");
  assert.equal(c?.answer.term.id, "ssh");
  assert.equal(c?.picked.term.id, "telnet");
  assert.equal(confusionFor(question, 2), undefined);
  assert.equal(confusionFor(question, 1), undefined);
  assert.equal(confusionFor({ ...question, answer: [1, 3] }, 0), undefined);
});

test("pairs are counted across sittings for one exam, most frequent first", () => {
  const byId = {
    q1: q("q1", ["Telnet", "SSH", "Reboot", "RDP"], 1),
    q2: q("q2", ["SSH", "Telnet", "FTP", "VNC"], 0),
    q3: q("q3", ["Incremental", "Differential", "Full backup", "Synthetic full"], 1),
  };
  const attempts = [
    { exam: "220-1202", at: 3, wrongChoices: { q1: 0, q3: 0 }, missedIds: ["q1", "q3"] },
    { exam: "220-1202", at: 2, wrongChoices: { q2: 1 }, missedIds: ["q2"] },
    { exam: "220-1201", at: 1, wrongChoices: { q3: 0 }, missedIds: ["q3"] },
  ];
  const pairs = confusionPairs(attempts, "220-1202", byId);
  assert.equal(pairs[0].key, "remote-access:ssh>telnet");
  assert.equal(pairs[0].count, 2);
  assert.deepEqual(pairs[0].questionIds, ["q1", "q2"]);
  assert.equal(pairs[1].key, "backup-types:differential>incremental");
  assert.equal(pairs[1].count, 1);
});

test("a drill starts with the missed questions, then ones that contrast the same two terms", () => {
  const pair = { ...pairFromKey("remote-access:ssh>telnet"), questionIds: ["q1"] };
  const bank = [
    q("q1", ["Telnet", "SSH", "Reboot", "RDP"], 1),
    q("q2", ["RDP", "VNC", "FTP", "Reboot"], 0),
    q("q3", ["Telnet", "FTP", "SSH", "Reboot"], 0),
    q("q4", ["SSH", "FTP", "SMB", "Reboot"], 0),
  ];
  assert.deepEqual(drillQuestionIds(pair, bank), ["q1", "q3", "q4"]);
});

test("pair keys read back into terms and reject anything else", () => {
  assert.equal(pairFromKey("remote-access:ssh>telnet")?.picked.label, "Telnet");
  assert.equal(pairFromKey("remote-access:ssh>ssh"), undefined);
  assert.equal(pairFromKey("nope:ssh>telnet"), undefined);
  assert.equal(pairFromKey("<script>"), undefined);
});
