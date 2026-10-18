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
    if (key === 'met3') return rootRelative('met3/');
    if (key === 'ret14') return rootRelative('ret14/');
    if (key === 'subj_sol1') return rootRelative('sol1/');
    if (key === 'sam2') return rootRelative('sam2/');
    if (key === 'sam3') return rootRelative('sam3/');
    return rootRelative('user/subjects.html');
  }

  function showToast(message) {
    if (typeof window.showToast === 'function') window.showToast(message);
  }

  function getUserSettings() {
    if (window.HaugnesUserSettings && typeof window.HaugnesUserSettings.getAll === 'function') return window.HaugnesUserSettings.getAll();
    var stored = readJson('hf_user_settings_v2', {});
    return {
      sessionLen: stored.sessionLen != null ? stored.sessionLen : 50,
      startWith: stored.startWith || 'repetisjon',
      autoDiff: stored.autoDiff !== false,
      examMode: stored.examMode !== false,
      sound: !!stored.sound
    };
  }

  var audioContext = null;

  function playTones(freqs) {
    if (!getUserSettings().sound) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioContext) audioContext = new Ctx();
      var start = audioContext.currentTime;
      freqs.forEach(function (freq, i) {
        var osc = audioContext.createOscillator();
        var gain = audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        var at = start + i * 0.09;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.05, at + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.15);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(at);
        osc.stop(at + 0.17);
      });
    } catch (e) {}
  }

  function playRatingSound(rating) {
    if (rating === 'right') playTones([620]);
    else if (rating === 'half') playTones([420]);
    else playTones([260]);
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
    var latest = window.currentSessionSummary || sessions[sessions.length - 1];
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
    note.textContent = 'Fremgangen din lagres etter hvert svar. Økten er også med i fagoversikten din.';
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

    var needed = ['startDeck', 'renderCard', 'renderDecks', 'showEndScreen', 'renderStats', 'saveQuizResult'];
    var readyToWrap = needed.every(function (name) { return typeof window[name] === 'function'; });
    if (!readyToWrap) {
      tries++;
      if (tries < 80) window.setTimeout(install, 100);
      return;
    }

    installed = true;
    wrap('startDeck', rememberLastRoute);
    var originalRate = window.rateCard;
    window.rateCard = function (rating) {
      if (window.isFlipped && !window.sessionSaved) playRatingSound(rating);
      return originalRate.apply(this, arguments);
    };
    wrap('showEndScreen', function () {
      playTones([523, 659, 784]);
      mirrorLatestDeckSession();
      patchEndScreen();
      try { window.dispatchEvent(new CustomEvent('haugnes:flashcard-session-saved')); } catch (e) {}
    });
    wrap('renderStats', patchStatsSection);
    wrap('saveQuizResult', function () {
      var deck = window.currentQuizDeck && window.currentQuizDeck.id;
      if (deck) mirrorLatestQuizSession(deck);
    });

  }

  ready(install);
  window.HaugnesFlashcardSession = {
    install: install,
    mirrorLatestDeckSession: mirrorLatestDeckSession,
    mirrorLatestQuizSession: mirrorLatestQuizSession
  };
})(window, document);
