(function (window, document) {
  'use strict';

  var V25 = {
    exam: { id: '1VKZwcmQF9zGlR2Hwtjy0UnKWlhHEf7_5', title: 'SAM3 skoleeksamen V25', label: 'Eksamen', url: 'https://drive.google.com/file/d/1VKZwcmQF9zGlR2Hwtjy0UnKWlhHEf7_5/view', download: 'https://drive.google.com/uc?export=download&id=1VKZwcmQF9zGlR2Hwtjy0UnKWlhHEf7_5' },
    answer: { id: '1yCI-f4BKMTllsLc5ZMgh6pj0TIA428x5', title: 'A-besvarelse SAM3 V25', label: 'A-besvarelse', url: 'https://drive.google.com/file/d/1yCI-f4BKMTllsLc5ZMgh6pj0TIA428x5/view', download: 'https://drive.google.com/uc?export=download&id=1yCI-f4BKMTllsLc5ZMgh6pj0TIA428x5' },
    sensor: { id: '1myk7l12OsR-jZ76am6e-W7iS1u6FNuTy', title: 'SAM3 sensorveiledning V25', label: 'Sensorveiledning', url: 'https://drive.google.com/file/d/1myk7l12OsR-jZ76am6e-W7iS1u6FNuTy/view', download: 'https://drive.google.com/uc?export=download&id=1myk7l12OsR-jZ76am6e-W7iS1u6FNuTy' }
  };

  var RECOMMENDATIONS = {
    RET14: { title: 'Fradragsrett i RET14', sub: 'Fokus på tema', cards: 28, minutes: 30, href: '../flashcards/?subject=ret14' },
    SOL1: { title: 'Motivasjon og ledelse i SOL1', sub: 'Fokus på teori', cards: 32, minutes: 25, href: '../flashcards/?subject=subj_sol1' },
    SAM2: { title: 'Konsumentteori i SAM2', sub: 'Fokus på modell', cards: 24, minutes: 25, href: '../sam2/oppgaver-klikkbar/' },
    SAM3: { title: 'Makromodeller i SAM3', sub: 'Fokus på eksamen', cards: 31, minutes: 25, href: '../sam3/flashcards.html' },
    MET2: { title: 'MET2 er planlagt', sub: 'Fagområde kommer', cards: 0, minutes: 0, href: 'subjects.html', planned: true },
    MAT10: { title: 'MAT10 er planlagt', sub: 'Fagområde kommer', cards: 0, minutes: 0, href: 'subjects.html', planned: true }
  };

  var tries = {};

  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  function pageName() { return (window.location.pathname.split('/').pop() || 'index.html').toLowerCase(); }
  function inUserPage(name) { return /\/user\//.test(window.location.pathname) && (!name || pageName() === name); }
  function rootRelative(path) { return window.AuthGuard && typeof window.AuthGuard.getRootPath === 'function' ? window.AuthGuard.getRootPath().replace(/\/$/, '/') + path.replace(/^\//, '') : '../' + path.replace(/^\//, ''); }
  function retry(key, fn, max, delay) { tries[key] = (tries[key] || 0) + 1; if (tries[key] > (max || 25)) return; window.setTimeout(fn, delay || 120); }
  function readJson(key, fallback) { try { var raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }
  function formatNumber(n) { return Number(n || 0).toLocaleString('no-NO'); }
  function esc(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  function normaliseSubjectId(id) {
    var lower = String(id || '').toLowerCase();
    if (lower.indexOf('ret14') !== -1) return 'ret14';
    if (lower.indexOf('sol1') !== -1 || lower.indexOf('subj_sol1') !== -1) return 'subj_sol1';
    if (lower.indexOf('sam2') !== -1) return 'sam2';
    if (lower.indexOf('sam3') !== -1) return 'sam3';
    if (lower.indexOf('met2') !== -1) return 'met2';
    if (lower.indexOf('mat10') !== -1) return 'mat10';
    return lower;
  }

  function addSessionToTotals(session, totals) {
    totals.sessions++;
    totals.total += session.total || 0;
    totals.right += session.results && session.results.right || 0;
    if (session.date && (!totals.lastDate || new Date(session.date) > new Date(totals.lastDate))) totals.lastDate = session.date;
  }

  function subjectStats(subject) {
    var aliases = [subject.id, subject.code].concat(subject.aliases || []).map(normaliseSubjectId);
    var totals = { total: 0, right: 0, sessions: 0, quiz: 0, bestQuiz: null, lastDate: null, fromSubjectStore: false };
    var subjectStore = readJson('hf_subject_stats', {});

    aliases.forEach(function (alias) {
      var data = subjectStore[alias];
      if (!data) return;
      totals.fromSubjectStore = true;
      (data.sessions || []).forEach(function (session) { addSessionToTotals(session, totals); });
      (data.quizSessions || []).forEach(function (session) { totals.quiz++; if (totals.bestQuiz === null || (session.pct || 0) > totals.bestQuiz) totals.bestQuiz = session.pct || 0; });
    });

    if (!totals.fromSubjectStore) {
      var stats = readJson('fc_stats', {});
      Object.keys(stats).forEach(function (key) {
        var normal = normaliseSubjectId(key);
        if (aliases.indexOf(normal) === -1 && aliases.every(function (alias) { return normal.indexOf(alias) === -1; })) return;
        var data = stats[key] || {};
        (data.sessions || []).forEach(function (session) { addSessionToTotals(session, totals); });
      });
    }

    return { total: totals.total, right: totals.right, sessions: totals.sessions, pct: totals.total ? Math.round((totals.right / totals.total) * 100) : 0 };
  }

  function aggregateStats(subjects) {
    var total = 0, right = 0, sessions = 0, active = [];
    subjects.forEach(function (subject) {
      var s = subjectStats(subject);
      total += s.total; right += s.right; sessions += s.sessions;
      active.push({ subject: subject, stats: s });
    });
    active.sort(function (a, b) {
      if (!!a.stats.total !== !!b.stats.total) return a.stats.total ? 1 : -1;
      return a.stats.pct - b.stats.pct;
    });
    return { total: total, right: right, sessions: sessions, mastery: total ? Math.round((right / total) * 100) : 0, weakest: active.find(function (x) { return x.stats.total; }) || null };
  }

  function setText(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }
  function isPlanned(subject) { return subject && (subject.status === 'build' || subject.path === '#' || subject.flashcards === '#'); }
  function flashcardHref(subject) { if (subject.code === 'SAM3') return '../sam3/flashcards.html'; return subject.flashcards || subject.path || '#'; }
  function subjectHref(subject) { return isPlanned(subject) ? 'subjects.html' : (subject.path || 'subjects.html'); }

  function cardHtml(subject) {
    var stats = subjectStats(subject);
    var planned = isPlanned(subject);
    var pct = stats.total ? stats.pct : 0;
    var emblem = subject.emblem ? '<img class="emblem-img" src="' + subject.emblem + '" alt="" onerror="this.remove()">' : '';
    var sub = planned ? 'Planlagt fag · synlig fordi du har valgt det' : (stats.total ? formatNumber(stats.total) + ' kort øvd · ' + stats.sessions + ' økter' : 'Ikke startet ennå');
    var cta = planned ? '<span class="subject-cta" data-planned="1">Planlagt fag</span>' : '<span class="subject-cta" data-flashcards="' + flashcardHref(subject) + '">Start øving</span>';
    return '<a class="subject-card" style="--accent:' + subject.accent + ';--pct:' + pct + '" href="' + subjectHref(subject) + '"><div class="subject-top"><span class="subject-icon">' + emblem + '<span class="emblem-fallback">' + subject.icon + '</span></span><span class="dots">⋮</span></div><div class="subject-code">' + subject.code + '</div><div class="subject-name">' + subject.name + '</div><div class="ring"><svg viewBox="0 0 120 120"><circle class="ring-bg" cx="60" cy="60" r="52"/><circle class="ring-fg" cx="60" cy="60" r="52"/></svg><div class="ring-label">' + pct + '%</div></div><div class="ring-sub">' + sub + '</div>' + cta + '</a>';
  }

  function groupedCardsHtml(subjects) {
    if (!window.HaugnesSubjects || typeof window.HaugnesSubjects.groupByCategory !== 'function') return subjects.map(cardHtml).join('');
    return window.HaugnesSubjects.groupByCategory(subjects).map(function (group) {
      return '<section class="dashboard-subject-group"><div class="dashboard-subject-group-head"><h3>' + esc(group.label) + '</h3><span>' + group.subjects.length + ' fag</span></div><div class="dashboard-subject-group-grid">' + group.subjects.map(cardHtml).join('') + '</div></section>';
    }).join('');
  }

  function setTodayStats(summary) {
    var cards = document.querySelectorAll('#today .big-stat');
    if (!cards.length) return;
    var values = [summary.total, summary.sessions, summary.mastery + '%'];
    var labels = ['kort repetert', 'økter fullført', 'nøyaktighet'];
    cards.forEach(function (card, i) {
      var b = card.querySelector('b');
      var span = card.querySelector('span');
      if (b) b.textContent = i === 0 ? formatNumber(values[i]) : values[i];
      if (span) span.textContent = labels[i];
    });
  }

  function setStudyHabits(summary) {
    setText('cardsStat', formatNumber(summary.total));
    setText('sessStat', summary.sessions);
    var totalPanel = document.querySelector('.stat-row-text b');
    if (totalPanel) totalPanel.innerHTML = summary.sessions + ' <i>økter</i>';
    var bestStreak = document.querySelector('.habit-text b');
    if (bestStreak && /Beste streak/i.test(bestStreak.parentElement.textContent)) bestStreak.textContent = summary.sessions ? 'Aktiv' : 'Ikke startet';
  }

  function getDashboardSubjects() {
    if (!window.HaugnesSubjects || typeof window.HaugnesSubjects.getAll !== 'function') return [];
    var subjects = window.HaugnesSubjects.getAll();
    if (window.HaugnesSubjectAccess && typeof window.HaugnesSubjectAccess.filterSubjects === 'function') subjects = window.HaugnesSubjectAccess.filterSubjects(subjects);
    return subjects;
  }

  function chooseRecommendation(subjects, summary) {
    var pool = (subjects || []).filter(function (subject) { return !isPlanned(subject); });
    var subject = summary.weakest && summary.weakest.subject ? summary.weakest.subject : pool[0];
    if (!subject) return null;
    var rec = RECOMMENDATIONS[subject.code] || { title: subject.code + ' · ' + subject.name, sub: 'Fokus på valgt fag', cards: 20, minutes: 25, href: flashcardHref(subject) };
    return Object.assign({ subject: subject }, rec);
  }

  function setRecommendation(subjects, summary) {
    var panel = document.querySelector('.recommend .panel-inner');
    if (!panel) return;
    var rec = chooseRecommendation(subjects, summary);
    if (!rec) {
      panel.innerHTML = '<div class="rec-head"><div class="isq isq-purple">+</div><div><div class="rec-title">Neste anbefaling</div><div class="rec-sub">Velg et aktivt fag</div></div></div><h3>Ingen aktiv anbefaling ennå</h3><div class="rec-meta"><span>Velg et fag med innhold</span></div><a class="start-btn" href="subjects.html" style="height:44px">Administrer fag →</a>';
      return;
    }
    panel.innerHTML = '<div class="rec-head"><div class="isq isq-purple"><svg viewBox="0 0 24 24"><path d="M12 4v16M7 20h10"/><path d="M5 8h14"/><path d="M5 8l-2.2 4.5a2.2 2.2 0 0 0 4.4 0z"/><path d="M19 8l-2.2 4.5a2.2 2.2 0 0 0 4.4 0z"/><circle cx="12" cy="5" r="1.3"/></svg></div><div><div class="rec-title">Neste anbefaling</div><div class="rec-sub">' + esc(rec.sub) + '</div></div></div><h3>' + esc(rec.title) + '</h3><div class="rec-meta"><span><svg viewBox="0 0 24 24"><path d="M7 3.5h7l4 4V20.5H7z"/><path d="M14 3.5V8h4"/></svg>' + (rec.cards ? rec.cards + ' kort' : 'Planlagt') + '</span><span><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>' + (rec.minutes ? '≈ ' + rec.minutes + ' min' : 'Kommer') + '</span></div><a class="start-btn" href="' + esc(rec.href) + '" style="height:44px">' + (rec.planned ? 'Se fag →' : 'Start nå →') + '</a>';
  }

  function setWeakestArea(subjects, summary) {
    var panel = document.querySelector('.weak-list');
    if (!panel) return;
    var subject = summary.weakest && summary.weakest.subject ? summary.weakest.subject : (subjects || []).filter(function (s) { return !isPlanned(s); })[0];
    if (!subject) {
      panel.innerHTML = '<div class="weak"><div class="isq isq-sm isq-blue">+</div><strong>Velg et aktivt fag først</strong></div>';
      return;
    }
    var title = summary.weakest ? 'Neste område å styrke' : 'Ikke nok øvingsdata ennå';
    panel.innerHTML = '<div class="weak"><div class="isq isq-sm isq-blue"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.8"/></svg></div><strong>' + esc(title) + '</strong></div><div class="weak"><div class="isq isq-sm isq-red"><svg viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg></div><strong>' + esc(subject.code + ' · ' + subject.name) + '</strong></div><div class="weak-meta"><span><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 12.5l2.5 2.5 5-5"/></svg>' + formatNumber(subjectStats(subject).total) + ' kort</span><span><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>' + (subjectStats(subject).sessions || 0) + ' økter</span></div>';
  }

  function enhanceDashboard() {
    if (!inUserPage('index.html')) return;
    if (!window.HaugnesSubjects || typeof window.HaugnesSubjects.getAll !== 'function') { retry('dashboard-subjects', enhanceDashboard, 30, 120); return; }
    var active = getDashboardSubjects();
    var summary = aggregateStats(active);
    var grid = document.querySelector('.subjects');
    if (grid) {
      grid.classList.toggle('dashboard-subject-groups', !!active.length);
      grid.innerHTML = active.length ? groupedCardsHtml(active) : '<div class="panel"><div class="panel-inner">Velg fag på Mine fag-siden for å fylle dashboardet.</div></div>';
      if (!grid.dataset.hfBound) {
        grid.dataset.hfBound = '1';
        grid.addEventListener('click', function (event) {
          var cta = event.target.closest('.subject-cta[data-flashcards]');
          if (!cta) return;
          event.preventDefault();
          window.location.href = cta.getAttribute('data-flashcards');
        });
      }
    }
    var mineFag = document.querySelector('#mine-fag a');
    if (mineFag) { mineFag.href = 'subjects.html'; mineFag.textContent = 'Administrer fag →'; }
    setTodayStats(summary);
    setStudyHabits(summary);
    setRecommendation(active, summary);
    setWeakestArea(active, summary);
    var target = summary.weakest && summary.weakest.subject ? summary.weakest.subject : active.find(function (subject) { return !isPlanned(subject); });
    var start = document.querySelector('#today .start-btn');
    var plan = document.querySelector('#today .ghost-link');
    if (start && target) { start.href = flashcardHref(target); start.textContent = summary.total ? 'Fortsett ' + target.code + ' →' : 'Start første økt →'; }
    if (plan) { plan.href = 'subjects.html'; plan.textContent = 'Administrer fag →'; }
  }

  function loadAnswerLibrary() {
    if (!inUserPage('a-besvarelser.html')) return;
    if (document.getElementById('haugnes-answer-library-js')) return;
    var script = document.createElement('script');
    script.id = 'haugnes-answer-library-js';
    script.src = rootRelative('shared/haugnes-answer-library.js');
    script.defer = true;
    document.head.appendChild(script);
  }

  function loadUserSidebar() {
    if (!/\/user\//.test(window.location.pathname)) return;
    if (document.getElementById('haugnes-user-sidebar-js')) {
      if (window.HaugnesUserSidebar && typeof window.HaugnesUserSidebar.run === 'function') window.HaugnesUserSidebar.run();
      return;
    }
    var script = document.createElement('script');
    script.id = 'haugnes-user-sidebar-js';
    script.src = rootRelative('shared/user-sidebar.js');
    script.defer = true;
    script.onload = function () { if (window.HaugnesUserSidebar && typeof window.HaugnesUserSidebar.run === 'function') window.HaugnesUserSidebar.run(); };
    document.head.appendChild(script);
  }

  function enhanceABesvarelserSensor() { if (inUserPage('a-besvarelser.html')) loadAnswerLibrary(); }

  function enhanceProgressNextSteps() {
    if (!inUserPage('progress.html') || document.body.dataset.hfProgressNextEnhanced) return;
    document.body.dataset.hfProgressNextEnhanced = '1';
    var list = document.querySelector('.side-panel .focus-list');
    if (!list || list.querySelector('a[href="../sam3/"]')) return;
    var selected = window.HaugnesSubjectAccess && window.HaugnesSubjectAccess.getSelected ? window.HaugnesSubjectAccess.getSelected() : ['SAM3'];
    if (selected.indexOf('SAM3') === -1) return;
    var item = document.createElement('a');
    item.className = 'focus-item';
    item.href = 'a-besvarelser.html#/sam3/v26';
    item.innerHTML = '<span><strong>SAM3 V26-pakke</strong><span>Eksamen, sensorveiledning og A-besvarelse</span></span><span class="tag">PDF</span>';
    list.appendChild(item);
  }

  function run() { loadUserSidebar(); enhanceDashboard(); enhanceABesvarelserSensor(); enhanceProgressNextSteps(); }
  ready(run);
  window.setTimeout(run, 250);
  window.setTimeout(run, 800);
  window.setTimeout(run, 1600);
  window.addEventListener('storage', function (event) { if (event.key === 'hf_subject_stats' || event.key === 'fc_stats' || event.key === 'hf_enabled_subjects') run(); });
  window.addEventListener('haugnes:subject-access-changed', run);
  window.addEventListener('haugnes:flashcard-session-saved', run);
  window.HaugnesDashboardProgress = { run: run, files: V25, subjectStats: subjectStats };
})(window, document);
