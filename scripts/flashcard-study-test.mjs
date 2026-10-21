import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(read('shared/flashcard-study-session.js'), sandbox);
const engine = sandbox.window.HaugnesStudySession;
for (const count of [0, 1, 4, 6, 10, 13, 20, 49, 50, 51]) {
  for (const preference of [0, 7, 20, 50]) {
    const lengths = engine.sessionLengths(count, preference);
    assert.ok(
      lengths.choices.every((choice) => choice.value === 0 || choice.value < count),
      'No offered session length may exceed the eligible collection',
    );
    assert.ok(lengths.choices.some((choice) => choice.value === lengths.value));
    assert.equal(new Set(lengths.choices.map((choice) => choice.value)).size, lengths.choices.length);
  }
}
assert.equal(
  engine
    .sessionLengths(6, 50)
    .choices.map((choice) => choice.label)
    .join(),
  '5 kort,Alle 6 kort',
);
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
  'shared/rrr11-coso-study.js',
  'shared/rrr11-study.js',
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
assert.equal(w.getQuizDecksForSubject('rrr11')[0].questions.length, 30);
assert.equal(w.getDecksForSubject('rrr11')[0].cards.length, 30);
const newRrr11Decks = JSON.parse(read('data/rrr11-nye-flashcards.json'));
const rrr11Decks = w.getDecksForSubject('rrr11');
assert.equal(rrr11Decks.length, 8);
assert.equal(
  rrr11Decks.reduce((sum, deck) => sum + deck.cards.length, 0),
  110,
);
assert.equal(
  JSON.stringify(rrr11Decks.slice(1)),
  JSON.stringify(newRrr11Decks),
  'Preserve all supplied content and order',
);
const catalogDecks = [
  'rrr11',
  'ret14',
  'subj_sol1',
  'sam3',
  'sam2',
  'met3',
  'met2',
  'mat10',
  'bed1',
  'ret1a',
  'met1',
  'sam1a',
  'kom1',
].flatMap((id) => w.getDecksForSubject(id));
for (const deck of newRrr11Decks) {
  assert.equal(catalogDecks.filter((candidate) => candidate.id === deck.id).length, 1, 'New deck IDs must not collide');
  for (const card of deck.cards) {
    assert.equal(
      catalogDecks.flatMap((candidate) => candidate.cards).filter((candidate) => candidate.id === card.id).length,
      1,
    );
  }
}
assert.equal(w.currentSubjectId, 'met3');
assert.equal(w.document.querySelectorAll('[data-study-deck]').length, 13);
w.document.getElementById('studySelectAll').click();
assert.equal(w.document.getElementById('startCombinedStudy').disabled, false);
w.document.getElementById('studySelectNone').click();
assert.equal(w.document.getElementById('startCombinedStudy').disabled, true);
w.document.getElementById('studySelectAll').click();
const globalLength = w.document.querySelector('#studyOptions [name="limit"]');
globalLength.value = '50';
globalLength.dispatchEvent(new w.Event('change', { bubbles: true }));
w.currentSubjectId = 'mat10';
w.showView('decks');
assert.equal(
  w.document.querySelector('#studyOptions [name="limit"]').textContent,
  'Alle 4 kort',
  'The library setup also caps its lengths to the selected subject',
);
w.currentSubjectId = 'met3';
w.showView('decks');
assert.equal(
  w.document.querySelector('#studyOptions [name="limit"]').value,
  '50',
  'A temporary cap must not replace the saved length preference',
);
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
w.currentSubjectId = 'rrr11';
w.showView('decks');
assert.equal(w.document.querySelectorAll('[data-study-deck]').length, 8, 'Register every RRR11 deck in the library');
w.renderQuizDecks();
assert.equal(w.document.querySelectorAll('[data-quiz-id]').length, 8);
for (const deck of newRrr11Decks) {
  w.startDeck([deck.id], 'all', { ...options, order: 'original', limit: 0 });
  const card = w.currentCards[0];
  assert.equal(w.document.getElementById('cardFront').textContent, card.q);
  assert.equal(w.document.getElementById('cardSourceLabel').textContent, card.source);
  w.flipCard();
  assert.ok(w.document.getElementById('cardBack').textContent.includes(card.a));
  w.currentQuizDeck = w.getQuizDecksForSubject('rrr11').find((candidate) => candidate.id === deck.id + '-quiz');
  w.startQuiz();
  const q = w.quizShuffledQ[0];
  assert.equal(w.document.getElementById('quizQText').textContent, q.q);
  w.document.querySelector('[data-original-idx="' + q.correct + '"]').click();
  assert.equal(w.quizScore, 1);
  assert.equal(w.document.querySelector('.quiz-option.correct').textContent, q.options[q.correct]);
  assert.equal(w.document.getElementById('quizSourceLabel').hidden, false);
  assert.equal(w.document.getElementById('quizSourceLabel').textContent, q.source);
  assert.ok(w.document.getElementById('quizExplanation').textContent.includes(q.explanation));
}
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
assert.equal(component.nextElementSibling.id, 'met3Decks', 'The entry belongs beside the subject’s deck tools');
assert.equal(component.previousElementSibling.id, 'dekk', 'The subject tool heading stays above the flashcard entry');
component.querySelector('[data-sfc-open]').click();
component.querySelector('[name="sfc-limit"]').value = '50';
component.querySelector('[name="sfc-limit"]').dispatchEvent(new sw.Event('change', { bubbles: true }));
const smallDeck = sw.HaugnesFlashcardLibrary.decksFor('met3').find((deck) => deck.cards.length === 4);
sw.HaugnesSubjectFlashcards.open(smallDeck.id);
assert.equal(
  component.querySelector('[data-sfc-view="setup"]').hidden,
  false,
  'A subject deck shortcut opens its specific setup before studying',
);
assert.equal(component.querySelectorAll('[data-sfc-deck]:checked').length, 1);
assert.equal(component.querySelector('[name="sfc-limit"]').textContent, 'Alle 4 kort');
assert.equal(component.querySelector('[data-sfc-start]').textContent, 'Start øving · 4 kort →');
assert.equal(JSON.parse(sw.localStorage.getItem('hf_study_options_v1')).limit, 50);
component.querySelector('[data-sfc-all]').click();
assert.equal(
  component.querySelector('[name="sfc-limit"]').value,
  '50',
  'Adding decks makes the preferred length available again',
);
component.querySelector('[name="sfc-filter"]').value = 'review';
component.querySelector('[name="sfc-filter"]').dispatchEvent(new sw.Event('change', { bubbles: true }));
assert.equal(
  component.querySelector('[name="sfc-limit"]').disabled,
  true,
  'An empty filtered collection has no selectable lengths',
);
assert.equal(component.querySelector('[data-sfc-start]').disabled, true);
component.querySelector('[name="sfc-filter"]').value = 'due';
component.querySelector('[name="sfc-filter"]').dispatchEvent(new sw.Event('change', { bubbles: true }));
assert.equal(component.querySelector('[name="sfc-limit"]').value, '50');
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
  assert.equal(!!room, !['kom1', 'sam1a'].includes(route), route + ': subject room is mounted only where appropriate');
  if (room) {
    const studyTab = Array.from(pw.document.querySelectorAll('.hf-tabbar a,.semester-tabs a')).find((link) =>
      /^Flashcards\s*[↗→]?$/.test(link.textContent.trim()),
    );
    if (studyTab)
      assert.equal(
        new URL(studyTab.href).hash,
        '#flashcards',
        route + ': the subject flashcard tab opens its local room',
      );
    const heading = pw.document.querySelector('.semester-heading');
    if (heading)
      assert.ok(
        heading.compareDocumentPosition(room) & pw.Node.DOCUMENT_POSITION_FOLLOWING,
        'The author-led subject heading must precede the study entry',
      );
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
// Calling auth from an inline subject script must still resolve the app root.
for (const prefix of ['', '/Flashcards']) {
  const authDom = new JSDOM(
    '<script src="' + prefix + '/shared/auth-guard.js"></script><script id="inline"></script>',
    { url: 'https://example.test' + prefix + '/subject/?id=rrr11', runScripts: 'outside-only' },
  );
  const aw = authDom.window;
  Object.defineProperty(aw.document, 'currentScript', {
    configurable: true,
    get: () => aw.document.getElementById('inline'),
  });
  aw.eval(read('shared/auth-guard.js'));
  assert.equal(aw.AuthGuard.getRootPath(), prefix + '/');
  assert.equal(aw.AuthGuard.getLoginPath(), prefix + '/login.html');
  assert.equal(aw.AuthGuard.getAssetPath('Flashcardslogo.png'), prefix + '/assets/Flashcardslogo.png');
  authDom.window.close();
}
// User-supplied COSO content works in both modes in the universal subject shell.
const cosoDom = new JSDOM(read('subject/index.html'), {
  url: 'http://localhost/subject/?id=rrr11&dev=1#flashcards',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
});
const cw = cosoDom.window;
cw.HTMLElement.prototype.scrollIntoView = function () {};
cw.AuthGuard = { requireAuth: () => Promise.resolve({ user: { email: 'dev@student.local' } }), getRootPath: () => '/' };
const rrrPage = {
  id: 'rrr11',
  code: 'RRR11',
  name: 'Moderne regnskapsføring i egen bedrift',
  kicker: 'Fag',
  accent: '#2563eb',
  progress: '0%',
  lead: 'Generisk fagtekst',
  visibility: { notes: true, flashcards: true, radar: false, answers: false, tasks: false, topics: false, plan: false },
  tools: [
    ['📋', 'Eksamensradar', 'Tom radar', 'Radar', '#eksamensradar', '#2563eb'],
    ['📚', 'Forelesningsnotater', 'Notater', 'Notater', '#notater', '#20b97a'],
  ],
  memo: { intro: 'Generisk intro', exam: 'Generisk eksamensråd', studyAdvice: 'Gå til oppgavebanken' },
  notes: [
    {
      id: 'coso-note',
      title: 'COSO – forelesningsnotat',
      desc: 'Intern kontroll',
      body: 'Les om de fem komponentene.',
      pdfUrl: '/user/document.html?file=00000000-0000-0000-0000-000000000001',
    },
  ],
  topics: [],
  plan: [],
  answers: [],
  tasks: [],
  examRadar: [],
};
cw.HaugnesSubjectPages = { get: () => rrrPage, refresh: async () => rrrPage, savePage: async (_, page) => page };
for (const file of [
  'subject-meta',
  'learning-content',
  'haugnes-study-data',
  'rrr11-coso-study',
  'rrr11-study',
  'flashcard-study-session',
  'flashcard-progress',
  'flashcard-library',
  'flashcard-store',
])
  cw.eval(read('shared/' + file + '.js'));
const originalCoso = JSON.parse(read('data/rrr11-coso-flashcards.json'));
const coso = cw.HaugnesFlashcardLibrary.decksFor('rrr11')[0];
assert.equal(coso.cards.length, 30);
for (const [i, card] of coso.cards.entries()) {
  const original = originalCoso.cards[i];
  assert.equal(card.quiz.q, original.question);
  assert.equal(card.quiz.options[card.quiz.correct], original.answer);
  assert.equal(card.explanation, original.explanation);
  assert.equal(card.source, originalCoso.source);
  if (original.id !== 25) {
    assert.equal(card.q, original.question);
    assert.equal(card.a, original.answer);
  }
}
assert.doesNotMatch(coso.cards[24].q, /disse/);
cw.eval(read('shared/subject-page-renderer.js'));
for (const script of cw.document.querySelectorAll('script:not([src])')) cw.eval(script.textContent);
await new Promise((resolve) => setTimeout(resolve, 10));
assert.equal(cw.document.body.dataset.subjectLayout, 'rrr11');
assert.equal(cw.document.getElementById('toolGrid').children.length, 0, 'No placeholder tool cards in RRR11');
assert.equal(cw.document.getElementById('memo'), null, 'Generic exam and study advice is removed');
assert.equal(cw.document.getElementById('learningSuite'), null, 'No empty generated radar');
assert.equal(cw.document.getElementById('heroPrimaryAction').hash, '#notater');
assert.equal(cw.document.querySelector('#subjectTabBar a[href="#oversikt"]'), null);
assert.equal(cw.document.getElementById('tabRadar').style.display, 'none');
assert.equal(cw.document.querySelector('#notesList h4').textContent, rrrPage.notes[0].title);
assert.ok(
  cw.document.querySelector('#notesList a').href.includes('/user/document.html?file='),
  'Existing protected document targets survive the layout change',
);
cw.toggleNoteSummary(cw.document.querySelector('#notesList button[onclick^="toggleNoteSummary"]'));
assert.equal(cw.document.querySelector('.hf-note-summary-body').style.display, 'block');
cw.HaugnesSubjectRenderer.render(rrrPage);
cw.HaugnesSubjectRenderer.render(rrrPage);
assert.equal(
  cw.document.querySelectorAll('[data-rrr-study-link]').length,
  1,
  'Live updates do not duplicate navigation',
);
assert.equal(cw.document.querySelectorAll('.rrr-workspace-step').length, 1);
cw.eval(read('shared/subject-flashcards.js'));
await new Promise((resolve) => setTimeout(resolve, 25));
const cr = cw.document.getElementById('flashcards');
assert.ok(cr && !cr.hidden);
assert.equal(cr.previousElementSibling.id, 'notater', 'Study follows the actual lecture notes');
const beforeRefresh = cr;
cw.HaugnesSubjectRenderer.render(rrrPage);
assert.equal(cw.document.getElementById('flashcards'), beforeRefresh, 'Studio rerenders preserve the study room');
assert.equal(cr.dataset.sfcActive, 'setup');
assert.match(cw.document.getElementById('flashcardsTabLink').href, /#flashcards$/);
const changeCoso = (name, value) => {
  const el = cr.querySelector('[name="' + name + '"]');
  el.value = value;
  el.dispatchEvent(new cw.Event('change', { bubbles: true }));
};
assert.equal(cr.querySelectorAll('[data-sfc-deck]').length, 8);
assert.equal(cr.querySelector('[data-sfc-deck-count]').textContent, '8 av 8 valgt');
cw.HaugnesSubjectFlashcards.open('rrr11-coso');
changeCoso('sfc-mode', 'quiz');
changeCoso('sfc-limit', '0');
assert.ok(Array.from(cr.querySelector('[name="sfc-limit"]').options).every((option) => Number(option.value) <= 30));
cr.querySelector('[data-sfc-start]').click();
assert.equal(cr.querySelector('[data-sfc-reveal]').hidden, true);
assert.equal(cr.querySelector('[data-sfc-ratings]').hidden, true);
cr.querySelector('[data-sfc-quiz-next]').click();
assert.match(cr.querySelector('[data-sfc-counter]').textContent, /0 av 30/);
const quizOrder = [];
for (let i = 0; i < 30; i++) {
  if (i === 12) {
    const currentCard = cr.querySelector('[data-sfc-question]');
    cw.HaugnesSubjectRenderer.render(rrrPage);
    assert.equal(
      cr.querySelector('[data-sfc-question]'),
      currentCard,
      'A Studio update preserves the active quiz card',
    );
    assert.match(cr.querySelector('[data-sfc-counter]').textContent, /^12 av 30/);
  }
  const q = cr.querySelector('[data-sfc-question]').textContent;
  const sourceIndex = coso.cards.findIndex((card) => card.quiz.q === q);
  quizOrder.push(sourceIndex);
  const card = coso.cards[sourceIndex];
  assert.equal(cr.querySelector('[data-sfc-answer-wrap]').hidden, true);
  cr.dispatchEvent(new cw.KeyboardEvent('keydown', { key: '2', bubbles: true }));
  assert.equal(cr.querySelector('[data-sfc-answer-wrap]').hidden, true, 'Flashcard shortcuts cannot rate a quiz');
  const choices = Array.from(cr.querySelectorAll('[data-sfc-choice]'));
  const correctText = card.quiz.options[card.quiz.correct];
  const answer = choices.find((button) => (button.children[1].textContent === correctText) === (i !== 0));
  answer.click();
  assert.match(cr.querySelector('[data-sfc-counter]').textContent, new RegExp('^' + (i + 1) + ' av 30'));
  assert.equal(cr.dataset.sfcActive, 'cards', 'Wait for Next so the learner can read the explanation');
  assert.equal(cr.querySelector('[data-sfc-answer]').textContent, correctText);
  assert.equal(cr.querySelector('[data-sfc-explanation]').textContent, card.explanation);
  assert.equal(
    cr.querySelector('.sfc-correct').children[1].textContent,
    correctText,
    'Shuffling must preserve correct answer identity',
  );
  const stats = cw.HaugnesFlashcardStore.get()['rrr11-coso'].cardStats[sourceIndex];
  assert.equal(stats.box, i === 0 ? 1 : 2);
  answer.dispatchEvent(new cw.MouseEvent('click', { bubbles: true }));
  assert.equal(
    cw.HaugnesFlashcardStore.get()['rrr11-coso'].cardStats[sourceIndex][i === 0 ? 'wrong' : 'right'],
    1,
    'A quiz question can be answered once',
  );
  cr.querySelector('[data-sfc-quiz-next]').click();
}
assert.equal(new Set(quizOrder).size, 30);
assert.equal(cr.dataset.sfcActive, 'end');
assert.equal(cw.HaugnesFlashcardStore.get()['rrr11-coso'].sessions.length, 1);
cr.querySelector('[data-sfc-retry]').click();
assert.match(cr.querySelector('[data-sfc-counter]').textContent, /0 av 1/);
const retryCorrect = coso.cards[quizOrder[0]].quiz;
Array.from(cr.querySelectorAll('[data-sfc-choice]'))
  .find((button) => button.children[1].textContent === retryCorrect.options[retryCorrect.correct])
  .click();
cr.querySelector('[data-sfc-quiz-next]').click();
assert.equal(cr.dataset.sfcActive, 'end');
cr.querySelector('[data-sfc-view="end"] [data-sfc-back]').click();
changeCoso('sfc-mode', 'flashcards');
changeCoso('sfc-filter', 'all');
changeCoso('sfc-limit', '0');
cr.querySelector('[data-sfc-start]').click();
assert.equal(cr.querySelector('[data-sfc-quiz]').hidden, true);
const flashSourceIndex = coso.cards.findIndex((card) => card.q === cr.querySelector('[data-sfc-question]').textContent);
cr.querySelector('[data-sfc-reveal]').click();
assert.equal(cr.querySelector('[data-sfc-explanation]').textContent, coso.cards[flashSourceIndex].explanation);
cr.querySelector('[data-sfc-rate="wrong"]').click();
assert.equal(
  cw.HaugnesFlashcardStore.get()['rrr11-coso'].cardStats[flashSourceIndex].box,
  1,
  'A flashcard lapse resets the same progress established by quiz',
);
cr.querySelector('[data-sfc-finish]').click();
assert.equal(JSON.parse(cw.localStorage.getItem('hf_subject_stats')).rrr11.sessions.length, 3);
cr.querySelector('[data-sfc-close]').click();
cw.document.querySelector('[data-rrr-study-link]').click();
assert.equal(cr.dataset.sfcActive, 'setup', 'The notes CTA opens the native study setup');
assert.equal(cw.document.querySelector('#subjectTabBar [aria-current="location"]').id, 'flashcardsTabLink');
assert.equal(cw.location.pathname, '/subject/');
for (const deck of newRrr11Decks) {
  cw.HaugnesSubjectFlashcards.open(deck.id);
  assert.equal(cr.querySelectorAll('[data-sfc-deck]:checked').length, 1);
  assert.equal(cr.querySelector('[data-sfc-deck]:checked').dataset.sfcDeck, deck.id);
  changeCoso('sfc-mode', 'quiz');
  changeCoso('sfc-filter', 'all');
  changeCoso('sfc-limit', '0');
  cr.querySelector('[data-sfc-start]').click();
  const seen = new Set();
  for (let i = 0; i < deck.cards.length; i++) {
    const q = cr.querySelector('[data-sfc-question]').textContent;
    const card = deck.cards.find((candidate) => candidate.quiz.q === q);
    assert.ok(card, 'The native quiz shows a question from the selected deck');
    seen.add(card.id);
    const choices = Array.from(cr.querySelectorAll('[data-sfc-choice]'));
    assert.deepEqual(choices.map((button) => button.children[1].textContent).sort(), card.quiz.options.slice().sort());
    choices.find((button) => button.children[1].textContent === card.a).click();
    assert.equal(cr.querySelector('.sfc-correct').children[1].textContent, card.a);
    assert.equal(cr.querySelector('[data-sfc-answer]').textContent, card.a);
    assert.equal(cr.querySelector('[data-sfc-explanation]').textContent, card.explanation);
    assert.equal(cr.querySelector('[data-sfc-source]').textContent, card.source);
    cr.querySelector('[data-sfc-quiz-next]').click();
  }
  assert.equal(seen.size, deck.cards.length, 'Every supplied question is reachable exactly once');
  assert.equal(cr.dataset.sfcActive, 'end');
  cw.HaugnesSubjectFlashcards.open(deck.id);
  changeCoso('sfc-mode', 'flashcards');
  changeCoso('sfc-filter', 'all');
  changeCoso('sfc-limit', '0');
  cr.querySelector('[data-sfc-start]').click();
  const flashSeen = new Set();
  for (let i = 0; i < deck.cards.length; i++) {
    const card = deck.cards.find((candidate) => candidate.q === cr.querySelector('[data-sfc-question]').textContent);
    assert.ok(card);
    flashSeen.add(card.id);
    cr.querySelector('[data-sfc-reveal]').click();
    assert.equal(cr.querySelector('[data-sfc-answer]').textContent, card.a);
    assert.equal(cr.querySelector('[data-sfc-explanation]').textContent, card.explanation);
    assert.equal(cr.querySelector('[data-sfc-source]').textContent, card.source);
    cr.querySelector('[data-sfc-rate="right"]').click();
  }
  assert.equal(flashSeen.size, deck.cards.length);
  assert.equal(cr.dataset.sfcActive, 'end');
}
cosoDom.window.close();
const genericWorkspace = new JSDOM(read('met2/index.html'), {
  url: 'https://example.test/met2/',
  runScripts: 'outside-only',
});
genericWorkspace.window.eval(read('shared/learning-content.js'));
genericWorkspace.window.eval(read('shared/subject-page-data.js'));
genericWorkspace.window.eval(read('shared/subject-page-renderer.js'));
assert.notEqual(genericWorkspace.window.document.body.dataset.subjectLayout, 'rrr11');
assert.ok(
  genericWorkspace.window.document.querySelectorAll('#toolGrid .hf-tool-card').length > 0,
  'Other subject layouts retain their actual catalog tools',
);
genericWorkspace.window.close();
console.log(
  'Flashcard study tests passed: Leitner scheduling, legacy content, native subject sessions, provenance, filters, keyboard, retry, completion, sync recovery and account isolation.',
);
