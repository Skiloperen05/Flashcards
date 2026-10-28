(function (window) {
  'use strict';

  if (window.SubjectsStudio) return;

  var BUILT_IN_ORDER = ['RET14', 'SOL1', 'SAM2', 'SAM3', 'MET2', 'MET3', 'MAT10', 'SAM1A', 'MET1', 'KOM1', 'RET1A', 'BED1'];
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
      sb.from('subject_files').select('*').eq('subject_code', key).order('kind', { ascending: true }).order('sort_order', { ascending: true }).order('uploaded_at', { ascending: true }).order('id', { ascending: true })
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
        files[kind].sort(function (a, b) { return a.sort_order - b.sort_order || String(a.uploaded_at || '').localeCompare(String(b.uploaded_at || '')) || a.id.localeCompare(b.id); });
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

  function createSubject(patch) {
    if (!patch || !patch.subject_code || !String(patch.name || '').trim()) return Promise.reject(new Error('Fagkode og navn mangler'));
    var sb = client();
    if (!sb) return Promise.reject(new Error('Ikke tilkoblet Supabase'));
    var payload = Object.assign({}, patch, { subject_code: code(patch.subject_code), is_published: false, origin: 'custom', updated_by: userId() });
    return sb.from('subject_pages').insert(payload).select().single().then(function (result) {
      if (result.error) throw result.error;
      invalidateSubject(payload.subject_code);
      return normalizePage(result.data);
    });
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

  function reorderFiles(subjectCode, kind, orderedIds, expectedIds) {
    var key = code(subjectCode);
    if (!key || ['memo', 'answer', 'task', 'attachment'].indexOf(kind) === -1 || !Array.isArray(orderedIds) || !Array.isArray(expectedIds)
      || orderedIds.length !== expectedIds.length || new Set(orderedIds).size !== orderedIds.length
      || orderedIds.some(function (id) { return expectedIds.indexOf(id) === -1; })) return Promise.reject(new Error('Ugyldig dokumentrekkefølge'));
    var sb = client();
    if (!sb) return Promise.reject(new Error('Ikke tilkoblet'));
    return sb.rpc('reorder_subject_files', { p_subject_code: key, p_kind: kind, p_ordered_ids: orderedIds, p_expected_ids: expectedIds }).then(function (result) {
      if (result.error) throw result.error;
      invalidateSubject(key);
      return true;
    });
  }

  function showAnswerSection(row) {
    if (!row || row.kind !== 'answer') return Promise.resolve(row);
    var sb = client();
    return sb.from('subject_pages').select('visibility').eq('subject_code', row.subject_code).maybeSingle().then(function (result) {
      if (result.error) throw result.error;
      if (!result.data) throw new Error('Faget ble ikke funnet.');
      if (result.data.visibility && result.data.visibility.answers === true) return row;
      return upsertSubject({ subject_code: row.subject_code, visibility: Object.assign({}, result.data.visibility || {}, { answers: true }) }).then(function () { return row; });
    }).catch(function (error) {
      throw new Error('Dokumentet er lagret, men A-besvarelser kunne ikke gjøres synlig: ' + (error.message || error));
    });
  }

  function guessAnswerKind(name) {
    var text = String(name || '').toLowerCase();
    if (/sensor|rettlei/.test(text)) return 'Sensorveiledning';
    if (/modell|besvarelse|løsning|losning|solution|fasit/.test(text)) return 'A-besvarelse';
    if (/oppgave|eksamen|exam/.test(text)) return 'Eksamen';
    return 'A-besvarelse';
  }

  function answerPackageInfo(file) {
    var term = String(file.term || '').toUpperCase().replace(/\s+/g, '').replace(/^([VH])20([0-9]{2})$/, '$1$2');
    var subjectCode = code(file.subject_code);
    return {
      id: file.meta && file.meta.answer_package_id || subjectCode.toLowerCase() + '-' + (term.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'besvarelser'),
      title: file.meta && file.meta.package_title || subjectCode + (term ? ' ' + term : ' · Besvarelser'),
      term: file.term || ''
    };
  }

  function uploadAnswerPackage(input) {
    if (!input || !input.source_file_id) return saveAnswerPackage(input, false);
    var sb = client();
    if (!sb) return Promise.reject(new Error('Ikke tilkoblet'));
    // Read the saved document again: an open editor may contain an old term or
    // package. Appending never edits or replaces any existing document.
    return sb.from('subject_files').select('*').eq('id', input.source_file_id).maybeSingle().then(function (result) {
      if (result.error) throw result.error;
      var source = result.data;
      if (!source || source.kind !== 'answer' || code(source.subject_code) !== code(input.subject_code)) throw new Error('Eksamensbesvarelsen finnes ikke lenger i dette faget. Åpne pakken på nytt.');
      var info = answerPackageInfo(source);
      return saveAnswerPackage(Object.assign({}, input, { subject_code: source.subject_code, term: source.term, title: info.title, package_id: info.id }), true);
    });
  }

  function saveAnswerPackage(input, existingPackage) {
    var entries = input && input.entries || [];
    var kinds = ['Eksamen', 'A-besvarelse', 'Sensorveiledning'];
    if (!entries.length || !input.subject_code || (!existingPackage && !String(input.term || '').trim())) return Promise.reject(new Error('Velg filer og oppgi eksamenstermin.'));
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      if (!entry.file && !entry.drive_id) return Promise.reject(new Error('Filen mangler.'));
      if (entry.file && (!entry.file.size || entry.file.size > 50 * 1024 * 1024)) return Promise.reject(new Error('Hver fil må være mellom 1 byte og 50 MB.'));
      if (entry.resource_kind && kinds.indexOf(entry.resource_kind) === -1) return Promise.reject(new Error('Ugyldig dokumenttype.'));
    }
    var saved = [];
    return entries.reduce(function (chain, entry, index) {
      return chain.then(function () {
        if (input.progressCallback) input.progressCallback({ index: index, total: entries.length, name: entry.name || (entry.file && entry.file.name) });
        return saveNewFile({
          subject_code: input.subject_code, kind: 'answer', term: input.term,
          title: entry.title || entry.name || (entry.file && entry.file.name) || input.title,
          description: input.description || '', grade: entry.resource_kind || guessAnswerKind(entry.name || (entry.file && entry.file.name)),
          file: entry.file || null, drive_id: entry.drive_id,
          storage_bucket: entry.drive_id ? 'google_drive' : undefined,
          sort_order: index, meta: {
            resource_kind: entry.resource_kind || guessAnswerKind(entry.name || (entry.file && entry.file.name)),
            package_title: input.title || '', answer_package_id: input.package_id || ''
          }
        }).then(function (row) { saved.push(row); });
      });
    }, Promise.resolve()).then(function () {
      return showAnswerSection(saved[0]).then(function () { return saved; });
    }).catch(function (error) {
      return Promise.all(saved.map(function (row) { return deleteFile(row).catch(function () { return false; }); })).then(function (removed) {
        if (removed.some(function (result) { return result === false; })) throw new Error((error.message || error) + ' Noen filer ble lagret. Kontroller faget før du prøver igjen.');
        throw error;
      });
    });
  }

  function uploadFile(input) {
    return saveNewFile(input).then(showAnswerSection);
  }

  function saveNewFile(input) {
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

    if (file && (basePayload.external_url || input.drive_id || input.storage_bucket === 'google_drive')) return Promise.reject(new Error('Velg enten en lokal fil eller en Drive-fil.'));

    if (basePayload.external_url) {
      var driveLink = basePayload.external_url.match(/^https:\/\/(?:drive|docs)\.google\.com\/(?:.*\/d\/|.*[?&]id=)([A-Za-z0-9_-]+)/);
      if (!driveLink) return Promise.reject(new Error('Velg en fil fra Google Drive eller last opp filen. Eksterne dokumentlenker er ikke beskyttet.'));
      return importDrive(Object.assign({}, basePayload, { drive_id: driveLink[1], external_url: '' }));
    }

    if (input.storage_bucket === 'google_drive' || input.drive_id) {
      return importDrive(Object.assign({}, basePayload, { drive_id: input.drive_id || input.storage_path }));
    }

    if (kind === 'answer' && !file) return Promise.reject(new Error('Velg en PDF-fil eller en fil fra Google Drive før du publiserer besvarelsen.'));
    if (file && !file.size) return Promise.reject(new Error('Filen er tom. Velg en annen fil.'));
    if (file) basePayload.meta = Object.assign({}, meta, { original_name: file.name });

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
        if (uploadResult && uploadResult.error) throw uploadResult.error;
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
      }).catch(function (error) {
        return sb.storage.from('subject-files').remove([path]).catch(function () {}).then(function () {
          return sb.from('subject_files').delete().eq('id', fileId);
        }).then(function (removed) {
          if (removed && removed.error) throw new Error((error.message || error) + ' Dokumentoppføringen kunne ikke ryddes opp. Kontroller faget før du prøver igjen.');
          throw error;
        });
      });
    });
  }

  function updateFile(fileId, patch) {
    var sb = client();
    if (!sb || !fileId) return Promise.reject(new Error('Fil-id mangler'));
    var payload = Object.assign({}, patch);
    delete payload.id;
    var file = payload.file;
    delete payload.file;
    if (file) {
      if (!file.size) return Promise.reject(new Error('Filen er tom. Velg en annen fil.'));
      if (payload.external_url || payload.storage_bucket === 'google_drive') return Promise.reject(new Error('Velg enten en lokal fil eller en Drive-fil.'));
      return sb.from('subject_files').select().eq('id', fileId).maybeSingle().then(function (result) {
        if (result.error) throw result.error;
        if (!result.data) throw new Error('Dokumentoppføringen ble ikke funnet.');
        var row = result.data;
        var replacementMeta = Object.assign({}, row.meta || {}, payload.meta || {}, { original_name: file.name });
        delete replacementMeta.drive_id;
        delete replacementMeta.drive_name;
        if (replacementMeta.source === 'google_drive') delete replacementMeta.source;
        var path = code(row.subject_code) + '/' + fileId + '-' + Date.now() + '-' + slugify(file.name);
        var ext = (file.name.split('.').pop() || 'bin').toLowerCase().slice(0, 8);
        path += '.' + ext;
        return sb.storage.from('subject-files').upload(path, file, { upsert: false, contentType: file.type || undefined }).then(function (uploaded) {
          if (uploaded.error) throw uploaded.error;
          return updateFile(fileId, Object.assign({}, payload, {
            storage_bucket: 'subject-files', storage_path: path, size_bytes: file.size, mime_type: file.type || null,
            meta: replacementMeta
          }));
        });
      }).then(showAnswerSection);
    }
    if (payload.external_url) return Promise.reject(new Error('Velg en fil fra Google Drive. Eksterne dokumentlenker er ikke beskyttet.'));
    if (payload.storage_bucket === 'google_drive') return importDrive(Object.assign({}, payload, { id: fileId, drive_id: payload.storage_path })).then(showAnswerSection);
    return sb.from('subject_files').update(payload).eq('id', fileId).select().maybeSingle().then(function (result) {
      if (result && result.error) throw result.error;
      var row = result && result.data;
      invalidateSubject(row && row.subject_code);
      return normalizeFile(row);
    });
  }

  function importDrive(payload) {
    var sb = client();
    return sb.auth.getSession().then(function (result) {
      var current = result.data && result.data.session;
      if (!current) throw new Error('Logg inn på nytt for å importere dokumentet.');
      return fetch('https://qnwjhheoekpqqqhevztw.supabase.co/functions/v1/drive-proxy?action=import', {
        method: 'POST', headers: { Authorization: 'Bearer ' + current.access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }).then(function (response) {
      return response.json().then(function (result) {
        if (!response.ok || !result.file) throw new Error(result.error || 'Dokumentet ble ikke importert.');
        invalidateSubject(result.file.subject_code);
        return normalizeFile(result.file);
      });
    });
  }

  function deleteFile(file) {
    if (!file || !file.id) return Promise.reject(new Error('Fil mangler'));
    var sb = client();
    if (!sb) return Promise.reject(new Error('Ikke tilkoblet'));
    var storagePromise = file.storage_path && file.storage_bucket !== 'google_drive'
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

  function signedUrl(file) {
    if (!file) return Promise.resolve(null);
    if (file.id && (file.storage_bucket === 'google_drive' || file.storage_bucket === 'subject-files')) {
      var root = window.AuthGuard && window.AuthGuard.getRootPath ? window.AuthGuard.getRootPath() : '../';
      return Promise.resolve(root.replace(/\/?$/, '/') + 'user/document.html?file=' + encodeURIComponent(file.id));
    }
    return Promise.resolve(null);
  }

  // Compatibility API: legacy browser imports are retired. They could recreate
  // removed templates and overwrite newer Studio edits. Local data stays intact.
  function migrateLegacyIfNeeded() { return Promise.resolve(false); }

  window.SubjectsStudio = {
    listSubjects: listSubjects,
    getSubject: getSubject,
    upsertSubject: upsertSubject,
    createSubject: createSubject,
    deleteSubject: deleteSubject,
    upsertBlock: upsertBlock,
    deleteBlock: deleteBlock,
    reorderBlocks: reorderBlocks,
    reorderFiles: reorderFiles,
    uploadFile: uploadFile,
    uploadAnswerPackage: uploadAnswerPackage,
    answerPackageInfo: answerPackageInfo,
    guessAnswerKind: guessAnswerKind,
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
