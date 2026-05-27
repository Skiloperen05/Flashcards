(function (window, document) {
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function byId(id) { return document.getElementById(id); }

  var SUBJECT_META = {
    ret14: {
      label: 'RET14 Skatterett',
      short: 'RET14',
      path: '../ret14/',
      accent: '#2f62ff',
      description: 'Skatt, fradrag, personinntekt, aksjer og eksamensnære temaer.'
    },
    subj_sol1: {
      label: 'SOL1 Organisasjonsatferd',
      short: 'SOL1',
      path: '../sol1/',
      accent: '#20b97a',
      description: 'Begreper, teorier, modeller og teoriskriving for SOL1.'
    }
  };

  function getSubjectId() {
    return window.currentSubjectId || new URLSearchParams(window.location.search).get('subject') || null;
  }

  function getSubjectMeta() {
    var id = getSubjectId();
    var meta = SUBJECT_META[id];
    if (meta) return meta;
    if (typeof window.getAllSubjects === 'function') {
      var subject = window.getAllSubjects().find(function (s) { return s.id === id; });
      if (subject) {
        return {
          label: subject.name,
          short: subject.name,
          path: null,
          accent: subject.color || '#2f62ff',
          description: 'Egendefinert fag med egne deck og kort.'
        };
      }
    }
    return null;
  }

  function currentViewName() {
    var active = document.querySelector('.view.active');
    if (!active || !active.id) return 'home';
    return active.id.replace(/^view-/, '');
  }

  function setBodyState() {
    var view = currentViewName();
    var meta = getSubjectMeta();
    document.body.setAttribute('data-fc-view', view);
    if (meta) {
      document.body.setAttribute('data-fc-subject', meta.short);
      document.documentElement.style.setProperty('--hf-subject-accent', meta.accent);
    } else {
      document.body.removeAttribute('data-fc-subject');
      document.documentElement.style.setProperty('--hf-subject-accent', '#2f62ff');
    }
    if (window.currentDeck && window.currentDeck.title) document.body.setAttribute('data-fc-deck', window.currentDeck.title);
    else document.body.removeAttribute('data-fc-deck');
  }

  function setText(id, value) {
    var el = byId(id);
    if (el) el.textContent = value;
  }

  function updateHeaderCopy() {
    var view = currentViewName();
    var meta = getSubjectMeta();
    if (view === 'home') {
      setText('headerTitle', 'Flashcards');
      setText('headerSub', 'Velg fag, fortsett øving eller importer egne kort.');
    }
    if (view === 'decks' && meta) {
      setText('headerTitle', meta.label);
      setText('headerSub', 'Velg flashcard-deck eller quiz.');
    }
    if (view === 'cards') {
      setText('headerSub', meta ? meta.label : 'Flashcards');
    }
    if (view === 'stats' && meta) {
      setText('headerTitle', 'Fremgang');
      setText('headerSub', meta.label);
    }
  }

  function ensureIntro(viewId, key, title, text, actionsHtml) {
    var view = byId(viewId);
    if (!view) return;
    var existing = view.querySelector('.hf-view-intro[data-key="' + key + '"]');
    if (existing) {
      existing.querySelector('.hf-view-intro-title').textContent = title;
      existing.querySelector('.hf-view-intro-text').textContent = text;
      var actions = existing.querySelector('.hf-view-actions');
      if (actions) actions.innerHTML = actionsHtml || '';
      return;
    }
    var intro = document.createElement('section');
    intro.className = 'hf-view-intro';
    intro.setAttribute('data-key', key);
    intro.innerHTML = '<div><div class="hf-view-kicker">Haugnes Flashcards</div><h2 class="hf-view-intro-title"></h2><p class="hf-view-intro-text"></p></div><div class="hf-view-actions"></div>';
    intro.querySelector('.hf-view-intro-title').textContent = title;
    intro.querySelector('.hf-view-intro-text').textContent = text;
    intro.querySelector('.hf-view-actions').innerHTML = actionsHtml || '';
    view.insertBefore(intro, view.firstChild);
  }

  function enhanceHome() {
    ensureIntro(
      'view-home',
      'home',
      'Velg fag og start øving',
      'Her finner du alle flashcard-fagene dine. Fagkortene åpner først en ryddig deck-oversikt.',
      '<a class="hf-mini-link" href="../user/index.html">← Dashboard</a>'
    );

    document.querySelectorAll('.subject-card[data-id]').forEach(function (card) {
      var id = card.getAttribute('data-id');
      var meta = SUBJECT_META[id];
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      if (meta) {
        card.setAttribute('aria-label', 'Åpne ' + meta.label);
        var body = card.querySelector('.subject-card-body');
        if (body && !body.querySelector('.hf-subject-desc')) {
          var desc = document.createElement('p');
          desc.className = 'hf-subject-desc';
          desc.textContent = meta.description;
          body.insertBefore(desc, body.firstChild);
        }
      }
    });
  }

  function enhanceDecks() {
    var meta = getSubjectMeta();
    if (!meta) return;
    var actions = meta.path ? '<a class="hf-mini-link" href="' + meta.path + '">← Til fagside</a>' : '';
    actions += '<button class="hf-mini-link hf-mini-button" type="button" data-hf-stats>Se fremgang</button>';
    ensureIntro(
      'view-decks',
      'decks',
      'Velg økt i ' + meta.short,
      'Start med et deck, bytt til quiz, eller se fremgangen din for dette faget.',
      actions
    );

    var statsButton = document.querySelector('[data-hf-stats]');
    if (statsButton && typeof window.showView === 'function') {
      statsButton.onclick = function () { window.showView('stats'); };
    }

    document.querySelectorAll('.deck-item').forEach(function (deck) {
      if (!deck.querySelector('.hf-deck-action')) {
        var action = document.createElement('span');
        action.className = 'hf-deck-action';
        action.textContent = 'Start økt →';
        deck.appendChild(action);
      }
    });
  }

  function enhanceCards() {
    var meta = getSubjectMeta();
    if (!meta) return;
    var title = window.currentDeck && window.currentDeck.title ? window.currentDeck.title : 'Flashcard-økt';
    ensureIntro(
      'view-cards',
      'cards',
      title,
      'Snu kortet, vurder svaret ditt og fullfør økten når du er ferdig.',
      '<span class="hf-session-chip">' + meta.short + '</span>'
    );

    var wrong = document.querySelector('.rate-btn.red');
    var half = document.querySelector('.rate-btn.yellow');
    var right = document.querySelector('.rate-btn.green');
    if (wrong) wrong.textContent = 'Igjen';
    if (half) half.textContent = 'Vanskelig';
    if (right) right.textContent = 'Bra';
  }

  function enhanceStats() {
    var meta = getSubjectMeta();
    if (!meta) return;
    ensureIntro(
      'view-stats',
      'stats',
      'Fremgang i ' + meta.short,
      'Se økter, kort besvart, historikk og quizresultater for dette faget.',
      '<button class="hf-mini-link hf-mini-button" type="button" data-hf-back-decks>Tilbake til deck</button>'
    );
    var backButton = document.querySelector('[data-hf-back-decks]');
    if (backButton && typeof window.showView === 'function') {
      backButton.onclick = function () { window.showView('decks'); };
    }
  }

  function enhanceQuiz() {
    var meta = getSubjectMeta();
    if (!meta) return;
    ensureIntro(
      'view-quiz-play',
      'quiz-play',
      'Quiz i ' + meta.short,
      'Svar på spørsmålene, les forklaringen og gå videre når du er klar.',
      '<span class="hf-session-chip">Quiz</span>'
    );
  }

  function enhanceAll() {
    setBodyState();
    updateHeaderCopy();
    enhanceHome();
    enhanceDecks();
    enhanceCards();
    enhanceStats();
    enhanceQuiz();
  }

  function wrap(name, after) {
    if (typeof window[name] !== 'function' || window[name].__hfWrapped) return false;
    var original = window[name];
    var wrapped = function () {
      var result = original.apply(this, arguments);
      window.setTimeout(after, 0);
      return result;
    };
    wrapped.__hfWrapped = true;
    window[name] = wrapped;
    return true;
  }

  function install() {
    var tries = 0;
    var timer = window.setInterval(function () {
      tries++;
      var ok = typeof window.showView === 'function' && typeof window.renderHome === 'function' && typeof window.renderDecks === 'function';
      if (!ok && tries < 80) return;
      window.clearInterval(timer);

      wrap('showView', enhanceAll);
      wrap('renderHome', enhanceHome);
      wrap('renderDecks', enhanceDecks);
      wrap('renderCard', enhanceCards);
      wrap('renderStats', enhanceStats);
      wrap('startDeck', enhanceAll);
      wrap('showEndScreen', enhanceAll);
      enhanceAll();
    }, 50);
  }

  ready(install);
})(window, document);
