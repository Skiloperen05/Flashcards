(function (window, document) {
  'use strict';

  if (window.__haugnesSubjectAccessInstalled) return;
  window.__haugnesSubjectAccessInstalled = true;

  var STORAGE_KEY = 'hf_enabled_subjects';
  var DEFAULT_CODES = ['RET14', 'SOL1', 'SAM2', 'SAM3'];
  var FALLBACK_CATALOG = [
    { code: 'RET14', name: 'Skatterett', accent: '#2f62ff', icon: '⚖️' },
    { code: 'SOL1', name: 'Organisasjonsatferd', accent: '#20b97a', icon: '🧠' },
    { code: 'SAM2', name: 'Mikroøkonomi', accent: '#f09828', icon: '📈' },
    { code: 'SAM3', name: 'Makroøkonomi', accent: '#ef4444', icon: '🌍' },
    { code: 'MET2', name: 'Metode', accent: '#7c3aed', icon: 'Σ' },
    { code: 'MAT10', name: 'Matematikk', accent: '#0891b2', icon: '∫' }
  ];

  function code(value) { return String(value || '').toUpperCase().replace(/[\s-]+/g, ''); }
  function readJson(key, fallback) { try { var raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }
  function writeJson(key, value) { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }
  function esc(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function pageName() { return (window.location.pathname.split('/').pop() || 'index.html').toLowerCase(); }

  function catalog() {
    if (window.HaugnesSubjects && typeof window.HaugnesSubjects.getCatalog === 'function') return window.HaugnesSubjects.getCatalog();
    if (window.HaugnesSubjects && typeof window.HaugnesSubjects.getAllOriginal === 'function') return window.HaugnesSubjects.getAllOriginal();
    if (window.HaugnesSubjects && typeof window.HaugnesSubjects.getAll === 'function' && !window.HaugnesSubjects.__subjectAccessPatched) return window.HaugnesSubjects.getAll();
    return JSON.parse(JSON.stringify(FALLBACK_CATALOG));
  }

  function getSelected() {
    var selected = readJson(STORAGE_KEY, null);
    if (!Array.isArray(selected) || !selected.length) selected = DEFAULT_CODES;
    var available = catalog().map(function (s) { return code(s.code || s.id); });
    var value = selected.map(code).filter(function (item, index, arr) { return item && arr.indexOf(item) === index && (!available.length || available.indexOf(item) !== -1); });
    return value.length ? value : DEFAULT_CODES.slice();
  }

  function setSelected(codes) {
    var available = catalog().map(function (s) { return code(s.code || s.id); });
    var value = (codes || []).map(code).filter(function (item, index, arr) { return item && arr.indexOf(item) === index && (!available.length || available.indexOf(item) !== -1); });
    if (!value.length) value = DEFAULT_CODES.slice(0, 1);
    writeJson(STORAGE_KEY, value);
    patchIntegrations();
    renderControls();
    filterVisibleDom();
    window.dispatchEvent(new CustomEvent('haugnes:subject-access-changed', { detail: { subjects: value.slice() } }));
    return value;
  }

  function isEnabled(subject) {
    var c = code(typeof subject === 'string' ? subject : subject && (subject.code || subject.id));
    return getSelected().indexOf(c) !== -1;
  }

  function filterSubjects(subjects) {
    var selected = getSelected();
    return (subjects || []).filter(function (s) { return selected.indexOf(code(s.code || s.id)) !== -1; });
  }

  function patchSubjectMeta() {
    var meta = window.HaugnesSubjects;
    if (!meta || meta.__subjectAccessPatched || typeof meta.getAll !== 'function') return;
    var originalGetAll = meta.getAll.bind(meta);
    var originalFindById = typeof meta.findById === 'function' ? meta.findById.bind(meta) : null;
    meta.getCatalog = function () { return originalGetAll(); };
    meta.getAllOriginal = function () { return originalGetAll(); };
    meta.getAll = function () { return filterSubjects(originalGetAll()); };
    if (originalFindById) meta.findById = function (id) { return originalFindById(id); };
    meta.__subjectAccessPatched = true;
  }

  function patchScheduleApi() {
    var api = window.NHHScheduleAPI;
    if (!api || api.__subjectAccessPatched) return;
    api.__subjectAccessPatched = true;
    var originalGet = typeof api.getSelectedSubjects === 'function' ? api.getSelectedSubjects.bind(api) : null;
    var originalSet = typeof api.setSelectedSubjects === 'function' ? api.setSelectedSubjects.bind(api) : null;
    api.getSelectedSubjects = function (fallback) {
      var allowed = getSelected();
      var selected = originalGet ? originalGet(fallback || allowed) : allowed;
      var filtered = (selected || []).map(code).filter(function (item) { return allowed.indexOf(item) !== -1; });
      if (!filtered.length) filtered = allowed.slice(0, 1);
      if (originalSet) originalSet(filtered);
      return filtered;
    };
    api.setSelectedSubjects = function (codes) {
      var allowed = getSelected();
      var filtered = (codes || []).map(code).filter(function (item) { return allowed.indexOf(item) !== -1; });
      if (!filtered.length) filtered = allowed.slice(0, 1);
      return originalSet ? originalSet(filtered) : filtered;
    };
  }

  function patchIntegrations() {
    patchSubjectMeta();
    patchScheduleApi();
  }

  function injectStyles() {
    if (document.getElementById('hf-subject-access-css')) return;
    var style = document.createElement('style');
    style.id = 'hf-subject-access-css';
    style.textContent = [
      '.hf-access-panel{margin:0 0 18px;padding:16px;border-radius:22px;background:linear-gradient(180deg,rgba(15,43,92,.90),rgba(8,25,56,.92));border:1px solid rgba(255,255,255,.11);box-shadow:0 18px 42px rgba(0,0,0,.22)}',
      '.hf-access-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap;margin-bottom:12px}',
      '.hf-access-head strong{display:block;color:#fff;font-size:16px;letter-spacing:-.03em}.hf-access-head span{display:block;color:#91a5c8;font-size:12px;margin-top:3px;line-height:1.45}',
      '.hf-access-actions{display:flex;gap:8px;flex-wrap:wrap}.hf-access-actions button{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.055);color:#cbd7ef;border-radius:11px;padding:8px 10px;font:850 11px Lora,Georgia,serif;cursor:pointer}',
      '.hf-access-grid{display:flex;gap:9px;flex-wrap:wrap}.hf-access-pill{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.055);color:#b9c7df;border-radius:999px;padding:9px 11px;font:900 12px Lora,Georgia,serif;cursor:pointer;display:inline-flex;gap:7px;align-items:center}',
      '.hf-access-pill.active{background:linear-gradient(135deg,#245cff,#4b7dff);border-color:rgba(126,162,255,.44);color:#fff}.hf-access-dot{width:9px;height:9px;border-radius:50%;background:var(--accent,#2f62ff)}',
      '.hf-subject-hidden-by-access{display:none!important}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function panelHtml() {
    var selected = getSelected();
    var subjects = catalog();
    return '<section class="hf-access-panel" id="hfSubjectAccessPanel"><div class="hf-access-head"><div><strong>Mine fag</strong><span>Velg hvilke fag du vil ha synlig i dashboard, studieplan, eksamensarkiv og andre oversikter.</span></div><div class="hf-access-actions"><button type="button" data-access-all>Velg alle</button><button type="button" data-access-core>Kjernefag</button></div></div><div class="hf-access-grid">' + subjects.map(function (subject) {
      var c = code(subject.code || subject.id);
      return '<button type="button" class="hf-access-pill ' + (selected.indexOf(c) !== -1 ? 'active' : '') + '" data-access-subject="' + esc(c) + '" style="--accent:' + esc(subject.accent || '#2f62ff') + '"><span class="hf-access-dot"></span>' + esc(c) + ' · ' + esc(subject.name || subject.label || '') + '</button>';
    }).join('') + '</div></section>';
  }

  function mountControls() {
    injectStyles();
    var page = pageName();
    if (page !== 'subjects.html' && page !== 'settings.html') return;
    if (document.getElementById('hfSubjectAccessPanel')) return;
    var host = page === 'subjects.html' ? document.querySelector('main.main .toolbar') : document.querySelector('main, .main, body');
    if (!host) return;
    if (page === 'subjects.html') host.insertAdjacentHTML('beforebegin', panelHtml());
    else host.insertAdjacentHTML('afterbegin', panelHtml());
    bindControls();
  }

  function bindControls() {
    var panel = document.getElementById('hfSubjectAccessPanel');
    if (!panel || panel.dataset.bound) return;
    panel.dataset.bound = '1';
    panel.addEventListener('click', function (event) {
      var btn = event.target.closest('button');
      if (!btn) return;
      var current = getSelected();
      if (btn.hasAttribute('data-access-all')) setSelected(catalog().map(function (s) { return s.code || s.id; }));
      else if (btn.hasAttribute('data-access-core')) setSelected(DEFAULT_CODES);
      else if (btn.hasAttribute('data-access-subject')) {
        var c = btn.getAttribute('data-access-subject');
        var next = current.indexOf(c) !== -1 ? current.filter(function (x) { return x !== c; }) : current.concat([c]);
        setSelected(next);
      }
    });
  }

  function renderControls() {
    var panel = document.getElementById('hfSubjectAccessPanel');
    if (!panel) return;
    panel.outerHTML = panelHtml();
    bindControls();
  }

  function refreshSubjectPage() {
    if (pageName() !== 'subjects.html') return;
    try {
      if (window.HaugnesSubjects && typeof window.HaugnesSubjects.getAll === 'function') window.SUBJECTS = window.HaugnesSubjects.getAll();
      if (typeof window.renderSubjects === 'function') window.renderSubjects();
    } catch (e) {}
  }

  function filterVisibleDom() {
    var selected = getSelected();
    document.querySelectorAll('.hf-subject-pill[data-subject]').forEach(function (el) {
      var show = selected.indexOf(code(el.getAttribute('data-subject'))) !== -1;
      el.classList.toggle('hf-subject-hidden-by-access', !show);
    });
  }

  function enhanceCurrentPage() {
    patchIntegrations();
    mountControls();
    filterVisibleDom();
    refreshSubjectPage();
  }

  function boot() {
    patchIntegrations();
    enhanceCurrentPage();
    window.setTimeout(enhanceCurrentPage, 120);
    window.setTimeout(enhanceCurrentPage, 600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.addEventListener('haugnes:subject-access-changed', function () {
    refreshSubjectPage();
    filterVisibleDom();
  });

  window.HaugnesSubjectAccess = {
    storageKey: STORAGE_KEY,
    defaultCodes: DEFAULT_CODES.slice(),
    catalog: catalog,
    getSelected: getSelected,
    setSelected: setSelected,
    isEnabled: isEnabled,
    filterSubjects: filterSubjects,
    enhanceCurrentPage: enhanceCurrentPage,
    patchIntegrations: patchIntegrations
  };
})(window, document);
