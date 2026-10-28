import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const settle = () => new Promise((resolve) => setTimeout(resolve, 12));
const clone = (value) => JSON.parse(JSON.stringify(value));
const course = (code, extra = {}) => ({ subject_code: code, name: code, icon: '📚', accent: '#2563eb', origin: 'custom',
  is_published: true, visibility: {}, blocks: { topics: [], plan: [], radar: [] }, files: { memo: [], answer: [], task: [] }, ...extra });
const courses = [course('RRR11'), course('MET3'), course('BED1'), course('TEST', { is_published: false })];
const dom = new JSDOM(read('user/admin.html'), { url: 'https://example.test/user/admin.html?subject=RRR11', runScripts: 'outside-only' });
const w = dom.window, doc = w.document;
w.HTMLElement.prototype.scrollIntoView = function () {};
const writes = [], catalogWrites = [];
let subscriber, failSave = false, failCatalog = false, failPrice = false, delayed;
w.SubjectsStudio = {
  listSubjects: async () => clone(courses),
  getSubject: async (code) => {
    if (code === 'MET3' && delayed) return delayed;
    return clone(courses.find((row) => row.subject_code === code));
  },
  subscribeChanges: (fn) => { subscriber = fn; },
  upsertSubject: async (patch) => {
    if (failSave) throw new Error('Simulert lagringsfeil');
    writes.push(clone(patch));
    Object.assign(courses.find((row) => row.subject_code === patch.subject_code), patch);
    subscriber?.({ kind: 'subject', subject_code: patch.subject_code });
  },
  createSubject: async (patch) => {
    if (courses.some((row) => row.subject_code === patch.subject_code)) throw new Error('Fagkode finnes');
    writes.push(clone(patch)); courses.push(course(patch.subject_code, patch));
  },
};
w.AuthGuard = { getSession: () => ({ user: { id: 'admin' } }), getClient: () => ({ from: (table) => ({
  upsert: async (patch) => { catalogWrites.push({ table, patch }); return failPrice && table === 'subject_prices' ? { error: new Error('Pris utilgjengelig') } : {}; },
  update: (patch) => ({ eq: async (key, code) => { if (failCatalog) return { error: new Error('Katalog utilgjengelig') }; catalogWrites.push({ table, patch, code }); return {}; } }),
}) }) };
for (const script of doc.querySelectorAll('script:not([src])')) w.eval(script.textContent);
await settle();
doc.querySelector('[data-editor-view="details"]').click();
const clickTab = (tab) => doc.querySelector('[data-studio-tab="' + tab + '"]').click();
const edit = (key, value) => { const input = doc.querySelector('[data-header="' + key + '"]'); input.value = value; input.dispatchEvent(new w.Event('input')); };
assert.ok(doc.querySelector('[data-add-file="memo"]'));
clickTab('appearance'); edit('name', 'Regnskap med egne forklaringer');
clickTab('overview');
subscriber({ kind: 'subject', subject_code: 'RRR11' });
await settle();
clickTab('appearance');
assert.equal(doc.querySelector('[data-header="name"]').value, 'Regnskap med egne forklaringer', 'A tab switch and Realtime refresh retain unsaved work');
failSave = true; doc.getElementById('btnSaveAll').click(); await settle();
assert.match(doc.getElementById('studioSaveState').textContent, /ulagrede/);
assert.match(doc.getElementById('toast').textContent, /Simulert lagringsfeil/);
failSave = false; doc.getElementById('btnSaveAll').click(); await settle();
assert.equal(writes.at(-1).name, 'Regnskap med egne forklaringer');
assert.match(doc.getElementById('studioSaveState').textContent, /Alle endringer lagret/);
// Results from an earlier slow selection cannot overwrite the most recent selection.
let release; delayed = new Promise((resolve) => { release = resolve; });
doc.querySelector('[data-code="MET3"]').click();
doc.querySelector('[data-code="TEST"]').click(); await settle();
release(course('MET3')); await settle(); delayed = null;
assert.match(doc.querySelector('.editor-title-text strong').textContent, /TEST/);
clickTab('publish');
failCatalog = true;
let toggle = doc.getElementById('togglePublished'); toggle.checked = true; toggle.dispatchEvent(new w.Event('change')); await settle();
assert.equal(courses.find((row) => row.subject_code === 'TEST').is_published, false, 'A catalogue failure must leave the draft unpublished');
assert.equal(doc.getElementById('togglePublished').checked, false);
failCatalog = false; failSave = true;
toggle = doc.getElementById('togglePublished'); toggle.checked = true; toggle.dispatchEvent(new w.Event('change')); await settle();
assert.equal(catalogWrites.at(-1).patch.published, false, 'Restore the catalogue if the subject update fails');
failSave = false;
toggle = doc.getElementById('togglePublished'); toggle.checked = true; toggle.dispatchEvent(new w.Event('change')); await settle();
assert.equal(courses.find((row) => row.subject_code === 'TEST').is_published, true);
assert.equal(catalogWrites.at(-1).patch.published, true);
// New courses have a hidden catalogue entry and contain no automatically authored material.
doc.getElementById('btnNewSubject').click(); doc.getElementById('nsCode').value = 'NYTT'; doc.getElementById('nsName').value = 'Nytt fag';
failPrice = true;
doc.getElementById('newSubjectForm').dispatchEvent(new w.Event('submit', { cancelable: true })); await settle();
assert.match(doc.getElementById('modalNewState').textContent, /butikkoppsettet feilet/);
failPrice = false;
doc.getElementById('newSubjectForm').dispatchEvent(new w.Event('submit', { cancelable: true })); await settle();
assert.equal(courses.filter((row) => row.subject_code === 'NYTT').length, 1, 'Retrying a failed storefront setup must reuse the created draft');
assert.equal(courses.at(-1).is_published, false);
assert.equal(courses.at(-1).lead, '');
assert.equal(catalogWrites.find((row) => row.table === 'app_subjects' && row.patch.code === 'NYTT').patch.published, false);
// Source-managed courses use their actual page in the preview; generic courses use the standard shell.
for (const [code, route] of [['MET3', '/met3/'], ['BED1', '/bed1/'], ['RRR11', '/subject/']]) {
  doc.querySelector('[data-code="' + code + '"]').click(); await settle();
  assert.equal(new URL(doc.getElementById('previewFrame').src).pathname, route);
}
doc.getElementById('catalogFilter').value = 'draft'; doc.getElementById('catalogFilter').dispatchEvent(new w.Event('change'));
assert.deepEqual(Array.from(doc.querySelectorAll('[data-code]'), (el) => el.dataset.code), ['NYTT']);
dom.window.close();

// A standard subject keeps source-controlled practice when its Studio page arrives.
const subject = new JSDOM(read('subject/index.html'), { url: 'https://example.test/subject/?id=met2', runScripts: 'outside-only' });
const sw = subject.window;
for (const file of ['learning-content', 'subject-page-data', 'subject-resources', 'subject-page-renderer']) sw.eval(read('shared/' + file + '.js'));
const sourcePage = sw.HaugnesSubjectPages.get('met2');
sw.localStorage.setItem('hf_custom_subject_pages_v1', JSON.stringify({ met2: { practice: { cards: [['Legacy browser template']] }, formulaSheet: [['Legacy browser template']] } }));
sw.SubjectsStudio = { getSubject: async () => course('MET2'), signedUrl: async () => '' };
sw.eval(read('shared/subject-page-studio-bridge.js'));
const refreshed = await sw.HaugnesSubjectPages.refresh('met2');
assert.equal(refreshed.practice.cards.length, sourcePage.practice.cards.length);
assert.ok(!JSON.stringify(refreshed).includes('Legacy browser template'), 'Studio must inherit only source-controlled supplements, never old browser templates');
sw.HaugnesSubjectRenderer.render(refreshed);
assert.equal(sw.document.body.dataset.subjectLayout, 'workspace');
assert.equal(sw.document.querySelectorAll('.hf-flip-card').length, 3);
refreshed.notes = [{ id: 'note', title: 'Eget forelesningsnotat' }];
sw.HaugnesSubjectRenderer.render(refreshed);
assert.equal(sw.document.getElementById('heroPrimaryAction').getAttribute('href'), '#notater');
refreshed.memo = { intro: 'Forfatterens intro' }; refreshed.visibility = { overview: false };
sw.HaugnesSubjectRenderer.render(refreshed);
assert.equal(sw.document.getElementById('memo').style.display, 'none');
assert.notEqual(sw.document.getElementById('notater').style.display, 'none', 'Hiding overview must retain lecture notes');
subject.window.close();
console.log('Fagstudio passed: unsaved work, failed saves, selection races, draft creation, publication recovery, source routes and preserved practice.');

// The real Studio create method uses INSERT and enforces a hidden draft, even if a caller passes published=true.
const apiDom = new JSDOM('', { runScripts: 'outside-only' });
let inserted;
apiDom.window.AuthGuard = { getSession: () => ({ user: { id: 'admin' } }), getClient: () => ({ from: () => ({
  insert: (payload) => { inserted = payload; return { select: () => ({ single: async () => ({ data: payload }) }) }; },
}) }) };
apiDom.window.eval(read('shared/subjects-studio.js'));
const created = await apiDom.window.SubjectsStudio.createSubject({ subject_code: 'new1', name: 'Et nytt fag', is_published: true });
assert.equal(inserted.is_published, false);
assert.equal(created.subject_code, 'NEW1');
assert.equal(created.lead, '');
apiDom.window.close();
