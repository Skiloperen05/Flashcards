(function (window, document) {
  'use strict';
  if (window.HaugnesSubjectFlashcards) return;
  var match = window.location.pathname.match(
    /\/(ret14|sol1|sam2|sam3|met2|met3|mat10|sam1a|met1|ret1a|bed1|subject)\/(?:index\.html)?$/i,
  );
  if (!match) return;
  var params = new URLSearchParams(window.location.search);
  var subject =
    match[1].toLowerCase() === 'subject' ? params.get('id') || params.get('subject') : match[1].toLowerCase();
  if (!subject || subject.toLowerCase() === 'kom1') return;
  subject = subject.trim().toLowerCase();
  if (subject.toLowerCase() === 'sol1') subject = 'subj_sol1';
  var code = subject.replace(/^subj_/, '').toUpperCase();
  var root,
    decks = [],
    combined,
    cards = [],
    index = 0,
    results = {},
    revealed = false,
    finished = false;
  var selected = [],
    preferredLength = 20,
    custom = {},
    engine,
    store,
    session,
    previousView = 'setup',
    sessionMode = 'flashcards',
    quizChoices = [];
  var rootPath = window.AuthGuard.getRootPath();
  function asset(path) {
    return rootPath.replace(/\/$/, '/') + path;
  }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function load(file, global) {
    if (window[global]) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = asset('shared/' + file + '.js');
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  function pageVisible() {
    var page = window.HaugnesSubjectPages && window.HaugnesSubjectPages.get(subject);
    return !(page && page.visibility && page.visibility.flashcards === false);
  }
  function persistSummary(summary) {
    var all;
    try {
      all = JSON.parse(window.localStorage.getItem('hf_subject_stats') || '{}');
    } catch (e) {
      all = {};
    }
    var data = all[subject] || { sessions: [], quizSessions: [] };
    data.sessions = data.sessions || [];
    data.sessions.push(
      Object.assign({}, summary, {
        sourceSessionDate: summary.date,
        sourceDeckId: combined.id,
        deckTitle: combined.title,
        subjectId: subject,
        subjectName: code,
      }),
    );
    all[subject] = data;
    try {
      window.localStorage.setItem('hf_subject_stats', JSON.stringify(all));
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('haugnes:flashcard-session-saved'));
  }
  function focus() {
    root.focus({ preventScroll: true });
  }
  function view(name) {
    previousView = name;
    root.dataset.sfcActive = name;
    root.querySelectorAll('[data-sfc-view]').forEach(function (el) {
      el.hidden = el.dataset.sfcView !== name;
    });
    root.querySelector('[data-sfc-close]').hidden = name === 'intro';
    root.querySelector('[data-sfc-heading]').textContent =
      name === 'setup'
        ? 'Gjør klart en økt'
        : sessionMode === 'quiz' && name === 'cards'
          ? 'Quiz'
          : hasQuiz()
            ? 'Flashcards og quiz'
            : 'Flashcards';
    focus();
  }
  function updateSummary() {
    if (!decks.length) return;
    var all = engine.combine(
      decks,
      decks.map(function (d) {
        return d.id;
      }),
    );
    var state = engine.overview(all, store.get());
    root.querySelector('[data-sfc-entry-meta]').textContent = state.due
      ? state.due + ' klare for repetisjon'
      : state.fresh
        ? state.fresh + ' nye kort å utforske'
        : 'Du er ajour med repetisjonen';
    root.querySelector('[data-sfc-overview]').innerHTML =
      '<span><b>' +
      state.due +
      '</b> klare for repetisjon</span><span><b>' +
      state.fresh +
      '</b> nye kort</span><span><b>' +
      state.learned +
      '</b> i kurv 3–5</span>';
    root.querySelector('[data-sfc-baskets]').innerHTML = [1, 2, 3, 4, 5]
      .map(function (box) {
        return (
          '<div><span>' +
          box +
          ' · ' +
          engine.labels[box] +
          '</span><strong>' +
          state.boxes[box] +
          '<small> kort</small></strong><span>' +
          ['', '10 min', '1 dag', '3 dager', '7 dager', '21 dager'][box] +
          ' intervall</span></div>'
        );
      })
      .join('');
  }
  function options() {
    return {
      filter: root.querySelector('[name="sfc-filter"]').value,
      limit: Number(root.querySelector('[name="sfc-limit"]').value),
      order: 'smart',
    };
  }
  function hasQuiz() {
    return decks.some(function (deck) {
      return deck.cards.some(function (card) {
        return !!card.quiz;
      });
    });
  }
  function eligible(collection) {
    if (!collection || root.querySelector('[name="sfc-mode"]').value !== 'quiz') return collection;
    return Object.assign({}, collection, {
      cards: collection.cards.filter(function (card) {
        return !!card.quiz;
      }),
    });
  }
  function updateSelection() {
    selected = Array.from(root.querySelectorAll('[data-sfc-deck]:checked')).map(function (el) {
      return el.dataset.sfcDeck;
    });
    var hasQuiz = decks.some(function (deck) {
      return (
        selected.indexOf(deck.id) !== -1 &&
        deck.cards.some(function (card) {
          return !!card.quiz;
        })
      );
    });
    root.querySelector('[data-sfc-mode-field]').hidden = !hasQuiz;
    if (!hasQuiz) root.querySelector('[name="sfc-mode"]').value = 'flashcards';
    var collection = eligible(engine.combine(decks, selected));
    var available = collection
      ? engine.prepare(collection, store.get(), Object.assign({}, options(), { limit: 0 })).length
      : 0;
    var lengths = engine.sessionLengths(available, preferredLength);
    var lengthSelect = root.querySelector('[name="sfc-limit"]');
    lengthSelect.innerHTML = lengths.choices
      .map(function (choice) {
        return '<option value="' + choice.value + '">' + choice.label + '</option>';
      })
      .join('');
    lengthSelect.value = String(lengths.value);
    lengthSelect.disabled = !available;
    var size = lengths.value ? Math.min(lengths.value, available) : available;
    var button = root.querySelector('[data-sfc-start]');
    button.disabled = !size;
    button.textContent = size
      ? 'Start øving · ' + size + ' kort →'
      : selected.length
        ? options().filter === 'due'
          ? 'Ajour for nå'
          : 'Ingen kort i utvalget'
        : 'Velg minst ett dekk';
    root.querySelector('[data-sfc-available]').textContent = available + ' kort tilgjengelig i utvalget';
    root.querySelector('[data-sfc-deck-count]').textContent = selected.length + ' av ' + decks.length + ' valgt';
    root.querySelector('[data-sfc-selection]').textContent = size
      ? size + ' kort i økten · ' + (options().filter === 'due' ? 'repetisjon først' : 'ditt valgte utvalg')
      : selected.length
        ? 'Ingen kort passer valget. Velg alle kort for ekstra øving, eller kom tilbake til neste repetisjon.'
        : 'Velg dekkene du vil øve på nedenfor.';
    try {
      window.localStorage.setItem(
        'hf_study_options_v1',
        JSON.stringify(Object.assign({ scheduleVersion: 1, difficulty: 'all' }, options(), { limit: preferredLength })),
      );
    } catch (e) {}
  }
  function setup() {
    updateSummary();
    updateSelection();
    view('setup');
    root.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
  function start(deckId, retryCards) {
    var ids = deckId ? [deckId] : selected;
    if (!retryCards) sessionMode = root.querySelector('[name="sfc-mode"]').value;
    combined = eligible(engine.combine(decks, ids));
    if (!combined) return;
    cards = retryCards || engine.prepare(combined, store.get(), options());
    if (!cards.length) {
      setup();
      root.querySelector('[data-sfc-selection]').textContent =
        'Disse kortene trenger en pause. Velg alle kort for ekstra øving.';
      return;
    }
    index = 0;
    results = {};
    finished = false;
    revealed = false;
    session = { cards: cards.slice(), deckIds: combined.deckIds, id: combined.id, title: combined.title };
    root.querySelector('[data-sfc-feedback]').textContent = '';
    try {
      var routes = JSON.parse(window.localStorage.getItem('hf_last_flashcard_route') || '{}');
      routes[subject] = {
        subjectId: subject,
        deckId: combined.id,
        deckTitle: combined.title,
        url: window.location.pathname + window.location.search + '#flashcards',
        date: new Date().toISOString(),
      };
      window.localStorage.setItem('hf_last_flashcard_route', JSON.stringify(routes));
    } catch (e) {}
    view('cards');
    renderCard();
    root.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
  function renderCard() {
    revealed = false;
    var card = cards[index],
      cs = engine.cardStatsFor(store.get(), card),
      state = engine.schedule(cs);
    root.querySelector('[data-sfc-counter]').textContent =
      Object.keys(results).length + ' av ' + cards.length + ' gjennomgått';
    root.querySelector('[data-sfc-progress]').style.width = (Object.keys(results).length / cards.length) * 100 + '%';
    root.querySelector('[data-sfc-basket]').textContent = state.box
      ? 'Kurv ' + state.box + ' · ' + engine.labels[state.box]
      : 'Nytt kort · ta deg god tid';
    root.querySelector('[data-sfc-source-deck]').textContent = card.sourceDeckTitle;
    root.querySelector('[data-sfc-question]').textContent = sessionMode === 'quiz' ? card.quiz.q : card.q;
    root.querySelector('[data-sfc-answer]').textContent =
      sessionMode === 'quiz' ? card.quiz.options[card.quiz.correct] : card.a;
    root.querySelector('[data-sfc-explanation]').textContent = card.explanation || '';
    root.querySelector('[data-sfc-explanation]').hidden = !card.explanation;
    root.querySelector('[data-sfc-source]').textContent = card.source || '';
    root.querySelector('[data-sfc-answer-wrap]').hidden = true;
    root.querySelector('[data-sfc-reveal]').hidden = sessionMode === 'quiz';
    root.querySelector('[data-sfc-ratings]').hidden = true;
    var quiz = root.querySelector('[data-sfc-quiz]');
    quiz.hidden = sessionMode !== 'quiz';
    root.querySelector('[data-sfc-quiz-next]').hidden = true;
    if (sessionMode === 'quiz') {
      root.querySelector('[data-sfc-feedback]').textContent = '';
      quizChoices = card.quiz.options.map(function (text, i) {
        return { text: text, original: i };
      });
      for (var i = quizChoices.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1)),
          temp = quizChoices[i];
        quizChoices[i] = quizChoices[j];
        quizChoices[j] = temp;
      }
      quiz.innerHTML = quizChoices
        .map(function (choice, i) {
          return (
            '<button type="button" data-sfc-choice="' +
            i +
            '"><span aria-hidden="true">' +
            String.fromCharCode(65 + i) +
            '</span><span>' +
            esc(choice.text) +
            '</span><b data-sfc-choice-result></b></button>'
          );
        })
        .join('');
    } else quiz.innerHTML = '';
    var next = engine.nextSchedule(cs, 'right');
    root.querySelector('[data-sfc-next]').textContent =
      'Kurv ' + next.box + ' · ' + window.HaugnesFlashcardProgress.nextDate(next.dueAt);
  }
  function reveal() {
    if (previousView !== 'cards' || finished || sessionMode === 'quiz') return;
    revealed = true;
    root.querySelector('[data-sfc-answer-wrap]').hidden = false;
    root.querySelector('[data-sfc-reveal]').hidden = true;
    root.querySelector('[data-sfc-ratings]').hidden = false;
    focus();
  }
  function rate(rating) {
    if (!revealed || finished || previousView !== 'cards' || sessionMode === 'quiz') return;
    applyRating(rating);
    advance();
  }
  function answerQuiz(choiceIndex) {
    if (sessionMode !== 'quiz' || revealed || finished || previousView !== 'cards') return;
    var choice = quizChoices[choiceIndex],
      card = cards[index];
    if (!choice) return;
    revealed = true;
    var right = choice.original === card.quiz.correct;
    applyRating(right ? 'right' : 'wrong');
    root.querySelector('[data-sfc-answer-wrap]').hidden = false;
    root.querySelectorAll('[data-sfc-choice]').forEach(function (button, i) {
      button.disabled = true;
      var correct = quizChoices[i].original === card.quiz.correct;
      button.classList.toggle('sfc-correct', correct);
      button.classList.toggle('sfc-incorrect', i === choiceIndex && !right);
      button.querySelector('[data-sfc-choice-result]').textContent = correct
        ? 'Riktig svar'
        : i === choiceIndex
          ? 'Ditt svar'
          : '';
    });
    var nextButton = root.querySelector('[data-sfc-quiz-next]');
    nextButton.hidden = false;
    nextButton.textContent = index + 1 === cards.length ? 'Se oppsummering →' : 'Neste spørsmål →';
    nextButton.focus({ preventScroll: true });
  }
  function applyRating(rating) {
    var card = cards[index],
      stats = store.get();
    var next = engine.rate(stats, card, rating);
    results[card.idx] = rating;
    root.querySelector('[data-sfc-counter]').textContent =
      Object.keys(results).length + ' av ' + cards.length + ' gjennomgått';
    root.querySelector('[data-sfc-progress]').style.width = (Object.keys(results).length / cards.length) * 100 + '%';
    store.save(stats);
    updateSummary();
    root.querySelector('[data-sfc-feedback]').textContent =
      rating === 'right'
        ? 'Det satt! Kortet er i kurv ' +
          next.box +
          '. Neste repetisjon ' +
          window.HaugnesFlashcardProgress.nextDate(next.dueAt) +
          '.'
        : 'Dette øver vi mer på. Kortet kommer tilbake om 10 min.';
  }
  function advance() {
    if (finished || previousView !== 'cards' || !revealed) return;
    index++;
    if (index === cards.length) {
      finish();
      return;
    }
    renderCard();
    focus();
  }
  function finish() {
    if (finished || !Object.keys(results).length) return;
    finished = true;
    var stats = store.get(),
      summary = engine.record(stats, session, results, options().filter);
    store.save(stats);
    persistSummary(summary);
    var right = summary.results.right,
      wrong = summary.results.wrong + summary.results.half;
    root.querySelector('[data-sfc-end-title]').textContent =
      right === summary.total ? 'Dette kan du bygge videre på.' : 'En økt nærmere.';
    root.querySelector('[data-sfc-end-copy]').textContent =
      right === summary.total
        ? 'Alle kortene satt denne gangen. Gi dem litt tid, så tester vi igjen.'
        : right
          ? 'Du hentet frem det du kunne, og fant det som trenger litt mer øving. Begge deler er fremgang.'
          : 'Nå vet du hva du skal øve på. Kortene ligger klare i den første kurven – ta dem i ditt tempo.';
    root.querySelector('[data-sfc-end-stats]').innerHTML =
      '<span><b>' +
      right +
      '</b> kunne det</span><span><b>' +
      wrong +
      '</b> øver videre på</span><span><b>' +
      summary.total +
      '</b> kort gjennomgått</span>';
    var next = engine.overview(session, stats).nextDue;
    root.querySelector('[data-sfc-end-next]').textContent = next
      ? 'Neste planlagte repetisjon ' +
        window.HaugnesFlashcardProgress.nextDate(next) +
        '. Du kan ta en pause med god samvittighet.'
      : '';
    root.querySelector('[data-sfc-retry]').hidden = !wrong;
    view('end');
    root.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
  function open(deckId) {
    if (!root || root.hidden) return;
    if (deckId) {
      if (previousView === 'cards' && !finished && Object.keys(results).length) finish();
      if (
        decks.some(function (deck) {
          return deck.id === deckId;
        })
      ) {
        root.querySelectorAll('[data-sfc-deck]').forEach(function (input) {
          input.checked = input.dataset.sfcDeck === deckId;
        });
      }
      setup();
    } else if (previousView !== 'cards' || finished) setup();
    root.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
  function patchLinks() {
    document.querySelectorAll('a[href]').forEach(function (link) {
      if (link.closest('.hf-global-sidebar,.sidebar,.hf-mobile-bottom-nav')) return;
      var url;
      try {
        url = new URL(link.getAttribute('href'), window.location.href);
      } catch (e) {
        return;
      }
      if (url.origin !== window.location.origin || url.searchParams.get('mode') === 'quiz') return;
      var target = (url.searchParams.get('subject') || '').toLowerCase();
      var localShortcut =
        ['flashcardsTabLink', 'heroPrimaryAction', 'ctaAction', 'asideFlashcardsLink'].indexOf(link.id) !== -1 ||
        (link.closest('.hf-tabbar,.semester-tabs') && /^Flashcards\s*[↗→]?$/.test(link.textContent.trim()));
      var generic =
        /\/flashcards\/(?:index\.html)?$/.test(url.pathname) &&
        (target === subject || target === subject.replace('subj_', '') || (!target && localShortcut));
      var sam3 = subject === 'sam3' && /\/sam3\/flashcards\.html$/.test(url.pathname);
      if (!generic && !sam3) return;
      link.dataset.subjectStudy = '1';
      if (url.searchParams.get('deck')) link.dataset.subjectStudyDeck = url.searchParams.get('deck');
      else if (link.classList.contains('hf-tool-card')) link.setAttribute('data-sfc-inline-entry', '');
      link.href = '#flashcards';
    });
  }
  function mount() {
    var main = document.querySelector('main');
    if (!main || document.getElementById('flashcards')) return;
    var meta = window.HaugnesSubjects && window.HaugnesSubjects.findById(subject);
    if (meta && meta.code) code = meta.code;
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = asset('shared/subject-flashcards.css');
    document.head.appendChild(css);
    root = document.createElement('section');
    root.id = 'flashcards';
    root.className = 'subject-flashcards';
    root.tabIndex = -1;
    root.setAttribute('aria-label', 'Flashcards i ' + code);
    root.innerHTML =
      `
      <div class="sfc-heading">
        <div class="sfc-heading-content">
          <span class="sfc-entry-icon" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><rect x="9" y="5" width="17" height="22" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M6 9H5a2 2 0 0 0-2 2v15a3 3 0 0 0 3 3h13M14 12h7m-7 5h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>
          <div><span class="sfc-eyebrow">Øving i ${esc(code)}</span><h2 data-sfc-heading>Flashcards</h2><p class="sfc-description">En liten økt nå. Litt mer som sitter neste gang.</p></div>
        </div>
        <button type="button" data-sfc-close hidden>Tilbake til faget</button>
      </div>
      <div class="sfc-entry-actions" data-sfc-view="intro">
        <span data-sfc-entry-meta></span><button class="sfc-primary" type="button" data-sfc-open>Velg økt <span aria-hidden="true">→</span></button>
      </div>
      <div data-sfc-view="setup" hidden>
        <div class="sfc-setup-layout">
          <details class="sfc-deck-picker" open>
            <summary><span>01 · Velg dekk</span><small data-sfc-deck-count></small></summary>
            <div class="sfc-select-actions"><button type="button" data-sfc-all>Velg alle</button><button type="button" data-sfc-none>Fjern valg</button></div>
            <div class="sfc-decks" data-sfc-decks></div>
          </details>
          <div class="sfc-session-plan">
            <h3>02 · Din økt</h3><p class="sfc-available" data-sfc-available></p>
            <label class="sfc-mode-field" data-sfc-mode-field hidden>Øvingsform<select name="sfc-mode"><option value="flashcards">Flashcards · hent frem svaret selv</option><option value="quiz">Quiz · velg blant fire alternativer</option></select><small>Begge øvingsformer deler repetisjonskurvene dine.</small></label>
            <div class="sfc-setup">
              <label>Kortutvalg<select name="sfc-filter"><option value="due">Repetisjon + nye</option><option value="all">Alle kort · ekstra øving</option><option value="review">Øv mer på vanskelige</option><option value="new">Bare nye kort</option></select></label>
              <label>Øktlengde<select name="sfc-limit"><option value="20">20 kort</option></select></label>
            </div>
            <div class="sfc-session-start"><p data-sfc-selection class="sfc-muted" role="status"></p><button class="sfc-primary" type="button" data-sfc-start>Start øving →</button></div>
          </div>
        </div>
        <details class="sfc-progress-details"><summary>Fremgangen din og repetisjonskurvene</summary>
          <div class="sfc-overview" data-sfc-overview></div><div class="sfc-baskets" data-sfc-baskets aria-label="Dine fem repetisjonskurver"></div>
          <details class="sfc-method"><summary>Slik fungerer kurvene</summary><p>«Kunne det» flytter nye kort til kurv 2. Ved planlagt repetisjon flyttes riktige svar én kurv videre. «Øv mer» sender alltid kortet tilbake til kurv 1. Ekstra riktige svar før fristen beholder kurven og tidspunktet. Nye kort venter utenfor kurvene til du prøver dem.</p></details>
        </details>
      </div>` +
      '<div data-sfc-view="cards" hidden><div class="sfc-session-bar"><button type="button" data-sfc-back>← Til dekk</button><span data-sfc-counter></span></div><div class="sfc-progress"><i data-sfc-progress></i></div><p class="sfc-feedback" data-sfc-feedback role="status" aria-live="polite"></p><div class="sfc-card"><span class="sfc-card-basket" data-sfc-basket></span><span class="sfc-source-deck" data-sfc-source-deck></span><h3 data-sfc-question></h3><div class="sfc-quiz" data-sfc-quiz hidden aria-label="Svaralternativer"></div><div data-sfc-answer-wrap hidden><span class="sfc-answer-label">Svar</span><p data-sfc-answer></p><p class="sfc-explanation" data-sfc-explanation hidden></p><small data-sfc-source></small></div></div>' +
      '<button class="sfc-primary sfc-reveal" type="button" data-sfc-quiz-next hidden>Neste spørsmål →</button><button class="sfc-primary sfc-reveal" type="button" data-sfc-reveal>Vis svar <kbd>mellomrom</kbd></button><div class="sfc-ratings" data-sfc-ratings hidden><button type="button" data-sfc-rate="wrong"><span>Øv mer <kbd>1</kbd></span><small>Kurv 1 · om 10 min</small></button><button type="button" data-sfc-rate="right"><span>Kunne det <kbd>2</kbd></span><small data-sfc-next></small></button></div><p class="sfc-note">Du trenger ikke kunne alt nå. Hvert forsøk hjelper deg videre.</p><button class="sfc-finish" type="button" data-sfc-finish>Avslutt og se oppsummering →</button></div>' +
      '<div class="sfc-end" data-sfc-view="end" hidden><div class="sfc-end-mark" aria-hidden="true">✓</div><span class="sfc-eyebrow">Økten er lagret</span><h3 data-sfc-end-title></h3><p data-sfc-end-copy></p><div class="sfc-overview" data-sfc-end-stats></div><p data-sfc-end-next class="sfc-note"></p><button class="sfc-primary" type="button" data-sfc-retry>Øv litt mer på de vanskelige →</button><button type="button" data-sfc-back>Til dekk og fremgang</button></div><p class="sfc-sync" data-sfc-sync role="status"></p>';
    var tools = main.querySelector('#met3Decks,#toolGrid,.hf-card-grid');
    var closing = main.querySelector('.semester-closing');
    if (tools) tools.before(root);
    else if (closing) closing.before(root);
    else main.appendChild(root);
    if (root.parentElement === main && !main.classList.contains('semester-main')) root.classList.add('hf-shell');
    root.querySelector('[data-sfc-deck-count]').textContent = '· ' + decks.length + ' dekk';
    root.querySelector('[data-sfc-decks]').innerHTML = decks
      .map(function (d) {
        return (
          '<label><input type="checkbox" checked data-sfc-deck="' +
          esc(d.id) +
          '"><span><b>' +
          esc(d.title) +
          '</b><small>' +
          d.cards.length +
          ' kort' +
          (d.description ? ' · ' + esc(d.description) : '') +
          '</small></span></label>'
        );
      })
      .join('');
    root.querySelector('[data-sfc-open]').disabled = !decks.length;
    if (hasQuiz()) {
      root.setAttribute('aria-label', 'Flashcards og quiz i ' + code);
      root.querySelector('.sfc-description').textContent =
        'Hent frem svaret selv, eller prøv en quiz. Litt mer sitter hver gang.';
    }
    if (!decks.length)
      root.querySelector('.sfc-description').textContent = 'Det er ikke publisert noen flashcards i dette faget ennå.';
    try {
      var prefs = JSON.parse(window.localStorage.getItem('hf_study_options_v1') || '{}');
      var settings = JSON.parse(window.localStorage.getItem('hf_user_settings_v2') || '{}');
      var length = Number(prefs.scheduleVersion === 1 ? prefs.limit : settings.sessionLen || 20);
      if (Number.isFinite(length) && length >= 0) preferredLength = length;
      if (prefs.scheduleVersion === 1 && ['due', 'all', 'review', 'new'].indexOf(prefs.filter) !== -1)
        root.querySelector('[name="sfc-filter"]').value = prefs.filter;
    } catch (e) {}
    root.onclick = function (event) {
      var button = event.target.closest('button');
      if (!button) return;
      if (button.hasAttribute('data-sfc-open') || button.hasAttribute('data-sfc-back')) {
        if (previousView === 'cards' && Object.keys(results).length && !finished) finish();
        else setup();
      }
      if (button.hasAttribute('data-sfc-close')) {
        if (previousView === 'cards' && !finished && Object.keys(results).length) finish();
        else view('intro');
      }
      if (button.hasAttribute('data-sfc-start')) start();
      if (button.hasAttribute('data-sfc-reveal')) reveal();
      if (button.dataset.sfcRate) rate(button.dataset.sfcRate);
      if (button.hasAttribute('data-sfc-choice')) answerQuiz(Number(button.dataset.sfcChoice));
      if (button.hasAttribute('data-sfc-quiz-next')) advance();
      if (button.hasAttribute('data-sfc-finish')) {
        if (Object.keys(results).length) finish();
        else
          root.querySelector('[data-sfc-feedback]').textContent =
            'Prøv minst ett kort før du avslutter, eller gå tilbake til dekkene.';
      }
      if (button.hasAttribute('data-sfc-all') || button.hasAttribute('data-sfc-none')) {
        root.querySelectorAll('[data-sfc-deck]').forEach(function (el) {
          el.checked = button.hasAttribute('data-sfc-all');
        });
        updateSelection();
      }
      if (button.hasAttribute('data-sfc-retry')) {
        var retry = session.cards.filter(function (card) {
          return results[card.idx] === 'wrong' || results[card.idx] === 'half';
        });
        selected = session.deckIds;
        start(null, retry);
      }
    };
    root.onchange = function (event) {
      if (event.target.name === 'sfc-limit') preferredLength = Number(event.target.value);
      updateSelection();
    };
    root.onkeydown = function (event) {
      if (
        previousView !== 'cards' ||
        sessionMode === 'quiz' ||
        /INPUT|SELECT|TEXTAREA/.test(event.target.tagName) ||
        event.target.isContentEditable ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.repeat
      )
        return;
      if ((event.code === 'Space' || event.key === 'Enter') && event.target.tagName !== 'BUTTON') {
        event.preventDefault();
        if (!revealed) reveal();
      }
      if (event.key === '1' || event.key === '2') {
        event.preventDefault();
        rate(event.key === '1' ? 'wrong' : 'right');
      }
    };
    document.addEventListener('click', function (event) {
      var link = event.target.closest('a[data-subject-study]');
      if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button) return;
      event.preventDefault();
      window.history.replaceState(null, '', '#flashcards');
      open(link.dataset.subjectStudyDeck);
    });
    window.addEventListener('haugnes:flashcard-sync', function (event) {
      root.querySelector('[data-sfc-sync]').textContent = event.detail;
    });
    window.addEventListener('haugnes:subject-studio-changed', function () {
      root.hidden = !pageVisible();
      patchLinks();
    });
    window.addEventListener('haugnes:subject-access-changed', patchLinks);
    updateSummary();
    updateSelection();
    view('intro');
    root.hidden = !pageVisible();
    patchLinks();
    // Renderers can update tool links after remote subject metadata arrives.
    var observer = new MutationObserver(function () {
      patchLinks();
    });
    observer.observe(main, { childList: true, subtree: true });
    if (window.location.hash === '#flashcards') open(params.get('deck'));
    window.setInterval(function () {
      if (previousView === 'setup' || previousView === 'intro') {
        updateSummary();
        updateSelection();
      }
    }, 60000);
  }
  var files = [
    ['learning-content', 'HaugnesLearningContent'],
    ['haugnes-study-data', 'HaugnesStudyData'],
    ['flashcard-study-session', 'HaugnesStudySession'],
    ['flashcard-progress', 'HaugnesFlashcardProgress'],
    ['flashcard-library', 'HaugnesFlashcardLibrary'],
    ['flashcard-store', 'HaugnesFlashcardStore'],
  ];
  if (subject === 'rrr11') files.splice(4, 0, ['rrr11-coso-study', 'HaugnesCosoStudy']);
  if (subject === 'sam3') files.splice(4, 0, ['sam3-flashcard-catalog', 'HaugnesSam3Flashcards']);
  var ready = files.reduce(function (chain, item) {
    return chain.then(function () {
      return load(item[0], item[1]);
    });
  }, Promise.resolve());
  ready
    .then(function () {
      return window.AuthGuard.requireAuth();
    })
    .then(function (auth) {
      if (!auth) return;
      engine = window.HaugnesStudySession;
      store = window.HaugnesFlashcardStore;
      var client = auth.user.email === 'dev@student.local' ? null : window.AuthGuard.getClient();
      var content = client
        ? Promise.resolve(
            client.from('admin_content').select('content').eq('key', 'flashcards_custom_data').maybeSingle(),
          )
            .then(function (result) {
              if (result.data && result.data.content) {
                custom = result.data.content.flashcardsCustom || result.data.content;
                return;
              }
              return Promise.resolve(
                client.from('user_custom_data').select('data').eq('user_id', auth.user.id).maybeSingle(),
              ).then(function (legacy) {
                if (legacy.data && legacy.data.data) custom = legacy.data.data.flashcardsCustom || legacy.data.data;
              });
            })
            .catch(function () {})
        : Promise.resolve();
      return Promise.all([store.open(auth.user, client), content]).then(function () {
        if (!Object.keys(custom).length) {
          try {
            custom = JSON.parse(window.localStorage.getItem('fc_custom_data') || '{}');
          } catch (e) {}
        }
        decks = window.HaugnesFlashcardLibrary.decksFor(subject, custom);
        mount();
      });
    })
    .catch(function (error) {
      console.warn('Kunne ikke laste flashcards i faget:', error);
    });
  window.HaugnesSubjectFlashcards = { open: open };
})(window, document);
