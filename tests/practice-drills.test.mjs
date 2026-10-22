import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { drillDecks, itemsForMode, choicesFor } from '../lib/practice/drills.ts';

const locales = ['en', 'es', 'fr', 'pt'];
const messages = Object.fromEntries(locales.map((l) => [l, JSON.parse(readFileSync(new URL(`../messages/${l}.json`, import.meta.url), 'utf8'))]));

test('every drill mode has unambiguous prompts and at least two choices', () => {
  for (const deck of drillDecks) {
    for (const mode of deck.modes) {
      const items = itemsForMode(deck, mode);
      assert.ok(items.length >= 2, `${deck.id}/${mode.id} needs items`);
      const prompts = items.map((i) => i.fields[mode.from]);
      assert.equal(new Set(prompts).size, prompts.length, `${deck.id}/${mode.id} has a prompt with two right answers`);
      for (const item of items) {
        const choices = choicesFor(deck, mode, item);
        assert.ok(choices.length >= 2 && choices.length <= 4, `${deck.id}/${mode.id}/${item.id} choice count`);
        assert.equal(new Set(choices).size, choices.length, `${deck.id}/${mode.id}/${item.id} duplicate choices`);
        assert.equal(choices.filter((c) => c === item.fields[mode.to]).length, 1, `${deck.id}/${mode.id}/${item.id} answer present once`);
      }
    }
  }
});

test('every deck, mode, field and table has text in all four languages', () => {
  for (const locale of locales) {
    const decks = messages[locale].drillDecks;
    for (const deck of drillDecks) {
      const m = decks[deck.id];
      assert.ok(m?.title && m.topic && m.intro && m.cardBody, `${locale}: ${deck.id} basics`);
      for (const mode of deck.modes) assert.ok(m.modes[mode.id]?.label && m.modes[mode.id]?.ask, `${locale}: ${deck.id}.modes.${mode.id}`);
      for (const table of deck.tables) {
        if (deck.tables.length > 1) assert.ok(m.tables?.[table.id], `${locale}: ${deck.id}.tables.${table.id}`);
        for (const f of table.fields) assert.ok(m.fields[f], `${locale}: ${deck.id}.fields.${f}`);
      }
    }
  }
});

test('every deck names a real exam and objective ids from content/objectives.json', () => {
  const { exams } = JSON.parse(readFileSync(new URL('../content/objectives.json', import.meta.url), 'utf8'));
  for (const deck of drillDecks) {
    const exam = exams.find((e) => e.code === deck.exam);
    assert.ok(exam, `${deck.id}: unknown exam ${deck.exam}`);
    assert.ok(deck.certification, `${deck.id}: certification missing`);
    const ids = new Set(exam.domains.flatMap((d) => d.objectives.map((o) => o.id)));
    const named = deck.objective.match(/\d+\.\d+/g) ?? [];
    assert.ok(named.length, `${deck.id}: no objective ids`);
    for (const id of named) assert.ok(ids.has(id), `${deck.id}: objective ${id} is not in ${deck.exam}`);
  }
});

test('A+ Core 1 facts that are easy to get backwards stay correct', () => {
  const find = (deck, id) => drillDecks.find((d) => d.id === deck).items.find((i) => i.id === id).fields;
  assert.equal(find('dns', 'aaaa').purpose, 'Maps a hostname to an IPv6 address');
  assert.equal(find('private-ip', 'r172').cidr, '172.16.0.0/12');
  assert.equal(find('wifi', 'ac').band, '5 GHz');
  assert.equal(find('wifi', 'channels').answer, '1, 6 and 11');
  assert.equal(find('dhcp', 'ports').meaning, 'UDP 67 (server) and UDP 68 (client)');
  assert.equal(find('ports', 'rdp').port, '3389');
  assert.equal(find('storage-raid', 'r5').description, 'Striping with parity: 3+ drives, survives 1 failure');
  assert.equal(find('network-config', 'pat').term, 'PAT (NAT overload)');
  assert.equal(find('motherboard-cpu', 'lga1700').cpu, 'Intel 12th–14th gen Core');
});

test('A+ Core 2 facts that are easy to get backwards stay correct', () => {
  const find = (deck, id) => drillDecks.find((d) => d.id === deck).items.find((i) => i.id === id).fields;
  assert.match(find('c2-backup-safety', 'incremental').meaning, /since the last backup of any type/);
  assert.match(find('c2-backup-safety', 'differential').meaning, /since the last full backup/);
  assert.match(find('c2-wireless-auth', 'tacacs').meaning, /TCP/);
  assert.match(find('c2-wireless-auth', 'radius').meaning, /UDP/);
  assert.equal(find('c2-windows-security', 't-ntfsshare').meaning, 'When both apply over the network, the most restrictive wins');
  // 220-1202 objective 2.6 lists ten malware-removal steps in this order.
  const steps = drillDecks.find((d) => d.id === 'c2-malware').items.filter((i) => i.fields.step).map((i) => i.fields.action);
  assert.equal(steps.length, 10);
  assert.equal(steps[2], 'Disable System Restore in Windows Home');
  assert.equal(steps[8], 'Enable System Restore and create a restore point');
  assert.equal(steps[9], 'Educate the end user');
});
