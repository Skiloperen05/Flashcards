(function (window) {
  'use strict';

  if (window.__haugnesNhhScheduleNormalizerInstalled) return;
  window.__haugnesNhhScheduleNormalizerInstalled = true;

  var KNOWN_SUBJECTS = ['RET14', 'SOL1', 'SAM2', 'SAM3', 'MET2', 'MAT10'];

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

  function subjectPattern(code) {
    var compact = subjectCode(code);
    var spaced = compact.replace(/([A-ZÆØÅ]+)(\d+)/, '$1\\s*$2');
    return new RegExp('(^|[^A-ZÆØÅ0-9])(' + compact + '|' + spaced + ')([^A-ZÆØÅ0-9]|$)', 'i');
  }

  function detectSubject(value) {
    var text = cleanText(value).toUpperCase();
    for (var i = 0; i < KNOWN_SUBJECTS.length; i++) {
      if (subjectPattern(KNOWN_SUBJECTS[i]).test(text)) return KNOWN_SUBJECTS[i];
    }
    return '';
  }

  function selectedSubjects(args, api) {
    var raw = args && args[0];
    if (!raw || !raw.length) raw = api && typeof api.getSelectedSubjects === 'function' ? api.getSelectedSubjects() : [];
    return (raw || []).map(subjectCode).filter(Boolean);
  }

  function termRange() {
    try {
      var raw = window.localStorage.getItem('hf_studyplan_term');
      if (!raw) return null;
      var term = JSON.parse(raw);
      if (term && /^20\d{2}-\d{2}-\d{2}$/.test(term.start || '') && /^20\d{2}-\d{2}-\d{2}$/.test(term.end || '')) return term;
    } catch (e) {}
    return null;
  }

  function withinTerm(event) {
    var term = termRange();
    if (!term || !event || !event.date) return true;
    return event.date >= term.start && event.date <= term.end;
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
    var combined = cleanText([next.subjectCode, next.title, next.raw].join(' '));
    var detected = detectSubject(combined);
    next.subjectCode = detected || subjectCode(next.subjectCode);
    next.title = stripDuplicateSubjectPrefix(next.title, next.subjectCode) || next.title;
    next.raw = cleanText(next.raw || '');
    next.sourceLabel = cleanText(next.sourceLabel || 'NHH');
    if (next.type === 'nhh' && /eksamen|exam|skoleeksamen|hjemmeeksamen|vurdering/i.test(next.title + ' ' + next.raw)) next.type = 'exam';
    if (next.type === 'nhh' && /forelesning|lecture|seminar|undervisning|gruppe/i.test(next.title + ' ' + next.raw)) next.type = 'lecture';
    return next;
  }

  function titleKey(event) {
    return cleanText(event.title).toLowerCase()
      .replace(/[^a-z0-9æøå]+/g, ' ')
      .replace(/\b(se studentweb|orakel|digital|skriftlig|skoleeksamen|makroøkonomi|mikroøkonomi|analyse og lineær algebra)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function dedupeKey(event) {
    var base = [subjectCode(event.subjectCode), event.type || '', event.date || '', event.time || '', event.durationMin || ''].join('|');
    if (event.type === 'exam') return base;
    return base + '|' + titleKey(event);
  }

  function normalizeAndDedupe(events, allowedSubjects) {
    var allowed = (allowedSubjects || []).map(subjectCode).filter(Boolean);
    var seen = {};
    var result = [];
    (events || []).map(normalizeEvent).forEach(function (event) {
      if (!event || !event.date) return;
      if (allowed.length && allowed.indexOf(subjectCode(event.subjectCode)) === -1) return;
      if (!withinTerm(event)) return;
      var key = dedupeKey(event);
      if (seen[key]) return;
      seen[key] = true;
      result.push(event);
    });
    result.sort(function (a, b) { return String(a.date + (a.time || '') + (a.title || '')).localeCompare(String(b.date + (b.time || '') + (b.title || ''))); });
    return result;
  }

  function normalizeCache(api) {
    try {
      var cacheKey = api.storageKeys && api.storageKeys.cache || 'hf_nhh_schedule_cache';
      var cache = JSON.parse(window.localStorage.getItem(cacheKey) || '{}');
      Object.keys(cache).forEach(function (code) {
        if (!cache[code] || !Array.isArray(cache[code].events)) return;
        cache[code].events = normalizeAndDedupe(cache[code].events, [code]);
      });
      window.localStorage.setItem(cacheKey, JSON.stringify(cache));
    } catch (e) {}
  }

  function patch(api) {
    if (!api || api.__haugnesNormalizerPatchedV2) return;
    api.__haugnesNormalizerPatchedV2 = true;

    var originalGetAllEvents = api.getAllEvents;
    if (typeof originalGetAllEvents === 'function') {
      api.getAllEvents = function () {
        return normalizeAndDedupe(originalGetAllEvents.apply(api, arguments), selectedSubjects(arguments, api));
      };
    }

    var originalGetCached = api.getCachedNhhEvents;
    if (typeof originalGetCached === 'function') {
      api.getCachedNhhEvents = function () {
        return normalizeAndDedupe(originalGetCached.apply(api, arguments), selectedSubjects(arguments, api));
      };
    }

    var originalSync = api.sync;
    if (typeof originalSync === 'function') {
      api.sync = function () {
        var allowed = selectedSubjects(arguments, api);
        return originalSync.apply(api, arguments).then(function (payload) {
          if (payload && payload.results) {
            payload.results.forEach(function (result) {
              if (result && Array.isArray(result.events)) result.events = normalizeAndDedupe(result.events, [result.subjectCode]);
            });
          }
          if (payload && Array.isArray(payload.events)) payload.events = normalizeAndDedupe(payload.events, allowed);
          normalizeCache(api);
          return payload;
        });
      };
    }

    api.normalizeEvents = normalizeAndDedupe;
    api.normalizeEvent = normalizeEvent;
    api.detectSubjectFromTimeEdit = detectSubject;
    normalizeCache(api);
  }

  function install() {
    if (window.NHHScheduleAPI) patch(window.NHHScheduleAPI);
    else window.setTimeout(install, 80);
  }

  install();
})(window);
