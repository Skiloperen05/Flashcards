(function (window, document) {
  'use strict';

  if (window.__haugnesSubjectAccessInstalled) return;
  window.__haugnesSubjectAccessInstalled = true;

  var STORAGE_KEY = 'hf_enabled_subjects';
  var USER_KEY = 'hf_active_subjects_v1:';
  var OWNER_KEY = 'hf_enabled_subjects_owner';
  var syncing = null;
  var syncedUser = '';
  var syncStatus = '';
  var EXPLICIT_EMPTY_KEY = 'hf_enabled_subjects_explicit_empty';
  var DEFAULT_CODES = ['RET14', 'SOL1', 'SAM2', 'SAM3', 'MET2', 'MET3', 'MAT10', 'SAM1A', 'MET1', 'KOM1', 'RET1A', 'BED1'];
  var FALLBACK_CATALOG = [
    { code: 'MET3', name: 'Databehandling for økonomer', accent: '#15803d', icon: 'ƒ', emblem: '../assets/emblems/MET3.png?v=20261022-2' },
    { code: 'RET14', name: 'Skatterett', accent: '#2f62ff', icon: '⚖️', emblem: '../assets/emblems/RET14.png?v=20261022-2' },
    { code: 'SOL1', name: 'Organisasjonsatferd', accent: '#20b97a', icon: '🧠', emblem: '../assets/emblems/SOL1.png?v=20261022-2' },
    { code: 'SAM2', name: 'Mikroøkonomi', accent: '#f09828', icon: '📈', emblem: '../assets/emblems/SAM2.png?v=20261022-2' },
    { code: 'SAM3', name: 'Makroøkonomi', accent: '#ef4444', icon: '🌍', emblem: '../assets/emblems/SAM3.png?v=20261022-2' },
    { code: 'MET2', name: 'Metode', accent: '#7c3aed', icon: 'Σ', emblem: '../assets/emblems/MET2.png?v=20261022-2' },
    { code: 'MAT10', name: 'Matematikk', accent: '#0891b2', icon: '∫', emblem: '../assets/emblems/MAT10.png?v=20261022-2' },
    { code: 'SAM1A', name: 'Etikk, økonomi og bærekraft', accent: '#f09828', icon: '↗', emblem: '../assets/emblems/SAM1A.png?v=20261022-2' },
    { code: 'MET1', name: 'Matematikk for økonomer', accent: '#06b6d4', icon: '%', emblem: '../assets/emblems/MET1.png?v=20261022-2' },
    { code: 'KOM1', name: 'Kommunikasjon', accent: '#e8bc68', icon: '✎', emblem: '../assets/emblems/KOM1.png?v=20261022-2' },
    { code: 'RET1A', name: 'Juridiske emner', accent: '#3b82f6', icon: '§', emblem: '../assets/emblems/RET1A.png?v=20261022-2' },
    { code: 'BED1', name: 'Bedriftsøkonomi', accent: '#20b97a', icon: '◆', emblem: '../assets/emblems/BED1.png?v=20261022-2' }
  ];
  var COURSE_CODES = FALLBACK_CATALOG.map(function (s) { return s.code; });

  function code(value) { return String(value || '').toUpperCase().replace(/[\s-]+/g, ''); }
  function readJson(key, fallback) { try { var raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }
  function writeJson(key, value) { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }
  function esc(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function pageName() { return (window.location.pathname.split('/').pop() || 'index.html').toLowerCase(); }

  function rawCatalog() {
    if (window.HaugnesSubjects && typeof window.HaugnesSubjects.getCatalog === 'function') return window.HaugnesSubjects.getCatalog();
    if (window.HaugnesSubjects && typeof window.HaugnesSubjects.getAllOriginal === 'function') return window.HaugnesSubjects.getAllOriginal();
    if (window.HaugnesSubjects && typeof window.HaugnesSubjects.getAll === 'function' && !window.HaugnesSubjects.__subjectAccessPatched) return window.HaugnesSubjects.getAll();
    return JSON.parse(JSON.stringify(FALLBACK_CATALOG));
  }

  function catalog() { return rawCatalog(); }

  function entitledSet() {
    if (window.HaugnesEntitlements && typeof window.HaugnesEntitlements.isLoaded === 'function' && window.HaugnesEntitlements.isLoaded()) {
      // Admins (not in preview mode) and friends bypass the paywall entirely.
      if (window.HaugnesEntitlements.hasBypass && window.HaugnesEntitlements.hasBypass()) return null;
      return window.HaugnesEntitlements.getCodes();
    }
    return null;
  }

  function sessionUser() {
    var session = window.AuthGuard && window.AuthGuard.getSession && window.AuthGuard.getSession();
    if (!session || !session.user) return '';
    return session.user.id || (session.user.email === 'dev@student.local' ? 'local-development' : '');
  }

  function getAvailable() {
    var owned = entitledSet();
    return catalog().filter(function (subject) {
      return owned === null || owned.indexOf(code(subject.code || subject.id)) !== -1;
    });
  }

  function selectionRecord() {
    var user = sessionUser();
    return user ? readJson(USER_KEY + user, null) : null;
  }

  function getSelected() {
    var record = selectionRecord();
    var selected = record && Array.isArray(record.codes) ? record.codes.map(code) : null;
    return getAvailable().map(function (subject) { return code(subject.code || subject.id); })
      .filter(function (c) { return selected === null || selected.indexOf(c) !== -1; });
  }

  function notifySelection() {
    patchIntegrations();
    renderControls();
    refreshSubjectPage();
    filterVisibleDom();
    window.dispatchEvent(new CustomEvent('haugnes:subject-access-changed', { detail: { subjects: getSelected() } }));
  }

  function setSelected(codes) {
    var user = sessionUser();
    if (!user) return getSelected();
    var available = getAvailable().map(function (s) { return code(s.code || s.id); });
    var value = (codes || []).map(code).filter(function (item, index, arr) {
      return item && arr.indexOf(item) === index && available.indexOf(item) !== -1;
    });
    var previous = selectionRecord();
    var stamp = Math.max(Date.now(), Number(previous && previous.updatedAt || 0) + 1);
    writeJson(USER_KEY + user, { codes: value, updatedAt: stamp, dirty: true });
    syncStatus = user === 'local-development' ? 'Lagret i denne nettleseren.' : 'Lagrer fagvalget …';
    notifySelection();
    syncRemote();
    return value;
  }

  // The old browser-wide choice is claimed once, so another account cannot inherit it.
  function migrateSelection(user) {
    if (selectionRecord()) return;
    var owner = readJson(OWNER_KEY, '');
    if (owner && owner !== user) return;
    var legacy = readJson(STORAGE_KEY, null);
    if (Array.isArray(legacy)) {
      writeJson(USER_KEY + user, {
        codes: readJson(EXPLICIT_EMPTY_KEY, false) ? [] : legacy.map(code),
        updatedAt: 1, dirty: true
      });
    }
    writeJson(OWNER_KEY, user);
  }

  function syncRemote(force) {
    var user = sessionUser();
    if (!user) return Promise.resolve();
    migrateSelection(user);
    if (user === 'local-development') return Promise.resolve();
    if (syncing) return syncing.then(function () {
      return syncedUser !== user || (selectionRecord() || {}).dirty ? syncRemote(force) : undefined;
    });
    if (!force && syncedUser === user && !(selectionRecord() || {}).dirty) return Promise.resolve();
    var client;
    try { client = window.AuthGuard.getClient(); } catch (e) { return Promise.resolve(); }
    syncing = Promise.resolve().then(function () {
      return client.from('user_custom_data').select('data').eq('user_id', user).maybeSingle();
    }).then(function (result) {
      if (result.error) throw result.error;
      if (sessionUser() !== user) return;
      var data = result.data && result.data.data || {};
      var remote = data.activeSubjects;
      var local = selectionRecord();
      if (remote && Array.isArray(remote.codes) && (!local || Number(remote.updatedAt) > Number(local.updatedAt))) {
        writeJson(USER_KEY + user, { codes: remote.codes.map(code), updatedAt: Number(remote.updatedAt) || 0, dirty: false });
        syncStatus = 'Fagvalget er lagret på kontoen din.';
        notifySelection();
        return;
      }
      if (!local || !local.dirty) return;
      var snapshot = { codes: local.codes.slice(), updatedAt: local.updatedAt };
      data.activeSubjects = snapshot;
      return client.from('user_custom_data').upsert({
        user_id: user, data: data, updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' }).then(function (saved) {
        if (saved.error) throw saved.error;
        if (sessionUser() !== user) return;
        var current = selectionRecord();
        if (current && current.updatedAt === snapshot.updatedAt) {
          current.dirty = false;
          writeJson(USER_KEY + user, current);
        }
        syncStatus = 'Fagvalget er lagret på kontoen din.';
      });
    }).then(function () {
      if (sessionUser() === user) syncedUser = user;
    }).catch(function () {
      if (sessionUser() === user) syncStatus = 'Kun lagret i denne nettleseren foreløpig. Synkronisering prøves igjen når du er på nett.';
    }).then(function () {
      syncing = null;
      renderControls();
    });
    return syncing;
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
    var sourceGetAll = typeof meta.getCatalog === 'function' ? meta.getCatalog.bind(meta) : meta.getAll.bind(meta);
    var sourceFindById = typeof meta.findById === 'function' ? meta.findById.bind(meta) : null;
    meta.getCatalog = function () { return JSON.parse(JSON.stringify(sourceGetAll())); };
    meta.getAllOriginal = meta.getCatalog;
    meta.getAll = function () { return filterSubjects(sourceGetAll()); };
    if (sourceFindById) meta.findById = function (id) { return sourceFindById(id); };
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
      if (originalSet) originalSet(filtered);
      return filtered;
    };
    api.setSelectedSubjects = function (codes) {
      var allowed = getSelected();
      var filtered = (codes || []).map(code).filter(function (item) { return allowed.indexOf(item) !== -1; });
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
      '.hf-access-shop{display:inline-flex;align-items:center;justify-content:center;min-height:38px;margin-top:12px;padding:0 13px;border-radius:12px;background:linear-gradient(135deg,#245cff,#4b7dff);color:#fff;font:900 12px Lora,Georgia,serif;box-shadow:0 12px 28px rgba(47,98,255,.28)}',
      '.hf-subject-hidden-by-access{display:none!important}',
      '.hf-access-panel summary{cursor:pointer;color:#d8e5ff;font-weight:850;min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:12px;list-style:none}.hf-access-panel summary::-webkit-details-marker{display:none}.hf-access-panel summary::after{content:"+";font-size:24px}.hf-access-panel[open] summary::after{content:"−"}.hf-access-panel[open] summary{margin-bottom:14px}.hf-access-panel summary small{font-size:12px;color:#aebddd}.hf-access-pill{min-height:44px;white-space:normal;text-align:left;border-radius:13px}.hf-access-pill:focus-visible,.hf-access-actions button:focus-visible,.hf-access-panel summary:focus-visible{outline:3px solid #a8c4ff;outline-offset:3px}.hf-access-sync{font-size:12px;line-height:1.5;color:#aebddd;margin:12px 0 0}.hf-access-check{width:18px;flex-shrink:0}.hf-access-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))}',
      '.hf-access-empty{padding:16px;border-radius:18px;background:rgba(255,255,255,.035);border:1px dashed rgba(126,162,255,.25);color:#aebddd;font:850 13px/1.5 Lora,Georgia,serif;margin-top:12px}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function panelHtml(open) {
    var selected = getSelected();
    var subjects = getAvailable();
    var summary = '<summary><span>Velg fag</span><small>' + selected.length + ' av ' + subjects.length + ' aktive</small></summary>';
    var content = !subjects.length
      ? '<p class="hf-access-sync">Du har ingen fag tilgjengelig ennå. <a href="butikk.html">Finn fag i Butikk →</a></p>'
      : '<div class="hf-access-head"><div><strong>Hvilke fag tar du nå?</strong><span>Aktive fag vises på Hjem og i studieoversiktene. Du beholder tilgang og progresjon i alle fag. Finn dem alltid under Mine fag.</span></div><div class="hf-access-actions"><button type="button" data-access-all>Velg alle</button><button type="button" data-access-none>Fjern alle</button></div></div><div class="hf-access-grid">' + subjects.map(function (subject) {
        var c = code(subject.code || subject.id);
        var active = selected.indexOf(c) !== -1;
        return '<button type="button" class="hf-access-pill ' + (active ? 'active' : '') + '" aria-pressed="' + active + '" data-access-subject="' + esc(c) + '" style="--accent:' + esc(subject.accent || '#2f62ff') + '"><span class="hf-access-check" aria-hidden="true">' + (active ? '✓' : '○') + '</span><span>' + esc(c) + ' · ' + esc(subject.name || subject.label || '') + '</span></button>';
      }).join('') + '</div>';
    return '<details class="hf-access-panel" id="hfSubjectAccessPanel"' + (open ? ' open' : '') + '>' + summary + content
      + '<p class="hf-access-sync" role="status">' + esc(syncStatus || 'Velg fagene du vil følge dette semesteret. Endringer lagres automatisk.') + '</p></details>';
  }

  function mountControls() {
    injectStyles();
    var page = pageName();
    if (!/\/user\//.test(window.location.pathname) || page !== 'subjects.html') return;
    if (document.getElementById('hfSubjectAccessPanel')) return;
    var host = document.querySelector('main.main .toolbar');
    if (!host) return;
    host.insertAdjacentHTML('beforebegin', panelHtml(true));
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
      else if (btn.hasAttribute('data-access-none')) setSelected([]);
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
    var focus = panel.contains(document.activeElement) ? document.activeElement : null;
    var focusCode = focus && focus.getAttribute('data-access-subject');
    var focusAction = focus && (focus.hasAttribute('data-access-all') ? '[data-access-all]' : focus.hasAttribute('data-access-none') ? '[data-access-none]' : 'summary');
    panel.outerHTML = panelHtml(panel.open);
    bindControls();
    if (focus) {
      var replacement = focusCode ? Array.from(document.querySelectorAll('#hfSubjectAccessPanel [data-access-subject]')).find(function (button) { return button.getAttribute('data-access-subject') === focusCode; }) : document.querySelector('#hfSubjectAccessPanel ' + focusAction);
      if (replacement) replacement.focus({ preventScroll: true });
    }
  }

  function refreshSubjectPage() {
    if (pageName() !== 'subjects.html') return;
    try {
      if (window.HaugnesSubjects && typeof window.HaugnesSubjects.getAll === 'function') window.SUBJECTS = getAvailable();
      if (typeof window.renderSubjects === 'function') window.renderSubjects();
    } catch (e) {}
  }

  function detectSubjectFromElement(el) {
    if (!el) return '';
    var attrs = ['data-subject', 'data-course', 'data-fag', 'data-code'];
    for (var i = 0; i < attrs.length; i++) {
      var v = el.getAttribute && el.getAttribute(attrs[i]);
      if (v) return code(v);
    }
    var explicit = el.querySelector && el.querySelector('.subject-code,.course-code,.badge-stack .badge:last-child,.kicker');
    if (explicit) {
      var ex = code(explicit.textContent);
      if (COURSE_CODES.indexOf(ex) !== -1) return ex;
    }
    var text = String(el.textContent || '').toUpperCase();
    for (var j = 0; j < COURSE_CODES.length; j++) {
      var compact = COURSE_CODES[j];
      var spaced = compact.replace(/([A-ZÆØÅ]+)(\d+)/, '$1\\s*-?\\s*$2');
      var re = new RegExp('(^|[^A-ZÆØÅ0-9])(' + compact + '|' + spaced + ')([^A-ZÆØÅ0-9]|$)', 'i');
      if (re.test(text)) return compact;
    }
    return '';
  }

  function hideBySubject(el, selected) {
    if (pageName() === 'subjects.html' && el && el.closest && el.closest('#subjectsGrid')) return;
    if (!el || el.id === 'hfSubjectAccessPanel' || el.closest && el.closest('#hfSubjectAccessPanel')) return;
    var c = detectSubjectFromElement(el);
    if (!c) return;
    el.classList.toggle('hf-subject-hidden-by-access', selected.indexOf(c) === -1);
  }

  function filterSelectOptions(selected) {
    document.querySelectorAll('select option').forEach(function (option) {
      var c = detectSubjectFromElement(option);
      if (!c) return;
      option.disabled = selected.indexOf(c) === -1;
      option.hidden = selected.indexOf(c) === -1;
    });
  }

  function showEmptyHintIfNeeded(selector, hostSelector, text) {
    var host = document.querySelector(hostSelector);
    if (!host) return;
    var visible = Array.prototype.some.call(document.querySelectorAll(selector), function (el) { return !el.classList.contains('hf-subject-hidden-by-access'); });
    var existing = host.querySelector('.hf-access-empty');
    if (visible && existing) existing.remove();
    if (!visible && !existing) host.insertAdjacentHTML('beforeend', '<div class="hf-access-empty">' + esc(text) + '</div>');
  }

  function filterVisibleDom() {
    if (pageName() === 'a-besvarelser.html') return;
    injectStyles();
    var selected = getSelected();
    [
      '.hf-subject-pill[data-subject]',
      '.subject-card',
      '.model-card',
      '.answer-card',
      '.note-tab',
      '.popular-item',
      '.focus-item',
      '.subject-row',
      '.event',
      '.list-item',
      '.course-card',
      '[data-course]',
      '[data-fag]'
    ].forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (el) { hideBySubject(el, selected); });
    });
    filterSelectOptions(selected);
    if (pageName() === 'oppgavebank.html') showEmptyHintIfNeeded('.model-card', '.workspace > section, main, body', 'Ingen oppgaver matcher de valgte fagene dine ennå. Endre fagvalg på Mine fag-siden.');
    if (pageName() === 'notater.html') showEmptyHintIfNeeded('.note-tab', '.note-list', 'Ingen notater matcher de valgte fagene dine ennå.');
  }

  function enhanceCurrentPage() {
    patchIntegrations();
    mountControls();
    renderControls();
    filterVisibleDom();
    refreshSubjectPage();
  }

  function boot() {
    patchIntegrations();
    enhanceCurrentPage();
    syncRemote().then(notifySelection);
    window.setTimeout(enhanceCurrentPage, 120);
    window.setTimeout(enhanceCurrentPage, 600);
    window.setTimeout(filterVisibleDom, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.addEventListener('haugnes:subject-access-changed', function () {
    refreshSubjectPage();
    filterVisibleDom();
  });
  window.addEventListener('haugnes:entitlements-changed', function () {
    enhanceCurrentPage();
    syncRemote().then(notifySelection);
  });
  window.addEventListener('online', function () { syncRemote(true); });
  window.addEventListener('focus', function () { syncRemote(true); });
  window.addEventListener('storage', function (event) {
    if (event.key === USER_KEY + sessionUser()) notifySelection();
  });

  window.HaugnesSubjectAccess = {
    storageKey: STORAGE_KEY,
    defaultCodes: DEFAULT_CODES.slice(),
    catalog: catalog,
    getAvailable: getAvailable,
    sync: syncRemote,
    getSelected: getSelected,
    setSelected: setSelected,
    isEnabled: isEnabled,
    filterSubjects: filterSubjects,
    filterVisibleDom: filterVisibleDom,
    enhanceCurrentPage: enhanceCurrentPage,
    patchIntegrations: patchIntegrations
  };
})(window, document);
