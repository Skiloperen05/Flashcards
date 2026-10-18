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

// Time is explicit: test the actual review schedule without waiting days.
const now = Date.parse('2026-10-18T10:00:00Z');
const timed = {};
const card = mixed.cards[0];
engine.rate(timed, card, 'right', now);
assert.equal(timed.a.cardStats[0].box, 2);
assert.equal(Date.parse(timed.a.cardStats[0].dueAt), now + 86400000);
engine.rate(timed, card, 'right', now + 1000);
assert.equal(timed.a.cardStats[0].box, 2, 'Early extra practice must not inflate mastery');
assert.equal(Date.parse(timed.a.cardStats[0].dueAt), now + 86400000);
for (const box of [3, 4, 5, 5]) {
  engine.rate(timed, card, 'right', Date.parse(timed.a.cardStats[0].dueAt));
  assert.equal(timed.a.cardStats[0].box, box, 'Due correct answers advance one basket, capped at 5');
}
engine.rate(timed, card, 'wrong', now + 2000);
assert.equal(timed.a.cardStats[0].box, 1, 'A lapse from the highest basket must reset to 1');
assert.equal(Date.parse(timed.a.cardStats[0].dueAt), now + 2000 + 600000);
assert.equal(engine.prepare(mixed, timed, { ...options, filter: 'due' }, null, now + 3000).length, 3);
assert.equal(engine.prepare(mixed, timed, { ...options, filter: 'due' }, null, now + 602000).length, 4);
assert.equal(engine.prepare(mixed, timed, { ...options, order: 'smart' }, null, now + 602000)[0].q, 'A0');
const old = { a: { cardStats: { 0: { lastRating: 'right', lastDate: new Date(now).toISOString() } } } };
assert.equal(engine.schedule(old.a.cardStats[0]).box, 2, 'Old ratings keep their history and gain a schedule');
const newer = engine.mergeStats(old, timed);
assert.equal(newer.a.cardStats[0].lastRating, 'wrong');
assert.equal(
  engine.mergeStats({ a: { resetAt: new Date(now + 3000).toISOString() } }, timed).a.cardStats[0],
  undefined,
  'A reset must not resurrect old cloud ratings',
);

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
  'shared/flashcard-progress.js',
  'shared/sam3-flashcard-catalog.js',
  'shared/flashcard-library.js',
  'shared/flashcard-store.js',
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
// The generic and in-subject apps consume identical source deck identities.
assert.equal(w.HaugnesFlashcardLibrary.decksFor('sam3').filter((deck) => deck.legacyId).length, 13);
assert.equal(
  w.HaugnesSam3Flashcards.reduce((sum, deck) => sum + deck.cards.length, 0),
  166,
);
assert.ok(
  !w.HaugnesSam3Flashcards.some((deck) => deck.cards.some((card) => /<\/?(?:b|div|span)/.test(card.a))),
  'SAM3 HTML is converted to readable card text',
);
assert.deepEqual(runtimeErrors, [], 'The app must not throw runtime errors');
dom.window.close();

// Exercise the native component on a real subject document, without iframes
// or navigation to the global flashcard library.
const subjectDom = new JSDOM(read('met3/index.html'), {
  url: 'http://localhost/met3/?dev=1',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
});
const sw = subjectDom.window;
sw.HTMLElement.prototype.scrollIntoView = function () {};
sw.AuthGuard = { requireAuth: () => Promise.resolve({ user: { email: 'dev@student.local' } }), getRootPath: () => '/' };
for (const file of [
  'subject-meta',
  'learning-content',
  'haugnes-study-data',
  'flashcard-study-session',
  'flashcard-progress',
  'flashcard-library',
  'flashcard-store',
])
  sw.eval(read('shared/' + file + '.js'));
sw.eval(read('met3/met3.js'));
sw.eval(read('shared/subject-flashcards.js'));
await new Promise((resolve) => setTimeout(resolve, 30));
const component = sw.document.getElementById('flashcards');
assert.ok(component, 'The subject page has its own native flashcard room');
assert.equal(sw.document.querySelectorAll('iframe').length, 0);
assert.match(sw.document.querySelector('.hf-hero-actions a').href, /\/met3\/\?dev=1#flashcards$/);
component.querySelector('[data-sfc-open]').click();
component.querySelector('[name="sfc-limit"]').value = '10';
component.querySelector('[name="sfc-limit"]').dispatchEvent(new sw.Event('change', { bubbles: true }));
component.querySelector('[data-sfc-start]').click();
component.dispatchEvent(new sw.KeyboardEvent('keydown', { key: '2', bubbles: true }));
assert.equal(Object.keys(sw.HaugnesFlashcardStore.get()).length, 0, 'Answering before reveal must do nothing');
for (let i = 0; i < 10; i++) {
  component.dispatchEvent(
    new sw.KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true }),
  );
  component.dispatchEvent(new sw.KeyboardEvent('keydown', { key: i % 2 ? '2' : '1', bubbles: true, cancelable: true }));
}
assert.equal(component.querySelector('[data-sfc-view="end"]').hidden, false);
const subjectStats = sw.HaugnesFlashcardStore.get()['met3-grunnlag'];
assert.equal(subjectStats.sessions[0].total, 10);
assert.equal(subjectStats.cardStats[0].box, 1);
assert.equal(subjectStats.cardStats[1].box, 2);
assert.equal(JSON.parse(sw.localStorage.getItem('hf_subject_stats')).met3.sessions.length, 1);
component.querySelector('[data-sfc-retry]').click();
assert.match(component.querySelector('[data-sfc-counter]').textContent, /0 av 5/);
component.querySelector('[data-sfc-reveal]').click();
component.querySelector('[data-sfc-rate="right"]').click();
component.querySelector('[data-sfc-finish]').click();
assert.equal(
  JSON.parse(sw.localStorage.getItem('hf_subject_stats')).met3.sessions.length,
  2,
  'Partial native sessions are recorded once',
);
assert.equal(sw.location.pathname, '/met3/', 'The entire study flow stays in the subject');
sw.localStorage.removeItem('fc_sam3_migrated');
sw.localStorage.setItem(
  'sam3_progress_v1',
  JSON.stringify({
    flashcards: {
      'd3:0': {
        box: 4,
        lastRating: 'good',
        lastSeen: new Date(now).toISOString(),
        nextReview: '2026-10-25',
        counts: { good: 3, bad: 1 },
      },
    },
  }),
);
await sw.HaugnesFlashcardStore.open({ email: 'dev@student.local' }, null);
assert.equal(
  sw.HaugnesFlashcardStore.get()['sam3-d3'].cardStats[0].box,
  4,
  'Existing dedicated SAM3 progress is imported under the shared source identity',
);
assert.ok(sw.localStorage.getItem('sam3_progress_v1'), 'Migration retains the legacy source');
// Simulate a failed cloud save and a reload with older remote data.
let payload,
  failSave = true;
const fakeClient = {
  from: () => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { stats: {} } }) }) }),
    upsert: async (value) => {
      payload = value;
      return failSave ? { error: { message: 'offline' } } : {};
    },
  }),
};
await sw.HaugnesFlashcardStore.open({ id: 'student-one', email: 'dev@student.local' }, fakeClient);
sw.HaugnesFlashcardStore.save({
  a: {
    cardStats: {
      0: {
        lastRating: 'wrong',
        lastDate: new Date(now).toISOString(),
        box: 1,
        dueAt: new Date(now + 600000).toISOString(),
      },
    },
    sessions: [],
  },
});
await sw.HaugnesFlashcardStore.flush();
assert.equal(JSON.parse(sw.localStorage.getItem('fc_stats_pending')), 'student-one');
await sw.HaugnesFlashcardStore.open({ id: 'student-one' }, fakeClient);
assert.equal(
  sw.HaugnesFlashcardStore.get().a.cardStats[0].box,
  1,
  'Older sky data cannot overwrite a pending local rating',
);
failSave = false;
await sw.HaugnesFlashcardStore.flush();
assert.equal(payload.user_id, 'student-one');
assert.equal(sw.localStorage.getItem('fc_stats_pending'), null);
await sw.HaugnesFlashcardStore.open({ id: 'student-two' }, null);
assert.equal(
  Object.keys(sw.HaugnesFlashcardStore.get()).length,
  0,
  'Account switching cannot inherit another student’s progress',
);
subjectDom.window.close();
for (const route of ['ret14', 'sol1', 'sam2', 'sam3', 'met2', 'mat10', 'sam1a', 'bed1', 'kom1']) {
  const page = new JSDOM(read(route + '/index.html'), {
    url: 'http://localhost/' + route + '/?dev=1',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const pw = page.window;
  pw.HTMLElement.prototype.scrollIntoView = function () {};
  pw.AuthGuard = {
    requireAuth: () => Promise.resolve({ user: { email: 'dev@student.local' } }),
    getRootPath: () => '/',
  };
  for (const file of [
    'subject-meta',
    'learning-content',
    'haugnes-study-data',
    'flashcard-study-session',
    'flashcard-progress',
    'sam3-flashcard-catalog',
    'flashcard-library',
    'flashcard-store',
  ])
    pw.eval(read('shared/' + file + '.js'));
  pw.eval(read('shared/subject-flashcards.js'));
  await new Promise((resolve) => setTimeout(resolve, 10));
  const room = pw.document.getElementById('flashcards');
  assert.equal(!!room, route !== 'kom1', route + ': subject room is mounted only where appropriate');
  if (room) {
    assert.equal(
      room.querySelector('[data-sfc-open]').disabled,
      false,
      route + ': published subject decks are available',
    );
    assert.ok(
      pw.document.querySelector('a[href="../flashcards/"],a[href="/flashcards/"]') ||
        ['met2', 'mat10', 'sam1a', 'bed1'].includes(route),
      route + ': the optional global library remains accessible',
    );
  }
  page.window.close();
}
console.log(
  'Flashcard study tests passed: Leitner scheduling, legacy content, native subject sessions, provenance, filters, keyboard, retry, completion, sync recovery and account isolation.',
);
