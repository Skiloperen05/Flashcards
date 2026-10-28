import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const clone = (value) => JSON.parse(JSON.stringify(value));
const settle = () => new Promise((resolve) => setTimeout(resolve, 30));

// Exercise the real admin form -> Studio API -> stored rows -> fresh student page.
const ids = [1, 2, 3].map((n) => '00000000-0000-0000-0000-' + String(n).padStart(12, '0'));
const state = {
  pages: ['RRR11', 'MET3', 'BED1'].map((code) => ({ subject_code: code, name: code, icon: '📚', accent: '#2563eb', is_published: true, origin: 'custom', visibility: {} })),
  files: ids.map((id, i) => ({ id, subject_code: 'RRR11', kind: 'memo', title: 'Forelesning ' + (i + 1), description: 'Fagstoff', body: 'Eget notat', sort_order: 0,
    uploaded_at: '2026-10-20T08:00:00Z', storage_bucket: 'subject-files', storage_path: 'RRR11/' + id + '.pdf', meta: {} })),
  catalog: ['RRR11', 'MET3', 'BED1'].map((code) => ({ code })),
  rpcCalls: [], failReorder: false,
};
const fileOrder = (code = 'RRR11', kind = 'memo') => state.files.filter((row) => row.subject_code === code && row.kind === kind)
  .slice().sort((a, b) => a.sort_order - b.sort_order || a.uploaded_at.localeCompare(b.uploaded_at) || a.id.localeCompare(b.id)).map((row) => row.id);
const db = {
  from(table) {
    let action = 'select', payload, filters = [], orders = [];
    const execute = async (single = false) => {
      const all = table === 'subject_pages' ? state.pages : table === 'subject_files' ? state.files : table === 'app_subjects' ? state.catalog : [];
      const matches = (row) => filters.every(([key, value]) => row[key] === value);
      let rows = all.filter(matches);
      if (action === 'update') rows.forEach((row) => Object.assign(row, clone(payload)));
      if (action === 'upsert') {
        const existing = all.find((row) => row.subject_code === payload.subject_code);
        if (existing) Object.assign(existing, clone(payload)); else all.push(clone(payload));
        rows = [existing || all.at(-1)];
      }
      rows = rows.slice().sort((a, b) => {
        for (const key of orders) {
          const result = typeof a[key] === 'number' ? a[key] - b[key] : String(a[key] || '').localeCompare(String(b[key] || ''));
          if (result) return result;
        }
        return 0;
      });
      return { data: clone(single ? rows[0] || null : rows) };
    };
    const query = {
      select: () => query, eq: (key, value) => { filters.push([key, value]); return query; }, order: (key) => { orders.push(key); return query; },
      update: (value) => { action = 'update'; payload = value; return query; }, upsert: (value) => { action = 'upsert'; payload = value; return query; },
      maybeSingle: () => execute(true), then: (yes, no) => execute().then(yes, no),
    };
    return query;
  },
  async rpc(name, args) {
    state.rpcCalls.push(clone(args));
    await new Promise((resolve) => setTimeout(resolve, 4));
    if (state.failReorder) return { error: new Error('Simulert nettverksfeil') };
    assert.equal(name, 'reorder_subject_files');
    assert.deepEqual(Array.from(args.p_expected_ids), fileOrder(args.p_subject_code, args.p_kind));
    for (const [index, id] of args.p_ordered_ids.entries()) state.files.find((row) => row.id === id).sort_order = index;
    return { data: null };
  },
};
function configure(w, admin) {
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.AuthGuard = { getRootPath: () => '/', getClient: () => db, getSession: () => ({ user: { id: admin ? 'admin' : 'student' } }), requireAuth: async () => ({ user: { id: 'student' } }) };
  w.HaugnesEntitlements = { isAdmin: () => admin, effectiveAdmin: () => admin };
}
const admin = new JSDOM(read('user/admin.html'), { url: 'https://example.test/user/admin.html?subject=rrr11', runScripts: 'outside-only', pretendToBeVisual: true });
const w = admin.window, doc = w.document;
configure(w, true); w.eval(read('shared/subjects-studio.js'));
for (const script of doc.querySelectorAll('script:not([src])')) w.eval(script.textContent);
await settle();
doc.querySelector('[data-editor-view="details"]').click();
assert.equal(doc.querySelector('[data-move-file="up"]').disabled, true);
const down = doc.querySelector('[data-move-file="down"]'); down.click(); down.click();
assert.equal(doc.querySelector('[data-file-position]').disabled, true, 'Disable ordering controls while a request is pending');
await settle();
assert.equal(state.rpcCalls.length, 1, 'A double click must not start a second reorder');
assert.deepEqual(fileOrder(), [ids[1], ids[0], ids[2]]);
assert.deepEqual(Array.from(doc.querySelectorAll('[data-file-id]'), (el) => el.dataset.fileId), fileOrder());
// Direct placement works as well as arrows, and survives a fresh fetch.
const last = doc.querySelector('[data-file-position][data-id="' + ids[2] + '"]'); last.value = '0'; last.dispatchEvent(new w.Event('change'));
await settle(); assert.deepEqual(fileOrder(), [ids[2], ids[1], ids[0]]);
assert.deepEqual(Array.from((await w.SubjectsStudio.getSubject('RRR11', { force: true })).files.memo, (file) => file.id), fileOrder());
state.failReorder = true;
doc.querySelector('[data-move-file="down"]').click(); await settle();
assert.deepEqual(fileOrder(), [ids[2], ids[1], ids[0]]);
assert.match(doc.getElementById('toast').textContent, /Kunne ikke lagre rekkefølgen/);
state.failReorder = false;
await assert.rejects(w.SubjectsStudio.reorderFiles('RRR11', 'memo', [ids[0], ids[0]], [ids[0], ids[1]]), /Ugyldig/);
// Edit the actual note, then confirm its title, body and position on a fresh student page.
doc.querySelector('[data-edit-file="memo"][data-id="' + ids[2] + '"]').click();
doc.getElementById('fileTitle').value = 'Forelesning 3 · revidert';
doc.getElementById('fileBody').value = 'Notat skrevet av fagansvarlig';
doc.getElementById('modalFileForm').dispatchEvent(new w.Event('submit', { cancelable: true })); await settle();
const tab = (key) => doc.querySelector('[data-studio-tab="' + key + '"]').click();
const edit = (field, value) => { const input = doc.querySelector('[data-header="' + field + '"]'); input.value = value; input.dispatchEvent(new w.Event('input')); };
tab('appearance');
for (const [field, value] of Object.entries({ name: 'Regnskap med eget innhold', lead: 'Dette er ingressen fra Fagstudio', next_step: 'Les forelesning 3 først', accent: '#10b981', icon: '📖', status_text: 'Oppdatert H26' })) edit(field, value);
doc.getElementById('btnSaveAll').click(); await settle();
assert.equal(state.catalog[0].name, 'Regnskap med eget innhold', 'Metadata edits also update the course catalogue');
tab('overview'); edit('memo_intro', 'Egen introduksjon'); edit('memo_study_advice', 'Jobb med spørsmålene etter notatet'); doc.getElementById('btnSaveAll').click(); await settle();
tab('content'); edit('flashcards_kicker', 'Øv etter forelesningene'); doc.getElementById('btnSaveAll').click(); await settle();
assert.equal(doc.querySelector('[data-header="flashcards_url"]'), null, 'Do not offer an unused URL override for native study');

const student = new JSDOM(read('subject/index.html'), { url: 'https://example.test/subject/?id=rrr11', runScripts: 'outside-only', pretendToBeVisual: true });
const sw = student.window; configure(sw, false);
for (const file of ['learning-content', 'subject-page-data', 'subjects-studio', 'subject-page-studio-bridge', 'subject-studio-layout', 'subject-page-renderer']) sw.eval(read('shared/' + file + '.js'));
for (const script of sw.document.querySelectorAll('script:not([src])')) sw.eval(script.textContent);
await settle();
const page = sw.HaugnesSubjectPages.get('rrr11');
assert.deepEqual(Array.from(page.notes, (file) => file.id), fileOrder());
assert.deepEqual(Array.from(sw.document.querySelectorAll('#notesList h4'), (node) => node.textContent), ['Forelesning 3 · revidert', 'Forelesning 2', 'Forelesning 1']);
assert.equal(sw.document.getElementById('subjectLead').textContent, 'Dette er ingressen fra Fagstudio');
assert.match(sw.document.getElementById('memo').textContent, /Egen introduksjon/);
assert.equal(sw.document.getElementById('studioNextStep').textContent, 'Les forelesning 3 først');
assert.equal(sw.document.body.style.getPropertyValue('--subject-accent'), '#10b981');
assert.match(sw.document.getElementById('subjectKicker').textContent, /📖/);
assert.equal(sw.document.getElementById('studioHeaderStatus').textContent, 'Oppdatert H26');
assert.match(sw.document.getElementById('notesList').textContent, /Notat skrevet av fagansvarlig/);
assert.match(page.notes[0].pdfUrl, /\/user\/document.html\?file=/);
// The saved study subtitle is used by the native room, and metadata refreshes retain an active session.
for (const file of ['haugnes-study-data', 'flashcard-study-session', 'flashcard-progress', 'rrr11-coso-study', 'rrr11-study', 'flashcard-library', 'flashcard-store']) sw.eval(read('shared/' + file + '.js'));
sw.AuthGuard.requireAuth = async () => ({ user: { id: 'student', email: 'dev@student.local' } });
sw.eval(read('shared/subject-flashcards.js')); await settle();
const room = sw.document.getElementById('flashcards');
assert.equal(room.querySelector('.sfc-eyebrow').textContent, 'Øv etter forelesningene');
sw.HaugnesSubjectFlashcards.open(); room.querySelector('[data-sfc-start]').click();
assert.equal(room.dataset.sfcActive, 'cards');
edit('flashcards_kicker', 'Egen undertittel etter oppdatering'); doc.getElementById('btnSaveAll').click(); await settle();
await sw.HaugnesSubjectPages.refresh('RRR11'); await settle();
assert.equal(sw.document.getElementById('flashcards'), room);
assert.equal(room.dataset.sfcActive, 'cards', 'An authoring refresh must not reset a student session');
assert.equal(room.querySelector('.sfc-eyebrow').textContent, 'Egen undertittel etter oppdatering');
await w.SubjectsStudio.upsertSubject({subject_code:'RRR11',visibility:{section_order:['study','notes','intro']}});
await sw.HaugnesSubjectPages.refresh('RRR11');await settle();
assert.equal(sw.document.getElementById('flashcards'),room);
assert.equal(room.dataset.sfcActive,'cards','A saved layout change retains the active study session');
assert.ok(room.compareDocumentPosition(sw.document.getElementById('notater'))&sw.Node.DOCUMENT_POSITION_FOLLOWING);
student.window.close();

// Dedicated subject pages now consume Studio edits, while preserving authored memoars and tools.
for (const code of ['MET3', 'BED1', 'SAM2', 'SAM3', 'SOL1', 'RET14']) {
  const route = code.toLowerCase();
  const dom = new JSDOM(read(route + '/index.html'), { url: 'https://example.test/' + route + '/', runScripts: 'outside-only' });
  const nw = dom.window; configure(nw, false); nw.eval(read('shared/subjects-studio.js'));
  const full = clone(await w.SubjectsStudio.getSubject('RRR11', { force: true })); full.subject_code = code;
  full.visibility = { studio_header: true }; full.name = code + ' · redigert';
  full.files.memo = full.files.memo.map((file) => ({ ...file, subject_code: code }));
  const original = nw.document.querySelector('.semester-layout,.hf-card-grid')?.innerHTML;
  nw.eval(read('shared/subject-studio-live.js'));
  await nw.HaugnesStudioLive.render(full);
  assert.equal(nw.document.querySelector('.semester-heading h1,.hf-hero h1').textContent, full.name);
  assert.equal(nw.document.querySelector('.semester-layout,.hf-card-grid')?.innerHTML, original, code + ': authored material and tools survive');
  assert.deepEqual(Array.from(nw.document.querySelectorAll('[data-studio-file-id]'), (node) => node.dataset.studioFileId), fileOrder());
  assert.match(nw.document.getElementById('studio-overview').textContent, /Egen introduksjon/);
  full.visibility.notes = false;
  await nw.HaugnesStudioLive.render(full);
  assert.equal(nw.document.getElementById('studio-notes'), null, code + ': visibility changes affect the active page');
  dom.window.close();
}
admin.window.close();
console.log('Functional editor passed: actual form edits, file moves/direct positions, saved order, failed requests, fresh student rendering and dedicated subject pages.');
