(function (window) {
  'use strict';

  var STORAGE = {
    selected: 'hf_studyplan_selected_subjects',
    custom: 'hf_studyplan_custom_events',
    hidden: 'hf_studyplan_hidden_events',
    cache: 'hf_nhh_schedule_cache',
    sources: 'hf_nhh_source_config'
  };

  var DEFAULT_SOURCES = [
    { id: 'nhh-search', label: 'NHH søk', kind: 'html', url: 'https://www.nhh.no/sok/?q={code}' },
    { id: 'nhh-course-no', label: 'NHH emneside', kind: 'html', url: 'https://www.nhh.no/emner/{code}/' },
    { id: 'nhh-course-en', label: 'NHH course page', kind: 'html', url: 'https://www.nhh.no/en/courses/{code}/' }
  ];

  var MONTHS = {
    januar: 0, jan: 0, feb: 1, februar: 1, mars: 2, mar: 2, april: 3, apr: 3,
    mai: 4, may: 4, juni: 5, jun: 5, juli: 6, jul: 6, august: 7, aug: 7,
    september: 8, sep: 8, okt: 9, oktober: 9, oct: 9, november: 10, nov: 10,
    desember: 11, dec: 11, december: 11
  };

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

  function uid(prefix) {
    return prefix + ':' + Date.now().toString(36) + ':' + Math.random().toString(36).slice(2, 8);
  }

  function isoDate(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function clean(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function safeUrl(template, code) {
    return String(template || '').replace(/\{code\}/g, encodeURIComponent(code)).replace(/\{CODE\}/g, encodeURIComponent(String(code).toUpperCase()));
  }

  function getSourceConfig() {
    var user = readJson(STORAGE.sources, []);
    return DEFAULT_SOURCES.concat(Array.isArray(user) ? user : []);
  }

  function setSourceConfig(sources) {
    writeJson(STORAGE.sources, Array.isArray(sources) ? sources : []);
  }

  function getSelectedSubjects(fallback) {
    var selected = readJson(STORAGE.selected, null);
    if (Array.isArray(selected) && selected.length) return selected;
    return fallback || ['RET14', 'SOL1', 'SAM2', 'SAM3'];
  }

  function setSelectedSubjects(codes) {
    var value = (codes || []).map(function (code) { return String(code || '').toUpperCase(); }).filter(Boolean);
    writeJson(STORAGE.selected, value);
    return value;
  }

  function eventId(parts) {
    return 'nhh:' + parts.map(function (part) {
      return clean(part).toLowerCase().replace(/[^a-z0-9æøå]+/g, '-').replace(/^-|-$/g, '');
    }).join(':');
  }

  function titleFor(type, subjectCode, text) {
    var base = clean(text);
    if (base.length > 90) base = base.slice(0, 87) + '...';
    if (base) return base;
    if (type === 'exam') return subjectCode + ' · eksamen';
    if (type === 'lecture') return subjectCode + ' · forelesning';
    return subjectCode + ' · aktivitet';
  }

  function inferType(text) {
    var lower = String(text || '').toLowerCase();
    if (/eksamen|exam|examination|vurdering|assessment/.test(lower)) return 'exam';
    if (/forelesning|lecture|undervisning|timeplan|seminar|class/.test(lower)) return 'lecture';
    return 'nhh';
  }

  function parseNorwegianDate(day, monthWord, yearHint) {
    var month = MONTHS[String(monthWord || '').toLowerCase().replace('.', '')];
    if (month === undefined) return null;
    var year = yearHint ? parseInt(yearHint, 10) : new Date().getFullYear();
    var date = new Date(year, month, parseInt(day, 10));
    return isNaN(date.getTime()) ? null : isoDate(date);
  }

  function parseIsoDate(raw) {
    var match = String(raw || '').match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (!match) return null;
    return match[1] + '-' + String(match[2]).padStart(2, '0') + '-' + String(match[3]).padStart(2, '0');
  }

  function parseTime(text) {
    var match = String(text || '').match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
    if (!match) return null;
    return String(match[1]).padStart(2, '0') + ':' + match[2];
  }

  function makeEvent(subjectCode, date, type, context, source) {
    var time = parseTime(context) || (type === 'exam' ? '09:00' : '10:00');
    var duration = type === 'exam' ? 240 : type === 'lecture' ? 90 : 45;
    var title = titleFor(type, subjectCode, context);
    return {
      id: eventId([subjectCode, type, date, time, title, source && source.id || 'nhh']),
      subjectCode: String(subjectCode || '').toUpperCase(),
      title: title,
      type: type,
      date: date,
      time: time,
      durationMin: duration,
      source: 'nhh',
      sourceLabel: source && source.label || 'NHH',
      sourceUrl: source && source.url || '',
      fetchedAt: new Date().toISOString()
    };
  }

  function parseHtmlEvents(html, subjectCode, source) {
    var doc;
    try { doc = new DOMParser().parseFromString(html, 'text/html'); }
    catch (e) { doc = null; }
    var text = clean(doc ? doc.body.textContent : html);
    var chunks = text.split(/(?<=[.!?])\s+|\n+/).filter(function (line) {
      return new RegExp(subjectCode, 'i').test(line) || /eksamen|exam|forelesning|lecture|timeplan|seminar|vurdering/i.test(line);
    });
    if (!chunks.length) chunks = text.match(/.{1,220}/g) || [];

    var events = [];
    chunks.forEach(function (chunk) {
      var type = inferType(chunk);
      if (type === 'nhh' && !new RegExp(subjectCode, 'i').test(chunk)) return;

      var iso = parseIsoDate(chunk);
      if (iso) events.push(makeEvent(subjectCode, iso, type, chunk, source));

      var re = /\b(\d{1,2})\.\s*(jan(?:uar)?|feb(?:ruar)?|mar(?:s)?|apr(?:il)?|mai|may|jun(?:i)?|jul(?:i)?|aug(?:ust)?|sep(?:tember)?|okt(?:ober)?|oct(?:ober)?|nov(?:ember)?|des(?:ember)?|dec(?:ember)?)[a-z.]*\s*(20\d{2})?/ig;
      var match;
      while ((match = re.exec(chunk))) {
        var date = parseNorwegianDate(match[1], match[2], match[3]);
        if (date) events.push(makeEvent(subjectCode, date, type, chunk, source));
      }
    });

    var seen = {};
    return events.filter(function (event) {
      if (seen[event.id]) return false;
      seen[event.id] = true;
      return true;
    });
  }

  function flatten(value, out) {
    out = out || [];
    if (Array.isArray(value)) value.forEach(function (item) { flatten(item, out); });
    else if (value && typeof value === 'object') {
      out.push(value);
      Object.keys(value).forEach(function (key) {
        if (value[key] && typeof value[key] === 'object') flatten(value[key], out);
      });
    }
    return out;
  }

  function parseJsonEvents(json, subjectCode, source) {
    var events = [];
    flatten(json).forEach(function (item) {
      var serialized = JSON.stringify(item);
      if (!new RegExp(subjectCode, 'i').test(serialized) && !/eksamen|exam|forelesning|lecture|seminar/i.test(serialized)) return;
      var rawDate = item.date || item.startDate || item.start || item.from || item.examDate || item.dato;
      var date = parseIsoDate(rawDate || serialized);
      if (!date) return;
      var type = inferType(item.type || item.category || item.title || item.name || serialized);
      events.push(makeEvent(subjectCode, date, type, item.title || item.name || serialized, source));
    });
    return events;
  }

  function fetchSource(source, code) {
    var url = safeUrl(source.url, code);
    var finalSource = Object.assign({}, source, { url: url });
    return fetch(url, { credentials: 'omit', mode: 'cors' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var contentType = res.headers.get('content-type') || '';
      if (source.kind === 'json' || /json/i.test(contentType)) {
        return res.json().then(function (json) { return parseJsonEvents(json, code, finalSource); });
      }
      return res.text().then(function (html) { return parseHtmlEvents(html, code, finalSource); });
    });
  }

  function fetchForSubject(code, options) {
    var sources = (options && options.sources) || getSourceConfig();
    code = String(code || '').toUpperCase();
    var attempts = sources.map(function (source) {
      return fetchSource(source, code).then(function (events) {
        return { source: source, ok: true, events: events };
      }).catch(function (error) {
        return { source: source, ok: false, events: [], error: error && error.message || String(error) };
      });
    });
    return Promise.all(attempts).then(function (results) {
      var events = [];
      var errors = [];
      results.forEach(function (result) {
        if (result.ok) events = events.concat(result.events || []);
        else errors.push({ source: result.source && result.source.label, error: result.error });
      });
      var seen = {};
      events = events.filter(function (event) {
        if (seen[event.id]) return false;
        seen[event.id] = true;
        return true;
      });
      return { subjectCode: code, events: events, errors: errors, checkedAt: new Date().toISOString() };
    });
  }

  function sync(subjectCodes, options) {
    var codes = (subjectCodes || getSelectedSubjects()).map(function (code) { return String(code || '').toUpperCase(); }).filter(Boolean);
    return Promise.all(codes.map(function (code) { return fetchForSubject(code, options); })).then(function (results) {
      var cache = readJson(STORAGE.cache, {});
      results.forEach(function (result) {
        cache[result.subjectCode] = result;
      });
      writeJson(STORAGE.cache, cache);
      return { results: results, events: getCachedNhhEvents(codes), checkedAt: new Date().toISOString() };
    });
  }

  function getCachedNhhEvents(codes) {
    var cache = readJson(STORAGE.cache, {});
    var selected = (codes || getSelectedSubjects()).map(function (code) { return String(code || '').toUpperCase(); });
    var events = [];
    selected.forEach(function (code) {
      var result = cache[code];
      if (result && Array.isArray(result.events)) events = events.concat(result.events);
    });
    return events;
  }

  function getCustomEvents() {
    return readJson(STORAGE.custom, []);
  }

  function saveCustomEvents(events) {
    writeJson(STORAGE.custom, events || []);
  }

  function upsertCustomEvent(event) {
    var events = getCustomEvents();
    var item = Object.assign({ id: uid('custom'), source: 'custom' }, event || {});
    var index = events.findIndex(function (e) { return e.id === item.id; });
    if (index >= 0) events[index] = item;
    else events.push(item);
    saveCustomEvents(events);
    return item;
  }

  function hideEvent(id) {
    var hidden = readJson(STORAGE.hidden, []);
    if (hidden.indexOf(id) === -1) hidden.push(id);
    writeJson(STORAGE.hidden, hidden);
  }

  function deleteEvent(id) {
    var custom = getCustomEvents();
    var next = custom.filter(function (event) { return event.id !== id; });
    if (next.length !== custom.length) saveCustomEvents(next);
    else hideEvent(id);
  }

  function getAllEvents(codes) {
    var selected = (codes || getSelectedSubjects()).map(function (code) { return String(code || '').toUpperCase(); });
    var hidden = readJson(STORAGE.hidden, []);
    var events = getCachedNhhEvents(selected).concat(getCustomEvents()).filter(function (event) {
      return hidden.indexOf(event.id) === -1 && (!event.subjectCode || selected.indexOf(String(event.subjectCode).toUpperCase()) !== -1);
    });
    events.sort(function (a, b) { return String(a.date + (a.time || '')).localeCompare(String(b.date + (b.time || ''))); });
    return events;
  }

  function importEvents(events) {
    var custom = getCustomEvents();
    (events || []).forEach(function (event) {
      custom.push(Object.assign({ id: uid('import'), source: 'custom' }, event));
    });
    saveCustomEvents(custom);
    return custom;
  }

  window.NHHScheduleAPI = {
    storageKeys: STORAGE,
    defaultSources: DEFAULT_SOURCES.slice(),
    getSourceConfig: getSourceConfig,
    setSourceConfig: setSourceConfig,
    getSelectedSubjects: getSelectedSubjects,
    setSelectedSubjects: setSelectedSubjects,
    fetchForSubject: fetchForSubject,
    sync: sync,
    getCachedNhhEvents: getCachedNhhEvents,
    getCustomEvents: getCustomEvents,
    upsertCustomEvent: upsertCustomEvent,
    deleteEvent: deleteEvent,
    hideEvent: hideEvent,
    getAllEvents: getAllEvents,
    importEvents: importEvents,
    parseHtmlEvents: parseHtmlEvents,
    parseJsonEvents: parseJsonEvents
  };
})(window);
