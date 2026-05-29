(function (window) {
  'use strict';

  if (window.__haugnesNhhScheduleNormalizerInstalled) return;
  window.__haugnesNhhScheduleNormalizerInstalled = true;

  function cleanText(value) {
    return String(value || '')
      .replace(/\\n/g, ' ')
      .replace(/\\r/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\\([,;:.])/g, '$1')
      .replace(/\\\\/g, '\\')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function subjectCode(value) {
    return String(value || '').toUpperCase().replace(/\s+/g, '');
  }

  function stripDuplicateSubjectPrefix(title, code) {
    var clean = cleanText(title);
    var c = subjectCode(code);
    if (!c) return clean;
    var escaped = c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var spaced = c.replace(/(\D+)(\d+)/, '$1\\s*$2').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var patterns = [
      new RegExp('^' + escaped + '\\s*[·.:-]\\s*', 'i'),
      new RegExp('^' + spaced + '\\s*[·.:-]\\s*', 'i')
    ];
    patterns.forEach(function (re) { clean = clean.replace(re, ''); });
    return cleanText(clean);
  }

  function normalizeEvent(event) {
    if (!event) return event;
    var next = Object.assign({}, event);
    next.subjectCode = subjectCode(next.subjectCode);
    next.title = stripDuplicateSubjectPrefix(next.title, next.subjectCode) || next.title;
    next.raw = cleanText(next.raw || '');
    next.sourceLabel = cleanText(next.sourceLabel || 'NHH');
    if (next.type === 'nhh' && /eksamen|exam|skoleeksamen|hjemmeeksamen|vurdering/i.test(next.title + ' ' + next.raw)) next.type = 'exam';
    if (next.type === 'nhh' && /forelesning|lecture|seminar|undervisning|gruppe/i.test(next.title + ' ' + next.raw)) next.type = 'lecture';
    return next;
  }

  function dedupeKey(event) {
    var title = cleanText(event.title).toLowerCase()
      .replace(/[^a-z0-9æøå]+/g, ' ')
      .replace(/\b(se studentweb|orakel|digital|skriftlig|skoleeksamen)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return [
      subjectCode(event.subjectCode),
      event.type || '',
      event.date || '',
      event.time || '',
      event.durationMin || '',
      title
    ].join('|');
  }

  function normalizeAndDedupe(events) {
    var seen = {};
    var result = [];
    (events || []).map(normalizeEvent).forEach(function (event) {
      if (!event) return;
      var key = dedupeKey(event);
      if (seen[key]) return;
      seen[key] = true;
      result.push(event);
    });
    result.sort(function (a, b) { return String(a.date + (a.time || '') + (a.title || '')).localeCompare(String(b.date + (b.time || '') + (b.title || ''))); });
    return result;
  }

  function patch(api) {
    if (!api || api.__haugnesNormalizerPatched) return;
    api.__haugnesNormalizerPatched = true;

    var originalGetAllEvents = api.getAllEvents;
    if (typeof originalGetAllEvents === 'function') {
      api.getAllEvents = function () {
        return normalizeAndDedupe(originalGetAllEvents.apply(api, arguments));
      };
    }

    var originalGetCached = api.getCachedNhhEvents;
    if (typeof originalGetCached === 'function') {
      api.getCachedNhhEvents = function () {
        return normalizeAndDedupe(originalGetCached.apply(api, arguments));
      };
    }

    var originalSync = api.sync;
    if (typeof originalSync === 'function') {
      api.sync = function () {
        return originalSync.apply(api, arguments).then(function (payload) {
          if (payload && payload.results) {
            payload.results.forEach(function (result) {
              if (result && Array.isArray(result.events)) result.events = normalizeAndDedupe(result.events);
            });
          }
          if (payload && Array.isArray(payload.events)) payload.events = normalizeAndDedupe(payload.events);
          try {
            var cacheKey = api.storageKeys && api.storageKeys.cache || 'hf_nhh_schedule_cache';
            var cache = JSON.parse(window.localStorage.getItem(cacheKey) || '{}');
            Object.keys(cache).forEach(function (code) {
              if (cache[code] && Array.isArray(cache[code].events)) cache[code].events = normalizeAndDedupe(cache[code].events);
            });
            window.localStorage.setItem(cacheKey, JSON.stringify(cache));
          } catch (e) {}
          return payload;
        });
      };
    }

    api.normalizeEvents = normalizeAndDedupe;
    api.normalizeEvent = normalizeEvent;
  }

  function install() {
    if (window.NHHScheduleAPI) patch(window.NHHScheduleAPI);
    else window.setTimeout(install, 80);
  }

  install();
})(window);
