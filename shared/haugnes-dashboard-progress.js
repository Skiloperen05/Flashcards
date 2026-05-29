(function (window, document) {
  'use strict';

  var V25 = {
    exam: { id: '1VKZwcmQF9zGlR2Hwtjy0UnKWlhHEf7_5', title: 'SAM3 skoleeksamen V25', label: 'Eksamen', url: 'https://drive.google.com/file/d/1VKZwcmQF9zGlR2Hwtjy0UnKWlhHEf7_5/view', download: 'https://drive.google.com/uc?export=download&id=1VKZwcmQF9zGlR2Hwtjy0UnKWlhHEf7_5' },
    answer: { id: '1yCI-f4BKMTllsLc5ZMgh6pj0TIA428x5', title: 'A-besvarelse SAM3 V25', label: 'A-besvarelse', url: 'https://drive.google.com/file/d/1yCI-f4BKMTllsLc5ZMgh6pj0TIA428x5/view', download: 'https://drive.google.com/uc?export=download&id=1yCI-f4BKMTllsLc5ZMgh6pj0TIA428x5' },
    sensor: { id: '1myk7l12OsR-jZ76am6e-W7iS1u6FNuTy', title: 'SAM3 sensorveiledning V25', label: 'Sensorveiledning', url: 'https://drive.google.com/file/d/1myk7l12OsR-jZ76am6e-W7iS1u6FNuTy/view', download: 'https://drive.google.com/uc?export=download&id=1myk7l12OsR-jZ76am6e-W7iS1u6FNuTy' }
  };

  var tries = {};

  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  function pageName() { return (window.location.pathname.split('/').pop() || 'index.html').toLowerCase(); }
  function inUserPage(name) { return /\/user\//.test(window.location.pathname) && (!name || pageName() === name); }
  function rootRelative(path) { return window.AuthGuard && typeof window.AuthGuard.getRootPath === 'function' ? window.AuthGuard.getRootPath().replace(/\/$/, '/') + path.replace(/^\//, '') : '../' + path.replace(/^\//, ''); }
  function retry(key, fn, max, delay) { tries[key] = (tries[key] || 0) + 1; if (tries[key] > (max || 25)) return; window.setTimeout(fn, delay || 120); }
  function readJson(key, fallback) { try { var raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }
  function formatNumber(n) { return Number(n || 0).toLocaleString('no-NO'); }

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

  function enhanceDashboard() {
    if (!inUserPage('index.html')) return;
    if (!window.HaugnesSubjects || typeof window.HaugnesSubjects.getAll !== 'function') { retry('dashboard-subjects', enhanceDashboard, 30, 120); return; }
    var active = getDashboardSubjects();
    var summary = aggregateStats(active);
    var grid = document.querySelector('.subjects');
    if (grid) {
      grid.innerHTML = active.length ? active.map(cardHtml).join('') : '<div class="panel"><div class="panel-inner">Velg fag på Mine fag-siden for å fylle dashboardet.</div></div>';
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

  function enhanceABesvarelserSensor() { if (inUserPage('a-besvarelser.html')) loadAnswerLibrary(); }

  function enhanceProgressNextSteps() {
    if (!inUserPage('progress.html') || document.body.dataset.hfProgressNextEnhanced) return;
    document.body.dataset.hfProgressNextEnhanced = '1';
    var list = document.querySelector('.side-panel .focus-list');
    if (!list || list.querySelector('a[href="../sam3/"]')) return;
    var item = document.createElement('a');
    item.className = 'focus-item';
    item.href = '../sam3/';
    item.innerHTML = '<span><strong>SAM3 V25-pakke</strong><span>Eksamen, sensorveiledning og A-besvarelse</span></span><span class="tag">PDF</span>';
    list.appendChild(item);
  }

  function run() { enhanceDashboard(); enhanceABesvarelserSensor(); enhanceProgressNextSteps(); }
  ready(run);
  window.setTimeout(run, 250);
  window.setTimeout(run, 800);
  window.setTimeout(run, 1600);
  window.addEventListener('storage', function (event) { if (event.key === 'hf_subject_stats' || event.key === 'fc_stats' || event.key === 'hf_enabled_subjects') run(); });
  window.addEventListener('haugnes:subject-access-changed', run);
  window.addEventListener('haugnes:flashcard-session-saved', run);
  window.HaugnesDashboardProgress = { run: run, files: V25, subjectStats: subjectStats };
})(window, document);
