import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const dom = new JSDOM(read('user/a-besvarelser.html'), { url: 'https://example.test/user/a-besvarelser.html', runScripts: 'outside-only' });
const w = dom.window;
let active = ['RRR11'];
const sourceId = '74988c01-7995-43e7-a259-28c4136a7acb';
const packages = [
  { id: 'sam3-v26', subject_code: 'SAM3', title: 'SAM3 V26', term: 'V26', resource_count: 3, price_nok_ore: 12900, sale_active: true, published: true },
  { id: 'rrr11-h25', subject_code: 'RRR11', title: 'RRR11 H25', term: 'H25', resource_count: 1, published: true },
  { id: 'met3-h26', subject_code: 'MET3', title: 'MET3 H26', term: 'H26', resource_count: 3, price_nok_ore: 9900, sale_active: true, published: true },
];
const resources = [{ id: 'subject-file-' + sourceId, subject_file_id: sourceId, package_id: 'rrr11-h25', kind: 'A-besvarelse', title: 'Modellbesvarelse', order_index: 1 }];
w.AuthGuard = { getRootPath: () => '/', getClient: () => ({ from(table) {
  return { select: () => { const result = { data: table === 'answer_packages' ? packages : table === 'answer_resources' ? resources : [] }; return { order: () => Promise.resolve(result), then: (yes) => Promise.resolve(result).then(yes) }; } };
} }) };
w.HaugnesEntitlements = { load: async () => {}, isLoaded: () => true, getCodes: () => ['RRR11'], hasBypass: () => false };
w.HaugnesSubjects = { getCatalog: () => [{ code: 'RRR11', name: 'Regnskapsføring' }, { code: 'MET3', name: 'Databehandling' }] };
w.HaugnesSubjectAccess = { getSelected: () => active };
w.eval(read('shared/haugnes-answer-library.js'));
await new Promise((resolve) => setTimeout(resolve, 20));
const doc = w.document;
assert.match(doc.querySelector('[data-archive-group="active"]').textContent, /RRR11/);
assert.doesNotMatch(doc.querySelector('[data-archive-group="active"]').textContent, /SAM3|MET3/);
assert.match(doc.querySelector('[data-archive-group="other"]').textContent, /MET3/);
assert.match(doc.querySelector('[data-archive-group="other"]').textContent, /99 kr/);
assert.equal(w.HaugnesAnswerLibrary.packages.find((p) => p.id === 'sam3-v26').priceOre, 12900, 'Legacy local resources must not override live sale metadata');
assert.equal(w.HaugnesAnswerLibrary.packages.find((p) => p.id === 'met3-h26').resources.length, 0, 'Locked document rows stay private');
assert.equal(w.HaugnesAnswerLibrary.packages.find((p) => p.id === 'met3-h26').resourceCount, 3, 'Public count keeps separate offers visible');
w.location.hash = '#/rrr11/h25';
await new Promise((resolve) => setTimeout(resolve, 10));
assert.equal(doc.querySelector('.hf-resource-actions a').getAttribute('href'), '../user/document.html?file=' + sourceId);
assert.equal(doc.querySelectorAll('.hf-resource-card').length, 1);
active = [];
w.location.hash = '';
await new Promise((resolve) => setTimeout(resolve, 10));
w.dispatchEvent(new w.CustomEvent('haugnes:subject-access-changed'));
assert.equal(doc.querySelector('[data-archive-group="active"]'), null);
assert.match(doc.querySelector('[data-archive-group="other"]').textContent, /RRR11|SAM3/);
// Existing global subject DOM filtering must not hide offers from other courses.
w.eval(read('shared/subject-access.js'));
w.HaugnesSubjectAccess.filterVisibleDom();
assert.equal(doc.querySelectorAll('.hf-subject-hidden-by-access').length, 0);
await new Promise((resolve) => setTimeout(resolve, 10));
dom.window.close();
console.log('Answer archive passed: active-first groups, full catalogue, locked offers, protected uploaded documents and empty active selection.');

// The actual Fagstudio form accepts and classifies multiple local and Drive files.
const admin = new JSDOM(read('user/admin.html'), { url: 'https://example.test/user/admin.html?subject=rrr11', runScripts: 'outside-only' });
const a = admin.window;
const uploaded = [];
const subject = { subject_code: 'RRR11', name: 'Regnskap', accent: '#2563eb', icon: 'A', visibility: {}, flashcards_config: {}, blocks: { topics: [], plan: [], radar: [] }, files: { answer: [], memo: [], task: [] } };
a.SubjectsStudio = { listSubjects: async () => [subject], getSubject: async () => subject, guessAnswerKind: (name) => /sensor/.test(name) ? 'Sensorveiledning' : /oppgave/.test(name) ? 'Eksamen' : 'A-besvarelse', uploadAnswerPackage: async (input) => { uploaded.push(input); } };
a.AuthGuard = { getSession: () => ({ user: { id: 'admin' }, access_token: 'fake' }) };
a.fetch = async (url) => { const id = new URL(url).searchParams.get('drive_id'); return { ok: true, json: async () => ({ file: { id, name: id + '.pdf' } }) }; };
for (const script of a.document.querySelectorAll('script:not([src])')) a.eval(script.textContent);
await new Promise((resolve) => setTimeout(resolve, 20));
a.document.querySelector('[data-editor-view="details"]').click();
a.document.querySelector('[data-add-file="answer"]').click();
const picker = a.document.getElementById('filePicker');
assert.equal(picker.multiple, true);
const files = ['oppgave.pdf', 'modell.pdf', 'sensor.pdf'].map((name) => new a.File(['%PDF'], name, { type: 'application/pdf' }));
Object.defineProperty(picker, 'files', { configurable: true, value: files });
picker.dispatchEvent(new a.Event('change'));
assert.equal(a.document.querySelectorAll('[data-batch-kind]').length, 3);
a.document.getElementById('fileTerm').value = 'H26';
a.document.getElementById('fileTitle').value = 'RRR11 H26';
a.document.getElementById('modalFileForm').dispatchEvent(new a.Event('submit', { cancelable: true }));
await new Promise((resolve) => setTimeout(resolve, 10));
assert.equal(uploaded[0].entries.length, 3);
assert.deepEqual(Array.from(uploaded[0].entries, (entry) => entry.file.name), files.map((file) => file.name));
a.document.querySelector('[data-add-file="answer"]').click();
for (const id of ['oppgave_drive', 'modell_drive', 'sensor_drive']) {
  a.document.getElementById('driveManualInput').value = id;
  a.document.getElementById('btnApplyDriveManual').click();
  await new Promise((resolve) => setTimeout(resolve, 10));
}
assert.equal(a.document.querySelectorAll('[data-batch-kind]').length, 3);
a.document.getElementById('fileTerm').value = 'V27';
a.document.getElementById('fileTitle').value = 'RRR11 V27';
a.document.getElementById('modalFileForm').dispatchEvent(new a.Event('submit', { cancelable: true }));
await new Promise((resolve) => setTimeout(resolve, 10));
assert.deepEqual(Array.from(uploaded[1].entries, (entry) => entry.drive_id), ['oppgave_drive', 'modell_drive', 'sensor_drive']);
admin.window.close();
console.log('Fagstudio passed: multiple local/Drive documents and shared package submission.');
