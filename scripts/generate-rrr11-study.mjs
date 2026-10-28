import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const suppliedDecks = JSON.parse(readFileSync(new URL('data/rrr11-nye-flashcards.json', root), 'utf8'));
assert.equal(suppliedDecks.length, 7);
assert.equal(suppliedDecks.flatMap((deck) => deck.cards).length, 80);
const qualityDecks = JSON.parse(readFileSync(new URL('data/rrr11-kvalitetskrav-flashcards.json', root), 'utf8'));
assert.equal(qualityDecks.length, 1);
assert.equal(qualityDecks[0].id, 'rrr11-kvalitetskrav-fordypning');
assert.equal(qualityDecks[0].cards.length, 32);
const decks = [...suppliedDecks, ...qualityDecks];
const ids = new Set(['rrr11-coso']);
const cardIds = new Set(Array.from({ length: 30 }, (_, i) => `rrr11-coso-${i + 1}`));
for (const deck of decks) {
  assert.match(deck.id, /^rrr11-/);
  assert.ok(!ids.has(deck.id), `Duplicate deck: ${deck.id}`);
  ids.add(deck.id);
  for (const field of ['title', 'description']) assert.ok(deck[field]?.trim(), `${deck.id}: ${field}`);
  for (const [index, card] of deck.cards.entries()) {
    assert.equal(card.id, `${deck.id}-${index + 1}`, 'Keep source order stable: progress uses source indices');
    assert.ok(!cardIds.has(card.id), `Duplicate card: ${card.id}`);
    cardIds.add(card.id);
    for (const field of ['q', 'a', 'explanation', 'topic', 'source']) {
      assert.ok(card[field]?.trim(), `${card.id}: ${field}`);
    }
    if (!card.quiz) {
      assert.ok(qualityDecks.includes(deck), `${card.id}: supplied quiz is required`);
      continue;
    }
    assert.ok(card.quiz.q?.trim());
    assert.equal(card.quiz.options.length, 4);
    assert.equal(new Set(card.quiz.options).size, 4);
    for (const option of card.quiz.options) assert.ok(option.trim());
    assert.ok(Number.isInteger(card.quiz.correct) && card.quiz.correct >= 0 && card.quiz.correct < 4);
    assert.equal(card.quiz.options[card.quiz.correct], card.a, `${card.id}: answer key`);
  }
}
const output =
  '// Generated from data/rrr11-nye-flashcards.json and data/rrr11-kvalitetskrav-flashcards.json by scripts/generate-rrr11-study.mjs.\n' +
  'window.HaugnesRrr11Study = ' +
  JSON.stringify(decks, null, 2) +
  ';\n';
const target = new URL('shared/rrr11-study.js', root);
if (process.argv.includes('--check')) assert.equal(readFileSync(target, 'utf8'), output, 'Run npm run rrr11:generate');
else writeFileSync(target, output);
console.log('RRR11: 8 decks, 112 flashcards, 80 quiz questions (COSO remains separate).');
