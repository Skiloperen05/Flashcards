(function (window, document) {
  'use strict';

  var STORAGE_KEY = 'hf_studyplan_state_v3';
  var state = loadState();
  var currentWeekStart = getMonday(new Date());
  var activeFilter = 'all';
  var remoteLoaded = false;
  var remoteSaving = false;
  var remoteDirty = false;
  var remoteTimer = null;
  var selectedCustomId = null;
  var toastTimer = null;
  var fallbackSubjects = [
    { code: 'RET14', name: 'Skatterett', accent: '#2f62ff' },
    { code: 'SOL1', name: 'Organisasjonsatferd', accent: '#20b97a' },
    { code: 'SAM2', name: 'Mikroøkonomi', accent: '#f09828' },
    { code: 'SAM3', name: 'Makroøkonomi', accent: '#ef4444' },
    { code: 'MET2', name: 'Metode', accent: '#7c3aed' },
    { code: 'MAT10', name: 'Matematikk', accent: '#0891b2' }
  ];

  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  function api() { return window.NHHScheduleAPI || null; }
  function upper(value) { return String(value || '').toUpperCase().replace(/[\s-]+/g, ''); }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]; }); }
  function readJson(key, fallback) { try { var raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (_error) { return fallback; } }
  function writeJson(key, value) { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (_error) {} }
  function iso(date) { return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0'); }
  function getMonday(date) { var d = new Date(date.getFullYear(), date.getMonth(), date.getDate()); var weekday = d.getDay() || 7; d.setDate(d.getDate() - weekday + 1); return d; }
  function addDays(date, count) { var result = new Date(date); result.setDate(result.getDate() + count); return result; }
  function uid() { return 'plan:' + Date.now().toString(36) + ':' + Math.random().toString(36).slice(2, 8); }
  function weekNumber(date) { var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())); var day = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - day); var start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)); return Math.ceil((((d - start) / 86400000) + 1) / 7); }
  function formatDay(date) { return ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'][date.getDay()] + ' ' + date.getDate(); }
  function formatWeek(start) { var end = addDays(start, 6); return 'Uke ' + weekNumber(start) + ' · ' + start.getDate() + '.–' + end.getDate() + '. ' + end.toLocaleDateString('nb-NO', { month: 'long' }); }
  function formatDuration(minutes) { minutes = Number(minutes) || 0; var hours = Math.floor(minutes / 60), rest = minutes % 60; return hours ? hours + 't' + (rest ? ' ' + rest + 'm' : '') : rest + 'm'; }

  function defaultState() { return { version: 3, selectedCourses: [], groups: {}, customEvents: [], hiddenEventIds: [], updatedAt: new Date(0).toISOString() }; }
  function normalizeState(raw) {
    var base = defaultState();
    var next = raw && typeof raw === 'object' ? raw : {};
    base.selectedCourses = Array.isArray(next.selectedCourses) ? next.selectedCourses.map(upper).filter(Boolean) : [];
    base.groups = next.groups && typeof next.groups === 'object' ? next.groups : {};
    base.customEvents = Array.isArray(next.customEvents) ? next.customEvents.filter(function (event) { return event && event.source === 'custom' && event.type === 'study' && event.date && event.title; }) : [];
    base.hiddenEventIds = Array.isArray(next.hiddenEventIds) ? next.hiddenEventIds : [];
    base.updatedAt = typeof next.updatedAt === 'string' ? next.updatedAt : base.updatedAt;
    return base;
  }
  function loadState() { return normalizeState(readJson(STORAGE_KEY, null)); }
  function saveLocal() { state.updatedAt = new Date().toISOString(); writeJson(STORAGE_KEY, state); }
  function markChanged() { saveLocal(); scheduleRemoteSave(); }

  function subjectCatalog() {
    var catalog = window.HaugnesSubjects && typeof window.HaugnesSubjects.getAll === 'function' ? window.HaugnesSubjects.getAll() : fallbackSubjects;
    return catalog.filter(function (subject) { return subject.status !== 'build'; }).map(function (subject, index) {
      return { code: upper(subject.code), name: subject.name || subject.label || subject.code, accent: subject.accent || fallbackSubjects[index % fallbackSubjects.length].accent };
    });
  }
  function ensureSelectedCourses() {
    var available = subjectCatalog().map(function (subject) { return subject.code; });
    var chosen = state.selectedCourses.filter(function (code) { return available.indexOf(code) !== -1; });
    if (!chosen.length && available.length) chosen = available.slice();
    if (chosen.join(',') !== state.selectedCourses.join(',')) { state.selectedCourses = chosen; saveLocal(); }
    return chosen;
  }
  function subjectFor(code) { return subjectCatalog().filter(function (subject) { return subject.code === upper(code); })[0] || { code: upper(code) || 'PLAN', name: code || 'Studieøkt', accent: '#2f62ff' }; }
  function groupFor(event) { var match = String((event && event.group) || '').match(/gr(?:uppe)?\s*0?(\d+)/i) || String((event && event.title) + ' ' + (event && event.raw)).match(/\bgr(?:uppe)?\s*0?(\d+)\b/i); return match ? 'Gr' + String(Number(match[1])).padStart(2, '0') : ''; }
  function groupOptions(course) { var seen = {}; return rawTimeEditEvents().filter(function (event) { return upper(event.subjectCode) === course; }).map(groupFor).filter(function (group) { if (!group || seen[group]) return false; seen[group] = true; return true; }).sort(); }
  function matchesGroup(event) { var group = groupFor(event); if (!group) return true; var selected = state.groups[upper(event.subjectCode)] || 'all'; return selected === 'all' || selected === group; }

  function rawTimeEditEvents() {
    var selected = ensureSelectedCourses();
    var service = api();
    if (!service || typeof service.getCachedNhhEvents !== 'function') return [];
    return service.getCachedNhhEvents(selected);
  }
  function timeEditEvents() {
    return rawTimeEditEvents().filter(function (event) { return event.type === 'lecture' && state.hiddenEventIds.indexOf(event.id) === -1 && matchesGroup(event); });
  }
  function allEvents() {
    var selected = ensureSelectedCourses();
    var items = timeEditEvents().concat(state.customEvents).filter(function (event) { return selected.indexOf(upper(event.subjectCode)) !== -1; });
    if (activeFilter !== 'all') items = items.filter(function (event) {
      if (activeFilter === 'exam') return event.type === 'exam';
      if (activeFilter === 'study') return event.source === 'custom';
      return event.type === 'lecture' || event.type === 'nhh';
    });
    return items.sort(function (a, b) { return String(a.date + (a.time || '') + a.title).localeCompare(String(b.date + (b.time || '') + b.title)); });
  }
  function eventsForWeek() { var start = iso(currentWeekStart), end = iso(addDays(currentWeekStart, 6)); return allEvents().filter(function (event) { return event.date >= start && event.date <= end; }); }
  function sourceStatus() {
    var service = api();
    if (!service || !service.getSyncStatus) return { label: 'TimeEdit klar', detail: 'Hent timeplanen for å oppdatere.' };
    var info = service.getSyncStatus(ensureSelectedCourses());
    if (!info.checkedAt) return { label: 'Ikke hentet ennå', detail: 'TimeEdit-data er ikke lagret på denne enheten.' };
    return { label: 'TimeEdit kontrollert', detail: 'Sist oppdatert ' + new Date(info.checkedAt).toLocaleString('nb-NO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' · ' + info.eventCount + ' hendelser' };
  }

  function render() {
    if (!document.querySelector('main.main')) return;
    ensureSelectedCourses();
    document.querySelector('main.main').classList.add('hf-plan');
    document.querySelector('main.main').innerHTML = shell();
    wire();
  }
  function shell() {
    var status = sourceStatus();
    return '<header class="topline"><div class="hello"><div class="breadcrumb"><a href="index.html">Dashboard</a><span>›</span><span>Studieplan</span></div><h1>Studieplan</h1><p>TimeEdit setter tid og rom. Du styrer fag, gruppe og egne studieøkter.</p></div></header>'
      + '<section class="hf-plan-header"><div><div class="hf-plan-eyebrow">Din personlige ukeplan</div><h2>Planlegg med <em>ro og oversikt.</em></h2></div><div class="hf-plan-sync"><i></i><span>' + esc(status.label) + '</span></div></section>'
      + '<section class="hf-plan-command"><div><h3>Fag i planen</h3><p class="hf-plan-muted">Bare fagene dine vises. Velg hvilke du vil se denne uken.</p><div class="hf-plan-course-list">' + courseButtons() + '</div></div><div class="hf-plan-actions"><button class="hf-plan-button primary" data-sync>Oppdater TimeEdit</button><button class="hf-plan-button" data-add>＋ Egen økt</button></div></section>'
      + '<section class="hf-plan-filter-row"><div class="hf-plan-filter-list"><label>Vis</label><button class="hf-plan-button" data-filter="all">TimeEdit + egne økter</button><button class="hf-plan-button" data-filter="lecture">Kun undervisning</button><button class="hf-plan-button" data-filter="study">Kun egne økter</button>' + groupControls() + '</div><div class="hf-plan-week"><button class="hf-plan-button" data-prev aria-label="Forrige uke">←</button><strong>' + esc(formatWeek(currentWeekStart)) + '</strong><button class="hf-plan-button" data-next aria-label="Neste uke">→</button><button class="hf-plan-button" data-today>Denne uken</button></div></section>'
      + '<div class="hf-plan-layout"><section class="hf-plan-calendar"><div class="hf-plan-timeline">' + calendar() + '</div></section><aside class="hf-plan-insight">' + insight() + '</aside></div>'
      + '<div class="hf-plan-modal-backdrop" id="hfPlanModal" aria-hidden="true"><section class="hf-plan-modal" role="dialog" aria-modal="true" aria-labelledby="hfPlanModalTitle"><div id="hfPlanModalContent"></div></section></div><div class="hf-plan-toast" id="hfPlanToast" role="status" aria-live="polite"></div>';
  }
  function courseButtons() { return subjectCatalog().map(function (subject) { var active = state.selectedCourses.indexOf(subject.code) !== -1; return '<button class="hf-plan-course ' + (active ? 'active' : '') + '" style="--course:' + esc(subject.accent) + '" data-course="' + esc(subject.code) + '">' + esc(subject.code) + ' · ' + esc(subject.name) + '</button>'; }).join('') || '<span class="hf-plan-muted">Du har ingen aktive fag ennå.</span>'; }
  function groupControls() { return state.selectedCourses.map(function (course) { var options = groupOptions(course); if (!options.length) return ''; var selected = state.groups[course] || 'all'; return '<label>' + esc(course) + ' gruppe <select class="hf-plan-select" data-group-course="' + esc(course) + '"><option value="all">Alle grupper</option>' + options.map(function (group) { return '<option value="' + group + '"' + (group === selected ? ' selected' : '') + '>' + group + '</option>'; }).join('') + '</select></label>'; }).join(''); }
  function eventClass(event) { return (event.type === 'exam' ? 'exam ' : '') + (event.source === 'custom' ? 'custom ' : '') + (/oblig/i.test(event.title + ' ' + event.raw) ? 'mandatory' : ''); }
  function calendar() { var weekEvents = eventsForWeek(), today = iso(new Date()); return Array.from({ length: 7 }, function (_, index) { var date = addDays(currentWeekStart, index), dateIso = iso(date), events = weekEvents.filter(function (event) { return event.date === dateIso; }); return '<article class="hf-plan-day ' + (dateIso === today ? 'today' : '') + '"><div class="hf-plan-day-head"><span>' + formatDay(date) + '</span><small>' + (events.length ? events.length + ' økt' + (events.length === 1 ? '' : 'er') : 'ledig') + '</small></div><div class="hf-plan-event-stack">' + (events.map(eventCard).join('') || '<div class="hf-plan-empty">Ingen planlagte økter</div>') + '</div><button class="hf-plan-add-day" data-add-date="' + dateIso + '">＋ Legg til økt</button></article>'; }).join(''); }
  function eventCard(event) { var subject = subjectFor(event.subjectCode), group = groupFor(event), meta = [event.time || 'Hele dagen', event.durationMin ? formatDuration(event.durationMin) : '', group].filter(Boolean).join(' · '); return '<button class="hf-plan-event ' + eventClass(event) + '" style="--course:' + esc(subject.accent) + '" data-event="' + esc(event.id) + '"><strong>' + esc(subject.code) + ' · ' + esc(event.title) + '</strong><span>' + esc(meta) + '</span></button>'; }
  function insight() {
    var weekEvents = eventsForWeek(), upcoming = weekEvents.filter(function (event) { return event.date >= iso(new Date()); });
    var exam = weekEvents.filter(function (event) { return event.type === 'exam'; })[0];
    var focus = exam || upcoming[0] || weekEvents[0];
    var minutes = weekEvents.reduce(function (total, event) { return total + (Number(event.durationMin) || 0); }, 0);
    var mandatory = weekEvents.filter(function (event) { return /oblig/i.test(event.title + ' ' + event.raw); });
    var overlaps = conflicts(weekEvents);
    return '<div><h3>Ukas kontrollrom</h3><p class="hf-plan-status">' + weekEvents.length + ' økter · ' + formatDuration(minutes) + ' planlagt</p></div>'
      + '<div class="hf-plan-focus"><strong>' + (focus ? esc(subjectFor(focus.subjectCode).code + ' først') : 'Plass til fokus') + '</strong><p>' + (focus ? esc(focus.title + ' · ' + focus.date) : 'Legg til en studieøkt, eller oppdater TimeEdit for å starte uken.') + '</p></div>'
      + '<div class="hf-plan-insight-section"><h4>Obligatorisk</h4>' + list(mandatory, 'Ingen obligatoriske økter registrert.') + '</div>'
      + '<div class="hf-plan-insight-section"><h4>TimeEdit-data</h4><p class="hf-plan-muted">Kun undervisningstid fra TimeEdit vises automatisk. Fag som ikke undervises denne uken, står tomme.</p></div>'
      + '<div class="hf-plan-insight-section"><h4>Kollisjoner</h4>' + (overlaps.length ? '<ul class="hf-plan-list">' + overlaps.map(function (pair) { return '<li><b>' + esc(pair.date) + '</b><br>' + esc(pair.first.title) + ' ↔ ' + esc(pair.second.title) + '</li>'; }).join('') + '</ul>' : '<p class="hf-plan-muted">Ingen overlapp i det som vises.</p>') + '</div>';
  }
  function list(events, empty) { return events.length ? '<ul class="hf-plan-list">' + events.slice(0, 4).map(function (event) { return '<li><b>' + esc(event.time || '') + ' ' + esc(subjectFor(event.subjectCode).code) + '</b><br>' + esc(event.title) + '</li>'; }).join('') + '</ul>' : '<p class="hf-plan-muted">' + esc(empty) + '</p>'; }
  function conflicts(events) { var result = []; events.forEach(function (event, index) { events.slice(index + 1).forEach(function (other) { if (event.date !== other.date || !event.time || !other.time) return; var a = timeValue(event.time), b = a + (Number(event.durationMin) || 0), c = timeValue(other.time), d = c + (Number(other.durationMin) || 0); if (a < d && c < b) result.push({ date: event.date, first: event, second: other }); }); }); return result; }
  function timeValue(value) { var pieces = String(value || '00:00').split(':').map(Number); return (pieces[0] || 0) * 60 + (pieces[1] || 0); }

  function wire() {
    document.querySelectorAll('[data-course]').forEach(function (button) { button.addEventListener('click', function () { var code = button.getAttribute('data-course'), selected = state.selectedCourses.slice(), index = selected.indexOf(code); if (index === -1) selected.push(code); else selected.splice(index, 1); state.selectedCourses = selected; markChanged(); render(); }); });
    document.querySelectorAll('[data-filter]').forEach(function (button) { button.classList.toggle('primary', button.getAttribute('data-filter') === activeFilter); button.addEventListener('click', function () { activeFilter = button.getAttribute('data-filter'); render(); }); });
    document.querySelectorAll('[data-group-course]').forEach(function (select) { select.addEventListener('change', function () { state.groups[select.getAttribute('data-group-course')] = select.value; markChanged(); render(); }); });
    document.querySelector('[data-prev]').addEventListener('click', function () { currentWeekStart = addDays(currentWeekStart, -7); render(); });
    document.querySelector('[data-next]').addEventListener('click', function () { currentWeekStart = addDays(currentWeekStart, 7); render(); });
    document.querySelector('[data-today]').addEventListener('click', function () { currentWeekStart = getMonday(new Date()); render(); });
    document.querySelector('[data-sync]').addEventListener('click', syncTimeEdit);
    document.querySelector('[data-add]').addEventListener('click', function () { openCustomModal({ date: iso(new Date()) }); });
    document.querySelectorAll('[data-add-date]').forEach(function (button) { button.addEventListener('click', function () { openCustomModal({ date: button.getAttribute('data-add-date') }); }); });
    document.querySelectorAll('[data-event]').forEach(function (button) { button.addEventListener('click', function () { var id = button.getAttribute('data-event'), event = allEvents().filter(function (item) { return item.id === id; })[0]; if (event) openEventModal(event); }); });
  }
  function syncTimeEdit() { var service = api(), codes = ensureSelectedCourses(), button = document.querySelector('[data-sync]'); if (!service || !codes.length) { showToast(codes.length ? 'TimeEdit-klienten er ikke tilgjengelig ennå.' : 'Velg minst ett fag først.'); return; } button.disabled = true; button.textContent = 'Henter …'; service.sync(codes).then(function (result) { var count = result && result.events ? result.events.length : 0; showToast(count ? count + ' TimeEdit-hendelser er oppdatert.' : 'Ingen TimeEdit-hendelser ble funnet for de valgte fagene.'); render(); }).catch(function () { showToast('Kunne ikke oppdatere TimeEdit akkurat nå. Prøv igjen senere.'); }).finally(function () { if (button && button.isConnected) { button.disabled = false; button.textContent = 'Oppdater TimeEdit'; } }); }
  function ensureModal() { return document.getElementById('hfPlanModal'); }
  function openEventModal(event) { if (event.source === 'custom') return openCustomModal(event); var modal = ensureModal(), subject = subjectFor(event.subjectCode); modal.querySelector('#hfPlanModalContent').innerHTML = '<h3 id="hfPlanModalTitle">TimeEdit-hendelse</h3><p class="hf-plan-muted"><b>' + esc(subject.code) + '</b> · ' + esc(event.title) + '</p><p class="hf-plan-muted">' + esc(event.date + ' · ' + (event.time || '') + ' · ' + (event.durationMin ? formatDuration(event.durationMin) : '')) + '<br>Dette er hentet fra NHH TimeEdit. Tid og rom oppdateres ved neste synkronisering.</p><div class="hf-plan-modal-actions"><button class="hf-plan-button" data-close>Lukk</button><button class="hf-plan-button" data-hide>Skjul fra min plan</button></div>'; modal.classList.add('open'); modal.querySelector('[data-close]').addEventListener('click', closeModal); modal.querySelector('[data-hide]').addEventListener('click', function () { state.hiddenEventIds.push(event.id); state.hiddenEventIds = state.hiddenEventIds.filter(function (id, index, all) { return all.indexOf(id) === index; }); markChanged(); closeModal(); render(); }); }
  function openCustomModal(event) { var modal = ensureModal(), isEdit = !!event.id; selectedCustomId = isEdit ? event.id : null; var subjects = ensureSelectedCourses(); modal.querySelector('#hfPlanModalContent').innerHTML = '<h3 id="hfPlanModalTitle">' + (isEdit ? 'Endre egen økt' : 'Legg til egen økt') + '</h3><form class="hf-plan-form" id="hfPlanForm"><label class="wide">Tittel<input name="title" required value="' + esc(event.title || '') + '" placeholder="For eksempel: Repetisjon av kapittel 4"></label><label>Fag<select name="subjectCode">' + subjects.map(function (code) { return '<option value="' + esc(code) + '"' + (upper(event.subjectCode) === code ? ' selected' : '') + '>' + esc(code + ' · ' + subjectFor(code).name) + '</option>'; }).join('') + '</select></label><label>Dato<input name="date" type="date" required value="' + esc(event.date || iso(new Date())) + '"></label><label>Tid<input name="time" type="time" value="' + esc(event.time || '10:00') + '"></label><label>Varighet (min)<input name="durationMin" type="number" min="5" step="5" value="' + esc(event.durationMin || 45) + '"></label><label class="wide">Notat<textarea name="note" placeholder="Valgfri huskelapp">' + esc(event.note || '') + '</textarea></label></form><div class="hf-plan-modal-actions">' + (isEdit ? '<button class="hf-plan-button" data-delete>Slett</button>' : '') + '<button class="hf-plan-button" data-close>Avbryt</button><button class="hf-plan-button primary" data-save>Lagre økt</button></div>'; modal.classList.add('open'); modal.querySelector('[data-close]').addEventListener('click', closeModal); modal.querySelector('[data-save]').addEventListener('click', saveCustom); if (isEdit) modal.querySelector('[data-delete]').addEventListener('click', deleteCustom); }
  function closeModal() { var modal = ensureModal(); if (modal) modal.classList.remove('open'); selectedCustomId = null; }
  function saveCustom() { var form = document.getElementById('hfPlanForm'); if (!form.reportValidity()) return; var event = { id: selectedCustomId || uid(), source: 'custom', type: 'study', title: form.elements.title.value.trim(), subjectCode: upper(form.elements.subjectCode.value), date: form.elements.date.value, time: form.elements.time.value, durationMin: Number(form.elements.durationMin.value) || 45, note: form.elements.note.value.trim() }; var index = state.customEvents.findIndex(function (item) { return item.id === event.id; }); if (index === -1) state.customEvents.push(event); else state.customEvents[index] = event; markChanged(); closeModal(); showToast('Studieøkten er lagret og synkroniseres til kontoen din.'); render(); }
  function deleteCustom() { if (!selectedCustomId) return; state.customEvents = state.customEvents.filter(function (event) { return event.id !== selectedCustomId; }); markChanged(); closeModal(); showToast('Studieøkten er fjernet.'); render(); }
  function showToast(message) { var toast = document.getElementById('hfPlanToast'); if (!toast) return; toast.textContent = message; toast.classList.add('show'); window.clearTimeout(toastTimer); toastTimer = window.setTimeout(function () { toast.classList.remove('show'); }, 3000); }

  function remoteContext() { if (!window.AuthGuard || typeof window.AuthGuard.getClient !== 'function' || typeof window.AuthGuard.getSession !== 'function') return null; var session = window.AuthGuard.getSession(); if (!session || !session.user || !session.user.id || session.user.email === 'dev@student.local') return null; try { return { sb: window.AuthGuard.getClient(), userId: session.user.id }; } catch (_error) { return null; } }
  function scheduleRemoteSave() { remoteDirty = true; if (!remoteLoaded) return; window.clearTimeout(remoteTimer); remoteTimer = window.setTimeout(saveRemote, 450); }
  function saveRemote() { var context = remoteContext(); if (!context || !remoteDirty) return; if (remoteSaving) { scheduleRemoteSave(); return; } remoteSaving = true; remoteDirty = false; return context.sb.from('user_custom_data').select('data').eq('user_id', context.userId).maybeSingle().then(function (result) { var data = result && result.data && result.data.data && typeof result.data.data === 'object' ? result.data.data : {}; data.studyplan = state; return context.sb.from('user_custom_data').upsert({ user_id: context.userId, data: data, updated_at: new Date().toISOString() }); }).then(function (result) { if (result && result.error) throw result.error; }).catch(function () { remoteDirty = true; }).finally(function () { remoteSaving = false; if (remoteDirty) scheduleRemoteSave(); }); }
  function loadRemote(attempt) { var context = remoteContext(); if (!context) { if ((attempt || 0) < 20) return window.setTimeout(function () { loadRemote((attempt || 0) + 1); }, 250); remoteLoaded = true; return; } return context.sb.from('user_custom_data').select('data').eq('user_id', context.userId).maybeSingle().then(function (result) { var data = result && result.data && result.data.data && typeof result.data.data === 'object' ? result.data.data : {}, remote = normalizeState(data.studyplan); remoteLoaded = true; if (Date.parse(remote.updatedAt) > Date.parse(state.updatedAt)) { state = remote; saveLocal(); render(); } else { remoteDirty = true; saveRemote(); } }).catch(function () { remoteLoaded = true; }); }
  function install() { if (!/\/user\/studieplan\.html$/.test(window.location.pathname) || !api()) { window.setTimeout(install, 80); return; } render(); loadRemote(0); window.HaugnesStudyplan = { render: render, sync: syncTimeEdit }; }
  ready(install);
  window.addEventListener('haugnes:subject-access-changed', function () { window.setTimeout(render, 0); });
})(window, document);
