(function (window) {
  'use strict';

  if (window.__subjectPageStudioBridgeInstalled) return;
  window.__subjectPageStudioBridgeInstalled = true;

  var cache = {};        // subject_code -> converted page in legacy format
  var pending = {};      // subject_code -> Promise
  var listeners = [];    // fired after every refresh with (subjectId, page)

  function studio() { return window.SubjectsStudio; }
  function pages() { return window.HaugnesSubjectPages; }
  function code(value) { return String(value == null ? '' : value).toUpperCase().replace(/[\s-]+/g, ''); }

  function toBlockRow(block) {
    return [block.title || '', block.body || '', block.weight || ''];
  }

  function toRadarRow(block) {
    return { theme: block.title || '', weight: block.weight || '', notes: block.body || '', priority: block.priority || 'Tier 1' };
  }

  function toFileForKind(file) {
    return {
      id: file.id,
      term: file.term || '',
      grade: file.grade || '',
      title: file.title || '',
      desc: file.description || '',
      body: file.body || '',
      source: (file.meta && file.meta.source) || '',
      date: (file.meta && file.meta.date) || '',
      topic: (file.meta && file.meta.topic) || '',
      difficulty: (file.meta && file.meta.difficulty) || 'Middels',
      question: file.description || '',
      solution: file.body || '',
      pdfName: file.storage_path ? file.storage_path.split('/').pop() : '',
      pdfSize: file.size_bytes ? (Math.round(file.size_bytes / 1024) + ' KB') : '',
      pdfUrl: file.external_url || '',
      _file: file,
      pdfData: null,
      __studio: true
    };
  }

  function convertToLegacy(full) {
    if (!full) return null;
    var subjectId = full.subject_code.toLowerCase();
    var page = {
      id: subjectId,
      code: full.subject_code,
      name: full.name,
      kicker: full.kicker,
      accent: full.accent,
      lead: full.lead,
      progress: (full.progress_percent || 0) + '%',
      next: full.next_step,
      visibility: Object.assign({}, full.visibility || {}),
      flashcardUrl: full.flashcards_url || '',
      flashcardsKicker: full.flashcards_kicker || '',
      memo: {
        intro: full.memo_intro,
        exam: full.memo_exam,
        studyAdvice: full.memo_study_advice
      },
      topics: (full.blocks.topics || []).map(toBlockRow),
      plan: (full.blocks.plan || []).map(toBlockRow),
      examRadar: (full.blocks.radar || []).map(toRadarRow),
      answers: (full.files.answer || []).map(toFileForKind),
      notes: (full.files.memo || []).map(toFileForKind),
      tasks: (full.files.task || []).map(function (file) {
        var row = toFileForKind(file);
        row.question = file.description || '';
        row.solution = file.body || '';
        return row;
      }),
      __studio: true,
      __rawStudio: full
    };
    return resolveSignedUrls(page).then(function () { return page; });
  }

  function resolveSignedUrls(page) {
    var s = studio();
    if (!s) return Promise.resolve();
    var jobs = [];
    ['answers', 'notes', 'tasks'].forEach(function (kind) {
      (page[kind] || []).forEach(function (row) {
        if (row._file && row._file.storage_path) {
          jobs.push(s.signedUrl(row._file, 60 * 60).then(function (url) {
            if (url) { row.pdfData = url; row.pdfUrl = url; }
          }));
        }
      });
    });
    return Promise.all(jobs);
  }

  function refresh(subjectId, options) {
    var key = code(subjectId);
    if (!key) return Promise.resolve(null);
    var s = studio();
    if (!s) return Promise.resolve(null);
    if (pending[key] && !(options && options.force)) return pending[key];
    pending[key] = s.getSubject(key, { force: true }).then(convertToLegacy).then(function (page) {
      pending[key] = null;
      if (!page) return null;
      cache[key] = page;
      cache[subjectId.toLowerCase()] = page;
      broadcast(key, page);
      return page;
    }).catch(function (err) {
      pending[key] = null;
      console.warn('[SubjectPageStudioBridge] refresh failed for', subjectId, err);
      return null;
    });
    return pending[key];
  }

  function broadcast(subjectId, page) {
    listeners.forEach(function (fn) {
      try { fn(subjectId, page); } catch (e) {}
    });
    try {
      window.dispatchEvent(new CustomEvent('haugnes:page-updated', { detail: { subjectId: subjectId, data: page } }));
    } catch (e) {}
  }

  function onRefresh(fn) {
    if (typeof fn !== 'function') return function () {};
    listeners.push(fn);
    return function () { listeners = listeners.filter(function (x) { return x !== fn; }); };
  }

  function get(subjectId) {
    var key = code(subjectId);
    if (cache[key]) return cache[key];
    return null;
  }

  // -------------------------------------------------------------
  // Legacy savePage bridge: convert diff to Studio calls.
  // We ONLY handle updates that clearly come from the subject page's
  // inline editors (topics/plan/radar/visibility/memo/answers/notes/tasks).
  // -------------------------------------------------------------
  function coerceBlockArray(section, arr) {
    return (arr || []).map(function (row, idx) {
      if (Array.isArray(row)) {
        return { section: section, sort_order: idx, title: row[0] || '', body: row[1] || '', weight: row[2] || '' };
      }
      return {
        section: section,
        sort_order: idx,
        title: row.title || row.step || row.theme || row.name || '',
        body: row.body || row.desc || row.description || row.notes || row.subtitle || '',
        weight: row.weight || row.time || row.duration || '',
        priority: row.priority || ''
      };
    });
  }

  function persistBlocks(subjectCode, section, newRows, previousRows) {
    var s = studio();
    if (!s) return Promise.resolve();
    var prev = (previousRows || []).slice();
    var jobs = [];
    var seenIds = {};

    newRows.forEach(function (row, index) {
      var existing = prev[index];
      var payload = Object.assign({}, row, { subject_code: subjectCode, sort_order: index });
      if (existing && existing.id) { payload.id = existing.id; seenIds[existing.id] = true; }
      jobs.push(s.upsertBlock(payload));
    });

    prev.forEach(function (row) {
      if (row && row.id && !seenIds[row.id]) {
        jobs.push(s.deleteBlock(row.id, subjectCode));
      }
    });

    return Promise.all(jobs);
  }

  function persistFiles(subjectCode, kind, newRows, previousRows) {
    var s = studio();
    if (!s) return Promise.resolve();
    var jobs = [];
    var seenIds = {};
    (previousRows || []).forEach(function (row) { if (row && row._file && row._file.id) seenIds[row._file.id] = row._file; });

    newRows.forEach(function (row, index) {
      var existing = row._file || (row.id && seenIds[row.id]) || null;
      var meta = {};
      if (kind === 'memo') { meta.source = row.source || ''; meta.date = row.date || ''; }
      if (kind === 'task') { meta.topic = row.topic || ''; meta.difficulty = row.difficulty || 'Middels'; }
      var payload = {
        title: row.title || '',
        description: kind === 'task' ? (row.question || row.desc || '') : (row.desc || ''),
        body: kind === 'task' ? (row.solution || '') : (row.body || ''),
        term: row.term || '',
        grade: row.grade || '',
        external_url: row.pdfUrl || row.url || row.external_url || '',
        meta: meta,
        sort_order: index
      };
      if (existing && existing.id) {
        delete seenIds[existing.id];
        jobs.push(s.updateFile(existing.id, payload));
      } else {
        payload.subject_code = subjectCode;
        payload.kind = kind;
        jobs.push(s.uploadFile(payload));
      }
    });

    Object.keys(seenIds).forEach(function (id) {
      var file = seenIds[id];
      jobs.push(s.deleteFile(file));
    });

    return Promise.all(jobs);
  }

  function saveBridge(subjectId, newData) {
    var key = code(subjectId);
    var s = studio();
    if (!s || !newData) return Promise.resolve(newData);

    var previous = cache[key] || {};
    var patch = { subject_code: key };
    var headerFields = {
      kicker: 'kicker', lead: 'lead', accent: 'accent', name: 'name',
      icon: 'icon', category_id: 'category_id', status_text: 'status_text',
      next: 'next_step', flashcardUrl: 'flashcards_url', flashcardsKicker: 'flashcards_kicker'
    };
    var patched = false;
    Object.keys(headerFields).forEach(function (src) {
      if (newData[src] !== undefined && newData[src] !== previous[src]) {
        patch[headerFields[src]] = newData[src];
        patched = true;
      }
    });
    if (newData.progress && newData.progress !== previous.progress) {
      patch.progress_percent = Number(String(newData.progress).replace(/[^0-9]/g, '')) || 0;
      patched = true;
    }
    if (newData.visibility) {
      patch.visibility = Object.assign({}, previous.visibility || {}, newData.visibility);
      patched = true;
    }
    if (newData.memo) {
      if (newData.memo.intro !== undefined) { patch.memo_intro = newData.memo.intro; patched = true; }
      if (newData.memo.exam !== undefined) { patch.memo_exam = newData.memo.exam; patched = true; }
      if (newData.memo.studyAdvice !== undefined) { patch.memo_study_advice = newData.memo.studyAdvice; patched = true; }
    }

    var chain = patched ? s.upsertSubject(patch) : Promise.resolve();

    if (newData.topics) {
      chain = chain.then(function () {
        return persistBlocks(key, 'topics', coerceBlockArray('topics', newData.topics), (previous.__rawStudio && previous.__rawStudio.blocks && previous.__rawStudio.blocks.topics) || []);
      });
    }
    if (newData.plan) {
      chain = chain.then(function () {
        return persistBlocks(key, 'plan', coerceBlockArray('plan', newData.plan), (previous.__rawStudio && previous.__rawStudio.blocks && previous.__rawStudio.blocks.plan) || []);
      });
    }
    if (newData.examRadar) {
      chain = chain.then(function () {
        return persistBlocks(key, 'radar', coerceBlockArray('radar', newData.examRadar), (previous.__rawStudio && previous.__rawStudio.blocks && previous.__rawStudio.blocks.radar) || []);
      });
    }
    if (newData.answers) {
      chain = chain.then(function () {
        return persistFiles(key, 'answer', newData.answers, previous.answers || []);
      });
    }
    if (newData.notes) {
      chain = chain.then(function () {
        return persistFiles(key, 'memo', newData.notes, previous.notes || []);
      });
    }
    if (newData.tasks) {
      chain = chain.then(function () {
        return persistFiles(key, 'task', newData.tasks, previous.tasks || []);
      });
    }

    return chain.then(function () { return refresh(key, { force: true }); });
  }

  // -------------------------------------------------------------
  // Install onto HaugnesSubjectPages once available.
  // -------------------------------------------------------------
  function install() {
    var api = pages();
    if (!api || api.__studioInstalled) return;
    api.__studioInstalled = true;

    var originalGet = api.get.bind(api);
    api.get = function (subjectId) {
      var mine = get(subjectId);
      if (mine) return mine;
      return originalGet(subjectId);
    };
    api.getAsync = function (subjectId) {
      return refresh(subjectId).then(function (page) { return page || originalGet(subjectId); });
    };
    api.refresh = refresh;
    api.onRefresh = onRefresh;

    var originalSave = api.savePage.bind(api);
    api.savePage = function (subjectId, newData) {
      if (studio()) {
        return saveBridge(subjectId, newData).then(function (page) {
          return page || originalSave(subjectId, newData);
        });
      }
      return originalSave(subjectId, newData);
    };
  }

  function waitAndInstall() {
    if (pages() && studio()) { install(); return; }
    var tries = 0;
    var t = window.setInterval(function () {
      tries += 1;
      if (pages() && studio()) { window.clearInterval(t); install(); }
      else if (tries > 200) { window.clearInterval(t); }
    }, 100);
  }

  function subjectFromLocation() {
    try {
      var params = new URLSearchParams(window.location.search);
      return params.get('id') || params.get('subject') || params.get('code') || '';
    } catch (e) {
      return '';
    }
  }

  waitAndInstall();
  window.addEventListener('haugnes:entitlements-changed', function () {
    waitAndInstall();
    // The bridge may have made its first request while Supabase was still
    // restoring the session. Fetch again after entitlements are ready; this
    // is essential for newly created pages whose only content lives in
    // subject_files (for example, uploaded lecture notes).
    var currentSubject = subjectFromLocation();
    if (currentSubject) refresh(currentSubject, { force: true });
  });
  window.addEventListener('haugnes:subject-studio-changed', function (event) {
    var detail = (event && event.detail) || {};
    if (detail.kind === 'subject' && detail.subject_code) {
      refresh(detail.subject_code, { force: true });
    } else if (detail.kind === 'all') {
      Object.keys(cache).forEach(function (k) { refresh(k, { force: true }); });
    }
  });

  window.SubjectPageStudioBridge = {
    refresh: refresh,
    onRefresh: onRefresh,
    get: get
  };
})(window);
