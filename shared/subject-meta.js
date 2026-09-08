(function (window) {
  var categories = [
    { id: 'semester1', label: 'Første semester', shortLabel: '1. semester', order: 10 },
    { id: 'semester2', label: 'Andre semester', shortLabel: '2. semester', order: 20 },
    { id: 'semester3', label: 'Tredje semester', shortLabel: '3. semester', order: 30 },
    { id: 'semester4', label: 'Fjerde semester', shortLabel: '4. semester', order: 40 },
    { id: 'semester5', label: 'Femte semester', shortLabel: '5. semester', order: 50 },
    { id: 'semester6', label: 'Sjette semester', shortLabel: '6. semester', order: 60 },
    { id: 'electives', label: 'Valgfag', shortLabel: 'Valgfag', order: 90 },
    { id: 'master', label: 'Masterfag', shortLabel: 'Master', order: 95 }
  ];

  var categoryById = categories.reduce(function (out, category) {
    out[category.id] = category;
    return out;
  }, {});

  function withCategory(subject, categoryId, sortOrder) {
    var category = categoryById[categoryId] || categories[0];
    subject.categoryId = category.id;
    subject.categoryLabel = category.label;
    subject.categoryShortLabel = category.shortLabel;
    subject.categoryOrder = category.order;
    subject.sortOrder = sortOrder;
    return subject;
  }

  var subjects = [
    withCategory({
      id: 'ret14',
      code: 'RET14',
      name: 'Skatterett',
      icon: '⚖️',
      emblem: '../assets/emblems/RET14.png',
      accent: '#2f62ff',
      status: 'active',
      statusText: 'Aktiv',
      progress: 0,
      decks: '15+',
      cards: '1450',
      tools: '4',
      path: '../ret14/',
      flashcards: '../flashcards/?subject=ret14',
      description: 'Skatt, fradrag, aksjer, personinntekt, arv og eksamensanalyse.'
    }, 'electives', 20),
    withCategory({
      id: 'subj_sol1',
      aliases: ['sol1'],
      code: 'SOL1',
      name: 'Organisasjonsatferd',
      icon: '🧠',
      emblem: '../assets/emblems/SOL1.png',
      accent: '#20b97a',
      status: 'active',
      statusText: 'Aktiv',
      progress: 0,
      decks: '13+',
      cards: '438',
      tools: '4',
      path: '../sol1/',
      flashcards: '../flashcards/?subject=subj_sol1',
      description: 'Begreper, teorier, modeller, caseforståelse og teoriskriving.'
    }, 'semester2', 30),
    withCategory({
      id: 'sam2',
      code: 'SAM2',
      name: 'Mikroøkonomi',
      icon: '📈',
      emblem: '../assets/emblems/SAM2.png',
      accent: '#f09828',
      status: 'exam',
      statusText: 'Eksamen',
      progress: 0,
      decks: '24',
      cards: '66',
      tools: '4',
      path: '../sam2/',
      flashcards: '../sam2/oppgaver-klikkbar/',
      description: 'Memoar, oppgaveprioritering, eksamensradar, figurer og modellvalg.'
    }, 'semester2', 20),
    withCategory({
      id: 'sam3',
      code: 'SAM3',
      name: 'Makroøkonomi',
      icon: '🌍',
      emblem: '../assets/emblems/SAM3.png',
      accent: '#ef4444',
      status: 'active',
      statusText: 'Aktiv',
      progress: 0,
      decks: '12+',
      cards: '—',
      tools: '6',
      path: '../sam3/',
      flashcards: '../sam3/flashcards.html',
      description: 'Makromodeller, formler, quiz, eksamensradar og mock-eksamen.'
    }, 'semester4', 10),
    withCategory({
      id: 'met2',
      code: 'MET2',
      name: 'Metode',
      icon: 'Σ',
      emblem: '../assets/emblems/MET2.png',
      accent: '#7c3aed',
      status: 'active',
      statusText: 'MVP',
      progress: 28,
      decks: '5',
      cards: '5+',
      tools: '3',
      path: '../met2/',
      flashcards: '../flashcards/?subject=met2',
      description: 'Metode, statistikk, hypotesetesting, konfidensintervall og regresjon.'
    }, 'semester2', 10),
    withCategory({
      id: 'mat10',
      code: 'MAT10',
      name: 'Matematikk',
      icon: '∫',
      emblem: '../assets/emblems/MAT10.png',
      accent: '#0891b2',
      status: 'active',
      statusText: 'MVP',
      progress: 34,
      decks: '6',
      cards: '4+',
      tools: '3',
      path: '../mat10/',
      flashcards: '../flashcards/?subject=mat10',
      description: 'Analyse, lineær algebra, formler, regneøkter og eksamensdrill.'
    }, 'electives', 10),
    withCategory({
      id: 'sam1a',
      code: 'SAM1A',
      name: 'Mikroøkonomi intro',
      icon: '↗',
      emblem: '../assets/emblems/SAM1A.png',
      accent: '#f09828',
      status: 'active',
      statusText: 'Ny',
      progress: 18,
      decks: '3',
      cards: '4+',
      tools: '3',
      path: '../sam1a/',
      flashcards: '../flashcards/?subject=sam1a',
      description: 'Første semester: læringsmål, markedslikevekt, elastisitet og velferdsanalyse.'
    }, 'semester1', 30),
    withCategory({
      id: 'met1',
      code: 'MET1',
      name: 'Matematikk for økonomer',
      icon: '%',
      emblem: '../assets/emblems/MET1.png',
      accent: '#06b6d4',
      status: 'active',
      statusText: 'Ny',
      progress: 22,
      decks: '3',
      cards: '4+',
      tools: '3',
      path: '../met1/',
      flashcards: '../flashcards/?subject=met1',
      description: 'Første semester: rente, nåverdi, annuitet, rekker og formelvalg.'
    }, 'semester1', 20),
    withCategory({
      id: 'kom1',
      code: 'KOM1',
      name: 'Kommunikasjon',
      icon: '✎',
      emblem: '../assets/emblems/KOM1.png',
      accent: '#e8bc68',
      status: 'active',
      statusText: 'Ny',
      progress: 20,
      decks: '3',
      cards: '4+',
      tools: '3',
      path: '../kom1/',
      flashcards: '../flashcards/?subject=kom1',
      description: 'Første semester: rapportstruktur, presentasjon, akademisk språk og refleksjon.'
    }, 'semester1', 50),
    withCategory({
      id: 'ret1a',
      code: 'RET1A',
      name: 'Juridiske emner',
      icon: '§',
      emblem: '../assets/emblems/RET1A.png',
      accent: '#3b82f6',
      status: 'exam',
      statusText: 'Eksamen',
      progress: 24,
      decks: '4',
      cards: '4+',
      tools: '3',
      path: '../ret1a/',
      flashcards: '../flashcards/?subject=ret1a',
      description: 'Første semester: avtalerett, selskapsrett, pengekrav og juridisk metode.'
    }, 'semester1', 10),
    withCategory({
      id: 'bed1',
      code: 'BED1',
      name: 'Bedriftsøkonomi',
      icon: '◆',
      emblem: '../assets/emblems/BED1.png',
      accent: '#20b97a',
      status: 'exam',
      statusText: 'Eksamen',
      progress: 26,
      decks: '4',
      cards: '4+',
      tools: '3',
      path: '../bed1/',
      flashcards: '../flashcards/?subject=bed1',
      description: 'Første semester: kalkyler, resultat, investering, budsjettering og eksamenstrening.'
    }, 'semester1', 40)
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function learningContent() {
    return window.HaugnesLearningContent || null;
  }

  function code(value) {
    return String(value || '').toUpperCase().replace(/[\s-]+/g, '');
  }

  function selectedCodes() {
    try {
      var raw = window.localStorage.getItem('hf_enabled_subjects');
      var parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) return parsed.map(code);
    } catch (e) {}
    return ['RET14', 'SOL1', 'SAM2', 'SAM3', 'MET2', 'MAT10', 'SAM1A', 'MET1', 'KOM1', 'RET1A', 'BED1'];
  }

  function decorateSubject(subject) {
    var learning = learningContent();
    if (!learning || typeof learning.qualityFor !== 'function' || typeof learning.toolsFor !== 'function') return subject;
    var quality = learning.qualityFor(subject.id || subject.code);
    if (!quality) return subject;
    var tools = learning.toolsFor(subject.id || subject.code) || [];
    subject.qualityStatus = quality.status;
    subject.qualityTarget = quality.target;
    subject.decks = String(quality.deckCount || subject.decks);
    subject.cards = String(quality.cardCount || subject.cards);
    subject.tools = String(tools.length || subject.tools);
    if (quality.status === 'exam_ready') {
      subject.status = 'active';
      subject.statusText = 'Eksamensklar';
      subject.progress = 100;
    }
    return subject;
  }

  var CUSTOM_SUBJECTS_KEY = 'hf_custom_subjects_v1';
  var DB_CONTENT_KEY = 'custom_subjects';

  function getSupabaseClient() {
    if (window.HaugnesAuth && typeof window.HaugnesAuth.getClient === 'function') {
      var client = window.HaugnesAuth.getClient();
      if (client) return client;
    }
    if (window.supabase && typeof window.supabase.createClient === 'function' && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
      return window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    }
    return null;
  }

  function loadCustomSubjectsLocal() {
    try {
      var raw = window.localStorage.getItem(CUSTOM_SUBJECTS_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveCustomSubjectsLocal(list) {
    try {
      window.localStorage.setItem(CUSTOM_SUBJECTS_KEY, JSON.stringify(list || []));
    } catch (e) {}
  }

  function allSubjectList() {
    var custom = loadCustomSubjectsLocal();
    var map = {};
    var list = [];
    subjects.forEach(function (s) {
      map[code(s.code)] = true;
      list.push(s);
    });
    custom.forEach(function (c) {
      var cCode = code(c.code);
      if (!map[cCode]) {
        map[cCode] = true;
        var decorated = withCategory(Object.assign({}, c), c.categoryId || 'electives', c.sortOrder || 99);
        list.push(decorated);
      } else {
        var idx = list.findIndex(function (item) { return code(item.code) === cCode; });
        if (idx !== -1) {
          list[idx] = withCategory(Object.assign({}, list[idx], c), c.categoryId || list[idx].categoryId || 'electives', c.sortOrder || list[idx].sortOrder || 99);
        }
      }
    });
    return list;
  }

  function saveCustomSubject(data) {
    if (!data || !data.code || !data.name) return Promise.reject(new Error('Fagkode og fagnavn er påkrevd.'));
    var cleanCode = String(data.code).trim().toUpperCase();
    var cleanId = (data.id ? String(data.id) : cleanCode.toLowerCase()).trim().toLowerCase();
    var cleanName = String(data.name).trim();
    var categoryId = data.categoryId || 'electives';
    var accent = data.accent || '#2563eb';
    var iconStr = data.icon || '📚';
    var path = data.path || ('../subject/?id=' + cleanId);
    var flashcards = data.flashcards || ('../flashcards/?subject=' + cleanId);
    var description = data.description || ('Fagside og læringsløp for ' + cleanName + '.');
    var kicker = data.kicker || (cleanName + ' · ' + cleanCode);

    var subjectItem = Object.assign({}, data, {
      id: cleanId,
      code: cleanCode,
      name: cleanName,
      categoryId: categoryId,
      accent: accent,
      icon: iconStr,
      emblem: data.emblem || '../assets/Flashcardslogo.png',
      path: path,
      flashcards: flashcards,
      status: data.status || 'active',
      statusText: data.statusText || 'Aktiv',
      progress: data.progress || 0,
      decks: data.decks || '0',
      cards: data.cards || '0',
      tools: data.tools || '5',
      kicker: kicker,
      description: description,
      updated_at: new Date().toISOString()
    });

    var custom = loadCustomSubjectsLocal();
    var existingIndex = custom.findIndex(function (s) { return code(s.code) === cleanCode || s.id === cleanId; });
    if (existingIndex !== -1) {
      custom[existingIndex] = Object.assign({}, custom[existingIndex], subjectItem);
    } else {
      custom.push(subjectItem);
    }
    saveCustomSubjectsLocal(custom);

    try {
      var currentSelected = selectedCodes();
      if (currentSelected.indexOf(cleanCode) === -1) {
        currentSelected.push(cleanCode);
        window.localStorage.setItem(SELECTED_STORAGE_KEY, JSON.stringify(currentSelected));
      }
    } catch (e) {}

    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('haugnes:subjects-updated', { detail: subjectItem }));
      window.dispatchEvent(new CustomEvent('haugnes:subject-access-changed'));
    }

    var sb = getSupabaseClient();
    if (!sb) return Promise.resolve(subjectItem);

    var session = window.AuthGuard && typeof window.AuthGuard.getSession === 'function' ? window.AuthGuard.getSession() : null;
    return Promise.resolve(sb.from('admin_content').upsert({
      key: DB_CONTENT_KEY,
      content: { subjects: custom },
      updated_by: session && session.user ? session.user.id : null,
      updated_at: new Date().toISOString()
    })).then(function (result) {
      if (result && result.error) console.warn('[subject-meta] Cloud persist warning:', result.error);
      return subjectItem;
    }).catch(function (err) {
      console.warn('[subject-meta] Cloud persist error:', err);
      return subjectItem;
    });
  }

  function deleteCustomSubject(id) {
    var needle = String(id || '').trim().toLowerCase();
    var custom = loadCustomSubjectsLocal();
    var filtered = custom.filter(function (s) {
      return s.id.toLowerCase() !== needle && code(s.code) !== needle.toUpperCase();
    });
    saveCustomSubjectsLocal(filtered);

    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('haugnes:subjects-updated', { detail: { id: needle, deleted: true } }));
      window.dispatchEvent(new CustomEvent('haugnes:subject-access-changed'));
    }

    var sb = getSupabaseClient();
    if (!sb) return Promise.resolve(true);

    var session = window.AuthGuard && typeof window.AuthGuard.getSession === 'function' ? window.AuthGuard.getSession() : null;
    return Promise.resolve(sb.from('admin_content').upsert({
      key: DB_CONTENT_KEY,
      content: { subjects: filtered },
      updated_by: session && session.user ? session.user.id : null,
      updated_at: new Date().toISOString()
    })).then(function () { return true; }).catch(function () { return true; });
  }

  function syncCustomSubjects() {
    var sb = getSupabaseClient();
    if (!sb) return Promise.resolve(loadCustomSubjectsLocal());
    return Promise.resolve(sb.from('admin_content').select('content').eq('key', DB_CONTENT_KEY).maybeSingle()).then(function (result) {
      var cloud = result && result.data && result.data.content && Array.isArray(result.data.content.subjects) ? result.data.content.subjects : null;
      if (cloud) {
        var local = loadCustomSubjectsLocal();
        var merged = cloud.slice();
        var map = {};
        cloud.forEach(function (s) { map[code(s.code)] = true; });
        local.forEach(function (l) {
          if (!map[code(l.code)]) merged.push(l);
        });
        saveCustomSubjectsLocal(merged);
        if (typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(new CustomEvent('haugnes:subjects-updated'));
        }
      }
      return loadCustomSubjectsLocal();
    }).catch(function () {
      return loadCustomSubjectsLocal();
    });
  }

  function decorateSubjects(list) {
    return list.map(decorateSubject);
  }

  function getCatalog() {
    return decorateSubjects(clone(allSubjectList())).sort(sortSubjects);
  }

  function getAll() {
    var selected = selectedCodes();
    return decorateSubjects(clone(allSubjectList().filter(function (subject) {
      return selected.indexOf(code(subject.code)) !== -1;
    }))).sort(sortSubjects);
  }

  function sortSubjects(a, b) {
    return (a.categoryOrder - b.categoryOrder) || (a.sortOrder - b.sortOrder) || String(a.code).localeCompare(String(b.code));
  }

  function getCategories() {
    return clone(categories);
  }

  function groupByCategory(list) {
    var subjectsToGroup = (list || getAll()).slice().sort(sortSubjects);
    return getCategories().map(function (category) {
      return {
        id: category.id,
        label: category.label,
        shortLabel: category.shortLabel,
        subjects: subjectsToGroup.filter(function (subject) { return subject.categoryId === category.id; })
      };
    }).filter(function (group) { return group.subjects.length; });
  }

  function findById(id) {
    var needle = String(id || '').toLowerCase();
    var subject = allSubjectList().find(function (s) {
      return s.id.toLowerCase() === needle || s.code.toLowerCase() === needle || (s.aliases || []).some(function (alias) { return alias.toLowerCase() === needle; });
    });
    return subject ? decorateSubject(clone(subject)) : null;
  }

  function getFlashcardSubjectId(id) {
    var subject = findById(id);
    return subject ? subject.id : id;
  }

  // The embedded list keeps the public site usable without a network request.
  // On signed-in pages it is extended from the admin-managed catalogue so a new
  // course appears in "Mine fag" without a static-site deployment.
  function applyRemoteCatalog(rows) {
    var byCode = {};
    subjects.forEach(function (subject) { byCode[code(subject.code)] = subject; });
    (rows || []).forEach(function (row) {
      var subjectCode = code(row.code);
      if (!subjectCode) return;
      var previous = byCode[subjectCode] || {};
      var categoryId = categoryById[row.category_id] ? row.category_id : (previous.categoryId || 'electives');
      byCode[subjectCode] = withCategory({
        id: previous.id || subjectCode.toLowerCase(),
        aliases: previous.aliases || [],
        code: subjectCode,
        name: row.name || previous.name || subjectCode,
        icon: row.icon || previous.icon || '✦',
        emblem: row.emblem || previous.emblem || '',
        accent: row.accent || previous.accent || '#2f62ff',
        status: row.status || previous.status || 'active',
        statusText: previous.statusText || 'Aktiv',
        progress: previous.progress || 0,
        decks: previous.decks || '—',
        cards: previous.cards || '—',
        tools: previous.tools || '3',
        path: row.path || previous.path || ('../flashcards/?subject=' + encodeURIComponent(subjectCode.toLowerCase())),
        flashcards: row.flashcards_path || previous.flashcards || ('../flashcards/?subject=' + encodeURIComponent(subjectCode.toLowerCase())),
        description: row.description || previous.description || 'Fagressurser, flashcards og eksamensforberedelser.'
      }, categoryId, Number(row.sort_order || previous.sortOrder || 999));
    });
    subjects = Object.keys(byCode).map(function (key) { return byCode[key]; });
    try { window.dispatchEvent(new CustomEvent('haugnes:subject-catalog-changed')); } catch (e) {}
  }

  function loadRemoteCatalog(attempt) {
    if (!/\/user\//.test(window.location.pathname)) return;
    var client = window.AuthGuard && typeof window.AuthGuard.getClient === 'function' ? window.AuthGuard.getClient() : null;
    if (!client) {
      if ((attempt || 0) < 30) window.setTimeout(function () { loadRemoteCatalog((attempt || 0) + 1); }, 150);
      return;
    }
    client.from('app_subjects').select('code,name,description,category_id,accent,icon,emblem,path,flashcards_path,status,published,sort_order').eq('published', true).order('sort_order').then(function (result) {
      if (!result || result.error || !result.data) return;
      applyRemoteCatalog(result.data);
    });
  }

  window.HaugnesSubjects = {
    getAll: getAll,
    getCatalog: getCatalog,
    getAllOriginal: getCatalog,
    getCategories: getCategories,
    groupByCategory: groupByCategory,
    findById: findById,
    getFlashcardSubjectId: getFlashcardSubjectId,
    getCustomSubjects: loadCustomSubjectsLocal,
    saveCustomSubject: saveCustomSubject,
    deleteCustomSubject: deleteCustomSubject,
    syncCustomSubjects: syncCustomSubjects
  };

  syncCustomSubjects();

  function loadRatingAdminEditor() {
    if (!/\/user\/subjects\.html$/.test(window.location.pathname)) return;
    if (document.getElementById('haugnes-rating-admin-js')) return;
    var current = document.currentScript || Array.prototype.slice.call(document.scripts).filter(function (script) {
      return /shared\/subject-meta\.js(?:\?|$)/.test(script.src || '');
    }).pop();
    var script = document.createElement('script');
    script.id = 'haugnes-rating-admin-js';
    script.defer = true;
    script.src = current && current.src ? new URL('haugnes-rating-admin.js', current.src).href : '../shared/haugnes-rating-admin.js';
    document.head.appendChild(script);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadRatingAdminEditor);
  else loadRatingAdminEditor();
  window.setTimeout(function () { loadRemoteCatalog(0); }, 0);
})(window);
