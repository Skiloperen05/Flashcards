(function (window) {
  'use strict';

  if (window.SubjectsStudio) return;

  var BUILT_IN_ORDER = ['RET14', 'SOL1', 'SAM2', 'SAM3', 'MET2', 'MAT10', 'SAM1A', 'MET1', 'KOM1', 'RET1A', 'BED1'];
  var LEGACY_KEYS = {
    subjects: 'hf_custom_subjects_v1',
    pages: 'hf_custom_subject_pages_v1',
    packages: 'hf_custom_packages_v1',
    memos: 'hf_custom_memos_v1',
    tasks: 'hf_custom_tasks_v1'
  };
  var MIGRATION_DONE_KEY = 'hf_studio_migrated_v1';
  var CATEGORY_ORDER = { semester1: 10, semester2: 20, semester3: 30, semester4: 40, semester5: 50, semester6: 60, electives: 90, master: 95 };

  var state = {
    catalog: null,
    catalogPromise: null,
    subjectCache: {},
    subjectPromise: {},
    listeners: [],
    realtimeChannel: null
  };

  function code(value) { return String(value == null ? '' : value).toUpperCase().replace(/[\s-]+/g, ''); }
  function id(value) { return String(value == null ? '' : value).trim(); }
  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[æå]/g, 'a').replace(/ø/g, 'o')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'file';
  }

  function client() {
    if (window.AuthGuard && typeof window.AuthGuard.getClient === 'function') {
      try { return window.AuthGuard.getClient(); } catch (e) {}
    }
    if (window.supabase && typeof window.supabase.createClient === 'function' && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
      return window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    }
    return null;
  }

  function session() {
    if (window.AuthGuard && typeof window.AuthGuard.getSession === 'function') {
      try { return window.AuthGuard.getSession(); } catch (e) {}
    }
    return null;
  }

  function userId() {
    var s = session();
    return (s && s.user && s.user.id) || null;
  }

  function isAdmin() {
    if (window.HaugnesEntitlements && typeof window.HaugnesEntitlements.isAdmin === 'function') {
      return !!window.HaugnesEntitlements.isAdmin();
    }
    return false;
  }

  function broadcast(detail) {
    state.listeners.forEach(function (fn) {
      try { fn(detail); } catch (e) {}
    });
    try {
      window.dispatchEvent(new CustomEvent('haugnes:subject-studio-changed', { detail: detail || {} }));
    } catch (e) {}
  }

  function subscribeChanges(fn) {
    if (typeof fn !== 'function') return function () {};
    state.listeners.push(fn);
    ensureRealtime();
    return function () {
      state.listeners = state.listeners.filter(function (item) { return item !== fn; });
    };
  }

  function ensureRealtime() {
    if (state.realtimeChannel) return;
    var sb = client();
    if (!sb || typeof sb.channel !== 'function') return;
    try {
      var channel = sb.channel('subjects-studio-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'subject_pages' }, function () { invalidateAll(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'subject_page_blocks' }, function (payload) {
          invalidateSubject(payload && payload.new && payload.new.subject_code);
          invalidateSubject(payload && payload.old && payload.old.subject_code);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'subject_files' }, function (payload) {
          invalidateSubject(payload && payload.new && payload.new.subject_code);
          invalidateSubject(payload && payload.old && payload.old.subject_code);
        })
        .subscribe();
      state.realtimeChannel = channel;
    } catch (e) {}
  }

  function invalidateAll() {
    state.catalog = null;
    state.catalogPromise = null;
    state.subjectCache = {};
    state.subjectPromise = {};
    broadcast({ kind: 'all' });
  }

  function invalidateSubject(subjectCode) {
    var key = code(subjectCode);
    if (!key) return;
    delete state.subjectCache[key];
    delete state.subjectPromise[key];
    state.catalog = null;
    state.catalogPromise = null;
    broadcast({ kind: 'subject', subject_code: key });
  }

  function normalizePage(row) {
    if (!row) return null;
    var visibility = Object.assign({
      radar: true, answers: true, notes: true, tasks: true,
      flashcards: true, topics: true, plan: true, overview: true
    }, row.visibility || {});
    return {
      subject_code: code(row.subject_code),
      name: row.name || '',
      kicker: row.kicker || '',
      icon: row.icon || '📚',
      accent: row.accent || '#2563eb',
      category_id: row.category_id || 'electives',
      status_text: row.status_text || 'Aktiv',
      progress_percent: Number(row.progress_percent) || 0,
      lead: row.lead || '',
      next_step: row.next_step || '',
      memo_intro: row.memo_intro || '',
      memo_exam: row.memo_exam || '',
      memo_study_advice: row.memo_study_advice || '',
      visibility: visibility,
      flashcards_url: row.flashcards_url || '',
      flashcards_kicker: row.flashcards_kicker || '',
      is_published: row.is_published !== false,
      origin: row.origin === 'builtin' ? 'builtin' : 'custom',
      updated_at: row.updated_at || null
    };
  }

  function normalizeBlock(row) {
    if (!row) return null;
    return {
      id: row.id,
      subject_code: code(row.subject_code),
      section: row.section,
      sort_order: Number(row.sort_order) || 0,
      title: row.title || '',
      body: row.body || '',
      weight: row.weight || '',
      priority: row.priority || '',
      meta: row.meta || {}
    };
  }

  function normalizeFile(row) {
    if (!row) return null;
    // Hide the raw Google Drive file id from non-admin callers. The paywall
    // proxy (the drive-proxy Edge Function with an opaque subject_files id)
    // is the only supported way for students to fetch the bytes, so they never need the drive_id on the
    // client. Admins still see it in the picker so they can verify what's
    // wired up.
    var admin = isAdmin();
    var bucket = row.storage_bucket || null;
    var storagePath = row.storage_path || null;
    var meta = row.meta || {};
    if (!admin && bucket === 'google_drive') {
      storagePath = null;
      if (meta && (meta.drive_id || meta.drive_name)) {
        meta = Object.assign({}, meta);
        delete meta.drive_id;
      }
    }
    return {
      id: row.id,
      subject_code: code(row.subject_code),
      kind: row.kind,
      term: row.term || '',
      grade: row.grade || '',
      title: row.title || '',
      description: row.description || '',
      body: row.body || '',
      storage_bucket: bucket,
      storage_path: storagePath,
      external_url: row.external_url || '',
      size_bytes: row.size_bytes || null,
      mime_type: row.mime_type || null,
      sort_order: Number(row.sort_order) || 0,
      meta: meta,
      uploaded_at: row.uploaded_at || null
    };
  }

  function listSubjects(options) {
    var force = options && options.force;
    if (state.catalog && !force) return Promise.resolve(state.catalog.slice());
    if (state.catalogPromise && !force) return state.catalogPromise.then(function (rows) { return rows.slice(); });
    var sb = client();
    if (!sb) return Promise.resolve([]);
    state.catalogPromise = sb.from('subject_pages')
      .select('subject_code,name,kicker,icon,accent,category_id,status_text,progress_percent,visibility,is_published,origin,updated_at')
      .order('category_id', { ascending: true })
      .order('subject_code', { ascending: true })
      .then(function (result) {
        if (result && result.error) throw result.error;
        var rows = ((result && result.data) || []).map(normalizePage);
        rows.sort(function (a, b) {
          var ca = CATEGORY_ORDER[a.category_id] || 99;
          var cb = CATEGORY_ORDER[b.category_id] || 99;
          if (ca !== cb) return ca - cb;
          var ba = BUILT_IN_ORDER.indexOf(a.subject_code);
          var bb = BUILT_IN_ORDER.indexOf(b.subject_code);
          if (ba !== -1 && bb !== -1) return ba - bb;
          if (ba !== -1) return -1;
          if (bb !== -1) return 1;
          return a.subject_code.localeCompare(b.subject_code);
        });
        state.catalog = rows;
        state.catalogPromise = null;
        return rows;
      })
      .catch(function (err) {
        state.catalogPromise = null;
        console.warn('[SubjectsStudio] listSubjects failed', err);
        state.catalog = [];
        return [];
      });
    return state.catalogPromise.then(function (rows) { return rows.slice(); });
  }

  function getSubject(subjectCode, options) {
    var key = code(subjectCode);
    if (!key) return Promise.resolve(null);
    var force = options && options.force;
    if (state.subjectCache[key] && !force) return Promise.resolve(state.subjectCache[key]);
    if (state.subjectPromise[key] && !force) return state.subjectPromise[key];
    var sb = client();
    if (!sb) return Promise.resolve(null);

    state.subjectPromise[key] = Promise.all([
      sb.from('subject_pages').select('*').eq('subject_code', key).maybeSingle(),
      sb.from('subject_page_blocks').select('*').eq('subject_code', key).order('section', { ascending: true }).order('sort_order', { ascending: true }),
      sb.from('subject_files').select('*').eq('subject_code', key).order('kind', { ascending: true }).order('sort_order', { ascending: true })
    ]).then(function (results) {
      var pageRow = results[0] && results[0].data;
      var blockRows = (results[1] && results[1].data) || [];
      var fileRows = (results[2] && results[2].data) || [];
      if (!pageRow) {
        state.subjectPromise[key] = null;
        state.subjectCache[key] = null;
        return null;
      }
      var page = normalizePage(pageRow);
      var blocks = { topics: [], plan: [], radar: [], tips: [], formula: [], compendium: [], checklist: [] };
      blockRows.forEach(function (row) {
        var block = normalizeBlock(row);
        if (block && blocks[block.section]) blocks[block.section].push(block);
      });
      Object.keys(blocks).forEach(function (section) {
        blocks[section].sort(function (a, b) { return a.sort_order - b.sort_order; });
      });
      var files = { answer: [], memo: [], task: [], attachment: [] };
      fileRows.forEach(function (row) {
        var file = normalizeFile(row);
        if (file && files[file.kind]) files[file.kind].push(file);
      });
      Object.keys(files).forEach(function (kind) {
        files[kind].sort(function (a, b) { return a.sort_order - b.sort_order; });
      });
      var full = Object.assign({}, page, { blocks: blocks, files: files });
      state.subjectCache[key] = full;
      state.subjectPromise[key] = null;
      return full;
    }).catch(function (err) {
      state.subjectPromise[key] = null;
      console.warn('[SubjectsStudio] getSubject failed', err);
      return null;
    });

    return state.subjectPromise[key];
  }

  function upsertSubject(patch) {
    if (!patch || !patch.subject_code) return Promise.reject(new Error('Fagkode mangler'));
    var sb = client();
    if (!sb) return Promise.reject(new Error('Ikke tilkoblet Supabase'));
    var payload = Object.assign({}, patch, {
      subject_code: code(patch.subject_code),
      updated_by: userId()
    });
    if (payload.origin && payload.origin !== 'builtin') payload.origin = 'custom';
    // Postgres evaluates the INSERT row's NOT NULL constraints before the
    // ON CONFLICT branch, so a partial patch (e.g. saving only memo copy)
    // would fail on `name IS NOT NULL` even when the row already exists.
    // Route partial patches through UPDATE and reserve UPSERT for creates
    // that carry the required NOT NULL fields.
    var isCreate = !!payload.name;
    var query = isCreate
      ? sb.from('subject_pages').upsert(payload, { onConflict: 'subject_code' })
      : sb.from('subject_pages').update(payload).eq('subject_code', payload.subject_code);
    return query.select().maybeSingle().then(function (result) {
      if (result && result.error) throw result.error;
      invalidateSubject(payload.subject_code);
      return normalizePage(result && result.data);
    });
  }

  function deleteSubject(subjectCode) {
    var key = code(subjectCode);
    var sb = client();
    if (!sb || !key) return Promise.reject(new Error('Ikke tilkoblet'));
    return sb.from('subject_pages').delete().eq('subject_code', key).then(function (result) {
      if (result && result.error) throw result.error;
      invalidateSubject(key);
      return true;
    });
  }

  function upsertBlock(block) {
    if (!block || !block.subject_code || !block.section) return Promise.reject(new Error('Blokk krever subject_code og section'));
    var sb = client();
    if (!sb) return Promise.reject(new Error('Ikke tilkoblet'));
    var payload = {
      subject_code: code(block.subject_code),
      section: block.section,
      sort_order: block.sort_order || 0,
      title: block.title || '',
      body: block.body || '',
      weight: block.weight || '',
      priority: block.priority || '',
      meta: block.meta || {},
      updated_by: userId()
    };
    if (block.id) payload.id = block.id;
    return sb.from('subject_page_blocks').upsert(payload).select().maybeSingle().then(function (result) {
      if (result && result.error) throw result.error;
      invalidateSubject(payload.subject_code);
      return normalizeBlock(result && result.data);
    });
  }

  function deleteBlock(blockId, subjectCode) {
    var sb = client();
    if (!sb || !blockId) return Promise.reject(new Error('Blokk-id mangler'));
    return sb.from('subject_page_blocks').delete().eq('id', blockId).then(function (result) {
      if (result && result.error) throw result.error;
      invalidateSubject(subjectCode);
      return true;
    });
  }

  function reorderBlocks(subjectCode, section, orderedIds) {
    var key = code(subjectCode);
    if (!key || !section || !Array.isArray(orderedIds)) return Promise.reject(new Error('Ugyldig input'));
    var sb = client();
    if (!sb) return Promise.reject(new Error('Ikke tilkoblet'));
    var updates = orderedIds.map(function (blockId, index) {
      return sb.from('subject_page_blocks').update({ sort_order: index }).eq('id', blockId).eq('subject_code', key);
    });
    return Promise.all(updates).then(function (results) {
      results.forEach(function (r) { if (r && r.error) throw r.error; });
      invalidateSubject(key);
      return true;
    });
  }

  function uploadFile(input) {
    if (!input || !input.subject_code || !input.kind) return Promise.reject(new Error('subject_code og kind kreves'));
    var sb = client();
    if (!sb) return Promise.reject(new Error('Ikke tilkoblet'));
    var key = code(input.subject_code);
    var kind = input.kind;
    var file = input.file || null;
    var meta = input.meta || {};

    var basePayload = {
      subject_code: key,
      kind: kind,
      term: input.term || '',
      grade: input.grade || '',
      title: input.title || (file ? file.name : ''),
      description: input.description || '',
      body: input.body || '',
      external_url: input.external_url || '',
      sort_order: input.sort_order || 0,
      meta: meta,
      uploaded_by: userId()
    };

    if (input.storage_bucket === 'google_drive' || input.drive_id) {
      var drivePayload = Object.assign({}, basePayload, {
        storage_bucket: 'google_drive',
        storage_path: input.drive_id || input.storage_path || '',
        mime_type: input.mime_type || 'application/pdf',
        size_bytes: input.size_bytes || null,
        meta: Object.assign({}, meta, {
          source: 'google_drive',
          drive_id: input.drive_id || input.storage_path || '',
          drive_name: input.title || (input.file ? input.file.name : '')
        })
      });
      return sb.from('subject_files').insert(drivePayload).select().maybeSingle().then(function (result) {
        if (result && result.error) throw result.error;
        invalidateSubject(key);
        return normalizeFile(result && result.data);
      });
    }

    if (!file && !basePayload.external_url) {
      return sb.from('subject_files').insert(basePayload).select().maybeSingle().then(function (result) {
        if (result && result.error) throw result.error;
        invalidateSubject(key);
        return normalizeFile(result && result.data);
      });
    }

    if (!file) {
      return sb.from('subject_files').insert(basePayload).select().maybeSingle().then(function (result) {
        if (result && result.error) throw result.error;
        invalidateSubject(key);
        return normalizeFile(result && result.data);
      });
    }

    if (file && input.progressCallback) {
      try { input.progressCallback({ phase: 'uploading', ratio: 0 }); } catch (e) {}
    }

    var insertRow = Object.assign({}, basePayload);
    return sb.from('subject_files').insert(insertRow).select().maybeSingle().then(function (result) {
      if (result && result.error) throw result.error;
      var row = result && result.data;
      var fileId = row && row.id;
      if (!fileId) throw new Error('Fikk ikke fil-id');
      var slug = slugify(file.name || 'file');
      var ext = (file.name && file.name.split('.').pop() || 'bin').toLowerCase().slice(0, 8);
      var path = key + '/' + fileId + '-' + slug + (ext && slug.indexOf('.') === -1 ? '.' + ext : '');
      return sb.storage.from('subject-files').upload(path, file, {
        upsert: true,
        contentType: file.type || undefined
      }).then(function (uploadResult) {
        if (uploadResult && uploadResult.error) {
          sb.from('subject_files').delete().eq('id', fileId);
          throw uploadResult.error;
        }
        return sb.from('subject_files').update({
          storage_bucket: 'subject-files',
          storage_path: path,
          size_bytes: file.size || null,
          mime_type: file.type || null
        }).eq('id', fileId).select().maybeSingle();
      }).then(function (updateResult) {
        if (updateResult && updateResult.error) throw updateResult.error;
        invalidateSubject(key);
        if (input.progressCallback) {
          try { input.progressCallback({ phase: 'done', ratio: 1 }); } catch (e) {}
        }
        return normalizeFile(updateResult && updateResult.data);
      });
    });
  }

  function updateFile(fileId, patch) {
    var sb = client();
    if (!sb || !fileId) return Promise.reject(new Error('Fil-id mangler'));
    var payload = Object.assign({}, patch);
    delete payload.id;
    return sb.from('subject_files').update(payload).eq('id', fileId).select().maybeSingle().then(function (result) {
      if (result && result.error) throw result.error;
      var row = result && result.data;
      invalidateSubject(row && row.subject_code);
      return normalizeFile(row);
    });
  }

  function deleteFile(file) {
    if (!file || !file.id) return Promise.reject(new Error('Fil mangler'));
    var sb = client();
    if (!sb) return Promise.reject(new Error('Ikke tilkoblet'));
    var storagePromise = file.storage_path
      ? sb.storage.from(file.storage_bucket || 'subject-files').remove([file.storage_path]).then(function () {}, function () {})
      : Promise.resolve();
    return storagePromise.then(function () {
      return sb.from('subject_files').delete().eq('id', file.id);
    }).then(function (result) {
      if (result && result.error) throw result.error;
      invalidateSubject(file.subject_code);
      return true;
    });
  }

  function signedUrl(file, ttlSeconds) {
    if (!file) return Promise.resolve(null);
    function rememberAccessError(message) {
      file.access_error = message || 'Kunne ikke åpne filen.';
      return null;
    }
    if (file.storage_bucket === 'google_drive') {
      var s = session();
      if (!s || !s.access_token) return Promise.resolve(null);
      // Never put a Supabase JWT in a URL: URLs end up in history, logs and
      // referrers. Fetch through the production Edge Function with a header
      // and give the legacy renderer a short-lived in-memory Blob URL.
      var proxyUrl = 'https://qnwjhheoekpqqqhevztw.supabase.co/functions/v1/drive-proxy?id=' + encodeURIComponent(file.id);
      return fetch(proxyUrl, {
        headers: { 'Authorization': 'Bearer ' + s.access_token },
        cache: 'no-store'
      }).then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            return rememberAccessError(payload && payload.error);
          }).catch(function () {
            return rememberAccessError('Kunne ikke åpne dokumentet fra Google Drive.');
          });
        }
        return response.blob().then(function (blob) { return URL.createObjectURL(blob); });
      }).catch(function () { return rememberAccessError('Kunne ikke koble til Google Drive.'); });
    }
    if (!file.storage_path) {
      return Promise.resolve(file.external_url ? file.external_url : null);
    }
    var sb = client();
    if (!sb || !sb.storage) return Promise.resolve(null);
    return sb.storage.from(file.storage_bucket || 'subject-files').createSignedUrl(file.storage_path, ttlSeconds || 3600).then(function (result) {
      if (result && result.error) return rememberAccessError('Kunne ikke åpne den opplastede filen.');
      return result && result.data && result.data.signedUrl ? result.data.signedUrl : null;
    }).catch(function () { return rememberAccessError('Kunne ikke åpne den opplastede filen.'); });
  }

  // -------------------------------------------------------------
  // Legacy migration — moves data from the localStorage prototype
  // into the shared DB the first time an admin lands on the hub.
  // -------------------------------------------------------------
  function readLegacy(key) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function coerceBlock(section, item, index) {
    if (Array.isArray(item)) {
      var title = item[0] || '';
      var mid = item[1] || '';
      var last = item[2] || '';
      var weight = /%/.test(last) ? last : (/%/.test(mid) ? mid : '');
      var body = weight === mid ? last : (weight === last ? mid : (mid || ''));
      return { section: section, sort_order: index, title: title, body: body, weight: weight || '80%' };
    }
    return {
      section: section,
      sort_order: index,
      title: item.title || item.theme || item.step || item.name || '',
      body: item.body || item.desc || item.description || item.subtitle || item.notes || '',
      weight: item.weight || item.pct || item.time || item.duration || '',
      priority: item.priority || '',
      meta: item.meta || {}
    };
  }

  function migrateLegacyIfNeeded() {
    if (!isAdmin()) return Promise.resolve(false);
    try { if (window.localStorage.getItem(MIGRATION_DONE_KEY)) return Promise.resolve(false); }
    catch (e) { return Promise.resolve(false); }

    var subjects = readLegacy(LEGACY_KEYS.subjects) || [];
    var pages = readLegacy(LEGACY_KEYS.pages) || {};
    var chain = Promise.resolve();

    if (Array.isArray(subjects)) {
      subjects.forEach(function (s) {
        if (!s || !s.code) return;
        chain = chain.then(function () {
          return upsertSubject({
            subject_code: s.code,
            name: s.name || s.code,
            kicker: s.kicker || '',
            icon: s.icon || '📚',
            accent: s.accent || '#2563eb',
            category_id: s.categoryId || 'electives',
            status_text: s.statusText || 'Aktiv',
            progress_percent: Number(s.progress) || 0,
            lead: s.description || '',
            is_published: true,
            origin: 'custom'
          }).catch(function (e) { console.warn('[SubjectsStudio] migration subject failed', s.code, e); });
        });
      });
    }

    Object.keys(pages || {}).forEach(function (rawKey) {
      var page = pages[rawKey];
      if (!page) return;
      var subjectCode = code(page.code || rawKey);
      if (!subjectCode) return;

      chain = chain.then(function () {
        var patch = {
          subject_code: subjectCode,
          name: page.name || subjectCode,
          kicker: page.kicker || '',
          icon: page.icon || '📚',
          accent: page.accent || '#2563eb',
          lead: page.lead || '',
          next_step: page.next || '',
          memo_intro: (page.memo && page.memo.intro) || '',
          memo_exam: (page.memo && page.memo.exam) || '',
          memo_study_advice: (page.memo && page.memo.studyAdvice) || '',
          visibility: page.visibility || undefined,
          flashcards_url: page.flashcardUrl || '',
          flashcards_kicker: page.flashcardsKicker || ''
        };
        return upsertSubject(patch).catch(function (e) { console.warn('[SubjectsStudio] migration page failed', subjectCode, e); });
      });

      ['topics', 'plan'].forEach(function (section) {
        (page[section] || []).forEach(function (item, index) {
          chain = chain.then(function () {
            var block = coerceBlock(section, item, index);
            block.subject_code = subjectCode;
            return upsertBlock(block).catch(function (e) { console.warn('[SubjectsStudio] migration block failed', subjectCode, section, e); });
          });
        });
      });

      (page.examRadar || []).forEach(function (row, index) {
        chain = chain.then(function () {
          var block = coerceBlock('radar', row, index);
          block.subject_code = subjectCode;
          block.priority = (row && row.priority) || 'Tier 1';
          return upsertBlock(block).catch(function (e) { console.warn('[SubjectsStudio] migration radar failed', subjectCode, e); });
        });
      });

      (page.answers || []).forEach(function (answer, index) {
        if (!answer || answer.pdfData) return;
        chain = chain.then(function () {
          return uploadFile({
            subject_code: subjectCode,
            kind: 'answer',
            term: answer.term || '',
            grade: answer.grade || '',
            title: answer.title || 'Eksamensløsning',
            description: answer.desc || '',
            external_url: answer.url || '',
            sort_order: index,
            meta: {}
          }).catch(function (e) { console.warn('[SubjectsStudio] migration answer failed', subjectCode, e); });
        });
      });

      (page.notes || []).forEach(function (note, index) {
        if (!note || note.pdfData) return;
        chain = chain.then(function () {
          return uploadFile({
            subject_code: subjectCode,
            kind: 'memo',
            title: note.title || 'Notat',
            description: note.desc || '',
            body: note.body || '',
            external_url: note.url || note.pdfUrl || '',
            sort_order: index,
            meta: { source: note.source || '', date: note.date || '' }
          }).catch(function (e) { console.warn('[SubjectsStudio] migration memo failed', subjectCode, e); });
        });
      });

      (page.tasks || []).forEach(function (task, index) {
        chain = chain.then(function () {
          return uploadFile({
            subject_code: subjectCode,
            kind: 'task',
            title: task.title || 'Oppgave',
            description: task.question || '',
            body: task.solution || '',
            sort_order: index,
            meta: { topic: task.topic || '', difficulty: task.difficulty || 'Middels' }
          }).catch(function (e) { console.warn('[SubjectsStudio] migration task failed', subjectCode, e); });
        });
      });
    });

    return chain.then(function () {
      try { window.localStorage.setItem(MIGRATION_DONE_KEY, String(Date.now())); } catch (e) {}
      invalidateAll();
      return true;
    });
  }

  window.SubjectsStudio = {
    listSubjects: listSubjects,
    getSubject: getSubject,
    upsertSubject: upsertSubject,
    deleteSubject: deleteSubject,
    upsertBlock: upsertBlock,
    deleteBlock: deleteBlock,
    reorderBlocks: reorderBlocks,
    uploadFile: uploadFile,
    updateFile: updateFile,
    deleteFile: deleteFile,
    signedUrl: signedUrl,
    subscribeChanges: subscribeChanges,
    invalidate: invalidateAll,
    invalidateSubject: invalidateSubject,
    migrateLegacyIfNeeded: migrateLegacyIfNeeded,
    isAdmin: isAdmin,
    slugify: slugify,
    code: code
  };

  // Kick off realtime as soon as entitlements have loaded so cross-tab
  // edits arrive automatically.
  window.addEventListener('haugnes:entitlements-changed', function () {
    ensureRealtime();
    if (isAdmin()) migrateLegacyIfNeeded();
  });
})(window);
