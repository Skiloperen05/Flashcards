import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const source = JSON.parse(readFileSync(new URL('data/rrr11-coso-flashcards.json', root), 'utf8'));
assert.equal(source.cards.length, source.card_count);
assert.equal(new Set(source.cards.map((card) => card.id)).size, source.card_count);
const cards = source.cards.map((card, index) => {
  assert.equal(card.id, index + 1, 'Keep source order stable: progress uses source indices');
  for (const field of ['question', 'answer', 'explanation']) assert.ok(card[field]?.trim());
  const keys = Object.keys(card.options);
  assert.equal(keys.length, 4);
  assert.equal(new Set(Object.values(card.options)).size, 4);
  for (const text of Object.values(card.options)) assert.ok(text.trim());
  assert.ok(keys.includes(card.correct_option));
  assert.equal(card.answer, card.options[card.correct_option]);
  return {
    id: `rrr11-coso-${card.id}`,
    q: card.id === 25 ? 'Hvilke iboende begrensninger nevner COSO for intern kontroll?' : card.question,
    a:
      card.id === 25
        ? 'Uegnede mål, feilaktig skjønn og bias, menneskelige feil, overstyring fra ledelsen, samarbeid (collusion) og eksterne hendelser.'
        : card.answer,
    explanation: card.explanation,
    topic: card.tags.join(' · '),
    source: source.source,
    quiz: { q: card.question, options: Object.values(card.options), correct: keys.indexOf(card.correct_option) },
  };
});
const decks = [{ id: 'rrr11-coso', title: source.deck, description: source.description, cards }];
const output =
  '// Generated from data/rrr11-coso-flashcards.json by scripts/generate-coso-study.mjs.\nwindow.HaugnesCosoStudy = ' +
  JSON.stringify(decks, null, 2) +
  ';\n';
const target = new URL('shared/rrr11-coso-study.js', root);
if (process.argv.includes('--check')) assert.equal(readFileSync(target, 'utf8'), output, 'Run pnpm coso:generate');
else writeFileSync(target, output);
console.log(`RRR11 COSO: ${cards.length} flashcards and quiz questions.`);
