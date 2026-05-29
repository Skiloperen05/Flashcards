(function (window, document) {
  'use strict';

  var retryCounts = {};

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function rootRelative(path) {
    if (window.AuthGuard && typeof window.AuthGuard.getRootPath === 'function') {
      return window.AuthGuard.getRootPath().replace(/\/$/, '/') + path.replace(/^\//, '');
    }
    return '../' + path.replace(/^\//, '');
  }

  function pageName() {
    return (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  }

  function inUserPage(name) {
    return /\/user\//.test(window.location.pathname) && (!name || pageName() === name);
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

  function retry(key, fn, max, delay) {
    retryCounts[key] = (retryCounts[key] || 0) + 1;
    if (retryCounts[key] > (max || 20)) return;
    window.setTimeout(fn, delay || 100);
  }

  function injectUtilityStyles() {
    if (document.getElementById('hf-functional-enhancements-css')) return;
    var style = document.createElement('style');
    style.id = 'hf-functional-enhancements-css';
    style.textContent = [
      '.hf-muted-link{opacity:.72;cursor:not-allowed}',
      '.hf-action-toast{position:fixed;right:18px;bottom:18px;z-index:9999;max-width:320px;padding:12px 14px;border-radius:14px;background:rgba(7,23,51,.96);border:1px solid rgba(126,162,255,.28);box-shadow:0 18px 48px rgba(0,0,0,.34);color:#f8fbff;font:800 13px/1.45 Lora,Georgia,serif;transform:translateY(10px);opacity:0;pointer-events:none;transition:.22s ease}',
      '.hf-action-toast.show{transform:translateY(0);opacity:1}',
      '.event{cursor:pointer;transition:.18s ease}',
      '.event.is-done{opacity:.58;text-decoration:line-through;filter:saturate(.75)}',
      '.event.is-done::after{content:"✓";float:right;font-weight:900}',
      '.note-tab{cursor:pointer}',
      '.setting .toggle,.settings-grid .tag,.icon-btn{cursor:pointer}',
      '.toggle{transition:.18s ease}',
      '.toggle.on{box-shadow:0 0 0 1px rgba(32,185,122,.35),0 0 24px rgba(32,185,122,.18)}',
      '.model-card[hidden],.answer-card[hidden]{display:none!important}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function toast(message) {
    var el = document.querySelector('.hf-action-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'hf-action-toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    window.clearTimeout(el.__timer);
    el.__timer = window.setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  function enhanceABesvarelserPage() {
    if (!inUserPage('a-besvarelser.html')) return;
    if (!window.answers || typeof window.render !== 'function') {
      retry('answers-page', enhanceABesvarelserPage, 30, 120);
      return;
    }

    if (!window.__hfRealAnswersInserted) {
      var realAnswers = [
        {
          course: 'SAM3', icon: '↗', color: '#ef4444', term: 'V25',
          title: 'A-besvarelse SAM3 V25', subtitle: 'Makroøkonomi', type: 'analyse',
          desc: 'PDF fra Google Drive. Bruk den etter egen gjennomføring for å sammenligne struktur, modellbruk og drøfting.',
          meta: ['A', 'PDF', 'V25'], popular: 0,
          url: 'https://drive.google.com/file/d/1yCI-f4BKMTllsLc5ZMgh6pj0TIA428x5/view',
          download: 'https://drive.google.com/uc?export=download&id=1yCI-f4BKMTllsLc5ZMgh6pj0TIA428x5'
        },
        {
          course: 'SAM3', icon: '↗', color: '#ef4444', term: 'V25',
          title: 'SAM3 skoleeksamen V25', subtitle: 'Makroøkonomi', type: 'analyse',
          desc: 'Original eksamensoppgave for våren 2025. Gjennomfør den først, og sammenlign deretter med A-besvarelsen.',
          meta: ['Eksamen', 'PDF', 'V25'], popular: 1,
          url: 'https://drive.google.com/file/d/1VKZwcmQF9zGlR2Hwtjy0UnKWlhHEf7_5/view',
          download: 'https://drive.google.com/uc?export=download&id=1VKZwcmQF9zGlR2Hwtjy0UnKWlhHEf7_5'
        },
        {
          course: 'SAM3', icon: '↗', color: '#ef4444', term: 'V25',
          title: 'SAM3 sensorveiledning V25', subtitle: 'Makroøkonomi', type: 'analyse',
          desc: 'Sensorveiledning for våren 2025. Nyttig når du vil forstå hva sensor faktisk belønner.',
          meta: ['Sensor', 'PDF', 'V25'], popular: 2,
          url: 'https://drive.google.com/file/d/1NfPdS7qBr_c7l36XXX2RfqN6nqu-tjzi/view',
          download: 'https://drive.google.com/uc?export=download&id=1NfPdS7qBr_c7l36XXX2RfqN6nqu-tjzi'
        }
      ];
      realAnswers.reverse().forEach(function (answer) {
        var exists = window.answers.some(function (item) { return item.course === answer.course && item.title === answer.title; });
        if (!exists) window.answers.unshift(answer);
      });
      window.__hfRealAnswersInserted = true;
    }

    function patchAnswerLinks() {
      document.querySelectorAll('.answer-card').forEach(function (card) {
        var titleEl = card.querySelector('.answer-title');
        var courseEl = card.querySelector('.badge-stack .badge:last-child');
        if (!titleEl) return;
        var title = titleEl.textContent.trim();
        var course = courseEl ? courseEl.textContent.trim() : '';
        var item = window.answers.find(function (answer) { return answer.title === title && (!course || answer.course === course); });
        var open = card.querySelector('.open-btn');
        if (open && item && item.url) {
          open.href = item.url;
          open.target = '_blank';
          open.rel = 'noopener';
          open.textContent = 'Åpne PDF';
        } else if (open && open.getAttribute('href') === '#') {
          open.classList.add('hf-muted-link');
          open.addEventListener('click', function (event) {
            event.preventDefault();
            toast('Denne besvarelsen er et planlagt eksempel. PDF kobles på senere.');
          }, { once: true });
        }
        var more = card.querySelector('.ghost-btn[title="Mer"]');
        if (more && item && item.download) {
          more.href = item.download;
          more.title = 'Last ned';
          more.textContent = '↓';
        }
      });
    }

    if (!window.render.__hfWrapped) {
      var originalRender = window.render;
      window.render = function () {
        var result = originalRender.apply(this, arguments);
        window.setTimeout(patchAnswerLinks, 0);
        return result;
      };
      window.render.__hfWrapped = true;
    }

    if (!document.body.__hfAnswerFavorites) {
      document.body.__hfAnswerFavorites = true;
      document.addEventListener('click', function (event) {
        var star = event.target.closest('.answer-card .ghost-btn[title="Lagre"]');
        if (!star) return;
        event.preventDefault();
        var card = star.closest('.answer-card');
        var title = card && card.querySelector('.answer-title') ? card.querySelector('.answer-title').textContent.trim() : 'Besvarelse';
        var saved = readJson('hf_saved_answers', []);
        if (saved.indexOf(title) === -1) saved.push(title);
        writeJson('hf_saved_answers', saved);
        star.textContent = '★';
        toast('Lagret: ' + title);
      });
    }

    window.render();
    if (typeof window.renderPopular === 'function') window.renderPopular();
    patchAnswerLinks();
  }

  function enhanceOppgavebankPage() {
    if (!inUserPage('oppgavebank.html') || document.body.dataset.hfOppgavebankEnhanced) return;
    var cards = Array.prototype.slice.call(document.querySelectorAll('.model-card'));
    if (!cards.length) return;
    document.body.dataset.hfOppgavebankEnhanced = '1';

    cards.forEach(function (card) {
      var text = card.textContent.toLowerCase();
      var btn = card.querySelector('.primary-btn');
      if (!btn) return;
      if (text.indexOf('ret14') !== -1) btn.href = rootRelative('ret14/eksamen/');
      else if (text.indexOf('sam2') !== -1) btn.href = rootRelative('sam2/oppgaver-klikkbar/');
      else if (text.indexOf('sam3') !== -1) btn.href = rootRelative('sam3/mock-eksamen.html');
      btn.textContent = 'Start →';
    });

    var search = document.querySelector('.searchbar input');
    var select = document.querySelector('.select-wrap select');
    var activeChip = 'alle';

    function applyFilter() {
      var q = search ? search.value.toLowerCase().trim() : '';
      var subject = select ? select.value.toLowerCase() : 'alle fag';
      cards.forEach(function (card) {
        var hay = card.textContent.toLowerCase();
        var matchesQuery = !q || hay.indexOf(q) !== -1;
        var matchesSubject = subject === 'alle fag' || hay.indexOf(subject) !== -1;
        var matchesChip = activeChip === 'alle' || hay.indexOf(activeChip) !== -1;
        card.hidden = !(matchesQuery && matchesSubject && matchesChip);
      });
    }

    if (search) search.addEventListener('input', applyFilter);
    if (select) select.addEventListener('change', applyFilter);
    document.querySelectorAll('.chip-row .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('.chip-row .chip').forEach(function (item) { item.classList.remove('active'); });
        chip.classList.add('active');
        activeChip = chip.textContent.trim().toLowerCase();
        applyFilter();
      });
    });
  }

  function enhanceNotesPage() {
    if (!inUserPage('notater.html') || document.body.dataset.hfNotesEnhanced) return;
    var list = document.querySelector('.note-list');
    var editor = document.querySelector('.editor');
    if (!list || !editor) return;
    document.body.dataset.hfNotesEnhanced = '1';

    var builtIn = {
      'Skatteplikt': { course: 'RET14', title: 'Skatteplikt', body: ['Start med hovedregelen og identifiser skattesubjektet.', 'Skill mellom fordel, vunnet ved arbeid/kapital/virksomhet og eventuelle unntak.', 'Avslutt med tydelig delkonklusjon før neste vilkår.'] },
      'Fradragsrett': { course: 'RET14', title: 'Fradragsrett', body: ['Finn kostnaden og inntekten den knytter seg til.', 'Drøft tilknytning, oppofrelse og eventuelle begrensninger.', 'Bruk faktum aktivt i subsumsjonen.'] },
      'IS-MP modellen': { course: 'SAM3', title: 'IS-MP modellen', body: ['Forklar først likevekt i varemarkedet.', 'Vis hvordan pengepolitikken påvirker realrenten.', 'Knytt skift til produksjon, inflasjon og forventninger.'] },
      'Ledelse og motivasjon': { course: 'SOL1', title: 'Ledelse og motivasjon', body: ['Definer teori kort før du bruker den.', 'Koble observasjoner i case til teori.', 'Diskuter begrensninger ved teorien.'] },
      'Markedssvikt': { course: 'SAM2', title: 'Markedssvikt', body: ['Identifiser eksternalitet, markedsmakt eller asymmetrisk informasjon.', 'Tegn figur før du forklarer intuisjonen.', 'Avslutt med velferdseffekt og mulig virkemiddel.'] }
    };

    function renderNote(note) {
      editor.innerHTML = '<div class="kicker">' + note.course + '</div><h2>' + note.title + '</h2><p>Arbeidsnotat lagret lokalt i nettleseren. Bruk det som utgangspunkt for flashcards og eksamensformuleringer.</p><ul>' + note.body.map(function (line) { return '<li>' + line + '</li>'; }).join('') + '</ul>';
    }

    list.addEventListener('click', function (event) {
      var tab = event.target.closest('.note-tab');
      if (!tab) return;
      list.querySelectorAll('.note-tab').forEach(function (item) { item.classList.remove('active'); });
      tab.classList.add('active');
      var title = tab.querySelector('strong') ? tab.querySelector('strong').textContent.trim() : '';
      var custom = readJson('hf_notes', []).find(function (note) { return note.title === title; });
      renderNote(custom || builtIn[title] || { course: 'Notat', title: title, body: ['Skriv dine egne punkter her senere.'] });
      writeJson('hf_selected_note', title);
    });

    var add = document.querySelector('.primary-btn');
    if (add) add.addEventListener('click', function (event) {
      event.preventDefault();
      var title = window.prompt('Tittel på nytt notat?');
      if (!title) return;
      var course = window.prompt('Fagkode?', 'RET14') || 'Notat';
      var notes = readJson('hf_notes', []);
      var note = { title: title, course: course.toUpperCase(), body: ['Nytt notat opprettet. Legg inn punkter og koble det senere til flashcards.'] };
      notes.push(note);
      writeJson('hf_notes', notes);
      var tab = document.createElement('div');
      tab.className = 'note-tab';
      tab.innerHTML = '<strong>' + note.title + '</strong><span>' + note.course + ' · lokalt notat</span>';
      list.appendChild(tab);
      tab.click();
      toast('Nytt notat opprettet lokalt.');
    });

    readJson('hf_notes', []).forEach(function (note) {
      if (list.querySelector('.note-tab strong') && Array.prototype.some.call(list.querySelectorAll('.note-tab strong'), function (s) { return s.textContent === note.title; })) return;
      var tab = document.createElement('div');
      tab.className = 'note-tab';
      tab.innerHTML = '<strong>' + note.title + '</strong><span>' + note.course + ' · lokalt notat</span>';
      list.appendChild(tab);
    });
  }

  function enhanceStudieplanPage() {
    if (!inUserPage('studieplan.html') || document.body.dataset.hfStudieplanEnhanced) return;
    var grid = document.querySelector('.calendar-grid');
    if (!grid) return;
    document.body.dataset.hfStudieplanEnhanced = '1';

    var done = readJson('hf_study_done', {});
    var extras = readJson('hf_study_extra', []);

    extras.forEach(function (extra) {
      var day = grid.querySelector('.day');
      if (!day) return;
      var ev = document.createElement('div');
      ev.className = 'event green';
      ev.textContent = extra;
      day.appendChild(ev);
    });

    function keyFor(eventEl) { return eventEl.textContent.replace(/\s+/g, ' ').trim(); }

    grid.querySelectorAll('.event').forEach(function (eventEl) {
      if (done[keyFor(eventEl)]) eventEl.classList.add('is-done');
    });

    grid.addEventListener('click', function (event) {
      var eventEl = event.target.closest('.event');
      if (!eventEl) return;
      eventEl.classList.toggle('is-done');
      done[keyFor(eventEl)] = eventEl.classList.contains('is-done');
      writeJson('hf_study_done', done);
    });

    var addBtn = document.querySelector('.top-actions .icon-btn');
    if (addBtn) addBtn.addEventListener('click', function () {
      var title = window.prompt('Hva vil du legge til i planen?', 'Flashcards · 20 min');
      if (!title) return;
      extras.push(title);
      writeJson('hf_study_extra', extras);
      var day = grid.querySelector('.day');
      if (day) {
        var ev = document.createElement('div');
        ev.className = 'event green';
        ev.textContent = title;
        day.appendChild(ev);
      }
      toast('Lagt til i ukeplanen.');
    });
  }

  function enhanceSettingsPage() {
    if (!inUserPage('settings.html') || document.body.dataset.hfSettingsEnhanced) return;
    document.body.dataset.hfSettingsEnhanced = '1';
    var stored = readJson('hf_settings', {});

    document.querySelectorAll('.setting').forEach(function (setting, index) {
      var name = setting.querySelector('strong') ? setting.querySelector('strong').textContent.trim() : 'setting-' + index;
      var toggle = setting.querySelector('.toggle');
      var tag = setting.querySelector('.tag');
      if (toggle) {
        if (stored[name] === false) toggle.classList.remove('on');
        if (stored[name] === true) toggle.classList.add('on');
        toggle.addEventListener('click', function () {
          toggle.classList.toggle('on');
          stored[name] = toggle.classList.contains('on');
          writeJson('hf_settings', stored);
          toast('Lagret: ' + name);
        });
      }
      if (tag && tag.textContent.trim().toLowerCase() === 'endre') {
        tag.addEventListener('click', function () {
          var current = setting.querySelector('span') ? setting.querySelector('span').textContent.trim() : '';
          var next = window.prompt('Ny verdi for ' + name + ':', current);
          if (!next) return;
          var desc = setting.querySelector('div span');
          if (desc) desc.textContent = next;
          stored[name + ':value'] = next;
          writeJson('hf_settings', stored);
          toast('Oppdatert: ' + name);
        });
      }
      var desc = setting.querySelector('div span');
      if (desc && stored[name + ':value']) desc.textContent = stored[name + ':value'];
    });
  }

  function enhanceSubjectCards() {
    if (!inUserPage('subjects.html') || document.body.dataset.hfSubjectCardsEnhanced) return;
    document.body.dataset.hfSubjectCardsEnhanced = '1';
    document.addEventListener('click', function (event) {
      var disabled = event.target.closest('a[href="#"]');
      if (!disabled) return;
      event.preventDefault();
      toast('Dette faget er planlagt og kobles på senere.');
    });
  }

  function run() {
    injectUtilityStyles();
    enhanceABesvarelserPage();
    enhanceOppgavebankPage();
    enhanceNotesPage();
    enhanceStudieplanPage();
    enhanceSettingsPage();
    enhanceSubjectCards();
  }

  ready(run);
  window.setTimeout(run, 250);
  window.HaugnesFunctionalEnhancements = { run: run };
})(window, document);
