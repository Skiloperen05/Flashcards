(function (window, document) {
  'use strict';
  // Dedicated home pages keep their authored material; Studio adds real, editable content alongside it.
  var match = window.location.pathname.match(/\/(met3|sam2|sam3|sol1|ret14|bed1|ret1a|met1|sam1a|kom1)\/(?:index\.html)?$/i);
  if (!match || window.HaugnesStudioLive) return;
  var subjectCode = match[1].toUpperCase();
  var current = null, generation = 0, request = 0;
  var rootPath = window.AuthGuard && window.AuthGuard.getRootPath ? window.AuthGuard.getRootPath() : '../';
  var css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = rootPath.replace(/\/?$/, '/') + 'shared/subject-studio-live.css?v=20261028-order';
  document.head.appendChild(css);
  function element(tag, text, className) {
    var node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function applyHeader(full) {
    if (!(full.visibility || {}).studio_header) return;
    var header = document.querySelector('.semester-heading,.hf-hero');
    if (!header) return;
    var title = header.querySelector('h1');
    if (title) title.textContent = full.name;
    var lead = header.querySelector('.semester-lead,.hf-lead');
    if (lead) lead.textContent = full.lead || '';
    var kicker = header.querySelector('.semester-eyebrow,.hf-kicker');
    if (kicker) kicker.textContent = [full.icon, full.subject_code, full.kicker].filter(Boolean).join(' · ');
    var status = header.querySelector('[data-studio-status]');
    if (!status) { status = element('span', '', 'studio-live-status'); status.dataset.studioStatus = '1'; header.appendChild(status); }
    status.textContent = full.status_text || ''; status.hidden = !full.status_text;
    document.title = full.subject_code + ' ' + full.name + ' — Haugnes Flashcards';
    document.body.style.setProperty('--subject-accent', full.accent);
    document.body.style.setProperty('--semester-accent', full.accent);
    document.body.classList.add('hf-studio-header-edited');
  }
  function documentCard(file, kind, url) {
    var card = element('article', '', 'studio-live-document'); card.dataset.studioFileId = file.id;
    card.appendChild(element('h3', file.title));
    var metadata = [file.term, file.grade, (file.meta || {}).source, (file.meta || {}).date].filter(Boolean);
    if (metadata.length) card.appendChild(element('p', metadata.join(' · '), 'studio-live-meta'));
    if (file.description) card.appendChild(element('p', file.description, 'studio-live-text'));
    if (url) {
      var link = element('a', 'Åpne dokument →'); link.href = url;
      card.appendChild(link);
    }
    if (file.body) {
      var details = element('details');
      details.appendChild(element('summary', kind === 'task' ? 'Vis løsningsforslag' : 'Les notatet'));
      details.appendChild(element('div', file.body, 'studio-live-text'));
      card.appendChild(details);
    }
    return card;
  }
  async function render(full) {
    if (!full || full.subject_code !== subjectCode) return;
    var version = ++generation;
    var main = document.querySelector('main');
    if (!main) return;
    var admin = window.HaugnesEntitlements && window.HaugnesEntitlements.isAdmin && window.HaugnesEntitlements.isAdmin();
    if (full.is_published === false && !admin) {
      document.getElementById('studioCourseContent')?.remove(); return;
    }
    var vis = full.visibility || {};
    var sectionRoot = element('div', '', 'studio-live-content'); sectionRoot.id = 'studioCourseContent';
    function section(id, title) {
      var node = element('section', '', 'studio-live-section'); node.id = id;
      node.appendChild(element('h2', title)); sectionRoot.appendChild(node); return node;
    }
    var copy = [full.memo_intro, full.memo_exam, full.memo_study_advice, full.next_step].filter(function (text) { return String(text || '').trim(); });
    if (vis.overview !== false && copy.length) {
      var intro = section('studio-overview', 'Om arbeidet med faget');
      [['Kort intro', full.memo_intro], ['Eksamen', full.memo_exam], ['Slik bruker du siden', full.memo_study_advice], ['Neste steg', full.next_step]].forEach(function (row) {
        if (!String(row[1] || '').trim()) return;
        intro.appendChild(element('h3', row[0])); intro.appendChild(element('p', row[1], 'studio-live-text'));
      });
    }
    [['topics', 'Viktige temaer'], ['plan', 'Anbefalt øvingsløp'], ['radar', 'Eksamensradar fra Fagstudio']].forEach(function (entry) {
      var rows = (full.blocks || {})[entry[0]] || [];
      if (vis[entry[0]] === false || !rows.length) return;
      var node = section('studio-' + entry[0], entry[1]);
      rows.forEach(function (row) {
        node.appendChild(element('h3', row.title));
        if (row.body) node.appendChild(element('p', row.body, 'studio-live-text'));
        if (row.weight || row.priority) node.appendChild(element('p', [row.weight, row.priority].filter(Boolean).join(' · '), 'studio-live-meta'));
      });
    });
    for (var entry of [['memo', 'notes', 'Forelesningsnotater'], ['answer', 'answers', 'Eksamensdokumenter'], ['task', 'tasks', 'Oppgavebank']]) {
      var files = (full.files || {})[entry[0]] || [];
      if (vis[entry[1]] === false || !files.length) continue;
      var list = section('studio-' + entry[1], entry[2]);
      var urls = await Promise.all(files.map(function (file) { return window.SubjectsStudio.signedUrl(file); }));
      files.forEach(function (file, index) { list.appendChild(documentCard(file, entry[0], urls[index])); });
    }
    if (version !== generation) return;
    current = full;
    applyHeader(full);
    var existing = document.getElementById('studioCourseContent');
    if (!sectionRoot.childElementCount) { if (existing) existing.remove(); }
    else if (existing) existing.replaceWith(sectionRoot);
    else {
      var closing = main.querySelector('.semester-closing');
      var host = main.querySelector('.hf-subject-layout>div') || main.querySelector('.hf-shell') || main;
      if (closing) closing.before(sectionRoot); else host.appendChild(sectionRoot);
    }
    var tabs = document.querySelector('.semester-tabs,.hf-hero .hf-tabbar');
    if (tabs) {
      tabs.querySelectorAll('[data-studio-tab-link]').forEach(function (link) { link.remove(); });
      Array.from(sectionRoot.children).forEach(function (node) {
        var link = element('a', node.querySelector('h2').textContent);
        link.href = '#' + node.id; link.dataset.studioTabLink = '1'; tabs.appendChild(link);
      });
    }
    window.HaugnesSubjectFlashcards?.syncPresentation?.();
    window.HaugnesSubjectLayout?.apply(full);
  }
  function refresh() {
    if (!window.SubjectsStudio) return Promise.resolve();
    var version = ++request;
    return window.SubjectsStudio.getSubject(subjectCode, { force: true }).then(function (full) { if (version === request) return render(full); }).catch(function (error) { console.warn('Kunne ikke oppdatere faginnhold:', error); });
  }
  window.HaugnesStudioLive = { render: render, refresh: refresh, getCurrent: function () { return current; } };
  window.addEventListener('haugnes:entitlements-changed', refresh);
  window.addEventListener('haugnes:subject-studio-changed', function (event) {
    var detail = event.detail || {};
    if (detail.kind === 'all' || !detail.subject_code || detail.subject_code === subjectCode) refresh();
  });
  window.addEventListener('message', function (event) {
    if (event.origin === window.location.origin && event.data?.type === 'HAUGNES_STUDIO_REFRESH') refresh();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh, { once: true }); else refresh();
})(window, document);
