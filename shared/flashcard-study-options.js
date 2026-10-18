(function (window, document) {
  'use strict';
  var subject = null;
  var selected = [];
  var levels = { grunnleggende: 'Grunnleggende', middels: 'Middels', avansert: 'Avansert' };
  var options = { order: 'smart', difficulty: 'all', limit: 20, filter: 'due' };
  try {
    const settings = JSON.parse(window.localStorage.getItem('hf_user_settings_v2') || '{}');
    if (Number(settings.sessionLen) > 0) options.limit = Number(settings.sessionLen);
  } catch (e) {}

  try {
    var saved = JSON.parse(window.localStorage.getItem('hf_study_options_v1') || '{}');
    if (saved.scheduleVersion === 1) options = Object.assign(options, saved);
  } catch (e) {}

  var preferredLength = options.limit;

  function read() {
    var host = document.getElementById('studyOptions');
    if (host) {
      options = {
        order: host.querySelector('[name="order"]').value,
        difficulty: host.querySelector('[name="difficulty"]').value,
        limit: Number(host.querySelector('[name="limit"]').value),
        filter: host.querySelector('[name="filter"]').value,
      };
    }
    return Object.assign({}, options);
  }

  function selectHtml(name, label, entries) {
    return (
      '<label>' +
      label +
      '<select name="' +
      name +
      '">' +
      entries
        .map(function (item) {
          return '<option value="' + item[0] + '">' + item[1] + '</option>';
        })
        .join('') +
      '</select></label>'
    );
  }

  function update(decks) {
    read();
    var combined = window.HaugnesStudySession.combine(decks, selected);
    var available = combined
      ? window.HaugnesStudySession.prepare(combined, window.getStats(), Object.assign({}, options, { limit: 0 })).length
      : 0;
    var lengths = window.HaugnesStudySession.sessionLengths(available, preferredLength);
    var lengthSelect = document.querySelector('#studyOptions [name="limit"]');
    lengthSelect.innerHTML = lengths.choices
      .map(function (choice) {
        return '<option value="' + choice.value + '">' + choice.label + '</option>';
      })
      .join('');
    lengthSelect.value = String(lengths.value);
    lengthSelect.disabled = !available;
    options.limit = lengths.value;
    try {
      window.localStorage.setItem(
        'hf_study_options_v1',
        JSON.stringify(Object.assign({ scheduleVersion: 1 }, options, { limit: preferredLength })),
      );
    } catch (e) {}
    var total = combined ? window.HaugnesStudySession.prepare(combined, window.getStats(), options).length : 0;
    var status = document.getElementById('studySelectionStatus');
    status.textContent = selected.length + ' dekk valgt · ' + total + ' kort i økten';
    if (selected.length && !total)
      status.textContent +=
        options.filter === 'due'
          ? ' · Du er ajour! Kom tilbake senere, eller velg alle kort for ekstra øving.'
          : ' · Ingen kort passer valgene. Endre nivå eller kortutvalg.';
    var start = document.getElementById('startCombinedStudy');
    start.disabled = !total;
    start.textContent = total
      ? 'Start øving · ' + total + ' kort →'
      : options.filter === 'due' && selected.length
        ? 'Ajour for nå'
        : 'Velg dekk og kort';
    document.querySelectorAll('[data-study-deck]').forEach(function (input) {
      input.checked = selected.indexOf(input.getAttribute('data-study-deck')) !== -1;
    });
  }

  function render(decks) {
    var host = document.getElementById('studyOptions');
    if (subject === window.currentSubjectId) read();
    else {
      subject = window.currentSubjectId;
      selected = decks
        .filter(function (deck) {
          return deck.cards.length;
        })
        .map(function (deck) {
          return deck.id;
        });
    }
    selected = selected.filter(function (id) {
      return decks.some(function (deck) {
        return deck.id === id;
      });
    });
    host.hidden = !decks.length;
    if (!decks.length) return;
    var hasLevels = decks.some(function (deck) {
      return deck.cards.some(function (card) {
        return card.difficulty;
      });
    });
    if (!hasLevels) options.difficulty = 'all';
    var limits = [['0', 'Alle kort']];
    host.innerHTML =
      '<div class="study-setup-heading"><div><span class="fc-eyebrow">Din neste økt</span><h2>Litt øving. Mer som sitter.</h2>' +
      '<p>Vi prioriterer kort som er klare for repetisjon, og fyller på med nye. Velg dekkene du vil øve på nedenfor.</p></div></div>' +
      '<details class="study-customize"><summary>Tilpass økten</summary><div class="study-options-grid">' +
      selectHtml('order', 'Rekkefølge', [
        ['smart', 'Anbefalt · repetisjon først'],
        ['random', 'Tilfeldig'],
        ['fixed', 'Fast rekkefølge'],
        ['difficult', 'Vanskelige først'],
      ]) +
      selectHtml('limit', 'Kort per økt', limits) +
      selectHtml('difficulty', 'Vanskelighetsgrad', [
        ['all', 'Alle nivåer'],
        ['grunnleggende', 'Grunnleggende'],
        ['middels', 'Middels'],
        ['avansert', 'Avansert'],
      ]) +
      selectHtml('filter', 'Hvilke kort?', [
        ['due', 'Klare for repetisjon + nye'],
        ['all', 'Alle kort'],
        ['new', 'Nye kort'],
        ['review', 'Igjen og vanskelige'],
        ['wrong', 'Kun igjen'],
        ['half', 'Kun vanskelige'],
      ]) +
      '</div></details><div class="study-summary" id="studySelectionStatus" role="status" aria-live="polite"></div>' +
      '<div class="study-actions"><button type="button" id="studySelectAll">Velg alle dekk</button>' +
      '<button type="button" id="studySelectNone">Fjern valg</button><button class="primary" type="button" id="startCombinedStudy"></button></div>';
    Object.keys(options).forEach(function (key) {
      var select = host.querySelector('[name="' + key + '"]');
      if (select) select.value = String(options[key]);
    });
    host.querySelector('[name="difficulty"]').disabled = !hasLevels;
    host.onchange = function (event) {
      if (event.target.name === 'limit') preferredLength = Number(event.target.value);
      update(decks);
    };
    document.getElementById('studySelectAll').onclick = function () {
      selected = decks
        .filter(function (deck) {
          return deck.cards.length;
        })
        .map(function (deck) {
          return deck.id;
        });
      update(decks);
    };
    document.getElementById('studySelectNone').onclick = function () {
      selected = [];
      update(decks);
    };
    document.getElementById('startCombinedStudy').onclick = function () {
      window.startDeck(selected.slice(), options.filter, read());
    };
    document.querySelectorAll('[data-study-deck]').forEach(function (input) {
      input.onchange = function () {
        var id = input.getAttribute('data-study-deck');
        selected = selected.filter(function (value) {
          return value !== id;
        });
        if (input.checked) selected.push(id);
        update(decks);
      };
    });
    update(decks);
  }

  window.HaugnesStudyOptions = { render: render, read: read, levels: levels };
})(window, document);
