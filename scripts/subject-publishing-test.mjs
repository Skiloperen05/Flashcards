import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const dom = new JSDOM(read('subject/index.html'), {
  url: 'https://example.test/subject/?id=rrr11',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
});
const w = dom.window;
const state = {
  files: [],
  uploads: [],
  failUpload: false,
  failAtUpload: 0,
  failMetadata: false,
  visibility: { notes: true, answers: false, flashcards: true, radar: false },
  next: 0,
};
const clone = (value) => JSON.parse(JSON.stringify(value));
const db = {
  from(table) {
    let action = 'select',
      payload,
      filters = [];
    const execute = async (single) => {
      if (table === 'subject_files' && action === 'update' && payload.storage_path && state.failMetadata) return { error: new Error('Metadata utilgjengelig') };
      let rows =
        table === 'subject_files'
          ? state.files
          : table === 'subject_pages'
            ? [{ subject_code: 'RRR11', name: 'RRR11', visibility: state.visibility }]
            : [];
      const matches = (row) => filters.every(([key, value]) => row[key] === value);
      if (action === 'insert') {
        const row = { ...clone(payload), id: 'file-' + ++state.next };
        state.files.push(row);
        rows = [row];
      } else if (action === 'update') {
        rows = rows.filter(matches);
        rows.forEach((row) => Object.assign(row, clone(payload)));
        if (table === 'subject_pages') state.visibility = rows[0].visibility;
      } else if (action === 'delete') {
        state.files = state.files.filter((row) => !matches(row));
        rows = [];
      } else rows = rows.filter(matches);
      return { data: clone(single ? rows[0] || null : rows) };
    };
    const query = {
      select: () => query,
      eq: (key, value) => {
        filters.push([key, value]);
        return query;
      },
      order: () => query,
      insert: (value) => {
        action = 'insert';
        payload = value;
        return query;
      },
      update: (value) => {
        action = 'update';
        payload = value;
        return query;
      },
      delete: () => {
        action = 'delete';
        return query;
      },
      maybeSingle: () => execute(true),
      then: (yes, no) => execute(false).then(yes, no),
    };
    return query;
  },
  storage: {
    from: (bucket) => ({
      remove: async () => ({ data: [] }),
      upload: async (path, file, options) => {
        state.uploads.push({ bucket, path, file, options });
        return (state.failUpload || state.uploads.length === state.failAtUpload) ? { error: new Error('Lagring utilgjengelig') } : { data: { path } };
      },
    }),
  },
};
w.HTMLElement.prototype.scrollIntoView = function () {};
w.AuthGuard = {
  getRootPath: () => '/',
  getClient: () => db,
  getSession: () => ({ user: { id: 'admin' } }),
  requireAuth: async () => ({ user: { id: 'admin' } }),
};
w.HaugnesEntitlements = { isAdmin: () => true, effectiveAdmin: () => true };
w.HaugnesSubjectPages = {
  get: () => null,
  savePage: async () => {
    throw new Error('Unexpected fallback');
  },
};
w.eval(read('shared/subjects-studio.js'));
w.eval(read('shared/subject-page-studio-bridge.js'));
await w.HaugnesSubjectPages.refresh('RRR11', { force: true });
await assert.rejects(
  w.SubjectsStudio.uploadFile({ subject_code: 'RRR11', kind: 'answer', title: 'Bare tittel' }),
  /Velg en PDF/,
);
assert.equal(state.files.length, 0, 'Empty answer entries must not be published');
const bytes = '%PDF-1.4\nTest med ekte filbytes\n%%EOF';
const selected = {
  title: 'RRR11 Modellbesvarelse',
  term: 'H2025',
  grade: 'Karakter A',
  pdfData: 'data:application/pdf;base64,' + Buffer.from(bytes).toString('base64'),
  pdfName: 'Øving – RRR11.pdf',
};
let page = w.HaugnesSubjectPages.get('RRR11');
page = await w.HaugnesSubjectPages.savePage('RRR11', { ...page, answers: [selected] });
assert.equal(state.uploads.length, 1);
assert.equal(state.uploads[0].bucket, 'subject-files');
assert.equal(state.uploads[0].file.name, selected.pdfName);
const uploadedBytes = await new Promise((resolve, reject) => {
  const reader = new w.FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsText(state.uploads[0].file);
});
assert.equal(uploadedBytes, bytes, 'The selected file, not only its title, reaches Storage');
assert.equal(page.visibility.answers, true, 'Publishing a document makes its section visible');
assert.equal(state.visibility.radar, false, 'Other subject visibility choices survive');
assert.equal(page.answers[0]._file.meta.original_name, selected.pdfName);
assert.match(page.answers[0].pdfUrl, /\/user\/document\.html\?file=file-1$/);
assert.ok(!page.answers[0].pdfData.startsWith('data:'), 'Published UI uses protected document links');
const firstFile = clone(state.files[0]);
state.failUpload = true;
state.visibility.answers = false;
await assert.rejects(
  w.SubjectsStudio.uploadFile({
    subject_code: 'RRR11',
    kind: 'answer',
    title: 'Feil',
    file: new w.File(['bad'], 'feil.pdf', { type: 'application/pdf' }),
  }),
  /Lagring utilgjengelig/,
);
assert.equal(state.files.length, 1, 'A failed upload does not leave an empty answer row');
assert.equal(state.visibility.answers, false);
state.files.push({ id: 'orphan', subject_code: 'RRR11', kind: 'answer', title: 'Eksisterende uten fil', meta: {} });
await assert.rejects(
  w.SubjectsStudio.updateFile('orphan', { file: new w.File(['bad'], 'feil.pdf') }),
  /Lagring utilgjengelig/,
);
assert.equal(state.files.find((file) => file.id === 'orphan').storage_path, undefined);
state.failUpload = false;
const repaired = await w.SubjectsStudio.updateFile('orphan', {
  file: new w.File([bytes], 'besvarelse.pdf', { type: 'application/pdf' }),
});
assert.equal(repaired.id, 'orphan', 'Repair retains the existing answer identity');
assert.equal(state.files.length, 2);
assert.equal(repaired.storage_bucket, 'subject-files');
assert.equal(repaired.mime_type, 'application/pdf');
assert.equal(state.visibility.answers, true);
assert.deepEqual(state.files[0], firstFile, 'Repair does not modify another answer');
assert.equal(
  'file' in state.files.find((file) => file.id === 'orphan'),
  false,
  'File objects are never written into metadata',
);

// Drive-based repair follows the same visibility rule; local replacement removes
// stale Drive identifiers from the new document metadata.
db.auth = { getSession: async () => ({ data: { session: { access_token: 'test-user' } } }) };
w.fetch = async (url, options) => {
  assert.match(url, /drive-proxy\?action=import$/);
  const input = JSON.parse(options.body);
  const row = {
    ...input,
    id: input.id || 'drive-answer',
    subject_code: 'RRR11',
    kind: 'answer',
    storage_bucket: 'google_drive',
    storage_path: input.drive_id,
    meta: { source: 'google_drive', drive_id: input.drive_id, drive_name: 'Privat.pdf' },
  };
  state.files = state.files.filter((file) => file.id !== row.id).concat(row);
  return { ok: true, json: async () => ({ file: row }) };
};
state.visibility.answers = false;
await w.SubjectsStudio.updateFile('orphan', { storage_bucket: 'google_drive', storage_path: 'private-drive-id' });
assert.equal(state.visibility.answers, true, 'Attaching a Drive document also enables A-besvarelser');
const localReplacement = await w.SubjectsStudio.updateFile('orphan', {
  file: new w.File([bytes], 'lokal.pdf', { type: 'application/pdf' }),
});
assert.equal(localReplacement.storage_bucket, 'subject-files');
assert.equal(localReplacement.meta.drive_id, undefined);
assert.equal(localReplacement.meta.drive_name, undefined);
assert.notEqual(localReplacement.meta.source, 'google_drive');

// Exercise the real form: missing files and failed uploads retain clear feedback.
w.eval(read('shared/subject-page-renderer.js'));
for (const script of w.document.querySelectorAll('script:not([src])')) w.eval(script.textContent);
await new Promise((resolve) => setTimeout(resolve, 10));
w.openSubjectAnswerModal();
const event = { preventDefault() {} };
assert.equal(await w.handleSaveAnswer(event), false);
assert.match(w.document.getElementById('toast').textContent, /Velg en PDF/);
const count = state.files.length;
w.document.getElementById('ansPdfData').value = selected.pdfData;
w.document.getElementById('ansPdfName').textContent = selected.pdfName;
state.failUpload = true;
assert.equal(await w.handleSaveAnswer(event), false);
assert.match(w.document.getElementById('toast').textContent, /Kunne ikke publisere/);
assert.equal(
  w.document.getElementById('ansPdfData').value,
  selected.pdfData,
  'An error must not clear the selected file',
);
assert.equal(w.document.querySelector('#modalSubjectAnswer button[type="submit"]').disabled, false);
assert.equal(state.files.length, count);
state.failUpload = false;
assert.equal(await w.handleSaveAnswer(event), true);
assert.equal(w.document.getElementById('besvarelser').style.display, 'block');
assert.equal(w.document.getElementById('tabAnswers').style.display, 'inline-block');
assert.ok(w.document.querySelector('#packagesList a[href*="document.html"]'));
// A batch uses one shared term and explicit per-file types; a partial failure rolls back new rows.
const batchFiles = ['oppgavetekst.pdf', 'modellbesvarelse.pdf', 'sensorveiledning.pdf'].map((name) => new w.File([bytes], name, { type: 'application/pdf' }));
const entries = batchFiles.map((file) => ({ file, name: file.name }));
const beforeBatch = state.files.length;
state.failAtUpload = state.uploads.length + 2;
await assert.rejects(w.SubjectsStudio.uploadAnswerPackage({ subject_code: 'RRR11', term: 'H26', entries }), /Lagring/);
assert.equal(state.files.length, beforeBatch, 'No duplicate or partial rows remain after retryable failure');
state.failAtUpload = 0;
state.failMetadata = true;
await assert.rejects(w.SubjectsStudio.uploadAnswerPackage({ subject_code: 'RRR11', term: 'H26', entries }), /Metadata/);
assert.equal(state.files.length, beforeBatch, 'Metadata failure cleans the unfinished document too');
state.failMetadata = false;
const batch = await w.SubjectsStudio.uploadAnswerPackage({ subject_code: 'RRR11', term: 'H26', title: 'RRR11 H26', entries });
assert.equal(batch.length, 3);
assert.deepEqual(Array.from(batch, (file) => file.meta.resource_kind), ['Eksamen', 'A-besvarelse', 'Sensorveiledning']);
assert.ok(batch.every((file) => file.term === 'H26' && file.meta.package_title === 'RRR11 H26'));
const firstUploadCount = state.uploads.length;
await assert.rejects(w.SubjectsStudio.uploadAnswerPackage({ subject_code: 'RRR11', term: 'H26', entries: [{ file: new w.File([], 'tom.pdf') }] }), /Hver fil/);
assert.equal(state.uploads.length, firstUploadCount, 'Validate every file before uploading any bytes');
// The actual inline form can publish several selected files without FileReader races.
w.openSubjectAnswerModal();
w.document.getElementById('ansTerm').value = 'V27';
w.document.getElementById('ansTitle').value = 'RRR11 V27';
w.handleAnswerFilesSelected({ files: batchFiles });
assert.equal(w.document.querySelectorAll('#ansBatchFiles select').length, 3);
assert.equal(await w.handleSaveAnswer(event), true);
assert.equal(state.files.filter((file) => file.term === 'V27').length, 3);
dom.window.close();
console.log(
  'Subject publishing tests passed: selected file bytes, protected links, visibility, failed uploads, existing-row repair, typed multi-file batches, rollback and form feedback.',
);
