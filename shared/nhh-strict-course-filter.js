(function (window) {
  'use strict';

  if (window.__haugnesNhhStrictCourseFilterInstalled) return;
  window.__haugnesNhhStrictCourseFilterInstalled = true;

  function clean(value) {
    return String(value || '')
      .replace(/\\n|\\r|\\t/g, ' ')
      .replace(/\\([,;:.])/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function code(value) {
    return String(value || '').toUpperCase().replace(/[\s-]+/g, '');
  }

  function courseRegex(course) {
    var compact = code(course);
    var spaced = compact.replace(/([A-ZÆØÅ]+)(\d+)/, '$1\\s*-?\\s*$2');
    return new RegExp('(^|[^A-ZÆØÅ0-9])(' + compact + '|' + spaced + ')([^A-ZÆØÅ0-9]|$)', 'i');
  }

  function rowText(event) {
    return clean([event && event.title, event && event.raw].join(' '));
  }

  function keepFor(event, allowed) {
    var selected = (allowed || []).map(code).filter(Boolean);
    if (!selected.length) return true;
    var text = rowText(event);
    return selected.some(function (subject) { return courseRegex(subject).test(text); });
  }

  function normalizeTitle(title) {
    return clean(title)
      .toLowerCase()
      .replace(/\\([,;:.])/g, '$1')
      .replace(/[^a-z0-9æøå]+/g, ' ')
      .replace(/\b(orakel|se studentweb|digital|skriftlig|skoleeksamen|forelesning|lecture)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function dedupeKey(event) {
    return [
      code(event && event.subjectCode),
      event && event.date || '',
      event && event.time || '',
      event && event.durationMin || '',
      normalizeTitle(event && event.title)
    ].join('|');
  }

  function priority(event) {
    var label = clean((event && event.sourceLabel) || '').toLowerCase();
    var type = clean((event && event.type) || '').toLowerCase();
    var score = 0;
    if (label.indexOf('timeplan') !== -1) score += 4;
    if (label.indexOf('eksamen') !== -1) score += 3;
    if (type === 'lecture') score += 2;
    if (type === 'exam') score += 2;
    if (type === 'nhh') score += 1;
    return score;
  }

  function filterEvents(events, allowed) {
    var filtered = (events || []).filter(function (event) { return keepFor(event, allowed); });
    var byKey = {};
    filtered.forEach(function (event) {
      var key = dedupeKey(event);
      if (!byKey[key] || priority(event) > priority(byKey[key])) byKey[key] = event;
    });
    return Object.keys(byKey).map(function (key) { return byKey[key]; }).sort(function (a, b) {
      return String((a.date || '') + (a.time || '') + (a.title || '')).localeCompare(String((b.date || '') + (b.time || '') + (b.title || '')));
    });
  }

  function selected(args, api) {
    var raw = args && args[0];
    if (!raw || !raw.length) raw = api && typeof api.getSelectedSubjects === 'function' ? api.getSelectedSubjects() : [];
    return (raw || []).map(code).filter(Boolean);
  }

  function normalizeCache(api) {
    try {
      var cacheKey = api.storageKeys && api.storageKeys.cache || 'hf_nhh_schedule_cache';
      var cache = JSON.parse(window.localStorage.getItem(cacheKey) || '{}');
      Object.keys(cache).forEach(function (subject) {
        if (cache[subject] && Array.isArray(cache[subject].events)) cache[subject].events = filterEvents(cache[subject].events, [subject]);
      });
      window.localStorage.setItem(cacheKey, JSON.stringify(cache));
    } catch (e) {}
  }

  function patch(api) {
    if (!api || api.__haugnesStrictCourseFilterPatchedV2) return;
    api.__haugnesStrictCourseFilterPatchedV2 = true;

    var originalGetAll = api.getAllEvents;
    if (typeof originalGetAll === 'function') {
      api.getAllEvents = function () {
        return filterEvents(originalGetAll.apply(api, arguments), selected(arguments, api));
      };
    }

    var originalGetCached = api.getCachedNhhEvents;
    if (typeof originalGetCached === 'function') {
      api.getCachedNhhEvents = function () {
        return filterEvents(originalGetCached.apply(api, arguments), selected(arguments, api));
      };
    }

    var originalSync = api.sync;
    if (typeof originalSync === 'function') {
      api.sync = function () {
        var allowed = selected(arguments, api);
        return originalSync.apply(api, arguments).then(function (payload) {
          if (payload && payload.results) {
            payload.results.forEach(function (result) {
              if (result && Array.isArray(result.events)) result.events = filterEvents(result.events, [result.subjectCode]);
            });
          }
          if (payload && Array.isArray(payload.events)) payload.events = filterEvents(payload.events, allowed);
          normalizeCache(api);
          return payload;
        });
      };
    }

    api.strictCourseFilter = filterEvents;
    normalizeCache(api);
  }

  function install() {
    if (window.NHHScheduleAPI) patch(window.NHHScheduleAPI);
    else window.setTimeout(install, 80);
  }

  install();
})(window);
