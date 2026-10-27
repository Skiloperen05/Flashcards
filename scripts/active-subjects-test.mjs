import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const tick = () => new Promise((resolve) => setTimeout(resolve, 10));

function setup({ page = 'index.html', bypass = false, storage = {}, remote = {}, user = 'student-a' } = {}) {
  const dom = new JSDOM(read('user/' + page), { url: 'https://example.test/user/' + page, runScripts: 'outside-only' });
  const w = dom.window;
  let currentUser = user;
  let failed = false;
  let writes = 0;
  let holdSave = null;
  let beforeSave = null;
  const rows = structuredClone(remote);
  const owned = ['SAM2', 'SAM3'];
  const catalog = owned.concat('MET3').map((code) => ({ id: code.toLowerCase(), code, name: code, path: '../' + code.toLowerCase() + '/', categoryId: 'semester2', accent: '#123456' }));
  const client = { from(table) {
    assert.equal(table, 'user_custom_data');
    return {
      select() { return { eq(column, id) { assert.equal(column, 'user_id'); return { async maybeSingle() {
        if (failed) return { error: new Error('Offline') };
        return { data: rows[id] ? { data: structuredClone(rows[id]) } : null };
      } }; } }; },
      async upsert(row, options) {
        assert.equal(options.onConflict, 'user_id');
        if (failed) return { error: new Error('Offline') };
        if (beforeSave) { const callback = beforeSave; beforeSave = null; callback(); }
        if (holdSave) await holdSave;
        rows[row.user_id] = structuredClone(row.data);
        writes++;
        return {};
      }
    };
  } };
  w.AuthGuard = { getSession: () => ({ user: { id: currentUser } }), getClient: () => client };
  w.HaugnesEntitlements = { isLoaded: () => true, hasBypass: () => bypass, getCodes: () => owned.slice() };
  w.HaugnesSubjects = { getCatalog: () => catalog.slice(), getAll: () => catalog.slice() };
  for (const [key, value] of Object.entries(storage)) w.localStorage.setItem(key, JSON.stringify(value));
  w.eval(read('shared/subject-access.js'));
  return { w, dom, rows, owned, api: w.HaugnesSubjectAccess, writes: () => writes,
    fail: (value) => { failed = value; }, switchUser: (value) => { currentUser = value; },
    delaySave: (promise) => { holdSave = promise; }, beforeSave: (callback) => { beforeSave = callback; } };
}
const codes = (api) => Array.from(api.getSelected());

// Full access still permits a personal selection; empty is a valid persistent choice.
for (const bypass of [false, true]) {
  const ctx = setup({ bypass });
  await tick();
  assert.deepEqual(codes(ctx.api), bypass ? ['SAM2', 'SAM3', 'MET3'] : ['SAM2', 'SAM3']);
  ctx.api.setSelected(['sam-3', 'SAM3', 'NOTOWNED']);
  await ctx.api.sync();
  assert.deepEqual(codes(ctx.api), ['SAM3']);
  assert.equal(ctx.rows['student-a'].activeSubjects.codes.length, 1);
  assert.equal(ctx.owned.length, 2, 'Changing activity never releases access');
  ctx.api.setSelected([]);
  await ctx.api.sync();
  assert.deepEqual(codes(ctx.api), []);
  assert.equal(ctx.rows['student-a'].activeSubjects.codes.length, 0);
  const reload = setup({ bypass, remote: ctx.rows });
  await tick();
  await reload.api.sync();
  assert.deepEqual(codes(reload.api), [], 'An empty selection survives a fresh browser');
  ctx.dom.window.close(); reload.dom.window.close();
}

// Merge with existing notes, decks and settings, and recover from failed reads and writes.
const ctx = setup({ page: 'subjects.html', remote: { 'student-a': { settings: { theme: 'dark' }, decks: { private: [1] } } } });
await tick();
ctx.fail(true);
ctx.api.setSelected(['SAM2']);
await ctx.api.sync();
assert.equal(ctx.writes(), 0, 'A failed read must never overwrite existing user data');
assert.match(ctx.w.document.querySelector('[role="status"]').textContent, /Kun lagret/);
ctx.fail(false);
await ctx.api.sync(true);
assert.deepEqual(ctx.rows['student-a'].settings, { theme: 'dark' });
assert.deepEqual(ctx.rows['student-a'].decks, { private: [1] });
assert.deepEqual(ctx.rows['student-a'].activeSubjects.codes, ['SAM2']);
ctx.switchUser('student-b');
await ctx.api.sync(true);
assert.deepEqual(codes(ctx.api), ['SAM2', 'SAM3'], 'Account B cannot inherit account A selection');
ctx.api.setSelected(['SAM3']);
await ctx.api.sync();
ctx.switchUser('student-a');
await ctx.api.sync(true);
assert.deepEqual(codes(ctx.api), ['SAM2']);
ctx.dom.window.close();

// Rapid changes during a network write eventually save the latest selection.
const rapid = setup();
await tick();
let releaseSave;
rapid.delaySave(new Promise((resolve) => { releaseSave = resolve; }));
rapid.beforeSave(() => { rapid.api.setSelected(['SAM3']); releaseSave(); });
rapid.api.setSelected(['SAM2']);
await rapid.api.sync();
await tick();
assert.deepEqual(rapid.rows['student-a'].activeSubjects.codes, ['SAM3']);
rapid.dom.window.close();

// A stale response from account A must never alter account B's cached selection.
const switching = setup();
await tick();
let finish;
switching.delaySave(new Promise((resolve) => { finish = resolve; }));
switching.beforeSave(() => { switching.switchUser('student-b'); finish(); });
switching.api.setSelected(['SAM2']);
await switching.api.sync();
await tick();
assert.deepEqual(codes(switching.api), ['SAM2', 'SAM3']);
assert.equal(switching.w.localStorage.getItem('hf_active_subjects_v1:student-b'), null);
switching.dom.window.close();

// Existing choices migrate once; [] is respected and cannot leak to another account.
const legacy = setup({ storage: { hf_enabled_subjects: ['SAM2'], hf_enabled_subjects_explicit_empty: true } });
await tick();
await legacy.api.sync();
assert.deepEqual(codes(legacy.api), []);
legacy.switchUser('student-b'); await legacy.api.sync(true);
assert.deepEqual(codes(legacy.api), ['SAM2', 'SAM3']);
legacy.dom.window.close();

// The selector belongs only on Mine fag and preserves keyboard focus.
const ui = setup({ page: 'subjects.html' });
await tick();
assert.equal(ui.w.document.querySelector('#hfSubjectAccessPanel').open, true);
const button = ui.w.document.querySelector('[data-access-subject="SAM2"]');
button.focus(); button.click();
await ui.api.sync();
assert.equal(ui.w.document.activeElement.getAttribute('data-access-subject'), 'SAM2');
assert.equal(ui.w.document.activeElement.getAttribute('aria-pressed'), 'false');
assert.equal(ui.w.document.querySelector('#hfSubjectAccessPanel').open, true);
const home = setup({ remote: ui.rows });
await tick();
home.w.eval(read('shared/haugnes-dashboard-progress.js'));
assert.equal(home.w.document.querySelector('#hfSubjectAccessPanel'), null, 'Hjem has no subject selector');
assert.equal(home.w.document.querySelectorAll('.subjects .subject-card').length, 1);
ui.w.document.querySelector('[data-access-none]').click();
await ui.api.sync();
assert.equal(ui.w.document.querySelectorAll('[data-access-subject]').length, 2, 'All owned subjects remain selectable');
home.api.setSelected([]);
await home.api.sync();
assert.match(home.w.document.querySelector('.subjects').textContent, /Ingen aktive fag/);
assert.equal(home.w.document.querySelector('.subjects a').getAttribute('href'), 'subjects.html');
assert.doesNotMatch(home.w.document.querySelector('.subjects').textContent, /over/);
home.dom.window.close();
ui.dom.window.close();
const subjects = setup({ page: 'subjects.html' });
await tick();
// Execute the page's own renderer with realistic metadata.
subjects.w.HaugnesSubjects.groupByCategory = (list) => [{ id: 'semester2', label: '2. semester', subjects: list }];
subjects.w.eval(Array.from(subjects.w.document.scripts).find((s) => !s.src && s.textContent.includes('var SUBJECTS')).textContent);
subjects.api.setSelected([]);
await subjects.api.sync();
assert.equal(subjects.w.document.querySelectorAll('#subjectsGrid .subject-card').length, 2);
assert.equal(subjects.w.document.querySelectorAll('#subjectsGrid .hf-subject-hidden-by-access').length, 0, 'Inactive subjects can still be opened');
subjects.dom.window.close();
console.log('Active subjects passed: access, empty/reload, cloud merge/recovery, account isolation, rapid changes, migration and dashboard/Mine fag UI.');
