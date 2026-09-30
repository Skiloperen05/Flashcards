import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(read('shared/flashcard-study-session.js'), sandbox);
const engine = sandbox.window.HaugnesStudySession;
const sample = [
  {
    id: 'a',
    title: 'A',
    cards: [
      { q: 'A0', difficulty: 'grunnleggende', topic: 'one' },
      { q: 'A1', difficulty: 'middels', topic: 'two' },
    ],
  },
  {
    id: 'b',
    title: 'B',
    cards: [
      { q: 'B0', difficulty: 'avansert', topic: 'one' },
      { q: 'B1', difficulty: 'middels', topic: 'two' },
    ],
  },
];
const mixed = engine.combine(sample, ['a', 'b', 'a']);
assert.equal(mixed.cards.length, 4, 'Selecting a deck twice must not duplicate cards');
assert.equal(
  new Set(mixed.cards.map((card) => card.idx)).size,
  4,
  'Source index 0 in different decks must not collide',
);
const options = { order: 'fixed', limit: 0, filter: 'all', difficulty: 'all' };
assert.equal(
  engine
    .prepare(mixed, {}, options)
    .map((card) => card.q)
    .join(),
  'A0,A1,B0,B1',
);
assert.notEqual(
  engine
    .prepare(mixed, {}, { ...options, order: 'random' }, () => 0)
    .map((card) => card.q)
    .join(),
  'A0,A1,B0,B1',
);
assert.equal(sample[0].cards[0].q, 'A0', 'Randomizing may not reorder the source');
assert.equal(engine.prepare(mixed, {}, { ...options, difficulty: 'middels', topic: 'two', limit: 1 }).length, 1);
assert.equal(
  engine.prepare(mixed, {}, { ...options, filter: 'review' }).length,
  0,
  'Empty review may not silently become all cards',
);
const stats = {};
engine.rate(stats, mixed.cards[0], 'wrong');
engine.rate(stats, mixed.cards[2], 'half');
assert.equal(stats.a.cardStats[0].lastRating, 'wrong');
assert.equal(stats.b.cardStats[0].lastRating, 'half');
assert.equal(stats[mixed.id], undefined, 'Mixed ratings belong to source decks');
assert.equal(engine.prepare(mixed, stats, { ...options, filter: 'new' }).length, 2);
assert.equal(engine.prepare(mixed, stats, { ...options, filter: 'review' }).length, 2);
assert.equal(engine.prepare(mixed, stats, { ...options, order: 'difficult' })[0].q, 'A0');
const summary = engine.record(stats, mixed, { [mixed.cards[0].idx]: 'wrong', [mixed.cards[2].idx]: 'half' }, 'all');
assert.equal(summary.total, 2);
assert.equal(stats.a.sessions[0].total, 1);
assert.equal(stats.b.sessions[0].total, 1);
assert.equal(stats.a.sessions[0].sessionId, stats.b.sessions[0].sessionId);

const catalog = JSON.parse(read('data/learning-content.json'));
const decks = catalog.decks.met3;
assert.equal(decks.length, 13);
assert.equal(
  decks.reduce((total, deck) => total + deck.cards.length, 0),
  146,
);
const documented = decks.filter((deck) => !/supplerende|power-query/.test(deck.id));
assert.equal(new Set(documented.flatMap((deck) => deck.cards.map((card) => card.function).filter(Boolean))).size, 37);
for (const card of decks.flatMap((deck) => deck.cards)) {
  assert.match(card.source, /s\. [\d,– ]+$/);
  assert.ok(['grunnleggende', 'middels', 'avansert'].includes(card.difficulty));
}
assert.equal(new Set(decks.flatMap((deck) => deck.cards.map((card) => card.q))).size, 146);

// Exercise the actual app and its enhancement wrappers, including localStorage.
const dom = new JSDOM(read('flashcards/index.html'), {
  url: 'http://localhost/flashcards/?subject=met3&dev=1',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
});
const w = dom.window;
const runtimeErrors = [];
w.addEventListener('error', (event) => {
  runtimeErrors.push(event.message);
});
w.AuthGuard = { requireAuth: () => Promise.resolve({ user: { email: 'dev@student.local' } }), getRootPath: () => '/' };
for (const file of [
  'shared/subject-meta.js',
  'shared/learning-content.js',
  'shared/haugnes-study-data.js',
  'shared/flashcard-study-session.js',
  'shared/flashcard-study-options.js',
])
  w.eval(read(file));
for (const script of w.document.querySelectorAll('script:not([src])')) w.eval(script.textContent);
await new Promise((resolve) => setTimeout(resolve, 20));
for (const file of ['shared/haugnes-flashcards-structure.js', 'shared/haugnes-flashcard-session.js'])
  w.eval(read(file));
w.HaugnesFlashcardSession.install();
assert.equal(w.currentSubjectId, 'met3');
assert.equal(w.document.querySelectorAll('[data-study-deck]').length, 13);
w.document.getElementById('studySelectAll').click();
assert.equal(w.document.getElementById('startCombinedStudy').disabled, false);
w.document.getElementById('studySelectNone').click();
assert.equal(w.document.getElementById('startCombinedStudy').disabled, true);
w.startDeck(['met3-grundlag-missing'], 'all', options);
assert.equal(w.currentDeck, null, 'Unknown deck IDs are ignored');
w.startDeck(['met3-grunnlag', 'met3-summering'], 'all', { ...options, limit: 2 });
assert.equal(w.currentCards.length, 2, 'Settings wrapper must forward explicit session options');
assert.equal(w.currentCards[0].sourceDeckId, 'met3-grunnlag');
w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true }));
assert.equal(w.isFlipped, true, 'Space must flip once, including enhancement keyboard handlers');
w.rateCard('wrong');
w.flipCard();
w.rateCard('half');
assert.equal(w.sessionSaved, true, 'Final unique rating automatically completes session');
assert.equal(w.document.getElementById('view-end').classList.contains('active'), true);
const sessions = w.getStats()['met3-grunnlag'].sessions.length;
w.showEndScreen();
assert.equal(w.getStats()['met3-grunnlag'].sessions.length, sessions, 'Finishing twice must not duplicate history');
await new Promise((resolve) => setTimeout(resolve, 20));
const mirrored = JSON.parse(w.localStorage.getItem('hf_subject_stats')).met3.sessions;
assert.equal(mirrored.length, 1, 'Combined session is mirrored once for dashboard');
assert.equal(mirrored[0].total, 2);
w.document.querySelector('[data-action="retry-wrong"]').click();
assert.equal(w.currentCards.length, 1, 'Retry must work for a combined collection');
assert.equal(w.currentCards[0].sourceIndex, 0);
w.setFilter('right');
assert.equal(w.currentCards.length, 0);
assert.equal(w.document.getElementById('studyEmpty').hidden, false);
w.setFilter('all');
assert.equal(w.document.getElementById('studyEmpty').hidden, true);
w.startDeck(['met3-grunnlag', 'met3-summering'], 'all', { ...options, order: 'random', limit: 0 });
const sourceB = w.currentCards.find((card) => card.sourceDeckId === 'met3-summering');
w.currentIndex = w.currentCards.indexOf(sourceB);
w.flipCard();
w.rateCard('right');
w.document.getElementById('finishDeckBtn').click();
await new Promise((resolve) => setTimeout(resolve, 20));
assert.equal(
  JSON.parse(w.localStorage.getItem('hf_subject_stats')).met3.sessions.length,
  2,
  'Manual finish must mirror the combined session too',
);
assert.equal(w.getStats()['met3-summering'].cardStats[sourceB.sourceIndex].lastRating, 'right');
w.startDeck('met3-summering', 'all', options);
assert.equal(w.HaugnesStudySession.cardStatsFor(w.getStats(), w.currentCards[sourceB.sourceIndex]).lastRating, 'right');
w.currentSubjectId = 'ret14';
w.showView('decks');
w.document.querySelector('.deck-start').click();
assert.ok(w.currentCards.length, 'Legacy decks must remain usable');
assert.equal(w.currentDeck.deckIds.length, 1);
assert.deepEqual(runtimeErrors, [], 'The app must not throw runtime errors');
dom.window.close();
console.log(
  'Flashcard study tests passed: content coverage, mixed provenance, filters, ordering, keyboard, completion, retry, persistence and legacy decks.',
);
