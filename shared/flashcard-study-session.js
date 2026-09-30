(function (window) {
  'use strict';

  // Keep source deck/index identities even when a session combines decks.
  function combine(decks, ids) {
    var selected = decks.filter(function (deck) {
      return ids.indexOf(deck.id) !== -1 && deck.cards.length;
    });
    if (!selected.length) return null;
    var mixed = selected.length > 1;
    var cards = [];
    selected.forEach(function (deck) {
      deck.cards.forEach(function (card, index) {
        cards.push(
          Object.assign({}, card, {
            sourceDeckId: deck.id,
            sourceDeckTitle: deck.title,
            sourceIndex: index,
            idx: mixed ? JSON.stringify([deck.id, index]) : index,
          }),
        );
      });
    });
    return {
      id: mixed
        ? 'mix:' +
          JSON.stringify(
            selected
              .map(function (deck) {
                return deck.id;
              })
              .sort(),
          )
        : selected[0].id,
      title: mixed ? 'Kombinert økt · ' + selected.length + ' dekk' : selected[0].title,
      cards: cards,
      deckIds: selected.map(function (deck) {
        return deck.id;
      }),
    };
  }

  function cardStatsFor(stats, card) {
    return ((stats[card.sourceDeckId] || {}).cardStats || {})[card.sourceIndex];
  }

  function matchesRating(stats, card, filter) {
    var rating = cardStatsFor(stats, card);
    if (filter === 'new') return !rating;
    if (filter === 'review') return rating && (rating.lastRating === 'wrong' || rating.lastRating === 'half');
    if (filter === 'wrong' || filter === 'half' || filter === 'right') return rating && rating.lastRating === filter;
    return true;
  }

  function prepare(deck, stats, options, random) {
    var cards = deck.cards.filter(function (card) {
      return (
        (!options.topic || options.topic === 'all' || card.topic === options.topic) &&
        (!options.difficulty || options.difficulty === 'all' || card.difficulty === options.difficulty) &&
        matchesRating(stats, card, options.filter)
      );
    });
    if (options.order === 'random') {
      const rng = random || Math.random;
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const temp = cards[i];
        cards[i] = cards[j];
        cards[j] = temp;
      }
    } else if (options.order === 'difficult') {
      function weight(card) {
        var rating = cardStatsFor(stats, card);
        if (!rating) return 2;
        return { wrong: 0, half: 1, right: 3 }[rating.lastRating];
      }
      cards.sort(function (a, b) {
        return weight(a) - weight(b);
      });
    }
    var limit = Number(options.limit);
    return limit > 0 ? cards.slice(0, limit) : cards;
  }

  function rate(stats, card, rating) {
    if (!card || ['right', 'half', 'wrong'].indexOf(rating) === -1) return;
    var data = stats[card.sourceDeckId] || { sessions: [], cardStats: {} };
    data.cardStats = data.cardStats || {};
    var cs = data.cardStats[card.sourceIndex] || { right: 0, half: 0, wrong: 0 };
    cs[rating] = (cs[rating] || 0) + 1;
    cs.lastRating = rating;
    cs.lastDate = new Date().toISOString();
    data.cardStats[card.sourceIndex] = cs;
    stats[card.sourceDeckId] = data;
  }

  function record(stats, deck, results, filter) {
    var groups = {};
    var summary = {
      date: new Date().toISOString(),
      results: { right: 0, half: 0, wrong: 0 },
      total: 0,
      filter: filter,
    };
    deck.cards.forEach(function (card) {
      var rating = results[card.idx];
      if (['right', 'half', 'wrong'].indexOf(rating) === -1) return;
      var group = groups[card.sourceDeckId] || { right: 0, half: 0, wrong: 0 };
      group[rating]++;
      groups[card.sourceDeckId] = group;
      summary.results[rating]++;
      summary.total++;
    });
    Object.keys(groups).forEach(function (id) {
      var data = stats[id] || { cardStats: {} };
      data.sessions = data.sessions || [];
      var result = groups[id];
      data.sessions.push({
        date: summary.date,
        results: result,
        total: result.right + result.half + result.wrong,
        filter: filter,
        combined: deck.deckIds.length > 1,
        sessionId: summary.date,
      });
      stats[id] = data;
    });
    return summary;
  }

  window.HaugnesStudySession = {
    combine: combine,
    prepare: prepare,
    rate: rate,
    record: record,
    cardStatsFor: cardStatsFor,
  };
})(window);
