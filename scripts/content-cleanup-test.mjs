import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const dom = new JSDOM(read('subject/index.html'), {
  url: 'https://example.test/subject/?id=empty', runScripts: 'outside-only',
});
const w = dom.window;
w.HaugnesSubjects = { findById: () => ({ id: 'empty', code: 'EMPTY', name: 'Nytt fag' }) };
for (const file of ['learning-content', 'subject-page-data', 'subject-resources', 'subject-page-renderer']) {
  w.eval(read('shared/' + file + '.js'));
}
const page = w.HaugnesSubjectPages.get('empty');
for (const key of ['notes', 'answers', 'tasks', 'topics', 'plan', 'stats', 'tools']) assert.deepEqual(Array.from(page[key]), [], key);
assert.equal(page.memo, null);
assert.equal(page.examRadar, null);
assert.equal(page.progress, null);
w.HaugnesSubjectRenderer.render(page);
for (const id of ['notater', 'oppgaver', 'besvarelser', 'eksamensradar', 'topicsAndPlanGrid']) {
  assert.equal(w.document.getElementById(id).style.display, 'none', id + ': students only see populated sections');
}
assert.equal(w.document.querySelector('#memo'), null);
assert.equal(w.document.querySelector('#learningSuite'), null);

// An administrator can still populate a blank subject. Published content appears immediately.
w.HaugnesSubjectRenderer.applyContentVisibility(page, true);
assert.notEqual(w.document.getElementById('notater').style.display, 'none');
page.notes = [{ id: 'real-note', title: 'Forelesning 1', pdfUrl: '/user/document.html?file=real' }];
page.answers = [{ id: 'real-answer', title: 'Modellbesvarelse', pdfUrl: '/user/document.html?file=answer' }];
w.HaugnesSubjectRenderer.applyContentVisibility(page, false);
assert.notEqual(w.document.getElementById('notater').style.display, 'none');
assert.notEqual(w.document.getElementById('besvarelser').style.display, 'none');
page.visibility = { answers: false };
w.HaugnesSubjectRenderer.applyContentVisibility(page, false);
assert.equal(w.document.getElementById('besvarelser').style.display, 'none');

// Old browser demos are filtered without discarding an edited, useful note.
w.localStorage.setItem('hf_custom_subject_pages_v1', JSON.stringify({ empty: {
  notes: [{ id: 'note_1', title: 'Forelesning 1: Introduksjon og kjernebegreper', body: 'Egne, redigerte fagnotater.' }],
} }));
assert.equal(w.HaugnesSubjectPages.get('empty').notes.length, 1);
const resources = ['ret14', 'sol1', 'sam2', 'sam3', 'met2', 'mat10', 'bed1', 'ret1a', 'met1', 'sam1a', 'kom1']
  .flatMap((id) => w.HaugnesSubjectResources.forSubject(id));
assert.ok(resources.every((r) => r.status === 'available' && r.href));
assert.ok(!resources.some((r) => r.href.includes('user/oppgavebank.html')));
assert.equal(w.HaugnesLearningContent.decksFor('met3').reduce((n, deck) => n + deck.cards.length, 0), 146);
assert.equal(w.HaugnesLearningContent.decksFor('mat10').length, 0, 'Import stubs cannot reappear through the generator');
assert.equal(w.HaugnesSubjectPages.get('met2').practice.cards.length, 3, 'Concrete learning examples survive cleanup');
w.eval(read('shared/subjects-studio.js'));
assert.equal(await w.SubjectsStudio.migrateLegacyIfNeeded(), false, 'Old templates cannot overwrite Studio');
dom.window.close();
const archive = new JSDOM(read('user/a-besvarelser.html'), {
  url: 'http://127.0.0.1:3000/user/a-besvarelser.html?dev=1', runScripts: 'outside-only',
});
archive.window.AuthGuard = { getRootPath: () => '/', getClient: () => ({
  from: (table) => ({ select: () => ({ order: () => Promise.resolve({ data: table === 'answer_packages'
    ? [{ id: 'ret14-empty', subject_code: 'RET14', title: 'Tom malpakke', published: true }]
    : [] }) }) }),
}) };
archive.window.HaugnesEntitlements = { load: () => Promise.resolve(), getCodes: () => [] };
archive.window.eval(read('shared/haugnes-answer-library.js'));
await new Promise((resolve) => setTimeout(resolve, 20));
assert.equal(archive.window.document.querySelectorAll('.hf-subject-tile').length, 4, 'Only subjects with documents appear in the archive');
assert.doesNotMatch(archive.window.document.querySelector('.workspace').textContent, /Tom malpakke|Klar plass|RET14/);
const files = archive.window.HaugnesAnswerLibrary.resources;
assert.equal(files.length, 17, 'All real local exam documents survive');
for (const file of files) assert.ok(existsSync(new URL(file.url.replace(/^\.\.\//, '../'), import.meta.url)), file.url);
archive.window.close();
console.log('Content cleanup passed: empty subjects, publication, visibility, legacy data and preserved learning content.');
