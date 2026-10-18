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

  // Leitner: a lapse always returns to the first basket. Old ratings are read
  // lazily, so existing history survives without a destructive migration.
  var intervals = [0, 10 * 60000, 86400000, 3 * 86400000, 7 * 86400000, 21 * 86400000];
  var labels = ['Nye kort', 'Øv snart', 'På vei', 'Sitter bedre', 'Sitter godt', 'Langtidsminne'];
  var intervalLabels = ['', 'om 10 min', 'om 1 dag', 'om 3 dager', 'om 7 dager', 'om 21 dager'];

  function schedule(cs) {
    if (!cs) return { box: 0, dueAt: 0 };
    var box = Number(cs.box);
    if (!Number.isInteger(box) || box < 1 || box > 5) box = cs.lastRating === 'right' ? 2 : 1;
    var due = Date.parse(cs.dueAt);
    if (!Number.isFinite(due)) {
      var last = Date.parse(cs.lastDate);
      due = Number.isFinite(last) ? last + intervals[box] : 0;
    }
    return { box: box, dueAt: due };
  }

  function nextSchedule(cs, rating, now) {
    now = now == null ? Date.now() : now;
    var previous = schedule(cs);
    // Extra practice before a card is due must not fast-forward mastery.
    var box =
      rating !== 'right' ? 1 : !previous.box ? 2 : previous.dueAt > now ? previous.box : Math.min(5, previous.box + 1);
    return { box: box, dueAt: rating === 'right' && previous.dueAt > now ? previous.dueAt : now + intervals[box] };
  }

  function overview(deck, stats, now) {
    now = now == null ? Date.now() : now;
    var result = {
      boxes: [0, 0, 0, 0, 0, 0],
      due: 0,
      fresh: 0,
      learned: 0,
      nextDue: null,
      total: deck ? deck.cards.length : 0,
    };
    if (!deck) return result;
    deck.cards.forEach(function (card) {
      var state = schedule(cardStatsFor(stats, card));
      result.boxes[state.box]++;
      if (!state.box) result.fresh++;
      else if (state.dueAt <= now) result.due++;
      else if (result.nextDue === null || state.dueAt < result.nextDue) result.nextDue = state.dueAt;
      if (state.box >= 3) result.learned++;
    });
    return result;
  }

  function matchesRating(stats, card, filter, now) {
    var rating = cardStatsFor(stats, card);
    if (filter === 'due') return !rating || schedule(rating).dueAt <= now;
    if (filter === 'new') return !rating;
    if (filter === 'review') return rating && (rating.lastRating === 'wrong' || rating.lastRating === 'half');
    if (filter === 'wrong' || filter === 'half' || filter === 'right') return rating && rating.lastRating === filter;
    return true;
  }

  function prepare(deck, stats, options, random, now) {
    now = now == null ? Date.now() : now;
    var cards = deck.cards.filter(function (card) {
      return (
        (!options.topic || options.topic === 'all' || card.topic === options.topic) &&
        (!options.difficulty || options.difficulty === 'all' || card.difficulty === options.difficulty) &&
        matchesRating(stats, card, options.filter, now)
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
    } else if (options.order === 'smart') {
      cards.sort(function (a, b) {
        var sa = schedule(cardStatsFor(stats, a)),
          sb = schedule(cardStatsFor(stats, b));
        // Due repetitions first (weakest basket, then oldest), then new cards.
        var pa = !sa.box ? 6 : sa.dueAt <= now ? sa.box : 7;
        var pb = !sb.box ? 6 : sb.dueAt <= now ? sb.box : 7;
        return pa - pb || sa.dueAt - sb.dueAt;
      });
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

  function rate(stats, card, rating, now) {
    if (!card || ['right', 'half', 'wrong'].indexOf(rating) === -1) return;
    var data = stats[card.sourceDeckId] || { sessions: [], cardStats: {} };
    data.cardStats = data.cardStats || {};
    var cs = data.cardStats[card.sourceIndex] || { right: 0, half: 0, wrong: 0 };
    now = now == null ? Date.now() : now;
    var next = nextSchedule(data.cardStats[card.sourceIndex], rating, now);
    cs[rating] = (cs[rating] || 0) + 1;
    cs.lastRating = rating;
    cs.lastDate = new Date(now).toISOString();
    cs.box = next.box;
    cs.dueAt = new Date(next.dueAt).toISOString();
    data.cardStats[card.sourceIndex] = cs;
    stats[card.sourceDeckId] = data;
    return next;
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

  function mergeStats(local, remote) {
    var result = {};
    var ids = new Set(Object.keys(local || {}).concat(Object.keys(remote || {})));
    ids.forEach(function (id) {
      var a = (local || {})[id] || {},
        b = (remote || {})[id] || {};
      var resetAt = Math.max(Date.parse(a.resetAt) || 0, Date.parse(b.resetAt) || 0);
      var merged = Object.assign({}, b, a, { cardStats: {} });
      if (resetAt) merged.resetAt = new Date(resetAt).toISOString();
      var keys = new Set(Object.keys(a.cardStats || {}).concat(Object.keys(b.cardStats || {})));
      keys.forEach(function (key) {
        var ca = (a.cardStats || {})[key],
          cb = (b.cardStats || {})[key];
        var winner = !ca ? cb : !cb ? ca : (Date.parse(ca.lastDate) || 0) >= (Date.parse(cb.lastDate) || 0) ? ca : cb;
        if (winner && (!resetAt || Date.parse(winner.lastDate) > resetAt))
          merged.cardStats[key] = Object.assign({}, winner);
      });
      ['sessions', 'quizSessions'].forEach(function (kind) {
        var unique = {};
        (b[kind] || []).concat(a[kind] || []).forEach(function (session) {
          if (resetAt && !(Date.parse(session.date) > resetAt)) return;
          unique[session.sessionId || session.date] = session;
        });
        merged[kind] = Object.keys(unique)
          .map(function (key) {
            return unique[key];
          })
          .sort(function (x, y) {
            return Date.parse(x.date) - Date.parse(y.date);
          });
      });
      result[id] = merged;
    });
    return result;
  }

  window.HaugnesStudySession = {
    combine: combine,
    prepare: prepare,
    rate: rate,
    record: record,
    cardStatsFor: cardStatsFor,
    schedule: schedule,
    nextSchedule: nextSchedule,
    overview: overview,
    labels: labels,
    intervalLabels: intervalLabels,
    mergeStats: mergeStats,
  };
})(window);
