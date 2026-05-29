(function (window) {
  'use strict';

  var STORAGE = {
    selected: 'hf_studyplan_selected_subjects',
    custom: 'hf_studyplan_custom_events',
    hidden: 'hf_studyplan_hidden_events',
    cache: 'hf_nhh_schedule_cache',
    sources: 'hf_nhh_source_config',
    objectCache: 'hf_timeedit_object_cache'
  };

  var TIMEEDIT = {
    base: 'https://cloud.timeedit.net/nhh/web/student/',
    pages: {
      schedule: { id: 'schedule', label: 'Timeplan', page: 'ri1Q57.html', sid: 13, defaultStart: '20260105', defaultEnd: '20260619' },
      examBachelor: { id: 'examBachelor', label: 'Eksamensplan bachelor', page: 'ri1Q8.html', sid: 13, defaultStart: '20260505', defaultEnd: '20260831' },
      examMaster: { id: 'examMaster', label: 'Eksamensplan master', page: 'ri1Q50.html', sid: 13, defaultStart: '20260505', defaultEnd: '20260831' }
    }
  };

  var SUBJECT_ALIASES = { SOL1: ['SOL1', 'SOL 1'], RET14: ['RET14'], SAM2: ['SAM2'], SAM3: ['SAM3'], MET2: ['MET2'], MAT10: ['MAT10'] };

  function readJson(key, fallback) { try { var raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }
  function writeJson(key, value) { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }
  function uid(prefix) { return prefix + ':' + Date.now().toString(36) + ':' + Math.random().toString(36).slice(2, 8); }
  function clean(text) { return String(text || '').replace(/\s+/g, ' ').trim(); }
  function upper(code) { return String(code || '').toUpperCase().replace(/\s+/g, ''); }
  function sameSubject(text, code) { var hay = String(text || '').toUpperCase(); return (SUBJECT_ALIASES[upper(code)] || [upper(code)]).some(function (alias) { return hay.indexOf(alias.toUpperCase()) !== -1; }); }
  function ymd(d) { return d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0'); }
  function isoFromYmd(v) { v = String(v || '').replace(/\D/g, ''); return v.length >= 8 ? v.slice(0, 4) + '-' + v.slice(4, 6) + '-' + v.slice(6, 8) : ''; }
  function dateToIso(value) {
    value = String(value || '');
    var m = value.match(/(20\d{2})[-/.]?(\d{2})[-/.]?(\d{2})/); if (m) return m[1] + '-' + m[2] + '-' + m[3];
    m = value.match(/(\d{1,2})[./-](\d{1,2})[./-](20\d{2})/); if (m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
    return '';
  }
  function timeFrom(value) { var m = String(value || '').match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/); return m ? m[1].padStart(2, '0') + ':' + m[2] : ''; }
  function minutesBetween(start, end) {
    if (!start || !end) return 0;
    var s = start.split(':').map(Number), e = end.split(':').map(Number);
    return Math.max(0, (e[0] * 60 + e[1]) - (s[0] * 60 + s[1]));
  }
  function period() {
    var now = new Date();
    var year = now.getFullYear();
    if (now.getMonth() < 6) return { start: year + '0101', end: year + '0630' };
    return { start: year + '0801', end: (year + 1) + '0131' };
  }
  function eventId(parts) { return 'timeedit:' + parts.map(function (p) { return clean(p).toLowerCase().replace(/[^a-z0-9æøå]+/g, '-').replace(/^-|-$/g, ''); }).join(':'); }

  function proxyUrl(url) { return '/api/timeedit?url=' + encodeURIComponent(url); }
  function fetchText(url) {
    return fetch(proxyUrl(url), { cache: 'no-store' }).then(function (res) {
      if (res.ok) return res.text();
      throw new Error('proxy ' + res.status);
    }).catch(function () {
      return fetch(url, { credentials: 'omit', mode: 'cors', cache: 'no-store' }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + url);
        return res.text();
      });
    });
  }

  function getSelectedSubjects(fallback) {
    var selected = readJson(STORAGE.selected, null);
    if (Array.isArray(selected) && selected.length) return selected;
    return fallback || ['RET14', 'SOL1', 'SAM2', 'SAM3'];
  }
  function setSelectedSubjects(codes) {
    var value = (codes || []).map(upper).filter(Boolean);
    writeJson(STORAGE.selected, value);
    return value;
  }

  function getSourceConfig() { return readJson(STORAGE.sources, []); }
  function setSourceConfig(sources) { writeJson(STORAGE.sources, Array.isArray(sources) ? sources : []); }

  function objectSearchUrls(code, page) {
    var qs = function (extra) {
      var p = new URLSearchParams(Object.assign({ sid: page.sid, max: 80, fr: 't', partajax: 't', search_text: code }, extra || {}));
      return TIMEEDIT.base + 'objects.html?' + p.toString();
    };
    return [
      qs({ types: '2' }), qs({ types: '4' }), qs({ types: '5' }), qs({ types: '6' }), qs({ types: '7' }), qs({ types: '8' }), qs({ types: '0' }), qs({}),
      TIMEEDIT.base + page.page + '?sid=' + page.sid + '&search_text=' + encodeURIComponent(code)
    ];
  }

  function parseObjects(text, code) {
    var objects = [];
    var seen = {};
    function add(id, label, raw) {
      id = String(id || '').replace(/\D/g, '');
      label = clean(label || raw || '');
      if (!id || id.length < 3 || seen[id] || !sameSubject(label + ' ' + raw, code)) return;
      seen[id] = true;
      objects.push({ id: id, label: label || code, raw: raw || '' });
    }
    var html = String(text || '');
    var re = /(?:data-id|data-object-id|objectid|oid|id)=["']?(\d{3,})["']?[^>]{0,500}>([^<]{0,220})/ig, m;
    while ((m = re.exec(html))) add(m[1], m[2], m[0]);
    re = /(\d{3,})[^\n\r]{0,180}((?:RET14|SAM\s*2|SAM\s*3|SOL\s*1|MET2|MAT10)[^\n\r<]{0,180})/ig;
    while ((m = re.exec(html))) add(m[1], m[2], m[0]);
    re = /((?:RET14|SAM\s*2|SAM\s*3|SOL\s*1|MET2|MAT10)[^\n\r<]{0,180})[^\n\r]{0,80}(\d{3,})/ig;
    while ((m = re.exec(html))) add(m[2], m[1], m[0]);
    return objects;
  }

  function resolveObjects(code, page) {
    var cache = readJson(STORAGE.objectCache, {});
    var key = page.id + ':' + upper(code);
    if (cache[key] && cache[key].length) return Promise.resolve(cache[key]);
    var urls = objectSearchUrls(code, page);
    var chain = Promise.resolve([]);
    urls.forEach(function (url) {
      chain = chain.then(function (found) {
        if (found.length) return found;
        return fetchText(url).then(function (text) { return parseObjects(text, code); }).catch(function () { return []; });
      });
    });
    return chain.then(function (objects) {
      if (objects.length) { cache[key] = objects; writeJson(STORAGE.objectCache, cache); }
      return objects;
    });
  }

  function exportUrls(page, objectId, format) {
    var p = period();
    var ext = format || 'csv';
    var base = TIMEEDIT.base + 'ri.' + ext + '?';
    var common = { sid: page.sid, p: p.start + '.x,' + p.end + '.x' };
    var candidates = [];
    ['objects', 'o', 'obj', 'e'].forEach(function (name) {
      var q = new URLSearchParams(common); q.set(name, objectId); candidates.push(base + q.toString());
    });
    var q2 = new URLSearchParams(common); q2.set('h', 't'); q2.set('objects', objectId); candidates.push(base + q2.toString());
    return candidates;
  }

  function parseCsvLine(line, delimiter) {
    var out = [], cur = '', quote = false;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') quote = !quote;
      else if (c === delimiter && !quote) { out.push(cur); cur = ''; }
      else cur += c;
    }
    out.push(cur);
    return out.map(clean);
  }

  function detectDelimiter(text) {
    var sample = String(text || '').split(/\r?\n/).slice(0, 5).join('\n');
    var counts = [';', '\t', ','].map(function (d) { return { d: d, n: (sample.match(new RegExp(d === '\t' ? '\\t' : d, 'g')) || []).length }; });
    counts.sort(function (a, b) { return b.n - a.n; });
    return counts[0].d;
  }

  function typeFromText(text) {
    text = String(text || '').toLowerCase();
    if (/eksamen|exam|skoleeksamen|hjemmeeksamen|vurdering/.test(text)) return 'exam';
    if (/forelesning|lecture|seminar|undervisning|gruppe/.test(text)) return 'lecture';
    return 'nhh';
  }

  function eventFromCells(cells, code, page) {
    var joined = clean(cells.join(' | '));
    if (!sameSubject(joined, code) && page.id.indexOf('exam') === -1) return null;
    var date = '', times = [];
    cells.forEach(function (cell) {
      if (!date) date = dateToIso(cell);
      var t = timeFrom(cell); if (t) times.push(t);
    });
    if (!date) return null;
    var type = page.id.indexOf('exam') === 0 ? 'exam' : typeFromText(joined);
    var start = times[0] || (type === 'exam' ? '09:00' : '10:00');
    var end = times[1] || '';
    var titleCell = cells.find(function (c) { return sameSubject(c, code); }) || cells.find(function (c) { return /eksamen|forelesning|seminar|lecture|undervisning/i.test(c); }) || joined;
    var title = clean(titleCell).replace(/^\|+|\|+$/g, '') || upper(code) + ' · ' + (type === 'exam' ? 'Eksamen' : 'Undervisning');
    return {
      id: eventId([page.id, code, date, start, title]),
      subjectCode: upper(code), title: title, type: type,
      date: date, time: start, durationMin: minutesBetween(start, end) || (type === 'exam' ? 240 : 90),
      source: 'nhh', sourceLabel: 'NHH TimeEdit · ' + page.label, sourceUrl: TIMEEDIT.base + page.page, raw: joined
    };
  }

  function parseCsv(text, code, page) {
    var delimiter = detectDelimiter(text);
    var lines = String(text || '').split(/\r?\n/).filter(function (line) { return clean(line); });
    return lines.map(function (line) { return parseCsvLine(line, delimiter); }).map(function (cells) { return eventFromCells(cells, code, page); }).filter(Boolean);
  }

  function unfoldIcs(text) { return String(text || '').replace(/\r?\n[ \t]/g, ''); }
  function parseIcsDate(value) {
    value = String(value || '');
    var m = value.match(/(20\d{2})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
    return m ? { date: m[1] + '-' + m[2] + '-' + m[3], time: m[4] ? m[4] + ':' + m[5] : '' } : null;
  }
  function parseIcs(text, code, page) {
    var out = [];
    unfoldIcs(text).split('BEGIN:VEVENT').slice(1).forEach(function (block) {
      var summary = (block.match(/SUMMARY[^:]*:(.*)/) || [])[1] || '';
      var desc = (block.match(/DESCRIPTION[^:]*:(.*)/) || [])[1] || '';
      var loc = (block.match(/LOCATION[^:]*:(.*)/) || [])[1] || '';
      var dt = parseIcsDate((block.match(/DTSTART[^:]*:(.*)/) || [])[1]);
      var de = parseIcsDate((block.match(/DTEND[^:]*:(.*)/) || [])[1]);
      var joined = clean([summary, desc, loc].join(' '));
      if (!dt || (!sameSubject(joined, code) && page.id.indexOf('exam') === -1)) return;
      var type = page.id.indexOf('exam') === 0 ? 'exam' : typeFromText(joined);
      out.push({ id: eventId([page.id, code, dt.date, dt.time, summary]), subjectCode: upper(code), title: clean(summary) || upper(code), type: type, date: dt.date, time: dt.time || (type === 'exam' ? '09:00' : '10:00'), durationMin: minutesBetween(dt.time, de && de.time) || (type === 'exam' ? 240 : 90), source: 'nhh', sourceLabel: 'NHH TimeEdit · ' + page.label, sourceUrl: TIMEEDIT.base + page.page, raw: joined });
    });
    return out;
  }

  function fetchExportForObject(code, page, object) {
    var urls = exportUrls(page, object.id, 'csv').concat(exportUrls(page, object.id, 'ics'));
    var chain = Promise.resolve([]);
    urls.forEach(function (url) {
      chain = chain.then(function (found) {
        if (found.length) return found;
        return fetchText(url).then(function (text) {
          return /BEGIN:VCALENDAR|BEGIN:VEVENT/.test(text) ? parseIcs(text, code, page) : parseCsv(text, code, page);
        }).catch(function () { return []; });
      });
    });
    return chain;
  }

  function fetchTimeEditForSubject(code) {
    var pages = [TIMEEDIT.pages.schedule, TIMEEDIT.pages.examBachelor, TIMEEDIT.pages.examMaster];
    return Promise.all(pages.map(function (page) {
      return resolveObjects(code, page).then(function (objects) {
        if (!objects.length) return { page: page, events: [], errors: ['Fant ikke TimeEdit-objekt for ' + code + ' i ' + page.label] };
        return Promise.all(objects.slice(0, 3).map(function (object) { return fetchExportForObject(code, page, object); })).then(function (groups) {
          return { page: page, events: [].concat.apply([], groups), errors: [] };
        });
      }).catch(function (e) { return { page: page, events: [], errors: [e && e.message || String(e)] }; });
    })).then(function (parts) {
      var events = [], errors = [];
      parts.forEach(function (p) { events = events.concat(p.events || []); errors = errors.concat(p.errors || []); });
      var seen = {};
      events = events.filter(function (e) { if (seen[e.id]) return false; seen[e.id] = true; return true; });
      return { subjectCode: upper(code), events: events, errors: errors, checkedAt: new Date().toISOString() };
    });
  }

  function parseHtmlEvents(html, subjectCode, source) { return parseCsv(String(html || '').replace(/<[^>]+>/g, '\n'), subjectCode, { id: 'html', label: source && source.label || 'HTML', page: '' }); }
  function parseJsonEvents(json, subjectCode, source) {
    var out = [];
    function walk(v) { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') { var s = JSON.stringify(v); var date = dateToIso(s); if (date && sameSubject(s, subjectCode)) out.push({ id: eventId(['json', subjectCode, date, s.slice(0, 40)]), subjectCode: upper(subjectCode), title: clean(v.title || v.name || v.summary || subjectCode), type: typeFromText(s), date: date, time: timeFrom(s) || '10:00', durationMin: 90, source: 'nhh', sourceLabel: source && source.label || 'JSON', sourceUrl: source && source.url || '', raw: s }); Object.keys(v).forEach(function (k) { walk(v[k]); }); } }
    walk(json);
    return out;
  }

  function fetchCustomSources(code) {
    var sources = getSourceConfig();
    return Promise.all(sources.map(function (source) {
      var url = String(source.url || '').replace(/\{code\}/g, encodeURIComponent(code)).replace(/\{CODE\}/g, encodeURIComponent(upper(code)));
      return fetchText(url).then(function (text) {
        if (source.kind === 'json' || /^\s*[\[{]/.test(text)) return parseJsonEvents(JSON.parse(text), code, Object.assign({}, source, { url: url }));
        return parseHtmlEvents(text, code, Object.assign({}, source, { url: url }));
      }).catch(function () { return []; });
    })).then(function (groups) { return [].concat.apply([], groups); });
  }

  function fetchForSubject(code) {
    return Promise.all([fetchTimeEditForSubject(code), fetchCustomSources(code)]).then(function (parts) {
      var primary = parts[0];
      primary.events = primary.events.concat(parts[1] || []);
      return primary;
    });
  }

  function sync(subjectCodes) {
    var codes = (subjectCodes || getSelectedSubjects()).map(upper).filter(Boolean);
    return Promise.all(codes.map(fetchForSubject)).then(function (results) {
      var cache = readJson(STORAGE.cache, {});
      results.forEach(function (result) { cache[result.subjectCode] = result; });
      writeJson(STORAGE.cache, cache);
      return { results: results, events: getCachedNhhEvents(codes), checkedAt: new Date().toISOString() };
    });
  }

  function getCachedNhhEvents(codes) {
    var cache = readJson(STORAGE.cache, {});
    var selected = (codes || getSelectedSubjects()).map(upper);
    var events = [];
    selected.forEach(function (code) { if (cache[code] && Array.isArray(cache[code].events)) events = events.concat(cache[code].events); });
    return events;
  }
  function getCustomEvents() { return readJson(STORAGE.custom, []); }
  function saveCustomEvents(events) { writeJson(STORAGE.custom, events || []); }
  function upsertCustomEvent(event) { var events = getCustomEvents(); var item = Object.assign({ id: uid('custom'), source: 'custom' }, event || {}); var i = events.findIndex(function (e) { return e.id === item.id; }); if (i >= 0) events[i] = item; else events.push(item); saveCustomEvents(events); return item; }
  function hideEvent(id) { var hidden = readJson(STORAGE.hidden, []); if (hidden.indexOf(id) === -1) hidden.push(id); writeJson(STORAGE.hidden, hidden); }
  function deleteEvent(id) { var custom = getCustomEvents(); var next = custom.filter(function (event) { return event.id !== id; }); if (next.length !== custom.length) saveCustomEvents(next); else hideEvent(id); }
  function getAllEvents(codes) { var selected = (codes || getSelectedSubjects()).map(upper); var hidden = readJson(STORAGE.hidden, []); return getCachedNhhEvents(selected).concat(getCustomEvents()).filter(function (event) { return hidden.indexOf(event.id) === -1 && (!event.subjectCode || selected.indexOf(upper(event.subjectCode)) !== -1); }).sort(function (a, b) { return String(a.date + (a.time || '')).localeCompare(String(b.date + (b.time || ''))); }); }
  function importEvents(events) { var custom = getCustomEvents(); (events || []).forEach(function (event) { custom.push(Object.assign({ id: uid('import'), source: 'custom' }, event)); }); saveCustomEvents(custom); return custom; }
  function clearTimeEditCache() { writeJson(STORAGE.cache, {}); writeJson(STORAGE.objectCache, {}); }

  window.NHHScheduleAPI = {
    storageKeys: STORAGE, timeEdit: TIMEEDIT,
    getSourceConfig: getSourceConfig, setSourceConfig: setSourceConfig,
    getSelectedSubjects: getSelectedSubjects, setSelectedSubjects: setSelectedSubjects,
    fetchForSubject: fetchForSubject, sync: sync, clearTimeEditCache: clearTimeEditCache,
    getCachedNhhEvents: getCachedNhhEvents, getCustomEvents: getCustomEvents,
    upsertCustomEvent: upsertCustomEvent, deleteEvent: deleteEvent, hideEvent: hideEvent,
    getAllEvents: getAllEvents, importEvents: importEvents,
    parseHtmlEvents: parseHtmlEvents, parseJsonEvents: parseJsonEvents,
    parseCsv: parseCsv, parseIcs: parseIcs, resolveObjects: resolveObjects
  };
})(window);
