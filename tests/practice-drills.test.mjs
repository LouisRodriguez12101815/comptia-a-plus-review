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

test('A+ Core 1 facts that are easy to get backwards stay correct', () => {
  const find = (deck, id) => drillDecks.find((d) => d.id === deck).items.find((i) => i.id === id).fields;
  assert.equal(find('dns', 'aaaa').purpose, 'Maps a hostname to an IPv6 address');
  assert.equal(find('private-ip', 'r172').cidr, '172.16.0.0/12');
  assert.equal(find('wifi', 'ac').band, '5 GHz');
  assert.equal(find('wifi', 'channels').answer, '1, 6 and 11');
  assert.equal(find('dhcp', 'ports').meaning, 'UDP 67 (server) and UDP 68 (client)');
  assert.equal(find('ports', 'rdp').port, '3389');
});
