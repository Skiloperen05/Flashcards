import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Memo text is transcribed from the author's DOCX files without rewriting.
const root = resolve(import.meta.dirname, '..');
const content = JSON.parse(readFileSync(resolve(root, 'data/first-semester.json'), 'utf8'));
const check = process.argv.includes('--check');
const esc = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );

function output(path, text) {
  text = text.replace(/[ \t]+$/gm, '');
  const target = resolve(root, path);
  if (check) {
    if (!existsSync(target) || readFileSync(target, 'utf8') !== text) throw new Error(`Regenerate ${path}`);
  } else writeFileSync(target, text);
}

function documentLink(doc, primary = false) {
  const [kind, title, href] = doc;
  if (!existsSync(resolve(root, href.replace('../', '')))) throw new Error(`Missing resource: ${href}`);
  const format = href.endsWith('.pdf') ? 'PDF' : 'Word';
  return `<a class="semester-document${primary ? ' semester-document-primary' : ''}" href="${esc(href)}"><span class="semester-file-type">${format}</span><span><small>${esc(kind)} · Høsten 2025</small><strong>${esc(title)}</strong></span><span aria-hidden="true">↗</span></a>`;
}

function page(subject) {
  const { id, code, name, summary, focus, documents, diagram, paragraphs } = subject;
  const answers = documents.length > 0;
  return `<!DOCTYPE html>
<html lang="nb">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${esc(summary)}">
  <title>${code} ${esc(name)} — Haugnes Flashcards</title>
  <link rel="icon" href="../assets/haugnes-logo-mark.svg">
  <link rel="stylesheet" href="../shared/haugnes-theme.css">
  <link rel="stylesheet" href="../shared/first-semester.css">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="../shared/auth-guard.js"></script>
  <script>window.HAUGNES_SUBJECT_ID = '${id}'; AuthGuard.requireAuth();</script>
</head>
<body class="haugnes-app semester-page" style="--semester-accent:${subject.accent}">
  <a class="semester-skip" href="#main">Hopp til innhold</a>
  <header class="semester-topbar">
    <a class="semester-brand" href="../user/">Haugnes <span>Flashcards</span></a>
    <a href="../user/subjects.html">Mine fag <span aria-hidden="true">↗</span></a>
  </header>
  <main id="main" class="semester-main">
    <nav class="semester-breadcrumb" aria-label="Brødsmule"><a href="../user/subjects.html">Mine fag</a><span aria-hidden="true">/</span><span>Første semester</span></nav>
    <header class="semester-heading">
      <p class="semester-eyebrow">Første semester <span>·</span> ${code}</p>
      <h1>${esc(name)}</h1>
      <p class="semester-lead">${esc(summary)}</p>
      <nav class="semester-tabs" aria-label="På denne siden">
        <a href="#memo">Memoar</a>
        ${answers ? '<a href="#besvarelser">A-besvarelse og eksamen</a>' : ''}
        ${diagram ? '<a href="#forklaring">Arbeidsmåte</a>' : ''}
        ${id !== 'kom1' ? `<a href="../flashcards/?subject=${id}">Flashcards <span aria-hidden="true">↗</span></a>` : ''}
      </nav>
    </header>
    <div class="semester-layout${answers ? '' : ' semester-layout-reading'}">
      <article id="memo" class="semester-memo" aria-labelledby="memo-title">
        <div class="semester-section-heading"><p class="semester-eyebrow">Av ${content.author}</p><h2 id="memo-title">Memoar ${code}</h2></div>
        <p class="semester-attribution">Personlige erfaringer og råd fra BH.</p>
        <div class="semester-prose">${paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('\n        ')}</div>
        <p class="semester-signature">${content.author}</p>
      </article>
      ${
        answers
          ? `<aside id="besvarelser" class="semester-resources" aria-labelledby="answers-title">
        <p class="semester-eyebrow">Eksamensarkiv</p>
        <h2 id="answers-title">A-besvarelse</h2>
        <p class="semester-resource-intro">${id === 'bed1' ? 'Besvarelsen, oppgaven og løsningsforslaget fra samme eksamen.' : 'Besvarelsen og sensorveiledningen fra samme eksamen.'}</p>
        ${documents.map((doc, index) => documentLink(doc, index === 0)).join('\n        ')}
        <a class="semester-archive-link" href="../user/a-besvarelser.html#/${id}/h25">Åpne i eksamensarkivet <span aria-hidden="true">↗</span></a>
      </aside>`
          : ''
      }
    </div>
    ${
      diagram
        ? `<section id="forklaring" class="semester-explanation" aria-labelledby="explanation-title">
      <p class="semester-eyebrow">Arbeidsmåte</p><h2 id="explanation-title">${esc(diagram.title)}</h2>
      <p>${esc(diagram.intro)}</p>
      <figure><ol class="semester-flow">${diagram.steps.map(([title, text], index) => `<li><span class="semester-step">0${index + 1}</span><h3>${esc(title)}</h3><p>${esc(text)}</p></li>`).join('')}</ol><figcaption>Illustrasjon av arbeidsmåten i memoaret.</figcaption></figure>
    </section>`
        : ''
    }
    <section class="semester-closing" aria-label="Videre arbeid"><div><p class="semester-eyebrow">Mitt råd</p><p>${esc(focus)}</p></div>${id !== 'kom1' ? `<a class="semester-study-link" href="../flashcards/?subject=${id}">Øv med flashcards <span aria-hidden="true">→</span></a>` : '<a class="semester-study-link" href="../user/subjects.html">Til de andre fagene <span aria-hidden="true">→</span></a>'}</section>
  </main>
  <footer class="semester-footer"><a href="../user/subjects.html">← Mine fag</a><span>${code} · Haugnes Flashcards</span></footer>
</body>
</html>
`;
}

for (const subject of content.subjects) output(`${subject.id}/index.html`, page(subject));
const resourceTypes = {
  'A-besvarelse': 'a_besvarelse',
  Eksamen: 'eksamen',
  Sensorveiledning: 'sensorveiledning',
  Løsningsforslag: 'annet',
};
const resources = content.subjects
  .map((subject) => {
    const rows = [
      {
        type: 'memoar',
        title: `Memoar ${subject.code}`,
        description: subject.summary,
        status: 'available',
        href: `../${subject.id}/#memo`,
      },
    ];
    for (const [kind, title, href] of subject.documents) {
      rows.push({ type: resourceTypes[kind], title, description: 'Høsten 2025', status: 'available', href });
    }
    return `    ${subject.id}: ${JSON.stringify(rows, null, 2).replace(/\n/g, '\n    ')}`;
  })
  .join(',\n');
const resourcesPath = 'shared/subject-resources.js';
const resourcesSource = readFileSync(resolve(root, resourcesPath), 'utf8');
if (!resourcesSource.includes('// first-semester:start') || !resourcesSource.includes('// first-semester:end')) {
  throw new Error('First-semester resource markers are missing');
}
output(
  resourcesPath,
  resourcesSource.replace(
    / {4}\/\/ first-semester:start[^\n]*\n[\s\S]*? {4}\/\/ first-semester:end/,
    `    // first-semester:start (generated)\n${resources}\n    // first-semester:end`,
  ),
);
output(
  'shared/first-semester-content.js',
  `// Generated from data/first-semester.json. Run npm run semester:generate.
// biome-ignore-all format: Keep generated content in sync with its JSON source.
window.HaugnesFirstSemester = ${JSON.stringify(content, null, 2)};
`,
);
console.log(`${check ? 'Checked' : 'Generated'} five first-semester pages and shared memo content.`);
