(function (window, document) {
  'use strict';

  var SUBJECTS = [
    { code: 'RET14', label: 'Skatterett', color: 'gold' },
    { code: 'SOL1', label: 'Organisasjonsatferd', color: 'green' },
    { code: 'SAM2', label: 'Mikroøkonomi', color: 'gold' },
    { code: 'SAM3', label: 'Makroøkonomi', color: 'green' },
    { code: 'MET2', label: 'Metode', color: '' },
    { code: 'MAT10', label: 'Matematikk', color: '' }
  ];

  var typeLabels = { flashcards: 'Flashcards', assignment: 'Oppgaver', notes: 'Notater', exam: 'Eksamen', lecture: 'Forelesning', nhh: 'NHH', custom: 'Egen' };
  var filter = 'Alle';
  var selectedEventId = null;
  var currentWeekStart = getMonday(new Date());

  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  function api() { return window.NHHScheduleAPI; }
  function readJson(key, fallback) { try { var raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }
  function writeJson(key, value) { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }
  function iso(date) { return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0'); }
  function parseIso(value) { var parts = String(value || '').split('-').map(Number); return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1); }
  function getMonday(date) { var d = new Date(date.getFullYear(), date.getMonth(), date.getDate()); var day = d.getDay() || 7; d.setDate(d.getDate() - day + 1); return d; }
  function addDays(date, days) { var d = new Date(date); d.setDate(d.getDate() + days); return d; }
  function dayName(date) { return ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'][date.getDay()] + ' ' + date.getDate(); }
  function esc(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function uid(prefix) { return prefix + ':' + Date.now().toString(36) + ':' + Math.random().toString(36).slice(2, 8); }
  function subjectsSelected() { return api() ? api().getSelectedSubjects(SUBJECTS.slice(0, 4).map(function (s) { return s.code; })) : SUBJECTS.slice(0, 4).map(function (s) { return s.code; }); }
  function toast(msg) { var el = document.querySelector('.hf-study-toast'); if (!el) { el = document.createElement('div'); el.className = 'hf-study-toast'; document.body.appendChild(el); } el.textContent = msg; el.classList.add('show'); clearTimeout(el._timer); el._timer = setTimeout(function () { el.classList.remove('show'); }, 2500); }

  function injectStyles() {
    if (document.getElementById('hf-studyplan-css')) return;
    var style = document.createElement('style');
    style.id = 'hf-studyplan-css';
    style.textContent = [
      '.hf-study-controls{display:grid;grid-template-columns:1.1fr .9fr;gap:14px;margin:18px 0}',
      '.hf-study-box{background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.10);border-radius:22px;padding:16px}',
      '.hf-study-box h3{margin:0 0 10px;color:#fff;font-size:15px}',
      '.hf-subject-picker{display:flex;flex-wrap:wrap;gap:8px}',
      '.hf-subject-pill{border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.06);color:#becbdf;border-radius:999px;padding:8px 11px;font-weight:900;font-size:12px;cursor:pointer}',
      '.hf-subject-pill.active{background:linear-gradient(135deg,#245cff,#4b7dff);color:#fff;border-color:rgba(255,255,255,.22)}',
      '.hf-api-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}',
      '.hf-api-row button,.hf-study-modal button{border:0;border-radius:12px;padding:10px 12px;font:900 12px Lora,Georgia,serif;cursor:pointer;background:#f3f6ff;color:#10213f}',
      '.hf-api-row button.primary,.hf-study-modal button.primary{background:linear-gradient(135deg,#245cff,#4b7dff);color:#fff}',
      '.hf-api-status{font-size:12px;color:#aebddd;line-height:1.5;margin-top:10px}',
      '.hf-weekbar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap}',
      '.hf-weekbar strong{color:#fff;font-size:16px}',
      '.hf-weekbar div{display:flex;gap:8px;align-items:center}',
      '.hf-weekbar button{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#cbd7ef;border-radius:12px;padding:8px 10px;font-weight:900;cursor:pointer}',
      '.calendar-grid .day{min-height:185px}',
      '.event{position:relative;user-select:none}',
      '.event .hf-event-actions{display:flex;gap:6px;margin-top:7px}',
      '.event .hf-event-actions button{border:0;border-radius:8px;background:rgba(255,255,255,.22);color:inherit;font-weight:900;font-size:10px;padding:4px 7px;cursor:pointer}',
      '.event.nhh{border-left:3px solid #60a5fa}',
      '.event.exam{border-left:3px solid #ef4444}',
      '.event.lecture{border-left:3px solid #7c3aed}',
      '.hf-study-modal-backdrop{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.56);z-index:9998;padding:18px}',
      '.hf-study-modal-backdrop.open{display:flex}',
      '.hf-study-modal{width:min(560px,100%);border-radius:24px;padding:20px;background:#08172f;border:1px solid rgba(255,255,255,.13);box-shadow:0 24px 70px rgba(0,0,0,.45);color:#fff}',
      '.hf-study-modal h3{margin:0 0 12px;font-size:18px}',
      '.hf-study-form{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '.hf-study-form label{display:grid;gap:5px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#91a5c8;font-weight:900}',
      '.hf-study-form label.wide{grid-column:1/-1}',
      '.hf-study-form input,.hf-study-form select,.hf-study-form textarea{border:1px solid rgba(255,255,255,.14);border-radius:12px;background:rgba(255,255,255,.06);color:#fff;padding:11px 12px;font:700 13px Lora,Georgia,serif;outline:none}',
      '.hf-study-form textarea{min-height:80px;resize:vertical}',
      '.hf-study-modal-actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:14px}',
      '.hf-study-toast{position:fixed;right:18px;bottom:18px;z-index:9999;padding:12px 14px;border-radius:14px;background:rgba(7,23,51,.96);border:1px solid rgba(126,162,255,.28);box-shadow:0 18px 48px rgba(0,0,0,.34);color:#f8fbff;font:800 13px/1.45 Lora,Georgia,serif;opacity:0;transform:translateY(10px);transition:.2s;pointer-events:none}',
      '.hf-study-toast.show{opacity:1;transform:translateY(0)}',
      '@media(max-width:900px){.hf-study-controls{grid-template-columns:1fr}.hf-study-form{grid-template-columns:1fr}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function ensureControls() {
    var hero = document.querySelector('.hero-panel');
    if (!hero || document.querySelector('.hf-study-controls')) return;
    var controls = document.createElement('section');
    controls.className = 'hf-study-controls';
    controls.innerHTML = '<div class="hf-study-box"><h3>Velg fag i planen</h3><div class="hf-subject-picker"></div></div><div class="hf-study-box"><h3>NHH-data</h3><div class="hf-api-row"><button class="primary" data-sync-nhh>Hent fra NHH</button><button data-add-event>Legg til økt</button><button data-add-source>Kilde/API</button></div><div class="hf-api-status">Velg fagene du vil følge. Henting forsøker NHH-kilder og lagrer funn lokalt. Hvis NHH blokkerer direkte nettleserhenting, kan du legge til en egen JSON/proxy-kilde.</div></div>';
    hero.insertAdjacentElement('afterend', controls);
    controls.querySelector('[data-sync-nhh]').addEventListener('click', syncNhh);
    controls.querySelector('[data-add-event]').addEventListener('click', function () { openEventModal(); });
    controls.querySelector('[data-add-source]').addEventListener('click', addSourcePrompt);
  }

  function renderSubjectPicker() {
    var holder = document.querySelector('.hf-subject-picker');
    if (!holder) return;
    var selected = subjectsSelected();
    holder.innerHTML = SUBJECTS.map(function (subject) {
      return '<button class="hf-subject-pill ' + (selected.indexOf(subject.code) !== -1 ? 'active' : '') + '" data-subject="' + subject.code + '">' + subject.code + ' · ' + subject.label + '</button>';
    }).join('');
    holder.querySelectorAll('[data-subject]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var code = btn.getAttribute('data-subject');
        var next = subjectsSelected();
        if (next.indexOf(code) !== -1) next = next.filter(function (item) { return item !== code; });
        else next.push(code);
        if (api()) api().setSelectedSubjects(next);
        renderAll();
      });
    });
  }

  function ensureWeekbar() {
    var panel = document.querySelector('.workspace .panel');
    var grid = document.querySelector('.calendar-grid');
    if (!panel || !grid || panel.querySelector('.hf-weekbar')) return;
    var bar = document.createElement('div');
    bar.className = 'hf-weekbar';
    bar.innerHTML = '<strong></strong><div><button data-prev-week>←</button><button data-this-week>Denne uken</button><button data-next-week>→</button><button data-add-week-event>＋ Ny økt</button></div>';
    panel.insertBefore(bar, grid);
    bar.querySelector('[data-prev-week]').addEventListener('click', function () { currentWeekStart = addDays(currentWeekStart, -7); renderAll(); });
    bar.querySelector('[data-next-week]').addEventListener('click', function () { currentWeekStart = addDays(currentWeekStart, 7); renderAll(); });
    bar.querySelector('[data-this-week]').addEventListener('click', function () { currentWeekStart = getMonday(new Date()); renderAll(); });
    bar.querySelector('[data-add-week-event]').addEventListener('click', function () { openEventModal({ date: iso(currentWeekStart) }); });
  }

  function getDemoEvents() {
    var monday = currentWeekStart;
    return [
      { id: 'demo-ret14', subjectCode: 'RET14', title: 'RET14 · Fradragsrett', type: 'flashcards', date: iso(monday), time: '09:00', durationMin: 20, source: 'demo' },
      { id: 'demo-a', subjectCode: 'SAM3', title: 'A-besvarelse V25', type: 'assignment', date: iso(monday), time: '13:00', durationMin: 25, source: 'demo' },
      { id: 'demo-sol1', subjectCode: 'SOL1', title: 'SOL1 · Flashcards', type: 'flashcards', date: iso(addDays(monday, 1)), time: '10:00', durationMin: 25, source: 'demo' },
      { id: 'demo-sam2', subjectCode: 'SAM2', title: 'SAM2 · Markedssvikt', type: 'assignment', date: iso(addDays(monday, 2)), time: '12:00', durationMin: 30, source: 'demo' },
      { id: 'demo-sam3', subjectCode: 'SAM3', title: 'SAM3 · AS-AD', type: 'flashcards', date: iso(addDays(monday, 4)), time: '10:00', durationMin: 25, source: 'demo' }
    ];
  }

  function allEvents() {
    var selected = subjectsSelected();
    var items = api() ? api().getAllEvents(selected) : [];
    if (!items.length) items = getDemoEvents().filter(function (event) { return selected.indexOf(event.subjectCode) !== -1; });
    if (filter !== 'Alle') {
      var needle = filter.toLowerCase();
      items = items.filter(function (event) {
        return String(typeLabels[event.type] || event.type || '').toLowerCase().indexOf(needle) !== -1 || String(event.type || '').toLowerCase().indexOf(needle) !== -1;
      });
    }
    return items;
  }

  function classFor(event) {
    if (event.type === 'exam') return 'exam';
    if (event.type === 'lecture') return 'lecture';
    if (event.source === 'nhh') return 'nhh';
    var subject = SUBJECTS.find(function (s) { return s.code === event.subjectCode; });
    return subject && subject.color || '';
  }

  function renderCalendar() {
    ensureWeekbar();
    var grid = document.querySelector('.calendar-grid');
    var title = document.querySelector('.hf-weekbar strong');
    var searchMini = document.querySelector('.search-mini');
    if (!grid) return;
    var end = addDays(currentWeekStart, 6);
    var titleText = 'Uke ' + getWeekNumber(currentWeekStart) + ' · ' + currentWeekStart.getDate() + '–' + end.getDate() + ' ' + end.toLocaleDateString('no-NO', { month: 'long' });
    if (title) title.textContent = titleText;
    if (searchMini) searchMini.textContent = titleText;
    var events = allEvents();
    var html = '';
    for (var i = 0; i < 7; i++) {
      var date = addDays(currentWeekStart, i);
      var dateIso = iso(date);
      var dayEvents = events.filter(function (event) { return event.date === dateIso; });
      html += '<div class="day" data-date="' + dateIso + '"><strong>' + dayName(date) + '</strong>';
      if (!dayEvents.length) html += '<div class="event" data-new-date="' + dateIso + '">＋ Legg til</div>';
      dayEvents.forEach(function (event) {
        html += '<div class="event ' + classFor(event) + '" data-event-id="' + esc(event.id) + '"><b>' + esc(event.subjectCode || 'Plan') + '</b> · ' + esc(event.title) + '<br>' + esc(event.time || '') + ' · ' + (event.durationMin || 30) + ' min' + (event.source === 'nhh' ? '<br><span>NHH</span>' : '') + '<div class="hf-event-actions"><button data-edit-event="' + esc(event.id) + '">Endre</button><button data-delete-event="' + esc(event.id) + '">Fjern</button></div></div>';
      });
      html += '</div>';
    }
    grid.innerHTML = html;
    grid.querySelectorAll('[data-new-date]').forEach(function (el) { el.addEventListener('click', function () { openEventModal({ date: el.getAttribute('data-new-date') }); }); });
    grid.querySelectorAll('[data-edit-event]').forEach(function (el) { el.addEventListener('click', function (e) { e.stopPropagation(); var event = allEvents().find(function (item) { return item.id === el.getAttribute('data-edit-event'); }); openEventModal(event); }); });
    grid.querySelectorAll('[data-delete-event]').forEach(function (el) { el.addEventListener('click', function (e) { e.stopPropagation(); removeEvent(el.getAttribute('data-delete-event')); }); });
    updateHeroStats(events);
    renderRecommendations(events);
  }

  function getWeekNumber(d) {
    var date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    var yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  }

  function updateHeroStats(events) {
    var start = iso(currentWeekStart), end = iso(addDays(currentWeekStart, 6));
    var weekEvents = events.filter(function (e) { return e.date >= start && e.date <= end; });
    var planned = weekEvents.reduce(function (sum, e) { return sum + (e.durationMin || 30); }, 0);
    var done = readJson('hf_study_done', {});
    var completed = weekEvents.filter(function (e) { return done[e.id] || done[e.title]; }).reduce(function (sum, e) { return sum + (e.durationMin || 30); }, 0);
    var stats = document.querySelectorAll('.hero-stat b');
    if (stats[0]) stats[0].textContent = formatDuration(planned);
    if (stats[1]) stats[1].textContent = formatDuration(completed);
    if (stats[2]) stats[2].textContent = planned ? Math.round(completed / planned * 100) + '%' : '0%';
    var mini = document.querySelector('.mini-number');
    if (mini) mini.innerHTML = formatDuration(planned) + ' <span>planlagt</span>';
  }

  function formatDuration(mins) {
    var h = Math.floor(mins / 60), m = mins % 60;
    return h ? h + 't ' + (m ? m + 'm' : '') : m + 'm';
  }

  function renderRecommendations(events) {
    var list = document.querySelector('.workspace aside .list');
    if (!list) return;
    var upcoming = events.filter(function (e) { return e.date >= iso(new Date()); }).slice(0, 5);
    if (!upcoming.length) upcoming = events.slice(0, 5);
    list.innerHTML = upcoming.map(function (event, index) {
      return '<div class="list-item"><span class="rank">' + (index + 1) + '</span><div><strong>' + esc(event.title) + '</strong><span>' + esc(event.subjectCode || 'Plan') + ' · ' + esc(typeLabels[event.type] || event.type || 'økt') + '</span></div><span class="tag">' + (event.durationMin || 30) + 'm</span></div>';
    }).join('') || '<div class="list-item"><div><strong>Ingen økter</strong><span>Legg til en økt for å starte planen.</span></div></div>';
  }

  function renderFilters() {
    document.querySelectorAll('.chip-row .chip').forEach(function (chip) {
      chip.classList.toggle('active', chip.textContent.trim() === filter);
      if (!chip.dataset.bound) {
        chip.dataset.bound = '1';
        chip.addEventListener('click', function () { filter = chip.textContent.trim(); renderAll(); });
      }
    });
  }

  function ensureModal() {
    var modal = document.querySelector('.hf-study-modal-backdrop');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'hf-study-modal-backdrop';
    modal.innerHTML = '<div class="hf-study-modal"><h3>Planlegg økt</h3><form class="hf-study-form"><label>Tittel<input name="title" required></label><label>Fag<select name="subjectCode"></select></label><label>Type<select name="type"><option value="flashcards">Flashcards</option><option value="assignment">Oppgaver</option><option value="notes">Notater</option><option value="lecture">Forelesning</option><option value="exam">Eksamen</option><option value="custom">Egen</option></select></label><label>Dato<input name="date" type="date" required></label><label>Tid<input name="time" type="time" value="10:00"></label><label>Varighet<input name="durationMin" type="number" min="5" step="5" value="30"></label><label class="wide">Notat<textarea name="note" placeholder="Hva skal gjøres?"></textarea></label></form><div class="hf-study-modal-actions"><button data-cancel>Avbryt</button><button data-delete style="display:none">Slett</button><button class="primary" data-save>Lagre</button></div></div>';
    document.body.appendChild(modal);
    modal.querySelector('[data-cancel]').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    modal.querySelector('[data-save]').addEventListener('click', saveModalEvent);
    modal.querySelector('[data-delete]').addEventListener('click', function () { if (selectedEventId) removeEvent(selectedEventId); closeModal(); });
    var select = modal.querySelector('[name="subjectCode"]');
    select.innerHTML = SUBJECTS.map(function (s) { return '<option value="' + s.code + '">' + s.code + ' · ' + s.label + '</option>'; }).join('');
    return modal;
  }

  function openEventModal(event) {
    var modal = ensureModal();
    selectedEventId = event && event.id || null;
    var form = modal.querySelector('form');
    var defaults = Object.assign({ title: '', subjectCode: subjectsSelected()[0] || 'RET14', type: 'flashcards', date: iso(new Date()), time: '10:00', durationMin: 30, note: '' }, event || {});
    Object.keys(defaults).forEach(function (key) { if (form.elements[key]) form.elements[key].value = defaults[key]; });
    modal.querySelector('[data-delete]').style.display = selectedEventId ? '' : 'none';
    modal.classList.add('open');
    setTimeout(function () { form.elements.title.focus(); }, 30);
  }

  function closeModal() { var modal = document.querySelector('.hf-study-modal-backdrop'); if (modal) modal.classList.remove('open'); selectedEventId = null; }

  function saveModalEvent() {
    var modal = ensureModal();
    var form = modal.querySelector('form');
    if (!form.reportValidity()) return;
    var event = {
      id: selectedEventId || uid('custom'),
      source: 'custom',
      title: form.elements.title.value.trim(),
      subjectCode: form.elements.subjectCode.value,
      type: form.elements.type.value,
      date: form.elements.date.value,
      time: form.elements.time.value,
      durationMin: parseInt(form.elements.durationMin.value || '30', 10),
      note: form.elements.note.value.trim()
    };
    if (api()) api().upsertCustomEvent(event);
    closeModal();
    toast('Økten er lagret.');
    renderAll();
  }

  function removeEvent(id) {
    if (!id) return;
    if (!window.confirm('Fjerne denne økten fra planen?')) return;
    if (api()) api().deleteEvent(id);
    toast('Økten er fjernet.');
    renderAll();
  }

  function addSourcePrompt() {
    var url = window.prompt('Legg inn URL for JSON/HTML-kilde. Bruk {code} der fagkode skal settes inn.\nEksempel: https://din-proxy.no/nhh?subject={code}');
    if (!url) return;
    var label = window.prompt('Navn på kilden?', 'Egen NHH-kilde') || 'Egen NHH-kilde';
    var kind = /json/i.test(url) ? 'json' : 'html';
    var sources = api().getSourceConfig().filter(function (s) { return s.id.indexOf('custom:') === 0; });
    sources.push({ id: 'custom:' + Date.now(), label: label, kind: kind, url: url });
    api().setSourceConfig(sources);
    toast('Kilden er lagt til.');
  }

  function syncNhh() {
    if (!api()) return;
    var status = document.querySelector('.hf-api-status');
    var codes = subjectsSelected();
    if (!codes.length) { toast('Velg minst ett fag først.'); return; }
    if (status) status.textContent = 'Henter NHH-data for ' + codes.join(', ') + ' ...';
    api().sync(codes).then(function (result) {
      var found = result.events.length;
      var errors = result.results.reduce(function (sum, item) { return sum + (item.errors || []).length; }, 0);
      if (status) status.textContent = found ? 'Fant ' + found + ' hendelser. Lagret lokalt for valgte fag.' : 'Ingen hendelser funnet automatisk. NHH kan blokkere direkte henting; legg eventuelt inn egen JSON/proxy-kilde.' + (errors ? ' (' + errors + ' kilder feilet)' : '');
      renderAll();
    }).catch(function (err) {
      if (status) status.textContent = 'Kunne ikke hente fra NHH: ' + (err && err.message || err);
    });
  }

  function wireTopAddButton() {
    var add = document.querySelector('.top-actions .icon-btn');
    if (add && !add.dataset.hfStudyBound) {
      add.dataset.hfStudyBound = '1';
      add.addEventListener('click', function () { openEventModal(); });
    }
  }

  function renderAll() {
    renderSubjectPicker();
    renderFilters();
    renderCalendar();
  }

  function install() {
    if (!/\/user\/studieplan\.html$/.test(window.location.pathname)) return;
    if (!window.NHHScheduleAPI) { setTimeout(install, 80); return; }
    injectStyles();
    ensureControls();
    ensureWeekbar();
    wireTopAddButton();
    renderAll();
    window.HaugnesStudyplan = { render: renderAll, openEventModal: openEventModal, syncNhh: syncNhh };
  }

  ready(install);
})(window, document);
