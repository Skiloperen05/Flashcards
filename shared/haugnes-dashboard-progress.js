(function (window, document) {
  'use strict';

  var V25 = {
    exam: {
      id: '1VKZwcmQF9zGlR2Hwtjy0UnKWlhHEf7_5',
      title: 'SAM3 skoleeksamen V25',
      label: 'Eksamen',
      url: 'https://drive.google.com/file/d/1VKZwcmQF9zGlR2Hwtjy0UnKWlhHEf7_5/view',
      download: 'https://drive.google.com/uc?export=download&id=1VKZwcmQF9zGlR2Hwtjy0UnKWlhHEf7_5'
    },
    answer: {
      id: '1yCI-f4BKMTllsLc5ZMgh6pj0TIA428x5',
      title: 'A-besvarelse SAM3 V25',
      label: 'A-besvarelse',
      url: 'https://drive.google.com/file/d/1yCI-f4BKMTllsLc5ZMgh6pj0TIA428x5/view',
      download: 'https://drive.google.com/uc?export=download&id=1yCI-f4BKMTllsLc5ZMgh6pj0TIA428x5'
    },
    sensor: {
      id: '1myk7l12OsR-jZ76am6e-W7iS1u6FNuTy',
      title: 'SAM3 sensorveiledning V25',
      label: 'Sensorveiledning',
      url: 'https://drive.google.com/file/d/1myk7l12OsR-jZ76am6e-W7iS1u6FNuTy/view',
      download: 'https://drive.google.com/uc?export=download&id=1myk7l12OsR-jZ76am6e-W7iS1u6FNuTy'
    }
  };

  var tries = {};

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function pageName() {
    return (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  }

  function inUserPage(name) {
    return /\/user\//.test(window.location.pathname) && (!name || pageName() === name);
  }

  function rootRelative(path) {
    if (window.AuthGuard && typeof window.AuthGuard.getRootPath === 'function') {
      return window.AuthGuard.getRootPath().replace(/\/$/, '/') + path.replace(/^\//, '');
    }
    return '../' + path.replace(/^\//, '');
  }

  function retry(key, fn, max, delay) {
    tries[key] = (tries[key] || 0) + 1;
    if (tries[key] > (max || 25)) return;
    window.setTimeout(fn, delay || 120);
  }

  function readStats() {
    try { return JSON.parse(window.localStorage.getItem('fc_stats') || '{}'); }
    catch (e) { return {}; }
  }

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

  function subjectStats(subject) {
    var stats = readStats();
    var aliases = [subject.id, subject.code].concat(subject.aliases || []).map(normaliseSubjectId);
    var total = 0, right = 0, sessions = 0, quiz = 0, bestQuiz = null, lastDate = null;

    Object.keys(stats).forEach(function (key) {
      var normal = normaliseSubjectId(key);
      if (aliases.indexOf(normal) === -1 && aliases.every(function (alias) { return normal.indexOf(alias) === -1; })) return;
      var data = stats[key] || {};
      (data.sessions || []).forEach(function (session) {
        sessions++;
        total += session.total || 0;
        right += session.results && session.results.right || 0;
        if (session.date && (!lastDate || new Date(session.date) > new Date(lastDate))) lastDate = session.date;
      });
      (data.quizSessions || []).forEach(function (session) {
        quiz++;
        if (bestQuiz === null || (session.pct || 0) > bestQuiz) bestQuiz = session.pct || 0;
        if (session.date && (!lastDate || new Date(session.date) > new Date(lastDate))) lastDate = session.date;
      });
    });

    var pct = total ? Math.round((right / total) * 100) : subject.progress;
    return { total: total, right: right, sessions: sessions, quiz: quiz, bestQuiz: bestQuiz, pct: pct, lastDate: lastDate };
  }

  function aggregateStats(subjects) {
    var total = 0, right = 0, sessions = 0, quiz = 0, active = [];
    subjects.forEach(function (subject) {
      var s = subjectStats(subject);
      total += s.total;
      right += s.right;
      sessions += s.sessions;
      quiz += s.quiz;
      active.push({ subject: subject, stats: s });
    });
    active.sort(function (a, b) {
      var aScore = a.stats.total ? a.stats.pct : a.subject.progress;
      var bScore = b.stats.total ? b.stats.pct : b.subject.progress;
      return aScore - bScore;
    });
    return {
      total: total,
      right: right,
      sessions: sessions,
      quiz: quiz,
      mastery: total ? Math.round((right / total) * 100) : 0,
      weakest: active[0] || null,
      best: active[active.length - 1] || null
    };
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function getTodayCards(subject) {
    var map = { RET14: 48, SOL1: 32, SAM2: 28, SAM3: 31 };
    return map[subject.code] || 18;
  }

  function cardHtml(subject) {
    var stats = subjectStats(subject);
    var pct = stats.total ? stats.pct : subject.progress;
    var todayCards = Math.max(8, stats.total && pct < 70 ? 38 : getTodayCards(subject));
    var flashHref = subject.flashcards || subject.path || '#';
    if (subject.code === 'SAM3') flashHref = '../sam3/flashcards.html';
    var emblem = subject.emblem ? '<img class="emblem-img" src="' + subject.emblem + '" alt="" onerror="this.remove()">' : '';
    var title = stats.total ? stats.total + ' kort øvd · ' + stats.sessions + ' økter' : todayCards + ' kort i dag';
    return '<a class="subject-card" style="--accent:' + subject.accent + ';--pct:' + pct + '" href="' + (subject.path || '#') + '">'
      + '<div class="subject-top"><span class="subject-icon">' + emblem + '<span class="emblem-fallback">' + subject.icon + '</span></span><span class="dots">⋮</span></div>'
      + '<div class="subject-code">' + subject.code + '</div>'
      + '<div class="subject-name">' + subject.name + '</div>'
      + '<div class="ring"><svg viewBox="0 0 120 120"><circle class="ring-bg" cx="60" cy="60" r="52"/><circle class="ring-fg" cx="60" cy="60" r="52"/></svg><div class="ring-label">' + pct + '%</div></div>'
      + '<div class="ring-sub">' + title + '</div>'
      + '<span class="subject-cta" data-flashcards="' + flashHref + '">Start øving</span>'
      + '</a>';
  }

  function enhanceDashboard() {
    if (!inUserPage('index.html')) return;
    if (!window.HaugnesSubjects || typeof window.HaugnesSubjects.getAll !== 'function') {
      retry('dashboard-subjects', enhanceDashboard, 30, 120);
      return;
    }

    var all = window.HaugnesSubjects.getAll();
    var active = all.filter(function (subject) { return subject.status !== 'build'; });
    var summary = aggregateStats(active);
    var grid = document.querySelector('.subjects');

    if (grid) {
      grid.innerHTML = active.map(cardHtml).join('');
      grid.addEventListener('click', function (event) {
        var cta = event.target.closest('.subject-cta[data-flashcards]');
        if (!cta) return;
        event.preventDefault();
        window.location.href = cta.getAttribute('data-flashcards');
      }, { once: true });
    }

    var mineFag = document.querySelector('#mine-fag a');
    if (mineFag) {
      mineFag.href = 'subjects.html';
      mineFag.textContent = 'Se alle fag →';
    }

    var todayStats = document.querySelectorAll('#today .big-stat b');
    if (todayStats[0]) todayStats[0].textContent = summary.total ? Math.max(18, 90 - summary.mastery) : '48';
    if (todayStats[1]) todayStats[1].textContent = summary.sessions ? Math.max(15, Math.min(45, summary.sessions * 4)) : '35';
    if (todayStats[2]) todayStats[2].textContent = summary.total ? Math.max(50, Math.min(96, summary.mastery + 12)) + '%' : '66%';

    if (summary.total) setText('cardsStat', summary.total.toLocaleString('no'));
    if (summary.sessions) setText('sessStat', summary.sessions);

    var start = document.querySelector('#today .start-btn');
    var plan = document.querySelector('#today .ghost-link');
    var target = summary.weakest && summary.weakest.subject ? summary.weakest.subject : active[0];
    if (start && target) {
      start.href = target.code === 'SAM3' ? '../sam3/flashcards.html' : (target.flashcards || target.path || '../flashcards/');
      start.textContent = 'Start ' + target.code + ' →';
    }
    if (plan && target) plan.href = target.path || 'subjects.html';

    var rec = document.querySelector('.recommend h3');
    var recStart = document.querySelector('.recommend .start-btn');
    var recMeta = document.querySelector('.recommend .rec-meta');
    if (target && rec) rec.textContent = target.code === 'SAM3' ? 'SAM3 V25 eksamenspakke' : 'Prioriter ' + target.code;
    if (target && recStart) {
      recStart.href = target.code === 'SAM3' ? '../sam3/' : (target.flashcards || target.path || '../flashcards/');
      recStart.textContent = target.code === 'SAM3' ? 'Åpne V25 →' : 'Start nå →';
    }
    if (target && recMeta) {
      recMeta.innerHTML = '<span><svg viewBox="0 0 24 24"><path d="M7 3.5h7l4 4V20.5H7z"/><path d="M14 3.5V8h4"/></svg>' + getTodayCards(target) + ' kort</span><span><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>≈ 25 min</span>';
    }
  }

  function enhanceABesvarelserSensor() {
    if (!inUserPage('a-besvarelser.html')) return;
    if (!window.answers || typeof window.render !== 'function') {
      retry('answer-sensor', enhanceABesvarelserSensor, 30, 120);
      return;
    }

    var sensor = window.answers.find(function (a) { return a.title === V25.sensor.title; });
    if (!sensor) {
      window.answers.unshift({
        course: 'SAM3', icon: '↗', color: '#ef4444', term: 'V25',
        title: V25.sensor.title, subtitle: 'Makroøkonomi', type: 'analyse',
        desc: 'Sensorveiledning for våren 2025. Bruk den for å forstå hva sensor faktisk belønner.',
        meta: ['Sensor', 'PDF', 'V25'], popular: 2,
        url: V25.sensor.url, download: V25.sensor.download
      });
    } else {
      sensor.url = V25.sensor.url;
      sensor.download = V25.sensor.download;
      sensor.meta = ['Sensor', 'PDF', 'V25'];
    }

    if (!window.render.__hfV25SensorWrapped) {
      var original = window.render;
      window.render = function () {
        var result = original.apply(this, arguments);
        window.setTimeout(patchCards, 0);
        return result;
      };
      window.render.__hfV25SensorWrapped = true;
    }

    function patchCards() {
      document.querySelectorAll('.answer-card').forEach(function (card) {
        var title = card.querySelector('.answer-title');
        if (!title || title.textContent.trim() !== V25.sensor.title) return;
        var open = card.querySelector('.open-btn');
        var more = card.querySelector('.ghost-btn[title="Mer"],.ghost-btn[title="Last ned"]');
        if (open) {
          open.href = V25.sensor.url;
          open.target = '_blank';
          open.rel = 'noopener';
          open.textContent = 'Åpne PDF';
        }
        if (more) {
          more.href = V25.sensor.download;
          more.title = 'Last ned';
          more.textContent = '↓';
        }
      });
    }

    window.render();
    patchCards();
    if (typeof window.renderPopular === 'function') window.renderPopular();
  }

  function enhanceProgressNextSteps() {
    if (!inUserPage('progress.html') || document.body.dataset.hfProgressNextEnhanced) return;
    document.body.dataset.hfProgressNextEnhanced = '1';
    var list = document.querySelector('.side-panel .focus-list');
    if (!list) return;
    if (!list.querySelector('a[href="../sam3/"]')) {
      var item = document.createElement('a');
      item.className = 'focus-item';
      item.href = '../sam3/';
      item.innerHTML = '<span><strong>SAM3 V25-pakke</strong><span>Eksamen, sensorveiledning og A-besvarelse</span></span><span class="tag">PDF</span>';
      list.appendChild(item);
    }
  }

  function run() {
    enhanceDashboard();
    enhanceABesvarelserSensor();
    enhanceProgressNextSteps();
  }

  ready(run);
  window.setTimeout(run, 250);
  window.HaugnesDashboardProgress = { run: run, files: V25 };
})(window, document);
