(function (window, document) {
  'use strict';
  if (window.HaugnesFlashcardStore) return;
  var user = null,
    client = null,
    timer = null,
    inFlight = null;
  function read(key, fallback) {
    try {
      return JSON.parse(window.localStorage.getItem(key) || 'null') || fallback;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
  function get() {
    return read('fc_stats', {});
  }
  function status(text) {
    window.dispatchEvent(new CustomEvent('haugnes:flashcard-sync', { detail: text }));
  }
  function save(stats) {
    try {
      write('fc_stats', stats);
      if (user) write('fc_stats_pending', user.id || user.email);
      status(client ? 'Synkroniserer …' : 'Lagret på enheten');
    } catch (e) {
      status('Kunne ikke lagre på enheten. Hold siden åpen.');
    }
    window.dispatchEvent(new CustomEvent('haugnes:flashcard-stats-changed'));
    clearTimeout(timer);
    timer = window.setTimeout(flush, 600);
  }
  function flush() {
    if (!user || !client) return Promise.resolve();
    if (inFlight) return inFlight;
    var snapshot = JSON.stringify(get());
    inFlight = Promise.resolve(
      client
        .from('user_stats')
        .upsert({ user_id: user.id, stats: JSON.parse(snapshot), updated_at: new Date().toISOString() }),
    )
      .then(function (result) {
        if (result.error) throw result.error;
        if (snapshot === JSON.stringify(get())) {
          window.localStorage.removeItem('fc_stats_pending');
          status('Lagret');
        } else {
          clearTimeout(timer);
          timer = window.setTimeout(flush, 600);
        }
      })
      .catch(function () {
        status('Lagret på enheten · venter på nett');
      })
      .finally(function () {
        inFlight = null;
      });
    return inFlight;
  }
  function open(account, supabase) {
    user = account;
    client = supabase;
    try {
      var id = account.id || account.email;
      var owner = read('fc_stats_owner', null);
      if (owner && owner !== id)
        ['fc_stats', 'fc_stats_pending', 'hf_subject_stats', 'hf_last_flashcard_route'].forEach(function (key) {
          window.localStorage.removeItem(key);
        });
      write('fc_stats_owner', id);
      if ((!owner || owner === id) && read('fc_sam3_migrated', null) !== id) {
        var legacy = read('sam3_progress_v1', {}).flashcards || read('sam3_flash_v1', {});
        var migrated = get();
        Object.keys(legacy).forEach(function (key) {
          var parts = key.match(/^(d\d+):(\d+)$/);
          if (!parts) return;
          var entry = legacy[key],
            deckId = 'sam3-' + parts[1];
          var deck = migrated[deckId] || { cardStats: {}, sessions: [] };
          deck.cardStats = deck.cardStats || {};
          if (deck.cardStats[parts[2]] || deck.resetAt) return;
          var counts = entry.counts || {};
          deck.cardStats[parts[2]] = {
            right: counts.good || 0,
            half: counts.mid || 0,
            wrong: counts.bad || 0,
            lastRating: entry.lastRating === 'good' ? 'right' : entry.lastRating === 'mid' ? 'half' : 'wrong',
            lastDate: entry.lastSeen,
            box: entry.lastRating === 'bad' || entry.lastRating === 'mid' ? 1 : entry.box || 2,
            dueAt: entry.nextReview,
          };
          migrated[deckId] = deck;
        });
        write('fc_stats', migrated);
        write('fc_sam3_migrated', id);
        if (Object.keys(legacy).length) write('fc_stats_pending', id);
      }
    } catch (e) {}
    if (!client) return Promise.resolve(get());
    return Promise.resolve(client.from('user_stats').select('stats').eq('user_id', user.id).maybeSingle())
      .then(function (result) {
        if (result.error) throw result.error;
        var merged = window.HaugnesStudySession.mergeStats(get(), (result.data && result.data.stats) || {});
        write('fc_stats', merged);
        if (read('fc_stats_pending', null)) {
          clearTimeout(timer);
          timer = window.setTimeout(flush, 600);
        }
        return merged;
      })
      .catch(function () {
        status('Bruker fremgang fra enheten · venter på nett');
        return get();
      });
  }
  window.addEventListener('online', flush);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      clearTimeout(timer);
      flush();
    }
  });
  window.HaugnesFlashcardStore = { get: get, save: save, open: open, flush: flush };
})(window, document);
