(function (window, document) {
  'use strict';

  var installed = false;
  var tries = 0;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function isFlashcardsPage() {
    return /\/flashcards\/?(?:index\.html)?$/.test(window.location.pathname);
  }

  function rootRelative(path) {
    if (window.AuthGuard && typeof window.AuthGuard.getRootPath === 'function') {
      return window.AuthGuard.getRootPath().replace(/\/$/, '/') + path.replace(/^\//, '');
    }
    return '../' + path.replace(/^\//, '');
  }

  function readJson(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  function subjectKey(id) {
    var value = String(id || '').toLowerCase();
    if (value.indexOf('ret14') !== -1) return 'ret14';
    if (value.indexOf('sol1') !== -1 || value.indexOf('subj_sol1') !== -1) return 'subj_sol1';
    if (value.indexOf('sam2') !== -1) return 'sam2';
    if (value.indexOf('sam3') !== -1) return 'sam3';
    return value || 'unknown';
  }

  function getSubjectName() {
    var id = window.currentSubjectId;
    if (typeof window.getAllSubjects === 'function') {
      var subject = window.getAllSubjects().find(function (item) { return item.id === id; });
      if (subject && subject.name) return subject.name;
    }
    return id || 'Flashcards';
  }

  function getSubjectHomeUrl() {
    var key = subjectKey(window.currentSubjectId);
    if (key === 'ret14') return rootRelative('ret14/');
    if (key === 'subj_sol1') return rootRelative('sol1/');
    if (key === 'sam2') return rootRelative('sam2/');
    if (key === 'sam3') return rootRelative('sam3/');
    return rootRelative('user/subjects.html');
  }

  function showToast(message) {
    if (typeof window.showToast === 'function') window.showToast(message);
  }

  function injectStyles() {
    if (document.getElementById('hf-session-enhancements-css')) return;
    var style = document.createElement('style');
    style.id = 'hf-session-enhancements-css';
    style.textContent = [
      '.hf-session-status{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0 12px}',
      '.hf-session-chip{background:#fff;border:1.5px solid var(--border);border-radius:12px;padding:9px 10px;text-align:center;box-shadow:0 1px 6px rgba(0,0,0,.04)}',
      '.hf-session-chip b{display:block;font-size:16px;line-height:1;color:var(--text)}',
      '.hf-session-chip span{display:block;margin-top:3px;font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.04em}',
      '.hf-next-action{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:14px 0 4px}',
      '.hf-next-action a,.hf-next-action button{border:0;border-radius:12px;padding:10px 13px;background:#f3f4f6;color:var(--text);font:700 12px Lora,Georgia,serif;text-decoration:none;cursor:pointer}',
      '.hf-next-action .primary{background:var(--accent);color:#fff}',
      '.hf-session-note{font-size:11px;color:var(--muted);text-align:center;margin-top:8px;line-height:1.45}',
      '.deck-item .hf-deck-mini{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}',
      '.deck-item .hf-deck-mini span{font-size:10px;font-weight:800;color:var(--muted);background:#f8fafc;border:1px solid #eef2f7;border-radius:999px;padding:4px 8px}',
      '@media(max-width:480px){.hf-session-status{grid-template-columns:1fr}.hf-next-action{display:grid}.hf-next-action a,.hf-next-action button{width:100%;text-align:center}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function getRatedCount() {
    return window.sessionResults ? Object.keys(window.sessionResults).length : 0;
  }

  function ensureSessionStatus() {
    var cardsView = document.getElementById('view-cards');
    var filterRow = document.getElementById('filterRow');
    if (!cardsView || !filterRow) return;
    var status = document.getElementById('hfSessionStatus');
    if (!status) {
      status = document.createElement('div');
      status.id = 'hfSessionStatus';
      status.className = 'hf-session-status';
      filterRow.insertAdjacentElement('afterend', status);
    }
    var total = window.currentCards ? window.currentCards.length : 0;
    var current = total ? ((window.currentIndex || 0) + 1) : 0;
    var rated = getRatedCount();
    status.innerHTML = '<div class="hf-session-chip"><b>' + current + '/' + total + '</b><span>kort</span></div>'
      + '<div class="hf-session-chip"><b>' + rated + '</b><span>vurdert</span></div>'
      + '<div class="hf-session-chip"><b>' + Math.max(0, total - rated) + '</b><span>igjen</span></div>';
  }

  function relabelRatingButtons() {
    var wrong = document.querySelector('.rate-btn.red');
    var half = document.querySelector('.rate-btn.yellow');
    var right = document.querySelector('.rate-btn.green');
    if (wrong) wrong.textContent = 'Igjen';
    if (half) half.textContent = 'Vanskelig';
    if (right) right.textContent = 'Bra';
  }

  function patchDeckList() {
    if (!window.currentSubjectId || typeof window.getDecksForSubject !== 'function' || typeof window.getStats !== 'function') return;
    var stats = window.getStats();
    document.querySelectorAll('.deck-item[data-deck-id]').forEach(function (item) {
      if (item.querySelector('.hf-deck-mini')) return;
      var id = item.getAttribute('data-deck-id');
      var data = stats[id] || {};
      var sessions = data.sessions || [];
      var cardStats = data.cardStats || {};
      var difficult = Object.keys(cardStats).filter(function (key) {
        return cardStats[key] && (cardStats[key].lastRating === 'wrong' || cardStats[key].lastRating === 'half');
      }).length;
      var last = sessions.length ? sessions[sessions.length - 1] : null;
      var mini = document.createElement('div');
      mini.className = 'hf-deck-mini';
      mini.innerHTML = '<span>' + (sessions.length ? sessions.length + ' økter' : 'ny økt') + '</span>'
        + '<span>' + difficult + ' å repetere</span>'
        + '<span>' + (last ? 'sist: ' + new Date(last.date).toLocaleDateString('no-NO', { day: 'numeric', month: 'short' }) : 'ikke startet') + '</span>';
      item.appendChild(mini);
    });
  }

  function getSubjectStore() {
    return readJson('hf_subject_stats', {});
  }

  function saveSubjectStore(store) {
    writeJson('hf_subject_stats', store);
  }

  function mirrorLatestDeckSession() {
    if (!window.currentDeck || !window.currentSubjectId || typeof window.getStats !== 'function') return;
    var deck = window.currentDeck;
    var stats = window.getStats();
    var deckStats = stats[deck.id] || {};
    var sessions = deckStats.sessions || [];
    var latest = sessions[sessions.length - 1];
    if (!latest || !latest.date) return;

    var key = subjectKey(window.currentSubjectId);
    var store = getSubjectStore();
    var subject = store[key] || { sessions: [], quizSessions: [] };
    subject.sessions = subject.sessions || [];
    subject.quizSessions = subject.quizSessions || [];

    var already = subject.sessions.some(function (session) {
      return session.sourceDeckId === deck.id && session.sourceSessionDate === latest.date;
    });
    if (already) return;

    subject.sessions.push({
      date: latest.date,
      sourceSessionDate: latest.date,
      sourceDeckId: deck.id,
      deckTitle: deck.title,
      subjectId: window.currentSubjectId,
      subjectName: getSubjectName(),
      results: latest.results || { right: 0, half: 0, wrong: 0 },
      total: latest.total || 0,
      filter: latest.filter || window.currentFilter || 'all'
    });
    store[key] = subject;
    saveSubjectStore(store);
  }

  function mirrorLatestQuizSession(deckId) {
    if (!window.currentSubjectId || typeof window.getStats !== 'function') return;
    var stats = window.getStats();
    var deckStats = stats[deckId] || {};
    var sessions = deckStats.quizSessions || [];
    var latest = sessions[sessions.length - 1];
    if (!latest || !latest.date) return;

    var key = subjectKey(window.currentSubjectId);
    var store = getSubjectStore();
    var subject = store[key] || { sessions: [], quizSessions: [] };
    subject.sessions = subject.sessions || [];
    subject.quizSessions = subject.quizSessions || [];
    var quizTitle = window.currentQuizDeck && window.currentQuizDeck.title || deckId;

    var already = subject.quizSessions.some(function (session) {
      return session.sourceDeckId === deckId && session.sourceSessionDate === latest.date;
    });
    if (already) return;

    subject.quizSessions.push({
      date: latest.date,
      sourceSessionDate: latest.date,
      sourceDeckId: deckId,
      deckTitle: quizTitle,
      subjectId: window.currentSubjectId,
      subjectName: getSubjectName(),
      score: latest.score || 0,
      total: latest.total || 0,
      pct: latest.pct || 0
    });
    store[key] = subject;
    saveSubjectStore(store);
  }

  function rememberLastRoute() {
    if (!window.currentSubjectId || !window.currentDeck) return;
    var routes = readJson('hf_last_flashcard_route', {});
    routes[subjectKey(window.currentSubjectId)] = {
      subjectId: window.currentSubjectId,
      deckId: window.currentDeck.id,
      deckTitle: window.currentDeck.title,
      url: window.location.pathname + '?subject=' + encodeURIComponent(window.currentSubjectId),
      date: new Date().toISOString()
    };
    writeJson('hf_last_flashcard_route', routes);
  }

  function patchEndScreen() {
    var end = document.getElementById('endScreen');
    if (!end || end.querySelector('.hf-next-action')) return;
    var actions = document.createElement('div');
    actions.className = 'hf-next-action';
    actions.innerHTML = '<button class="primary" type="button" data-hf-stats>Se statistikk</button>'
      + '<a href="' + getSubjectHomeUrl() + '">Åpne fagside</a>'
      + '<a href="' + rootRelative('user/index.html') + '">Dashboard</a>';
    end.appendChild(actions);
    var note = document.createElement('div');
    note.className = 'hf-session-note';
    note.textContent = 'Økten er lagret lokalt og brukes av dashboardet og progresjonssidene.';
    end.appendChild(note);
    var statsBtn = actions.querySelector('[data-hf-stats]');
    if (statsBtn) statsBtn.addEventListener('click', function () { window.showView('stats'); });
  }

  function patchStatsSection() {
    var section = document.getElementById('statsSection');
    if (!section || section.querySelector('.hf-session-note')) return;
    var note = document.createElement('div');
    note.className = 'hf-session-note';
    note.textContent = 'Tallene her er per deck. Dashboardet leser en samlet fagoversikt fra de samme øktene.';
    section.appendChild(note);
  }

  function patchProgressBar() {
    if (!window.currentCards || !window.currentCards.length) return;
    var fill = document.getElementById('cardProgress');
    if (!fill) return;
    fill.style.width = (((window.currentIndex || 0) + 1) / window.currentCards.length * 100) + '%';
  }

  function bindKeyboardShortcuts() {
    if (document.body.dataset.hfKeyboardShortcuts) return;
    document.body.dataset.hfKeyboardShortcuts = '1';
    document.addEventListener('keydown', function (event) {
      var tag = (event.target && event.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || event.metaKey || event.ctrlKey || event.altKey) return;
      var cardsActive = document.getElementById('view-cards') && document.getElementById('view-cards').classList.contains('active');
      if (!cardsActive) return;
      if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault();
        window.flipCard();
      }
      if (event.key === '1') clickVisible('.rate-btn.red');
      if (event.key === '2') clickVisible('.rate-btn.yellow');
      if (event.key === '3') clickVisible('.rate-btn.green');
      if (event.key.toLowerCase() === 'f') clickVisible('#finishDeckBtn');
    });
  }

  function clickVisible(selector) {
    var el = document.querySelector(selector);
    if (!el) return;
    var style = window.getComputedStyle(el.parentElement || el);
    if (style.display === 'none' || style.visibility === 'hidden') return;
    el.click();
  }

  function wrap(name, after) {
    if (typeof window[name] !== 'function' || window[name].__hfSessionWrapped) return false;
    var original = window[name];
    window[name] = function () {
      var result = original.apply(this, arguments);
      window.setTimeout(after, 0);
      return result;
    };
    window[name].__hfSessionWrapped = true;
    return true;
  }

  function install() {
    if (!isFlashcardsPage() || installed) return;
    injectStyles();
    relabelRatingButtons();
    bindKeyboardShortcuts();

    var needed = ['startDeck', 'renderCard', 'renderDecks', 'showEndScreen', 'renderStats', 'saveQuizResult'];
    var readyToWrap = needed.every(function (name) { return typeof window[name] === 'function'; });
    if (!readyToWrap) {
      tries++;
      if (tries < 80) window.setTimeout(install, 100);
      return;
    }

    installed = true;
    wrap('startDeck', function () {
      rememberLastRoute();
      ensureSessionStatus();
      relabelRatingButtons();
    });
    wrap('renderDecks', patchDeckList);
    wrap('renderCard', function () {
      ensureSessionStatus();
      relabelRatingButtons();
      patchProgressBar();
    });
    wrap('rateCard', function () {
      ensureSessionStatus();
      patchProgressBar();
    });
    wrap('showEndScreen', function () {
      mirrorLatestDeckSession();
      patchEndScreen();
      try { window.dispatchEvent(new CustomEvent('haugnes:flashcard-session-saved')); } catch (e) {}
    });
    wrap('renderStats', patchStatsSection);
    wrap('saveQuizResult', function () {
      var deck = window.currentQuizDeck && window.currentQuizDeck.id;
      if (deck) mirrorLatestQuizSession(deck);
    });

    patchDeckList();
    ensureSessionStatus();
    relabelRatingButtons();
  }

  ready(install);
  window.HaugnesFlashcardSession = {
    install: install,
    mirrorLatestDeckSession: mirrorLatestDeckSession,
    mirrorLatestQuizSession: mirrorLatestQuizSession
  };
})(window, document);
