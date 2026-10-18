(function (window, document) {
  'use strict';
  var engine = window.HaugnesStudySession;
  var intervals = ['10 min', '1 dag', '3 dager', '7 dager', '21 dager'];

  function nextDate(value) {
    if (value == null) return '';
    var minutes = Math.ceil((value - Date.now()) / 60000);
    if (minutes <= 0) return 'nå';
    if (minutes < 60) return 'om ' + minutes + ' min';
    if (minutes < 1440) return 'om ' + Math.ceil(minutes / 60) + ' timer';
    if (minutes === 1440) return 'om 1 dag';
    return new Date(value).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' }).replace(/\.$/, '');
  }

  function render(decks, stats) {
    var host = document.getElementById('studyOverview');
    var combined = engine.combine(
      decks,
      decks.map(function (deck) {
        return deck.id;
      }),
    );
    host.hidden = !combined;
    if (!combined) return;
    var state = engine.overview(combined, stats);
    host.innerHTML =
      '<div class="fc-overview-top"><div><span class="fc-eyebrow">Steg for steg</span>' +
      '<h2>Det du øver på, blir med videre.</h2><p>' +
      state.due +
      ' klare for repetisjon · ' +
      state.fresh +
      ' nye kort' +
      (state.nextDue ? ' · Neste repetisjon ' + nextDate(state.nextDue) : '') +
      '</p></div>' +
      '<div class="fc-mastery"><strong>' +
      state.learned +
      '<small> / ' +
      state.total +
      '</small></strong><span>kort i kurv 3–5</span></div></div>' +
      '<div class="fc-baskets" aria-label="Fordeling i repetisjonskurvene">' +
      intervals
        .map(function (interval, index) {
          var box = index + 1;
          return (
            '<div class="fc-basket" data-box="' +
            box +
            '"><span class="fc-basket-name">' +
            box +
            ' · ' +
            engine.labels[box] +
            '</span><strong>' +
            state.boxes[box] +
            '<small> kort</small></strong><span>Intervall · ' +
            interval +
            '</span>' +
            '<div class="fc-basket-track"><i style="width:' +
            (state.total ? (state.boxes[box] / state.total) * 100 : 0) +
            '%"></i></div></div>'
          );
        })
        .join('') +
      '</div><details class="fc-method"><summary>Slik fungerer kurvene</summary>' +
      '<p>Tenk gjennom svaret før du snur kortet. «Kunne det» flytter et nytt kort til kurv 2. Når kortet er klart for repetisjon, flytter et riktig svar det én kurv videre. «Øv mer» sender det alltid til kurv 1, også når du har kunnet det før.</p>' +
      '<p>Du kan øve ekstra når du vil. Riktige svar før neste repetisjon beholder kurven og tidspunktet, slik at korte omstarter ikke teller som langvarig mestring. Nye kort venter utenfor kurvene til du har prøvd dem.</p></details>';
  }

  function cardState(card, stats) {
    var cs = engine.cardStatsFor(stats, card);
    var state = engine.schedule(cs);
    document.getElementById('cardBasket').textContent = state.box
      ? 'Kurv ' + state.box + ' · ' + engine.labels[state.box]
      : 'Nytt kort · ta deg god tid';
    var next = engine.nextSchedule(cs, 'right');
    document.querySelector('[data-rate="right"]').innerHTML =
      '<span>Kunne det <kbd>2</kbd></span><small>Kurv ' + next.box + ' · ' + nextDate(next.dueAt) + '</small>';
    document.querySelector('[data-rate="wrong"]').innerHTML =
      '<span>Øv mer <kbd>1</kbd></span><small>Kurv 1 · om 10 min</small>';
  }

  function feedback(next, rating) {
    var el = document.getElementById('studyFeedback');
    el.dataset.rating = rating;
    el.textContent =
      rating === 'right'
        ? 'Det satt! Kortet er i kurv ' + next.box + '. Neste repetisjon ' + nextDate(next.dueAt) + '.'
        : 'Dette øver vi mer på. Kortet er i kurv 1 og kommer tilbake om 10 min.';
  }

  window.HaugnesFlashcardProgress = { render: render, cardState: cardState, feedback: feedback, nextDate: nextDate };
})(window, document);
